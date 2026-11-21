import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authMock,
  audienceMock,
  prismaMock,
} = vi.hoisted(() => ({
  authMock: {
    api: {
      getSession: vi.fn(),
    },
  },
  audienceMock: {
    getEligibleMarketingContactByEmail: vi.fn(),
  },
  prismaMock: {
    marketingCampaign: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
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
  getEligibleMarketingContactByEmail:
    audienceMock.getEligibleMarketingContactByEmail,
}));

import {
  GET as listCampaigns,
  POST as createCampaign,
} from "@/app/api/admin/marketing/campaigns/route";

import {
  GET as getCampaign,
  PATCH as updateCampaign,
  DELETE as deleteCampaign,
} from "@/app/api/admin/marketing/campaigns/[id]/route";

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

const sampleCampaign = {
  id: "campaign-123",
  kind: "BULK",
  name: "November Mathematics Newsletter",
  subject: "Improve your mathematics skills",
  htmlContent: "<h1>Welcome to Justdy</h1>",
  textContent: "Welcome to Justdy",
  fromName: "Justdy",
  replyTo: "support@justdy.com",
  status: "DRAFT",
  createdById: "admin-123",
  scheduledAt: null,
  sentAt: null,
  createdAt: new Date("2026-11-20T10:00:00.000Z"),
  updatedAt: new Date("2026-11-20T10:00:00.000Z"),
};

const serializedSampleCampaign = {
  ...sampleCampaign,
  createdAt: sampleCampaign.createdAt.toISOString(),
  updatedAt: sampleCampaign.updatedAt.toISOString(),
};

const validCampaignInput = {
  kind: "BULK",
  name: "November Mathematics Newsletter",
  subject: "Improve your mathematics skills",
  htmlContent: "<h1>Welcome to Justdy</h1>",
  textContent: "Welcome to Justdy",
  fromName: "Justdy",
  replyTo: "support@justdy.com",
};

const eligibleContact = {
  id: "contact-123",
  email: "learner@example.com",
  normalizedEmail: "learner@example.com",
  name: "Test Learner",
};

function makeRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
  } = {},
) {
  return new NextRequest(`http://localhost${url}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
}

function makeContext(id = "campaign-123") {
  return {
    params: Promise.resolve({ id }),
  };
}

describe("Marketing campaign collection API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    authMock.api.getSession.mockResolvedValue(adminSession);

    audienceMock.getEligibleMarketingContactByEmail.mockResolvedValue(
      eligibleContact,
    );

    prismaMock.marketingCampaign.findMany.mockResolvedValue([
      {
        ...sampleCampaign,
        _count: {
          recipients: 0,
        },
      },
    ]);

    prismaMock.marketingCampaign.count.mockResolvedValue(1);

    prismaMock.marketingCampaign.create.mockResolvedValue(
      sampleCampaign,
    );

    prismaMock.marketingCampaign.findUnique.mockResolvedValue(
      sampleCampaign,
    );

    prismaMock.marketingCampaign.updateMany.mockResolvedValue({
      count: 1,
    });

    prismaMock.marketingCampaign.deleteMany.mockResolvedValue({
      count: 1,
    });

    prismaMock.$transaction.mockImplementation(
      async (operations: unknown[]) => Promise.all(operations),
    );
  });

  it("rejects unauthenticated users from listing campaigns", async () => {
    authMock.api.getSession.mockResolvedValue(null);

    const response = await listCampaigns(
      makeRequest("/api/admin/marketing/campaigns"),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
    });

    expect(
      prismaMock.marketingCampaign.findMany,
    ).not.toHaveBeenCalled();
  });

  it("rejects non-administrators from listing campaigns", async () => {
    authMock.api.getSession.mockResolvedValue(regularSession);

    const response = await listCampaigns(
      makeRequest("/api/admin/marketing/campaigns"),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Administrator access required.",
    });
  });

  it("lists campaigns with pagination", async () => {
    const response = await listCampaigns(
      makeRequest("/api/admin/marketing/campaigns?page=1&pageSize=20"),
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      campaigns: [
        {
          ...serializedSampleCampaign,
          _count: {
            recipients: 0,
          },
        },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
    });

    expect(
      prismaMock.marketingCampaign.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
        orderBy: {
          updatedAt: "desc",
        },
      }),
    );
  });

  it("rejects invalid campaign status filters", async () => {
    const response = await listCampaigns(
      makeRequest(
        "/api/admin/marketing/campaigns?status=INVALID",
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid campaign status filter.",
    });

    expect(
      prismaMock.marketingCampaign.findMany,
    ).not.toHaveBeenCalled();
  });

  it("creates a campaign as DRAFT without sending email", async () => {
    const response = await createCampaign(
      makeRequest("/api/admin/marketing/campaigns", {
        method: "POST",
        body: validCampaignInput,
      }),
    );

    expect(response.status).toBe(201);

    expect(await response.json()).toEqual({
      success: true,
      campaign: serializedSampleCampaign,
    });

    expect(
      prismaMock.marketingCampaign.create,
    ).toHaveBeenCalledWith({
      data: {
        ...validCampaignInput,
        status: "DRAFT",
        createdById: "admin-123",
      },
    });

    // Campaign creation must not initiate email delivery.
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("creates an Individual campaign for an eligible recipient", async () => {
    const response = await createCampaign(
      makeRequest("/api/admin/marketing/campaigns", {
        method: "POST",
        body: {
          ...validCampaignInput,
          kind: "INDIVIDUAL",
          individualRecipientEmail: "learner@example.com",
        },
      }),
    );

    expect(response.status).toBe(201);

    expect(
      audienceMock.getEligibleMarketingContactByEmail,
    ).toHaveBeenCalledWith("learner@example.com");

    expect(prismaMock.marketingCampaign.create).toHaveBeenCalledWith({
      data: {
        ...validCampaignInput,
        kind: "INDIVIDUAL",
        individualRecipientEmail: "learner@example.com",
        status: "DRAFT",
        createdById: "admin-123",
      },
    });
  });

  it("rejects an Individual campaign for an ineligible recipient", async () => {
    audienceMock.getEligibleMarketingContactByEmail.mockResolvedValue(null);

    const response = await createCampaign(
      makeRequest("/api/admin/marketing/campaigns", {
        method: "POST",
        body: {
          ...validCampaignInput,
          kind: "INDIVIDUAL",
          individualRecipientEmail: "unknown@example.com",
        },
      }),
    );

    expect(response.status).toBe(400);

    expect(
      prismaMock.marketingCampaign.create,
    ).not.toHaveBeenCalled();
  });

  it("rejects an Individual campaign when the recipient email is missing", async () => {
    const response = await createCampaign(
      makeRequest("/api/admin/marketing/campaigns", {
        method: "POST",
        body: {
          ...validCampaignInput,
          kind: "INDIVIDUAL",
        },
      }),
    );

    expect(response.status).toBe(400);

    expect(
      audienceMock.getEligibleMarketingContactByEmail,
    ).not.toHaveBeenCalled();

    expect(
      prismaMock.marketingCampaign.create,
    ).not.toHaveBeenCalled();
  });

  it("rejects invalid campaign creation data", async () => {
    const response = await createCampaign(
      makeRequest("/api/admin/marketing/campaigns", {
        method: "POST",
        body: {
          ...validCampaignInput,
          subject: "",
        },
      }),
    );

    expect(response.status).toBe(400);

    expect(
      prismaMock.marketingCampaign.create,
    ).not.toHaveBeenCalled();
  });

  it("rejects campaign creation by non-administrators", async () => {
    authMock.api.getSession.mockResolvedValue(regularSession);

    const response = await createCampaign(
      makeRequest("/api/admin/marketing/campaigns", {
        method: "POST",
        body: validCampaignInput,
      }),
    );

    expect(response.status).toBe(403);

    expect(
      prismaMock.marketingCampaign.create,
    ).not.toHaveBeenCalled();
  });
});

describe("Individual marketing campaign API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    authMock.api.getSession.mockResolvedValue(adminSession);

    audienceMock.getEligibleMarketingContactByEmail.mockResolvedValue(
      eligibleContact,
    );

    prismaMock.marketingCampaign.findUnique.mockResolvedValue(
      sampleCampaign,
    );

    prismaMock.marketingCampaign.updateMany.mockResolvedValue({
      count: 1,
    });

    prismaMock.marketingCampaign.deleteMany.mockResolvedValue({
      count: 1,
    });
  });

  it("retrieves an existing campaign", async () => {
    const response = await getCampaign(
      makeRequest("/api/admin/marketing/campaigns/campaign-123"),
      makeContext(),
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      campaign: serializedSampleCampaign,
    });

    expect(
      prismaMock.marketingCampaign.findUnique,
    ).toHaveBeenCalledWith({
      where: {
        id: "campaign-123",
      },
      include: {
        _count: {
          select: {
            recipients: true,
          },
        },
      },
    });
  });

  it("returns 404 when retrieving a missing campaign", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue(null);

    const response = await getCampaign(
      makeRequest("/api/admin/marketing/campaigns/missing"),
      makeContext("missing"),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Campaign not found.",
    });
  });

  it("updates an existing draft campaign", async () => {
    const response = await updateCampaign(
      makeRequest("/api/admin/marketing/campaigns/campaign-123", {
        method: "PATCH",
        body: {
          name: "Updated Mathematics Newsletter",
        },
      }),
      makeContext(),
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      success: true,
      campaign: serializedSampleCampaign,
    });

    expect(
      prismaMock.marketingCampaign.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        id: "campaign-123",
        status: "DRAFT",
      },
      data: {
        name: "Updated Mathematics Newsletter",
      },
    });
  });

  it("updates an Individual campaign recipient after checking eligibility", async () => {
    const response = await updateCampaign(
      makeRequest("/api/admin/marketing/campaigns/campaign-123", {
        method: "PATCH",
        body: {
          kind: "INDIVIDUAL",
          individualRecipientEmail: "learner@example.com",
        },
      }),
      makeContext(),
    );

    expect(response.status).toBe(200);

    expect(
      audienceMock.getEligibleMarketingContactByEmail,
    ).toHaveBeenCalledWith("learner@example.com");

    expect(prismaMock.marketingCampaign.updateMany).toHaveBeenCalledWith({
      where: {
        id: "campaign-123",
        status: "DRAFT",
      },
      data: {
        kind: "INDIVIDUAL",
        individualRecipientEmail: "learner@example.com",
      },
    });
  });

  it("rejects an Individual campaign recipient who is not eligible", async () => {
    audienceMock.getEligibleMarketingContactByEmail.mockResolvedValue(null);

    const response = await updateCampaign(
      makeRequest("/api/admin/marketing/campaigns/campaign-123", {
        method: "PATCH",
        body: {
          kind: "INDIVIDUAL",
          individualRecipientEmail: "unknown@example.com",
        },
      }),
      makeContext(),
    );

    expect(response.status).toBe(400);

    expect(
      prismaMock.marketingCampaign.updateMany,
    ).not.toHaveBeenCalled();
  });

  it("rejects switching a campaign to Individual without a recipient email", async () => {
    const response = await updateCampaign(
      makeRequest("/api/admin/marketing/campaigns/campaign-123", {
        method: "PATCH",
        body: {
          kind: "INDIVIDUAL",
        },
      }),
      makeContext(),
    );

    expect(response.status).toBe(400);

    expect(
      prismaMock.marketingCampaign.updateMany,
    ).not.toHaveBeenCalled();
  });

  it("clears the individual recipient when switching a campaign to Bulk", async () => {
    const response = await updateCampaign(
      makeRequest("/api/admin/marketing/campaigns/campaign-123", {
        method: "PATCH",
        body: {
          kind: "BULK",
        },
      }),
      makeContext(),
    );

    expect(response.status).toBe(200);

    expect(prismaMock.marketingCampaign.updateMany).toHaveBeenCalledWith({
      where: {
        id: "campaign-123",
        status: "DRAFT",
      },
      data: {
        kind: "BULK",
        individualRecipientEmail: null,
      },
    });

    expect(
      audienceMock.getEligibleMarketingContactByEmail,
    ).not.toHaveBeenCalled();
  });

  it("rejects updates with no campaign fields", async () => {
    const response = await updateCampaign(
      makeRequest("/api/admin/marketing/campaigns/campaign-123", {
        method: "PATCH",
        body: {},
      }),
      makeContext(),
    );

    expect(response.status).toBe(400);

    expect(
      prismaMock.marketingCampaign.updateMany,
    ).not.toHaveBeenCalled();
  });

  it("does not update a campaign that is no longer a draft", async () => {
    prismaMock.marketingCampaign.updateMany.mockResolvedValue({
      count: 0,
    });

    prismaMock.marketingCampaign.findUnique.mockResolvedValue({
      id: "campaign-123",
      status: "SENT",
    });

    const response = await updateCampaign(
      makeRequest("/api/admin/marketing/campaigns/campaign-123", {
        method: "PATCH",
        body: {
          name: "Attempted update",
        },
      }),
      makeContext(),
    );

    expect(response.status).toBe(409);

    expect(await response.json()).toEqual({
      error: "Only draft campaigns can be edited.",
      status: "SENT",
    });
  });

  it("returns 404 when updating a missing campaign", async () => {
    prismaMock.marketingCampaign.updateMany.mockResolvedValue({
      count: 0,
    });

    prismaMock.marketingCampaign.findUnique.mockResolvedValue(null);

    const response = await updateCampaign(
      makeRequest("/api/admin/marketing/campaigns/missing", {
        method: "PATCH",
        body: {
          name: "Attempted update",
        },
      }),
      makeContext("missing"),
    );

    expect(response.status).toBe(404);
  });

  it("deletes a draft campaign", async () => {
    const response = await deleteCampaign(
      makeRequest("/api/admin/marketing/campaigns/campaign-123", {
        method: "DELETE",
      }),
      makeContext(),
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      success: true,
      message: "Draft campaign deleted.",
    });

    expect(
      prismaMock.marketingCampaign.deleteMany,
    ).toHaveBeenCalledWith({
      where: {
        id: "campaign-123",
        status: "DRAFT",
      },
    });
  });

  it("does not delete a campaign that is no longer a draft", async () => {
    prismaMock.marketingCampaign.deleteMany.mockResolvedValue({
      count: 0,
    });

    prismaMock.marketingCampaign.findUnique.mockResolvedValue({
      id: "campaign-123",
      status: "SENT",
    });

    const response = await deleteCampaign(
      makeRequest("/api/admin/marketing/campaigns/campaign-123", {
        method: "DELETE",
      }),
      makeContext(),
    );

    expect(response.status).toBe(409);

    expect(await response.json()).toEqual({
      error: "Only draft campaigns can be deleted.",
      status: "SENT",
    });
  });

  it("rejects non-administrators from editing campaigns", async () => {
    authMock.api.getSession.mockResolvedValue(regularSession);

    const response = await updateCampaign(
      makeRequest("/api/admin/marketing/campaigns/campaign-123", {
        method: "PATCH",
        body: {
          name: "Unauthorized update",
        },
      }),
      makeContext(),
    );

    expect(response.status).toBe(403);

    expect(
      prismaMock.marketingCampaign.updateMany,
    ).not.toHaveBeenCalled();
  });

  it("rejects non-administrators from deleting campaigns", async () => {
    authMock.api.getSession.mockResolvedValue(regularSession);

    const response = await deleteCampaign(
      makeRequest("/api/admin/marketing/campaigns/campaign-123", {
        method: "DELETE",
      }),
      makeContext(),
    );

    expect(response.status).toBe(403);

    expect(
      prismaMock.marketingCampaign.deleteMany,
    ).not.toHaveBeenCalled();
  });
});
