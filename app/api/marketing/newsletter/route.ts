
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import arcjet, { slidingWindow } from "@/lib/arcjet";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  captureMarketingContact,
  normalizeMarketingEmail,
} from "@/lib/marketing/contact-service";
import {
  createMarketingUnsubscribeToken,
  hashMarketingUnsubscribeToken,
} from "@/lib/marketing/unsubscribe-token";

const CONSENT_TEXT_VERSION = "newsletter-consent-v1";

const newsletterRateLimit = arcjet.withRule(
  slidingWindow({
    mode: "LIVE",
    interval: "2m",
    max: 5,
  }),
);

export async function POST(request: NextRequest) {
  try {
    const fingerprint =
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "newsletter-unknown";

    const decision = await newsletterRateLimit.protect(request, {
      fingerprint,
    });

    if (decision.isDenied()) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body.email !== "string" ||
      body.email.length > 254 ||
      body.marketingConsent !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid email address and agree to receive marketing emails.",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = normalizeMarketingEmail(body.email);

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    let userId: string | null = null;
    let contactName: string | null = null;

    if (session?.user) {
      // Signed-in users must subscribe with their account email.
      if (
        normalizeMarketingEmail(session.user.email) !== normalizedEmail
      ) {
        return NextResponse.json(
          {
            error:
              "When signed in, use the email address associated with your account.",
          },
          { status: 400 },
        );
      }

      // Account eligibility no longer depends on SocialProfile or age.
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          emailVerified: true,
          status: true,
        },
      });

      if (!user || user.status !== "Active" || !user.emailVerified) {
        return NextResponse.json(
          {
            error:
              "Newsletter subscriptions through an account require an active account and verified email address.",
          },
          { status: 403 },
        );
      }

      userId = user.id;
      contactName = user.name;
    } else {
      // A guest cannot subscribe using an email already linked to an account.
      const existingUser = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            error:
              "This email is associated with a Justdy account. Sign in to subscribe.",
          },
          { status: 403 },
        );
      }
    }

    // Capture the contact independently of marketing consent.
    const captured = await captureMarketingContact({
      email: normalizedEmail,
      name: contactName,
      sourceType: "NEWSLETTER",
      sourceRecordId: randomUUID(),
      sourceRole: "NEWSLETTER_SUBSCRIBER",
      userId,
    });

    const outcome = await prisma.$transaction(async (tx) => {
      const contact = await tx.marketingContact.findUnique({
        where: { id: captured.contactId },
        select: {
          id: true,
          subscriptionStatus: true,
        },
      });

      if (!contact) return "missing" as const;

      // A suppressed address cannot resubscribe through this endpoint.
      if (contact.subscriptionStatus === "SUPPRESSED") {
        return "suppressed" as const;
      }

      // Do not create duplicate consent events or rotate an existing token.
      if (contact.subscriptionStatus === "SUBSCRIBED") {
        return "already" as const;
      }

      const now = new Date();

      const token = createMarketingUnsubscribeToken(contact.id, now);
      const tokenHash = hashMarketingUnsubscribeToken(token);

      // Conditional update protects against concurrent submissions.
      const updated = await tx.marketingContact.updateMany({
        where: {
          id: contact.id,
          subscriptionStatus: {
            in: ["NOT_SUBSCRIBED", "UNSUBSCRIBED"],
          },
        },
        data: {
          subscriptionStatus: "SUBSCRIBED",
          subscribedAt: now,
          unsubscribedAt: null,
          unsubscribeTokenHash: tokenHash,
        },
      });

      if (updated.count !== 1) {
        const current = await tx.marketingContact.findUnique({
          where: { id: contact.id },
          select: { subscriptionStatus: true },
        });

        if (current?.subscriptionStatus === "SUBSCRIBED") {
          return "already" as const;
        }

        if (current?.subscriptionStatus === "SUPPRESSED") {
          return "suppressed" as const;
        }

        return "missing" as const;
      }

      // Record explicit marketing consent without age-related metadata.
      await tx.marketingConsentEvent.create({
        data: {
          contactId: contact.id,
          action: "GRANTED",
          authorizationType: "SELF",
          channel: "EMAIL",
          method: "NEWSLETTER_FOOTER_FORM",
          consentTextVersion: CONSENT_TEXT_VERSION,
          consentGivenByEmail: normalizedEmail,
          consentGivenByUserId: userId,
          evidenceMetadata: {
            source: "footer_newsletter",
            marketingConsent: true,
          },
          occurredAt: now,
        },
      });

      return "subscribed" as const;
    });

    if (outcome === "suppressed") {
      return NextResponse.json(
        {
          error:
            "This email address cannot currently receive marketing emails.",
        },
        { status: 409 },
      );
    }

    if (outcome === "missing") {
      return NextResponse.json(
        { error: "Unable to complete your subscription." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        outcome === "already"
          ? "This email address is already subscribed to Justdy updates."
          : "Thank you! You are now subscribed to Justdy updates.",
    });
  } catch (error) {
    console.error("[Newsletter subscription]", error);

    if (
      error instanceof Error &&
      error.message === "A valid email address is required."
    ) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          "We could not complete your subscription. Please try again later.",
      },
      { status: 500 },
    );
  }
}
