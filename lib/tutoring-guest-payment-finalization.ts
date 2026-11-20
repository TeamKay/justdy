
import { randomBytes } from "node:crypto";
import Stripe from "stripe";

import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { ensureSocialProfileForUser } from "@/lib/social/ensure-profile";
import {
  CAPABILITIES,
  ensureCapabilities,
  hasCapability,
} from "@/lib/auth/capabilities";

function getPaymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;
}

async function refundGuestPayment(
  session: Stripe.Checkout.Session,
  guestCheckoutId: string,
  reason: string,
) {
  const paymentIntentId = getPaymentIntentId(session);

  if (!paymentIntentId) {
    throw new Error(
      `Cannot refund guest checkout ${guestCheckoutId}: payment intent is missing.`,
    );
  }

  return stripe.refunds.create(
    {
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
      metadata: {
        guestCheckoutId,
        reason,
      },
    },
    {
      idempotencyKey: `justdy-guest-tutoring-${reason}-${session.id}`,
    },
  );
}

/**
 * Find an existing learner or create an account after successful payment.
 * Newly created accounts receive a password setup email after booking.
 */
async function findOrCreateGuestLearner(
  guest: {
    name: string;
    email: string;
    phoneNumber: string | null;
    studentId: string | null;
  },
  stripeCustomerId: string | null,
) {
  const email = guest.email.trim().toLowerCase();

  if (!email) {
    throw new Error("Guest tutoring checkout has no learner email.");
  }

  let user = guest.studentId
    ? await prisma.user.findUnique({
        where: { id: guest.studentId },
      })
    : await prisma.user.findUnique({
        where: { email },
      });

  if (guest.studentId && (!user || user.email.toLowerCase() !== email)) {
    throw new Error(
      "Authenticated guest checkout does not match its learner account.",
    );
  }

  let createdByThisCheckout = false;

  if (!user) {
    const temporaryPassword =
      randomBytes(48).toString("base64url") + "Aa1!";

    try {
      await auth.api.signUpEmail({
        headers: new Headers({
          "x-justdy-account-setup": "true",
        }),
        body: {
          name: guest.name.trim() || "Learner",
          email,
          password: temporaryPassword,
        },
      });

      user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error(
          "Learner account creation did not produce a user.",
        );
      }

      createdByThisCheckout = true;
    } catch (error) {
      // Recover if a concurrent webhook or browser return
      // already created the same learner account.
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) throw error;
    }
  }

  if (!user) {
    throw new Error("Unable to resolve guest learner account.");
  }

  const updateData: {
    emailVerified?: boolean;
    phoneNumber?: string;
    stripeCustomerId?: string;
  } = {};

  if (createdByThisCheckout) {
    updateData.emailVerified = true;
  }

  if (!user.phoneNumber && guest.phoneNumber) {
    updateData.phoneNumber = guest.phoneNumber;
  }

  if (!user.stripeCustomerId && stripeCustomerId) {
    updateData.stripeCustomerId = stripeCustomerId;
  }

  if (Object.keys(updateData).length > 0) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
  }

  await ensureSocialProfileForUser(user.id);

  await ensureCapabilities(user.id, [
    CAPABILITIES.LEARN,
    CAPABILITIES.BOOK_TUTORING,
  ]);

  return {
    user,
    createdByThisCheckout,
  };
}

/**
 * Finalizes guest tutoring payments into the canonical
 * Booking, Transaction, TutoringSession and Whiteboard records.
 *
 * Safe for both Stripe webhook and browser-return processing.
 */
export async function processGuestTutoringBooking(
  session: Stripe.Checkout.Session,
): Promise<{
  processed: boolean;
  bookingId?: string;
}> {
  if (session.metadata?.checkoutType !== "TUTORING_GUEST") {
    return { processed: false };
  }

  if (session.payment_status !== "paid") {
    return { processed: false };
  }

  if (session.mode !== "payment") {
    throw new Error("Guest tutoring requires one-time payment mode.");
  }

  const metadata = session.metadata;
  const guestCheckoutId = metadata.guestCheckoutId?.trim();

  if (!guestCheckoutId) {
    throw new Error("Missing guestCheckoutId Stripe metadata.");
  }

  const guest = await prisma.guestTutoringCheckout.findUnique({
    where: { id: guestCheckoutId },
  });

  if (!guest) {
    throw new Error("Guest tutoring checkout was not found.");
  }

  if (
    guest.stripeSessionId &&
    guest.stripeSessionId !== session.id
  ) {
    throw new Error(
      "Guest checkout belongs to another Stripe session.",
    );
  }

  if (
    session.client_reference_id &&
    session.client_reference_id !== guest.id
  ) {
    throw new Error("Stripe client reference mismatch.");
  }

  if (
    metadata.educatorId !== guest.educatorId ||
    metadata.serviceId !== guest.serviceId ||
    (metadata.availabilityId || "") !== guest.availabilityId
  ) {
    throw new Error("Guest checkout metadata verification failed.");
  }

  if (session.amount_total !== guest.amount) {
    throw new Error("Guest payment amount mismatch.");
  }

  if (
    session.currency?.toLowerCase() !==
    guest.currency.toLowerCase()
  ) {
    throw new Error("Guest payment currency mismatch.");
  }

  const stripeEmail = (
    session.customer_details?.email ||
    session.customer_email ||
    ""
  ).trim().toLowerCase();

  if (
    stripeEmail &&
    stripeEmail !== guest.email.trim().toLowerCase()
  ) {
    throw new Error("Stripe customer email mismatch.");
  }

  // Repeated webhook/browser return: repair canonical records.
  if (guest.status === "Paid" && guest.bookingId) {
    await ensureCanonicalRecords(guest.bookingId);
    await sendGuestAccountSetupIfNeeded(guest.id);

    return {
      processed: true,
      bookingId: guest.bookingId,
    };
  }

  // A payment arriving after checkout expiration or cancellation
  // must not create an overlapping booking.
  if (
    ["Cancelled", "Expired", "Refunded"].includes(guest.status)
  ) {
    if (guest.status !== "Refunded") {
      await refundGuestPayment(
        session,
        guest.id,
        "late-payment",
      );

      await prisma.guestTutoringCheckout.updateMany({
        where: {
          id: guest.id,
          status: guest.status,
        },
        data: { status: "Refunded" },
      });
    }

    return { processed: true };
  }

  if (guest.status !== "PendingPayment") {
    throw new Error(
      `Guest checkout cannot be finalized from ${guest.status}.`,
    );
  }

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : null;

  // Verify the tutor and service before creating the booking.
  const [educator, service, availability] = await Promise.all([
    prisma.user.findFirst({
      where: {
        id: guest.educatorId,
        status: "Active",
        teachingProfile: {
          verificationStatus: "Verified",
        },
      },
      select: {
        id: true,
      },
    }),

    prisma.service.findFirst({
      where: {
        id: guest.serviceId,
        providerId: guest.educatorId,
        type: "TUTORING",
        status: "Published",
      },
      select: {
        id: true,
      },
    }),

    prisma.availability.findUnique({
      where: {
        id: guest.availabilityId,
      },
      select: {
        id: true,
        educatorId: true,
        startTime: true,
        endTime: true,
        status: true,
        active: true,
      },
    }),
  ]);

  const tutorCanTeach = educator
    ? await hasCapability(educator.id, CAPABILITIES.TUTOR)
    : false;

  const validAvailability =
    availability &&
    availability.educatorId === guest.educatorId &&
    availability.active &&
    availability.startTime &&
    availability.endTime &&
    guest.startTime >= availability.startTime &&
    guest.endTime <= availability.endTime &&
    ["Available", "Booked"].includes(availability.status);

  if (!educator || !service || !tutorCanTeach || !validAvailability) {
    await refundGuestPayment(
      session,
      guest.id,
      "invalid-booking",
    );

    await prisma.guestTutoringCheckout.updateMany({
      where: {
        id: guest.id,
        status: "PendingPayment",
      },
      data: { status: "Refunded" },
    });

    return { processed: true };
  }

  const learnerResult = await findOrCreateGuestLearner(
    guest,
    stripeCustomerId,
  );

  const learner = learnerResult.user;
  const paymentIntentId = getPaymentIntentId(session);

  let finalizedBookingId: string | undefined;

  try {
    await prisma.$transaction(
      async (tx) => {
        // Serialize duplicate finalization requests.
        await tx.$queryRaw`
          SELECT id
          FROM "GuestTutoringCheckout"
          WHERE id = ${guest.id}
          FOR UPDATE
        `;

        const current = await tx.guestTutoringCheckout.findUnique({
          where: { id: guest.id },
        });

        if (!current) {
          throw new Error("Guest checkout disappeared.");
        }

        if (
          current.stripeSessionId &&
          current.stripeSessionId !== session.id
        ) {
          throw new Error("Stripe session mismatch.");
        }

        if (current.status === "Paid" && current.bookingId) {
          finalizedBookingId = current.bookingId;
          return;
        }

        if (current.status !== "PendingPayment") {
          throw new Error(
            `Guest checkout status changed to ${current.status}.`,
          );
        }

        // Lock the availability row to serialize bookings
        // using the same educator availability window.
        await tx.$queryRaw`
          SELECT id
          FROM "Availability"
          WHERE id = ${current.availabilityId}
          FOR UPDATE
        `;

        const conflicts = await tx.booking.findFirst({
          where: {
            educatorId: current.educatorId,
            status: {
              in: ["PendingPayment", "Scheduled"],
            },
            startTime: { lt: current.endTime },
            endTime: { gt: current.startTime },
          },
          select: { id: true },
        });

        const competingGuestHold =
          await tx.guestTutoringCheckout.findFirst({
            where: {
              id: { not: current.id },
              educatorId: current.educatorId,
              status: "PendingPayment",
              createdAt: {
                gte: new Date(Date.now() - 40 * 60_000),
              },
              startTime: { lt: current.endTime },
              endTime: { gt: current.startTime },
            },
            select: { id: true },
          });

        if (conflicts || competingGuestHold) {
          throw new Error("GUEST_SLOT_CONFLICT");
        }

        const booking = await tx.booking.create({
          data: {
            studentId: learner.id,
            educatorId: current.educatorId,
            serviceId: current.serviceId,
            availabilityId: current.availabilityId,
            startTime: current.startTime,
            endTime: current.endTime,
            subject: current.subject,
            gradeLevel: current.gradeLevel,
            description: current.description,
            status: "Scheduled",
            payoutStatus: "Unpaid",
            stripeSessionId: session.id,
            paymentIntentId,
          },
          select: { id: true },
        });

        finalizedBookingId = booking.id;

        const existingTransaction =
          await tx.transaction.findFirst({
            where: {
              stripeSessionId: session.id,
            },
            select: {
              id: true,
              userId: true,
            },
          });

        if (existingTransaction) {
          if (
            existingTransaction.userId &&
            existingTransaction.userId !== learner.id
          ) {
            throw new Error(
              "Payment belongs to another learner.",
            );
          }

          await tx.transaction.update({
            where: { id: existingTransaction.id },
            data: {
              userId: learner.id,
              amount: session.amount_total ?? 0,
              stripePaymentIntentId: paymentIntentId,
              status: "Paid",
            },
          });
        } else {
          await tx.transaction.create({
            data: {
              userId: learner.id,
              amount: session.amount_total ?? 0,
              stripeSessionId: session.id,
              stripePaymentIntentId: paymentIntentId,
              status: "Paid",
            },
          });
        }

        await tx.tutoringSession.upsert({
          where: {
            bookingId: booking.id,
          },
          create: {
            bookingId: booking.id,
            learnerId: learner.id,
            educatorId: current.educatorId,
            serviceId: current.serviceId,
            scheduledStart: current.startTime,
            scheduledEnd: current.endTime,
            status: "SCHEDULED",
            topic: current.subject,
            tutorNotes: current.description,
          },
          update: {},
        });

        await tx.whiteboard.upsert({
          where: {
            bookingId: booking.id,
          },
          create: {
            userId: learner.id,
            bookingId: booking.id,
            isStandalone: false,
            name: "Session Whiteboard",
            data: {
              version: 1,
              pages: [],
              currentPageIndex: 0,
            },
          },
          update: {},
        });

        await tx.guestTutoringCheckout.update({
          where: {
            id: current.id,
          },
          data: {
            status: "Paid",
            studentId: learner.id,
            bookingId: booking.id,
            paymentIntentId,
            accountCreatedByCheckout:
              learnerResult.createdByThisCheckout,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "GUEST_SLOT_CONFLICT"
    ) {
      await refundGuestPayment(
        session,
        guest.id,
        "slot-conflict",
      );

      await prisma.guestTutoringCheckout.updateMany({
        where: {
          id: guest.id,
          status: "PendingPayment",
        },
        data: { status: "Refunded" },
      });

      return { processed: true };
    }

    throw error;
  }

  if (!finalizedBookingId) {
    throw new Error("Guest booking was not finalized.");
  }

  await sendGuestAccountSetupIfNeeded(guest.id);

  console.log("GUEST TUTORING PAYMENT CONFIRMED:", {
    guestCheckoutId: guest.id,
    bookingId: finalizedBookingId,
    stripeSessionId: session.id,
  });

  return {
    processed: true,
    bookingId: finalizedBookingId,
  };
}

/**
 * Repair canonical session records for an already-paid booking.
 */
async function ensureCanonicalRecords(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Canonical guest booking was not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.tutoringSession.upsert({
      where: { bookingId },
      create: {
        bookingId,
        learnerId: booking.studentId,
        educatorId: booking.educatorId,
        serviceId: booking.serviceId,
        scheduledStart: booking.startTime,
        scheduledEnd: booking.endTime,
        status: "SCHEDULED",
        topic: booking.subject,
        tutorNotes: booking.description,
      },
      update: {},
    });

    await tx.whiteboard.upsert({
      where: { bookingId },
      create: {
        userId: booking.studentId,
        bookingId,
        isStandalone: false,
        name: "Session Whiteboard",
        data: {
          version: 1,
          pages: [],
          currentPageIndex: 0,
        },
      },
      update: {},
    });
  });
}

/**
 * Send account setup instructions to newly created learners.
 */
async function sendGuestAccountSetupIfNeeded(
  guestCheckoutId: string,
) {
  const guest = await prisma.guestTutoringCheckout.findUnique({
    where: { id: guestCheckoutId },
  });

  if (
    !guest ||
    guest.status !== "Paid" ||
    !guest.accountCreatedByCheckout ||
    guest.accountSetupEmailSentAt
  ) {
    return;
  }

  const claimed = await prisma.guestTutoringCheckout.updateMany({
    where: {
      id: guestCheckoutId,
      status: "Paid",
      accountCreatedByCheckout: true,
      accountSetupEmailSentAt: null,
    },
    data: {
      accountSetupEmailSentAt: new Date(),
    },
  });

  if (claimed.count !== 1) return;

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  const purchaseData = {
    items: [
      {
        title: `Tutoring: ${guest.subject}`,
        type: "Tutoring Session",
        quantity: 1,
        amount: guest.amount,
        accessType: "course" as const,
      },
    ],
    amountPaid: (guest.amount / 100).toFixed(2),
    dashboardUrl: `${appUrl}/dashboard/tutoring/bookings`,
  };

  const encoded = Buffer.from(
    JSON.stringify(purchaseData),
    "utf8",
  ).toString("base64url");

  const redirectTo =
    `${appUrl}/reset-password?checkoutSetup=true` +
    `&purchaseData=${encodeURIComponent(encoded)}`;

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: guest.email,
        redirectTo,
      },
    });
  } catch (error) {
    await prisma.guestTutoringCheckout.updateMany({
      where: {
        id: guestCheckoutId,
        accountSetupEmailSentAt: { not: null },
      },
      data: {
        accountSetupEmailSentAt: null,
      },
    });

    console.error(
      "GUEST TUTORING ACCOUNT SETUP EMAIL FAILED:",
      {
        guestCheckoutId,
        error,
      },
    );
  }
}

/**
 * Releases a guest checkout after Stripe expires the session.
 */
export async function expireGuestTutoringCheckout(
  session: Stripe.Checkout.Session,
) {
  if (session.metadata?.checkoutType !== "TUTORING_GUEST") {
    return false;
  }

  const guestCheckoutId =
    session.metadata.guestCheckoutId?.trim();

  if (!guestCheckoutId) return false;

  await prisma.guestTutoringCheckout.updateMany({
    where: {
      id: guestCheckoutId,
      status: "PendingPayment",
    },
    data: {
      status: "Expired",
    },
  });

  return true;
}
