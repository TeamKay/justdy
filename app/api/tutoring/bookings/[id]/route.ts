import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { canManageChildren } from "@/lib/auth/capabilities";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

type Body = {
  action?: unknown;
  availabilityId?: unknown;
};

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

/**
 * Determines whether the authenticated user may modify the booking.
 *
 * Authorized users:
 * - The learner attached directly to the booking
 * - The tutor attached directly to the booking
 * - A parent/guardian who manages children and is linked to the
 *   learner through the same Family
 */
async function canManageBooking(
  userId: string,
  booking: {
    studentId: string;
    educatorId: string;
  },
): Promise<boolean> {
  // Learner or tutor can manage their own booking.
  if (booking.educatorId === userId || booking.studentId === userId) {
    return true;
  }

  // Everyone else must have child-management capability.
  if (!(await canManageChildren(userId))) {
    return false;
  }

  const memberships = await prisma.familyMember.findMany({
    where: {
      userId,
      role: {
        in: ["PARENT", "GUARDIAN"],
      },
    },
    select: {
      familyId: true,
    },
  });

  if (!memberships.length) {
    return false;
  }

  const familyIds = memberships.map((membership) => membership.familyId);

  const child = await prisma.familyMember.findFirst({
    where: {
      familyId: {
        in: familyIds,
      },
      userId: booking.studentId,
      role: "CHILD",
    },
    select: {
      userId: true,
    },
  });

  return Boolean(child);
}

/**
 * PATCH /api/tutorings/:id
 *
 * Canonical tutoring booking lifecycle endpoint.
 *
 * action=cancel
 * ----------------
 * Cancels a future Scheduled/PendingPayment booking and releases
 * its canonical Availability slot.
 *
 * For PendingPayment bookings with an active Stripe Checkout session,
 * the Checkout session is expired before the availability slot is
 * released. This prevents the customer from completing payment after
 * the slot has been released.
 *
 * action=reschedule
 * ------------------
 * Moves a paid Scheduled booking to another available slot for the
 * same tutor and service.
 *
 * No second Stripe charge is created.
 *
 * Refunds
 * -------
 * Automatic refunds are deliberately NOT inferred here. The product
 * blueprint requires cancellation/refund rules but does not define
 * the actual refund policy. Refund behavior should therefore follow
 * the configured business policy.
 */
export async function PATCH(
  request: Request,
  context: Context,
) {
  try {
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Booking ID is required." },
        { status: 400 },
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as Body | null;

    const action = stringValue(body?.action);
    const newAvailabilityId = stringValue(body?.availabilityId);

    if (action !== "cancel" && action !== "reschedule") {
      return NextResponse.json(
        {
          error:
            "Action must be 'cancel' or 'reschedule'.",
        },
        { status: 400 },
      );
    }

    /*
     * Load the booking and the relationships required for
     * authorization and lifecycle validation.
     */
    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },
      include: {
        availability: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
        service: {
          select: {
            id: true,
            durationMinutes: true,
            status: true,
          },
        },
        tutoringSession: {
          select: {
            id: true,
            status: true,
            startedAt: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 },
      );
    }

    /*
     * Authorization must happen before allowing any lifecycle
     * operation.
     */
    const authorized = await canManageBooking(user.id, {
      studentId: booking.studentId,
      educatorId: booking.educatorId,
    });

    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to change this booking.",
        },
        { status: 403 },
      );
    }

    /*
     * Terminal booking states cannot be changed.
     */
    if (
      booking.status === "Completed" ||
      booking.status === "Cancelled" ||
      booking.status === "NoShow"
    ) {
      return NextResponse.json(
        {
          error: "This booking can no longer be changed.",
        },
        { status: 409 },
      );
    }

    /*
     * Once a tutoring session has started, the booking must not
     * be cancelled or rescheduled through this endpoint.
     */
    if (
      booking.tutoringSession?.startedAt ||
      booking.tutoringSession?.status === "IN_PROGRESS" ||
      booking.tutoringSession?.status === "COMPLETED"
    ) {
      return NextResponse.json(
        {
          error:
            "A tutoring session that has started cannot be changed.",
        },
        { status: 409 },
      );
    }

    /*
     * A booking whose scheduled start time has already passed
     * cannot be changed through the normal lifecycle endpoint.
     */
    if (new Date(booking.startTime).getTime() <= Date.now()) {
      return NextResponse.json(
        {
          error:
            action === "cancel"
              ? "A session that has already started cannot be cancelled here."
              : "A session that has already started cannot be rescheduled here.",
        },
        { status: 409 },
      );
    }

    /*
     * ============================================================
     * CANCEL
     * ============================================================
     */
    if (action === "cancel") {
      /*
       * If this is a PendingPayment booking with an active Stripe
       * Checkout session, expire the Checkout session first.
       *
       * This is important because releasing the availability slot
       * before expiring Checkout could allow a customer to complete
       * payment against a slot that has already been made available
       * to somebody else.
       */
      if (
        booking.status === "PendingPayment" &&
        booking.stripeSessionId
      ) {
        try {
          const checkoutSession =
            await stripe.checkout.sessions.retrieve(
              booking.stripeSessionId,
            );

          if (checkoutSession.status === "open") {
            await stripe.checkout.sessions.expire(
              booking.stripeSessionId,
            );
          }
        } catch (stripeError) {
          console.error(
            "Unable to expire tutoring checkout before cancellation:",
            stripeError,
          );

          return NextResponse.json(
            {
              error:
                "This payment session could not be safely cancelled. Please try again.",
            },
            { status: 409 },
          );
        }
      }

      /*
       * Change the booking and release its canonical availability
       * slot atomically.
       *
       * The state check inside the transaction protects against
       * another request changing the booking between the initial
       * read and this update.
       */
      await prisma.$transaction(
        async (tx) => {
          const current = await tx.booking.findUnique({
            where: {
              id: booking.id,
            },
            select: {
              status: true,
              availabilityId: true,
            },
          });

          if (
            !current ||
            (current.status !== "Scheduled" &&
              current.status !== "PendingPayment")
          ) {
            throw new Error("BOOKING_STATE_CHANGED");
          }

          const updated = await tx.booking.updateMany({
            where: {
              id: booking.id,
              status: {
                in: ["Scheduled", "PendingPayment"],
              },
            },
            data: {
              status: "Cancelled",
            },
          });

          if (updated.count !== 1) {
            throw new Error("BOOKING_STATE_CHANGED");
          }

          /*
           * Only release a slot currently marked Booked.
           *
           * This avoids accidentally changing another availability
           * state.
           */
          if (current.availabilityId) {
            await tx.availability.updateMany({
              where: {
                id: current.availabilityId,
                status: "Booked",
              },
              data: {
                status: "Available",
              },
            });
          }
        },
        {
          isolationLevel: "Serializable",
        },
      );

      return NextResponse.json({
        success: true,
        bookingId: booking.id,
        status: "Cancelled",

        /*
         * No refund is automatically performed here because the
         * business cancellation/refund policy has not been defined
         * by the product blueprint.
         */
        refund: {
          automatic: false,
          reason:
            "Cancellation/refund policy is configured separately.",
        },
      });
    }

    /*
     * ============================================================
     * RESCHEDULE
     * ============================================================
     */

    if (!newAvailabilityId) {
      return NextResponse.json(
        {
          error:
            "A new availability slot is required for rescheduling.",
        },
        { status: 400 },
      );
    }

    /*
     * Only paid Scheduled bookings may be rescheduled.
     */
    if (booking.status !== "Scheduled") {
      return NextResponse.json(
        {
          error:
            "Only paid scheduled bookings can be rescheduled.",
        },
        { status: 409 },
      );
    }

    /*
     * The booking must have a valid service with a duration.
     */
    const serviceDurationMinutes =
      booking.service?.durationMinutes ?? 0;

    if (serviceDurationMinutes <= 0) {
      return NextResponse.json(
        {
          error:
            "The booking service has no valid duration.",
        },
        { status: 409 },
      );
    }

    /*
     * Don't allow a reschedule request to select the exact same
     * availability slot.
     */
    if (
      booking.availability?.id &&
      booking.availability.id === newAvailabilityId
    ) {
      return NextResponse.json(
        {
          error:
            "The selected availability slot is already assigned to this booking.",
        },
        { status: 409 },
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        /*
         * Re-read the booking inside the transaction so the
         * operation is based on current state.
         */
        const current = await tx.booking.findUnique({
          where: {
            id: booking.id,
          },
          select: {
            status: true,
            availabilityId: true,
            educatorId: true,
            serviceId: true,
          },
        });

        if (
          !current ||
          current.status !== "Scheduled"
        ) {
          throw new Error("BOOKING_STATE_CHANGED");
        }

        /*
         * Load the requested canonical availability slot.
         */
        const slot = await tx.availability.findUnique({
          where: {
            id: newAvailabilityId,
          },
          select: {
            id: true,
            educatorId: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        });

        if (!slot) {
          throw new Error("NEW_SLOT_NOT_FOUND");
        }

        /*
         * The new slot must belong to the same tutor.
         */
        if (slot.educatorId !== current.educatorId) {
          throw new Error("NEW_SLOT_WRONG_TUTOR");
        }

        /*
         * Only currently available slots can be claimed.
         */
        if (slot.status !== "Available") {
          throw new Error("NEW_SLOT_UNAVAILABLE");
        }

        /*
         * New slot must be in the future.
         */
        if (slot.startTime.getTime() <= Date.now()) {
          throw new Error("NEW_SLOT_IN_PAST");
        }

        /*
         * The availability duration must exactly match the
         * service duration.
         */
        const slotDurationMs =
          slot.endTime.getTime() -
          slot.startTime.getTime();

        const requiredDurationMs =
          serviceDurationMinutes * 60_000;

        if (slotDurationMs !== requiredDurationMs) {
          throw new Error(
            "NEW_SLOT_DURATION_MISMATCH",
          );
        }

        /*
         * Atomically claim the new slot.
         *
         * If another request claims it first, count will be zero.
         */
        const claimed =
          await tx.availability.updateMany({
            where: {
              id: slot.id,
              status: "Available",
            },
            data: {
              status: "Booked",
            },
          });

        if (claimed.count !== 1) {
          throw new Error("NEW_SLOT_UNAVAILABLE");
        }

        /*
         * Release the old slot only after the new slot has been
         * successfully claimed.
         *
         * This ordering prevents the booking from temporarily
         * losing its slot if the new slot cannot be claimed.
         */
        if (current.availabilityId) {
          await tx.availability.updateMany({
            where: {
              id: current.availabilityId,
              status: "Booked",
            },
            data: {
              status: "Available",
            },
          });
        }

        /*
         * Update the canonical booking.
         *
         * Stripe/payment information remains untouched, meaning
         * this is a schedule change rather than a new purchase.
         */
        return tx.booking.update({
          where: {
            id: booking.id,
          },
          data: {
            availabilityId: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            availabilityId: true,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      },
    );

    /*
     * Keep the canonical TutoringSession synchronized with the
     * booking's new schedule.
     *
     * Only a session that is still SCHEDULED can be moved.
     */
    await prisma.tutoringSession.updateMany({
      where: {
        bookingId: booking.id,
        status: "SCHEDULED",
      },
      data: {
        scheduledStart: result.startTime,
        scheduledEnd: result.endTime,
      },
    });

    return NextResponse.json({
      success: true,
      bookingId: result.id,
      status: "Scheduled",
      startTime: result.startTime.toISOString(),
      endTime: result.endTime.toISOString(),
      availabilityId: result.availabilityId,
    });
  } catch (error) {
    const code =
      error instanceof Error
        ? error.message
        : "UNKNOWN";

    const conflicts: Record<string, string> = {
      BOOKING_STATE_CHANGED:
        "The booking changed before your request completed. Refresh and try again.",

      NEW_SLOT_NOT_FOUND:
        "The selected availability slot no longer exists.",

      NEW_SLOT_WRONG_TUTOR:
        "The selected slot belongs to a different tutor.",

      NEW_SLOT_UNAVAILABLE:
        "That availability slot has already been booked.",

      NEW_SLOT_IN_PAST:
        "That availability slot has already started.",

      NEW_SLOT_DURATION_MISMATCH:
        "That slot does not match the duration of the booked service.",
    };

    if (conflicts[code]) {
      return NextResponse.json(
        {
          error: conflicts[code],
        },
        { status: 409 },
      );
    }

    console.error(
      "PATCH /api/tutorings/[id]:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to update this tutoring booking.",
      },
      { status: 500 },
    );
  }
}