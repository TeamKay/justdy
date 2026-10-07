import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";
import { reserveCreditsInTransaction } from "@/lib/credits/reservations";
import { InsufficientCreditsError } from "@/lib/credits/errors";
import { getLiveHomeworkConnectingTimeoutMinutes } from "@/lib/credits/live-homework-reconciliation";


const LIVE_HOMEWORK_REFERENCE_TYPE = "LIVE_HOMEWORK_SESSION";

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
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    if (!(await canManageLiveHelp(user))) {
      return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    if (!requestId) {
      return NextResponse.json({ error: "Request id is required." }, { status: 400 });
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
      if (!liveRequest) throw new Error("Live homework-help request not found.");
      if (liveRequest.status !== "WAITING") {
        throw new Error("This learner is no longer waiting for help.");
      }

      const teacherAvailability = await tx.liveHomeworkTeacherAvailability.findUnique({
        where: { teacherId: user.id },
      });
      if (!teacherAvailability?.isAvailable) {
        throw new Error(
          "You must be available for live homework help before selecting a learner.",
        );
      }

      const teacher = await tx.user.findUnique({
        where: { id: user.id },
        select: {
          teachingProfile: {
            select: { hourlyRate: true, currency: true },
          },
        },
      });

      const teacherRate = teacher?.teachingProfile?.hourlyRate ?? null;
      const teacherCurrency = teacher?.teachingProfile?.currency ?? null;

      if (teacherRate == null || teacherRate <= 0) {
        throw new Error(
          "You must have a valid hourly rate before selecting a Live Homework learner.",
        );
      }

      if (String(teacherCurrency ?? "USD").toUpperCase() !== "USD") {
        throw new Error(
          "Live Homework credits currently support teachers paid in USD only.",
        );
      }

      const reservationAmount = teacherRate;
      const idempotencyKey = `live-homework-reservation:${requestId}`;
      const selectedAt = new Date();
      const expiresAt = new Date(
        selectedAt.getTime() +
          getLiveHomeworkConnectingTimeoutMinutes() * 60 * 1000,
      );

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
          teacherRate,
          currency: "USD",
        },
      });

      await reserveCreditsInTransaction(tx, {
        userId: updatedRequest.learnerId,
        amount: reservationAmount,
        referenceType: LIVE_HOMEWORK_REFERENCE_TYPE,
        referenceId: session.id,
        description: `Reserved up to one hour of Live Homework Help at ${teacherRate} credits/hour`,
        idempotencyKey,
        expiresAt,
      });

      const connectingRequest = await tx.liveHomeworkRequest.update({
        where: { id: updatedRequest.id },
        data: {
          sessionId: session.id,
          status: "CONNECTING",
          connectingAt: selectedAt,
        },
      });

      return { request: connectingRequest, session, expiresAt };
    });

    return NextResponse.json({ request: result.request, session: result.session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to select learner.";
    const status =
      error instanceof InsufficientCreditsError ? 402 :
      message.includes("no longer waiting") ? 409 :
      message.includes("must be available") ? 409 :
      message.includes("valid hourly rate") ? 409 :
      message.includes("support teachers") ? 409 :
      message.includes("not found") ? 404 : 500;

    return NextResponse.json(
      {
        error:
          error instanceof InsufficientCreditsError
            ? "The learner does not have enough credits to start this Live Homework session."
            : message,
      },
      { status },
    );
  }
}
