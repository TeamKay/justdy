"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canReceivePayouts } from "@/lib/auth/capabilities";
import { getVerifiedTutor } from "@/lib/tutoring/authorization";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const TUTOR_SHARE_PERCENTAGE = 60;

function calculateEarnings(grossAmount: number) {
  const educatorPay = Math.floor(
    (grossAmount * TUTOR_SHARE_PERCENTAGE) / 100,
  );
  const platformFee = grossAmount - educatorPay;

  return { grossAmount, educatorPay, platformFee };
}

async function getAuthenticatedUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session.user.id;
}

async function requirePayoutEligibleTutor(userId: string) {
  const tutor = await getVerifiedTutor(userId);

  if (!tutor) {
    throw new Error("Your verified tutor status is not currently active.");
  }

  if (!(await canReceivePayouts(userId))) {
    throw new Error("You are not authorized to receive tutoring payouts.");
  }

  return tutor;
}

/**
 * Request one payout for all completed, unpaid canonical tutoring bookings.
 *
 * Canonical money source:
 *   Booking -> Service.price (integer cents)
 *
 * A booking only becomes payout-eligible after the canonical tutoring
 * lifecycle marks both the TutoringSession and Booking as completed.
 */
export async function requestPayout(formData: FormData) {
  const userId = await getAuthenticatedUserId();
  const tutor = await requirePayoutEligibleTutor(userId);

  const paypalValue = formData.get("paypalEmail");
  if (typeof paypalValue !== "string") {
    throw new Error("A valid PayPal email is required.");
  }

  const paypalEmail = paypalValue.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
    throw new Error("A valid PayPal email is required.");
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Serialize payout requests for this tutor so two concurrent
        // requests cannot reserve the same completed bookings.
        await tx.$queryRaw`
          SELECT id
          FROM "User"
          WHERE id = ${tutor.id}
          FOR UPDATE
        `;

        const existingPendingPayout = await tx.payout.findFirst({
          where: {
            educatorId: tutor.id,
            status: "Processing",
          },
          select: { id: true },
        });

        if (existingPendingPayout) {
          throw new Error("PENDING_PAYOUT");
        }

        const completedBookings = await tx.booking.findMany({
          where: {
            educatorId: tutor.id,
            status: "Completed",
            payoutStatus: "Unpaid",
            tutoringSession: {
              status: "COMPLETED",
            },
            service: {
              type: "TUTORING",
            },
          },
          include: {
            service: {
              select: {
                price: true,
              },
            },
          },
          orderBy: { endTime: "asc" },
        });

        const eligible = completedBookings.filter(
          (booking) =>
            typeof booking.service?.price === "number" &&
            booking.service.price > 0,
        );

        if (eligible.length === 0) {
          throw new Error("NO_COMPLETED_SESSIONS");
        }

        const grossAmount = eligible.reduce(
          (total, booking) => total + (booking.service?.price ?? 0),
          0,
        );

        const earnings = calculateEarnings(grossAmount);

        const payout = await tx.payout.create({
          data: {
            educatorId: tutor.id,
            amount: earnings.grossAmount,
            netAmount: earnings.educatorPay,
            platformFee: earnings.platformFee,
            paypalEmail,
            status: "Processing",
          },
        });

        const updateResult = await tx.booking.updateMany({
          where: {
            id: { in: eligible.map((booking) => booking.id) },
            educatorId: tutor.id,
            status: "Completed",
            payoutStatus: "Unpaid",
          },
          data: {
            payoutStatus: "Processing",
          },
        });

        if (updateResult.count !== eligible.length) {
          throw new Error("PAYOUT_BOOKINGS_CHANGED");
        }

        return {
          payout,
          sessions: eligible.length,
          grossAmount: earnings.grossAmount,
          educatorEarnings: earnings.educatorPay,
          platformFee: earnings.platformFee,
        };
      },
      { isolationLevel: "Serializable" },
    );

    revalidatePath("/educator");
    revalidatePath("/tutoring/sessions");

    return {
      success: true,
      payout: result.payout,
      sessions: result.sessions,
      grossAmount: result.grossAmount,
      educatorEarnings: result.educatorEarnings,
      platformFee: result.platformFee,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PENDING_PAYOUT") {
        throw new Error("You already have a pending payout request.");
      }
      if (error.message === "NO_COMPLETED_SESSIONS") {
        throw new Error("No completed unpaid tutoring sessions available.");
      }
      if (error.message === "PAYOUT_BOOKINGS_CHANGED") {
        throw new Error(
          "The eligible tutoring sessions changed. Please refresh and try again.",
        );
      }
    }

    console.error("Failed to request tutoring payout:", error);
    throw new Error("Failed to request tutoring payout.");
  }
}

export async function getEducatorPayouts() {
  const userId = await getAuthenticatedUserId();
  const tutor = await requirePayoutEligibleTutor(userId);

  try {
    const payouts = await prisma.payout.findMany({
      where: { educatorId: tutor.id },
      orderBy: { createdAt: "desc" },
    });

    return { payouts };
  } catch (error) {
    console.error("Failed to fetch tutoring payouts:", error);
    throw new Error("Failed to fetch tutoring payouts.");
  }
}

export async function getEducatorEarnings() {
  const userId = await getAuthenticatedUserId();
  const tutor = await requirePayoutEligibleTutor(userId);

  try {
    const completedBookings = await prisma.booking.findMany({
      where: {
        educatorId: tutor.id,
        status: "Completed",
        tutoringSession: { status: "COMPLETED" },
        service: { type: "TUTORING" },
      },
      select: {
        id: true,
        createdAt: true,
        endTime: true,
        payoutStatus: true,
        service: {
          select: { price: true },
        },
      },
      orderBy: { endTime: "asc" },
    });

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    let totalEarnings = 0;
    let totalPlatformFees = 0;
    let thisMonthEarnings = 0;
    let availablePayout = 0;

    for (const booking of completedBookings) {
      const gross = booking.service?.price ?? 0;
      if (gross <= 0) continue;

      const earnings = calculateEarnings(gross);
      totalEarnings += earnings.educatorPay;
      totalPlatformFees += earnings.platformFee;

      if (booking.endTime >= currentMonthStart) {
        thisMonthEarnings += earnings.educatorPay;
      }

      if (booking.payoutStatus === "Unpaid") {
        availablePayout += earnings.educatorPay;
      }
    }

    const monthsElapsed = Math.max(1, new Date().getMonth() + 1);

    return {
      earnings: {
        totalEarnings,
        thisMonthEarnings,
        completedAppointments: completedBookings.length,
        completedSessions: completedBookings.length,
        averageEarningsPerMonth: totalEarnings / monthsElapsed,
        availablePayout,
        totalPlatformFees,
      },
    };
  } catch (error) {
    console.error("Failed to fetch tutoring earnings:", error);
    throw new Error("Failed to fetch tutoring earnings.");
  }
}
