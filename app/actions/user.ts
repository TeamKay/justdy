"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";

// ============================================================
// GET EDUCATOR
// ============================================================

export async function getEducator() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const educator = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      verificationStatus: true,
      role: true,
    },
  });

  if (!educator) {
    throw new Error("Educator not found");
  }

  if (!(await hasCapability(educator.id, CAPABILITIES.TEACH))) {
    throw new Error("User is not an educator");
  }

  return educator;
}

// ============================================================
// UPDATE EDUCATOR PROFILE
// ============================================================

export async function updateEducatorProfile(data: {
  name: string;
  imageUrl: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // ----------------------------------------------------------
  // Validate name
  // ----------------------------------------------------------

  const name = data.name.trim();

  if (!name) {
    throw new Error("Name is required");
  }

  // ----------------------------------------------------------
  // Make sure the user is actually an educator
  // ----------------------------------------------------------

  const existingUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (!(await hasCapability(existingUser.id, CAPABILITIES.TEACH))) {
    throw new Error("Only educators can update this profile");
  }

  // ----------------------------------------------------------
  // Update User
  // ----------------------------------------------------------

  const updatedUser = await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      name,
      imageUrl: data.imageUrl || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      verificationStatus: true,
    },
  });

  // ----------------------------------------------------------
  // Refresh profile page
  // ----------------------------------------------------------

  revalidatePath("/manage/profile");

  return {
    success: true,
    educator: updatedUser,
  };
}
