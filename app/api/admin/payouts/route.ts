import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (session.user.role !== "ADMIN") return { error: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  return { userId: session.user.id };
}

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      educator: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ payouts });
}
