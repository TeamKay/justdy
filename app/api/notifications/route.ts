import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function currentUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await currentUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids)
    ? body.ids
        .filter((id: unknown): id is string => typeof id === "string")
        .slice(0, 100)
    : [];
  const markAll = body.markAll === true;
  if (!markAll && ids.length === 0) {
    return NextResponse.json(
      { error: "Provide notification ids or markAll: true." },
      { status: 400 },
    );
  }
  await prisma.notification.updateMany({
    where: { userId, readAt: null, ...(markAll ? {} : { id: { in: ids } }) },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
