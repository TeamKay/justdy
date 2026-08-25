import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

type ResolveRequest = {
  mode?: "standalone" | "appointment";
  appointmentId?: string;
};

const EMPTY_WHITEBOARD_DATA = {
  version: 1,
  pages: [],
  currentPageIndex: 0,
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ResolveRequest;
    const mode = body.mode;
    const appointmentId =
      typeof body.appointmentId === "string" ? body.appointmentId.trim() : "";

    if (mode !== "standalone" && mode !== "appointment") {
      return NextResponse.json(
        {
          error:
            'Invalid whiteboard mode. Expected "standalone" or "appointment".',
        },
        { status: 400 },
      );
    }

    // ============================================================
    // STANDALONE WHITEBOARD
    // ============================================================

    if (mode === "standalone") {
      let whiteboard = await prisma.whiteboard.findFirst({
        where: {
          userId,
          isStandalone: true,
          appointmentId: null,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (!whiteboard) {
        whiteboard = await prisma.whiteboard.create({
          data: {
            userId,
            isStandalone: true,
            appointmentId: null,
            name: "Standalone Whiteboard",
            data: EMPTY_WHITEBOARD_DATA,
          },
        });
      }

      return NextResponse.json({ whiteboard });
    }

    // ============================================================
    // APPOINTMENT WHITEBOARD
    // ============================================================

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 },
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      select: {
        id: true,
        educatorId: true,
      },
    });

    if (!appointment) {
      console.error("WHITEBOARD RESOLVE: Appointment not found", {
        appointmentId,
        userId,
      });

      return NextResponse.json(
        {
          error: "Appointment not found",
          appointmentId,
        },
        { status: 404 },
      );
    }

    if (appointment.educatorId !== userId) {
      return NextResponse.json(
        {
          error: "You are not authorized to access this appointment whiteboard",
        },
        { status: 403 },
      );
    }

    const existingWhiteboard = await prisma.whiteboard.findUnique({
      where: {
        appointmentId: appointment.id,
      },
    });

    if (existingWhiteboard) {
      if (existingWhiteboard.userId !== userId) {
        return NextResponse.json(
          {
            error: "You are not authorized to access this whiteboard",
          },
          { status: 403 },
        );
      }

      return NextResponse.json({
        whiteboard: existingWhiteboard,
      });
    }

    try {
      const whiteboard = await prisma.whiteboard.create({
        data: {
          userId,
          appointmentId: appointment.id,
          isStandalone: false,
          name: "Session Whiteboard",
          data: EMPTY_WHITEBOARD_DATA,
        },
      });

      return NextResponse.json({ whiteboard }, { status: 201 });
    } catch (error: unknown) {
      // appointmentId is unique. If another request created the board
      // between our read and create, return that board instead of failing.
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        const whiteboard = await prisma.whiteboard.findUnique({
          where: {
            appointmentId: appointment.id,
          },
        });

        if (whiteboard) {
          if (whiteboard.userId !== userId) {
            return NextResponse.json(
              {
                error: "You are not authorized to access this whiteboard",
              },
              { status: 403 },
            );
          }

          return NextResponse.json({ whiteboard });
        }
      }

      throw error;
    }
  } catch (error) {
    console.error("POST /api/whiteboards/resolve error:", error);

    return NextResponse.json(
      { error: "Failed to resolve whiteboard" },
      { status: 500 },
    );
  }
}
