"use server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { VerificationStatus } from "@/lib/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/* ============================================================
   AUTHENTICATION / ADMIN HELPERS
   ============================================================ */

/**
 * Gets the currently authenticated user from the database.
 *
 * This checks both:
 * 1. Better Auth session
 * 2. Prisma User record
 */
async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  return user;
}

/**
 * Verifies that the current user has the Admin role.
 */
export async function verifyAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return false;
    }

    return user.role === "Admin";
  } catch (error) {
    console.error("Error verifying admin:", error);
    return false;
  }
}

/**
 * Gets the currently authenticated Admin.
 *
 * Since your Admin is also the educator for tutoring,
 * this user can be used as the educator for appointments.
 */
async function getCurrentAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "Admin") {
    throw new Error(`Unauthorized. Current database role: ${user.role}`);
  }

  return user;
}

/* ============================================================
   EDUCATOR VERIFICATION
   ============================================================ */

/**
 * Fetch all pending educator verification requests.
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
 * Fetch all verified educators.
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
 * Approve or reject an educator's verification status.
 */
export async function updateEducatorStatus(formData: FormData) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  const educatorId = formData.get("educatorId");

  const status = formData.get("status");

  if (typeof educatorId !== "string" || !educatorId) {
    throw new Error("Educator ID is required");
  }

  if (
    typeof status !== "string" ||
    !["Verified", "Rejected"].includes(status)
  ) {
    throw new Error("Invalid verification status");
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

    /**
     * Send onboarding/password setup email
     * when educator is approved.
     */
    if (status === "Verified" && educator.email) {
      await sendEducatorApprovalEmail(educator.email);
    }

    revalidatePath("/admin");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating educator status:", error);

    throw new Error(
      `Failed to update educator status: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Sends password reset/setup link to newly
 * approved educator.
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
 * Suspend/unsuspend educator.
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

    throw new Error(
      `Failed to update educator active status: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/* ============================================================
   PAYOUTS
   ============================================================ */

/**
 * Fetch pending payouts along with educator relations.
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
 * Approve payout request.
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
    const admin = await getCurrentAdmin();

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
          processedBy: admin.id,
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

/* ============================================================
   TUTORING / EDUCATOR APPOINTMENTS
   ============================================================ */

/**
 * Get appointments for the logged-in Admin/Educator.
 *
 * IMPORTANT:
 *
 * Your application uses the Admin account as the educator.
 * Therefore we do NOT check:
 *
 *     role === "Educator"
 *
 * Instead we verify:
 *
 *     role === "Admin"
 *
 * and then use the Admin's user ID as educatorId.
 */
export async function getAppointments() {
  try {
    const admin = await getCurrentAdmin();

    console.log("getAppointments: authenticated admin", {
      userId: admin.id,
      role: admin.role,
      name: admin.name,
      email: admin.email,
    });

    const appointments = await prisma.appointment.findMany({
      where: {
        educatorId: admin.id,
      },
      include: {
        learner: true,
        educator: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return {
      appointments,
    };
  } catch (error) {
    console.error("getAppointments error:", error);

    throw new Error(
      `Failed to fetch appointments: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Cancel an appointment.
 *
 * The Admin/Educator can cancel appointments
 * assigned to them.
 *
 * Learners can also cancel their own appointments.
 */
export async function cancelAppointment(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const rawAppointmentId = formData.get("appointmentId");

    if (!rawAppointmentId || typeof rawAppointmentId !== "string") {
      throw new Error("Appointment ID must be a valid string");
    }

    const appointmentId = rawAppointmentId;

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        learner: true,
        educator: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    /**
     * The appointment can only be cancelled by:
     *
     * - The assigned educator/admin
     * - The assigned learner
     */
    if (
      appointment.educatorId !== user.id &&
      appointment.learnerId !== user.id
    ) {
      throw new Error("You are not authorized to cancel this appointment");
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: "Cancelled",
        },
      });
    });

    /**
     * Revalidate the appropriate page.
     */
    if (user.role === "Admin") {
      revalidatePath("/manage/sessions");
    }

    if (user.role === "Learner") {
      revalidatePath("/learner/sessions");
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("cancelAppointment error:", error);

    throw new Error(
      `Failed to cancel appointment: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Add notes to an appointment.
 *
 * Admin is treated as the educator.
 */
export async function addAppointmentNotes(formData: FormData) {
  try {
    const admin = await getCurrentAdmin();

    const rawAppointmentId = formData.get("appointmentId");

    if (!rawAppointmentId || typeof rawAppointmentId !== "string") {
      throw new Error("Appointment ID must be a valid string");
    }

    const appointmentId = rawAppointmentId;

    const learnerDescription = formData.get("learnerDescription");

    if (typeof learnerDescription !== "string") {
      throw new Error("Learner description must be a valid string");
    }

    /**
     * Make sure this appointment actually
     * belongs to the logged-in Admin/Educator.
     */
    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        educatorId: admin.id,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        learnerDescription,
      },
    });

    revalidatePath("/manage/sessions");

    return {
      success: true,
      appointment: updatedAppointment,
    };
  } catch (error) {
    console.error("addAppointmentNotes error:", error);

    throw new Error(
      `Failed to update notes: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Mark an appointment as completed.
 *
 * Admin is treated as the educator.
 */
export async function markAppointmentCompleted(formData: FormData) {
  try {
    const admin = await getCurrentAdmin();

    const rawAppointmentId = formData.get("appointmentId");

    if (!rawAppointmentId || typeof rawAppointmentId !== "string") {
      throw new Error("Appointment ID must be a valid string");
    }

    const appointmentId = rawAppointmentId;

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        educatorId: admin.id,
      },
      include: {
        learner: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.status !== "Scheduled") {
      throw new Error("Only scheduled appointments can be marked as completed");
    }

    const now = new Date();

    const appointmentEndTime = new Date(appointment.endTime);

    if (now < appointmentEndTime) {
      throw new Error(
        "Cannot mark appointment as completed before the scheduled end time",
      );
    }

    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        status: "Completed",
      },
    });

    revalidatePath("/manage/sessions");

    return {
      success: true,
      appointment: updatedAppointment,
    };
  } catch (error) {
    console.error("markAppointmentCompleted error:", error);

    throw new Error(
      `Failed to mark appointment as complete: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/* ============================================================
   EDUCATOR LIST / ONBOARDING
   ============================================================ */

/**
 * Fetch verified educators.
 *
 * This function does not require the current user to be
 * an educator because it can be used by public/booking
 * functionality to display available educators.
 */
export async function getOnboardingEducators() {
  try {
    return await prisma.user.findMany({
      where: {
        role: "Educator",
        verificationStatus: "Verified",
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        facilitatorProfile: {
          select: {
            specialty: true,
            experience: true,
            description: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  } catch (error) {
    console.error("Failed to load educators:", error);

    return [];
  }
}
