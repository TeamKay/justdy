import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getVerifiedTutor } from "@/lib/tutoring/authorization";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const JOIN_WINDOW_MINUTES = 30;

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Session ID is required." },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      action?: unknown;
    } | null;

    const action = body?.action;
    if (action !== "start" && action !== "end") {
      return NextResponse.json(
        { error: "Action must be 'start' or 'end'." },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        availability: {
          select: { startTime: true, endTime: true },
        },
        service: {
          select: { id: true },
        },
        tutoringSession: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Tutoring session not found." },
        { status: 404 },
      );
    }

    const isLearner = booking.studentId === user.id;
    const isTutor = booking.educatorId === user.id;

    if (!isLearner && !isTutor) {
      return NextResponse.json(
        { error: "You are not authorized to change this tutoring session." },
        { status: 403 },
      );
    }

    const startTime = booking.availability?.startTime ?? booking.startTime;
    const endTime = booking.availability?.endTime ?? booking.endTime;

    if (action === "start") {
      const now = Date.now();
      const joinStart =
        startTime.getTime() - JOIN_WINDOW_MINUTES * 60 * 1000;

      if (now < joinStart) {
        return NextResponse.json(
          { error: "The tutoring session has not opened yet." },
          { status: 403 },
        );
      }

      if (now > endTime.getTime()) {
        return NextResponse.json(
          { error: "The tutoring session has already ended." },
          { status: 403 },
        );
      }

      if (booking.status !== "Scheduled") {
        return NextResponse.json(
          { error: "This booking is not available for a live session." },
          { status: 409 },
        );
      }

      if (booking.tutoringSession?.status === "COMPLETED") {
        return NextResponse.json(
          { error: "This tutoring session has already been completed." },
          { status: 409 },
        );
      }

      if (booking.tutoringSession?.status === "CANCELLED") {
        return NextResponse.json(
          { error: "This tutoring session has been cancelled." },
          { status: 409 },
        );
      }

      if (booking.tutoringSession?.status === "NO_SHOW") {
  return NextResponse.json(
    { error: "This tutoring session was recorded as a no-show." },
    { status: 409 },
  );
}

      if (isTutor) {
        const tutor = await getVerifiedTutor(user.id);
        if (!tutor) {
          return NextResponse.json(
            { error: "Your tutor verification is not currently active." },
            { status: 403 },
          );
        }
      }

      const updated = await prisma.$transaction(async (tx) => {
        const existing = await tx.tutoringSession.findUnique({
          where: { bookingId: booking.id },
          select: { id: true, status: true, startedAt: true },
        });

        if (existing?.status === "COMPLETED") {
          throw new Error("SESSION_COMPLETED");
        }

        if (existing?.status === "CANCELLED") {
          throw new Error("SESSION_CANCELLED");
        }

        if (existing?.status === "NO_SHOW") {
  throw new Error("SESSION_NO_SHOW");
}

        if (existing) {
          return tx.tutoringSession.update({
            where: { id: existing.id },
            data: {
              status: "IN_PROGRESS",
              startedAt: existing.startedAt ?? new Date(),
              learnerAttendance: isLearner ? true : undefined,
              educatorAttendance: isTutor ? true : undefined,
            },
          });
        }

        return tx.tutoringSession.create({
          data: {
            bookingId: booking.id,
            learnerId: booking.studentId,
            educatorId: booking.educatorId,
            serviceId: booking.serviceId,
            scheduledStart: startTime,
            scheduledEnd: endTime,
            status: "IN_PROGRESS",
            startedAt: new Date(),
            learnerAttendance: isLearner,
            educatorAttendance: isTutor,
          },
        });
      });

      return NextResponse.json({
        success: true,
        action,
        status: updated.status,
        tutoringSessionId: updated.id,
        startedAt: updated.startedAt?.toISOString() ?? null,
      });
    }

    if (!isTutor) {
      return NextResponse.json(
        { error: "Only the tutor can end a tutoring session." },
        { status: 403 },
      );
    }

    const tutor = await getVerifiedTutor(user.id);
    if (!tutor) {
      return NextResponse.json(
        { error: "Your tutor verification is not currently active." },
        { status: 403 },
      );
    }

    if (booking.tutoringSession?.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        action,
        status: "COMPLETED",
        alreadyCompleted: true,
      });
    }

    if (booking.tutoringSession?.status !== "IN_PROGRESS") {
      return NextResponse.json(
        {
          error:
            "The tutoring session must be in progress before it can be ended.",
        },
        { status: 409 },
      );
    }

    // A tutor ending the room alone must not create a completed lesson.
    // The learner's classroom connection records learnerAttendance.
    // Once the learner has attended, the tutor may end the lesson even if
    // the learner has already disconnected.
    if (!booking.tutoringSession.learnerAttendance) {
      return NextResponse.json(
        {
          error:
            "The learner has not been recorded as attending this lesson, so it cannot be completed.",
        },
        { status: 409 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const session = await tx.tutoringSession.updateMany({
        where: {
          bookingId: booking.id,
          status: "IN_PROGRESS",
        },
        data: {
          status: "COMPLETED",
          endedAt: new Date(),
          educatorAttendance: true,
        },
      });

      if (session.count === 0) {
        const current = await tx.tutoringSession.findUnique({
          where: { bookingId: booking.id },
          select: { id: true, status: true },
        });

        if (current?.status === "COMPLETED") {
          return { status: "COMPLETED" as const, alreadyCompleted: true };
        }

        throw new Error("SESSION_STATE_CHANGED");
      }

      await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: "Scheduled",
        },
        data: {
          status: "Completed",
        },
      });

      return { status: "COMPLETED" as const, alreadyCompleted: false };
    });

    return NextResponse.json({
      success: true,
      action,
      status: updated.status,
      alreadyCompleted: updated.alreadyCompleted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "SESSION_COMPLETED") {
      return NextResponse.json(
        { error: "This tutoring session has already been completed." },
        { status: 409 },
      );
    }

    if (message === "SESSION_CANCELLED") {
      return NextResponse.json(
        { error: "This tutoring session has been cancelled." },
        { status: 409 },
      );
    }

    if (message === "SESSION_NO_SHOW") {
  return NextResponse.json(
    { error: "This tutoring session was recorded as a no-show." },
    { status: 409 },
  );
}

    if (message === "SESSION_STATE_CHANGED") {
      return NextResponse.json(
        { error: "The tutoring session changed state. Please refresh." },
        { status: 409 },
      );
    }

    console.error("POST /api/tutoring/sessions/[id]/lifecycle error:", error);

    return NextResponse.json(
      { error: "Failed to update tutoring session lifecycle." },
      { status: 500 },
    );
  }
}
