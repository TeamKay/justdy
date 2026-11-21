
import "server-only";

import prisma from "@/lib/prisma";
import { env } from "@/lib/env";
import { resend } from "@/lib/resend";
import { getExclusionReason } from "@/lib/marketing/audience-service";
import { getMarketingUnsubscribeUrl } from "@/lib/marketing/unsubscribe-token";

const BATCH_LEASE_MS = 5 * 60 * 1000;

// Stop automatic retries before the provider's idempotency window can
// become uncertain. An unresolved send is sent for manual review instead.
const SAFE_RETRY_WINDOW_MS = 23 * 60 * 60 * 1000;

export class CampaignBatchWorkerError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "BATCH_BUSY"
      | "SEND_RETRYABLE"
      | "PROCESSING_FAILED",
  ) {
    super(message);
    this.name = "CampaignBatchWorkerError";
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function getErrorDetails(error: unknown): {
  message: string;
  retryable: boolean;
} {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error
  ) {
    const value = error as {
      statusCode?: unknown;
      message?: unknown;
    };

    const statusCode = Number(value.statusCode);

    return {
      message:
        typeof value.message === "string"
          ? value.message
          : "Email provider error.",
      retryable:
        !Number.isFinite(statusCode) ||
        statusCode === 408 ||
        statusCode === 429 ||
        statusCode >= 500,
    };
  }

  return {
    message:
      error instanceof Error
        ? error.message
        : "Unknown email provider error.",
    // Unknown errors are treated conservatively.
    retryable: true,
  };
}

function getSender(fromName: string | null): string {
  const senderName = (
    fromName?.trim() || env.EMAIL_SENDER_NAME
  ).replace(/[\r\n<>"]/g, "");

  return `${senderName} <${env.EMAIL_SENDER_ADDRESS}>`;
}

async function updateBatchProgress(batchId: string): Promise<void> {
  const recipients =
    await prisma.marketingCampaignRecipient.findMany({
      where: { batchId },
      select: { status: true },
    });

  const pendingCount = recipients.filter(
    (recipient) =>
      recipient.status === "PENDING" ||
      recipient.status === "SENDING",
  ).length;

  const sentCount = recipients.filter(
    (recipient) =>
      recipient.status === "SENT" ||
      recipient.status === "DELIVERED" ||
      recipient.status === "BOUNCED" ||
      recipient.status === "COMPLAINED",
  ).length;

  const failedCount = recipients.filter(
    (recipient) => recipient.status === "FAILED",
  ).length;

  const skippedCount = recipients.filter(
    (recipient) => recipient.status === "SKIPPED",
  ).length;

  const processedCount = recipients.length - pendingCount;

  await prisma.marketingCampaignBatch.update({
    where: { id: batchId },
    data: {
      processedCount,
      sentCount,
      failedCount,
      skippedCount,
      status: pendingCount === 0 ? "COMPLETED" : "QUEUED",
      completedAt: pendingCount === 0 ? new Date() : null,
      leaseExpiresAt: null,
      lastError: null,
    },
  });

 await updateCampaignProgress(batchId);
}

async function updateCampaignProgress(
  batchId: string,
): Promise<void> {
  const batch = await prisma.marketingCampaignBatch.findUnique({
    where: { id: batchId },
    select: {
      campaignId: true,
    },
  });

  if (!batch) return;

  const batches = await prisma.marketingCampaignBatch.findMany({
    where: { campaignId: batch.campaignId },
    select: {
      status: true,
      sentCount: true,
      failedCount: true,
      skippedCount: true,
    },
  });

  const allFinished = batches.every(
    (item) =>
      item.status === "COMPLETED" ||
      item.status === "FAILED" ||
      item.status === "CANCELLED",
  );

  if (!allFinished) return;

  const sentCount = batches.reduce(
    (total, item) => total + item.sentCount,
    0,
  );

  const failedCount = batches.reduce(
    (total, item) => total + item.failedCount,
    0,
  );

  const skippedCount = batches.reduce(
    (total, item) => total + item.skippedCount,
    0,
  );

  const hasIncompleteBatch = batches.some(
    (item) => item.status !== "COMPLETED",
  );

  const status =
    sentCount === 0
      ? "FAILED"
      : failedCount > 0 || skippedCount > 0 || hasIncompleteBatch
        ? "PARTIALLY_SENT"
        : "SENT";

  await prisma.marketingCampaign.updateMany({
    where: {
      id: batch.campaignId,
      status: { in: ["QUEUED", "SENDING"] },
    },
    data: {
      status,
      completedAt: new Date(),
      ...(sentCount > 0 ? { sentAt: new Date() } : {}),
    },
  });
}

async function markRecipientSkipped(
  recipientId: string,
  reason: string,
): Promise<void> {
  await prisma.marketingCampaignRecipient.updateMany({
    where: {
      id: recipientId,
      status: { in: ["PENDING", "SENDING"] },
    },
    data: {
      status: "SKIPPED",
      errorMessage: reason,
    },
  });
}

async function processRecipient(
  recipient: {
    id: string;
    contactId: string;
    emailSnapshot: string;
    status: string;
    attemptedAt: Date | null;
  },
  campaign: {
    subject: string;
    htmlContent: string;
    textContent: string | null;
    fromName: string | null;
    replyTo: string | null;
  },
): Promise<void> {
  if (
    recipient.status !== "PENDING" &&
    recipient.status !== "SENDING"
  ) {
    return;
  }

  const wasAlreadySending = recipient.status === "SENDING";

  if (wasAlreadySending) {
    if (!recipient.attemptedAt) {
      await markRecipientSkipped(
        recipient.id,
        "Previous send outcome is unknown. Manual review required.",
      );
      return;
    }

    if (
      Date.now() - recipient.attemptedAt.getTime() >
      SAFE_RETRY_WINDOW_MS
    ) {
      await prisma.marketingCampaignRecipient.updateMany({
        where: {
          id: recipient.id,
          status: "SENDING",
        },
        data: {
          status: "FAILED",
          errorMessage:
            "Previous send outcome is unknown and is outside the safe automatic retry window. Manual review required.",
        },
      });

      return;
    }
  } else {
    const claim =
      await prisma.marketingCampaignRecipient.updateMany({
        where: {
          id: recipient.id,
          status: "PENDING",
        },
        data: {
          status: "SENDING",
          attemptedAt: new Date(),
          errorMessage: null,
        },
      });

    if (claim.count !== 1) return;
  }

  // Re-read the contact after claiming the recipient. This is the
  // final eligibility check immediately before sending.
  const contact = await prisma.marketingContact.findUnique({
    where: { id: recipient.contactId },
    select: {
      id: true,
      email: true,
      normalizedEmail: true,
      name: true,
      userId: true,
      subscriptionStatus: true,
      subscribedAt: true,
      user: {
        select: {
          status: true,
          emailVerified: true,
        },
      },
      consentEvents: {
        orderBy: [
          { occurredAt: "desc" },
          { createdAt: "desc" },
        ],
        take: 1,
        select: {
          action: true,
          authorizationType: true,
          channel: true,
          method: true,
          consentTextVersion: true,
          consentGivenByEmail: true,
          evidenceMetadata: true,
        },
      },
    },
  });

  if (
    !contact ||
    contact.subscriptionStatus !== "SUBSCRIBED" ||
    !contact.subscribedAt
  ) {
    await markRecipientSkipped(
      recipient.id,
      "Contact is no longer subscribed.",
    );
    return;
  }

  const exclusionReason = getExclusionReason(contact);

  if (exclusionReason) {
    await markRecipientSkipped(
      recipient.id,
      `Contact is no longer eligible: ${exclusionReason}`,
    );
    return;
  }

  const unsubscribeUrl = getMarketingUnsubscribeUrl(
    contact.id,
    contact.subscribedAt,
  );

  const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);

  const html = [
    campaign.htmlContent,
    `<hr style="margin-top:32px;border:0;border-top:1px solid #ddd" />`,
    `<p style="font-size:12px;color:#666">`,
    `You are receiving this email because you subscribed to Justdy updates.`,
    ` <a href="${safeUnsubscribeUrl}">Unsubscribe</a>.`,
    `</p>`,
  ].join("");

  const text = [
    campaign.textContent?.trim() ||
      htmlToText(campaign.htmlContent),
    "",
    "You are receiving this email because you subscribed to Justdy updates.",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  let result;

  try {
    result = await resend.emails.send(
      {
        from: getSender(campaign.fromName),
        to: contact.email,
        subject: campaign.subject,
        html,
        text,
        ...(campaign.replyTo
          ? { replyTo: campaign.replyTo }
          : {}),
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        tags: [
          {
            name: "marketing_recipient_id",
            value: recipient.id,
          },
        ],
      },
      {
        idempotencyKey: `marketing-recipient-${recipient.id}`,
      },
    );
  } catch (error) {
    const details = getErrorDetails(error);

    if (details.retryable) {
      throw new CampaignBatchWorkerError(
        details.message,
        "SEND_RETRYABLE",
      );
    }

    await prisma.marketingCampaignRecipient.updateMany({
      where: {
        id: recipient.id,
        status: "SENDING",
      },
      data: {
        status: "FAILED",
        errorMessage: details.message.slice(0, 5000),
      },
    });

    return;
  }

  if (result.error) {
    const details = getErrorDetails(result.error);

    if (details.retryable) {
      throw new CampaignBatchWorkerError(
        details.message,
        "SEND_RETRYABLE",
      );
    }

    await prisma.marketingCampaignRecipient.updateMany({
      where: {
        id: recipient.id,
        status: "SENDING",
      },
      data: {
        status: "FAILED",
        errorMessage: details.message.slice(0, 5000),
      },
    });

    return;
  }

  if (!result.data?.id) {
    throw new CampaignBatchWorkerError(
      "Resend returned no message ID. The send outcome must be retried safely.",
      "SEND_RETRYABLE",
    );
  }

  // A webhook may already have changed the status to DELIVERED,
  // BOUNCED, or COMPLAINED. Never overwrite that newer state.
  await prisma.marketingCampaignRecipient.updateMany({
    where: {
      id: recipient.id,
      status: "SENDING",
    },
    data: {
      status: "SENT",
      resendMessageId: result.data.id,
      sentAt: new Date(),
      errorMessage: null,
    },
  });
}

export async function processMarketingCampaignBatch(
  batchId: string,
): Promise<void> {
  const now = new Date();

  const claim = await prisma.marketingCampaignBatch.updateMany({
    where: {
      id: batchId,
      OR: [
        { status: { in: ["PENDING", "QUEUED"] } },
        {
          status: "PROCESSING",
          leaseExpiresAt: { lt: now },
        },
        {
          status: "PROCESSING",
          leaseExpiresAt: null,
        },
      ],
    },
    data: {
      status: "PROCESSING",
      attemptCount: { increment: 1 },
      startedAt: now,
      leaseExpiresAt: new Date(
        now.getTime() + BATCH_LEASE_MS,
      ),
    },
  });

  if (claim.count !== 1) {
    const existing =
      await prisma.marketingCampaignBatch.findUnique({
        where: { id: batchId },
        select: { status: true },
      });

    if (!existing) {
      throw new CampaignBatchWorkerError(
        "Campaign batch not found.",
        "NOT_FOUND",
      );
    }

    if (
      existing.status === "COMPLETED" ||
      existing.status === "FAILED" ||
      existing.status === "CANCELLED"
    ) {
      return;
    }

    throw new CampaignBatchWorkerError(
      "This batch is currently being processed. It will be retried.",
      "BATCH_BUSY",
    );
  }

  try {
    const batch =
      await prisma.marketingCampaignBatch.findUnique({
        where: { id: batchId },
        include: {
          campaign: {
            select: {
              id: true,
              status: true,
              subject: true,
              htmlContent: true,
              textContent: true,
              fromName: true,
              replyTo: true,
            },
          },
          recipients: {
            select: {
              id: true,
              contactId: true,
              emailSnapshot: true,
              status: true,
              attemptedAt: true,
            },
          },
        },
      });

    if (!batch) {
      throw new CampaignBatchWorkerError(
        "Campaign batch not found.",
        "NOT_FOUND",
      );
    }

   if (batch.campaign.status === "CANCELLED") {
  await prisma.marketingCampaignBatch.update({
    where: { id: batchId },
    data: {
      status: "CANCELLED",
      completedAt: new Date(),
      leaseExpiresAt: null,
    },
  });

  return;
}

if (
  batch.campaign.status !== "QUEUED" &&
  batch.campaign.status !== "SENDING"
) {
  await prisma.marketingCampaignBatch.update({
    where: { id: batchId },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      leaseExpiresAt: null,
      lastError: `Campaign cannot be sent from status: ${batch.campaign.status}`,
    },
  });

  return;
}

    await prisma.marketingCampaign.updateMany({
      where: {
        id: batch.campaignId,
        status: "QUEUED",
      },
      data: { status: "SENDING" },
    });

   for (const recipient of batch.recipients) {
  // Check whether an administrator cancelled the campaign.
  const currentCampaign = await prisma.marketingCampaign.findUnique({
    where: { id: batch.campaignId },
    select: { status: true },
  });

  if (currentCampaign?.status === "CANCELLED") {
    await prisma.marketingCampaignBatch.update({
      where: { id: batchId },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
        leaseExpiresAt: null,
      },
    });

    return;
  }

  // Keep the lease alive while a batch is being processed.
  await prisma.marketingCampaignBatch.update({
    where: { id: batchId },
    data: {
      leaseExpiresAt: new Date(
        Date.now() + BATCH_LEASE_MS,
      ),
    },
  });

  await processRecipient(recipient, batch.campaign);
}

await updateBatchProgress(batchId);
  } catch (error) {
    // Return the batch to a retryable state. Already-sent recipients
    // remain SENT; uncertain SENDING recipients reuse the same
    // Resend idempotency key on the next attempt.
    await prisma.marketingCampaignBatch.updateMany({
      where: {
        id: batchId,
        status: "PROCESSING",
      },
      data: {
        status: "QUEUED",
        leaseExpiresAt: null,
        lastError:
          error instanceof Error
            ? error.message.slice(0, 5000)
            : "Unknown batch processing error.",
      },
    });

    if (error instanceof CampaignBatchWorkerError) {
      throw error;
    }

    throw new CampaignBatchWorkerError(
      "Campaign batch processing failed and must be retried.",
      "PROCESSING_FAILED",
    );
  }
}
