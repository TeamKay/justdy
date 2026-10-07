import prisma from "@/lib/prisma";
import { CreditTransactionType } from "@/lib/generated/prisma/enums";
import { getCreditPack } from "@/lib/credits/packages";

export async function fulfillCreditPurchase({
  userId,
  creditPack,
  amountCents,
  stripeSessionId,
  stripePaymentIntentId,
}: {
  userId: string;
  creditPack: string;
  amountCents: number;
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
}) {
  const pack = getCreditPack(creditPack);

  if (!pack) {
    throw new Error(`Unknown Justdy credit pack: ${creditPack}`);
  }

  if (amountCents !== pack.priceCents) {
    throw new Error(
      `Credit purchase amount mismatch for ${creditPack}: expected ${pack.priceCents}, received ${amountCents}.`,
    );
  }

  const idempotencyKey = `credit-purchase:${stripeSessionId}`;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.creditTransaction.findUnique({
      where: { idempotencyKey },
      select: {
        id: true,
        userId: true,
        amount: true,
        userCreditId: true,
      },
    });

    if (existing) {
      if (existing.userId !== userId || existing.amount !== pack.credits) {
        throw new Error(
          `Credit purchase idempotency conflict for Stripe session ${stripeSessionId}.`,
        );
      }

      const balance = await tx.userCredit.findUnique({
        where: { id: existing.userCreditId },
        select: { balance: true },
      });

      return {
        alreadyProcessed: true,
        creditsAdded: 0,
        balance: balance?.balance ?? 0,
      };
    }

    const userCredit = await tx.userCredit.upsert({
      where: { userId },
      create: {
        userId,
        balance: pack.credits,
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

    await tx.creditTransaction.create({
      data: {
        userId,
        userCreditId: userCredit.id,
        amount: pack.credits,
        type: CreditTransactionType.PURCHASE,
        description: `Purchased ${pack.name} credit pack (${pack.credits} credits)`,
        referenceType: "STRIPE_CREDIT_PURCHASE",
        referenceId: stripeSessionId,
        idempotencyKey,
      },
    });

    console.log("JUSTDY CREDIT PURCHASE FULFILLED:", {
      stripeSessionId,
      stripePaymentIntentId: stripePaymentIntentId ?? null,
      userId,
      pack: pack.key,
      creditsAdded: pack.credits,
      balance: userCredit.balance,
    });

    return {
      alreadyProcessed: false,
      creditsAdded: pack.credits,
      balance: userCredit.balance,
    };
  });
}
