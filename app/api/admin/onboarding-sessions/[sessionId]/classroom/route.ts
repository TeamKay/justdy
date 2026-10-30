import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    // Authenticate the caller.
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      return errorResponse("Sign in required.", 401);
    }

    // Only a verified administrator can connect a paid course session.
    const actor = await prisma.user.findUnique({
      where: { id: authSession.user.id },
      select: {
        id: true,
        role: true,
        emailVerified: true,
      },
    });

    if (
      !actor ||
      String(actor.role).toUpperCase() !== "ADMIN" ||
      !actor.emailVerified
    ) {
      return errorResponse(
        "Verified administrator access required.",
        403,
      );
    }

    const { sessionId } = await context.params;

    if (!sessionId || !sessionId.trim()) {
      return errorResponse("A valid session ID is required.", 400);
    }

    // Load the onboarding session and the information needed to validate it.
    const onboardingSession =
      await prisma.tutoringOnboardingSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          status: true,
          scheduledStart: true,
          scheduledEnd: true,
          durationMinutes: true,
          subject: true,
          gradeLevel: true,
          tutorNotes: true,
          bookingId: true,
          onboardingRequest: {
            select: {
              id: true,
              assignedTutorId: true,
              learnerUserId: true,
              paymentStatus: true,
              paymentPlan: true,
              installmentCount: true,
              subject: true,
              gradeLevel: true,
              learningGoals: true,
              tutoringPayments: {
                select: {
                  status: true,
                  expectedAmountCents: true,
                },
              },
              learnerUser: {
                select: {
                  id: true,
                },
              },
              assignedTutor: {
                select: {
                  id: true,
                  role: true,
                  status: true,
                  emailVerified: true,
                  teachingProfile: {
                    select: {
                      verificationStatus: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!onboardingSession) {
      return errorResponse("Tutoring session not found.", 404);
    }

    // Make retries safe: return the existing booking if already connected.
    if (onboardingSession.bookingId) {
      const existingBooking = await prisma.booking.findUnique({
        where: { id: onboardingSession.bookingId },
        select: { id: true },
      });

      if (existingBooking) {
        return NextResponse.json({
          success: true,
          alreadyConnected: true,
          bookingId: existingBooking.id,
        });
      }

      // Do not silently create another booking if the stored link is broken.
      return errorResponse(
        "This session has a booking link that could not be resolved. Please investigate it before reconnecting.",
        409,
      );
    }

    const request = onboardingSession.onboardingRequest;

    if (!request.learnerUserId || !request.learnerUser) {
      return errorResponse(
        "A learner account must be linked before connecting the classroom.",
        400,
      );
    }

    if (!request.assignedTutorId || !request.assignedTutor) {
      return errorResponse(
        "A tutor must be assigned before connecting the classroom.",
        400,
      );
    }

    const tutor = request.assignedTutor;
    const tutorRole = String(tutor.role).toUpperCase();

    const hasEligibleTutorRole =
      tutorRole === "TUTOR" || tutorRole === "ADMIN";

    console.info("[classroom-connect] tutor eligibility:", {
      role: tutorRole,
      active: tutor.status === "Active",
      emailVerified: tutor.emailVerified,
      teachingProfileVerificationStatus:
        tutor.teachingProfile?.verificationStatus ?? null,
    });

    if (
      !hasEligibleTutorRole ||
      tutor.status !== "Active" ||
      !tutor.emailVerified ||
      tutor.teachingProfile?.verificationStatus !== "Verified"
    ) {
      return errorResponse(
        "The assigned tutor must have an active, verified tutor account.",
        400,
      );
    }

    // Permit classroom connection after at least one successful,
    // positive-amount payment. The course can remain partially paid.
    const hasSuccessfulPayment = request.tutoringPayments.some(
      (payment) =>
        payment.status === "paid" &&
        payment.expectedAmountCents > 0,
    );

    if (!hasSuccessfulPayment) {
      return errorResponse(
        "At least one successful course payment is required before connecting the classroom.",
        400,
      );
    }

    const startTime = onboardingSession.scheduledStart;
    const endTime = onboardingSession.scheduledEnd;

    if (!startTime || !endTime || endTime <= startTime) {
      return errorResponse(
        "Schedule this session with a valid start and end time before connecting the classroom.",
        400,
      );
    }

    if (
      onboardingSession.durationMinutes != null &&
      onboardingSession.durationMinutes > 0
    ) {
      const actualDuration =
        (endTime.getTime() - startTime.getTime()) / 60_000;

      if (actualDuration !== onboardingSession.durationMinutes) {
        return errorResponse(
          "The scheduled session length does not match its configured duration. Correct the schedule before connecting the classroom.",
          400,
        );
      }
    }

    const subject =
      onboardingSession.subject ?? request.subject ?? null;
    const gradeLevel =
      onboardingSession.gradeLevel ?? request.gradeLevel ?? null;

    // Create the booking, canonical tutoring session, and onboarding link
    // in one transaction. A retry cannot intentionally create a second link.
    const result = await prisma.$transaction(
      async (tx) => {
        const current =
          await tx.tutoringOnboardingSession.findUnique({
            where: { id: sessionId },
            select: {
              id: true,
              bookingId: true,
            },
          });

        if (!current) {
          throw new Error("ONBOARDING_SESSION_NOT_FOUND");
        }

        if (current.bookingId) {
          return {
            bookingId: current.bookingId,
            alreadyConnected: true,
          };
        }

        const booking = await tx.booking.create({
          data: {
            studentId: request.learnerUserId!,
            educatorId: request.assignedTutorId!,
            startTime,
            endTime,
            subject,
            gradeLevel,
            status: "Scheduled",
            description: request.learningGoals ?? null,
          },
          select: { id: true },
        });

        await tx.tutoringSession.create({
          data: {
            bookingId: booking.id,
            learnerId: request.learnerUserId!,
            educatorId: request.assignedTutorId!,
            scheduledStart: startTime,
            scheduledEnd: endTime,
            status: "SCHEDULED",
            topic: subject,
            tutorNotes: onboardingSession.tutorNotes ?? null,
          },
        });

        await tx.tutoringOnboardingSession.update({
          where: { id: sessionId },
          data: { bookingId: booking.id },
        });

        return {
          bookingId: booking.id,
          alreadyConnected: false,
        };
      },
      {
        isolationLevel: "Serializable",
      },
    );

    return NextResponse.json({
      success: true,
      alreadyConnected: result.alreadyConnected,
      bookingId: result.bookingId,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ONBOARDING_SESSION_NOT_FOUND") {
        return errorResponse("Tutoring session not found.", 404);
      }
    }

   if (
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error.code === "P2002" || error.code === "P2034")
) {
      // Another request may have connected this session concurrently.
      const { sessionId } = await context.params;

      const current =
        await prisma.tutoringOnboardingSession.findUnique({
          where: { id: sessionId },
          select: { bookingId: true },
        });

      if (current?.bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: current.bookingId },
          select: { id: true },
        });

        if (booking) {
          return NextResponse.json({
            success: true,
            alreadyConnected: true,
            bookingId: booking.id,
          });
        }
      }

      return errorResponse(
        "The session was changed by another request. Please retry.",
        409,
      );
    }

    console.error("Failed to connect onboarding classroom:", error);

    return errorResponse(
      "Could not connect the classroom. Please try again.",
      500,
    );
  }
}
