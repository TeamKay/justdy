
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, queueMock } = vi.hoisted(() => ({
  prismaMock: {
    marketingCampaign: {
      findUnique: vi.fn(),
    },
    marketingCampaignBatch: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
  queueMock: {
    sendBatch: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@vercel/queue", () => ({
  sendBatch: queueMock.sendBatch,
}));

import {
  CampaignQueueDispatchError,
  dispatchPendingCampaignBatches,
  MARKETING_CAMPAIGN_QUEUE_TOPIC,
} from "@/lib/marketing/campaign-queue-dispatcher";

const campaign = {
  id: "campaign-123",
  status: "QUEUED",
};

const pendingBatches = [
  {
    id: "batch-1",
    sequence: 1,
  },
  {
    id: "batch-2",
    sequence: 2,
  },
];

describe("Marketing campaign queue dispatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.marketingCampaign.findUnique.mockResolvedValue(
      campaign,
    );

    prismaMock.marketingCampaignBatch.findMany.mockResolvedValue(
      pendingBatches,
    );

    prismaMock.marketingCampaignBatch.updateMany.mockResolvedValue({
      count: 1,
    });

    prismaMock.marketingCampaignBatch.count.mockResolvedValue(0);

    queueMock.sendBatch.mockResolvedValue([
      {
        status: "sent",
        messageId: "queue-message-1",
      },
      {
        status: "sent",
        messageId: "queue-message-2",
      },
    ]);
  });

  it("publishes pending batches with stable idempotency keys", async () => {
    const result =
      await dispatchPendingCampaignBatches("campaign-123");

    expect(queueMock.sendBatch).toHaveBeenCalledWith(
      MARKETING_CAMPAIGN_QUEUE_TOPIC,
      [
        {
          payload: {
            batchId: "batch-1",
          },
          idempotencyKey: "marketing-campaign-batch-batch-1",
        },
        {
          payload: {
            batchId: "batch-2",
          },
          idempotencyKey: "marketing-campaign-batch-batch-2",
        },
      ],
    );

    expect(result).toEqual({
      campaignId: "campaign-123",
      examinedCount: 2,
      acceptedCount: 2,
      deferredCount: 0,
      failedCount: 0,
      retryableFailureCount: 0,
      remainingPendingCount: 0,
    });
  });

  it("marks accepted messages as queued and stores their message IDs", async () => {
    await dispatchPendingCampaignBatches("campaign-123");

    expect(
      prismaMock.marketingCampaignBatch.updateMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "batch-1",
          status: "PENDING",
        },
        data: expect.objectContaining({
          status: "QUEUED",
          queueMessageId: "queue-message-1",
          lastError: null,
        }),
      }),
    );
  });

  it("records deferred messages as queued without a message ID", async () => {
    queueMock.sendBatch.mockResolvedValue([
      {
        status: "deferred",
        messageId: null,
      },
      {
        status: "sent",
        messageId: "queue-message-2",
      },
    ]);

    const result =
      await dispatchPendingCampaignBatches("campaign-123");

    expect(result.deferredCount).toBe(1);
    expect(result.acceptedCount).toBe(1);

    expect(
      prismaMock.marketingCampaignBatch.updateMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "batch-1",
          status: "PENDING",
        },
        data: expect.objectContaining({
          status: "QUEUED",
          queueMessageId: null,
        }),
      }),
    );
  });

  it("keeps retryable publishing failures pending", async () => {
    queueMock.sendBatch.mockResolvedValue([
      {
        status: "failed",
        statusCode: 503,
        error: "Queue temporarily unavailable",
        retryable: true,
      },
      {
        status: "sent",
        messageId: "queue-message-2",
      },
    ]);

    const result =
      await dispatchPendingCampaignBatches("campaign-123");

    expect(result.failedCount).toBe(1);
    expect(result.retryableFailureCount).toBe(1);

    expect(
      prismaMock.marketingCampaignBatch.updateMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "batch-1",
          status: "PENDING",
        },
        data: expect.objectContaining({
          status: "PENDING",
          lastError: "503: Queue temporarily unavailable",
        }),
      }),
    );
  });

  it("marks permanent publishing failures as failed", async () => {
    queueMock.sendBatch.mockResolvedValue([
      {
        status: "failed",
        statusCode: 400,
        error: "Invalid queue configuration",
        retryable: false,
      },
      {
        status: "sent",
        messageId: "queue-message-2",
      },
    ]);

    const result =
      await dispatchPendingCampaignBatches("campaign-123");

    expect(result.failedCount).toBe(1);
    expect(result.retryableFailureCount).toBe(0);

    expect(
      prismaMock.marketingCampaignBatch.updateMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "batch-1",
          status: "PENDING",
        },
        data: expect.objectContaining({
          status: "FAILED",
          lastError: "400: Invalid queue configuration",
        }),
      }),
    );
  });

  it("rejects a campaign that does not exist", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue(null);

    await expect(
      dispatchPendingCampaignBatches("missing-campaign"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(queueMock.sendBatch).not.toHaveBeenCalled();
  });

  it("rejects campaigns that are not queued or sending", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue({
      ...campaign,
      status: "DRAFT",
    });

    await expect(
      dispatchPendingCampaignBatches("campaign-123"),
    ).rejects.toMatchObject({
      code: "CAMPAIGN_NOT_READY",
    });

    expect(queueMock.sendBatch).not.toHaveBeenCalled();
  });

  it("does not publish when there are no pending batches", async () => {
    prismaMock.marketingCampaignBatch.findMany.mockResolvedValue([]);

    const result =
      await dispatchPendingCampaignBatches("campaign-123");

    expect(result).toMatchObject({
      examinedCount: 0,
      acceptedCount: 0,
      deferredCount: 0,
      failedCount: 0,
    });

    expect(queueMock.sendBatch).not.toHaveBeenCalled();
  });

  it("keeps batches pending when the queue request throws", async () => {
    queueMock.sendBatch.mockRejectedValue(
      new Error("Queue request timed out"),
    );

    await expect(
      dispatchPendingCampaignBatches("campaign-123"),
    ).rejects.toMatchObject({
      code: "PUBLISH_FAILED",
    });

    expect(
      prismaMock.marketingCampaignBatch.updateMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: {
            in: ["batch-1", "batch-2"],
          },
          status: "PENDING",
        },
        data: {
          lastError: "Queue request timed out",
        },
      }),
    );
  });
});
