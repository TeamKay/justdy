
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authMock,
  prismaMock,
  preparationMock,
  dispatcherMock,
} = vi.hoisted(() => ({
  authMock: {
    api: {
      getSession: vi.fn(),
    },
  },
  prismaMock: {
    marketingCampaign: {
      findUnique: vi.fn(),
    },
  },
  preparationMock: {
    prepareMarketingCampaign: vi.fn(),
  },
  dispatcherMock: {
    dispatchPendingCampaignBatches: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/marketing/campaign-preparation-service", () => ({
  CampaignPreparationError: class CampaignPreparationError extends Error {
    constructor(
      message: string,
      public readonly code: string,
    ) {
      super(message);
      this.name = "CampaignPreparationError";
    }
  },
  prepareMarketingCampaign: preparationMock.prepareMarketingCampaign,
}));

vi.mock("@/lib/marketing/campaign-queue-dispatcher", () => ({
  CampaignQueueDispatchError: class CampaignQueueDispatchError extends Error {
    constructor(
      message: string,
      public readonly code: string,
    ) {
      super(message);
      this.name = "CampaignQueueDispatchError";
    }
  },
  dispatchPendingCampaignBatches:
    dispatcherMock.dispatchPendingCampaignBatches,
}));

import { POST } from "@/app/api/admin/marketing/campaigns/[id]/send/route";
import { CampaignPreparationError } from "@/lib/marketing/campaign-preparation-service";
import { CampaignQueueDispatchError } from "@/lib/marketing/campaign-queue-dispatcher";

const adminSession = {
  user: {
    id: "admin-123",
    role: "ADMIN",
  },
};

const regularSession = {
  user: {
    id: "user-123",
    role: "USER",
  },
};

const preparationResult = {
  campaignId: "campaign-123",
  recipientCount: 205,
  batchCount: 3,
  batchSize: 100,
  status: "QUEUED",
};

const dispatchResult = {
  campaignId: "campaign-123",
  examinedCount: 3,
  acceptedCount: 3,
  deferredCount: 0,
  failedCount: 0,
  retryableFailureCount: 0,
  remainingPendingCount: 0,
};

function makeRequest() {
  return new NextRequest(
    "http://localhost/api/admin/marketing/campaigns/campaign-123/send",
    { method: "POST" },
  );
}

function makeContext(id = "campaign-123") {
  return {
    params: Promise.resolve({ id }),
  };
}

describe("Marketing campaign send API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    authMock.api.getSession.mockResolvedValue(adminSession);

    prismaMock.marketingCampaign.findUnique.mockResolvedValue({
      id: "campaign-123",
      status: "DRAFT",
    });

    preparationMock.prepareMarketingCampaign.mockResolvedValue(
      preparationResult,
    );

    dispatcherMock.dispatchPendingCampaignBatches.mockResolvedValue(
      dispatchResult,
    );
  });

  it("rejects unauthenticated requests", async () => {
    authMock.api.getSession.mockResolvedValue(null);

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
    });

    expect(prismaMock.marketingCampaign.findUnique).not.toHaveBeenCalled();
    expect(
      preparationMock.prepareMarketingCampaign,
    ).not.toHaveBeenCalled();
    expect(
      dispatcherMock.dispatchPendingCampaignBatches,
    ).not.toHaveBeenCalled();
  });

  it("rejects users who are not administrators", async () => {
    authMock.api.getSession.mockResolvedValue(regularSession);

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Administrator access required.",
    });

    expect(prismaMock.marketingCampaign.findUnique).not.toHaveBeenCalled();
    expect(
      preparationMock.prepareMarketingCampaign,
    ).not.toHaveBeenCalled();
    expect(
      dispatcherMock.dispatchPendingCampaignBatches,
    ).not.toHaveBeenCalled();
  });

  it("prepares a draft campaign and dispatches its batches", async () => {
    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message:
        "Campaign queue dispatch completed. Email delivery is processed asynchronously.",
      campaignId: "campaign-123",
      status: "QUEUED",
      preparation: preparationResult,
      dispatch: dispatchResult,
      queuedCount: 3,
      deliveryStarted: true,
      deliveryCompleted: false,
    });

    expect(prismaMock.marketingCampaign.findUnique).toHaveBeenCalledWith({
      where: { id: "campaign-123" },
      select: {
        id: true,
        status: true,
      },
    });

    expect(
      preparationMock.prepareMarketingCampaign,
    ).toHaveBeenCalledWith("campaign-123");

    expect(
      dispatcherMock.dispatchPendingCampaignBatches,
    ).toHaveBeenCalledWith("campaign-123");
  });

  it("does not prepare a campaign again when it is already queued", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue({
      id: "campaign-123",
      status: "QUEUED",
    });

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.preparation).toBeNull();
    expect(body.dispatch).toEqual(dispatchResult);

    expect(
      preparationMock.prepareMarketingCampaign,
    ).not.toHaveBeenCalled();

    expect(
      dispatcherMock.dispatchPendingCampaignBatches,
    ).toHaveBeenCalledWith("campaign-123");
  });

  it("resumes pending batch dispatch for a campaign already sending", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue({
      id: "campaign-123",
      status: "SENDING",
    });

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(200);

    expect(
      preparationMock.prepareMarketingCampaign,
    ).not.toHaveBeenCalled();

    expect(
      dispatcherMock.dispatchPendingCampaignBatches,
    ).toHaveBeenCalledWith("campaign-123");
  });

  it("returns 404 when the campaign does not exist", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue(null);

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Campaign not found.",
      code: "NOT_FOUND",
    });

    expect(
      preparationMock.prepareMarketingCampaign,
    ).not.toHaveBeenCalled();

    expect(
      dispatcherMock.dispatchPendingCampaignBatches,
    ).not.toHaveBeenCalled();
  });

  it.each(["SENT", "PARTIALLY_SENT", "FAILED", "CANCELLED"])(
    "rejects a campaign with status %s",
    async (status) => {
      prismaMock.marketingCampaign.findUnique.mockResolvedValue({
        id: "campaign-123",
        status,
      });

      const response = await POST(makeRequest(), makeContext());

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({
        error: `Campaign cannot be sent from status: ${status}.`,
        code: "CAMPAIGN_NOT_READY",
      });

      expect(
        preparationMock.prepareMarketingCampaign,
      ).not.toHaveBeenCalled();

      expect(
        dispatcherMock.dispatchPendingCampaignBatches,
      ).not.toHaveBeenCalled();
    },
  );

  it("returns the preparation error when no eligible recipients remain", async () => {
    preparationMock.prepareMarketingCampaign.mockRejectedValue(
      new CampaignPreparationError(
        "There are no eligible recipients for this campaign.",
        "NO_ELIGIBLE_RECIPIENTS",
      ),
    );

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      code: "NO_ELIGIBLE_RECIPIENTS",
    });

    expect(
      dispatcherMock.dispatchPendingCampaignBatches,
    ).not.toHaveBeenCalled();
  });

  it("returns 409 when another request has already prepared the campaign", async () => {
    preparationMock.prepareMarketingCampaign.mockRejectedValue(
      new CampaignPreparationError(
        "This campaign has already been prepared or changed.",
        "PREPARATION_CONFLICT",
      ),
    );

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      code: "PREPARATION_CONFLICT",
    });

    expect(
      dispatcherMock.dispatchPendingCampaignBatches,
    ).not.toHaveBeenCalled();
  });

  it("returns 503 when queue publishing fails so the request can be retried", async () => {
    dispatcherMock.dispatchPendingCampaignBatches.mockRejectedValue(
      new CampaignQueueDispatchError(
        "The queue publishing request failed. Pending batches can be retried safely.",
        "PUBLISH_FAILED",
      ),
    );

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error:
        "The queue publishing request failed. Pending batches can be retried safely.",
      code: "PUBLISH_FAILED",
      retryable: true,
    });

    expect(
      preparationMock.prepareMarketingCampaign,
    ).toHaveBeenCalledWith("campaign-123");

    expect(
      dispatcherMock.dispatchPendingCampaignBatches,
    ).toHaveBeenCalledWith("campaign-123");
  });

  it("reports remaining pending batches without claiming delivery completed", async () => {
    dispatcherMock.dispatchPendingCampaignBatches.mockResolvedValue({
      ...dispatchResult,
      acceptedCount: 1,
      failedCount: 1,
      retryableFailureCount: 1,
      remainingPendingCount: 1,
    });

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(200);

    expect(await response.json()).toMatchObject({
      message:
        "Campaign queue dispatch finished with batches still pending. You can retry this request to resume dispatch.",
      queuedCount: 1,
      deliveryStarted: true,
      deliveryCompleted: false,
      dispatch: {
        failedCount: 1,
        retryableFailureCount: 1,
        remainingPendingCount: 1,
      },
    });
  });

  it("returns 500 for unexpected errors", async () => {
    prismaMock.marketingCampaign.findUnique.mockRejectedValue(
      new Error("Unexpected database failure"),
    );

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to start campaign delivery.",
    });
  });

  it("uses the campaign ID from the route parameters", async () => {
    await POST(makeRequest(), makeContext("campaign-789"));

    expect(prismaMock.marketingCampaign.findUnique).toHaveBeenCalledWith({
      where: { id: "campaign-789" },
      select: {
        id: true,
        status: true,
      },
    });
  });
});
