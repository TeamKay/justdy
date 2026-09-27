import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const assignments = await prisma.userCapability.findMany({
    where: { userId: session.user.id },
    select: {
      capability: {
        select: { key: true },
      },
    },
  });

  return NextResponse.json({
    capabilities: assignments.map(({ capability }) => capability.key),
  });
}
