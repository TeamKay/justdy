import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

type WhiteboardPoint = {
  x: number;
  y: number;
};

type WhiteboardStroke = {
  id: string;
  points: WhiteboardPoint[];
  color: string;
  width: number;
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAdmin(role: string | null | undefined) {
  return role?.toLowerCase() === "admin";
}

function canAccessSession(
  user: { id: string; role?: string | null },
  liveSession: { learnerId: string; teacherId: string },
) {
  return (
    user.id === liveSession.learnerId ||
    user.id === liveSession.teacherId ||
    isAdmin(user.role)
  );
}

function isPoint(value: unknown): value is WhiteboardPoint {
  if (!value || typeof value !== "object") {
    return false;
  }

  const point = value as Record<string, unknown>;

  return (
    typeof point.x === "number" &&
    Number.isFinite(point.x) &&
    typeof point.y === "number" &&
    Number.isFinite(point.y)
  );
}

function isStroke(value: unknown): value is WhiteboardStroke {
  if (!value || typeof value !== "object") {
    return false;
  }

  const stroke = value as Record<string, unknown>;

  return (
    typeof stroke.id === "string" &&
    stroke.id.length > 0 &&
    stroke.id.length <= 100 &&
    Array.isArray(stroke.points) &&
    stroke.points.length <= 5000 &&
    stroke.points.every(isPoint) &&
    typeof stroke.color === "string" &&
    stroke.color.length <= 32 &&
    typeof stroke.width === "number" &&
    Number.isFinite(stroke.width) &&
    stroke.width > 0 &&
    stroke.width <= 100
  );
}

function parseStrokes(body: unknown): WhiteboardStroke[] | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as Record<string, unknown>;

  if (!Array.isArray(payload.strokes) || payload.strokes.length > 2000) {
    return null;
  }

  if (!payload.strokes.every(isStroke)) {
    return null;
  }

  return payload.strokes;
}

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

async function getAccessibleSession(sessionId: string) {
  return prisma.liveHomeworkSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      learnerId: true,
      teacherId: true,
      whiteboardId: true,
    },
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
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

    if (!liveSession.whiteboardId) {
      return NextResponse.json(
        { whiteboard: null, strokes: [] },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
      );
    }

    const whiteboard = await prisma.whiteboard.findUnique({
      where: { id: liveSession.whiteboardId },
      select: {
        id: true,
        data: true,
        updatedAt: true,
      },
    });

    if (!whiteboard) {
      return NextResponse.json(
        { whiteboard: null, strokes: [] },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
      );
    }

    const data =
      whiteboard.data && typeof whiteboard.data === "object"
        ? (whiteboard.data as { strokes?: unknown })
        : null;

    const strokes = Array.isArray(data?.strokes)
      ? data.strokes.filter(isStroke)
      : [];

    return NextResponse.json(
      {
        whiteboard: {
          id: whiteboard.id,
          updatedAt: whiteboard.updatedAt.toISOString(),
        },
        strokes,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "GET /api/live-homework-help/session/[sessionId]/whiteboard error:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to load the whiteboard." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { sessionId } = await context.params;
    const body = await request.json().catch(() => null);
    const strokes = parseStrokes(body);

    if (!strokes) {
      return NextResponse.json(
        { error: "Invalid whiteboard data." },
        { status: 400 },
      );
    }

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

    let whiteboardId = liveSession.whiteboardId;

    if (!whiteboardId) {
      /*
       * Avoid an interactive Prisma transaction here. The classroom is a
       * high-frequency collaborative surface and Neon/serverless transaction
       * acquisition can time out under concurrent writes.
       */
      const whiteboard = await prisma.whiteboard.create({
        data: {
          userId: liveSession.learnerId,
          name: "Live Homework Help Whiteboard",
          data: { strokes },
          isStandalone: false,
        },
        select: { id: true, updatedAt: true },
      });

      const claimedSession = await prisma.liveHomeworkSession.updateMany({
        where: {
          id: sessionId,
          whiteboardId: null,
        },
        data: {
          whiteboardId: whiteboard.id,
        },
      });

      if (claimedSession.count === 0) {
        const currentSession = await getAccessibleSession(sessionId);
        whiteboardId = currentSession?.whiteboardId ?? whiteboard.id;
      } else {
        whiteboardId = whiteboard.id;
      }
    }

    let whiteboard = await prisma.whiteboard.update({
      where: { id: whiteboardId },
      data: { data: { strokes } },
      select: { id: true, updatedAt: true },
    });

    /*
     * If another browser won the first-whiteboard race, update the winning
     * whiteboard instead of leaving the current browser on the orphaned one.
     */
    const currentSession = await getAccessibleSession(sessionId);
    if (
      currentSession?.whiteboardId &&
      currentSession.whiteboardId !== whiteboardId
    ) {
      whiteboard = await prisma.whiteboard.update({
        where: { id: currentSession.whiteboardId },
        data: { data: { strokes } },
        select: { id: true, updatedAt: true },
      });
      whiteboardId = whiteboard.id;
    }

    return NextResponse.json(
      {
        saved: true,
        whiteboard: {
          id: whiteboard.id,
          updatedAt: whiteboard.updatedAt.toISOString(),
        },
        strokeCount: strokes.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "PUT /api/live-homework-help/session/[sessionId]/whiteboard error:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to save the whiteboard." },
      { status: 500 },
    );
  }
}
