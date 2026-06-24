"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// ===============================
// FLEXPAY SESSION CONFIGURATION
// ===============================

const SESSION_PRICING = {
  THIRTY_MIN: {
    studentPays: 15,
    educatorPercentage: 0.6,
  },
  FORTY_FIVE_MIN: {
    studentPays: 25,
    educatorPercentage: 0.6,
  },
  SIXTY_MIN: {
    studentPays: 35,
    educatorPercentage: 0.6,
  },
  MONTHLY_SUBSCRIPTION: {
    studentPays: 200,
    sessions: 8,
    educatorPercentage: 0.6,
  },
};

// ===============================
// HELPER FUNCTION
// ===============================

function calculateSessionEarnings(sessionType: string) {
  switch (sessionType) {
    case "THIRTY_MIN": {
      const total = SESSION_PRICING.THIRTY_MIN.studentPays;
      const educatorPay = total * SESSION_PRICING.THIRTY_MIN.educatorPercentage;
      const platformFee = total - educatorPay;

      return {
        total,
        educatorPay,
        platformFee,
      };
    }

    case "FORTY_FIVE_MIN": {
      const total = SESSION_PRICING.FORTY_FIVE_MIN.studentPays;
      const educatorPay =
        total * SESSION_PRICING.FORTY_FIVE_MIN.educatorPercentage;
      const platformFee = total - educatorPay;

      return {
        total,
        educatorPay,
        platformFee,
      };
    }

    case "SIXTY_MIN": {
      const total = SESSION_PRICING.SIXTY_MIN.studentPays;
      const educatorPay = total * SESSION_PRICING.SIXTY_MIN.educatorPercentage;
      const platformFee = total - educatorPay;

      return {
        total,
        educatorPay,
        platformFee,
      };
    }

    case "MONTHLY_SUBSCRIPTION": {
      // $200 / 8 sessions = $25 per session
      const perSession =
        SESSION_PRICING.MONTHLY_SUBSCRIPTION.studentPays /
        SESSION_PRICING.MONTHLY_SUBSCRIPTION.sessions;

      const educatorPay =
        perSession * SESSION_PRICING.MONTHLY_SUBSCRIPTION.educatorPercentage;

      const platformFee = perSession - educatorPay;

      return {
        total: perSession,
        educatorPay,
        platformFee,
      };
    }

    default:
      throw new Error("Invalid session type");
  }
}

// ===============================
// REQUEST PAYOUT
// ===============================

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

    if (!paypalEmail || typeof paypalEmail !== "string") {
      throw new Error("A valid PayPal email is required");
    }

    // Check existing processing payout
    const existingPendingPayout = await prisma.payout.findFirst({
      where: {
        educatorId: educator.id,
        status: "Processing",
      },
    });

    if (existingPendingPayout) {
      throw new Error("You already have a pending payout request.");
    }

    // Get unpaid completed appointments
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        educatorId: educator.id,
        status: "Completed",
        payoutStatus: "Unpaid",
      },
    });

    if (completedAppointments.length === 0) {
      throw new Error("No completed unpaid sessions available");
    }

    let grossAmount = 0;
    let educatorEarnings = 0;
    let platformFees = 0;

    for (const appointment of completedAppointments) {
      const earnings = calculateSessionEarnings(appointment.payoutStatus);

      grossAmount += earnings.total;
      educatorEarnings += earnings.educatorPay;
      platformFees += earnings.platformFee;
    }

    // Create payout -> Cleaned of credits field!
    const payout = await prisma.payout.create({
      data: {
        educator: {
          connect: {
            id: educator.id,
          },
        },
        amount: grossAmount,
        netAmount: educatorEarnings,
        platformFee: platformFees,
        paypalEmail,
        status: "Processing",
      },
    });

    // Mark appointments as processing payout
    await prisma.appointment.updateMany({
      where: {
        id: {
          in: completedAppointments.map((a) => a.id),
        },
      },
      data: {
        payoutStatus: "Processing",
      },
    });

    revalidatePath("/educator");

    return {
      success: true,
      payout,
    };
  } catch (error) {
    console.error("Failed to request payout:", error);
    throw new Error("Failed to request payout: " + error);
  }
}

// ===============================
// GET EDUCATOR PAYOUTS
// ===============================

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
        educatorId: educator.id,
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

// ===============================
// GET EDUCATOR EARNINGS
// ===============================

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

    const completedAppointments = await prisma.appointment.findMany({
      where: {
        educatorId: educator.id,
        status: "Completed",
      },
    });

    let totalEarnings = 0;
    let totalPlatformFees = 0;

    // Current month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    let thisMonthEarnings = 0;

    for (const appointment of completedAppointments) {
      const earnings = calculateSessionEarnings(appointment.payoutStatus);

      totalEarnings += earnings.educatorPay;
      totalPlatformFees += earnings.platformFee;

      if (new Date(appointment.createdAt) >= currentMonth) {
        thisMonthEarnings += earnings.educatorPay;
      }
    }

    // Available unpaid sessions
    const unpaidAppointments = completedAppointments.filter(
      (a) => a.payoutStatus === "Unpaid",
    );

    let availablePayout = 0;

    for (const appointment of unpaidAppointments) {
      const earnings = calculateSessionEarnings(appointment.payoutStatus);

      availablePayout += earnings.educatorPay;
    }

    const averageEarningsPerMonth =
      totalEarnings > 0
        ? totalEarnings / Math.max(1, new Date().getMonth() + 1)
        : 0;

    return {
      earnings: {
        totalEarnings,
        thisMonthEarnings,
        completedAppointments: completedAppointments.length,
        averageEarningsPerMonth,
        availablePayout,
        totalPlatformFees,
      },
    };
  } catch (error) {
    throw new Error("Failed to fetch educator earnings: " + error);
  }
}

// "use server";

// import { auth } from "@/lib/auth";
// import prisma from "@/lib/prisma";
// import { headers } from "next/headers";

// export async function requestPayout(formData: FormData) {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user) {
//     throw new Error("Unauthorized");
//   }

//   try {
//     const educator = await prisma.user.findUnique({
//       where: {
//         id: session.user.id,
//         role: "Educator",
//       },
//     });

//     if (!educator) {
//       throw new Error("Educator not found");
//     }

//     const paypalEmail = formData.get("paypalEmail");

//     // 1. Check for null/undefined and ensure it's not a File object
//     if (!paypalEmail || typeof paypalEmail !== "string") {
//       throw new Error("A valid PayPal email is required");
//     }

//     if (!paypalEmail) {
//       throw new Error("PayPal email is required");
//     }

//     // Check if educator has any pending payout requests
//     const existingPendingPayout = await prisma.payout.findFirst({
//       where: {
//         id: educator.id,
//         status: "Processing",
//       },
//     });

//     if (existingPendingPayout) {
//       throw new Error(
//         "You already have a pending payout request. Please wait for it to be processed.",
//       );
//     }

//     // Get doctor's current credit balance
//     const creditCount = educator.credits;

//     if (creditCount === 0) {
//       throw new Error("No credits available for payout");
//     }

//     if (creditCount < 1) {
//       throw new Error("Minimum 1 credit required for payout");
//     }

//     const totalAmount = creditCount * CREDIT_VALUE;
//     const platformFee = creditCount * PLATFORM_FEE_PER_CREDIT;
//     const netAmount = creditCount * EDUCATOR_EARNINGS_PER_CREDIT;

//     // Create payout request
//     const payout = await prisma.payout.create({
//       data: {
//         educator: {
//           connect: {
//             id: educator.id,
//           },
//         },
//         amount: totalAmount,
//         credits: creditCount,
//         platformFee,
//         netAmount,
//         paypalEmail,
//         status: "Processing",
//       },
//     });

//     revalidatePath("/educator");
//     return { success: true, payout };
//   } catch (error) {
//     console.error("Failed to request payout:", error);
//     throw new Error("Failed to request payout: " + error);
//   }
// }

// export async function getEducatorPayouts() {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user) {
//     throw new Error("Unauthorized");
//   }

//   try {
//     const educator = await prisma.user.findUnique({
//       where: {
//         id: session.user.id,
//         role: "Educator",
//       },
//     });

//     if (!educator) {
//       throw new Error("Educator not found");
//     }

//     const payouts = await prisma.payout.findMany({
//       where: {
//         id: educator.id,
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     return { payouts };
//   } catch (error) {
//     throw new Error("Failed to fetch payouts: " + error);
//   }
// }

// export async function getEducatorEarnings() {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });
//   if (!session?.user) {
//     throw new Error("Unauthorized");
//   }
//   try {
//     const educator = await prisma.user.findUnique({
//       where: {
//         id: session.user.id,
//         role: "Educator",
//       },
//     });
//     if (!educator) {
//       throw new Error("Educator not found");
//     }
//     // Get all completed appointments for this doctor
//     const completedAppointments = await prisma.appointment.findMany({
//       where: {
//         id: educator.id,
//         status: "Completed",
//       },
//     });
//     // Calculate this month's completed appointments
//     const currentMonth = new Date();
//     currentMonth.setDate(1);
//     currentMonth.setHours(0, 0, 0, 0);
//     const thisMonthAppointments = completedAppointments.filter(
//       (appointment) => new Date(appointment.createdAt) >= currentMonth,
//     );
//     // Use doctor's actual credits from the user model
//     const totalEarnings = educator.credits * EDUCATOR_EARNINGS_PER_CREDIT; // $8 per credit to doctor
//     // Calculate this month's earnings (2 credits per appointment * $8 per credit)
//     const thisMonthEarnings =
//       thisMonthAppointments.length * 2 * EDUCATOR_EARNINGS_PER_CREDIT;
//     // Simple average per month calculation
//     const averageEarningsPerMonth =
//       totalEarnings > 0
//         ? totalEarnings / Math.max(1, new Date().getMonth() + 1)
//         : 0;
//     // Get current credit balance for payout calculations
//     const availableCredits = educator.credits;
//     const availablePayout = availableCredits * EDUCATOR_EARNINGS_PER_CREDIT;
//     return {
//       earnings: {
//         totalEarnings,
//         thisMonthEarnings,
//         completedAppointments: completedAppointments.length,
//         averageEarningsPerMonth,
//         availableCredits,
//         availablePayout,
//       },
//     };
//   } catch (error) {
//     throw new Error("Failed to fetch doctor earnings: " + error);
//   }
// }
