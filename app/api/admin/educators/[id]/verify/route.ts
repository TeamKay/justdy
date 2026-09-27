
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

const TEACH = "CAN_TEACH";
const TUTOR = "CAN_TUTOR";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  const role = String(session.user.role ?? "").toUpperCase();

  if (role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 },
      ),
    };
  }

  return { session };
}

/**
 * Add a capability to a user if it does not already exist.
 *
 * Prisma.$transaction() provides a TransactionClient rather than the
 * full PrismaClient, so these helpers intentionally accept
 * Prisma.TransactionClient.
 */
async function ensureCapability(
  tx: Prisma.TransactionClient,
  userId: string,
  key: string,
  name: string,
  description: string,
) {
  const capability = await tx.capability.upsert({
    where: { key },
    update: {
      name,
      description,
    },
    create: {
      key,
      name,
      description,
    },
    select: {
      id: true,
    },
  });

  await tx.userCapability.upsert({
    where: {
      userId_capabilityId: {
        userId,
        capabilityId: capability.id,
      },
    },
    update: {},
    create: {
      userId,
      capabilityId: capability.id,
    },
  });
}

/**
 * Remove a capability from a user if it exists.
 */
async function removeCapability(
  tx: Prisma.TransactionClient,
  userId: string,
  key: string,
) {
  const capability = await tx.capability.findUnique({
    where: { key },
    select: {
      id: true,
    },
  });

  if (!capability) {
    return;
  }

  await tx.userCapability.deleteMany({
    where: {
      userId,
      capabilityId: capability.id,
    },
  });
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const admin = await requireAdmin();

  if (admin.error) {
    return admin.error;
  }

  try {
    const { id } = await context.params;

    const body = (await request.json()) as {
      action?: string;
    };

    const action =
      body.action === "verify"
        ? "verify"
        : body.action === "reject"
          ? "reject"
          : null;

    if (!action) {
      return NextResponse.json(
        {
          error: "Action must be 'verify' or 'reject'.",
        },
        { status: 400 },
      );
    }

    /**
     * Find the target user and their teaching profile.
     *
     * IMPORTANT:
     * We do not use the user's role to determine whether they can teach.
     * An ADMIN can also be a teacher/tutor.
     */
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: true,
        teachingProfile: {
          select: {
            id: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found.",
        },
        { status: 404 },
      );
    }

    if (!user.teachingProfile) {
      return NextResponse.json(
        {
          error: "This user does not have a teaching profile.",
        },
        { status: 404 },
      );
    }

    /**
     * Perform the verification/rejection and capability changes
     * atomically.
     */
    const result = await prisma.$transaction(async (tx) => {
      /*
       * ============================================================
       * VERIFY
       * ============================================================
       */
      if (action === "verify") {
        const profile = await tx.teachingProfile.update({
          where: {
            id: user.teachingProfile!.id,
          },
          data: {
            verificationStatus: "Verified",
          },
          select: {
            id: true,
            verificationStatus: true,
          },
        });

        /**
         * Teaching and tutoring are capabilities, not account roles.
         *
         * This deliberately does NOT change User.role.
         *
         * Therefore:
         *
         * ADMIN + teaching capability
         *
         * remains:
         *
         * ADMIN
         *
         * while also being able to teach and tutor.
         */

        await ensureCapability(
          tx,
          user.id,
          TEACH,
          "Teach",
          "Can maintain and use a teaching profile.",
        );

        await ensureCapability(
          tx,
          user.id,
          TUTOR,
          "Tutor",
          "Can provide paid tutoring when otherwise verified.",
        );

        /**
         * Keep the existing legacy boolean fields synchronized
         * during the migration to the capability system.
         */
        await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            canTeach: true,
            canTutor: true,
          },
        });

        return profile;
      }

      /*
       * ============================================================
       * REJECT
       * ============================================================
       */

      const profile = await tx.teachingProfile.update({
        where: {
          id: user.teachingProfile!.id,
        },
        data: {
          verificationStatus: "Rejected",
        },
        select: {
          id: true,
          verificationStatus: true,
        },
      });

      /**
       * Remove paid tutoring capability.
       */
      await removeCapability(
        tx,
        user.id,
        TUTOR,
      );

      /**
       * Keep teaching capability available so the user can remain
       * in the teaching workflow and revise/resubmit their profile.
       */
      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          canTutor: false,
          canTeach: true,
        },
      });

      return profile;
    });

    return NextResponse.json({
      success: true,
      action,
      userId: user.id,
      profile: result,
    });
  } catch (error) {
    console.error(
      "Admin educator verification error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to update educator verification.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}