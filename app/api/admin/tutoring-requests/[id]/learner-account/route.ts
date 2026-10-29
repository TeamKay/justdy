import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Creates or links the learner account after the tutoring plan is agreed.
 * This endpoint never creates a Stripe Checkout session or sends a payment link.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        status: true,
        emailVerified: true,
        teachingProfile: { select: { verificationStatus: true } },
      },
    });

    const role = String(actor?.role ?? "").toUpperCase();
    const allowed =
      Boolean(actor?.emailVerified) &&
      (role === "ADMIN" ||
        (role === "TUTOR" &&
          actor?.status === "Active" &&
          actor.teachingProfile?.verificationStatus === "Verified"));

    if (!actor || !allowed) {
      return NextResponse.json(
        { error: "Administrator or verified active tutor access required." },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const requestRow = await prisma.tutoringOnboardingRequest.findUnique({
      where: { id },
      select: {
        id: true,
        studentName: true,
        gradeLevel: true,
        learnerEmail: true,
        planAgreedAt: true,
        planAgreedById: true,
        status: true,
        paymentStatus: true,
        assignedTutorId: true,
        learnerUserId: true,
        learnerAccountSetupSentAt: true,
      },
    });

    if (!requestRow) {
      return NextResponse.json(
        { error: "Tutoring request not found." },
        { status: 404 },
      );
    }

    if (role !== "ADMIN" && requestRow.assignedTutorId !== actor.id) {
      return NextResponse.json(
        { error: "You can only manage requests assigned to you." },
        { status: 403 },
      );
    }

    if (
      !requestRow.planAgreedAt ||
      !requestRow.planAgreedById ||
      !["plan_agreed", "payment_received"].includes(requestRow.status)
    ) {
      return NextResponse.json(
        {
          error:
            "The tutoring plan must be agreed before learner account setup.",
        },
        { status: 409 },
      );
    }

    if (requestRow.paymentStatus !== "not_requested") {
      return NextResponse.json(
        { error: "Account setup must happen before any payment link is sent." },
        { status: 409 },
      );
    }

    if (!requestRow.learnerEmail?.trim()) {
      return NextResponse.json(
        {
          error:
            "Collect the learner's own email on the onboarding request before creating their account. The guardian contact email must not be reused.",
        },
        { status: 409 },
      );
    }

    const email = requestRow.learnerEmail.trim().toLowerCase();
    let learner = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        role: true,
      },
    });

    const existedBeforeRequest = Boolean(learner);
    let created = false;

    if (!learner) {
      // The random password is never disclosed. The learner sets their own
      // password through the secure, expiring Better Auth reset token.
      const randomPassword = `${randomBytes(48).toString("base64url")}Aa1!`;

      try {
        await auth.api.signUpEmail({
          body: {
            name: requestRow.studentName.trim() || "Learner",
            email,
            password: randomPassword,
          },
        });
      } catch (error) {
        // Handle a uniqueness race by reading the account that now owns email.
        learner = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            role: true,
          },
        });

        if (!learner) {
          console.error("Learner Better Auth sign-up failed", {
            requestId: id,
            error,
          });
          return NextResponse.json(
            {
              error:
                "Could not start learner account setup. Check auth email configuration and try again.",
            },
            { status: 502 },
          );
        }
      }

      learner =
        learner ??
        (await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            role: true,
          },
        }));
      created = Boolean(learner);
    }

    if (!learner) {
      return NextResponse.json(
        { error: "Learner account was not created." },
        { status: 500 },
      );
    }

    if (String(learner.role).toUpperCase() !== "LEARNER") {
      return NextResponse.json(
        {
          error:
            "The learner email belongs to a non-learner account. Resolve this manually before linking.",
        },
        { status: 409 },
      );
    }

    if (requestRow.learnerUserId && requestRow.learnerUserId !== learner.id) {
      return NextResponse.json(
        {
          error:
            "This tutoring request is already linked to a different learner account. Resolve the account link manually before continuing.",
        },
        { status: 409 },
      );
    }

    // An unrelated, pre-existing unverified account must not be linked.
    // Retry is allowed only if this request already owns the account link.
    const retryingThisRequest = requestRow.learnerUserId === learner.id;

    if (
      existedBeforeRequest &&
      !learner.emailVerified &&
      !retryingThisRequest
    ) {
      return NextResponse.json(
        {
          error:
            "An unverified account already uses this email. Ask the learner to complete Justdy's existing verification flow before linking.",
        },
        { status: 409 },
      );
    }

    await prisma.studentProfile.upsert({
      where: { userId: learner.id },
      create: { userId: learner.id, gradeLevel: requestRow.gradeLevel },
      update: {},
    });

    await prisma.tutoringOnboardingRequest.update({
      where: { id },
      data: { learnerUserId: learner.id },
    });

    const needsSetupEmail = !learner.emailVerified;

    if (needsSetupEmail) {
      const appUrl = (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.BETTER_AUTH_URL ||
        process.env.APP_URL
      )?.replace(/\/$/, "");

      if (!appUrl) {
        return NextResponse.json(
          { error: "The application URL is not configured." },
          { status: 500 },
        );
      }

      try {
        // Generate the verification link first. The updated auth callback
        // stores it instead of sending a separate verification email.
        await auth.api.sendVerificationEmail({
          body: {
            email,
            callbackURL:
              `${appUrl}/learner/verify-email` +
              `?learnerSetup=true&requestId=${encodeURIComponent(id)}`,
          },
        });

        // This callback will retrieve the stored verification URL and
        // send the single combined tutoring setup email.
        await auth.api.requestPasswordReset({
          body: {
            email,
            redirectTo:
              `${appUrl}/reset-password` +
              `?learnerSetup=true&requestId=${encodeURIComponent(id)}`,
          },
        });
      } catch (error) {
        console.error("Learner setup email request failed", {
          requestId: id,
          error,
        });

        return NextResponse.json(
          {
            error:
              "Learner account setup could not be completed. Retry setup before requesting payment.",
          },
          { status: 502 },
        );
      }
    }

    await prisma.tutoringOnboardingRequest.update({
      where: { id },
      data: { learnerAccountSetupSentAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      learnerEmail: email,
      created,
      setupEmailRequested: needsSetupEmail,
      message: needsSetupEmail
        ? "Learner account is ready for setup. A combined password setup and email verification message was requested. No payment link has been sent."
        : "Existing verified learner account linked. No payment link has been sent.",
    });
  } catch (error) {
    console.error("[tutoring learner account setup]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create or link the learner account.",
      },
      { status: 500 },
    );
  }
}
