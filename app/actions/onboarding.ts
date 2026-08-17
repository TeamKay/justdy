"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { revalidatePath } from "next/cache";

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
          role: "Learner",
          onboardingCompleted: true,
        },
      });

      (await cookies()).set("role", "Learner", {
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
      const experience = formData.get("experience") as string;

      const credentialUrl = formData.get("credentialUrl") as string;

      const description = formData.get("description") as string;

      if (!experience || !credentialUrl || !description) {
        throw new Error("Educator information required");
      }

      await prisma.user.update({
        where: {
          id: session.user.id,
        },

        data: {
          role: "Educator",

          experience: Number(experience),

          credentialUrl,

          description,

          verificationStatus: "Pending",

          onboardingCompleted: true,
        },
      });

      (await cookies()).set("role", "Educator", {
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

// "use server";

// import { auth } from "@/lib/auth";
// import { PlanType, SubscriptionStatus } from "@/lib/generated/prisma/enums";
// import prisma from "@/lib/prisma";
// import { revalidatePath } from "next/cache";
// import { cookies, headers } from "next/headers";

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

//   if (!role || !["Learner", "Educator"].includes(role)) {
//     throw new Error("Invalid user selection");
//   }

//   // Extract and parse selected communities from frontend JSON string
//   const communitiesRaw = formData.get("communities") as string;
//   let communityIds: string[] = [];

//   if (communitiesRaw) {
//     try {
//       communityIds = JSON.parse(communitiesRaw);
//     } catch (e) {
//       console.error("Failed to parse communities selection array", e);
//     }
//   }

//   try {
//     /**
//      * =========================
//      * STUDENT ONBOARDING
//      * =========================
//      */
//     if (role === "Learner") {
//       await prisma.$transaction(async (tx) => {
//         // Update user role and map selected communities concurrently
//         await tx.user.update({
//           where: { id: session.user.id },
//           data: {
//             role: "Learner",
//             communityMemberships: {
//               createMany: {
//                 data: communityIds.map((communityId) => ({
//                   communityId,
//                   role: "Member", // Maps to your CommunityRole Enum
//                   status: "Active", // Maps to your MembershipStatus Enum
//                 })),
//                 skipDuplicates: true,
//               },
//             },
//           },
//         });

//         // Increment member counts for selected communities
//         if (communityIds.length > 0) {
//           await tx.community.updateMany({
//             where: { id: { in: communityIds } },
//             data: { memberCount: { increment: 1 } },
//           });
//         }

//         // Ensure subscription exists
//         const existingSubscription = await tx.subscription.findFirst({
//           where: { userId: session.user.id },
//         });

//         if (!existingSubscription) {
//           await tx.subscription.create({
//             data: {
//               userId: session.user.id,
//               planId: PlanType.Free,
//               status: SubscriptionStatus.active,
//               currentPeriodStart: new Date(),
//               interval: "month",
//               currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//             },
//           });
//         }
//       });

//       // Set cookies
//       (await cookies()).set("role", "Learner", { path: "/" });
//       revalidatePath("/", "layout");
//       return { success: true, redirect: "/learner" };
//     }

//     /**
//      * =========================
//      * EDUCATOR ONBOARDING
//      * =========================
//      */
//     if (role === "Educator") {
//       const specialty = formData.get("specialty") as string;
//       const experience = formData.get("experience") as string;
//       const credentialUrl = formData.get("credentialUrl") as string;
//       const description = formData.get("description") as string;

//       if (!specialty || !experience || !credentialUrl || !description) {
//         throw new Error("All fields are required for educator role");
//       }

//       // Wrapped in transaction to protect role assignment and community counts
//       await prisma.$transaction(async (tx) => {
//         await tx.user.update({
//           where: { id: session.user.id },
//           data: {
//             specialty,
//             experience: parseInt(experience, 10),
//             credentialUrl,
//             description,
//             role: "Educator",
//             verificationStatus: "Pending",
//             communityMemberships: {
//               createMany: {
//                 data: communityIds.map((communityId) => ({
//                   communityId,
//                   role: "Member",
//                   status: "Active",
//                 })),
//                 skipDuplicates: true,
//               },
//             },
//           },
//         });

//         // Increment member counts for selected communities
//         if (communityIds.length > 0) {
//           await tx.community.updateMany({
//             where: { id: { in: communityIds } },
//             data: { memberCount: { increment: 1 } },
//           });
//         }
//       });

//       (await cookies()).set("role", "Educator", { path: "/" });
//       revalidatePath("/");
//       return { success: true, redirect: "/educator/verification" };
//     }
//   } catch (error) {
//     console.error("Failed to set user role", error);
//     throw new Error(
//       `Failed to update user profile: ${
//         error instanceof Error ? error.message : "Unknown error"
//       }`,
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
