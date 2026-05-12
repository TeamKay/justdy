"use server";

import { auth } from "@/lib/auth";
import { PlanType, SubscriptionStatus } from "@/lib/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

export async function setUserRole(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const role = formData.get("role") as string;

  if (!role || !["Student", "Educator"].includes(role)) {
    throw new Error("Invalid user selection");
  }

  try {
    /**
     * =========================
     * STUDENT ONBOARDING
     * =========================
     */
    if (role === "Student") {
      await prisma.$transaction(async (tx) => {
        // Update user role
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            role: "Student",
          },
        });

        // Ensure subscription exist
        const existingSubscription = await tx.subscription.findFirst({
          where: {
            userId: session.user.id,
          },
        });

        if (!existingSubscription) {
          await tx.subscription.create({
            data: {
              userId: session.user.id,
              planId: PlanType.Free,
              status: SubscriptionStatus.active,
              currentPeriodStart: new Date(),
              interval: "month",
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }
      });

      //Set cookies
      (await cookies()).set("role", "Student", { path: "/" });

      revalidatePath("/");
      return { success: true, redirect: "/" };
    }

    /**
     * =========================
     * EDUCATOR ONBOARDING
     * =========================
     */
    if (role === "Educator") {
      const specialty = formData.get("specialty") as string;
      const experience = formData.get("experience") as string;
      const credentialUrl = formData.get("credentialUrl") as string;
      const description = formData.get("description") as string;

      if (!specialty || !experience || !credentialUrl || !description) {
        throw new Error("All fields are required for educator role");
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          specialty,
          experience: parseInt(experience, 10),
          credentialUrl,
          description,
          role: "Educator",
          verificationStatus: "Pending",
        },
      });
      (await cookies()).set("role", "Educator", { path: "/" });
      revalidatePath("/");
      return { success: true, redirect: "/educator/verification" };
    }
  } catch (error) {
    console.error("Failed to set user role", error);
    throw new Error(
      `Failed to update user profile: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
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

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    return user;
  } catch (error) {
    console.error("Failed to get current user", error);
    return null;
  }
}

// "use server";

// import { auth } from "@/lib/auth";
// import prisma from "@/lib/prisma";
// import { revalidatePath } from "next/cache";
// import { headers } from "next/headers";

// export async function setUserRole(formData: FormData) {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user?.id) {
//     throw new Error("Unauthorized");
//   }

//   const user = await prisma.user.findUnique({
//     where: { id: session.user.id },
//   });

//   if (!user) {
//     throw new Error("User not found");
//   }

//   const role = formData.get("role") as string;

//   if (!role || !["Student", "Educator"].includes(role)) {
//     throw new Error("Invalid user role");
//   }

//   try {
//     if (role === "Student") {
//       await prisma.user.update({
//         where: { id: session.user.id },
//         data: { role: "Student" },
//       });

//       revalidatePath("/");
//       return { success: true, redirect: "/educators" };
//     }

//     if (role === "Educator") {
//       await prisma.user.update({
//         where: { id: session.user.id },
//         data: {
//           specialty: user.specialty,
//           experience: user.experience,
//           credentialUrl: user.credentialUrl,
//           description: user.description,
//           role: "Educator",
//           verificationStatus: "Pending",
//         },
//       });
//       revalidatePath("/");
//       return { success: true, redirect: "/educator/verification" };
//     }
//   } catch (error) {
//     console.error("Failed to set user role", error);
//     throw new Error(
//       `Failed to update user profile: ${error instanceof Error ? error.message : "Unknown error"}`,
//     );
//   }
// }

// export async function getCurrentUser() {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user?.id) {
//     throw new Error("Unauthorized");
//   }

//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id },
//     });

//     return user;
//   } catch (error) {
//     console.error("Failed to get current user", error);
//     return null;
//   }
// }
