import prisma from "@/lib/prisma";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function createUsernameBase(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const base = normalized || "member";

  // The social username must be at least 3 characters.
  return base.length < 3 ? `${base}_member` : base;
}

export async function ensureSocialProfileForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      status: true,
      socialProfile: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!user || user.status !== "Active") {
    return null;
  }

  // Keep existing profiles unchanged.
  if (user.socialProfile) {
    return user.socialProfile;
  }

  const displayName = user.name?.trim() || "Justdy member";
  const base = createUsernameBase(displayName).slice(0, 24);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const suffix = attempt === 0 ? "" : `_${attempt + 1}`;
    const username = `${base.slice(0, 24 - suffix.length)}${suffix}`;

    try {
      return await prisma.socialProfile.create({
        data: {
          userId: user.id,
          username,
          displayName,
          isPrivate: true,
          ageBand: "UNKNOWN",
          ageAssuranceStatus: "UNVERIFIED",
        },
        select: {
          id: true,
          username: true,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      // A profile may have been created concurrently for this user.
      const existingProfile = await prisma.socialProfile.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          username: true,
        },
      });

      if (existingProfile) {
        return existingProfile;
      }

      // Otherwise, the username was taken. Try the next suffix.
    }
  }

  throw new Error(
    `Unable to generate an available social username for user ${userId}.`,
  );
}