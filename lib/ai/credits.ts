import "server-only";

import prisma from "@/lib/prisma";
import { CreditTransactionType } from "@/lib/generated/prisma/client";

import { InsufficientCreditsError } from "@/lib/credits/errors";
import { AI_CREDIT_COSTS, type AICreditOperation } from "@/lib/credits/pricing";
import {
  addCreditsInTransaction as addUniversalCreditsInTransaction,
  consumeCreditsInTransaction,
} from "@/lib/credits/ledger";

export { AI_CREDIT_COSTS };
export type { AICreditOperation };

export class InsufficientAICreditsError extends InsufficientCreditsError {}

export async function ensureCreditAccount(userId: string) {
  return prisma.userCredit.upsert({
    where: { userId },
    create: { userId, balance: 0, reservedBalance: 0 },
    update: {},
    select: { id: true, userId: true, balance: true },
  });
}

export async function getCreditBalance(userId: string) {
  const wallet = await prisma.userCredit.findUnique({
    where: { userId },
    select: { balance: true },
  });
  return wallet?.balance ?? 0;
}

export async function getAICreditBalance(userId: string) {
  const wallet = await prisma.userCredit.findUnique({
    where: { userId },
    select: { id: true, balance: true },
  });

  return { id: wallet?.id ?? null, balance: wallet?.balance ?? 0 };
}

/** Compatibility wrapper around the universal wallet ledger. */
export async function addCreditsInTransaction(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  input: {
    userId: string;
    amount: number;
    type?: CreditTransactionType;
    description?: string;
    aiGenerationId?: string;
    generationId?: string;
  },
) {
  return addUniversalCreditsInTransaction(tx, input);
}

/**
 * Compatibility wrapper for older AI callers.
 * New AI callers should use consumeCreditsInTransaction directly.
 */
export async function deductCreditsInTransaction(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  input: {
    userId: string;
    amount: number;
    generationId?: string;
    aiGenerationId?: string;
    description?: string;
  },
) {
  return consumeCreditsInTransaction(tx, {
    userId: input.userId,
    amount: input.amount,
    type: CreditTransactionType.CONSUMPTION,
    description: input.description ?? "AI credits used",
    generationId: input.generationId,
    aiGenerationId: input.aiGenerationId,
    referenceType: "AI_GENERATION",
    referenceId: input.aiGenerationId ?? input.generationId,
    idempotencyKey: input.aiGenerationId
      ? `ai-generation:${input.aiGenerationId}`
      : input.generationId
        ? `video-generation:${input.generationId}`
        : undefined,
  });
}

export async function consumeAICredits({
  userId,
  operation,
  generationId,
}: {
  userId: string;
  operation: AICreditOperation;
  generationId?: string;
}) {
  const cost = AI_CREDIT_COSTS[operation];

  if (cost <= 0) {
    throw new Error(`Invalid credit cost for ${operation}.`);
  }

  return prisma.$transaction(async (tx) => {
    return consumeCreditsInTransaction(tx, {
      userId,
      amount: cost,
      referenceType: "AI_GENERATION",
      referenceId: generationId,
      idempotencyKey: generationId
        ? `ai-generation:${generationId}`
        : undefined,
      description: `AI ${operation.toLowerCase()} generation`,
      generationId,
      aiGenerationId: generationId,
    });
  });
}
