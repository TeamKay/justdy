import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

async function canManageLiveHelp(user: { id: string; role?: string | null }) {
  if (user.role === "ADMIN") return true;
  return hasCapability(user.id, CAPABILITIES.TEACH);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!(await canManageLiveHelp(user))) {
      return NextResponse.json(
        { error: "Teacher access required." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const requestId =
      typeof body.requestId === "string" ? body.requestId.trim() : "";

    if (!requestId) {
      return NextResponse.json(
        { error: "Request id is required." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw<
        Array<{ id: string; learnerId: string; status: string }>
      >`
        SELECT "id", "learnerId", "status"
        FROM "LiveHomeworkRequest"
        WHERE "id" = ${requestId}
        FOR UPDATE
      `;

      const liveRequest = lockedRows[0];

      if (!liveRequest) {
        throw new Error("Live homework-help request not found.");
      }

      if (liveRequest.status !== "WAITING") {
        throw new Error("This learner is no longer waiting for help.");
      }

      const teacherAvailability =
        await tx.liveHomeworkTeacherAvailability.findUnique({
          where: { teacherId: user.id },
        });

      if (!teacherAvailability?.isAvailable) {
        throw new Error(
          "You must be available for live homework help before selecting a learner.",
        );
      }

      const selectedAt = new Date();

      const updatedRequest = await tx.liveHomeworkRequest.update({
        where: { id: requestId },
        data: {
          teacherId: user.id,
          selectedByTeacherId: user.id,
          status: "SELECTED",
          selectedAt,
        },
      });

      const session = await tx.liveHomeworkSession.create({
        data: {
          requestId: updatedRequest.id,
          learnerId: updatedRequest.learnerId,
          teacherId: user.id,
          status: "CONNECTING",
        },
      });

      const connectingAt = new Date();

      const connectingRequest = await tx.liveHomeworkRequest.update({
        where: { id: updatedRequest.id },
        data: {
          sessionId: session.id,
          status: "CONNECTING",
          connectingAt,
        },
      });

      return { request: connectingRequest, session };
    });

    return NextResponse.json({
      request: result.request,
      session: result.session,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to select learner.";

    const status = message.includes("no longer waiting")
      ? 409
      : message.includes("must be available")
        ? 409
        : message.includes("not found")
          ? 404
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
