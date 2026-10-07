import { describe, expect, it } from "vitest";

import prisma from "@/lib/prisma";
import {
  reconcileStaleLiveHomeworkReservations,
} from "@/lib/credits/live-homework-reconciliation";

function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function createUserWithCredits(balance: number) {
  const user = await prisma.user.create({
    data: {
      name: "Live Homework Reconcile Test User",
      email: `${unique("reconcile")}@example.com`,
      role: "USER",
    },
  });

  const credit = await prisma.userCredit.create({
    data: {
      userId: user.id,
      balance,
      reservedBalance: 0,
    },
  });

  return { user, credit };
}

describe("Live Homework stale reservation reconciliation", () => {
  it("releases an expired CONNECTING reservation and cancels the request", async () => {
    const { user } = await createUserWithCredits(0);
    const now = new Date();
    const connectingAt = new Date(now.getTime() - 15 * 60 * 1000);

    const teacher = await prisma.user.create({
      data: {
        name: "Reconcile Teacher",
        email: `${unique("teacher")}@example.com`,
        role: "USER",
        canTeach: true,
      },
    });

    const request = await prisma.liveHomeworkRequest.create({
      data: {
        learnerId: user.id,
        teacherId: teacher.id,
        selectedByTeacherId: teacher.id,
        status: "CONNECTING",
        subject: "Math",
        description: "Stale connection test",
        requestedAt: new Date(now.getTime() - 20 * 60 * 1000),
        selectedAt: new Date(now.getTime() - 16 * 60 * 1000),
        connectingAt,
      },
    });

    const session = await prisma.liveHomeworkSession.create({
      data: {
        requestId: request.id,
        learnerId: user.id,
        teacherId: teacher.id,
        status: "CONNECTING",
        teacherRate: 3000,
        currency: "USD",
      },
    });

    // Mirror the production select flow: once a session is created,
    // the request points to that exact session. Reconciliation uses this
    // relationship as a safety check before cancelling the stale request.
    await prisma.liveHomeworkRequest.update({
      where: { id: request.id },
      data: { sessionId: session.id },
    });

    const reservation = await prisma.creditReservation.create({
      data: {
        userId: user.id,
        userCreditId: (
          await prisma.userCredit.findUniqueOrThrow({
            where: { userId: user.id },
          })
        ).id,
        amount: 3000,
        status: "ACTIVE",
        referenceType: "LIVE_HOMEWORK_SESSION",
        referenceId: session.id,
        expiresAt: new Date(now.getTime() - 60 * 1000),
      },
    });

    await prisma.userCredit.update({
      where: { userId: user.id },
      data: { reservedBalance: 3000 },
    });

    const result = await reconcileStaleLiveHomeworkReservations({
      now,
      limit: 10,
    });

    expect(result.released).toBe(1);

    const [
      freshReservation,
      freshWallet,
      freshSession,
      freshRequest,
      release,
    ] = await Promise.all([
      prisma.creditReservation.findUniqueOrThrow({
        where: { id: reservation.id },
      }),
      prisma.userCredit.findUniqueOrThrow({
        where: { userId: user.id },
      }),
      prisma.liveHomeworkSession.findUniqueOrThrow({
        where: { id: session.id },
      }),
      prisma.liveHomeworkRequest.findUniqueOrThrow({
        where: { id: request.id },
      }),
      prisma.creditTransaction.findFirst({
        where: {
          idempotencyKey: `reservation:${reservation.id}:release`,
        },
      }),
    ]);

    expect(freshReservation.status).toBe("RELEASED");
    expect(freshWallet.balance).toBe(3000);
    expect(freshWallet.reservedBalance).toBe(0);
    expect(freshSession.status).toBe("ENDED");
    expect(freshSession.durationSeconds).toBe(0);
    expect(freshSession.billableSeconds).toBe(0);
    expect(freshSession.totalAmount).toBe(0);
    expect(freshSession.paymentStatus).toBe("Paid");
    expect(freshRequest.status).toBe("CANCELLED");
    expect(release?.type).toBe("RELEASE");

    await prisma.user.delete({
      where: { id: teacher.id },
    });

    await prisma.user.delete({
      where: { id: user.id },
    });
  });

  it("does not release an expired reservation once the session has started", async () => {
    const { user } = await createUserWithCredits(0);

    const teacher = await prisma.user.create({
      data: {
        name: "Active Teacher",
        email: `${unique("active-teacher")}@example.com`,
        role: "USER",
        canTeach: true,
      },
    });

    const request = await prisma.liveHomeworkRequest.create({
      data: {
        learnerId: user.id,
        teacherId: teacher.id,
        status: "ACTIVE",
        subject: "Math",
        description: "Active session test",
        activeAt: new Date(),
      },
    });

    const session = await prisma.liveHomeworkSession.create({
      data: {
        requestId: request.id,
        learnerId: user.id,
        teacherId: teacher.id,
        status: "ACTIVE",
        startedAt: new Date(),
        teacherRate: 3000,
        currency: "USD",
      },
    });

    const wallet = await prisma.userCredit.findUniqueOrThrow({
      where: { userId: user.id },
    });

    const reservation = await prisma.creditReservation.create({
      data: {
        userId: user.id,
        userCreditId: wallet.id,
        amount: 3000,
        status: "ACTIVE",
        referenceType: "LIVE_HOMEWORK_SESSION",
        referenceId: session.id,
        expiresAt: new Date(Date.now() - 60 * 1000),
      },
    });

    await prisma.userCredit.update({
      where: { userId: user.id },
      data: { reservedBalance: 3000 },
    });

    const result = await reconcileStaleLiveHomeworkReservations({
      limit: 10,
    });

    expect(result.released).toBe(0);

    const freshReservation =
      await prisma.creditReservation.findUniqueOrThrow({
        where: { id: reservation.id },
      });

    expect(freshReservation.status).toBe("ACTIVE");

    await prisma.user.delete({
      where: { id: teacher.id },
    });

    await prisma.user.delete({
      where: { id: user.id },
    });
  });
});