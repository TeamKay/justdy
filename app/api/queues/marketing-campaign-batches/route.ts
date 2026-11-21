
import { handleCallback } from "@vercel/queue";

import { processMarketingCampaignBatch } from "@/lib/marketing/campaign-batch-worker";

interface MarketingBatchQueuePayload {
  batchId: string;
}

function isMarketingBatchPayload(
  value: unknown,
): value is MarketingBatchQueuePayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "batchId" in value &&
    typeof value.batchId === "string" &&
    value.batchId.length > 0 &&
    value.batchId.length <= 128
  );
}

export const POST = handleCallback<MarketingBatchQueuePayload>(
  async (message) => {
    if (!isMarketingBatchPayload(message)) {
      console.error(
        "[Marketing queue] Received an invalid batch message.",
      );

      // A malformed message cannot be repaired by retrying it.
      return;
    }

    await processMarketingCampaignBatch(message.batchId);
  },
);
