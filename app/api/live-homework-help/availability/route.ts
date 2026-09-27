import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

async function canManageLiveHelp(user: { id: string; role?: string | null }) {
  if (user.role === "ADMIN") return true;
  return hasCapability(user.id, CAPABILITIES.TEACH);
}

/**
 * GET
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    if (!(await canManageLiveHelp(user))) {
      return NextResponse.json(
        {
          error: "Teacher access required.",
        },
        {
          status: 403,
        },
      );
    }

    const availability =
      await prisma.liveHomeworkTeacherAvailability.findUnique({
        where: {
          teacherId: user.id,
        },
      });

    return NextResponse.json({
      availability,
    });
  } catch (error) {
    console.error("GET live homework availability error:", error);

    return NextResponse.json(
      {
        error: "Unable to load live homework-help availability.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * POST
 *
 * Enter the live homework-help teacher queue.
 */
export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    if (!(await canManageLiveHelp(user))) {
      return NextResponse.json(
        {
          error: "Teacher access required.",
        },
        {
          status: 403,
        },
      );
    }

    const now = new Date();

    const availability = await prisma.liveHomeworkTeacherAvailability.upsert({
      where: {
        teacherId: user.id,
      },
      create: {
        teacherId: user.id,
        isAvailable: true,
        activatedAt: now,
        deactivatedAt: null,
      },
      update: {
        isAvailable: true,
        activatedAt: now,
        deactivatedAt: null,
      },
    });

    return NextResponse.json({
      availability,
    });
  } catch (error) {
    console.error("POST live homework availability error:", error);

    return NextResponse.json(
      {
        error: "Unable to enter the live homework-help queue.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * DELETE
 *
 * Leave the live homework-help teacher queue.
 */
export async function DELETE() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    if (!(await canManageLiveHelp(user))) {
      return NextResponse.json(
        {
          error: "Teacher access required.",
        },
        {
          status: 403,
        },
      );
    }

    const availability =
      await prisma.liveHomeworkTeacherAvailability.findUnique({
        where: {
          teacherId: user.id,
        },
      });

    if (!availability) {
      return NextResponse.json({
        availability: null,
      });
    }

    const updated = await prisma.liveHomeworkTeacherAvailability.update({
      where: {
        id: availability.id,
      },
      data: {
        isAvailable: false,
        deactivatedAt: new Date(),
      },
    });

    return NextResponse.json({
      availability: updated,
    });
  } catch (error) {
    console.error("DELETE live homework availability error:", error);

    return NextResponse.json(
      {
        error: "Unable to leave the live homework-help queue.",
      },
      {
        status: 500,
      },
    );
  }
}
