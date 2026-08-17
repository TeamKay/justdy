import "server-only";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const requireAdminOrEducator = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Not logged in → login
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Logged in but not admin or educator → login
  if (!user || !["admin", "educator"].includes(user.role)) {
    redirect("/login");
  }

  return session;
});
