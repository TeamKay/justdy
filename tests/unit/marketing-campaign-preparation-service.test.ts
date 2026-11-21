
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  transactionMock,
  audienceMock,
} = vi.hoisted(() => {
  const transactionMock = {
    marketingCampaign: {
      updateMany: vi.fn(),
    },
    marketingCampaignBatch: {
      create: vi.fn(),
    },
    marketingCampaignRecipient: {
      createMany: vi.fn(),
    },
  };

  return {
    transactionMock,
    prismaMock: {
      marketingCampaign: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    },
    audienceMock: {
      getEligibleMarketingContacts: vi.fn(),
      getEligibleMarketingContactByEmail: vi.fn(),
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/marketing/audience-service", () => ({
  getEligibleMarketingContacts:
    audienceMock.getEligibleMarketingContacts,
  getEligibleMarketingContactByEmail:
    audienceMock.getEligibleMarketingContactByEmail,
}));

import {
  CampaignPreparationError,
  prepareMarketingCampaign,
} from "@/lib/marketing/campaign-preparation-service";

const bulkCampaign = {
  id: "campaign-123",
  kind: "BULK",
  status: "DRAFT",
  individualRecipientEmail: null,
};

const individualCampaign = {
  id: "campaign-456",
  kind: "INDIVIDUAL",
  status: "DRAFT",
  individualRecipientEmail: "learner@example.com",
};

function makeContact(index: number) {
  const email = `learner${String(index).padStart(3, "0")}@example.com`;

  return {
    id: `contact-${index}`,
    email,
    normalizedEmail: email,
    name: `Learner ${index}`,
  };
}

describe("Marketing campaign preparation service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.marketingCampaign.findUnique.mockResolvedValue(
      bulkCampaign,
    );

    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof transactionMock) => unknown) =>
        callback(transactionMock),
    );

    transactionMock.marketingCampaign.updateMany.mockResolvedValue({
      count: 1,
    });

    transactionMock.marketingCampaignBatch.create.mockImplementation(
      async ({ data }: { data: { sequence: number } }) => ({
        id: `batch-${data.sequence}`,
      }),
    );

    transactionMock.marketingCampaignRecipient.createMany.mockImplementation(
      async ({ data }: { data: unknown[] }) => ({
        count: data.length,
      }),
    );

    audienceMock.getEligibleMarketingContacts.mockResolvedValue([
      makeContact(1),
      makeContact(2),
    ]);

    audienceMock.getEligibleMarketingContactByEmail.mockResolvedValue(
      makeContact(1),
    );
  });

  it("prepares a bulk campaign in batches of 100", async () => {
    const contacts = Array.from(
      { length: 205 },
      (_, index) => makeContact(index + 1),
    );

    audienceMock.getEligibleMarketingContacts.mockResolvedValue(
      contacts,
    );

    const result = await prepareMarketingCampaign("campaign-123");

    expect(result).toEqual({
      campaignId: "campaign-123",
      recipientCount: 205,
      batchCount: 3,
      batchSize: 100,
      status: "QUEUED",
    });

    expect(
      transactionMock.marketingCampaign.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        id: "campaign-123",
        status: "DRAFT",
      },
      data: {
        status: "QUEUED",
      },
    });

    expect(
      transactionMock.marketingCampaignBatch.create,
    ).toHaveBeenCalledTimes(3);

    expect(
      transactionMock.marketingCampaignRecipient.createMany,
    ).toHaveBeenCalledTimes(3);

    const recipientCalls =
      transactionMock.marketingCampaignRecipient.createMany.mock.calls;

    expect(recipientCalls[0][0].data).toHaveLength(100);
    expect(recipientCalls[1][0].data).toHaveLength(100);
    expect(recipientCalls[2][0].data).toHaveLength(5);

    expect(recipientCalls[0][0].data[0]).toMatchObject({
      campaignId: "campaign-123",
      contactId: "contact-1",
      emailSnapshot: "learner001@example.com",
      status: "PENDING",
      batchId: "batch-1",
    });
  });

  it("prepares an individual campaign with exactly one recipient", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue(
      individualCampaign,
    );

    const result = await prepareMarketingCampaign("campaign-456");

    expect(
      audienceMock.getEligibleMarketingContactByEmail,
    ).toHaveBeenCalledWith("learner@example.com");

    expect(
      audienceMock.getEligibleMarketingContacts,
    ).not.toHaveBeenCalled();

    expect(result).toEqual({
      campaignId: "campaign-456",
      recipientCount: 1,
      batchCount: 1,
      batchSize: 100,
      status: "QUEUED",
    });

    expect(
      transactionMock.marketingCampaignRecipient.createMany,
    ).toHaveBeenCalledWith({
      data: [
        {
          campaignId: "campaign-456",
          contactId: "contact-1",
          emailSnapshot: "learner001@example.com",
          nameSnapshot: "Learner 1",
          status: "PENDING",
          batchId: "batch-1",
        },
      ],
    });
  });

  it("rejects a campaign that does not exist", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue(null);

    await expect(
      prepareMarketingCampaign("missing-campaign"),
    ).rejects.toMatchObject({
      name: "CampaignPreparationError",
      code: "NOT_FOUND",
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a campaign that is no longer a draft", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue({
      ...bulkCampaign,
      status: "SENT",
    });

    await expect(
      prepareMarketingCampaign("campaign-123"),
    ).rejects.toMatchObject({
      code: "NOT_DRAFT",
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("does not prepare a bulk campaign with no eligible recipients", async () => {
    audienceMock.getEligibleMarketingContacts.mockResolvedValue([]);

    await expect(
      prepareMarketingCampaign("campaign-123"),
    ).rejects.toMatchObject({
      code: "NO_ELIGIBLE_RECIPIENTS",
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("does not prepare an individual campaign if the recipient is no longer eligible", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue(
      individualCampaign,
    );

    audienceMock.getEligibleMarketingContactByEmail.mockResolvedValue(
      null,
    );

    await expect(
      prepareMarketingCampaign("campaign-456"),
    ).rejects.toMatchObject({
      code: "NO_ELIGIBLE_RECIPIENTS",
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an individual campaign without a recipient email", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue({
      ...individualCampaign,
      individualRecipientEmail: null,
    });

    await expect(
      prepareMarketingCampaign("campaign-456"),
    ).rejects.toMatchObject({
      code: "INVALID_INDIVIDUAL_RECIPIENT",
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("prevents concurrent requests from preparing the same campaign twice", async () => {
    transactionMock.marketingCampaign.updateMany.mockResolvedValue({
      count: 0,
    });

    await expect(
      prepareMarketingCampaign("campaign-123"),
    ).rejects.toMatchObject({
      code: "PREPARATION_CONFLICT",
    });

    expect(
      transactionMock.marketingCampaignBatch.create,
    ).not.toHaveBeenCalled();

    expect(
      transactionMock.marketingCampaignRecipient.createMany,
    ).not.toHaveBeenCalled();
  });

  it("does not create batches for an individual campaign with no eligible recipient", async () => {
    prismaMock.marketingCampaign.findUnique.mockResolvedValue(
      individualCampaign,
    );

    audienceMock.getEligibleMarketingContactByEmail.mockResolvedValue(
      null,
    );

    await expect(
      prepareMarketingCampaign("campaign-456"),
    ).rejects.toBeInstanceOf(CampaignPreparationError);

    expect(
      transactionMock.marketingCampaignBatch.create,
    ).not.toHaveBeenCalled();
  });
});
