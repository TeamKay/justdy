
import "server-only";

import type { MarketingContactSourceType } from "@/lib/generated/prisma/client";
import prisma from "@/lib/prisma";

export interface CaptureMarketingContactInput {
  email: string;
  name?: string | null;

  sourceType: MarketingContactSourceType;
  sourceRecordId: string;
  sourceRole: string;

  /**
   * Only provide userId when the source is tied to a registered account.
   * The service independently verifies that the account email matches.
   */
  userId?: string | null;

  sourceCreatedAt?: Date | null;
}

export interface CapturedMarketingContact {
  contactId: string;
  normalizedEmail: string;
}

/**
 * Normalize and validate an email address before using it as a contact key.
 */
export function normalizeMarketingEmail(email: string): string {
  const normalized = email.trim().toLowerCase();

  if (
    !normalized ||
    normalized.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    throw new Error("A valid email address is required.");
  }

  return normalized;
}

/**
 * Collect a contact address and record its source.
 *
 * This function NEVER grants marketing consent and NEVER changes an
 * existing subscription status.
 */
export async function captureMarketingContact(
  input: CaptureMarketingContactInput,
): Promise<CapturedMarketingContact> {
  const normalizedEmail = normalizeMarketingEmail(input.email);
  const name = input.name?.trim() || undefined;

  if (!input.sourceRecordId.trim()) {
    throw new Error("A source record ID is required.");
  }

  if (!input.sourceRole.trim()) {
    throw new Error("A source role is required.");
  }

  const contact = await prisma.marketingContact.upsert({
    where: { normalizedEmail },
    create: {
      email: normalizedEmail,
      normalizedEmail,
      ...(name ? { name } : {}),
    },
    // Deliberately do not update subscriptionStatus, subscribedAt,
    // unsubscribedAt, suppressedAt, or suppressionReason.
    update: name ? { name } : {},
    select: {
      id: true,
      userId: true,
    },
  });

  // Record the source idempotently. Reprocessing the same source record
  // cannot create duplicate history entries.
  await prisma.marketingContactSource.upsert({
    where: {
      contactId_sourceType_sourceRecordId_sourceRole: {
        contactId: contact.id,
        sourceType: input.sourceType,
        sourceRecordId: input.sourceRecordId,
        sourceRole: input.sourceRole,
      },
    },
    create: {
      contactId: contact.id,
      sourceType: input.sourceType,
      sourceRecordId: input.sourceRecordId,
      sourceRole: input.sourceRole,
      sourceEmail: input.email.trim(),
      sourceName: name ?? null,
      ...(input.sourceCreatedAt
        ? { sourceCreatedAt: input.sourceCreatedAt }
        : {}),
    },
    update: {},
  });

  // A source email must not be linked to a different account merely
  // because that account participated in the same transaction.
  if (input.userId && !contact.userId) {
    const account = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true },
    });

    if (
      account?.email &&
      normalizeMarketingEmail(account.email) === normalizedEmail
    ) {
      const existingContactForUser =
        await prisma.marketingContact.findUnique({
          where: { userId: input.userId },
          select: { id: true },
        });

      if (
        !existingContactForUser ||
        existingContactForUser.id === contact.id
      ) {
        await prisma.marketingContact.updateMany({
          where: {
            id: contact.id,
            userId: null,
          },
          data: {
            userId: input.userId,
          },
        });
      }
    }
  }

  return {
    contactId: contact.id,
    normalizedEmail,
  };
}

/**
 * Use this wrapper in existing signup, booking, and payment flows.
 * A contact-capture failure must not undo a successful business action.
 */
export async function captureMarketingContactSafely(
  input: CaptureMarketingContactInput,
  context: string,
): Promise<void> {
  try {
    await captureMarketingContact(input);
  } catch (error) {
    console.error(`[Marketing contact capture: ${context}]`, error);
  }
}
