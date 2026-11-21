
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  resendMock,
  exclusionMock,
  unsubscribeMock,
} = vi.hoisted(() => ({
  prismaMock: {
    marketingCampaign: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    marketingCampaignBatch: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    marketingCampaignRecipient: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    marketingContact: {
      findUnique: vi.fn(),
    },
  },
  resendMock: {
    emails: {
      send: vi.fn(),
    },
  },
  exclusionMock: vi.fn(),
  unsubscribeMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/resend", () => ({
  resend: resendMock,
}));

vi.mock("@/lib/env", () => ({
  env: {
    EMAIL_SENDER_NAME: "Justdy",
    EMAIL_SENDER_ADDRESS: "updates@example.com",
  },
}));

vi.mock("@/lib/marketing/audience-service", () => ({
  getExclusionReason: exclusionMock,
}));

vi.mock("@/lib/marketing/unsubscribe-token", () => ({
  getMarketingUnsubscribeUrl: unsubscribeMock,
}));

import { processMarketingCampaignBatch } from "@/lib/marketing/campaign-batch-worker";

const campaign = {
  id: "campaign-123",
  status: "SENDING",
  subject: "Your Justdy update",
  htmlContent: "<p>Hello learner</p>",
  textContent: "Hello learner",
  fromName: "Justdy Team",
  replyTo: "support@example.com",
};

const recipient = {
  id: "recipient-123",
  contactId: "contact-123",
  emailSnapshot: "learner@example.com",
  status: "PENDING",
  attemptedAt: null,
};

const contact = {
  id: "contact-123",
  email: "learner@example.com",
  normalizedEmail: "learner@example.com",
  name: "Learner",
  userId: null,
  subscriptionStatus: "SUBSCRIBED",
  subscribedAt: new Date("2026-01-01T00:00:00.000Z"),
  user: null,
  consentEvents: [
    {
      action: "GRANTED",
      authorizationType: "SELF",
      channel: "EMAIL",
      method: "NEWSLETTER_FOOTER_FORM",
      consentTextVersion: "newsletter-consent-v1",
      consentGivenByEmail: "learner@example.com",
      evidenceMetadata: {
        source: "footer_newsletter",
        marketingConsent: true,
      },
    },
  ],
};

const batch = {
  id: "batch-123",
  campaignId: "campaign-123",
  status: "PROCESSING",
  campaign,
  recipients: [recipient],
};

function configureSuccessfulBatch() {
  prismaMock.marketingCampaignBatch.updateMany.mockResolvedValue({
    count: 1,
  });

  prismaMock.marketingCampaignBatch.findUnique
    .mockResolvedValueOnce(batch)
    .mockResolvedValue({
      campaignId: "campaign-123",
    });

  prismaMock.marketingCampaign.findUnique.mockResolvedValue({
    status: "SENDING",
  });

  prismaMock.marketingContact.findUnique.mockResolvedValue(contact);

  prismaMock.marketingCampaignRecipient.updateMany.mockResolvedValue({
    count: 1,
  });

  prismaMock.marketingCampaignRecipient.findMany.mockResolvedValue([
    { status: "SENT" },
  ]);

  prismaMock.marketingCampaignBatch.findMany.mockResolvedValue([
    {
      status: "COMPLETED",
      sentCount: 1,
      failedCount: 0,
      skippedCount: 0,
    },
  ]);

  prismaMock.marketingCampaignBatch.update.mockResolvedValue({});

  prismaMock.marketingCampaign.updateMany.mockResolvedValue({
    count: 1,
  });

  exclusionMock.mockReturnValue(null);

  unsubscribeMock.mockReturnValue(
    "https://justdy.com/api/marketing/unsubscribe?token=test-token",
  );

  resendMock.emails.send.mockResolvedValue({
    data: { id: "resend-message-123" },
    error: null,
  });
}

describe("Marketing campaign batch worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureSuccessfulBatch();
  });

  it("sends eligible recipients through the shared Resend client", async () => {
    await processMarketingCampaignBatch("batch-123");

    expect(resendMock.emails.send).toHaveBeenCalledTimes(1);

    expect(resendMock.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Justdy Team <updates@example.com>",
        to: "learner@example.com",
        subject: campaign.subject,
        html: expect.stringContaining("Unsubscribe"),
        text: expect.stringContaining("Unsubscribe:"),
      }),
      {
        idempotencyKey: "marketing-recipient-recipient-123",
      },
    );
  });

  it("includes one-click unsubscribe headers and recipient correlation tag", async () => {
    await processMarketingCampaignBatch("batch-123");

    const emailOptions = resendMock.emails.send.mock.calls[0][0];

    expect(emailOptions.headers).toEqual({
      "List-Unsubscribe":
        "<https://justdy.com/api/marketing/unsubscribe?token=test-token>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });

    expect(emailOptions.tags).toEqual([
      {
        name: "marketing_recipient_id",
        value: "recipient-123",
      },
    ]);
  });

  it("skips contacts who are no longer subscribed", async () => {
    prismaMock.marketingContact.findUnique.mockResolvedValue({
      ...contact,
      subscriptionStatus: "UNSUBSCRIBED",
      subscribedAt: null,
    });

    await processMarketingCampaignBatch("batch-123");

    expect(resendMock.emails.send).not.toHaveBeenCalled();

    expect(
      prismaMock.marketingCampaignRecipient.updateMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "recipient-123",
          status: { in: ["PENDING", "SENDING"] },
        },
        data: expect.objectContaining({
          status: "SKIPPED",
        }),
      }),
    );
  });

  it("skips contacts rejected by the final eligibility check", async () => {
    exclusionMock.mockReturnValue("MISSING_OR_WITHDRAWN_CONSENT");

    await processMarketingCampaignBatch("batch-123");

    expect(resendMock.emails.send).not.toHaveBeenCalled();

    expect(
      prismaMock.marketingCampaignRecipient.updateMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "recipient-123",
          status: { in: ["PENDING", "SENDING"] },
        },
        data: expect.objectContaining({
          status: "SKIPPED",
          errorMessage: expect.stringContaining(
            "MISSING_OR_WITHDRAWN_CONSENT",
          ),
        }),
      }),
    );
  });

  it("marks the recipient as sent after Resend accepts the email", async () => {
    await processMarketingCampaignBatch("batch-123");

    expect(
      prismaMock.marketingCampaignRecipient.updateMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "recipient-123",
          status: "SENDING",
        },
        data: expect.objectContaining({
          status: "SENT",
          resendMessageId: "resend-message-123",
        }),
      }),
    );
  });

  it("retries a temporary Resend failure without marking the recipient failed", async () => {
    resendMock.emails.send.mockRejectedValue({
      statusCode: 503,
      message: "Temporary provider failure",
    });

    await expect(
      processMarketingCampaignBatch("batch-123"),
    ).rejects.toMatchObject({
      code: "SEND_RETRYABLE",
    });

    expect(
      prismaMock.marketingCampaignBatch.updateMany,
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          id: "batch-123",
          status: "PROCESSING",
        },
        data: expect.objectContaining({
          status: "QUEUED",
          lastError: "Temporary provider failure",
        }),
      }),
    );
  });

  it("does not process a campaign that has already been sent", async () => {
    // Remove the default one-time response from configureSuccessfulBatch().
    prismaMock.marketingCampaignBatch.findUnique.mockReset();

    prismaMock.marketingCampaignBatch.findUnique.mockResolvedValue({
      ...batch,
      campaign: {
        ...campaign,
        status: "SENT",
      },
    });

    await processMarketingCampaignBatch("batch-123");

    expect(resendMock.emails.send).not.toHaveBeenCalled();

    expect(
      prismaMock.marketingCampaignBatch.update,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "batch-123" },
        data: expect.objectContaining({
          status: "FAILED",
          lastError: "Campaign cannot be sent from status: SENT",
        }),
      }),
    );
  });

  it("stops processing when the campaign is cancelled", async () => {
    prismaMock.marketingCampaignBatch.findUnique.mockReset();

    prismaMock.marketingCampaignBatch.findUnique.mockResolvedValue({
      ...batch,
      campaign: {
        ...campaign,
        status: "QUEUED",
      },
    });

    prismaMock.marketingCampaign.findUnique.mockResolvedValue({
      status: "CANCELLED",
    });

    await processMarketingCampaignBatch("batch-123");

    expect(resendMock.emails.send).not.toHaveBeenCalled();

    expect(
      prismaMock.marketingCampaignBatch.update,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "batch-123" },
        data: expect.objectContaining({
          status: "CANCELLED",
        }),
      }),
    );
  });

  it("rejects a batch that does not exist", async () => {
    prismaMock.marketingCampaignBatch.updateMany.mockResolvedValue({
      count: 0,
    });

    prismaMock.marketingCampaignBatch.findUnique.mockReset();
    prismaMock.marketingCampaignBatch.findUnique.mockResolvedValue(null);

    await expect(
      processMarketingCampaignBatch("missing-batch"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(resendMock.emails.send).not.toHaveBeenCalled();
  });

  it("does not process a batch already being handled by another worker", async () => {
    prismaMock.marketingCampaignBatch.updateMany.mockResolvedValue({
      count: 0,
    });

    prismaMock.marketingCampaignBatch.findUnique.mockReset();
    prismaMock.marketingCampaignBatch.findUnique.mockResolvedValue({
      status: "PROCESSING",
    });

    await expect(
      processMarketingCampaignBatch("batch-123"),
    ).rejects.toMatchObject({
      code: "BATCH_BUSY",
    });

    expect(resendMock.emails.send).not.toHaveBeenCalled();
  });
});
