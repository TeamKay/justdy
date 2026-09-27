import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

type ClassroomChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
};

type ChatStore = Map<string, ClassroomChatMessage[]>;

type GlobalWithChatStore = typeof globalThis & {
  __justdyLiveHomeworkChatStore?: ChatStore;
};

const globalWithChatStore = globalThis as GlobalWithChatStore;

const chatStore: ChatStore =
  globalWithChatStore.__justdyLiveHomeworkChatStore ?? new Map();

globalWithChatStore.__justdyLiveHomeworkChatStore = chatStore;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

function canAccessSession(
  user: { id: string; role?: string | null },
  liveSession: { learnerId: string; teacherId: string },
) {
  return (
    user.id === liveSession.learnerId ||
    user.id === liveSession.teacherId ||
    user.role?.toLowerCase() === "admin"
  );
}

async function getAccessibleSession(sessionId: string) {
  return prisma.liveHomeworkSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      learnerId: true,
      teacherId: true,
    },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { sessionId } = await context.params;
    const liveSession = await getAccessibleSession(sessionId);

    if (!liveSession) {
      return NextResponse.json(
        { error: "Live classroom session not found." },
        { status: 404 },
      );
    }

    if (!canAccessSession(user, liveSession)) {
      return NextResponse.json(
        { error: "You do not have access to this classroom." },
        { status: 403 },
      );
    }

    const sinceParam = request.nextUrl.searchParams.get("since");
    const since = sinceParam ? Number(sinceParam) : 0;
    const sinceTimestamp = Number.isFinite(since) ? since : 0;

    const messages = chatStore.get(sessionId) ?? [];

    return NextResponse.json(
      {
        messages: messages.filter(
          (message) => message.createdAt >= sinceTimestamp,
        ),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "GET /api/live-homework-help/session/[sessionId]/chat error:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to load classroom chat." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { sessionId } = await context.params;
    const liveSession = await getAccessibleSession(sessionId);

    if (!liveSession) {
      return NextResponse.json(
        { error: "Live classroom session not found." },
        { status: 404 },
      );
    }

    if (!canAccessSession(user, liveSession)) {
      return NextResponse.json(
        { error: "You do not have access to this classroom." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);

    const text =
      body &&
      typeof body === "object" &&
      "text" in body &&
      typeof body.text === "string"
        ? body.text.trim()
        : "";

    if (!text) {
      return NextResponse.json(
        { error: "Message text is required." },
        { status: 400 },
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { error: "Message is too long." },
        { status: 400 },
      );
    }

    const message: ClassroomChatMessage = {
      id: crypto.randomUUID(),
      senderId: user.id,
      text,
      createdAt: Date.now(),
    };

    const messages = chatStore.get(sessionId) ?? [];

    messages.push(message);

    if (messages.length > 500) {
      messages.splice(0, messages.length - 500);
    }

    chatStore.set(sessionId, messages);

    return NextResponse.json(
      {
        success: true,
        message,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "POST /api/live-homework-help/session/[sessionId]/chat error:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to send classroom chat message." },
      { status: 500 },
    );
  }
}
