import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import prisma from "@/lib/prisma";

export const requireUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      imageUrl: true,
      specialty: true,
      experience: true,
      credentialUrl: true,
      description: true,
      verificationStatus: true,
      stripeCustomerId: true, // ✅ FIXED
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
});
