
import "server-only";

import prisma from "@/lib/prisma";
import {
  getEligibleMarketingContactByEmail,
  getEligibleMarketingContacts,
  type EligibleMarketingContact,
} from "@/lib/marketing/audience-service";

const RECIPIENTS_PER_BATCH = 100;

export class CampaignPreparationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "NOT_DRAFT"
      | "NO_ELIGIBLE_RECIPIENTS"
      | "INVALID_INDIVIDUAL_RECIPIENT"
      | "PREPARATION_CONFLICT",
  ) {
    super(message);
    this.name = "CampaignPreparationError";
  }
}

export interface CampaignPreparationResult {
  campaignId: string;
  recipientCount: number;
  batchCount: number;
  batchSize: number;
  status: "QUEUED";
}

function chunkContacts(
  contacts: EligibleMarketingContact[],
  size: number,
): EligibleMarketingContact[][] {
  const chunks: EligibleMarketingContact[][] = [];

  for (let index = 0; index < contacts.length; index += size) {
    chunks.push(contacts.slice(index, index + size));
  }

  return chunks;
}

/**
 * Prepare an existing draft campaign for asynchronous delivery.
 *
 * This function:
 * - Recalculates recipient eligibility.
 * - Creates campaign recipient records.
 * - Groups recipients into batches of 100.
 * - Changes the campaign status to QUEUED atomically.
 *
 * It does not send email or publish queue messages.
 */
export async function prepareMarketingCampaign(
  campaignId: string,
): Promise<CampaignPreparationResult> {
  const campaign = await prisma.marketingCampaign.findUnique({
    where: {
      id: campaignId,
    },
    select: {
      id: true,
      kind: true,
      status: true,
      individualRecipientEmail: true,
    },
  });

  if (!campaign) {
    throw new CampaignPreparationError(
      "Campaign not found.",
      "NOT_FOUND",
    );
  }

  if (campaign.status !== "DRAFT") {
    throw new CampaignPreparationError(
      "Only draft campaigns can be prepared for sending.",
      "NOT_DRAFT",
    );
  }

  let contacts: EligibleMarketingContact[];

  if (campaign.kind === "INDIVIDUAL") {
    if (!campaign.individualRecipientEmail) {
      throw new CampaignPreparationError(
        "This individual campaign has no recipient email address.",
        "INVALID_INDIVIDUAL_RECIPIENT",
      );
    }

    const contact = await getEligibleMarketingContactByEmail(
      campaign.individualRecipientEmail,
    );

    if (!contact) {
      throw new CampaignPreparationError(
        "The individual recipient is no longer eligible to receive marketing emails.",
        "NO_ELIGIBLE_RECIPIENTS",
      );
    }

    contacts = [contact];
  } else {
    contacts = await getEligibleMarketingContacts();
  }

  if (contacts.length === 0) {
    throw new CampaignPreparationError(
      "There are no eligible recipients for this campaign.",
      "NO_ELIGIBLE_RECIPIENTS",
    );
  }

  // Keep batch membership predictable between preparation attempts.
  contacts.sort((a, b) =>
    a.normalizedEmail.localeCompare(b.normalizedEmail),
  );

  const batches = chunkContacts(
    contacts,
    RECIPIENTS_PER_BATCH,
  );

  // Everything below is committed together or rolled back together.
  await prisma.$transaction(async (tx) => {
    // This conditional update prevents two requests from preparing
    // the same draft campaign concurrently.
    const claim = await tx.marketingCampaign.updateMany({
      where: {
        id: campaignId,
        status: "DRAFT",
      },
      data: {
        status: "QUEUED",
      },
    });

    if (claim.count !== 1) {
      throw new CampaignPreparationError(
        "This campaign has already been prepared or changed.",
        "PREPARATION_CONFLICT",
      );
    }

    for (let index = 0; index < batches.length; index += 1) {
      const batchContacts = batches[index];

      const batch = await tx.marketingCampaignBatch.create({
        data: {
          campaignId,
          sequence: index + 1,
          status: "PENDING",
          recipientCount: batchContacts.length,
        },
        select: {
          id: true,
        },
      });

      await tx.marketingCampaignRecipient.createMany({
        data: batchContacts.map((contact) => ({
          campaignId,
          contactId: contact.id,
          emailSnapshot: contact.email,
          nameSnapshot: contact.name,
          status: "PENDING",
          batchId: batch.id,
        })),
      });
    }
  });

  return {
    campaignId,
    recipientCount: contacts.length,
    batchCount: batches.length,
    batchSize: RECIPIENTS_PER_BATCH,
    status: "QUEUED",
  };
}
