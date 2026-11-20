
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { hashMarketingUnsubscribeToken } from "@/lib/marketing/unsubscribe-token";

export const dynamic = "force-dynamic";

function htmlResponse(html: string, status = 200) {
  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function page(title: string, message: string, token?: string) {
  const form = token
    ? `
      <form method="POST" action="/api/marketing/unsubscribe?token=${token}">
        <input type="hidden" name="confirm" value="unsubscribe" />
        <button type="submit">Unsubscribe</button>
      </form>
    `
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="referrer" content="no-referrer" />
  <title>${title} | Justdy</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: #f8fafc;
      color: #292524;
      font-family: Arial, sans-serif;
    }
    main {
      width: 100%;
      max-width: 460px;
      padding: 36px;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      background: white;
      text-align: center;
      box-shadow: 0 8px 30px rgba(0,0,0,.05);
    }
    h1 { font-size: 24px; margin: 0 0 14px; }
    p { color: #57534e; line-height: 1.6; }
    button {
      margin-top: 18px;
      padding: 12px 22px;
      border: 0;
      border-radius: 8px;
      background: #3f3830;
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: #0284c7; }
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <p>${message}</p>
    ${form}
  </main>
</body>
</html>`;
}

function validToken(token: string | null): token is string {
  return !!token && /^[a-f0-9]{64}$/i.test(token);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!validToken(token)) {
    return htmlResponse(
      page(
        "Invalid unsubscribe link",
        "This unsubscribe link is invalid or incomplete.",
      ),
      400,
    );
  }

  try {
    const contact = await prisma.marketingContact.findUnique({
      where: {
        unsubscribeTokenHash: hashMarketingUnsubscribeToken(token),
      },
      select: {
        subscriptionStatus: true,
      },
    });

    if (!contact) {
      return htmlResponse(
        page(
          "Invalid unsubscribe link",
          "This link may have expired or may no longer be valid.",
        ),
        404,
      );
    }

    if (contact.subscriptionStatus === "UNSUBSCRIBED") {
      return htmlResponse(
        page(
          "Already unsubscribed",
          "This email address is already unsubscribed from Justdy marketing emails.",
        ),
      );
    }

    if (contact.subscriptionStatus === "SUPPRESSED") {
      return htmlResponse(
        page(
          "Email preferences updated",
          "This email address is not eligible to receive Justdy marketing emails.",
        ),
      );
    }

    if (contact.subscriptionStatus !== "SUBSCRIBED") {
      return htmlResponse(
        page(
          "Unsubscribe unavailable",
          "This email address is not currently subscribed.",
        ),
      );
    }

    return htmlResponse(
      page(
        "Unsubscribe from Justdy emails?",
        "If you no longer want to receive Justdy newsletters and promotional emails, confirm below. This will not affect essential account or tutoring service emails.",
        token,
      ),
    );
  } catch (error) {
    console.error("[Newsletter unsubscribe page]", error);

    return htmlResponse(
      page(
        "Something went wrong",
        "We could not load your email preferences. Please try again later.",
      ),
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!validToken(token)) {
    return NextResponse.json(
      { error: "Invalid unsubscribe link." },
      { status: 400 },
    );
  }

  try {
    const form = await request.formData().catch(() => null);

    if (!form) {
      return NextResponse.json(
        { error: "Invalid unsubscribe request." },
        { status: 400 },
      );
    }

    const isOneClickRequest =
      form.get("List-Unsubscribe") === "One-Click";

    const isConfirmedBrowserRequest =
      form.get("confirm") === "unsubscribe";

    if (!isOneClickRequest && !isConfirmedBrowserRequest) {
      return NextResponse.json(
        { error: "Unsubscribe confirmation is required." },
        { status: 400 },
      );
    }

    const tokenHash = hashMarketingUnsubscribeToken(token);

    const outcome = await prisma.$transaction(async (tx) => {
      const contact = await tx.marketingContact.findUnique({
        where: { unsubscribeTokenHash: tokenHash },
        select: {
          id: true,
          normalizedEmail: true,
          subscriptionStatus: true,
        },
      });

      if (!contact) return "invalid" as const;
      if (contact.subscriptionStatus === "SUPPRESSED") {
        return "suppressed" as const;
      }
      if (contact.subscriptionStatus === "UNSUBSCRIBED") {
        return "already" as const;
      }
      if (contact.subscriptionStatus !== "SUBSCRIBED") {
        return "invalid" as const;
      }

      const now = new Date();

      const updated = await tx.marketingContact.updateMany({
        where: {
          id: contact.id,
          unsubscribeTokenHash: tokenHash,
          subscriptionStatus: "SUBSCRIBED",
        },
        data: {
          subscriptionStatus: "UNSUBSCRIBED",
          unsubscribedAt: now,
        },
      });

      if (updated.count !== 1) {
        const current = await tx.marketingContact.findUnique({
          where: { id: contact.id },
          select: { subscriptionStatus: true },
        });

        if (current?.subscriptionStatus === "UNSUBSCRIBED") {
          return "already" as const;
        }

        if (current?.subscriptionStatus === "SUPPRESSED") {
          return "suppressed" as const;
        }

        return "invalid" as const;
      }

      await tx.marketingConsentEvent.create({
        data: {
          contactId: contact.id,
          action: "WITHDRAWN",
          authorizationType: "SELF",
          channel: "EMAIL",
          method: isOneClickRequest
            ? "EMAIL_ONE_CLICK_UNSUBSCRIBE"
            : "UNSUBSCRIBE_CONFIRMATION_PAGE",
          consentGivenByEmail: contact.normalizedEmail,
          evidenceMetadata: {
            source: "marketing_unsubscribe_endpoint",
            oneClick: isOneClickRequest,
          },
          occurredAt: now,
        },
      });

      return "unsubscribed" as const;
    });

    if (outcome === "invalid") {
      return NextResponse.json(
        { error: "This unsubscribe link is invalid or expired." },
        { status: 404 },
      );
    }

    if (outcome === "suppressed") {
      return htmlResponse(
        page(
          "Email preferences updated",
          "This email address is not eligible to receive Justdy marketing emails.",
        ),
      );
    }

    return htmlResponse(
      page(
        outcome === "already"
          ? "Already unsubscribed"
          : "You have been unsubscribed",
        "You will no longer receive Justdy newsletters or promotional emails. Essential account and tutoring service emails are not affected.",
      ),
    );
  } catch (error) {
    console.error("[Newsletter unsubscribe]", error);

    return NextResponse.json(
      { error: "Unable to process your unsubscribe request." },
      { status: 500 },
    );
  }
}
