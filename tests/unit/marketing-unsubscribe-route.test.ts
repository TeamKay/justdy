import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    marketingContact: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    marketingConsentEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/marketing/unsubscribe-token", () => ({
  hashMarketingUnsubscribeToken: vi.fn(
    (token: string) => `hash:${token}`,
  ),
}));

import {
  GET,
  POST,
} from "@/app/api/marketing/unsubscribe/route";

const token = "a".repeat(64);

const subscribedContact = {
  id: "contact-1",
  normalizedEmail: "person@example.com",
  subscriptionStatus: "SUBSCRIBED",
};

function makeGetRequest(value = token) {
  return new NextRequest(
    `http://localhost/api/marketing/unsubscribe?token=${value}`,
  );
}

function makePostRequest(
  body: string,
  contentType = "application/x-www-form-urlencoded",
) {
  return new NextRequest(
    `http://localhost/api/marketing/unsubscribe?token=${token}`,
    {
      method: "POST",
      headers: {
        "content-type": contentType,
      },
      body,
    },
  );
}

describe("marketing unsubscribe route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.marketingContact.findUnique.mockResolvedValue(
      subscribedContact,
    );

    prismaMock.marketingContact.updateMany.mockResolvedValue({
      count: 1,
    });

    prismaMock.marketingConsentEvent.create.mockResolvedValue({});

    prismaMock.$transaction.mockImplementation(
      async (
        callback: (tx: typeof prismaMock) => Promise<unknown>,
      ) => callback(prismaMock),
    );
  });

  it("rejects an invalid GET token without querying the database", async () => {
    const response = await GET(makeGetRequest("invalid"));

    expect(response.status).toBe(400);
    expect(prismaMock.marketingContact.findUnique).not.toHaveBeenCalled();
  });

  it("shows a confirmation page without unsubscribing on GET", async () => {
    const response = await GET(makeGetRequest());
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Unsubscribe from Justdy emails?");
    expect(html).toContain('name="confirm"');
    expect(prismaMock.marketingContact.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.marketingConsentEvent.create).not.toHaveBeenCalled();
  });

  it("returns an already-unsubscribed page on GET", async () => {
    prismaMock.marketingContact.findUnique.mockResolvedValue({
      subscriptionStatus: "UNSUBSCRIBED",
    });

    const response = await GET(makeGetRequest());
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Already unsubscribed");
    expect(prismaMock.marketingContact.updateMany).not.toHaveBeenCalled();
  });

  it("withdraws consent and records an event after browser confirmation", async () => {
    const response = await POST(
      makePostRequest("confirm=unsubscribe"),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("You have been unsubscribed");

    expect(prismaMock.marketingContact.updateMany).toHaveBeenCalledWith({
      where: {
        id: "contact-1",
        unsubscribeTokenHash: `hash:${token}`,
        subscriptionStatus: "SUBSCRIBED",
      },
      data: expect.objectContaining({
        subscriptionStatus: "UNSUBSCRIBED",
        unsubscribedAt: expect.any(Date),
      }),
    });

    expect(prismaMock.marketingConsentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contactId: "contact-1",
        action: "WITHDRAWN",
        authorizationType: "SELF",
        channel: "EMAIL",
        method: "UNSUBSCRIBE_CONFIRMATION_PAGE",
        consentGivenByEmail: "person@example.com",
      }),
    });
  });

  it("supports the email provider one-click unsubscribe request", async () => {
    const response = await POST(
      makePostRequest("List-Unsubscribe=One-Click"),
    );

    expect(response.status).toBe(200);

    expect(prismaMock.marketingConsentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "WITHDRAWN",
        method: "EMAIL_ONE_CLICK_UNSUBSCRIBE",
        evidenceMetadata: expect.objectContaining({
          oneClick: true,
        }),
      }),
    });
  });

  it("rejects POST requests without unsubscribe confirmation", async () => {
    const response = await POST(makePostRequest("other=value"));

    expect(response.status).toBe(400);
    expect(prismaMock.marketingContact.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.marketingConsentEvent.create).not.toHaveBeenCalled();
  });

  it("rejects invalid POST tokens", async () => {
    const request = new NextRequest(
      "http://localhost/api/marketing/unsubscribe?token=invalid",
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: "confirm=unsubscribe",
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(prismaMock.marketingContact.findUnique).not.toHaveBeenCalled();
  });

  it("does not create another withdrawal event for an already-unsubscribed contact", async () => {
    prismaMock.marketingContact.findUnique.mockResolvedValue({
      ...subscribedContact,
      subscriptionStatus: "UNSUBSCRIBED",
    });

    const response = await POST(
      makePostRequest("confirm=unsubscribe"),
    );

    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Already unsubscribed");
    expect(prismaMock.marketingContact.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.marketingConsentEvent.create).not.toHaveBeenCalled();
  });

  it("does not change a suppressed contact", async () => {
    prismaMock.marketingContact.findUnique.mockResolvedValue({
      ...subscribedContact,
      subscriptionStatus: "SUPPRESSED",
    });

    const response = await POST(
      makePostRequest("confirm=unsubscribe"),
    );

    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("not eligible");
    expect(prismaMock.marketingContact.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.marketingConsentEvent.create).not.toHaveBeenCalled();
  });
});
