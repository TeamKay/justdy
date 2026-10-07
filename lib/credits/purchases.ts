import prisma from "@/lib/prisma";
import { getCreditPack } from "@/lib/credits/packages";

export type CreditPurchaseTx = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

export async function fulfillCreditPurchaseInTransaction(
  tx: CreditPurchaseTx,
  {
    userId,
    sessionId,
    packKey,
    currency,
    amountTotal,
  }: {
    userId: string;
    sessionId: string;
    packKey: string;
    currency: string | null;
    amountTotal: number | null;
  },
) {
  const pack = getCreditPack(packKey);

  if (!pack) {
    throw new Error(`Unknown Justdy credit pack: ${packKey}`);
  }

  if (currency?.toLowerCase() !== "usd") {
    throw new Error("Credit purchases must be settled in USD.");
  }

  if (amountTotal !== pack.priceCents) {
    throw new Error(
      `Credit checkout amount mismatch for ${pack.key}: expected ${pack.priceCents}, received ${amountTotal ?? "null"}.`,
    );
  }

  const idempotencyKey = `stripe-credit-purchase:${sessionId}`;

  const existing = await tx.creditTransaction.findUnique({
    where: { idempotencyKey },
    select: {
      id: true,
      amount: true,
    },
  });

  if (existing) {
    const wallet = await tx.userCredit.findUnique({
      where: { userId },
      select: { balance: true },
    });

    return {
      alreadyProcessed: true,
      transactionId: existing.id,
      credits: existing.amount,
      balance: wallet?.balance ?? null,
    };
  }

  const wallet = await tx.userCredit.upsert({
    where: { userId },
    create: {
      userId,
      balance: pack.credits,
      reservedBalance: 0,
    },
    update: {
      balance: {
        increment: pack.credits,
      },
    },
    select: {
      id: true,
      balance: true,
    },
  });

  const transaction = await tx.creditTransaction.create({
    data: {
      userId,
      userCreditId: wallet.id,
      amount: pack.credits,
      type: "PURCHASE",
      description: `${pack.name} credit purchase`,
      referenceType: "STRIPE_CHECKOUT",
      referenceId: sessionId,
      idempotencyKey,
    },
    select: {
      id: true,
    },
  });

  return {
    alreadyProcessed: false,
    transactionId: transaction.id,
    credits: pack.credits,
    balance: wallet.balance,
  };
}
