import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import prisma from "@/lib/prisma";
import {
  InsufficientCreditsError,
} from "@/lib/credits/errors";
import {
  releaseCreditReservation,
  reserveCredits,
  settleCreditReservation,
} from "@/lib/credits/reservations";

/**
 * Phase 2 — Live Homework Help credit-flow integration tests.
 *
 * Business rules covered here:
 * - 1 credit = $0.01 USD.
 * - A selected teacher's hourlyRate is the one-hour reservation in credits.
 * - A reservation cannot make the learner's balance negative.
 * - Only connected/billable time is consumed at session settlement.
 * - Unused reserved credits are returned to the learner.
 * - A reservation can only settle/release once, even when END is retried
 *   concurrently.
 */

describe("Live Homework Help credit flow", () => {
  const createdUserIds: string[] = [];

  async function createTestWallet(initialBalance: number) {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const user = await prisma.user.create({
      data: {
        id: `live-help-credit-${suffix}`,
        name: "Live Homework Credit Test",
        email: `live-help-credit-${suffix}@example.test`,
      },
    });

    createdUserIds.push(user.id);

    const wallet = await prisma.userCredit.create({
      data: {
        userId: user.id,
        balance: initialBalance,
        reservedBalance: 0,
      },
    });

    return { userId: user.id, walletId: wallet.id };
  }

  async function reserveOneHour(userId: string, hourlyRate = 3000) {
    return reserveCredits({
      userId,
      amount: hourlyRate,
      referenceType: "LIVE_HOMEWORK_SESSION",
      referenceId: `live-help-session-${Date.now()}-${Math.random()}`,
      description: `Reserved one hour at ${hourlyRate} credits/hour`,
      idempotencyKey: `live-help-test-reservation-${Date.now()}-${Math.random()}`,
    });
  }

  beforeEach(async () => {
    // Every test owns its own user/wallet, so no shared credit state exists.
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: { in: createdUserIds },
        },
      });
    }
  });

  it("reserves exactly one hour at the teacher hourly rate", async () => {
    const { userId, walletId } = await createTestWallet(3000);

    const reservation = await reserveOneHour(userId, 3000);

    expect(reservation.amount).toBe(3000);
    expect(reservation.status).toBe("ACTIVE");

    const wallet = await prisma.userCredit.findUnique({
      where: { id: walletId },
    });

    expect(wallet?.balance).toBe(0);
    expect(wallet?.reservedBalance).toBe(3000);
  });

  it("rejects selection/reservation when the learner cannot cover one hour", async () => {
    const { userId, walletId } = await createTestWallet(2999);

    await expect(reserveOneHour(userId, 3000)).rejects.toBeInstanceOf(
      InsufficientCreditsError,
    );

    const wallet = await prisma.userCredit.findUnique({
      where: { id: walletId },
    });

    expect(wallet?.balance).toBe(2999);
    expect(wallet?.reservedBalance).toBe(0);

    const reservations = await prisma.creditReservation.findMany({
      where: { userId },
    });

    expect(reservations).toHaveLength(0);
  });

  it("consumes 1,000 credits for a 20-minute session and releases 2,000", async () => {
    const { userId, walletId } = await createTestWallet(3000);
    const reservation = await reserveOneHour(userId, 3000);

    await settleCreditReservation({
      reservationId: reservation.id,
      actualAmount: 1000,
    });

    const wallet = await prisma.userCredit.findUnique({
      where: { id: walletId },
    });
    const settled = await prisma.creditReservation.findUnique({
      where: { id: reservation.id },
    });
    const transactions = await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    expect(wallet?.balance).toBe(2000);
    expect(wallet?.reservedBalance).toBe(0);
    expect(settled?.status).toBe("SETTLED");

    expect(
      transactions.some(
        (transaction) =>
          transaction.type === "CONSUMPTION" && transaction.amount === -1000,
      ),
    ).toBe(true);
    expect(
      transactions.some(
        (transaction) =>
          transaction.type === "RELEASE" && transaction.amount === 2000,
      ),
    ).toBe(true);
  });

  it("consumes 1,850 credits for a 37-minute session and releases 1,150", async () => {
    const { userId, walletId } = await createTestWallet(3000);
    const reservation = await reserveOneHour(userId, 3000);

    await settleCreditReservation({
      reservationId: reservation.id,
      actualAmount: 1850,
    });

    const wallet = await prisma.userCredit.findUnique({
      where: { id: walletId },
    });

    expect(wallet?.balance).toBe(1150);
    expect(wallet?.reservedBalance).toBe(0);
  });

  it("consumes the full 3,000 credits for a 60-minute session", async () => {
    const { userId, walletId } = await createTestWallet(3000);
    const reservation = await reserveOneHour(userId, 3000);

    await settleCreditReservation({
      reservationId: reservation.id,
      actualAmount: 3000,
    });

    const wallet = await prisma.userCredit.findUnique({
      where: { id: walletId },
    });

    expect(wallet?.balance).toBe(0);
    expect(wallet?.reservedBalance).toBe(0);
  });

  it("releases the full reservation when the session never starts", async () => {
    const { userId, walletId } = await createTestWallet(3000);
    const reservation = await reserveOneHour(userId, 3000);

    const released = await releaseCreditReservation(reservation.id);

    const wallet = await prisma.userCredit.findUnique({
      where: { id: walletId },
    });

    expect(released.status).toBe("RELEASED");
    expect(wallet?.balance).toBe(3000);
    expect(wallet?.reservedBalance).toBe(0);
  });

  it("releases a reservation only once under a concurrent release race", async () => {
    const { userId, walletId } = await createTestWallet(3000);

    const reservation = await reserveOneHour(userId, 3000);

    const results = await Promise.all([
      releaseCreditReservation(reservation.id),
      releaseCreditReservation(reservation.id),
    ]);

    expect(results).toHaveLength(2);
    expect(results.filter((result) => result.status === "RELEASED")).toHaveLength(2);

    const wallet = await prisma.userCredit.findUnique({
      where: { id: walletId },
    });

    expect(wallet?.balance).toBe(3000);
    expect(wallet?.reservedBalance).toBe(0);

    const releases = await prisma.creditTransaction.count({
      where: {
        userId,
        type: "RELEASE",
        referenceId: reservation.referenceId,
      },
    });

    expect(releases).toBe(1);
  });

  it("is idempotent when the same reservation request is retried", async () => {
    const { userId, walletId } = await createTestWallet(3000);
    const idempotencyKey = `live-help-idempotency-${Date.now()}-${Math.random()}`;

    const first = await reserveCredits({
      userId,
      amount: 3000,
      referenceType: "LIVE_HOMEWORK_SESSION",
      referenceId: "idempotent-session",
      idempotencyKey,
    });

    const second = await reserveCredits({
      userId,
      amount: 3000,
      referenceType: "LIVE_HOMEWORK_SESSION",
      referenceId: "idempotent-session",
      idempotencyKey,
    });

    expect(second.id).toBe(first.id);

    const wallet = await prisma.userCredit.findUnique({
      where: { id: walletId },
    });
    const reservations = await prisma.creditReservation.findMany({
      where: { userId },
    });

    expect(wallet?.balance).toBe(0);
    expect(wallet?.reservedBalance).toBe(3000);
    expect(reservations).toHaveLength(1);
  });

  it("settles a concurrent END retry only once", async () => {
    const { userId, walletId } = await createTestWallet(3000);
    const reservation = await reserveOneHour(userId, 3000);

    const results = await Promise.all([
      settleCreditReservation({
        reservationId: reservation.id,
        actualAmount: 1000,
      }),
      settleCreditReservation({
        reservationId: reservation.id,
        actualAmount: 1000,
      }),
    ]);

    expect(results).toHaveLength(2);
    expect(results.every((result) => result.status === "SETTLED")).toBe(true);

    const wallet = await prisma.userCredit.findUnique({
      where: { id: walletId },
    });
    const consumptionTransactions = await prisma.creditTransaction.findMany({
      where: {
        userId,
        type: "CONSUMPTION",
      },
    });
    const releaseTransactions = await prisma.creditTransaction.findMany({
      where: {
        userId,
        type: "RELEASE",
      },
    });

    expect(wallet?.balance).toBe(2000);
    expect(wallet?.reservedBalance).toBe(0);
    expect(consumptionTransactions).toHaveLength(1);
    expect(consumptionTransactions[0]?.amount).toBe(-1000);
    expect(releaseTransactions).toHaveLength(1);
    expect(releaseTransactions[0]?.amount).toBe(2000);
  });

  it("never consumes more than the reserved one-hour amount", async () => {
    const { userId, walletId } = await createTestWallet(3000);
    const reservation = await reserveOneHour(userId, 3000);

    await expect(
      settleCreditReservation({
        reservationId: reservation.id,
        actualAmount: 3001,
      }),
    ).rejects.toThrow("Actual consumption cannot exceed the reserved amount.");

    const wallet = await prisma.userCredit.findUnique({
      where: { id: walletId },
    });
    const stillActive = await prisma.creditReservation.findUnique({
      where: { id: reservation.id },
    });

    expect(wallet?.balance).toBe(0);
    expect(wallet?.reservedBalance).toBe(3000);
    expect(stillActive?.status).toBe("ACTIVE");
  });
});
