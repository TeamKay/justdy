
"use server";

import { z } from "zod";

import { auth } from "@/lib/auth";
import { CAPABILITIES, ensureCapabilities } from "@/lib/auth/capabilities";
import prisma from "@/lib/prisma";
import { ensureSocialProfileForUser } from "@/lib/social/ensure-profile";
import { signupSchema } from "@/lib/zodSchemas";

type SignupResult =
  | {
      type: "created";
    }
  | {
      type: "exists_verified";
    }
  | {
      type: "exists_unverified";
    };

type SignupValues = z.infer<typeof signupSchema>;

export async function signupUser(values: SignupValues): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(values);

  if (!parsed.success) {
    throw new Error("Invalid signup information.");
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!email) {
    throw new Error("Email is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  // ============================================================
  // CHECK EXISTING ACCOUNT
  // ============================================================

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      emailVerified: true,
    },
  });

  if (existingUser) {
    if (existingUser.emailVerified) {
      return {
        type: "exists_verified",
      };
    }

    return {
      type: "exists_unverified",
    };
  }

  // ============================================================
  // CREATE NORMAL USER
  // ============================================================

  await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  // ============================================================
  // FIND CREATED USER
  // ============================================================

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error(
      "Account creation succeeded, but the user could not be found.",
    );
  }

  if (user.role !== "LEARNER") {
    throw new Error("Account creation produced an unexpected platform role.");
  }

  // ============================================================
  // AUTOMATIC SOCIAL PROFILE
  // ============================================================

  await ensureSocialProfileForUser(user.id);

  // ============================================================
  // INITIAL USER CAPABILITIES
  // ============================================================

  await ensureCapabilities(user.id, [
    CAPABILITIES.LEARN,
    CAPABILITIES.BOOK_TUTORING,
  ]);

  return {
    type: "created",
  };
}
