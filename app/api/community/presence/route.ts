
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";


export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.user.updateMany({
      where: {
        id: session.user.id,
        status: "Active",
      },
      data: {
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Presence update error:", error);

    return NextResponse.json(
      { error: "Unable to update online presence." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.user.updateMany({
      where: {
        id: session.user.id,
      },
      data: {
        lastSeenAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Presence cleanup error:", error);

    return NextResponse.json(
      { error: "Unable to clear online presence." },
      { status: 500 }
    );
  }
}
