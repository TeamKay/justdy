
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type StatusAction = "suspend" | "reactivate";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    if (
      !admin ||
      admin.role !== "ADMIN" ||
      admin.status !== "Active" ||
      !admin.emailVerified
    ) {
      return NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (id === admin.id) {
      return NextResponse.json(
        { error: "You cannot suspend your own account." },
        { status: 403 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
    };

    if (body.action !== "suspend" && body.action !== "reactivate") {
      return NextResponse.json(
        { error: "Action must be suspend or reactivate." },
        { status: 400 },
      );
    }

    const action = body.action as StatusAction;

    const educator = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        status: true,
        teachingProfile: {
          select: {
            verificationStatus: true,
          },
        },
      },
    });

    if (!educator || !educator.teachingProfile) {
      return NextResponse.json(
        { error: "Educator profile not found." },
        { status: 404 },
      );
    }

    if (educator.role !== "TUTOR") {
      return NextResponse.json(
        { error: "Only tutor accounts can be managed here." },
        { status: 400 },
      );
    }

    if (educator.teachingProfile.verificationStatus !== "Verified") {
      return NextResponse.json(
        { error: "Only approved educators can be suspended or reactivated." },
        { status: 400 },
      );
    }

    const expectedStatus = action === "suspend" ? "Active" : "Suspended";
    const nextStatus = action === "suspend" ? "Suspended" : "Active";

    const result = await prisma.user.updateMany({
      where: {
        id,
        role: "TUTOR",
        status: expectedStatus,
      },
      data: {
        status: nextStatus,
      },
    });

    if (result.count !== 1) {
      return NextResponse.json(
        {
          error:
            action === "suspend"
              ? "This educator is not currently active."
              : "This educator is not currently suspended.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      userId: id,
      status: nextStatus,
    });
  } catch (error) {
    console.error("Educator status update error:", error);

    return NextResponse.json(
      { error: "Unable to update educator status." },
      { status: 500 },
    );
  }
}
