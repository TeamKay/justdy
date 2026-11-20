
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
  if (event.type !== "email.bounced") {
    return false;
  }

  return event.data.bounce.type.toLowerCase() === "permanent";
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

  // Ignore valid Resend events that are not relevant to marketing email.
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

  // Complaints and permanent bounces suppress marketing contacts.
  // Temporary bounces and delivery delays do not.
  const shouldSuppress =
    event.type === "email.complained" || permanentBounce;

  const suppressionReason =
    event.type === "email.complained"
      ? "RESEND_SPAM_COMPLAINT"
      : "RESEND_HARD_BOUNCE";

  // Normalize and deduplicate all valid recipient email addresses.
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
        // A complaint or permanent bounce suppresses the contact,
        // regardless of its previous subscription status.
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

        // Match the campaign recipient using the Resend message ID.
        // Do not associate transactional email events by email alone.
        const recipient =
          await tx.marketingCampaignRecipient.findUnique({
            where: {
              resendMessageId: event.data.email_id,
            },
            select: {
              id: true,
            },
          });

        // The event may belong to a transactional email rather than
        // a marketing campaign. Contact suppression above still applies.
        if (!recipient) {
          return;
        }

        // Store one event per provider event and recipient.
        // skipDuplicates makes webhook retries idempotent.
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

        // A delivery delay or temporary bounce does not change
        // the campaign recipient's final delivery status.
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
