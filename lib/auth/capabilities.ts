import "server-only";
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

export type CapabilityKey = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

type UserAuthorization = {
  role: string;
  status: string;
  teachingProfile: { verificationStatus: string } | null;
};

async function getAuthorizationUser(
  userId: string,
): Promise<UserAuthorization | null> {
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      status: true,
      teachingProfile: {
        select: { verificationStatus: true },
      },
    },
  });

  if (!user) return null;

  return {
    role: String(user.role),
    status: String(user.status),
    teachingProfile: user.teachingProfile
      ? {
          verificationStatus: String(user.teachingProfile.verificationStatus),
        }
      : null,
  };
}

export async function ensureCapabilities(
  userId: string,
  _keys: readonly CapabilityKey[],
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error(`Cannot authorize user ${userId}: user not found.`);
  }
}

export async function hasCapability(
  userId: string,
  key: CapabilityKey,
): Promise<boolean> {
  const user = await getAuthorizationUser(userId);

  if (!user || user.status !== "Active") return false;

  const isVerifiedTutor =
    user.teachingProfile?.verificationStatus === "Verified";

  switch (key) {
    case CAPABILITIES.LEARN:
    case CAPABILITIES.BOOK_TUTORING:
      return user.role === "LEARNER" || user.role === "TUTOR";

    case CAPABILITIES.TEACH:
    case CAPABILITIES.TUTOR:
      return (
        (user.role === "TUTOR" || user.role === "ADMIN") && isVerifiedTutor
      );

    case CAPABILITIES.RECEIVE_PAYOUTS:
      return user.role === "TUTOR" && isVerifiedTutor;

    case CAPABILITIES.CREATE_RESOURCES:
    case CAPABILITIES.PUBLISH:
    case CAPABILITIES.SELL:
      // These permissions have no equivalent in the current database schema.
      // Deny by default rather than granting unverified access.
      return false;

    default:
      return false;
  }
}

export async function hasAnyCapability(
  userId: string,
  keys: readonly CapabilityKey[],
): Promise<boolean> {
  for (const key of keys) {
    if (await hasCapability(userId, key)) return true;
  }

  return false;
}

export async function requireCapability(
  userId: string,
  key: CapabilityKey,
): Promise<true> {
  if (!(await hasCapability(userId, key))) {
    throw new Error(`Missing capability: ${key}`);
  }

  return true;
}

export async function requireAnyCapability(
  userId: string,
  keys: readonly CapabilityKey[],
): Promise<true> {
  if (!(await hasAnyCapability(userId, keys))) {
    throw new Error(
      `Missing required capability. Expected one of: ${keys.join(", ")}`,
    );
  }

  return true;
}

export async function canLearn(userId: string): Promise<boolean> {
  return hasCapability(userId, CAPABILITIES.LEARN);
}

export async function canTeach(userId: string): Promise<boolean> {
  return hasCapability(userId, CAPABILITIES.TEACH);
}

export async function canTutor(userId: string): Promise<boolean> {
  return hasCapability(userId, CAPABILITIES.TUTOR);
}

export async function canReceivePayouts(userId: string): Promise<boolean> {
  return hasCapability(userId, CAPABILITIES.RECEIVE_PAYOUTS);
}
