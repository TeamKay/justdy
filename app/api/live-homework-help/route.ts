import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";

type LiveHomeworkStatus =
  | "REQUESTED"
  | "WAITING"
  | "SELECTED"
  | "CONNECTING"
  | "ACTIVE"
  | "ENDED"
  | "CANCELLED";

const ACTIVE_REQUEST_STATUSES: LiveHomeworkStatus[] = [
  "REQUESTED",
  "WAITING",
  "SELECTED",
  "CONNECTING",
  "ACTIVE",
];

const QUEUE_STATUSES: LiveHomeworkStatus[] = ["WAITING"];

type AuthUser = {
  id: string;
  name?: string | null;
  role?: string | null;
};

async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role ?? null,
      }
    : null;
}

async function isTeacherOrAdmin(user: AuthUser) {
  if (user.role === "ADMIN") return true;
  return hasCapability(user.id, CAPABILITIES.TEACH);
}

function serializeRequest(
  request: {
    id: string;
    learnerId: string;
    teacherId: string | null;
    status: string;
    subject: string;
    gradeLevel: string | null;
    topic: string | null;
    description: string;
    assignmentUrl: string | null;
    assignmentName: string | null;
    assignmentType: string | null;
    requestedAt: Date;
    waitingAt: Date | null;
    selectedAt: Date | null;
    connectingAt: Date | null;
    activeAt: Date | null;
    endedAt: Date | null;
    cancelledAt: Date | null;
    selectedByTeacherId: string | null;
    sessionId: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  learner?: {
    id: string;
    name: string | null;
  } | null,
) {
  return {
    id: request.id,
    learnerId: request.learnerId,
    teacherId: request.teacherId,
    status: request.status,
    subject: request.subject,
    gradeLevel: request.gradeLevel,
    topic: request.topic,
    description: request.description,
    assignmentUrl: request.assignmentUrl,
    assignmentName: request.assignmentName,
    assignmentType: request.assignmentType,
    requestedAt: request.requestedAt.toISOString(),
    waitingAt: request.waitingAt?.toISOString() ?? null,
    selectedAt: request.selectedAt?.toISOString() ?? null,
    connectingAt: request.connectingAt?.toISOString() ?? null,
    activeAt: request.activeAt?.toISOString() ?? null,
    endedAt: request.endedAt?.toISOString() ?? null,
    cancelledAt: request.cancelledAt?.toISOString() ?? null,
    selectedByTeacherId: request.selectedByTeacherId,
    sessionId: request.sessionId,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    learner: learner
      ? {
          id: learner.id,
          name: learner.name,
        }
      : null,
  };
}

export async function GET() {
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

    /*
     * Teacher/Admin view
     *
     * The teacher workspace needs a queue, not the learner's single
     * request object. Only teachers who have explicitly enabled
     * Live Homework Help should receive waiting learners.
     */
  if (await isTeacherOrAdmin(user)) {
      const availability =
        await prisma.liveHomeworkTeacherAvailability.findUnique({
          where: {
            teacherId: user.id,
          },
          select: {
            isAvailable: true,
          },
        });

      if (!availability?.isAvailable) {
        return NextResponse.json({
          requests: [],
        });
      }

      const waitingRequests = await prisma.liveHomeworkRequest.findMany({
        where: {
          status: {
            in: QUEUE_STATUSES,
          },
          teacherId: null,
        },
        orderBy: [
          {
            waitingAt: "asc",
          },
          {
            requestedAt: "asc",
          },
        ],
        take: 100,
      });

      /*
       * LiveHomeworkRequest intentionally stores learnerId rather than
       * a Prisma User relation. Fetch only the minimum learner identity
       * information needed by the teacher queue.
       */
      const learnerIds = [
        ...new Set(waitingRequests.map((request) => request.learnerId)),
      ];

      const learners =
        learnerIds.length > 0
          ? await prisma.user.findMany({
              where: {
                id: {
                  in: learnerIds,
                },
              },
              select: {
                id: true,
                name: true,
              },
            })
          : [];

      const learnerMap = new Map(
        learners.map((learner) => [learner.id, learner]),
      );

      const requests = waitingRequests.map((request) =>
        serializeRequest(request, learnerMap.get(request.learnerId) ?? null),
      );

      return NextResponse.json({
        requests,
      });
    }

    /*
     * Learner view
     *
     * Return only this learner's current live-help request. This
     * preserves the existing learner UI contract: { request }.
     */
    const request = await prisma.liveHomeworkRequest.findFirst({
      where: {
        learnerId: user.id,
        status: {
          in: ACTIVE_REQUEST_STATUSES,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      request: request ? serializeRequest(request) : null,
    });
  } catch (error) {
    console.error("GET /api/live-homework-help error:", error);

    return NextResponse.json(
      {
        error: "Unable to load Live Homework Help.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
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

   if (await isTeacherOrAdmin(user)) {
      return NextResponse.json(
        {
          error: "Teachers cannot create learner homework-help requests.",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json().catch(() => ({}));

    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const gradeLevel =
      typeof body.gradeLevel === "string" ? body.gradeLevel.trim() : "";
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const assignmentUrl =
      typeof body.assignmentUrl === "string" ? body.assignmentUrl.trim() : null;
    const assignmentName =
      typeof body.assignmentName === "string"
        ? body.assignmentName.trim()
        : null;
    const assignmentType =
      typeof body.assignmentType === "string"
        ? body.assignmentType.trim()
        : null;

    if (!subject) {
      return NextResponse.json(
        {
          error: "Choose the subject you need help with.",
        },
        {
          status: 400,
        },
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          error: "Tell the teacher what you are working on.",
        },
        {
          status: 400,
        },
      );
    }

    if (subject.length > 120) {
      return NextResponse.json(
        {
          error: "Subject is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (gradeLevel.length > 80) {
      return NextResponse.json(
        {
          error: "Grade level is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (topic.length > 200) {
      return NextResponse.json(
        {
          error: "Topic is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (description.length > 10000) {
      return NextResponse.json(
        {
          error: "Homework description is too long.",
        },
        {
          status: 400,
        },
      );
    }

    const existingRequest = await prisma.liveHomeworkRequest.findFirst({
      where: {
        learnerId: user.id,
        status: {
          in: ACTIVE_REQUEST_STATUSES,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: "You already have an active Live Homework Help request.",
          request: serializeRequest(existingRequest),
        },
        {
          status: 409,
        },
      );
    }

    const now = new Date();

    const createdRequest = await prisma.liveHomeworkRequest.create({
      data: {
        learnerId: user.id,
        status: "WAITING",
        subject,
        gradeLevel: gradeLevel || null,
        topic: topic || null,
        description,
        assignmentUrl: assignmentUrl || null,
        assignmentName: assignmentName || null,
        assignmentType: assignmentType || null,
        requestedAt: now,
        waitingAt: now,
      },
    });

    return NextResponse.json(
      {
        request: serializeRequest(createdRequest),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("POST /api/live-homework-help error:", error);

    return NextResponse.json(
      {
        error: "Unable to create the Live Homework Help request.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const requestId = typeof body.id === "string" ? body.id.trim() : "";

    if (!requestId) {
      return NextResponse.json(
        {
          error: "A Live Homework Help request ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existingRequest = await prisma.liveHomeworkRequest.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        {
          error: "Live Homework Help request not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (existingRequest.learnerId !== user.id) {
      return NextResponse.json(
        {
          error: "You do not have permission to cancel this request.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      !["REQUESTED", "WAITING"].includes(existingRequest.status.toUpperCase())
    ) {
      return NextResponse.json(
        {
          error:
            "This request can no longer be cancelled from the waiting room.",
        },
        {
          status: 409,
        },
      );
    }

    const cancelledRequest = await prisma.liveHomeworkRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      request: serializeRequest(cancelledRequest),
    });
  } catch (error) {
    console.error("DELETE /api/live-homework-help error:", error);

    return NextResponse.json(
      {
        error: "Unable to leave the Live Homework Help waiting room.",
      },
      {
        status: 500,
      },
    );
  }
}
