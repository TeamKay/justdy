import "server-only";

import prisma from "@/lib/prisma";
import {
  CreditTransactionType,
  CreditReservationStatus,
} from "@/lib/generated/prisma/client";
import {
  CreditReservationError,
  InsufficientCreditsError,
} from "@/lib/credits/errors";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function assertPositiveInteger(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Credit amount must be a positive integer.");
  }
}

function assertNonNegativeInteger(amount: number) {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error("actualAmount must be a non-negative integer.");
  }
}

export async function reserveCreditsInTransaction(
  tx: Tx,
  {
    userId,
    amount,
    referenceType,
    referenceId,
    description,
    idempotencyKey,
    expiresAt,
  }: {
    userId: string;
    amount: number;
    referenceType: string;
    referenceId: string;
    description?: string;
    idempotencyKey?: string;
    expiresAt?: Date;
  },
) {
  assertPositiveInteger(amount);

  if (idempotencyKey) {
    const existing = await tx.creditReservation.findUnique({
      where: { idempotencyKey },
    });

    if (existing) return existing;
  }

  const wallet = await tx.userCredit.upsert({
    where: { userId },
    create: {
      userId,
      balance: 0,
      reservedBalance: 0,
    },
    update: {},
    select: { id: true },
  });

  const updated = await tx.userCredit.updateMany({
    where: {
      id: wallet.id,
      balance: { gte: amount },
    },
    data: {
      balance: { decrement: amount },
      reservedBalance: { increment: amount },
    },
  });

  if (updated.count !== 1) {
    const current = await tx.userCredit.findUnique({
      where: { id: wallet.id },
      select: { balance: true },
    });

    throw new InsufficientCreditsError(amount, current?.balance ?? 0);
  }

  const reservation = await tx.creditReservation.create({
    data: {
      userId,
      userCreditId: wallet.id,
      amount,
      status: CreditReservationStatus.ACTIVE,
      referenceType,
      referenceId,
      description,
      idempotencyKey,
      expiresAt,
    },
  });

  await tx.creditTransaction.create({
    data: {
      userId,
      userCreditId: wallet.id,
      amount: 0,
      type: CreditTransactionType.RESERVATION,
      description: description ?? `Reserved ${amount} credits`,
      referenceType,
      referenceId,
      idempotencyKey: idempotencyKey
        ? `${idempotencyKey}:reservation`
        : undefined,
    },
  });

  return reservation;
}

export async function reserveCredits(input: Parameters<typeof reserveCreditsInTransaction>[1]) {
  return prisma.$transaction((tx) => reserveCreditsInTransaction(tx, input));
}

export async function releaseCreditReservationInTransaction(
  tx: Tx,
  reservationId: string,
) {
  const reservation = await tx.creditReservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) {
    throw new CreditReservationError("Credit reservation not found.");
  }

  if (reservation.status !== CreditReservationStatus.ACTIVE) {
    return reservation;
  }

  const claimed = await tx.creditReservation.updateMany({
    where: {
      id: reservation.id,
      status: CreditReservationStatus.ACTIVE,
    },
    data: {
      status: CreditReservationStatus.RELEASED,
      releasedAt: new Date(),
    },
  });

  if (claimed.count !== 1) {
    return (await tx.creditReservation.findUnique({
      where: { id: reservation.id },
    })) ?? reservation;
  }

  await tx.userCredit.update({
    where: { id: reservation.userCreditId },
    data: {
      balance: { increment: reservation.amount },
      reservedBalance: { decrement: reservation.amount },
    },
  });

  await tx.creditTransaction.create({
    data: {
      userId: reservation.userId,
      userCreditId: reservation.userCreditId,
      amount: 0,
      type: CreditTransactionType.RELEASE,
      description: `Released ${reservation.amount} reserved credits`,
      referenceType: reservation.referenceType,
      referenceId: reservation.referenceId,
      idempotencyKey: `reservation:${reservation.id}:release`,
    },
  });

  return (await tx.creditReservation.findUnique({
    where: { id: reservation.id },
  })) ?? reservation;
}

export async function releaseCreditReservation(reservationId: string) {
  return prisma.$transaction((tx) =>
    releaseCreditReservationInTransaction(tx, reservationId),
  );
}

export async function settleCreditReservationInTransaction(
  tx: Tx,
  {
    reservationId,
    actualAmount,
  }: {
    reservationId: string;
    actualAmount: number;
  },
) {
  assertNonNegativeInteger(actualAmount);

  const reservation = await tx.creditReservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) {
    throw new CreditReservationError("Credit reservation not found.");
  }

  if (reservation.status !== CreditReservationStatus.ACTIVE) {
    return reservation;
  }

  if (actualAmount > reservation.amount) {
    throw new CreditReservationError(
      "Actual consumption cannot exceed the reserved amount.",
    );
  }

  const unused = reservation.amount - actualAmount;

  const claimed = await tx.creditReservation.updateMany({
    where: {
      id: reservation.id,
      status: CreditReservationStatus.ACTIVE,
    },
    data: {
      status: CreditReservationStatus.SETTLED,
      settledAt: new Date(),
    },
  });

  if (claimed.count !== 1) {
    return (await tx.creditReservation.findUnique({
      where: { id: reservation.id },
    })) ?? reservation;
  }

  await tx.userCredit.update({
    where: { id: reservation.userCreditId },
    data: {
      reservedBalance: { decrement: reservation.amount },
      ...(unused > 0 ? { balance: { increment: unused } } : {}),
    },
  });

  if (actualAmount > 0) {
    await tx.creditTransaction.create({
      data: {
        userId: reservation.userId,
        userCreditId: reservation.userCreditId,
        amount: -actualAmount,
        type: CreditTransactionType.CONSUMPTION,
        description:
          reservation.description ??
          `Consumed ${actualAmount} reserved credits`,
        referenceType: reservation.referenceType,
        referenceId: reservation.referenceId,
        idempotencyKey: `reservation:${reservation.id}:settle`,
      },
    });
  }

  if (unused > 0) {
    await tx.creditTransaction.create({
      data: {
        userId: reservation.userId,
        userCreditId: reservation.userCreditId,
        amount: unused,
        type: CreditTransactionType.RELEASE,
        description: `Released ${unused} unused reserved credits`,
        referenceType: reservation.referenceType,
        referenceId: reservation.referenceId,
        idempotencyKey: `reservation:${reservation.id}:release`,
      },
    });
  }

  return (await tx.creditReservation.findUnique({
    where: { id: reservation.id },
  })) ?? reservation;
}

export async function settleCreditReservation(input: {
  reservationId: string;
  actualAmount: number;
}) {
  return prisma.$transaction((tx) =>
    settleCreditReservationInTransaction(tx, input),
  );
}
