"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { signupSchema } from "@/lib/zodSchemas";

export async function signupUser(formData: unknown) {
  const parsed = signupSchema.safeParse(formData);

  if (!parsed.success) {
    return { ok: false, type: "invalid_data" };
  }

  const { name, email, password } = parsed.data;

  try {
    // 1. CHECK IF USER EXISTS FIRST
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // If already exists but not verified → resend OTP
      if (!existingUser.emailVerified) {
        await auth.api.sendVerificationOTP({
          body: { email, type: "sign-in" },
        });

        return {
          ok: true,
          type: "exists_unverified",
        };
      }

      // Already verified user
      return {
        ok: false,
        type: "exists_verified",
      };
    }

    // 2. CREATE USER
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
    });

    if (!result || !result.user) {
      return { ok: false, type: "signup_failed" };
    }

    return {
      ok: true,
      type: "created",
    };
  } catch (error) {
    // Crucial for debugging your API calls locally
    console.error("Signup Flow Error Details:", error);
    return { ok: false, type: "signup_failed" };
  }
}
