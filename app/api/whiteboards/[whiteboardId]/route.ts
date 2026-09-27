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
  const requestHeaders = await headers();

  /*
   * A database connection can occasionally be terminated while
   * Better Auth is reading the current session. Retry once so a
   * transient connection termination does not turn a valid request
   * into a 500 response.
   */
  try {
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    return session?.user ?? null;
  } catch (error) {
    console.warn(
      "Whiteboard session lookup failed; retrying once:",
      error,
    );

    await new Promise((resolve) => {
      setTimeout(resolve, 150);
    });

    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    return session?.user ?? null;
  }
}

async function getAuthorizedWhiteboard(
  whiteboardId: string,
  userId: string,
) {
  /*
   * Tutoring whiteboards are shared by both booking participants.
   * The canonical tutoring whiteboard is stored with the student's
   * userId, so checking only whiteboard.userId would incorrectly
   * reject the tutor when saving the same shared board.
   */
  return prisma.whiteboard.findFirst({
    where: {
      id: whiteboardId,
      OR: [
        {
          userId,
        },
        {
          booking: {
            OR: [
              { studentId: userId },
              { educatorId: userId },
            ],
          },
        },
        {
          appointment: {
            educatorId: userId,
          },
        },
      ],
    },
  });
}

export async function GET(
  _request: NextRequest,
  context: Context,
) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { whiteboardId } = await context.params;

    const whiteboard = await getAuthorizedWhiteboard(
      whiteboardId,
      user.id,
    );

    if (!whiteboard) {
      return NextResponse.json(
        { error: "Whiteboard not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ whiteboard });
  } catch (error) {
    console.error(
      "GET /api/whiteboards/[whiteboardId] error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to retrieve whiteboard" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: Context,
) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
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

    const existingWhiteboard = await getAuthorizedWhiteboard(
      whiteboardId,
      user.id,
    );

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
    console.error(
      "PUT /api/whiteboards/[whiteboardId] error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to save whiteboard" },
      { status: 500 },
    );
  }
}
