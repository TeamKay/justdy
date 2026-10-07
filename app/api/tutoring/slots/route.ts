import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createTutoringSlot,
  getAvailableTutoringSlots,
  getTutoringTutor,
} from "@/lib/tutoring/booking";
import { requireVerifiedTutor } from "@/lib/tutoring/authorization";

export const dynamic = "force-dynamic";

function parseDate(value: unknown, fieldName: string): Date {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} is invalid.`);
  }

  return date;
}

async function getAuthenticatedUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user?.id ?? null;
}

function errorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;

  if (message === "Unauthorized.") {
    return NextResponse.json({ error: message }, { status: 401 });
  }

  if (
    message === "Verified tutor access is required." ||
    message.toLowerCase().includes("verified tutor")
  ) {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  if (
    message.toLowerCase().includes("not found") ||
    message.toLowerCase().includes("does not exist")
  ) {
    return NextResponse.json({ error: message }, { status: 404 });
  }

  if (
    message.toLowerCase().includes("already") ||
    message.toLowerCase().includes("overlap") ||
    message.toLowerCase().includes("booked")
  ) {
    return NextResponse.json({ error: message }, { status: 409 });
  }

  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const tutorId = searchParams.get("tutorId")?.trim();

    if (!tutorId) {
      return NextResponse.json(
        {
          error: "tutorId is required.",
        },
        {
          status: 400,
        },
      );
    }

    const now = new Date();

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const from = fromParam ? parseDate(fromParam, "from") : now;

    const defaultTo = new Date(from);
    defaultTo.setDate(defaultTo.getDate() + 14);

    const to = toParam ? parseDate(toParam, "to") : defaultTo;

    if (from >= to) {
      return NextResponse.json(
        {
          error: "The requested availability range is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    const tutor = await getTutoringTutor(tutorId);

    if (!tutor) {
      return NextResponse.json(
        {
          error: "Tutor not found.",
        },
        {
          status: 404,
        },
      );
    }

    const slots = await getAvailableTutoringSlots({
      tutorId,
      from,
      to,
    });

    return NextResponse.json({
      tutorId,
      from: from.toISOString(),
      to: to.toISOString(),
      slots,
    });
  } catch (error) {
    console.error("Failed to load tutoring availability:", error);

    return errorResponse(
      error,
      "Failed to load tutoring availability.",
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    await requireVerifiedTutor(userId);

    const body = (await request.json()) as {
      startTime?: unknown;
      endTime?: unknown;
    };

    const startTime = parseDate(body.startTime, "startTime");
    const endTime = parseDate(body.endTime, "endTime");

    const slot = await createTutoringSlot({
      tutorId: userId,
      startTime,
      endTime,
    });

    return NextResponse.json(
      {
        slot,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Failed to create tutoring availability:", error);

    return errorResponse(
      error,
      "Failed to create tutoring availability.",
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    await requireVerifiedTutor(userId);

    const body = (await request.json()) as {
      id?: unknown;
      startTime?: unknown;
      endTime?: unknown;
    };

    if (typeof body.id !== "string" || !body.id.trim()) {
      return NextResponse.json(
        {
          error: "Availability id is required.",
        },
        {
          status: 400,
        },
      );
    }

    const startTime = parseDate(body.startTime, "startTime");
    const endTime = parseDate(body.endTime, "endTime");

    if (startTime <= new Date()) {
      return NextResponse.json(
        {
          error: "Availability must be scheduled for a future time.",
        },
        {
          status: 400,
        },
      );
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        {
          error: "The end time must be after the start time.",
        },
        {
          status: 400,
        },
      );
    }

    const durationMinutes =
      (endTime.getTime() - startTime.getTime()) / 60000;

    if (durationMinutes < 15) {
      return NextResponse.json(
        {
          error: "Availability must be at least 15 minutes long.",
        },
        {
          status: 400,
        },
      );
    }

    const existing = await prisma.availability.findFirst({
      where: {
        id: body.id,
        educatorId: userId,
      },
      select: {
        id: true,
        educatorId: true,
        status: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Availability slot not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (existing.status !== "Available") {
      return NextResponse.json(
        {
          error:
            existing.status === "Booked"
              ? "Booked availability cannot be edited."
              : "Only available slots can be edited.",
        },
        {
          status: 409,
        },
      );
    }

    const overlapping = await prisma.availability.findFirst({
      where: {
        educatorId: userId,
        id: {
          not: existing.id,
        },
        status: "Available",
        startTime: {
          lt: endTime,
        },
        endTime: {
          gt: startTime,
        },
      },
      select: {
        id: true,
      },
    });

    if (overlapping) {
      return NextResponse.json(
        {
          error:
            "The updated availability overlaps another available slot.",
        },
        {
          status: 409,
        },
      );
    }

    const availability = await prisma.availability.update({
      where: {
        id: existing.id,
      },
      data: {
        startTime,
        endTime,
      },
    });

    return NextResponse.json({
      availability,
    });
  } catch (error) {
    console.error("Failed to update tutoring availability:", error);

    return errorResponse(
      error,
      "Failed to update tutoring availability.",
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    await requireVerifiedTutor(userId);

    const body = (await request.json()) as {
      id?: unknown;
    };

    if (typeof body.id !== "string" || !body.id.trim()) {
      return NextResponse.json(
        {
          error: "Availability id is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existing = await prisma.availability.findFirst({
      where: {
        id: body.id,
        educatorId: userId,
      },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Availability slot not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (existing.status !== "Available") {
      return NextResponse.json(
        {
          error:
            existing.status === "Booked"
              ? "Booked availability cannot be deleted."
              : "Only available slots can be deleted.",
        },
        {
          status: 409,
        },
      );
    }

    await prisma.availability.delete({
      where: {
        id: existing.id,
      },
    });

    return NextResponse.json({
      success: true,
      deletedId: existing.id,
    });
  } catch (error) {
    console.error("Failed to delete tutoring availability:", error);

    return errorResponse(
      error,
      "Failed to delete tutoring availability.",
    );
  }
}