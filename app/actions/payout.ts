"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

const CREDIT_VALUE = 10; // $10 per credit total
const PLATFORM_FEE_PER_CREDIT = 2; // $2 platform fee
const EDUCATOR_EARNINGS_PER_CREDIT = 8; // $8 to doctor

export async function requestPayout(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const educator = await prisma.user.findUnique({
      where: {
        id: session.user.id,
        role: "Educator",
      },
    });

    if (!educator) {
      throw new Error("Educator not found");
    }

    const paypalEmail = formData.get("paypalEmail");

    // 1. Check for null/undefined and ensure it's not a File object
    if (!paypalEmail || typeof paypalEmail !== "string") {
      throw new Error("A valid PayPal email is required");
    }

    if (!paypalEmail) {
      throw new Error("PayPal email is required");
    }

    // Check if educator has any pending payout requests
    const existingPendingPayout = await prisma.payout.findFirst({
      where: {
        id: educator.id,
        status: "Processing",
      },
    });

    if (existingPendingPayout) {
      throw new Error(
        "You already have a pending payout request. Please wait for it to be processed.",
      );
    }

    // Get doctor's current credit balance
    const creditCount = educator.credits;

    if (creditCount === 0) {
      throw new Error("No credits available for payout");
    }

    if (creditCount < 1) {
      throw new Error("Minimum 1 credit required for payout");
    }

    const totalAmount = creditCount * CREDIT_VALUE;
    const platformFee = creditCount * PLATFORM_FEE_PER_CREDIT;
    const netAmount = creditCount * EDUCATOR_EARNINGS_PER_CREDIT;

    // Create payout request
    const payout = await prisma.payout.create({
      data: {
        educator: {
          connect: {
            id: educator.id,
          },
        },
        amount: totalAmount,
        credits: creditCount,
        platformFee,
        netAmount,
        paypalEmail,
        status: "Processing",
      },
    });

    revalidatePath("/educator");
    return { success: true, payout };
  } catch (error) {
    console.error("Failed to request payout:", error);
    throw new Error("Failed to request payout: " + error);
  }
}

/**
 * Get doctor's payout history
 */
export async function getEducatorPayouts() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const educator = await prisma.user.findUnique({
      where: {
        id: session.user.id,
        role: "Educator",
      },
    });

    if (!educator) {
      throw new Error("Educator not found");
    }

    const payouts = await prisma.payout.findMany({
      where: {
        id: educator.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { payouts };
  } catch (error) {
    throw new Error("Failed to fetch payouts: " + error);
  }
}

export async function getEducatorEarnings() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const educator = await prisma.user.findUnique({
      where: {
        id: session.user.id,
        role: "Educator",
      },
    });

    if (!educator) {
      throw new Error("Educator not found");
    }

    // Get all completed appointments for this doctor
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        id: educator.id,
        status: "Completed",
      },
    });

    // Calculate this month's completed appointments
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const thisMonthAppointments = completedAppointments.filter(
      (appointment) => new Date(appointment.createdAt) >= currentMonth,
    );

    // Use doctor's actual credits from the user model
    const totalEarnings = educator.credits * EDUCATOR_EARNINGS_PER_CREDIT; // $8 per credit to doctor

    // Calculate this month's earnings (2 credits per appointment * $8 per credit)
    const thisMonthEarnings =
      thisMonthAppointments.length * 2 * EDUCATOR_EARNINGS_PER_CREDIT;

    // Simple average per month calculation
    const averageEarningsPerMonth =
      totalEarnings > 0
        ? totalEarnings / Math.max(1, new Date().getMonth() + 1)
        : 0;

    // Get current credit balance for payout calculations
    const availableCredits = educator.credits;
    const availablePayout = availableCredits * EDUCATOR_EARNINGS_PER_CREDIT;

    return {
      earnings: {
        totalEarnings,
        thisMonthEarnings,
        completedAppointments: completedAppointments.length,
        averageEarningsPerMonth,
        availableCredits,
        availablePayout,
      },
    };
  } catch (error) {
    throw new Error("Failed to fetch doctor earnings: " + error);
  }
}
