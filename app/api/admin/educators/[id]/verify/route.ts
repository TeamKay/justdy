import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type VerificationAction = "verify" | "reject";

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
    };

    if (body.action !== "verify" && body.action !== "reject") {
      return NextResponse.json(
        { error: "Action must be verify or reject." },
        { status: 400 },
      );
    }

    const action = body.action as VerificationAction;

    const profile = await prisma.teachingProfile.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        verificationStatus: true,
        user: {
          select: {
            id: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Teaching profile not found." },
        { status: 404 },
      );
    }

    // An administrator cannot review their own teaching profile.
    if (profile.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot review your own teaching profile." },
        { status: 403 },
      );
    }

    // Only actual tutor accounts and administrator teaching profiles
    // are eligible for this approval workflow.
    if (
      profile.user.role !== "TUTOR" &&
      profile.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Only tutor accounts and administrator teaching profiles can be reviewed.",
        },
        { status: 400 },
      );
    }

    if (profile.user.status !== "Active") {
      return NextResponse.json(
        { error: "This account is not currently active." },
        { status: 400 },
      );
    }

    const verificationStatus =
      action === "verify" ? "Verified" : "Rejected";

    await prisma.teachingProfile.update({
      where: { id: profile.id },
      data: { verificationStatus },
    });

    return NextResponse.json({
      success: true,
      status: verificationStatus,
      userId: profile.userId,
      role: profile.user.role,
    });
  } catch (error) {
    console.error("Teaching profile verification error:", error);

    return NextResponse.json(
      { error: "Unable to update teaching profile verification." },
      { status: 500 },
    );
  }
}
