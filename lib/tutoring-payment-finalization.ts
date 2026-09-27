import Stripe from "stripe";
import prisma from "@/lib/prisma";

export async function processUniversalTutoringBooking(
  session: Stripe.Checkout.Session,
) {
  const bookingId = session.metadata?.bookingId;

  if (!bookingId) {
    throw new Error("Tutoring checkout is missing bookingId.");
  }

  if (session.metadata?.checkoutType !== "TUTORING") {
    return false;
  }

  // ============================================================
  // PAYMENT VERIFICATION
  // ============================================================

  if (session.payment_status !== "paid") {
    console.warn("TUTORING CHECKOUT HAS NOT BEEN PAID:", {
      sessionId: session.id,
      bookingId,
      paymentStatus: session.payment_status,
    });

    return true;
  }

  // ============================================================
  // LOAD BOOKING
  // ============================================================

  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },

    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      educator: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          teachingProfile: {
            select: {
              verificationStatus: true,
              hourlyRate: true,
              currency: true,
            },
          },
        },
      },

      service: {
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
        },
      },

      availability: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error(`Tutoring booking ${bookingId} was not found.`);
  }

  // ============================================================
  // STRIPE SESSION VERIFICATION
  // ============================================================

  if (booking.stripeSessionId && booking.stripeSessionId !== session.id) {
    throw new Error(
      "Booking is already associated with another Stripe checkout session.",
    );
  }

  // ============================================================
  // METADATA VERIFICATION
  // ============================================================

  if (session.metadata?.studentId !== booking.studentId) {
    throw new Error("Stripe student metadata does not match booking.");
  }

  if (session.metadata?.educatorId !== booking.educatorId) {
    throw new Error("Stripe educator metadata does not match booking.");
  }

const stripeAvailabilityId =
  session.metadata?.availabilityId?.trim() || null;

const stripeServiceId =
  session.metadata?.serviceId?.trim() || null;

if (stripeAvailabilityId !== (booking.availabilityId ?? null)) {
  throw new Error("Stripe availability metadata does not match booking.");
}

if (stripeServiceId !== (booking.serviceId ?? null)) {
  throw new Error("Stripe service metadata does not match booking.");
}

  // ============================================================
  // AMOUNT + CURRENCY VERIFICATION
  //
  // Service bookings use the fixed Service price.
  // Find Tutor bookings use the tutor hourly rate multiplied by
  // the exact learner-selected session duration.
  // ============================================================

  const bookingDurationMinutes = Math.floor(
    (booking.endTime.getTime() - booking.startTime.getTime()) / 60000,
  );

  if (bookingDurationMinutes <= 0) {
    throw new Error("Tutoring booking has an invalid duration.");
  }

  const expectedAmount = booking.service?.price
    ? booking.service.price
    : Math.round(
        ((booking.educator.teachingProfile?.hourlyRate ?? 0) *
          bookingDurationMinutes) /
          60,
      );

  if (expectedAmount <= 0) {
    throw new Error("Tutoring booking has no valid price.");
  }

  if (session.amount_total !== expectedAmount) {
    throw new Error(
      `Tutoring payment amount mismatch for booking ${booking.id}.`,
    );
  }

  const expectedCurrency = (
    booking.service?.currency ??
    booking.educator.teachingProfile?.currency ??
    "USD"
  ).toLowerCase();

  if (session.currency?.toLowerCase() !== expectedCurrency) {
    throw new Error(
      `Tutoring payment currency mismatch for booking ${booking.id}.`,
    );
  }

  // ============================================================
  // IDEMPOTENT PAYMENT HANDLING
  // ============================================================

  if (booking.status === "Scheduled") {
    await ensureCanonicalTutoringSession(booking);
    return true;
  }

  if (booking.status === "Cancelled" || booking.status === "Completed") {
    console.warn("Ignoring payment for closed tutoring booking:", {
      bookingId: booking.id,
      status: booking.status,
    });

    return true;
  }

  // ============================================================
  // VERIFY EDUCATOR
  // ============================================================

  if (booking.educator.status !== "Active") {
    throw new Error("Educator is no longer active.");
  }

  if (booking.educator.teachingProfile?.verificationStatus !== "Verified") {
    throw new Error("Educator is no longer verified.");
  }

  // ============================================================
  // COMPLETE PAYMENT + BOOKING
  // ============================================================

  await prisma.$transaction(
    async (tx) => {
      const currentBooking = await tx.booking.findUnique({
        where: {
          id: booking.id,
        },

        select: {
          id: true,
          status: true,
          stripeSessionId: true,
          availabilityId: true,
          studentId: true,
          educatorId: true,
          serviceId: true,
          startTime: true,
          endTime: true,
          subject: true,
          description: true,
        },
      });

      if (!currentBooking) {
        throw new Error("Booking disappeared during payment processing.");
      }

      if (
        currentBooking.stripeSessionId &&
        currentBooking.stripeSessionId !== session.id
      ) {
        throw new Error("Booking belongs to another Stripe session.");
      }

      if (currentBooking.status === "Scheduled") {
        return;
      }

      // ----------------------------------------------------------
      // LOCK AVAILABILITY
      // ----------------------------------------------------------

      if (currentBooking.availabilityId) {
        await tx.$queryRaw`
          SELECT id
          FROM "Availability"
          WHERE id = ${currentBooking.availabilityId}
          FOR UPDATE
        `;
      }

      // ----------------------------------------------------------
      // VERIFY AVAILABILITY + REQUESTED INTERVAL
      //
      // Find Tutor bookings leave the teacher's availability window
      // in Available state. The Booking itself reserves the exact
      // requested interval. Service bookings continue to reserve
      // the entire availability window as Booked.
      // ----------------------------------------------------------

      if (currentBooking.availabilityId) {
        const currentAvailability = await tx.availability.findUnique({
          where: {
            id: currentBooking.availabilityId,
          },

          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        });

        if (!currentAvailability) {
          throw new Error("Tutoring availability no longer exists.");
        }

        if (
          currentBooking.startTime < currentAvailability.startTime ||
          currentBooking.endTime > currentAvailability.endTime
        ) {
          throw new Error(
            "The tutoring booking is outside the educator's availability.",
          );
        }

        if (
          currentBooking.serviceId &&
          currentAvailability.status !== "Booked"
        ) {
          throw new Error(
            "Tutoring availability is not reserved for this booking.",
          );
        }

        if (
          !currentBooking.serviceId &&
          !["Available", "Booked"].includes(currentAvailability.status)
        ) {
          throw new Error("Tutoring availability is no longer available.");
        }

        const conflictingBooking = await tx.booking.findFirst({
          where: {
            id: {
              not: currentBooking.id,
            },
            educatorId: currentBooking.educatorId,
            status: {
              in: ["PendingPayment", "Scheduled"],
            },
            startTime: {
              lt: currentBooking.endTime,
            },
            endTime: {
              gt: currentBooking.startTime,
            },
          },
          select: {
            id: true,
          },
        });

        if (conflictingBooking) {
          throw new Error(
            "The tutoring time is no longer available because another booking overlaps it.",
          );
        }
      }

      // ----------------------------------------------------------
      // RECORD THE PAYMENT
      // ----------------------------------------------------------

      const existingTransaction = await tx.transaction.findFirst({
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
          existingTransaction.userId !== booking.studentId
        ) {
          throw new Error("Stripe transaction belongs to another user.");
        }

        await tx.transaction.update({
          where: { id: existingTransaction.id },
          data: {
            userId: booking.studentId,
            amount: session.amount_total ?? 0,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            status: "Paid",
          },
        });
      } else {
        await tx.transaction.create({
          data: {
            userId: booking.studentId,
            amount: session.amount_total ?? 0,
            stripeSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            status: "Paid",
          },
        });
      }

      // ----------------------------------------------------------
      // MARK PAYMENT + SCHEDULE
      // ----------------------------------------------------------

      await tx.booking.update({
        where: {
          id: booking.id,
        },

        data: {
          status: "Scheduled",

          stripeSessionId: session.id,

          paymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
        },
      });

      // ----------------------------------------------------------
      // CREATE / ENSURE CANONICAL TUTORING SESSION
      // ----------------------------------------------------------
      // bookingId is unique, so upsert keeps this safe on Stripe retries.
      await tx.tutoringSession.upsert({
        where: {
          bookingId: currentBooking.id,
        },

        create: {
          bookingId: currentBooking.id,
          learnerId: currentBooking.studentId,
          educatorId: currentBooking.educatorId,
          serviceId: currentBooking.serviceId,
          scheduledStart: currentBooking.startTime,
          scheduledEnd: currentBooking.endTime,
          status: "SCHEDULED",
          topic: currentBooking.subject,
          tutorNotes: currentBooking.description,
        },

        update: {
          learnerId: currentBooking.studentId,
          educatorId: currentBooking.educatorId,
          serviceId: currentBooking.serviceId,
          scheduledStart: currentBooking.startTime,
          scheduledEnd: currentBooking.endTime,
          status: "SCHEDULED",
          topic: currentBooking.subject,
          tutorNotes: currentBooking.description,
        },
      });
    },
    {
      isolationLevel: "Serializable",
    },
  );

  await ensureCanonicalTutoringSession(booking.id);

  console.log("TUTORING BOOKING PAYMENT CONFIRMED:", {
    bookingId: booking.id,
    stripeSessionId: session.id,
  });

  return true;
}

export async function ensureCanonicalTutoringSession(
  bookingOrId: {
    id: string;
    studentId?: string;
    educatorId?: string;
    serviceId?: string | null;
    startTime?: Date;
    endTime?: Date;
    availability?: { startTime: Date; endTime: Date } | null;
  } | string,
) {
  const booking =
    typeof bookingOrId === "string"
      ? await prisma.booking.findUnique({
          where: { id: bookingOrId },
          select: {
            id: true,
            studentId: true,
            educatorId: true,
            serviceId: true,
            startTime: true,
            endTime: true,
            availability: {
              select: { startTime: true, endTime: true },
            },
            videoSessionId: true,
          },
        })
      : await prisma.booking.findUnique({
          where: { id: bookingOrId.id },
          select: {
            id: true,
            studentId: true,
            educatorId: true,
            serviceId: true,
            startTime: true,
            endTime: true,
            availability: {
              select: { startTime: true, endTime: true },
            },
            videoSessionId: true,
          },
        });

  if (!booking) {
    throw new Error("Unable to initialize canonical tutoring session: booking not found.");
  }

  // Booking.startTime/endTime are authoritative. For Find Tutor,
  // they contain the learner-selected interval inside a larger
  // availability window.
  const startTime = booking.startTime;
  const endTime = booking.endTime;

  /*
   * IMPORTANT: Do not create the Vonage video session here.
   *
   * Stripe payment finalization must not fail just because the external
   * video provider is temporarily unavailable or returns an authorization
   * error. The payment, Booking, TutoringSession, and whiteboard records
   * are the canonical database state.
   *
   * The live classroom API creates the Vonage session lazily when the
   * learner or tutor actually joins. This also keeps abandoned/future
   * bookings from consuming unnecessary Vonage sessions.
   */

  await prisma.tutoringSession.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      learnerId: booking.studentId,
      educatorId: booking.educatorId,
      serviceId: booking.serviceId,
      scheduledStart: startTime,
      scheduledEnd: endTime,
      status: "SCHEDULED",
    },
    update: {
      learnerId: booking.studentId,
      educatorId: booking.educatorId,
      serviceId: booking.serviceId,
      scheduledStart: startTime,
      scheduledEnd: endTime,
    },
  });

  // Canonical tutoring whiteboard: one shared board per Booking.
  // The booking owner is stored as the board creator; access is granted
  // to both booking participants by the whiteboard API.
  await prisma.whiteboard.upsert({
    where: { bookingId: booking.id },
    create: {
      userId: booking.studentId,
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
}
