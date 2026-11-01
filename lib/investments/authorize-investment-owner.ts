import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function authorizeInvestmentOwner() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id || !session.user.email) {
    throw new Error("UNAUTHORIZED");
  }

  const configuredOwnerEmail = process.env.INVESTMENT_OWNER_EMAIL
    ?.trim()
    .toLowerCase();

  if (!configuredOwnerEmail) {
    throw new Error("INVESTMENT_OWNER_NOT_CONFIGURED");
  }

  const authenticatedEmail = session.user.email.trim().toLowerCase();

  if (authenticatedEmail !== configuredOwnerEmail) {
    throw new Error("FORBIDDEN");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });

  if (
    !user ||
    !user.emailVerified ||
    user.email.trim().toLowerCase() !== configuredOwnerEmail
  ) {
    throw new Error("FORBIDDEN");
  }

  return user;
}