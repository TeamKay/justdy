"use server";

import { PendingEnrollmentStatus } from "@/lib/generated/prisma/client";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markConsultationCompleted(pendingEnrollmentId: string) {
  try {
    if (!pendingEnrollmentId) {
      return { success: false, error: "Consultation ID is required." };
    }

    await prisma.pendingEnrollment.update({
      where: { id: pendingEnrollmentId },
      data: {
        status: PendingEnrollmentStatus.Enrolled,
      },
    });

    // Revalidate consultation table and dashboard metrics
    revalidatePath("/admin/free-consultations");
    revalidatePath("/admin");
    revalidatePath("/manage");

    return { success: true };
  } catch (error) {
    console.error("Error updating consultation status:", error);
    return { success: false, error: "Failed to update consultation status." };
  }
}
