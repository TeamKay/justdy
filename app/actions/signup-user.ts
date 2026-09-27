"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { signupSchema } from "@/lib/zodSchemas";
import { CAPABILITIES, ensureCapabilities } from "@/lib/auth/capabilities";

export async function signupUser(formData: unknown) {
  const parsed = signupSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      ok: false,
      type: "invalid_data",
    };
  }

  const { name, email, password } = parsed.data;

  // IMPORTANT:
  // Normal signup is ALWAYS for learners.
  // Never trust a role supplied by the client.
  const role = "user";

  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        facilitatorProfile: true,
      },
    });

    if (existingUser) {
      if (
        existingUser.emailVerified &&
        existingUser.facilitatorProfile?.verificationStatus ===
          "Pending"
      ) {
        return {
          ok: false,
          type: "awaiting_admin_approval",
        };
      }

      if (existingUser.emailVerified) {
        return {
          ok: false,
          type: "exists_verified",
        };
      }

      return {
        ok: false,
        type: "exists_unverified",
      };
    }

    // 2. Create the base Better Auth user/account
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,

        // Normal signup always goes to learner onboarding.
        callbackURL: `/onboarding?role=${role.toLowerCase()}`,
      },
    });

    if (!result?.user) {
      return {
        ok: false,
        type: "signup_failed",
      };
    }

    // 3. Capability authorization is the source of truth for the tutoring
    // workflow. A normal account must be able to learn and book tutoring
    // immediately after signup.
    await ensureCapabilities(result.user.id, [
      CAPABILITIES.LEARN,
      CAPABILITIES.BOOK_TUTORING,
    ]);

    return {
      ok: true,
      type: "created",
    };
  } catch (error) {
    console.error("Signup error:", error);

    return {
      ok: false,
      type: "signup_failed",
    };
  }
}