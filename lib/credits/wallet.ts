import "server-only";

import prisma from "@/lib/prisma";

export async function ensureWallet(userId: string) {
  if (!userId) throw new Error("userId is required.");

  return prisma.userCredit.upsert({
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
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getWallet(userId: string) {
  const wallet = await prisma.userCredit.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      balance: true,
      reservedBalance: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    wallet ?? {
      id: null,
      userId,
      balance: 0,
      reservedBalance: 0,
      createdAt: null,
      updatedAt: null,
    }
  );
}

export async function getAvailableBalance(userId: string) {
  const wallet = await prisma.userCredit.findUnique({
    where: { userId },
    select: { balance: true },
  });

  return wallet?.balance ?? 0;
}
