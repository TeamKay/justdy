import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Context = {
  params: Promise<{
    whiteboardId: string;
  }>;
};

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { whiteboardId } = await context.params;

    const whiteboard = await prisma.whiteboard.findFirst({
      where: {
        id: whiteboardId,
        userId: user.id,
      },
    });

    if (!whiteboard) {
      return NextResponse.json(
        { error: "Whiteboard not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ whiteboard });
  } catch (error) {
    console.error("GET /api/whiteboards/[whiteboardId] error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve whiteboard" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { whiteboardId } = await context.params;
    const body = await request.json();
    const { name, data } = body;

    if (data === undefined || data === null) {
      return NextResponse.json(
        { error: "Whiteboard data is required" },
        { status: 400 },
      );
    }

    const existingWhiteboard = await prisma.whiteboard.findFirst({
      where: {
        id: whiteboardId,
        userId: user.id,
      },
    });

    if (!existingWhiteboard) {
      return NextResponse.json(
        { error: "Whiteboard not found" },
        { status: 404 },
      );
    }

    const whiteboard = await prisma.whiteboard.update({
      where: {
        id: whiteboardId,
      },
      data: {
        name:
          typeof name === "string" && name.trim()
            ? name.trim()
            : existingWhiteboard.name,
        data,
      },
    });

    return NextResponse.json({ whiteboard });
  } catch (error) {
    console.error("PUT /api/whiteboards/[whiteboardId] error:", error);

    return NextResponse.json(
      { error: "Failed to save whiteboard" },
      { status: 500 },
    );
  }
}
