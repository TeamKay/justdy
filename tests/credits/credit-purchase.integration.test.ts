import { afterEach, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { fulfillCreditPurchaseInTransaction } from "@/lib/credits/purchases";

const createdUserIds: string[] = [];

async function createUser() {
  const user = await prisma.user.create({
    data: {
      name: "Credit Purchase Test User",
      email: `credit-purchase-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      role: "USER",
    },
    select: { id: true },
  });

  createdUserIds.push(user.id);
  return user;
}

afterEach(async () => {
  if (createdUserIds.length === 0) return;

  await prisma.user.deleteMany({
    where: { id: { in: createdUserIds.splice(0) } },
  });
});

describe("Stripe credit purchase fulfillment", () => {
  it("adds the exact purchased credits and records a PURCHASE ledger entry", async () => {
    const user = await createUser();

    const result = await prisma.$transaction((tx) =>
      fulfillCreditPurchaseInTransaction(tx, {
        userId: user.id,
        sessionId: `cs_test_${Date.now()}_starter`,
        packKey: "starter",
        currency: "usd",
        amountTotal: 100,
      }),
    );

    expect(result.alreadyProcessed).toBe(false);
    expect(result.credits).toBe(100);
    expect(result.balance).toBe(100);

    const wallet = await prisma.userCredit.findUnique({
      where: { userId: user.id },
    });

    expect(wallet?.balance).toBe(100);
    expect(wallet?.reservedBalance).toBe(0);

    const transactions = await prisma.creditTransaction.findMany({
      where: { userId: user.id },
    });

    expect(transactions).toHaveLength(1);
    expect(transactions[0]?.amount).toBe(100);
    expect(transactions[0]?.type).toBe("PURCHASE");
    expect(transactions[0]?.referenceType).toBe("STRIPE_CHECKOUT");
  });

  it("is idempotent when Stripe retries the same checkout session", async () => {
    const user = await createUser();
    const sessionId = `cs_test_${Date.now()}_creator`;

    const first = await prisma.$transaction((tx) =>
      fulfillCreditPurchaseInTransaction(tx, {
        userId: user.id,
        sessionId,
        packKey: "creator",
        currency: "usd",
        amountTotal: 500,
      }),
    );

    const second = await prisma.$transaction((tx) =>
      fulfillCreditPurchaseInTransaction(tx, {
        userId: user.id,
        sessionId,
        packKey: "creator",
        currency: "usd",
        amountTotal: 500,
      }),
    );

    expect(first.alreadyProcessed).toBe(false);
    expect(second.alreadyProcessed).toBe(true);
    expect(second.transactionId).toBe(first.transactionId);
    expect(second.credits).toBe(500);

    const wallet = await prisma.userCredit.findUnique({
      where: { userId: user.id },
    });

    expect(wallet?.balance).toBe(500);

    const transactions = await prisma.creditTransaction.findMany({
      where: { userId: user.id },
    });

    expect(transactions).toHaveLength(1);
  });

  it("rejects a forged or mismatched Stripe amount", async () => {
    const user = await createUser();

    await expect(
      prisma.$transaction((tx) =>
        fulfillCreditPurchaseInTransaction(tx, {
          userId: user.id,
          sessionId: `cs_test_${Date.now()}_forged`,
          packKey: "studio",
          currency: "usd",
          amountTotal: 100,
        }),
      ),
    ).rejects.toThrow(/amount mismatch/i);

    const wallet = await prisma.userCredit.findUnique({
      where: { userId: user.id },
    });

    expect(wallet).toBeNull();
  });
});
