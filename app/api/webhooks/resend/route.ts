
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { normalizeMarketingEmail } from "@/lib/marketing/contact-service";
import { resend } from "@/lib/resend";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ResendWebhookEvent = ReturnType<typeof resend.webhooks.verify>;

type SupportedEmailEvent = Extract<
  ResendWebhookEvent,
  {
    type:
      | "email.delivered"
      | "email.delivery_delayed"
      | "email.bounced"
      | "email.complained";
  }
>;

type CampaignRecipientMatch = {
  id: string;
  emailSnapshot: string;
};

function isSupportedEmailEvent(
  event: ResendWebhookEvent,
): event is SupportedEmailEvent {
  return (
    event.type === "email.delivered" ||
    event.type === "email.delivery_delayed" ||
    event.type === "email.bounced" ||
    event.type === "email.complained"
  );
}

function isPermanentBounce(event: SupportedEmailEvent): boolean {
  return (
    event.type === "email.bounced" &&
    event.data.bounce.type.toLowerCase() === "permanent"
  );
}

function getMarketingRecipientTag(
  event: SupportedEmailEvent,
): string | null {
  const value = event.data.tags?.marketing_recipient_id;

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

async function findCampaignRecipient(
  tx: Pick<typeof prisma, "marketingCampaignRecipient">,
  event: SupportedEmailEvent,
  normalizedEmail: string,
): Promise<CampaignRecipientMatch | null> {
  const taggedRecipientId = getMarketingRecipientTag(event);

  // Prefer the explicit recipient tag. When a tag exists but is invalid
  // or does not match the recipient email, do not fall back to message ID.
  const recipient = taggedRecipientId
    ? await tx.marketingCampaignRecipient.findUnique({
        where: {
          id: taggedRecipientId,
        },
        select: {
          id: true,
          emailSnapshot: true,
        },
      })
    : await tx.marketingCampaignRecipient.findUnique({
        where: {
          resendMessageId: event.data.email_id,
        },
        select: {
          id: true,
          emailSnapshot: true,
        },
      });

  if (!recipient) {
    return null;
  }

  let snapshotEmail: string;

  try {
    snapshotEmail = normalizeMarketingEmail(recipient.emailSnapshot);
  } catch {
    return null;
  }

  // A tag or message ID is only accepted when the address also matches.
  if (snapshotEmail !== normalizedEmail) {
    console.warn(
      "[Resend webhook] Marketing recipient email did not match the event recipient.",
    );

    return null;
  }

  return recipient;
}

export async function POST(request: NextRequest) {
  const webhookSecret = env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Resend webhook] Webhook secret is not configured.");

    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 },
    );
  }

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");

  if (!id || !timestamp || !signature) {
    return NextResponse.json(
      { error: "Missing webhook signature headers." },
      { status: 400 },
    );
  }

  // Signature verification must use the untouched request body.
  const rawBody = await request.text();

  let event: ResendWebhookEvent;

  try {
    event = resend.webhooks.verify({
      payload: rawBody,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 },
    );
  }

  if (!isSupportedEmailEvent(event)) {
    return NextResponse.json({
      received: true,
      ignored: true,
    });
  }

  const occurredAt = new Date(event.created_at);

  if (Number.isNaN(occurredAt.getTime())) {
    return NextResponse.json(
      { error: "Invalid event timestamp." },
      { status: 400 },
    );
  }

  const permanentBounce = isPermanentBounce(event);

  const shouldSuppress =
    event.type === "email.complained" || permanentBounce;

  const suppressionReason =
    event.type === "email.complained"
      ? "RESEND_SPAM_COMPLAINT"
      : "RESEND_HARD_BOUNCE";

  const recipients: string[] = [];

  for (const email of event.data.to) {
    try {
      const normalizedEmail = normalizeMarketingEmail(email);

      if (!recipients.includes(normalizedEmail)) {
        recipients.push(normalizedEmail);
      }
    } catch {
      // Ignore invalid recipient addresses.
    }
  }

  try {
    for (const normalizedEmail of recipients) {
      await prisma.$transaction(async (tx) => {
        // Suppression applies even when the email was not part of
        // a campaign or could not be correlated to a campaign recipient.
        if (shouldSuppress) {
          await tx.marketingContact.updateMany({
            where: {
              normalizedEmail,
              subscriptionStatus: { not: "SUPPRESSED" },
            },
            data: {
              subscriptionStatus: "SUPPRESSED",
              suppressedAt: new Date(),
              suppressionReason,
            },
          });
        }

        // The tag handles the case where the webhook arrives before
        // the worker has saved the Resend message ID.
        // Without a tag, use the message ID as a fallback.
        const recipient = await findCampaignRecipient(
          tx,
          event,
          normalizedEmail,
        );

        // Never correlate transactional email by address alone.
        if (!recipient) {
          return;
        }

        await tx.marketingEmailEvent.createMany({
          data: [
            {
              recipientId: recipient.id,
              provider: "RESEND",
              providerEventId: `${id}:${normalizedEmail}`,
              eventType: event.type,
              occurredAt,
              payload: {
                emailId: event.data.email_id,
                ...(event.type === "email.bounced"
                  ? {
                      bounce: {
                        type: event.data.bounce.type,
                        subType: event.data.bounce.subType,
                        message: event.data.bounce.message,
                      },
                    }
                  : {}),
              },
            },
          ],
          skipDuplicates: true,
        });

        if (event.type === "email.delivered") {
          await tx.marketingCampaignRecipient.updateMany({
            where: {
              id: recipient.id,
              status: {
                notIn: ["COMPLAINED", "BOUNCED"],
              },
            },
            data: {
              status: "DELIVERED",
              deliveredAt: occurredAt,
            },
          });
        } else if (event.type === "email.complained") {
          await tx.marketingCampaignRecipient.updateMany({
            where: {
              id: recipient.id,
              status: {
                not: "COMPLAINED",
              },
            },
            data: {
              status: "COMPLAINED",
            },
          });
        } else if (permanentBounce) {
          await tx.marketingCampaignRecipient.updateMany({
            where: {
              id: recipient.id,
              status: {
                notIn: ["COMPLAINED", "BOUNCED"],
              },
            },
            data: {
              status: "BOUNCED",
            },
          });
        }
      });
    }

    return NextResponse.json({
      received: true,
      processed: recipients.length,
    });
  } catch (error) {
    console.error("[Resend webhook processing]", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
