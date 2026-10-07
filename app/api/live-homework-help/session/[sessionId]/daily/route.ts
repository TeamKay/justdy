import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createDailyMeetingToken,
  ensureDailyRoom,
} from "@/lib/daily";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

const JOIN_BUFFER_SECONDS = 60;
const ROOM_LIFETIME_SECONDS = 4 * 60 * 60;

function serializeRole(userRole: string | null | undefined, isTeacher: boolean) {
  if (isTeacher || userRole?.toUpperCase() === "ADMIN") {
    return "tutor" as const;
  }

  return "customer" as const;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    const user = authSession?.user;

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "A live homework session ID is required." },
        { status: 400 },
      );
    }

    const liveSession = await prisma.liveHomeworkSession.findUnique({
      where: { id: sessionId },
    });

    if (!liveSession) {
      return NextResponse.json(
        { error: "Live homework session not found." },
        { status: 404 },
      );
    }

    const normalizedRole = String(user.role ?? "")
      .trim()
      .toUpperCase();

    const isTeacher = liveSession.teacherId === user.id;
    const isLearner = liveSession.learnerId === user.id;
    const isAdmin = normalizedRole === "ADMIN";

    if (!isTeacher && !isLearner && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have access to this classroom." },
        { status: 403 },
      );
    }

    if (liveSession.status === "ENDED") {
      return NextResponse.json(
        { error: "This live homework session has already ended." },
        { status: 409 },
      );
    }

    const roomName =
      liveSession.classroomId?.trim() ||
      `live-homework-${liveSession.id}`;

    const now = Math.floor(Date.now() / 1000);
    const notBefore = now - JOIN_BUFFER_SECONDS;
    const expiresAt = now + ROOM_LIFETIME_SECONDS;

    const room = await ensureDailyRoom({
      roomName,
      notBefore,
      expiresAt,
    });

    if (liveSession.classroomId !== roomName) {
      await prisma.liveHomeworkSession.updateMany({
        where: {
          id: liveSession.id,
          classroomId: null,
        },
        data: {
          classroomId: roomName,
        },
      });
    }

    const role = serializeRole(user.role, isTeacher || isAdmin);

    const token = await createDailyMeetingToken({
      roomName,
      userId: user.id,
      userName: user.name,
      role,
      notBefore,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      sessionId: liveSession.id,
      videoSessionId: roomName,
      roomUrl: room.url,
      token,
      role,
    });
  } catch (error) {
    console.error(
      "POST /api/live-homework-help/session/[sessionId]/daily failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to prepare the Daily classroom.",
        ...(process.env.NODE_ENV !== "production"
          ? {
              details:
                error instanceof Error ? error.message : String(error),
            }
          : {}),
      },
      { status: 500 },
    );
  }
}
