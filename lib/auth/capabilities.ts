// lib/auth/capabilities.ts

import prisma from "@/lib/prisma";

export const CAPABILITIES = {
  LEARN: "CAN_LEARN",
  TEACH: "CAN_TEACH",
  TUTOR: "CAN_TUTOR",
  BOOK_TUTORING: "CAN_BOOK_TUTORING",
  RECEIVE_PAYOUTS: "CAN_RECEIVE_PAYOUTS",
  CREATE_RESOURCES: "CAN_CREATE_RESOURCES",
  PUBLISH: "CAN_PUBLISH",
  SELL: "CAN_SELL",
} as const;

export type CapabilityKey =
  (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

export async function ensureCapabilities(
  userId: string,
  keys: readonly CapabilityKey[],
): Promise<void> {
  if (!userId || keys.length === 0) return;

  const definitions: Record<CapabilityKey, { name: string; description: string }> = {
    [CAPABILITIES.LEARN]: {
      name: "Learn",
      description: "Can participate as a learner.",
    },
    [CAPABILITIES.TEACH]: {
      name: "Teach",
      description: "Can maintain and use a teaching profile.",
    },
    [CAPABILITIES.TUTOR]: {
      name: "Tutor",
      description: "Can provide paid tutoring when otherwise verified.",
    },
    [CAPABILITIES.BOOK_TUTORING]: {
      name: "Book Tutoring",
      description: "Can initiate tutoring bookings.",
    },
    [CAPABILITIES.RECEIVE_PAYOUTS]: {
      name: "Receive Payouts",
      description: "Can receive tutor payout processing.",
    },
    [CAPABILITIES.CREATE_RESOURCES]: {
      name: "Create Resources",
      description: "Can create educational resources.",
    },
    [CAPABILITIES.PUBLISH]: {
      name: "Publish",
      description: "Can publish eligible educational resources.",
    },
    [CAPABILITIES.SELL]: {
      name: "Sell",
      description: "Can sell eligible educational products/resources.",
    },
  };

  const uniqueKeys = [...new Set(keys)];

  for (const key of uniqueKeys) {
    const definition = definitions[key];

    const capability = await prisma.capability.upsert({
      where: { key },
      update: {},
      create: definition ? { key, ...definition } : {
        key,
        name: key,
        description: null,
      },
      select: { id: true },
    });

    await prisma.userCapability.upsert({
      where: {
        userId_capabilityId: {
          userId,
          capabilityId: capability.id,
        },
      },
      update: {},
      create: {
        userId,
        capabilityId: capability.id,
      },
    });
  }
}

export async function hasCapability(
  userId: string,
  key: CapabilityKey,
): Promise<boolean> {
  if (!userId || !key) {
    return false;
  }

  const capability = await prisma.capability.findUnique({
    where: {
      key,
    },
    select: {
      id: true,
    },
  });

  if (!capability) {
    return false;
  }

  const assignment = await prisma.userCapability.findUnique({
    where: {
      userId_capabilityId: {
        userId,
        capabilityId: capability.id,
      },
    },
    select: {
      userId: true,
    },
  });

  return Boolean(assignment);
}


export async function hasAnyCapability(
  userId: string,
  keys: readonly CapabilityKey[],
): Promise<boolean> {
  if (!userId || keys.length === 0) {
    return false;
  }

  const capabilities = await prisma.capability.findMany({
    where: {
      key: {
        in: [...keys],
      },
    },
    select: {
      id: true,
    },
  });

  if (capabilities.length === 0) {
    return false;
  }

  const assignment = await prisma.userCapability.findFirst({
    where: {
      userId,
      capabilityId: {
        in: capabilities.map((capability) => capability.id),
      },
    },
    select: {
      userId: true,
    },
  });

  return Boolean(assignment);
}


export async function requireCapability(
  userId: string,
  key: CapabilityKey,
): Promise<true> {
  const allowed = await hasCapability(userId, key);

  if (!allowed) {
    throw new Error(`Missing capability: ${key}`);
  }

  return true;
}

/**
 * Require at least one capability from a list.
 *
 * Useful when multiple capabilities can authorize the same
 * operation.
 */
export async function requireAnyCapability(
  userId: string,
  keys: readonly CapabilityKey[],
): Promise<true> {
  const allowed = await hasAnyCapability(userId, keys);

  if (!allowed) {
    throw new Error(
      `Missing required capability. Expected one of: ${keys.join(", ")}`,
    );
  }

  return true;
}

/**
 * Check whether the user can learn.
 *
 * A user does not need to have a "Learner" role.
 *
 * Teachers, parents, tutors, creators, and other users may
 * also be learners when CAN_LEARN is assigned.
 */
export async function canLearn(userId: string): Promise<boolean> {
  return hasCapability(userId, CAPABILITIES.LEARN);
}

/**
 * Check whether the user can manage children/family learners.
 */


/**
 * Check whether the user can enter the teaching workflow.
 *
 * CAN_TEACH means the user is allowed to operate through the
 * teaching workflow and maintain/use a teaching profile.
 *
 * It does NOT automatically mean the user can provide paid
 * tutoring.
 *
 * Paid tutoring additionally requires:
 *
 * - active account
 * - TeachingProfile
 * - verified TeachingProfile
 * - CAN_TUTOR
 */
export async function canTeach(userId: string): Promise<boolean> {
  return hasCapability(userId, CAPABILITIES.TEACH);
}

/**
 * Check whether the user can provide paid tutoring.
 *
 * This capability alone is not sufficient to expose a tutor
 * to customers.
 *
 * Tutor authorization must additionally verify the tutor's
 * account status and TeachingProfile verification state.
 */
export async function canTutor(userId: string): Promise<boolean> {
  return hasCapability(userId, CAPABILITIES.TUTOR);
}

/**
 * Check whether the user can book tutoring.
 *
 * This capability describes the ability to initiate a tutoring
 * booking.
 *
 * It does NOT determine who the learner is in the booking.
 * That is handled by the booking/family relationship layer.
 */
export async function canBookTutoring(
  userId: string,
): Promise<boolean> {
  return hasCapability(userId, CAPABILITIES.BOOK_TUTORING);
}

/**
 * Check whether the user can receive tutor payouts.
 */
export async function canReceivePayouts(
  userId: string,
): Promise<boolean> {
  return hasCapability(userId, CAPABILITIES.RECEIVE_PAYOUTS);
}

/**
 * Check whether the user can create educational resources.
 */
export async function canCreateResources(
  userId: string,
): Promise<boolean> {
  return hasCapability(userId, CAPABILITIES.CREATE_RESOURCES);
}

/**
 * Check whether the user can publish resources.
 */
export async function canPublish(userId: string): Promise<boolean> {
  return hasCapability(userId, CAPABILITIES.PUBLISH);
}

/**
 * Check whether the user can sell resources.
 */
export async function canSell(userId: string): Promise<boolean> {
  return hasCapability(userId, CAPABILITIES.SELL);
}