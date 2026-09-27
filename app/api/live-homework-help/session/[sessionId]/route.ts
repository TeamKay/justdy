import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

function canAccessSession(
  user: {
    id: string;
    role?: string | null;
  },
  liveSession: {
    learnerId: string;
    teacherId: string;
  },
) {
  const role = user.role?.toLowerCase();

  return (
    user.id === liveSession.learnerId ||
    user.id === liveSession.teacherId ||
    role === "admin"
  );
}

function serializeSession(session: {
  id: string;
  requestId: string;
  learnerId: string;
  teacherId: string;
  status: string;
  startedAt: Date | null;
  endedAt: Date | null;
  durationSeconds: number;
}) {
  return {
    id: session.id,
    requestId: session.requestId,
    learnerId: session.learnerId,
    teacherId: session.teacherId,
    status: session.status,
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    durationSeconds: session.durationSeconds,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const { sessionId } = await context.params;

    const liveSession = await prisma.liveHomeworkSession.findUnique({
      where: {
        id: sessionId,
      },
    });

    if (!liveSession) {
      return NextResponse.json(
        {
          error: "Live classroom session not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (!canAccessSession(user, liveSession)) {
      return NextResponse.json(
        {
          error: "You do not have access to this classroom.",
        },
        {
          status: 403,
        },
      );
    }

    const homeworkRequest = await prisma.liveHomeworkRequest.findUnique({
      where: {
        id: liveSession.requestId,
      },
    });

    return NextResponse.json({
      session: serializeSession(liveSession),
      request: homeworkRequest
        ? {
            id: homeworkRequest.id,
            subject: homeworkRequest.subject,
            gradeLevel: homeworkRequest.gradeLevel,
            topic: homeworkRequest.topic,
            description: homeworkRequest.description,
            assignmentUrl: homeworkRequest.assignmentUrl,
            assignmentName: homeworkRequest.assignmentName,
            assignmentType: homeworkRequest.assignmentType,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/live-homework-help/session error:", error);

    return NextResponse.json(
      {
        error: "Unable to load classroom session.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const { sessionId } = await context.params;

    const body = await request.json().catch(() => ({}));

    const action =
      typeof body.action === "string" ? body.action.toUpperCase() : "";

    if (!["START", "END"].includes(action)) {
      return NextResponse.json(
        {
          error: "A valid session action is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Do not use an interactive Prisma transaction here.
     *
     * The live classroom is opened by both participants at roughly the
     * same time. With Neon/serverless database connections, the previous
     * interactive $transaction could fail with:
     *
     *   "Transaction API error: Unable to start a transaction in the given time."
     *
     * START and END are therefore implemented with conditional updates.
     * This also makes concurrent START requests safe: only the request
     * that changes CONNECTING -> ACTIVE performs the start operation.
     */

    const liveSession = await prisma.liveHomeworkSession.findUnique({
      where: {
        id: sessionId,
      },
    });

    if (!liveSession) {
      return NextResponse.json(
        {
          error: "Live classroom session not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (!canAccessSession(user, liveSession)) {
      return NextResponse.json(
        {
          error: "You do not have access to this classroom.",
        },
        {
          status: 403,
        },
      );
    }

    const now = new Date();

    if (action === "START") {
      if (liveSession.status === "ENDED") {
        return NextResponse.json(
          {
            error: "This classroom session has already ended.",
          },
          {
            status: 409,
          },
        );
      }

      if (liveSession.status === "ACTIVE") {
        return NextResponse.json({
          success: true,
          session: serializeSession(liveSession),
        });
      }

      /*
       * Only transition a non-active/non-ended session to ACTIVE.
       * If teacher and learner call START simultaneously, one update wins
       * and the other receives count=0 and then reads the now-ACTIVE session.
       */
      const updatedCount = await prisma.liveHomeworkSession.updateMany({
        where: {
          id: sessionId,
          status: {
            notIn: ["ACTIVE", "ENDED"],
          },
        },
        data: {
          status: "ACTIVE",
          startedAt: liveSession.startedAt ?? now,
        },
      });

      if (updatedCount.count === 0) {
        const currentSession = await prisma.liveHomeworkSession.findUnique({
          where: {
            id: sessionId,
          },
        });

        if (!currentSession) {
          return NextResponse.json(
            {
              error: "Live classroom session not found.",
            },
            {
              status: 404,
            },
          );
        }

        if (!canAccessSession(user, currentSession)) {
          return NextResponse.json(
            {
              error: "You do not have access to this classroom.",
            },
            {
              status: 403,
            },
          );
        }

        if (currentSession.status === "ENDED") {
          return NextResponse.json(
            {
              error: "This classroom session has already ended.",
            },
            {
              status: 409,
            },
          );
        }

        return NextResponse.json({
          success: true,
          session: serializeSession(currentSession),
        });
      }

      /*
       * Keep the request state in sync. This is deliberately outside an
       * interactive transaction so the classroom can start reliably on
       * Neon/serverless database connections.
       */
      await prisma.liveHomeworkRequest.update({
        where: {
          id: liveSession.requestId,
        },
        data: {
          status: "ACTIVE",
          activeAt: now,
        },
      });

      const startedSession = await prisma.liveHomeworkSession.findUnique({
        where: {
          id: sessionId,
        },
      });

      if (!startedSession) {
        return NextResponse.json(
          {
            error: "Live classroom session could not be loaded after starting.",
          },
          {
            status: 500,
          },
        );
      }

      return NextResponse.json({
        success: true,
        session: serializeSession(startedSession),
      });
    }

    // END
    if (liveSession.status === "ENDED") {
      return NextResponse.json({
        success: true,
        session: serializeSession(liveSession),
      });
    }

    const startedAt = liveSession.startedAt ?? liveSession.createdAt;

    const durationSeconds = Math.max(
      0,
      Math.floor((now.getTime() - startedAt.getTime()) / 1000),
    );

    const endedCount = await prisma.liveHomeworkSession.updateMany({
      where: {
        id: sessionId,
        status: {
          not: "ENDED",
        },
      },
      data: {
        status: "ENDED",
        endedAt: now,
        durationSeconds,
        billableSeconds: durationSeconds,
      },
    });

    /*
     * If another participant ended the session first, simply return the
     * current server state instead of treating the request as an error.
     */
    if (endedCount.count === 0) {
      const currentSession = await prisma.liveHomeworkSession.findUnique({
        where: {
          id: sessionId,
        },
      });

      if (!currentSession) {
        return NextResponse.json(
          {
            error: "Live classroom session not found.",
          },
          {
            status: 404,
          },
        );
      }

      return NextResponse.json({
        success: true,
        session: serializeSession(currentSession),
      });
    }

    await prisma.liveHomeworkRequest.update({
      where: {
        id: liveSession.requestId,
      },
      data: {
        status: "ENDED",
        endedAt: now,
      },
    });

    const endedSession = await prisma.liveHomeworkSession.findUnique({
      where: {
        id: sessionId,
      },
    });

    if (!endedSession) {
      return NextResponse.json(
        {
          error: "Live classroom session could not be loaded after ending.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      session: serializeSession(endedSession),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update classroom session.";

    console.error("PATCH /api/live-homework-help/session error:", error);

    return NextResponse.json(
      {
        error: message || "Unable to update classroom session.",
      },
      {
        status: 500,
      },
    );
  }
}
