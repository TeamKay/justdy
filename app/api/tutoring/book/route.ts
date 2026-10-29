import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";

const DEFAULT_CURRENCY = "usd";

type BookingRequest = {
  educatorId?: unknown;
  serviceId?: unknown;
  availabilityId?: unknown;
  recurringRuleId?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  subject?: unknown;
  gradeLevel?: unknown;
  description?: unknown;
  topic?: unknown;
};

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    // ============================================================
    // 1. AUTHENTICATION
    // ============================================================

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to book a tutoring session." },
        { status: 401 },
      );
    }

    // ============================================================
    // 2. PARSE REQUEST
    // ============================================================

    let body: BookingRequest;

    try {
      body = (await request.json()) as BookingRequest;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const educatorId = stringValue(body.educatorId);
    const serviceId = stringValue(body.serviceId);
    let availabilityId = stringValue(body.availabilityId);
    const requestedStartTimeValue = stringValue(body.startTime);
    const requestedEndTimeValue = stringValue(body.endTime);

    const subject = stringValue(body.subject);
    const gradeLevel = stringValue(body.gradeLevel);
    const description = stringValue(body.description);
    const topic = stringValue(body.topic);

    if (!educatorId) {
      return NextResponse.json(
        { error: "Educator is required." },
        { status: 400 },
      );
    }

    if (!requestedStartTimeValue || !requestedEndTimeValue) {
      return NextResponse.json(
        { error: "Select a date, time, and session length." },
        { status: 400 },
      );
    }

    // ============================================================
    // 3. PREVENT SELF-BOOKING
    // ============================================================

    if (educatorId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot book yourself as the educator." },
        { status: 400 },
      );
    }

    // ============================================================
    // 4. VERIFY EDUCATOR
    //
    // Canonical authorization:
    // active account + verified TeachingProfile + CAN_TUTOR.
    //
    // User.role is intentionally NOT used.
    // ============================================================

    const educator = await prisma.user.findFirst({
      where: {
        id: educatorId,
        status: "Active",
        teachingProfile: {
          verificationStatus: "Verified",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        teachingProfile: {
          select: {
            id: true,
            headline: true,
            verificationStatus: true,
            hourlyRate: true,
            currency: true,
          },
        },
      },
    });

    if (!educator?.teachingProfile) {
      return NextResponse.json(
        { error: "This educator is not currently available for tutoring." },
        { status: 404 },
      );
    }

    const canTutor = await hasCapability(educator.id, CAPABILITIES.TUTOR);

    if (!canTutor) {
      return NextResponse.json(
        { error: "This educator is not currently available for tutoring." },
        { status: 404 },
      );
    }

    // ============================================================
    // 5. RESOLVE OPTIONAL TUTORING SERVICE
    //
    // Find Tutor bookings may not use a Service.
    // If a serviceId is supplied, it must belong to this verified
    // educator and be a published tutoring service.
    // ============================================================

    const service = serviceId
      ? await prisma.service.findFirst({
          where: {
            id: serviceId,
            providerId: educatorId,
            type: "TUTORING",
            status: "Published",
          },
          select: {
            id: true,
            title: true,
            description: true,
            durationMinutes: true,
            price: true,
            currency: true,
            subject: true,
            gradeLevels: true,
          },
        })
      : null;

    if (serviceId && !service) {
      return NextResponse.json(
        {
          error: "The selected tutoring service is no longer available.",
        },
        { status: 404 },
      );
    }

    if (service && (service.price == null || service.price <= 0)) {
      return NextResponse.json(
        {
          error: "This tutoring service does not have a valid price.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // 6. CARD PAYMENT CURRENCY
    // ============================================================

    const currency = String(
      service?.currency ??
        educator.teachingProfile.currency ??
        DEFAULT_CURRENCY,
    ).toLowerCase();

    if (currency !== DEFAULT_CURRENCY) {
      return NextResponse.json(
        {
          error:
            "Card payments are currently available for USD tutoring services only. Ghana cedi payments will be added later.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // 7. PARSE REQUESTED SESSION TIME
    // ============================================================

    const requestedStartTime = new Date(requestedStartTimeValue);
    const requestedEndTime = new Date(requestedEndTimeValue);

    if (
      Number.isNaN(requestedStartTime.getTime()) ||
      Number.isNaN(requestedEndTime.getTime())
    ) {
      return NextResponse.json(
        { error: "The selected date or time is invalid." },
        { status: 400 },
      );
    }

    if (requestedEndTime <= requestedStartTime) {
      return NextResponse.json(
        { error: "The selected session has an invalid duration." },
        { status: 400 },
      );
    }

    /*
     * The tutor marketplace exposes recurring availability with a stable
     * synthetic id: recurring:<ruleId>:<YYYY-MM-DD>.
     *
     * IMPORTANT: do not materialize the tutor's entire future schedule here.
     * We create at most ONE concrete OCCURRENCE row for the date the learner
     * is actually booking.
     */
    let recurringRuleId = "";
    let recurringOccurrenceDate = "";

    if (availabilityId.startsWith("recurring:")) {
      const parts = availabilityId.split(":");
      recurringRuleId = parts[1] || "";
      recurringOccurrenceDate = parts.slice(2).join(":");

      if (
        !recurringRuleId ||
        !/^\d{4}-\d{2}-\d{2}$/.test(recurringOccurrenceDate)
      ) {
        return NextResponse.json(
          {
            error:
              "The selected tutoring availability is invalid. Please refresh and choose another time.",
          },
          { status: 400 },
        );
      }
    } else if (!availabilityId) {
      const fallbackRuleId = stringValue(body.recurringRuleId);

      if (fallbackRuleId) {
        recurringRuleId = fallbackRuleId;
        const fallbackDate = new Date(requestedStartTimeValue);

        if (!Number.isNaN(fallbackDate.getTime())) {
          recurringOccurrenceDate = fallbackDate.toISOString().slice(0, 10);
          availabilityId = `recurring:${fallbackRuleId}:${recurringOccurrenceDate}`;
        }
      }
    }

    if (!availabilityId) {
      return NextResponse.json(
        {
          error:
            "A valid tutoring availability must be selected. Please refresh and choose another time.",
        },
        { status: 400 },
      );
    }

    if (requestedStartTime <= new Date()) {
      return NextResponse.json(
        { error: "The selected tutoring time has already started." },
        { status: 400 },
      );
    }

    // ============================================================
    // 8. RESOLVE CONCRETE AVAILABILITY
    //
    // Availability is now the canonical source of truth.
    //
    // The learner may book a shorter session inside the teacher's
    // availability window.
    //
    // Example:
    //   Availability: 10:00 - 12:00
    //   Learner books: 10:30 - 11:30
    //
    // We do NOT require the learner's session to equal the entire
    // availability window.
    // ============================================================

    let availability = availabilityId
      ? await prisma.availability.findFirst({
          where: {
            id: availabilityId,
            educatorId,
            status: "Available",
          },
          select: {
            id: true,
            educatorId: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        })
      : null;

    if (availabilityId.startsWith("recurring:")) {
      // The real OCCURRENCE is created lazily, only for the date being booked.
      // The marketplace can therefore show many future recurring dates without
      // filling the Availability table with hundreds of rows.
      availability = null;
    }

    if (!availability && !availabilityId.startsWith("recurring:")) {
      return NextResponse.json(
        {
          error:
            "The selected tutoring time is no longer available. Please refresh and choose another time.",
        },
        { status: 409 },
      );
    }

    if (availability) {
      if (!availability.startTime || !availability.endTime) {
        return NextResponse.json(
          { error: "This availability slot is not bookable." },
          { status: 400 },
        );
      }

      // The availability window itself may already have started.
      // What matters for a flexible tutoring booking is that the
      // learner's requested session starts in the future and remains
      // completely inside the availability window.
      if (availability.endTime <= new Date()) {
        return NextResponse.json(
          {
            error:
              "The selected tutoring availability has ended. Please choose another time.",
          },
          { status: 400 },
        );
      }

      if (availability.endTime <= availability.startTime) {
        return NextResponse.json(
          {
            error:
              "The selected tutoring availability has an invalid duration.",
          },
          { status: 400 },
        );
      }

      if (
        requestedStartTime < availability.startTime ||
        requestedEndTime > availability.endTime
      ) {
        return NextResponse.json(
          {
            error:
              "The selected time is outside this tutor's availability. Please choose another time.",
          },
          { status: 409 },
        );
      }
    }

    // ============================================================
    // 9. CALCULATE AUTHORITATIVE BOOKING PRICE
    // ============================================================

    const bookingStartTime = requestedStartTime;
    const bookingEndTime = requestedEndTime;

    const bookingDurationMinutes = Math.floor(
      (bookingEndTime.getTime() - bookingStartTime.getTime()) / 60000,
    );

    if (bookingDurationMinutes <= 0) {
      return NextResponse.json(
        {
          error: "The selected tutoring session has an invalid duration.",
        },
        { status: 400 },
      );
    }

    // Keep a sensible minimum session length.
    if (bookingDurationMinutes < 15) {
      return NextResponse.json(
        {
          error: "Tutoring sessions must be at least 15 minutes long.",
        },
        { status: 400 },
      );
    }

    if (
      service?.durationMinutes != null &&
      service.durationMinutes > bookingDurationMinutes
    ) {
      return NextResponse.json(
        {
          error:
            "The selected tutoring service does not fit inside this availability slot.",
        },
        { status: 400 },
      );
    }

    const amount = service
      ? service.price!
      : Math.round(
          ((educator.teachingProfile.hourlyRate ?? 0) *
            bookingDurationMinutes) /
            60,
        );

    if (!service && (!educator.teachingProfile.hourlyRate || amount <= 0)) {
      return NextResponse.json(
        {
          error: "This tutor does not currently have a valid hourly rate.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // 10. RESERVE AVAILABILITY + CREATE PENDING BOOKING
    //
    // IMPORTANT:
    // For a flexible Find Tutor booking, we do NOT mark the entire
    // Availability row as "Booked", because another learner may
    // legitimately use another non-overlapping portion of the same
    // availability window.
    //
    // Instead, overlapping PendingPayment/Scheduled bookings are
    // checked transactionally.
    // ============================================================

    let booking;

    try {
      booking = await prisma.$transaction(
        async (tx) => {
          let concreteAvailabilityId = availability?.id ?? null;

          if (recurringRuleId && recurringOccurrenceDate) {
            const rule = await tx.availability.findFirst({
              where: {
                id: recurringRuleId,
                educatorId,
                type: "RECURRING",
                active: true,
              },
              select: {
                id: true,
                dayOfWeek: true,
                weeklyStartTime: true,
                weeklyEndTime: true,
                timeZone: true,
                excludedDates: true,
                isAlwaysAvailable: true,
              },
            });

            if (!rule) {
              throw new Error("SLOT_NOT_FOUND");
            }

            if (rule.excludedDates.includes(recurringOccurrenceDate)) {
              throw new Error("SLOT_UNAVAILABLE");
            }

            const [year, month, day] = recurringOccurrenceDate
              .split("-")
              .map(Number);

            const localDate = new Date(Date.UTC(year, month - 1, day));

            if (
              !Number.isInteger(year) ||
              !Number.isInteger(month) ||
              !Number.isInteger(day) ||
              localDate.toISOString().slice(0, 10) !== recurringOccurrenceDate
            ) {
              throw new Error("SLOT_NOT_FOUND");
            }

            if (
              !rule.isAlwaysAvailable &&
              localDate.getUTCDay() !== rule.dayOfWeek
            ) {
              throw new Error("SLOT_NOT_FOUND");
            }

            const zonedDateTimeToUtc = (time: string) => {
              const [hour, minute] = time.split(":").map(Number);
              let guess = new Date(
                Date.UTC(year, month - 1, day, hour, minute, 0, 0),
              );

              for (let i = 0; i < 4; i += 1) {
                const parts = new Intl.DateTimeFormat("en-US", {
                  timeZone: rule.timeZone,
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hourCycle: "h23",
                }).formatToParts(guess);

                const map = Object.fromEntries(
                  parts
                    .filter((part) => part.type !== "literal")
                    .map((part) => [part.type, part.value]),
                );

                const actual = Date.UTC(
                  Number(map.year),
                  Number(map.month) - 1,
                  Number(map.day),
                  Number(map.hour),
                  Number(map.minute),
                );
                const desired = Date.UTC(year, month - 1, day, hour, minute);
                const diff = desired - actual;

                if (Math.abs(diff) < 1000) return guess;
                guess = new Date(guess.getTime() + diff);
              }

              return guess;
            };

            let occurrenceStart: Date;
            let occurrenceEnd: Date;

            if (rule.isAlwaysAvailable) {
              const nextDate = new Date(localDate.getTime());
              nextDate.setUTCDate(nextDate.getUTCDate() + 1);

              const nextYear = nextDate.getUTCFullYear();
              const nextMonth = nextDate.getUTCMonth() + 1;
              const nextDay = nextDate.getUTCDate();

              occurrenceStart = zonedDateTimeToUtc("00:00");

              const [nextHour, nextMinute] = [0, 0];
              let guess = new Date(
                Date.UTC(
                  nextYear,
                  nextMonth - 1,
                  nextDay,
                  nextHour,
                  nextMinute,
                  0,
                  0,
                ),
              );

              for (let i = 0; i < 4; i += 1) {
                const parts = new Intl.DateTimeFormat("en-US", {
                  timeZone: rule.timeZone,
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hourCycle: "h23",
                }).formatToParts(guess);

                const map = Object.fromEntries(
                  parts
                    .filter((part) => part.type !== "literal")
                    .map((part) => [part.type, part.value]),
                );

                const actual = Date.UTC(
                  Number(map.year),
                  Number(map.month) - 1,
                  Number(map.day),
                  Number(map.hour),
                  Number(map.minute),
                );
                const desired = Date.UTC(
                  nextYear,
                  nextMonth - 1,
                  nextDay,
                  0,
                  0,
                );
                const diff = desired - actual;

                if (Math.abs(diff) < 1000) break;
                guess = new Date(guess.getTime() + diff);
              }

              occurrenceEnd = guess;
            } else {
              if (!rule.weeklyStartTime || !rule.weeklyEndTime) {
                throw new Error("SLOT_NOT_BOOKABLE");
              }

              occurrenceStart = zonedDateTimeToUtc(rule.weeklyStartTime);
              occurrenceEnd = zonedDateTimeToUtc(rule.weeklyEndTime);
            }

            if (
              occurrenceEnd <= occurrenceStart ||
              occurrenceEnd <= new Date()
            ) {
              throw new Error("SLOT_STARTED");
            }

            const occurrence = await tx.availability.upsert({
              where: {
                recurrenceKey_occurrenceDate: {
                  recurrenceKey: rule.id,
                  occurrenceDate: recurringOccurrenceDate,
                },
              },
              create: {
                educatorId,
                type: "OCCURRENCE",
                startTime: occurrenceStart,
                endTime: occurrenceEnd,
                dayOfWeek: rule.dayOfWeek,
                weeklyStartTime: rule.weeklyStartTime,
                weeklyEndTime: rule.weeklyEndTime,
                timeZone: rule.timeZone,
                active: true,
                isAlwaysAvailable: rule.isAlwaysAvailable,
                recurrenceKey: rule.id,
                occurrenceDate: recurringOccurrenceDate,
                excludedDates: [],
                status: "Available",
              },
              update: {},
              select: { id: true },
            });

            concreteAvailabilityId = occurrence.id;
          }

          if (!concreteAvailabilityId) {
            throw new Error("SLOT_NOT_FOUND");
          }

          // Lock the single concrete Availability row. A recurring booking
          // creates only this one OCCURRENCE row, never an entire schedule.
          await tx.$queryRaw`
            SELECT id
            FROM "Availability"
            WHERE id = ${concreteAvailabilityId}
            FOR UPDATE
          `;

          const currentAvailability = await tx.availability.findFirst({
            where: {
              id: concreteAvailabilityId,
              educatorId,
              status: "Available",
            },
            select: {
              id: true,
              educatorId: true,
              startTime: true,
              endTime: true,
              status: true,
            },
          });

          if (!currentAvailability) {
            throw new Error("SLOT_NOT_FOUND");
          }

          // Prisma Availability.startTime/endTime are nullable because
          // recurring rules intentionally have no concrete timestamps.
          // A booking, however, must always target a concrete occurrence
          // with real start/end timestamps.
          if (!currentAvailability.startTime || !currentAvailability.endTime) {
            throw new Error("SLOT_NOT_BOOKABLE");
          }

          if (
            bookingStartTime < currentAvailability.startTime ||
            bookingEndTime > currentAvailability.endTime
          ) {
            throw new Error("SLOT_OUTSIDE_AVAILABILITY");
          }

          // Do not reject the booking merely because the availability
          // window started earlier today. A learner may book a future
          // portion of a larger availability window (for example, a
          // 09:00-17:00 window with a 16:30 session). The requested
          // session start was already validated against the current time
          // above.

          // Prevent overlapping pending/scheduled sessions for this tutor.
          const existingBooking = await tx.booking.findFirst({
            where: {
              educatorId,
              status: {
                in: ["PendingPayment", "Scheduled"],
              },
              startTime: {
                lt: bookingEndTime,
              },
              endTime: {
                gt: bookingStartTime,
              },
            },
            select: {
              id: true,
            },
          });

          if (existingBooking) {
            throw new Error("SLOT_UNAVAILABLE");
          }

          const bookingDescription =
            [topic ? `Topic: ${topic}` : "", description]
              .filter(Boolean)
              .join("\n\n") || null;

          return tx.booking.create({
            data: {
              studentId: session.user.id,
              educatorId,
              serviceId: service?.id ?? null,

              // Every tutoring booking now points to the concrete
              // Availability record that contains the session.
              availabilityId: currentAvailability.id,

              startTime: bookingStartTime,
              endTime: bookingEndTime,

              subject,
              gradeLevel,
              description: bookingDescription,

              status: "PendingPayment",
              payoutStatus: "Unpaid",
            },

            select: {
              id: true,
              studentId: true,
              educatorId: true,
              serviceId: true,
              availabilityId: true,
              startTime: true,
              endTime: true,
              subject: true,
              gradeLevel: true,
              description: true,
              status: true,
            },
          });
        },
        {
          isolationLevel: "Serializable",
        },
      );
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "SLOT_NOT_FOUND":
            return NextResponse.json(
              {
                error:
                  "The selected tutoring time is no longer available. Please choose another time.",
              },
              { status: 404 },
            );

          case "SLOT_UNAVAILABLE":
            return NextResponse.json(
              {
                error:
                  "The selected tutoring time is no longer available. Please choose another time.",
              },
              { status: 409 },
            );

          case "SLOT_OUTSIDE_AVAILABILITY":
            return NextResponse.json(
              {
                error:
                  "The selected time is outside this tutor's availability. Please choose another time.",
              },
              { status: 409 },
            );

          case "SLOT_STARTED":
            return NextResponse.json(
              {
                error:
                  "The selected tutoring availability has already started.",
              },
              { status: 400 },
            );

          case "SLOT_NOT_BOOKABLE":
            return NextResponse.json(
              {
                error:
                  "The selected tutoring availability is not a bookable time slot. Please choose another time.",
              },
              { status: 409 },
            );

          default:
            break;
        }
      }

      throw error;
    }

    // ============================================================
    // 11. CREATE CARD-ONLY STRIPE CHECKOUT
    //
    // Phase 1 requirements:
    // - Card only
    // - No Link
    // - No billing address collection
    // - No shipping address
    // ============================================================

    let checkoutSession: Stripe.Checkout.Session;

    try {
      const checkoutParams = {
        mode: "payment",
        ui_mode: "elements",

        payment_method_types: ["card"],

        wallet_options: {
          link: {
            display: "never",
          },
        },

        // Do NOT collect billing address for phase one.
        billing_address_collection: "auto",

        line_items: [
          {
            price_data: {
              currency: DEFAULT_CURRENCY,
              unit_amount: amount,

              product_data: {
                name:
                  service?.title || `Private tutoring with ${educator.name}`,

                description:
                  service?.description ||
                  `${bookingDurationMinutes} minute personalized tutoring session.`,
              },
            },

            quantity: 1,
          },
        ],

        customer_email: session.user.email || undefined,

        client_reference_id: booking.id,

        return_url:
          `${getAppUrl()}/api/tutoring/payment/complete` +
          `?session_id={CHECKOUT_SESSION_ID}`,

        metadata: {
          checkoutType: "TUTORING",
          bookingId: booking.id,
          educatorId: booking.educatorId,
          studentId: booking.studentId,
          serviceId: booking.serviceId || "",
          availabilityId: booking.availabilityId || "",
          subject: booking.subject,
          gradeLevel: booking.gradeLevel,
        },
      } as unknown as Stripe.Checkout.SessionCreateParams;

      checkoutSession = await stripe.checkout.sessions.create(checkoutParams);
    } catch (stripeError) {
      console.error("TUTORING STRIPE CHECKOUT CREATION FAILED:", stripeError);

      // Stripe did not create a checkout session, so the pending
      // booking can safely be cancelled.
      await prisma.booking.updateMany({
        where: {
          id: booking.id,
          status: "PendingPayment",
        },
        data: {
          status: "Cancelled",
        },
      });

      return NextResponse.json(
        {
          error: "Unable to initialize payment. Please try again.",
        },
        { status: 500 },
      );
    }

    // ============================================================
    // 12. VERIFY EMBEDDED CHECKOUT CLIENT SECRET
    // ============================================================

    if (!checkoutSession.client_secret) {
      console.error(
        "TUTORING STRIPE CHECKOUT RETURNED NO CLIENT SECRET:",
        checkoutSession.id,
      );

      // Do not release/cancel the booking here.
      // Stripe has created a real checkout session and the learner
      // may still complete payment.
      return NextResponse.json(
        {
          error:
            "Payment was initialized but the secure checkout could not be loaded. Please contact support.",
        },
        { status: 500 },
      );
    }

    // ============================================================
    // 13. SAVE STRIPE SESSION ID
    // ============================================================

    try {
      await prisma.booking.update({
        where: {
          id: booking.id,
        },

        data: {
          stripeSessionId: checkoutSession.id,
        },
      });
    } catch (databaseError) {
      // Stripe already has a valid checkout session.
      // Do not cancel the booking because payment may still complete.
      console.error("TUTORING STRIPE SESSION SAVE FAILED:", databaseError);

      return NextResponse.json(
        {
          error:
            "Payment was initialized but the booking could not be finalized. Please contact support.",
        },
        { status: 500 },
      );
    }

    // ============================================================
    // 14. RETURN EMBEDDED CHECKOUT CLIENT SECRET
    // ============================================================

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      clientSecret: checkoutSession.client_secret,
      customerEmail: session.user.email || "",
      currency: currency.toUpperCase(),
      amount,
      paymentMethods: ["card"],
    });
  } catch (error) {
    console.error("POST /api/tutoring/book failed:", error);

    return NextResponse.json(
      {
        error: "Unable to create tutoring booking.",
      },
      { status: 500 },
    );
  }
}
