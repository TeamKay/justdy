import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { authMock, prismaMock, audienceMock } = vi.hoisted(() => ({
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
  audienceMock: {
    previewMarketingAudience: vi.fn(),
    getEligibleMarketingContactByEmail: vi.fn(),
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

vi.mock("@/lib/marketing/audience-service", () => ({
  previewMarketingAudience: audienceMock.previewMarketingAudience,
  getEligibleMarketingContactByEmail:
    audienceMock.getEligibleMarketingContactByEmail,
}));

import { GET } from "@/app/api/admin/marketing/campaigns/[id]/audience/route";

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

const bulkCampaign = {
  id: "campaign-123",
  name: "November Mathematics Newsletter",
  kind: "BULK",
  status: "DRAFT",
  individualRecipientEmail: null,
};

const individualCampaign = {
  id: "campaign-456",
  name: "Personal Mathematics Follow-up",
  kind: "INDIVIDUAL",
  status: "DRAFT",
  individualRecipientEmail: "learner@example.com",
};

const bulkAudience = {
  totalContacts: 120,
  eligibleCount: 95,
  excludedCount: 25,
  breakdown: {
    notSubscribed: 4,
    unsubscribed: 8,
    suppressed: 3,
    invalidEmail: 2,
    missingOrWithdrawnConsent: 5,
    accountNotEligible: 3,
  },
};

const eligibleContact = {
  id: "contact-123",
  email: "learner@example.com",
  normalizedEmail: "learner@example.com",
  name: "Learner",
};

function makeRequest() {
  return new NextRequest(
    "http://localhost/api/admin/marketing/campaigns/campaign-123/audience",
  );
}

function makeContext(id = "campaign-123") {
  return {
    params: Promise.resolve({ id }),
  };
}

describe("Marketing campaign audience preview API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    authMock.api.getSession.mockResolvedValue(adminSession);
    prismaMock.marketingCampaign.findUnique.mockResolvedValue(bulkCampaign);
    audienceMock.previewMarketingAudience.mockResolvedValue(bulkAudience);
    audienceMock.getEligibleMarketingContactByEmail.mockResolvedValue(
      eligibleContact,
    );
  });

  it("rejects unauthenticated requests", async () => {
    authMock.api.getSession.mockResolvedValue(null);

    const response = await GET(makeRequest(), makeContext());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
    });
    expect(prismaMock.marketingCampaign.findUnique).not.toHaveBeenCalled();
  });

  it("rejects users who are not administrators", async () => {
    authMock.api.getSession.mockResolvedValue(regularSession);

    const response = await GET(makeRequest(), makeContext());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Administrator access required.",
    });
    expect(prismaMock.marketingCampaign.findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the campaign does not exist", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue(null);

    const response = await GET(makeRequest(), makeContext());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Campaign not found.",
    });
  });

  it("does not preview campaigns that are no longer drafts", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue({
      ...bulkCampaign,
      status: "SENT",
    });

    const response = await GET(makeRequest(), makeContext());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Audience preview is only available for draft campaigns.",
      status: "SENT",
    });
    expect(audienceMock.previewMarketingAudience).not.toHaveBeenCalled();
    expect(
      audienceMock.getEligibleMarketingContactByEmail,
    ).not.toHaveBeenCalled();
  });

  it("returns the current eligible audience for a bulk campaign", async () => {
    const response = await GET(makeRequest(), makeContext());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      campaign: {
        id: bulkCampaign.id,
        name: bulkCampaign.name,
        kind: "BULK",
      },
      audience: bulkAudience,
      previewOnly: true,
      emailsSent: 0,
    });
    expect(audienceMock.previewMarketingAudience).toHaveBeenCalledOnce();
    expect(
      audienceMock.getEligibleMarketingContactByEmail,
    ).not.toHaveBeenCalled();
  });

  it("previews exactly one eligible recipient for an individual campaign", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue(
      individualCampaign,
    );

    const response = await GET(
      makeRequest(),
      makeContext(individualCampaign.id),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(
      audienceMock.getEligibleMarketingContactByEmail,
    ).toHaveBeenCalledWith("learner@example.com");
    expect(audienceMock.previewMarketingAudience).not.toHaveBeenCalled();
    expect(body).toEqual({
      success: true,
      campaign: {
        id: individualCampaign.id,
        name: individualCampaign.name,
        kind: "INDIVIDUAL",
      },
      audience: {
        totalContacts: 1,
        eligibleCount: 1,
        excludedCount: 0,
        breakdown: {
          notSubscribed: 0,
          unsubscribed: 0,
          suppressed: 0,
          invalidEmail: 0,
          missingOrWithdrawnConsent: 0,
          accountNotEligible: 0,
          individualRecipientIneligible: 0,
        },
        recipient: {
          id: eligibleContact.id,
          email: eligibleContact.email,
          name: eligibleContact.name,
          eligible: true,
        },
      },
      previewOnly: true,
      emailsSent: 0,
    });
  });

  it("marks an individual recipient as ineligible when consent or subscription checks fail", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue(
      individualCampaign,
    );
    audienceMock.getEligibleMarketingContactByEmail.mockResolvedValue(null);

    const response = await GET(
      makeRequest(),
      makeContext(individualCampaign.id),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.audience).toEqual({
      totalContacts: 1,
      eligibleCount: 0,
      excludedCount: 1,
      breakdown: {
        notSubscribed: 0,
        unsubscribed: 0,
        suppressed: 0,
        invalidEmail: 0,
        missingOrWithdrawnConsent: 0,
        accountNotEligible: 0,
        individualRecipientIneligible: 1,
      },
      recipient: {
        email: "learner@example.com",
        eligible: false,
      },
    });
    expect(body.previewOnly).toBe(true);
    expect(body.emailsSent).toBe(0);
  });

  it("returns a conflict if an individual campaign has no saved recipient email", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue({
      ...individualCampaign,
      individualRecipientEmail: null,
    });

    const response = await GET(
      makeRequest(),
      makeContext(individualCampaign.id),
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toEqual(expect.any(String));
    expect(
      audienceMock.getEligibleMarketingContactByEmail,
    ).not.toHaveBeenCalled();
  });

  it("returns 500 when audience preview fails", async () => {
    audienceMock.previewMarketingAudience.mockRejectedValue(
      new Error("Database unavailable"),
    );

    const response = await GET(makeRequest(), makeContext());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to preview the marketing audience.",
    });
  });
});
