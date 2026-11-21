
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { envMock, prismaMock, resendMock } = vi.hoisted(() => ({
  envMock: {
    RESEND_WEBHOOK_SECRET: "test-webhook-secret",
  },
  resendMock: {
    webhooks: {
      verify: vi.fn(),
    },
  },
  prismaMock: {
    marketingContact: {
      updateMany: vi.fn(),
    },
    marketingCampaignRecipient: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    marketingEmailEvent: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({ env: envMock }));
vi.mock("@/lib/resend", () => ({ resend: resendMock }));
vi.mock("@/lib/prisma", () => ({ default: prismaMock }));

vi.mock("@/lib/marketing/contact-service", () => ({
  normalizeMarketingEmail: (email: string) => {
    const normalized = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error("A valid email address is required.");
    }

    return normalized;
  },
}));

import { POST } from "@/app/api/webhooks/resend/route";

const webhookHeaders = {
  "svix-id": "msg_test_123",
  "svix-timestamp": "1795200000",
  "svix-signature": "test-signature",
};

const emailData = {
  email_id: "resend-email-123",
  to: ["Person@Example.com"],
};

const eventDate = "2026-11-20T15:00:00.000Z";

const matchedRecipient = {
  id: "recipient-123",
  emailSnapshot: "Person@Example.com",
};

function makeEvent(
  type:
    | "email.delivered"
    | "email.delivery_delayed"
    | "email.bounced"
    | "email.complained",
  extraData: Record<string, unknown> = {},
) {
  return {
    type,
    created_at: eventDate,
    data: {
      ...emailData,
      ...extraData,
    },
  };
}

function makeBounceEvent(bounceType: string) {
  return {
    type: "email.bounced",
    created_at: eventDate,
    data: {
      ...emailData,
      bounce: {
        type: bounceType,
        subType: "general",
        message: "Test bounce message",
      },
    },
  };
}

function makeRequest(headers: Record<string, string> = webhookHeaders) {
  return new NextRequest("http://localhost/api/webhooks/resend", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ test: true }),
  });
}

function setVerifiedEvent(event: unknown) {
  resendMock.webhooks.verify.mockReturnValue(event);
}

describe("Resend webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    envMock.RESEND_WEBHOOK_SECRET = "test-webhook-secret";

    resendMock.webhooks.verify.mockReturnValue(
      makeEvent("email.delivered"),
    );

    prismaMock.marketingContact.updateMany.mockResolvedValue({ count: 1 });

    prismaMock.marketingCampaignRecipient.findUnique.mockResolvedValue(
      matchedRecipient,
    );

    prismaMock.marketingCampaignRecipient.updateMany.mockResolvedValue({
      count: 1,
    });

    prismaMock.marketingEmailEvent.createMany.mockResolvedValue({ count: 1 });

    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
        callback(prismaMock),
    );
  });

  it("returns 500 when the webhook secret is not configured", async () => {
    envMock.RESEND_WEBHOOK_SECRET = "";

    const response = await POST(makeRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Webhook is not configured.",
    });
    expect(resendMock.webhooks.verify).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects requests missing Svix signature headers", async () => {
    const response = await POST(
      makeRequest({ "svix-id": webhookHeaders["svix-id"] }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Missing webhook signature headers.",
    });
    expect(resendMock.webhooks.verify).not.toHaveBeenCalled();
  });

  it("rejects invalid webhook signatures", async () => {
    resendMock.webhooks.verify.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid webhook signature.",
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("records a delivered event using the Resend message ID fallback", async () => {
    setVerifiedEvent(makeEvent("email.delivered"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      received: true,
      processed: 1,
    });

    expect(resendMock.webhooks.verify).toHaveBeenCalledWith({
      payload: JSON.stringify({ test: true }),
      headers: {
        id: webhookHeaders["svix-id"],
        timestamp: webhookHeaders["svix-timestamp"],
        signature: webhookHeaders["svix-signature"],
      },
      webhookSecret: "test-webhook-secret",
    });

    expect(
      prismaMock.marketingCampaignRecipient.findUnique,
    ).toHaveBeenCalledWith({
      where: { resendMessageId: "resend-email-123" },
      select: {
        id: true,
        emailSnapshot: true,
      },
    });

    expect(prismaMock.marketingEmailEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          recipientId: "recipient-123",
          provider: "RESEND",
          providerEventId: "msg_test_123:person@example.com",
          eventType: "email.delivered",
          occurredAt: new Date(eventDate),
        }),
      ],
      skipDuplicates: true,
    });

    expect(
      prismaMock.marketingCampaignRecipient.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        id: "recipient-123",
        status: { notIn: ["COMPLAINED", "BOUNCED"] },
      },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(eventDate),
      },
    });

    expect(prismaMock.marketingContact.updateMany).not.toHaveBeenCalled();
  });

  it("uses the marketing recipient tag as the primary correlation method", async () => {
    setVerifiedEvent(
      makeEvent("email.delivered", {
        tags: {
          marketing_recipient_id: "recipient-123",
        },
      }),
    );

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);

    expect(
      prismaMock.marketingCampaignRecipient.findUnique,
    ).toHaveBeenCalledWith({
      where: { id: "recipient-123" },
      select: {
        id: true,
        emailSnapshot: true,
      },
    });

    expect(
      prismaMock.marketingCampaignRecipient.findUnique,
    ).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: { resendMessageId: expect.any(String) },
      }),
    );

    expect(prismaMock.marketingEmailEvent.createMany).toHaveBeenCalled();
  });

  it("correlates a tagged recipient even when the message ID has not been saved yet", async () => {
    setVerifiedEvent(
      makeEvent("email.delivered", {
        tags: {
          marketing_recipient_id: "recipient-123",
        },
      }),
    );

    // The recipient exists by its database ID, but has no saved
    // Resend message ID yet. The tag still identifies it.
    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(
      prismaMock.marketingCampaignRecipient.findUnique,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "recipient-123" },
      }),
    );
    expect(prismaMock.marketingEmailEvent.createMany).toHaveBeenCalled();
  });

  it("does not associate a tagged recipient when its email snapshot does not match", async () => {
    setVerifiedEvent(
      makeEvent("email.delivered", {
        tags: {
          marketing_recipient_id: "recipient-123",
        },
      }),
    );

    prismaMock.marketingCampaignRecipient.findUnique.mockResolvedValue({
      id: "recipient-123",
      emailSnapshot: "someone-else@example.com",
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(prismaMock.marketingEmailEvent.createMany).not.toHaveBeenCalled();
    expect(
      prismaMock.marketingCampaignRecipient.updateMany,
    ).not.toHaveBeenCalled();

    // A mismatched tag must not fall back to a different recipient.
    expect(
      prismaMock.marketingCampaignRecipient.findUnique,
    ).toHaveBeenCalledTimes(1);
  });

  it("does not associate a tagged event when the tagged recipient does not exist", async () => {
    setVerifiedEvent(
      makeEvent("email.delivered", {
        tags: {
          marketing_recipient_id: "missing-recipient",
        },
      }),
    );

    prismaMock.marketingCampaignRecipient.findUnique.mockResolvedValue(null);

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(prismaMock.marketingEmailEvent.createMany).not.toHaveBeenCalled();
    expect(
      prismaMock.marketingCampaignRecipient.updateMany,
    ).not.toHaveBeenCalled();
  });

  it("records delivery delays without changing campaign status", async () => {
    setVerifiedEvent(makeEvent("email.delivery_delayed"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(prismaMock.marketingEmailEvent.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            eventType: "email.delivery_delayed",
          }),
        ],
        skipDuplicates: true,
      }),
    );

    expect(
      prismaMock.marketingCampaignRecipient.updateMany,
    ).not.toHaveBeenCalled();
    expect(prismaMock.marketingContact.updateMany).not.toHaveBeenCalled();
  });

  it("records temporary bounces without suppressing contacts", async () => {
    setVerifiedEvent(makeBounceEvent("temporary"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(prismaMock.marketingEmailEvent.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            eventType: "email.bounced",
            payload: expect.objectContaining({
              emailId: "resend-email-123",
              bounce: {
                type: "temporary",
                subType: "general",
                message: "Test bounce message",
              },
            }),
          }),
        ],
      }),
    );

    expect(prismaMock.marketingContact.updateMany).not.toHaveBeenCalled();
    expect(
      prismaMock.marketingCampaignRecipient.updateMany,
    ).not.toHaveBeenCalled();
  });

  it("suppresses contacts and marks campaign recipients BOUNCED for permanent bounces", async () => {
    setVerifiedEvent(makeBounceEvent("permanent"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(prismaMock.marketingContact.updateMany).toHaveBeenCalledWith({
      where: {
        normalizedEmail: "person@example.com",
        subscriptionStatus: { not: "SUPPRESSED" },
      },
      data: {
        subscriptionStatus: "SUPPRESSED",
        suppressedAt: expect.any(Date),
        suppressionReason: "RESEND_HARD_BOUNCE",
      },
    });

    expect(
      prismaMock.marketingCampaignRecipient.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        id: "recipient-123",
        status: { notIn: ["COMPLAINED", "BOUNCED"] },
      },
      data: { status: "BOUNCED" },
    });
  });

  it("suppresses contacts and marks campaign recipients COMPLAINED for spam complaints", async () => {
    setVerifiedEvent(makeEvent("email.complained"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(prismaMock.marketingContact.updateMany).toHaveBeenCalledWith({
      where: {
        normalizedEmail: "person@example.com",
        subscriptionStatus: { not: "SUPPRESSED" },
      },
      data: {
        subscriptionStatus: "SUPPRESSED",
        suppressedAt: expect.any(Date),
        suppressionReason: "RESEND_SPAM_COMPLAINT",
      },
    });

    expect(
      prismaMock.marketingCampaignRecipient.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        id: "recipient-123",
        status: { not: "COMPLAINED" },
      },
      data: { status: "COMPLAINED" },
    });
  });

  it("suppresses a contact even when the email is not linked to a campaign", async () => {
    setVerifiedEvent(makeEvent("email.complained"));

    prismaMock.marketingCampaignRecipient.findUnique.mockResolvedValue(null);

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(prismaMock.marketingContact.updateMany).toHaveBeenCalled();
    expect(prismaMock.marketingEmailEvent.createMany).not.toHaveBeenCalled();
    expect(
      prismaMock.marketingCampaignRecipient.updateMany,
    ).not.toHaveBeenCalled();
  });

  it("handles duplicate webhook deliveries using skipDuplicates", async () => {
    setVerifiedEvent(makeEvent("email.delivered"));

    const firstResponse = await POST(makeRequest());
    const secondResponse = await POST(makeRequest());

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(prismaMock.marketingEmailEvent.createMany).toHaveBeenCalledTimes(2);

    const firstCall =
      prismaMock.marketingEmailEvent.createMany.mock.calls[0][0];
    const secondCall =
      prismaMock.marketingEmailEvent.createMany.mock.calls[1][0];

    expect(firstCall.skipDuplicates).toBe(true);
    expect(secondCall.skipDuplicates).toBe(true);
    expect(firstCall.data[0].providerEventId).toBe(
      secondCall.data[0].providerEventId,
    );
    expect(firstCall.data[0].providerEventId).toBe(
      "msg_test_123:person@example.com",
    );
  });

  it("normalizes and deduplicates multiple recipient email addresses", async () => {
    setVerifiedEvent({
      ...makeEvent("email.delivered"),
      data: {
        email_id: "resend-email-123",
        to: [
          "Person@Example.com",
          " person@example.com ",
          "invalid-email",
        ],
      },
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      received: true,
      processed: 1,
    });
    expect(prismaMock.marketingEmailEvent.createMany).toHaveBeenCalledTimes(1);
  });
});
