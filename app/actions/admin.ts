"use server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { VerificationStatus } from "@/lib/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Verifies if the requesting user has the 'Admin' role.
 */
export async function verifyAdmin(): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "Admin") {
    return false;
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: true,
      },
    });

    return user?.role === "Admin";
  } catch (error) {
    console.error("Error verifying admin:", error);
    return false;
  }
}

/**
 * Fetch all pending educator verification requests
 */
export async function getPendingEducators() {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  try {
    const pendingEducators = await prisma.user.findMany({
      where: {
        verificationStatus: "Pending",
        role: "Educator",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      educators: pendingEducators,
    };
  } catch (error) {
    console.error("Error fetching pending educators:", error);
    throw new Error("Failed to fetch pending educators");
  }
}

/**
 * Fetch all verified educators
 */
export async function getVerifiedEducators() {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  try {
    const verifiedEducators = await prisma.user.findMany({
      where: {
        verificationStatus: "Verified",
        role: "Educator",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      educators: verifiedEducators,
    };
  } catch (error) {
    console.error("Error fetching verified educators:", error);
    throw new Error("Failed to fetch verified educators");
  }
}

/**
 * Approve or Reject an educator's status
 */
export async function updateEducatorStatus(formData: FormData) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  const educatorId = formData.get("educatorId");
  const status = formData.get("status");

  if (
    typeof educatorId !== "string" ||
    typeof status !== "string" ||
    !["Verified", "Rejected"].includes(status)
  ) {
    throw new Error("Invalid input");
  }

  try {
    const educator = await prisma.user.update({
      where: {
        id: educatorId,
      },
      data: {
        verificationStatus: status as VerificationStatus,
      },
    });

    // Send onboarding setup email if newly approved
    if (status === "Verified" && educator.email) {
      await sendEducatorApprovalEmail(educator.email);
    }

    revalidatePath("/admin");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating educator status:", error);
    throw new Error("Failed to update educator status");
  }
}

/**
 * Sends password reset/setup link to newly approved educator
 */
async function sendEducatorApprovalEmail(email: string): Promise<void> {
  try {
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${env.BETTER_AUTH_URL}/reset-password`,
      },
    });
  } catch (error) {
    console.error("Failed sending approval email:", error);
  }
}

/**
 * Suspend/Unsuspend educator
 */
export async function updateEducatorActiveStatus(formData: FormData) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  const educatorId = formData.get("educatorId");
  const suspend = formData.get("suspend") === "true";

  if (typeof educatorId !== "string" || !educatorId) {
    throw new Error("Educator ID is required");
  }

  try {
    const status: VerificationStatus = suspend ? "Pending" : "Verified";

    await prisma.user.update({
      where: {
        id: educatorId,
      },
      data: {
        verificationStatus: status,
      },
    });

    revalidatePath("/admin");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating educator active status:", error);

    throw new Error("Failed to update educator active status");
  }
}

/**
 * Fetch pending payouts along with Educator relations
 */
export async function getPendingPayouts() {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  try {
    const pendingPayouts = await prisma.payout.findMany({
      where: {
        status: "Processing",
      },
      include: {
        educator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      payouts: pendingPayouts,
    };
  } catch (error) {
    console.error("Failed to fetch pending payouts:", error);

    throw new Error("Failed to fetch pending payouts");
  }
}

/**
 * Approve Payout Request
 */
export async function approvePayout(formData: FormData) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  const payoutId = formData.get("payoutId");

  if (typeof payoutId !== "string" || !payoutId) {
    throw new Error("Payout ID is required");
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const admin = session?.user?.id
      ? await prisma.user.findUnique({
          where: {
            id: session.user.id,
          },
        })
      : null;

    const payout = await prisma.payout.findUnique({
      where: {
        id: payoutId,
        status: "Processing",
      },
      include: {
        educator: true,
      },
    });

    if (!payout) {
      throw new Error("Payout request not found or already processed");
    }

    await prisma.$transaction(async (tx) => {
      await tx.payout.update({
        where: {
          id: payoutId,
        },
        data: {
          status: "Paid",
          processedAt: new Date(),
          processedBy: admin?.id || "unknown",
        },
      });
    });

    revalidatePath("/admin");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to approve payout:", error);

    throw new Error(
      `Failed to approve payout: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

// "use server";

// import { auth } from "@/lib/auth";
// import { env } from "@/lib/env";
// import { VerificationStatus } from "@/lib/generated/prisma/enums";
// import prisma from "@/lib/prisma";
// import { revalidatePath } from "next/cache";
// import { headers } from "next/headers";

// export async function verifyAdmin() {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user || session.user.role !== "Admin") {
//     throw new Error("Unauthorized");
//   }

//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id },
//     });

//     return user?.role === "Admin";
//   } catch (error) {
//     console.error("Error verifying admin:", error);
//     return false;
//   }
// }

// export async function getPendingEducators() {
//   const isAdmin = await verifyAdmin();
//   if (!isAdmin) {
//     throw new Error("Unauthorized");
//   }

//   try {
//     const pendingEducators = await prisma.user.findMany({
//       where: { verificationStatus: "Pending", role: "Educator" },
//       orderBy: { createdAt: "desc" },
//     });
//     return { educators: pendingEducators };
//   } catch (error) {
//     console.error("Error fetching pending educators:", error);
//     throw new Error("Failed to fetch pending educators");
//   }
// }

// export async function getVerifiedEducators() {
//   const isAdmin = await verifyAdmin();
//   if (!isAdmin) {
//     throw new Error("Unauthorized");
//   }

//   try {
//     const verifiedEducators = await prisma.user.findMany({
//       where: { verificationStatus: "Verified", role: "Educator" },
//       orderBy: { createdAt: "asc" },
//     });
//     return { educators: verifiedEducators };
//   } catch (error) {
//     console.error("Error fetching verified educators:", error);
//     throw new Error("Failed to fetch verified educators");
//   }
// }

// export async function updateEducatorStatus(formData: FormData) {
//   const isAdmin = await verifyAdmin();

//   if (!isAdmin) {
//     throw new Error("Unauthorized");
//   }

//   const educatorId = formData.get("educatorId");
//   const status = formData.get("status");

//   if (
//     typeof educatorId !== "string" ||
//     typeof status !== "string" ||
//     !["Verified", "Rejected"].includes(status)
//   ) {
//     throw new Error("Invalid input");
//   }

//   try {
//     const educator = await prisma.user.update({
//       where: {
//         id: educatorId,
//       },

//       data: {
//         verificationStatus: status as VerificationStatus,
//       },
//     });

//     // SEND PASSWORD SETUP EMAIL ONLY WHEN APPROVED

//     if (status === "Verified") {
//       await sendEducatorApprovalEmail(educator.email);
//     }

//     revalidatePath("/admin");

//     return {
//       success: true,
//     };
//   } catch (error) {
//     console.error("Error updating educator status:", error);

//     throw new Error("Failed to update educator status");
//   }
// }

// async function sendEducatorApprovalEmail(email: string) {
//   try {
//     await auth.api.requestPasswordReset({
//       body: {
//         email,

//         redirectTo: `${env.BETTER_AUTH_URL}/reset-password`,
//       },
//     });
//   } catch (error) {
//     console.error("Failed sending approval email:", error);
//   }
// }

// export async function updateEducatorActiveStatus(formData: FormData) {
//   const isAdmin = await verifyAdmin();
//   if (!isAdmin) {
//     throw new Error("Unauthorized");
//   }

//   const educatorId = formData.get("educatorId");
//   const suspend = formData.get("suspend") === "true";

//   if (!educatorId) {
//     throw new Error("Educator ID is required");
//   }

//   try {
//     const status = suspend ? "Pending" : "Verified";

//     await prisma.user.update({
//       where: { id: educatorId as string },
//       data: { verificationStatus: status },
//     });

//     revalidatePath("/admin");
//     return { success: true };
//   } catch (error) {
//     console.error("Error updating educator active status:", error);
//     throw new Error("Failed to update educator active status");
//   }
// }

// export async function getPendingPayouts() {
//   const isAdmin = await verifyAdmin();
//   if (!isAdmin) throw new Error("Unauthorized");

//   try {
//     const pendingPayouts = await prisma.payout.findMany({
//       where: {
//         status: "Processing",
//       },
//       include: {
//         educator: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             specialty: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     return { payouts: pendingPayouts };
//   } catch (error) {
//     console.error("Failed to fetch pending payouts:", error);
//     throw new Error("Failed to fetch pending payouts");
//   }
// }

// export async function approvePayout(formData: FormData) {
//   const isAdmin = await verifyAdmin();
//   if (!isAdmin) throw new Error("Unauthorized");

//   const payoutId = formData.get("payoutId");

//   if (!payoutId) {
//     throw new Error("Payout ID is required");
//   }

//   try {
//     // Get admin user info
//     const session = await auth.api.getSession({
//       headers: await headers(),
//     });

//     const admin = await prisma.user.findUnique({
//       where: { id: session?.user.id },
//     });

//     // Find the payout request
//     const payout = await prisma.payout.findUnique({
//       where: {
//         id: payoutId as string,
//         status: "Processing",
//       },
//       include: {
//         educator: true,
//       },
//     });

//     if (!payout) {
//       throw new Error("Payout request not found or already processed");
//     }

//     // // Check if doctor has enough credits
//     // if (payout.educator.credits < payout.credits) {
//     //   throw new Error("Doctor doesn't have enough credits for this payout");
//     // }

//     // Process the payout in a transaction
//     await prisma.$transaction(async (tx) => {
//       // Update payout status to PROCESSED
//       await tx.payout.update({
//         where: {
//           id: payoutId as string,
//         },
//         data: {
//           status: "Paid",
//           processedAt: new Date(),
//           processedBy: admin?.id || "unknown",
//         },
//       });

//       // Deduct credits from doctor's account
//       // await tx.user.update({
//       //   where: {
//       //     id: payout.educatorId,
//       //   },
//       //   data: {
//       //     credits: {
//       //       decrement: payout.credits,
//       //     },
//       //   },
//       // });

//       // Create a transaction record for the deduction
//       // await tx.creditTransaction.create({
//       //   data: {
//       //     userId: payout.educatorId,
//       //     amount: -payout.credits,
//       //     type: "Admin_Adjustment",
//       //   },
//       // });
//     });

//     revalidatePath("/admin");
//     return { success: true };
//   } catch (error) {
//     console.error("Failed to approve payout:", error);
//     throw new Error(`Failed to approve payout: ${error}`);
//   }
// }
