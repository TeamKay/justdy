"use server";

import { z } from "zod";

import { auth } from "@/lib/auth";
import { CAPABILITIES, ensureCapabilities } from "@/lib/auth/capabilities";
import prisma from "@/lib/prisma";
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

export async function signupUser(
  values: SignupValues,
): Promise<SignupResult> {
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

  /*
   * Normal signup never accepts or assigns a platform role.
   *
   * Better Auth / Prisma creates the account using the schema's
   * default platform role:
   *
   *     USER
   *
   * There is no Learner/Educator/Tutor role selection during
   * account creation.
   */
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

  /*
   * A normal signup must produce a USER account.
   *
   * ADMIN accounts are provisioned separately and should never
   * be created through the public signup flow.
   */
  if (user.role !== "USER") {
    throw new Error(
      "Account creation produced an unexpected platform role.",
    );
  }

  // ============================================================
  // INITIAL USER CAPABILITIES
  // ============================================================

  /*
   * Every normal Justdy account starts as a learner.
   *
   * CAN_BOOK_TUTORING allows the learner to initiate tutoring
   * bookings.
   *
   * Teaching capabilities are intentionally NOT granted here.
   *
   * A user must first submit a tutor application and receive
   * administrator approval before receiving:
   *
   *     CAN_TEACH
   *     CAN_TUTOR
   *     CAN_RECEIVE_PAYOUTS
   */
  await ensureCapabilities(user.id, [
    CAPABILITIES.LEARN,
    CAPABILITIES.BOOK_TUTORING,
  ]);

  return {
    type: "created",
  };
}