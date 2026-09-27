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


function getLocalDateTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      map.weekday,
    ),
    minutes: Number(map.hour) * 60 + Number(map.minute),
    dateKey: `${map.year}-${map.month}-${map.day}`,
  };
}

function clockMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

async function findMatchingRecurringRule(
  educatorId: string,
  start: Date,
  end: Date,
  preferredRuleId?: string,
) {
  const rules = await prisma.recurringAvailability.findMany({
    where: {
      educatorId,
      active: true,
      ...(preferredRuleId ? { id: preferredRuleId } : {}),
    },
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      timeZone: true,
      excludedDates: true,
    },
  });

  for (const rule of rules) {
    const localStart = getLocalDateTimeParts(start, rule.timeZone);
    const localEnd = getLocalDateTimeParts(end, rule.timeZone);

    if (localStart.dateKey !== localEnd.dateKey) continue;
    if (localStart.weekday !== rule.dayOfWeek) continue;
    if (rule.excludedDates.includes(localStart.dateKey)) continue;

    const ruleStart = clockMinutes(rule.startTime);
    const ruleEnd = clockMinutes(rule.endTime);

    if (
      localStart.minutes >= ruleStart &&
      localEnd.minutes <= ruleEnd &&
      localEnd.minutes > localStart.minutes
    ) {
      return rule;
    }
  }

  return null;
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
    const availabilityId = stringValue(body.availabilityId);
    const recurringRuleId = stringValue(body.recurringRuleId);
    const requestedStartTimeValue = stringValue(body.startTime);
    const requestedEndTimeValue = stringValue(body.endTime);
    const subject = stringValue(body.subject);
    const gradeLevel = stringValue(body.gradeLevel);
    const description = stringValue(body.description);
    const topic = stringValue(body.topic);

    if (!educatorId) {
      return NextResponse.json(
        {
          error: "Educator is required.",
        },
        { status: 400 },
      );
    }

    // Find Tutor bookings use a client-selected start/end time. The server
    // resolves that request to the teacher's actual availability window.
    // Service/program bookings can continue to use availabilityId.
    if (!serviceId && (!requestedStartTimeValue || !requestedEndTimeValue)) {
      return NextResponse.json(
        {
          error: "Select a date, time, and session length.",
        },
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
    // Canonical authorization:
    // active account + verified TeachingProfile + CAN_TUTOR.
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

    const canTutor = await hasCapability(
      educator.id,
      CAPABILITIES.TUTOR,
    );

    if (!canTutor) {
      return NextResponse.json(
        { error: "This educator is not currently available for tutoring." },
        { status: 404 },
      );
    }

    // ============================================================
    // 5. DETERMINE BOOKING TYPE + PRICE
    //
    // Find Tutor does not require a Service. A learner is requesting
    // a unique tutoring session and pays from the tutor's hourly rate.
    // If serviceId is supplied, preserve the existing program/service
    // booking flow and use the Service price.
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
        { error: "The selected tutoring service is no longer available." },
        { status: 404 },
      );
    }

    if (service && (service.price == null || service.price <= 0)) {
      return NextResponse.json(
        { error: "This tutoring service does not have a valid price." },
        { status: 400 },
      );
    }

    const currency = String(
      service?.currency ?? educator.teachingProfile.currency ?? DEFAULT_CURRENCY,
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
    // 7. RESOLVE THE REQUESTED TIME TO TEACHER AVAILABILITY
    //
    // Find Tutor:
    //   - the learner chooses the exact start/end time;
    //   - we find an availability window that contains the entire
    //     requested interval;
    //   - we do NOT treat the whole availability window as one
    //     indivisible booking slot.
    //
    // Service/program bookings:
    //   - preserve the existing availabilityId-based flow.
    // ============================================================

    const requestedStartTime = requestedStartTimeValue
      ? new Date(requestedStartTimeValue)
      : null;
    const requestedEndTime = requestedEndTimeValue
      ? new Date(requestedEndTimeValue)
      : null;

    if (
      !service &&
      (!requestedStartTime ||
        !requestedEndTime ||
        Number.isNaN(requestedStartTime.getTime()) ||
        Number.isNaN(requestedEndTime.getTime()))
    ) {
      return NextResponse.json(
        { error: "The selected date or time is invalid." },
        { status: 400 },
      );
    }

    if (
      !service &&
      requestedStartTime &&
      requestedEndTime &&
      requestedEndTime <= requestedStartTime
    ) {
      return NextResponse.json(
        { error: "The selected session has an invalid duration." },
        { status: 400 },
      );
    }

    if (
      !service &&
      requestedStartTime &&
      requestedEndTime &&
      requestedStartTime <= new Date()
    ) {
      return NextResponse.json(
        { error: "The selected tutoring time has already started." },
        { status: 400 },
      );
    }

    let availability;

    if (service) {
      if (!availabilityId) {
        return NextResponse.json(
          { error: "Educator and availability slot are required." },
          { status: 400 },
        );
      }

      availability = await prisma.availability.findUnique({
        where: {
          id: availabilityId,
        },
        select: {
          id: true,
          educatorId: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      });

      if (!availability || availability.educatorId !== educatorId) {
        return NextResponse.json(
          { error: "The selected tutoring slot could not be found." },
          { status: 404 },
        );
      }

      if (availability.endTime <= availability.startTime) {
        return NextResponse.json(
          { error: "The selected tutoring slot has an invalid duration." },
          { status: 400 },
        );
      }

      if (availability.startTime <= new Date()) {
        return NextResponse.json(
          { error: "The selected tutoring slot has already started." },
          { status: 400 },
        );
      }
    } else {
      const start = requestedStartTime!;
      const end = requestedEndTime!;

      if (availabilityId) {
        // Compatibility path for older concrete Availability records.
        availability = await prisma.availability.findFirst({
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
        });

        if (!availability) {
          return NextResponse.json(
            {
              error:
                "The selected tutoring time is no longer available. Please refresh and choose another time.",
            },
            { status: 409 },
          );
        }

        if (start < availability.startTime || end > availability.endTime) {
          return NextResponse.json(
            {
              error:
                "The selected time is outside this tutor's availability. Please choose another time.",
            },
            { status: 409 },
          );
        }
      } else {
        // Find Tutor normally uses recurring schedules as the source of
        // truth. Future Availability rows are not required to exist.
        const recurringRule = await findMatchingRecurringRule(
          educatorId,
          start,
          end,
          recurringRuleId || undefined,
        );

        if (!recurringRule) {
          return NextResponse.json(
            {
              error:
                "The selected time is no longer available with this tutor. Please refresh and choose another time.",
            },
            { status: 409 },
          );
        }

        availability = {
          id: "",
          educatorId,
          startTime: start,
          endTime: end,
          status: "Available" as const,
        };
      }
    }

    // ============================================================
    // 8. CALCULATE AUTHORITATIVE BOOKING PRICE
    // ============================================================

    const bookingStartTime = service
      ? availability.startTime
      : requestedStartTime!;

    const bookingEndTime = service
      ? availability.endTime
      : requestedEndTime!;

    const bookingDurationMinutes = Math.floor(
      (bookingEndTime.getTime() - bookingStartTime.getTime()) / 60000,
    );

    if (bookingDurationMinutes <= 0) {
      return NextResponse.json(
        { error: "The selected tutoring session has an invalid duration." },
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
        { error: "This tutor does not currently have a valid hourly rate." },
        { status: 400 },
      );
    }

    // ============================================================
    // 9. RESERVE SLOT + CREATE PENDING BOOKING
    // ============================================================

    let booking;

    try {
      booking = await prisma.$transaction(
        async (tx) => {
          // Service bookings lock a concrete Availability row. Find Tutor
          // bookings use the recurring schedule as their source of truth.
          let currentAvailability: {
            id: string;
            educatorId: string;
            startTime: Date;
            endTime: Date;
            status: string;
          } | null = null;

          if (service || availabilityId) {
            if (!availabilityId) {
              throw new Error("SLOT_NOT_FOUND");
            }

            await tx.$queryRaw`
              SELECT id
              FROM "Availability"
              WHERE id = ${availabilityId}
              FOR UPDATE
            `;

            currentAvailability = await tx.availability.findFirst({
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
            });

            if (
              !currentAvailability ||
              bookingStartTime < currentAvailability.startTime ||
              bookingEndTime > currentAvailability.endTime
            ) {
              throw new Error("SLOT_OUTSIDE_AVAILABILITY");
            }
          } else {
            const matchingRule = await tx.recurringAvailability.findFirst({
              where: {
                id: recurringRuleId || undefined,
                educatorId,
                active: true,
              },
              select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                timeZone: true,
                excludedDates: true,
              },
            });

            if (!matchingRule) {
              throw new Error("SLOT_NOT_FOUND");
            }

            const localStart = getLocalDateTimeParts(
              bookingStartTime,
              matchingRule.timeZone,
            );
            const localEnd = getLocalDateTimeParts(
              bookingEndTime,
              matchingRule.timeZone,
            );

            if (
              localStart.dateKey !== localEnd.dateKey ||
              localStart.weekday !== matchingRule.dayOfWeek ||
              matchingRule.excludedDates.includes(localStart.dateKey) ||
              localStart.minutes < clockMinutes(matchingRule.startTime) ||
              localEnd.minutes > clockMinutes(matchingRule.endTime)
            ) {
              throw new Error("SLOT_OUTSIDE_AVAILABILITY");
            }
          }

          if (service) {
            if (!currentAvailability) {
              throw new Error("SLOT_NOT_FOUND");
            }

            if (currentAvailability.startTime <= new Date()) {
              throw new Error("SLOT_STARTED");
            }
          } else if (bookingStartTime <= new Date()) {
            throw new Error("SLOT_STARTED");
          }

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

          if (service) {
            if (!currentAvailability) {
              throw new Error("SLOT_NOT_FOUND");
            }

            const availabilityToBook = currentAvailability;

            const updatedAvailability = await tx.availability.updateMany({
              where: {
                id: availabilityToBook.id,
                educatorId,
                status: "Available",
              },
              data: {
                status: "Booked",
              },
            });

            if (updatedAvailability.count !== 1) {
              throw new Error("SLOT_UNAVAILABLE");
            }
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
              availabilityId: service
                ? currentAvailability?.id ?? null
                : null,
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
                error: "The selected tutoring slot has already started.",
              },
              { status: 400 },
            );

          default:
            break;
        }
      }

      throw error;
    }

    // ============================================================
    // 10. CREATE CARD-ONLY STRIPE CHECKOUT
    // ============================================================

    let checkoutSession: Stripe.Checkout.Session;

    try {
      /*
       * Stripe Checkout Elements uses `ui_mode: "elements"` for a custom
       * payment UI composed from Checkout Elements. The double assertion
       * keeps this compatible with projects whose installed Stripe Node SDK
       * types lag the API.
       */
      const checkoutParams = {
        mode: "payment",
        ui_mode: "elements",
        payment_method_types: ["card"],
        wallet_options: {
          link: {
            display: "never",
          },
        },
        billing_address_collection: "required",

        line_items: [
          {
            price_data: {
              currency: DEFAULT_CURRENCY,
              unit_amount: amount,
              product_data: {
                name: service?.title || `Private tutoring with ${educator.name}`,
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
      console.error(
        "TUTORING STRIPE CHECKOUT CREATION FAILED:",
        stripeError,
      );

      // Stripe did not create a checkout session, so the reservation
      // can safely be released.
      await prisma.$transaction(async (tx) => {
        await tx.booking.updateMany({
          where: {
            id: booking.id,
            status: "PendingPayment",
          },
          data: {
            status: "Cancelled",
          },
        });

        if (service) {
          await tx.availability.updateMany({
            where: {
              id: booking.availabilityId ?? undefined,
              educatorId: booking.educatorId,
              status: "Booked",
            },
            data: {
              status: "Available",
            },
          });
        }
      });

      return NextResponse.json(
        {
          error: "Unable to initialize payment. Please try again.",
        },
        { status: 500 },
      );
    }

    // ============================================================
    // 11. VERIFY EMBEDDED CHECKOUT CLIENT SECRET
    // ============================================================

    if (!checkoutSession.client_secret) {
      console.error(
        "TUTORING STRIPE CHECKOUT RETURNED NO CLIENT SECRET:",
        checkoutSession.id,
      );

      // Do not release the slot. Stripe has created a real checkout
      // session and the learner may still complete payment.
      return NextResponse.json(
        {
          error:
            "Payment was initialized but the secure checkout could not be loaded. Please contact support.",
        },
        { status: 500 },
      );
    }

    // ============================================================
    // 12. SAVE STRIPE SESSION ID
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
      // Stripe already has a valid checkout session. Do not release
      // the availability slot here.
      console.error(
        "TUTORING STRIPE SESSION SAVE FAILED:",
        databaseError,
      );

      return NextResponse.json(
        {
          error:
            "Payment was initialized but the booking could not be finalized. Please contact support.",
        },
        { status: 500 },
      );
    }

    // ============================================================
    // 13. RETURN EMBEDDED CHECKOUT CLIENT SECRET
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
