"use server";

import { z } from "zod";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ensureSocialProfileForUser } from "@/lib/social/ensure-profile";
import { signupSchema } from "@/lib/zodSchemas";
import { captureMarketingContactSafely } from "@/lib/marketing/contact-service";

type RegisterTutorResult =
  | { type: "created" }
  | { type: "exists_verified" }
  | { type: "exists_unverified" }
  | { type: "exists_other" };

type RegisterTutorValues = z.infer<typeof signupSchema>;

export async function registerTutor(
  values: RegisterTutorValues,
): Promise<RegisterTutorResult> {
  const parsed = signupSchema.safeParse(values);

  if (!parsed.success) {
    throw new Error("Invalid registration information.");
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  if (!name || !email || !password) {
    throw new Error("Please complete all required fields.");
  }

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    process.env.APP_URL
  )?.replace(/\/$/, "");

  if (!appUrl) {
    throw new Error("The application URL is not configured.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      role: true,
      emailVerified: true,
    },
  });

  if (existingUser) {
    // Never convert an existing learner or administrator through
    // the public tutor registration form.
    if (existingUser.role !== "TUTOR") {
      return { type: "exists_other" };
    }

    return existingUser.emailVerified
      ? { type: "exists_verified" }
      : { type: "exists_unverified" };
  }

  // Better Auth creates the account using its default LEARNER role.
  // The role is changed to TUTOR below, exclusively on the server.
  await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error(
      "Account creation succeeded, but the new account could not be found.",
    );
  }

  if (user.role !== "LEARNER") {
    throw new Error(
      "The new account has an unexpected role. Please contact support.",
    );
  }

  // Change the role and create the pending teaching profile together.
  await prisma.$transaction(async (tx) => {
    const roleUpdate = await tx.user.updateMany({
      where: {
        id: user.id,
        role: "LEARNER",
      },
      data: {
        role: "TUTOR",
      },
    });

    if (roleUpdate.count !== 1) {
      throw new Error("Unable to assign the tutor account role.");
    }

    await tx.teachingProfile.create({
      data: {
        userId: user.id,
        verificationStatus: "Pending",
      },
    });
  });

    // Record the tutor's account email without granting marketing consent.
  await captureMarketingContactSafely(
    {
      email,
      name,
      sourceType: "USER_ACCOUNT",
      sourceRecordId: user.id,
      sourceRole: "ACCOUNT_EMAIL",
      userId: user.id,
    },
    "tutor account registration",
  );

  try {
    await ensureSocialProfileForUser(user.id);
  } catch (error) {
    console.error("Tutor social profile creation failed:", error);
  }

  // Request verification through the existing Better Auth flow.
  try {
    await auth.api.sendVerificationEmail({
      body: {
        email,
        callbackURL: `${appUrl}/verification-success`,
      },
    });
  } catch (error) {
    console.error("Tutor verification email request failed:", error);
    throw new Error(
      "Your tutor account was created, but we could not request the verification email. Please contact support.",
    );
  }

  return { type: "created" };
}
