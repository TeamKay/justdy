import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    const body = await request.json();
    const { appointmentId, name, data } = body;

    const normalizedAppointmentId =
      typeof appointmentId === "string" && appointmentId.trim()
        ? appointmentId.trim()
        : null;

    if (normalizedAppointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: {
          id: normalizedAppointmentId,
        },
        select: {
          id: true,
          educatorId: true,
        },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 },
        );
      }

      if (appointment.educatorId !== userId) {
        return NextResponse.json(
          {
            error:
              "You are not authorized to create a whiteboard for this appointment",
          },
          { status: 403 },
        );
      }
    }

    const whiteboard = await prisma.whiteboard.create({
      data: {
        userId,
        appointmentId: normalizedAppointmentId,
        isStandalone: normalizedAppointmentId === null,
        name:
          typeof name === "string" && name.trim()
            ? name.trim()
            : normalizedAppointmentId
              ? "Session Whiteboard"
              : "Standalone Whiteboard",
        data: data ?? EMPTY_WHITEBOARD_DATA,
      },
    });

    return NextResponse.json({ whiteboard }, { status: 201 });
  } catch (error) {
    console.error("POST /api/whiteboards error:", error);

    return NextResponse.json(
      { error: "Failed to create whiteboard" },
      { status: 500 },
    );
  }
}
