"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createSocialProfileSchema,
  updateSocialProfileSchema,
} from "@/lib/social/validation";

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function createSocialProfile(input: unknown) {
  // 1. Require an authenticated user.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "You must be signed in to create a social profile.",
    };
  }

  // 2. Validate and normalize the username.
  const parsed = createSocialProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Please correct the username.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { username } = parsed.data;

  // 3. Confirm that the account exists and is active.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  if (!user || user.status !== "Active") {
    return {
      success: false as const,
      error: "This account cannot create a social profile.",
    };
  }

  // 4. Prevent one account from creating multiple social profiles.
  const existingProfile = await prisma.socialProfile.findUnique({
    where: { userId: user.id },
    select: { username: true },
  });

  if (existingProfile) {
    return {
      success: false as const,
      error: "You already have a social profile.",
      username: existingProfile.username,
    };
  }

  // 5. Check username availability.
  const existingUsername = await prisma.socialProfile.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existingUsername) {
    return {
      success: false as const,
      error: "That username is already taken.",
    };
  }

  // 6. Create the profile with safe defaults.
  try {
    const profile = await prisma.socialProfile.create({
      data: {
        userId: user.id,
        username,
        displayName: user.name.trim() || "Justdy member",
        isPrivate: true,
        ageBand: "UNKNOWN",
        ageAssuranceStatus: "UNVERIFIED",
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        isPrivate: true,
        ageBand: true,
        status: true,
        createdAt: true,
      },
    });

    revalidatePath("/home");
    revalidatePath(`/profile/${profile.username}`);

    return {
      success: true as const,
      profile,
    };
  } catch (error) {
    // Handles two users attempting to claim the same username simultaneously.
    if (isPrismaUniqueConstraintError(error)) {
      return {
        success: false as const,
        error: "That username is unavailable.",
      };
    }

    throw error;
  }
}

export async function updateSocialProfile(input: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "You must be signed in to update your profile.",
    };
  }

  const parsed = updateSocialProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Please correct your profile information.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      status: true,
      socialProfile: {
        select: {
          id: true,
          username: true,
          status: true,
        },
      },
    },
  });

  if (
    !user ||
    user.status !== "Active" ||
    !user.socialProfile ||
    user.socialProfile.status !== "ACTIVE"
  ) {
    return {
      success: false as const,
      error: "This account cannot update its social profile.",
    };
  }

  const profile = await prisma.socialProfile.update({
    where: { id: user.socialProfile.id },
    data: {
      displayName: parsed.data.displayName,
      bio: parsed.data.bio || null,
    },
    select: {
      username: true,
      displayName: true,
      bio: true,
    },
  });

  revalidatePath("/home");
  revalidatePath(`/profile/${profile.username}`);

  return {
    success: true as const,
    profile,
  };
}