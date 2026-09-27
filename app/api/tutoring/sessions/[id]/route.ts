import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getVerifiedTutor } from "@/lib/tutoring/authorization";
import {
  createDailyMeetingToken,
  ensureDailyRoom,
} from "@/lib/daily";

export const runtime = "nodejs";

const JOIN_WINDOW_MINUTES = 30;
const TOKEN_BUFFER_SECONDS = 60 * 60;
const DAILY_ROOM_PREFIX = "tutoring-";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

async function getAuthorizedBooking(
  bookingId: string,
  userId: string,
  userRole?: string | null,
) {
  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },

    include: {
      student: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },

      educator: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },

      service: {
        select: {
          id: true,
          title: true,
          type: true,
          durationMinutes: true,
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

      tutoringSession: true,
    },
  });

  if (!booking) {
    return {
      booking: null,
      role: null,
      unauthorized: false,
    };
  }

  const normalizedUserRole = String(
    userRole ?? "",
  )
    .trim()
    .toUpperCase();

  let role:
    | "customer"
    | "tutor"
    | "parent"
    | null =
    booking.studentId === userId
      ? "customer"
      : booking.educatorId === userId
        ? "tutor"
        : normalizedUserRole === "ADMIN"
          ? "tutor"
          : null;

  /*
   * Parent/guardian access is allowed for booking
   * management, but not for entering the classroom
   * as the learner.
   */
  if (!role) {
    const managedChild =
      await prisma.familyMember.findFirst({
        where: {
          userId,

          role: {
            in: [
              "PARENT",
              "GUARDIAN",
            ],
          },

          family: {
            members: {
              some: {
                userId:
                  booking.studentId,
                role: "CHILD",
              },
            },
          },
        },

        select: {
          userId: true,
        },
      });

    if (managedChild) {
      role = "parent";
    }
  }

  if (!role) {
    return {
      booking: null,
      role: null,
      unauthorized: true,
    };
  }

  return {
    booking,
    role,
    unauthorized: false,
  };
}

/**
 * Determines whether a scheduled tutoring session
 * is currently joinable.
 *
 * The Booking remains "Scheduled" while the
 * TutoringSession transitions:
 *
 * SCHEDULED → IN_PROGRESS → COMPLETED
 *
 * A completed/cancelled tutoring session is never
 * joinable.
 */
function getJoinState(
  startTime: Date,
  endTime: Date,
  bookingStatus: string,
  sessionStatus: string | null,
) {
  const now = Date.now();

  const start = startTime.getTime();
  const end = endTime.getTime();

  const joinWindowStart =
    start -
    JOIN_WINDOW_MINUTES *
      60 *
      1000;

  const beforeJoinWindow =
    now < joinWindowStart;

  const afterSession =
    now > end;

  const sessionOpen =
    sessionStatus === null ||
    sessionStatus ===
      "SCHEDULED" ||
    sessionStatus ===
      "IN_PROGRESS";

  const canJoin =
    !beforeJoinWindow &&
    !afterSession &&
    bookingStatus ===
      "Scheduled" &&
    sessionOpen;

  return {
    canJoin,

    beforeJoinWindow,

    afterSession,

    joinWindowStart:
      new Date(
        joinWindowStart,
      ).toISOString(),
  };
}

function getDailyRoomName(
  bookingId: string,
) {
  return `${DAILY_ROOM_PREFIX}${bookingId}`;
}

function isDailyRoomName(
  value:
    | string
    | null
    | undefined,
): value is string {
  return Boolean(
    value?.startsWith(
      DAILY_ROOM_PREFIX,
    ),
  );
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const user =
      await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Session ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await getAuthorizedBooking(
        id,
        user.id,
        user.role,
      );

    if (
      result.unauthorized
    ) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to access this tutoring session.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      !result.booking ||
      !result.role
    ) {
      return NextResponse.json(
        {
          error:
            "Tutoring session not found.",
        },
        {
          status: 404,
        },
      );
    }

    const {
      booking,
      role,
    } = result;

    const startTime =
      booking.availability
        ?.startTime ??
      booking.startTime;

    const endTime =
      booking.availability
        ?.endTime ??
      booking.endTime;

    const videoSessionAvailable =
      isDailyRoomName(
        booking.videoSessionId,
      );

    const sessionStatus =
      booking.tutoringSession
        ?.status ??
      null;

    const joinState =
      getJoinState(
        startTime,
        endTime,
        booking.status,
        sessionStatus,
      );

    return NextResponse.json({
      session: {
        id: booking.id,

        bookingId:
          booking.id,

        role,

        subject:
          booking.subject,

        gradeLevel:
          booking.gradeLevel,

        topic:
          booking.description,

        description:
          booking.description,

        amount:
          booking.service
            ?.price ??
          0,

        currency:
          booking.service
            ?.currency ??
          "USD",

        status:
          booking.status,

        tutoringSessionStatus:
          sessionStatus,

        feedback:
          booking.tutoringSession
            ? {
                topic:
                  booking
                    .tutoringSession
                    .topic,

                topicsCovered:
                  booking
                    .tutoringSession
                    .topicsCovered,

                strengths:
                  booking
                    .tutoringSession
                    .strengths,

                needsPractice:
                  booking
                    .tutoringSession
                    .needsPractice,

                nextStep:
                  booking
                    .tutoringSession
                    .nextStep,

                tutorNotes:
                  role === "tutor"
                    ? booking
                        .tutoringSession
                        .tutorNotes
                    : null,

                learnerOutcome:
                  booking
                    .tutoringSession
                    .learnerOutcome,
              }
            : null,

        startTime:
          startTime.toISOString(),

        endTime:
          endTime.toISOString(),

        videoSessionAvailable,

        canJoin:
          joinState.canJoin,

        beforeJoinWindow:
          joinState.beforeJoinWindow,

        afterSession:
          joinState.afterSession,

        joinWindowStart:
          joinState.joinWindowStart,

        tutor:
          booking.educator,

        customer:
          booking.student,

        service:
          booking.service
            ? {
                id:
                  booking.service
                    .id,

                title:
                  booking.service
                    .title,

                durationMinutes:
                  booking
                    .service
                    .durationMinutes,
              }
            : null,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/tutoring/sessions/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load tutoring session.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const user =
      await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Session ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await getAuthorizedBooking(
        id,
        user.id,
        user.role,
      );

    if (
      result.unauthorized
    ) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to join this tutoring session.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      !result.booking ||
      !result.role
    ) {
      return NextResponse.json(
        {
          error:
            "Tutoring session not found.",
        },
        {
          status: 404,
        },
      );
    }

    const {
      booking,
      role,
    } = result;

    /*
     * Parents and guardians can manage the booking
     * but cannot enter the live classroom as the
     * learner.
     */
    if (role === "parent") {
      return NextResponse.json(
        {
          error:
            "Parents and guardians can manage the booking but cannot enter the live classroom as the learner.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * Only scheduled bookings may enter the
     * live classroom.
     */
    if (
      booking.status !==
      "Scheduled"
    ) {
      return NextResponse.json(
        {
          error:
            "This tutoring session is not scheduled for live access.",
        },
        {
          status: 409,
        },
      );
    }

    const startTime =
      booking.availability
        ?.startTime ??
      booking.startTime;

    const endTime =
      booking.availability
        ?.endTime ??
      booking.endTime;

    const joinState =
      getJoinState(
        startTime,
        endTime,
        booking.status,
        booking.tutoringSession
          ?.status ??
          null,
      );

    if (
      joinState.beforeJoinWindow
    ) {
      return NextResponse.json(
        {
          error:
            "The tutoring session has not opened yet.",

          joinWindowStart:
            joinState.joinWindowStart,
        },
        {
          status: 403,
        },
      );
    }

    if (
      joinState.afterSession
    ) {
      return NextResponse.json(
        {
          error:
            "The tutoring session has already ended.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * A completed session can never be re-entered.
     */
    if (
      booking.tutoringSession
        ?.status ===
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          error:
            "This tutoring session has already been completed.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * A cancelled session can never be entered.
     */
    if (
      booking.tutoringSession
        ?.status ===
      "CANCELLED"
    ) {
      return NextResponse.json(
        {
          error:
            "This tutoring session has been cancelled.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Tutors must be verified before receiving
     * access to the live classroom.
     */
    const normalizedUserRole = String(
      user.role ?? "",
    )
      .trim()
      .toUpperCase();

    if (
      role === "tutor" &&
      normalizedUserRole !== "ADMIN"
    ) {
      const tutor =
        await getVerifiedTutor(
          user.id,
        );

      if (!tutor) {
        return NextResponse.json(
          {
            error:
              "Your tutor verification is not currently active.",
          },
          {
            status: 403,
          },
        );
      }
    }

    /*
     * Daily room names are deterministic per booking.
     *
     * New room:
     *
     * tutoring-{booking.id}
     *
     * Existing bookings may still contain a Vonage
     * session ID in videoSessionId. We deliberately do
     * NOT use that old Vonage ID as the Daily room name.
     *
     * This allows us to migrate without immediately
     * changing the Prisma schema.
     */
    const videoSessionId =
      isDailyRoomName(
        booking.videoSessionId,
      )
        ? booking.videoSessionId
        : getDailyRoomName(
            booking.id,
          );

    /*
     * Daily room opens at the same 30-minute
     * join window used by the existing tutoring
     * business logic.
     */
    const joinWindowStart =
      startTime.getTime() -
      JOIN_WINDOW_MINUTES *
        60 *
        1000;

    /*
     * Keep the room alive one hour after the
     * scheduled end time.
     */
    const roomExpiresAt =
      endTime.getTime() /
        1000 +
      TOKEN_BUFFER_SECONDS;

    /*
     * Create or update the Daily room.
     */
    const room =
      await ensureDailyRoom({
        roomName:
          videoSessionId,

        notBefore:
          Math.floor(
            joinWindowStart /
              1000,
          ),

        expiresAt:
          Math.floor(
            roomExpiresAt,
          ),
      });

    /*
     * Persist the Daily room name.
     *
     * This also replaces any old Vonage session ID
     * on existing bookings.
     */
    if (
      booking.videoSessionId !==
      videoSessionId
    ) {
      await prisma.booking.updateMany(
        {
          where: {
            id: booking.id,

            status:
              "Scheduled",
          },

          data: {
            videoSessionId,
          },
        },
      );
    }

    /*
     * Generate a fresh, room-scoped Daily meeting
     * token for every join.
     *
     * The token is intentionally NOT persisted.
     */
    const token =
      await createDailyMeetingToken({
        roomName:
          videoSessionId,

        userId:
          user.id,

        userName:
          user.name,

        role,

        notBefore:
          Math.floor(
            joinWindowStart /
              1000,
          ),

        expiresAt:
          Math.floor(
            roomExpiresAt,
          ),
      });

    return NextResponse.json({
      success: true,

      bookingId:
        booking.id,

      /*
       * Kept under the old field name so existing
       * frontend/session-loading code does not need
       * to be rewritten immediately.
       *
       * It now contains the Daily room name.
       */
      videoSessionId,

      /*
       * New explicit Daily room URL.
       */
      roomUrl:
        room.url,

      token,

      role,
    });
  } catch (error) {
    console.error(
      "POST /api/tutoring/sessions/[id] error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to join tutoring session.";

    return NextResponse.json(
      {
        error:
          "Failed to join tutoring session.",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              details:
                message,
            }
          : {}),
      },
      {
        status: 500,
      },
    );
  }
}