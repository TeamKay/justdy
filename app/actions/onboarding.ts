"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CAPABILITIES, ensureCapabilities } from "@/lib/auth/capabilities";

export async function setUserRole(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const role = formData.get("role") as string;

  if (!role || !["Learner", "Educator"].includes(role)) {
    throw new Error("Invalid role");
  }

  try {
    /**
     * =========================
     * LEARNER
     * =========================
     */

    if (role === "Learner") {
      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          onboardingCompleted: true,
        },
      });

      await ensureCapabilities(session.user.id, [
        CAPABILITIES.LEARN,
        CAPABILITIES.BOOK_TUTORING,
      ]);

      (await cookies()).set("workspace", "learner", {
        path: "/",
      });

      revalidatePath("/", "layout");

      return {
        success: true,
        redirect: "/learner",
      };
    }

    /**
     * =========================
     * EDUCATOR
     * =========================
     */

    if (role === "Educator") {
      const experience = formData.get("experience");
      const credentialUrl = formData.get("credentialUrl");
      const description = formData.get("description");

      /*
       * These fields are currently collected from the form, but
       * they are NOT stored on User because they do not exist in
       * the current Prisma User model.
       *
       * We still validate that the educator submitted them.
       */

      if (
        typeof experience !== "string" ||
        typeof credentialUrl !== "string" ||
        typeof description !== "string" ||
        !experience ||
        !credentialUrl ||
        !description
      ) {
        throw new Error("Educator information required");
      }

      const experienceNumber = Number(experience);

      if (!Number.isFinite(experienceNumber) || experienceNumber < 0) {
        throw new Error("Please provide a valid number of years of experience");
      }

      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          verificationStatus: "Pending",
          onboardingCompleted: true,
        },
      });

      await ensureCapabilities(session.user.id, [CAPABILITIES.TEACH]);

      (await cookies()).set("workspace", "educator", {
        path: "/",
      });

      revalidatePath("/", "layout");

      return {
        success: true,
        redirect: "/educator/verification",
      };
    }
  } catch (error) {
    console.error("Onboarding error:", error);

    throw new Error(
      error instanceof Error ? error.message : "Onboarding failed",
    );
  }
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });
}


