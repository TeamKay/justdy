import "server-only";

import prisma from "@/lib/prisma";
import { CreditTransactionType } from "@/lib/generated/prisma/client";
import { InsufficientCreditsError } from "@/lib/credits/errors";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function assertPositiveInteger(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Credit amount must be a positive integer.");
  }
}

export type CreditReference = {
  referenceType?: string;
  referenceId?: string;
  idempotencyKey?: string;
  description?: string;
  generationId?: string;
  aiGenerationId?: string;
};

async function findExistingIdempotent(
  tx: Tx,
  idempotencyKey?: string,
) {
  if (!idempotencyKey) return null;

  return tx.creditTransaction.findUnique({
    where: { idempotencyKey },
    select: {
      id: true,
      userId: true,
      userCreditId: true,
      amount: true,
      type: true,
    },
  });
}

export async function addCreditsInTransaction(
  tx: Tx,
  {
    userId,
    amount,
    type = CreditTransactionType.GRANT,
    description = "Credits added",
    referenceType,
    referenceId,
    idempotencyKey,
    generationId,
    aiGenerationId,
  }: CreditReference & {
    userId: string;
    amount: number;
    type?: CreditTransactionType;
  },
) {
  assertPositiveInteger(amount);

  const existing = await findExistingIdempotent(tx, idempotencyKey);
  if (existing) {
    return tx.userCredit.findUniqueOrThrow({
      where: { id: existing.userCreditId },
      select: {
        id: true,
        userId: true,
        balance: true,
        reservedBalance: true,
      },
    });
  }

  const wallet = await tx.userCredit.upsert({
    where: { userId },
    create: {
      userId,
      balance: amount,
      reservedBalance: 0,
    },
    update: {
      balance: { increment: amount },
    },
    select: {
      id: true,
      userId: true,
      balance: true,
      reservedBalance: true,
    },
  });

  await tx.creditTransaction.create({
    data: {
      userId,
      userCreditId: wallet.id,
      amount,
      type,
      description,
      referenceType,
      referenceId,
      idempotencyKey,
      generationId,
      aiGenerationId,
    },
  });

  return wallet;
}

/**
 * Atomic credit consumption.
 *
 * The conditional update is important: two concurrent requests cannot
 * both spend the same available balance.
 */
export async function consumeCreditsInTransaction(
  tx: Tx,
  {
    userId,
    amount,
    type = CreditTransactionType.CONSUMPTION,
    description = "Credits consumed",
    referenceType,
    referenceId,
    idempotencyKey,
    generationId,
    aiGenerationId,
  }: CreditReference & {
    userId: string;
    amount: number;
    type?: CreditTransactionType;
  },
) {
  assertPositiveInteger(amount);

  const existing = await findExistingIdempotent(tx, idempotencyKey);
  if (existing) {
    return tx.userCredit.findUniqueOrThrow({
      where: { id: existing.userCreditId },
      select: {
        id: true,
        userId: true,
        balance: true,
        reservedBalance: true,
      },
    });
  }

  const wallet = await tx.userCredit.upsert({
    where: { userId },
    create: {
      userId,
      balance: 0,
      reservedBalance: 0,
    },
    update: {},
    select: {
      id: true,
      userId: true,
      balance: true,
      reservedBalance: true,
    },
  });

  const updated = await tx.userCredit.updateMany({
    where: {
      id: wallet.id,
      balance: { gte: amount },
    },
    data: {
      balance: { decrement: amount },
    },
  });

  if (updated.count !== 1) {
    const current = await tx.userCredit.findUnique({
      where: { id: wallet.id },
      select: { balance: true },
    });

    throw new InsufficientCreditsError(amount, current?.balance ?? 0);
  }

  const result = await tx.userCredit.findUniqueOrThrow({
    where: { id: wallet.id },
    select: {
      id: true,
      userId: true,
      balance: true,
      reservedBalance: true,
    },
  });

  await tx.creditTransaction.create({
    data: {
      userId,
      userCreditId: wallet.id,
      amount: -amount,
      type,
      description,
      referenceType,
      referenceId,
      idempotencyKey,
      generationId,
      aiGenerationId,
    },
  });

  return result;
}

export async function addCredits(
  input: CreditReference & {
    userId: string;
    amount: number;
    type?: CreditTransactionType;
  },
) {
  return prisma.$transaction((tx) => addCreditsInTransaction(tx, input));
}

export async function consumeCredits(
  input: CreditReference & {
    userId: string;
    amount: number;
  },
) {
  return prisma.$transaction((tx) => consumeCreditsInTransaction(tx, input));
}

export async function refundCredits(
  input: CreditReference & {
    userId: string;
    amount: number;
  },
) {
  return addCredits({
    ...input,
    type: CreditTransactionType.REFUND,
    description: input.description ?? "Credits refunded",
  });
}
