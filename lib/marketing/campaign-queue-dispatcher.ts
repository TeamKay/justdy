
import "server-only";

import {
  sendBatch,
  type BatchSendResult,
} from "@vercel/queue";
import prisma from "@/lib/prisma";

export const MARKETING_CAMPAIGN_QUEUE_TOPIC =
  "marketing-campaign-batches";

const MAX_MESSAGES_PER_REQUEST = 100;

interface MarketingBatchQueuePayload {
  batchId: string;
}

interface PendingBatch {
  id: string;
  sequence: number;
}

export class CampaignQueueDispatchError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "CAMPAIGN_NOT_READY"
      | "PUBLISH_FAILED",
  ) {
    super(message);
    this.name = "CampaignQueueDispatchError";
  }
}

export interface CampaignQueueDispatchResult {
  campaignId: string;
  examinedCount: number;
  acceptedCount: number;
  deferredCount: number;
  failedCount: number;
  retryableFailureCount: number;
  remainingPendingCount: number;
}

/**
 * Publishes pending database batches to Vercel Queues.
 *
 * Queue messages contain only a database batch ID.
 * Every message uses a stable idempotency key derived from that ID.
 *
 * This function does not send email.
 */
export async function dispatchPendingCampaignBatches(
  campaignId: string,
): Promise<CampaignQueueDispatchResult> {
  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!campaign) {
    throw new CampaignQueueDispatchError(
      "Campaign not found.",
      "NOT_FOUND",
    );
  }

  if (
    campaign.status !== "QUEUED" &&
    campaign.status !== "SENDING"
  ) {
    throw new CampaignQueueDispatchError(
      "This campaign is not ready for queue dispatch.",
      "CAMPAIGN_NOT_READY",
    );
  }

  const pendingBatches: PendingBatch[] =
    await prisma.marketingCampaignBatch.findMany({
      where: {
        campaignId,
        status: "PENDING",
      },
      orderBy: {
        sequence: "asc",
      },
      select: {
        id: true,
        sequence: true,
      },
    });

  const summary: CampaignQueueDispatchResult = {
    campaignId,
    examinedCount: pendingBatches.length,
    acceptedCount: 0,
    deferredCount: 0,
    failedCount: 0,
    retryableFailureCount: 0,
    remainingPendingCount: 0,
  };

  if (pendingBatches.length === 0) {
    return summary;
  }

  for (
    let offset = 0;
    offset < pendingBatches.length;
    offset += MAX_MESSAGES_PER_REQUEST
  ) {
    const currentBatches = pendingBatches.slice(
      offset,
      offset + MAX_MESSAGES_PER_REQUEST,
    );

    const messages = currentBatches.map((batch) => ({
      payload: {
        batchId: batch.id,
      } satisfies MarketingBatchQueuePayload,
      idempotencyKey: `marketing-campaign-batch-${batch.id}`,
    }));

    let results: BatchSendResult[];

    try {
      results = await sendBatch<MarketingBatchQueuePayload>(
        MARKETING_CAMPAIGN_QUEUE_TOPIC,
        messages,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown queue publishing error.";

      // A request-level error can occur after the queue accepted
      // messages. Keep batches PENDING so they can be safely retried.
      // The stable idempotency key and worker-side database claim
      // protect against duplicate processing.
      try {
        await prisma.marketingCampaignBatch.updateMany({
          where: {
            id: {
              in: currentBatches.map((batch) => batch.id),
            },
            status: "PENDING",
          },
          data: {
            lastError: message.slice(0, 5000),
          },
        });
      } catch (databaseError) {
        console.error(
          "[Marketing queue] Could not record publishing error:",
          databaseError,
        );
      }

      throw new CampaignQueueDispatchError(
        "The queue publishing request failed. Pending batches can be retried safely.",
        "PUBLISH_FAILED",
      );
    }

    if (results.length !== currentBatches.length) {
      throw new CampaignQueueDispatchError(
        "The queue returned an unexpected number of publishing results. Pending batches were left available for retry.",
        "PUBLISH_FAILED",
      );
    }

    await Promise.all(
      results.map(async (result, index) => {
        const batch = currentBatches[index];

        if (result.status === "sent") {
          await prisma.marketingCampaignBatch.updateMany({
            where: {
              id: batch.id,
              status: "PENDING",
            },
            data: {
              status: "QUEUED",
              queueMessageId: result.messageId,
              queuedAt: new Date(),
              lastError: null,
            },
          });

          summary.acceptedCount += 1;
          return;
        }

        if (result.status === "deferred") {
          await prisma.marketingCampaignBatch.updateMany({
            where: {
              id: batch.id,
              status: "PENDING",
            },
            data: {
              status: "QUEUED",
              queueMessageId: null,
              queuedAt: new Date(),
              lastError: null,
            },
          });

          summary.deferredCount += 1;
          return;
        }

        await prisma.marketingCampaignBatch.updateMany({
          where: {
            id: batch.id,
            status: "PENDING",
          },
          data: {
            status: result.retryable ? "PENDING" : "FAILED",
            lastError: `${result.statusCode}: ${result.error}`.slice(
              0,
              5000,
            ),
          },
        });

        summary.failedCount += 1;

        if (result.retryable) {
          summary.retryableFailureCount += 1;
        }
      }),
    );
  }

  const remainingPending = await prisma.marketingCampaignBatch.count({
    where: {
      campaignId,
      status: "PENDING",
    },
  });

  summary.remainingPendingCount = remainingPending;

  return summary;
}
