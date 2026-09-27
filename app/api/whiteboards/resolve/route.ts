import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getVerifiedTutor } from "@/lib/tutoring/authorization";

type ResolveRequest = {
  mode?: "standalone" | "appointment" | "booking";
  appointmentId?: string;
  bookingId?: string;
};

const EMPTY_WHITEBOARD_DATA = {
  version: 1,
  pages: [],
  currentPageIndex: 0,
};

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const body = (await request.json()) as ResolveRequest;

    const mode = body.mode;

    const appointmentId =
      typeof body.appointmentId === "string" ? body.appointmentId.trim() : "";
    const bookingId =
      typeof body.bookingId === "string" ? body.bookingId.trim() : "";

    if (mode !== "standalone" && mode !== "appointment" && mode !== "booking") {
      return NextResponse.json(
        {
          error:
            'Invalid whiteboard mode. Expected "standalone", "appointment", or "booking".',
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ============================================================
     * STANDALONE WHITEBOARD
     * ============================================================
     *
     * Standalone boards remain private to their owner.
     */

    if (mode === "standalone") {
      let whiteboard = await prisma.whiteboard.findFirst({
        where: {
          userId: user.id,
          isStandalone: true,
          appointmentId: null,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (!whiteboard) {
        whiteboard = await prisma.whiteboard.create({
          data: {
            userId: user.id,
            isStandalone: true,
            appointmentId: null,
            name: "Standalone Whiteboard",
            data: EMPTY_WHITEBOARD_DATA,
          },
        });
      }

      return NextResponse.json({
        whiteboard,
      });
    }


    /*
     * ============================================================
     * CANONICAL BOOKING WHITEBOARD
     * ============================================================
     *
     * New live tutoring sessions are keyed by Booking, not Appointment.
     */

    if (mode === "booking") {
      if (!bookingId) {
        return NextResponse.json(
          { error: "Booking ID is required." },
          { status: 400 },
        );
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          studentId: true,
          educatorId: true,
          status: true,
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found." },
          { status: 404 },
        );
      }

      const isLearner = booking.studentId === user.id;
      const isTutor = booking.educatorId === user.id;

      if (!isLearner && !isTutor) {
        return NextResponse.json(
          { error: "You are not authorized to access this session whiteboard." },
          { status: 403 },
        );
      }

      if (isTutor && !(await getVerifiedTutor(user.id))) {
        return NextResponse.json(
          { error: "Your tutor verification is not currently active." },
          { status: 403 },
        );
      }

      if (booking.status === "Cancelled" || booking.status === "NoShow") {
        return NextResponse.json(
          { error: "This tutoring booking is no longer active." },
          { status: 409 },
        );
      }

      let whiteboard = await prisma.whiteboard.findUnique({
        where: { bookingId: booking.id },
      });

      if (whiteboard) {
        return NextResponse.json({ whiteboard });
      }

      try {
        whiteboard = await prisma.whiteboard.create({
          data: {
            userId: user.id,
            bookingId: booking.id,
            isStandalone: false,
            name: "Session Whiteboard",
            data: EMPTY_WHITEBOARD_DATA,
          },
        });

        return NextResponse.json({ whiteboard }, { status: 201 });
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002"
        ) {
          const existing = await prisma.whiteboard.findUnique({
            where: { bookingId: booking.id },
          });

          if (existing) {
            return NextResponse.json({ whiteboard: existing });
          }
        }

        throw error;
      }
    }

    /*
     * ============================================================
     * APPOINTMENT WHITEBOARD
     * ============================================================
     */

    if (!appointmentId) {
      return NextResponse.json(
        {
          error: "Appointment ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      select: {
        id: true,
        learnerId: true,
        educatorId: true,
        status: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        {
          error: "Appointment not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Both tutoring participants may access
     * the shared appointment whiteboard.
     *
     * learnerId / educatorId are the legacy DB
     * field names. New application terminology
     * remains customer / tutor.
     */

    const isParticipant =
      appointment.learnerId === user.id || appointment.educatorId === user.id;

    if (!isParticipant) {
      return NextResponse.json(
        {
          error: "You are not authorized to access this session whiteboard.",
        },
        {
          status: 403,
        },
      );
    }

    if (appointment.educatorId === user.id && !(await getVerifiedTutor(user.id))) {
      return NextResponse.json(
        { error: "Your tutor verification is not currently active." },
        { status: 403 },
      );
    }

    let whiteboard = await prisma.whiteboard.findUnique({
      where: {
        appointmentId: appointment.id,
      },
    });

    if (whiteboard) {
      return NextResponse.json({
        whiteboard,
      });
    }

    /*
     * Create the shared board if the Stripe webhook
     * did not already create it.
     *
     * The first authorized participant may create it.
     */

    try {
      whiteboard = await prisma.whiteboard.create({
        data: {
          userId: user.id,
          appointmentId: appointment.id,
          isStandalone: false,
          name: "Session Whiteboard",
          data: EMPTY_WHITEBOARD_DATA,
        },
      });

      return NextResponse.json(
        {
          whiteboard,
        },
        {
          status: 201,
        },
      );
    } catch (error: unknown) {
      /*
       * appointmentId is unique.
       *
       * If another participant created the board
       * concurrently, return the existing board.
       */

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        const existing = await prisma.whiteboard.findUnique({
          where: {
            appointmentId: appointment.id,
          },
        });

        if (existing) {
          return NextResponse.json({
            whiteboard: existing,
          });
        }
      }

      throw error;
    }
  } catch (error) {
    console.error("POST /api/whiteboards/resolve error:", error);

    return NextResponse.json(
      {
        error: "Failed to resolve whiteboard.",
      },
      {
        status: 500,
      },
    );
  }
}
