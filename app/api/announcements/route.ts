import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const announcement = await prisma.announcement.findFirst({
      where: {
        isPublished: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
      select: {
        id: true,
        message: true,
        linkLabel: true,
        linkUrl: true,
      },
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Public announcements GET error:", error);

    return NextResponse.json(
      { error: "Unable to load announcement." },
      { status: 500 },
    );
  }
}