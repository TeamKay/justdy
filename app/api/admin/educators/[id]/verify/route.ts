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
    /*
     * Only authenticated administrators may approve
     * or reject tutor applications.
     */
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Administrator access required.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
    };

    if (body.action !== "verify" && body.action !== "reject") {
      return NextResponse.json(
        {
          error: "Action must be verify or reject.",
        },
        { status: 400 },
      );
    }

    const action = body.action as VerificationAction;

    /*
     * Load the teaching profile together with
     * the associated account.
     */
    const profile = await prisma.teachingProfile.findUnique({
      where: {
        id,
      },

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
        {
          error: "Teaching application not found.",
        },
        { status: 404 },
      );
    }

    /*
     * Administrators are platform operators.
     *
     * They do not need to go through the normal
     * tutor approval process.
     */
    if (profile.user.role === "ADMIN") {
      return NextResponse.json(
        {
          error: "Administrator teaching profiles do not require approval.",
        },
        { status: 400 },
      );
    }

    /*
     * Only active learner accounts can be approved
     * as tutors.
     */
    if (profile.user.status !== "Active") {
      return NextResponse.json(
        {
          error:
            "This user's account is not currently eligible for tutor approval.",
        },
        { status: 400 },
      );
    }

    const verified = action === "verify";

    /*
     * ---------------------------------------------------------
     * APPROVE
     * ---------------------------------------------------------
     *
     * The account remains:
     *
     *   User.role = USER
     *
     * and gains:
     *
     *   CAN_LEARN
     *   CAN_TEACH
     *   CAN_TUTOR
     *   CAN_RECEIVE_PAYOUTS
     */
    if (verified) {
      await prisma.teachingProfile.update({
  where: {
    id: profile.id,
  },
  data: {
    verificationStatus: "Verified",
  },
});

      

      return NextResponse.json({
        success: true,
        status: "Verified",
        userId: profile.userId,
      });
    }

    /*
     * ---------------------------------------------------------
     * REJECT
     * ---------------------------------------------------------
     *
     * The account remains:
     *
     *   User.role = USER
     *
     * and keeps:
     *
     *   CAN_LEARN
     *
     * but loses:
     *
     *   CAN_TEACH
     *   CAN_TUTOR
     *   CAN_RECEIVE_PAYOUTS
     *
     * The applicant may later submit a new application.
     */
    await prisma.teachingProfile.update({
      where: {
        id: profile.id,
      },

      data: {
        verificationStatus: "Rejected",
      },
    });

    /*
     * Explicitly preserve learner access.
     */
  

    return NextResponse.json({
      success: true,
      status: "Rejected",
      userId: profile.userId,
    });
  } catch (error) {
    console.error("Tutor verification error:", error);

    return NextResponse.json(
      {
        error: "Unable to update tutor application.",
      },
      { status: 500 },
    );
  }
}
