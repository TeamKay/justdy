import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";


import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  CAPABILITIES,
  canManageChildren,
  ensureCapabilities,
} from "@/lib/auth/capabilities";
import { Prisma } from "@/lib/generated/prisma/client";

const FAMILY_ROLES = ["PARENT", "GUARDIAN"] as const;

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

async function ensureManageChildrenCapability(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const capability = await tx.capability.findUnique({
    where: { key: CAPABILITIES.MANAGE_CHILDREN },
    select: { id: true },
  });

  if (!capability) {
    throw new Error("Family management is not configured.");
  }

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

  await tx.user.update({
    where: { id: userId },
    data: { canManageChildren: true },
  });
}

export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const managesChildren = await canManageChildren(userId);

    if (!managesChildren) {
      return NextResponse.json({
        enabled: false,
        families: [],
      });
    }

    const memberships = await prisma.familyMember.findMany({
      where: {
        userId,
        role: { in: [...FAMILY_ROLES] },
      },
      select: {
        role: true,
        family: {
          select: {
            id: true,
            name: true,
            members: {
              where: { role: "CHILD" },
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    status: true,
                    studentProfile: {
                      select: {
                        gradeLevel: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                joinedAt: "asc",
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      enabled: true,
      families: memberships.map(({ role, family }) => ({
        ...family,
        role,
        children: family.members.map(({ user }) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          gradeLevel: user.studentProfile?.gradeLevel ?? null,
        })),
      })),
    });
  } catch (error) {
    console.error("GET /api/family error:", error);

    return NextResponse.json(
      { error: "Failed to load family settings." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      action?: unknown;
      familyName?: unknown;
      familyId?: unknown;
      childEmail?: unknown;
      role?: unknown;
    } | null;

    if (
      !body ||
      typeof body !== "object" ||
      typeof body.action !== "string"
    ) {
      return NextResponse.json(
        { error: "A family action is required." },
        { status: 400 },
      );
    }

    if (body.action === "enable_parent") {
      const familyName =
        typeof body.familyName === "string"
          ? body.familyName.trim().slice(0, 120)
          : "My Family";

      const role =
        body.role === "GUARDIAN" ? "GUARDIAN" : "PARENT";

      const family = await prisma.$transaction(async (tx) => {
        await ensureManageChildrenCapability(tx, userId);

        const existingMembership =
          await tx.familyMember.findFirst({
            where: {
              userId,
              role: { in: [...FAMILY_ROLES] },
            },
            select: {
              familyId: true,
            },
          });

        if (existingMembership) {
          return tx.family.update({
            where: {
              id: existingMembership.familyId,
            },
            data: {
              name: familyName || undefined,
            },
            select: {
              id: true,
              name: true,
            },
          });
        }

        return tx.family.create({
          data: {
            name: familyName || "My Family",
            members: {
              create: {
                userId,
                role,
              },
            },
          },
          select: {
            id: true,
            name: true,
          },
        });
      });

      return NextResponse.json({
        success: true,
        family,
      });
    }

    if (body.action === "add_child") {
      const childEmail =
        typeof body.childEmail === "string"
          ? body.childEmail.trim().toLowerCase()
          : "";

      const familyId =
        typeof body.familyId === "string"
          ? body.familyId
          : "";

      if (!childEmail || !familyId) {
        return NextResponse.json(
          {
            error:
              "Family and learner email are required.",
          },
          { status: 400 },
        );
      }

      if (!(await canManageChildren(userId))) {
        return NextResponse.json(
          {
            error:
              "Enable family management before adding a learner.",
          },
          { status: 403 },
        );
      }

      const parentMembership =
        await prisma.familyMember.findUnique({
          where: {
            familyId_userId: {
              familyId,
              userId,
            },
          },
          select: {
            role: true,
          },
        });

      if (
        !parentMembership ||
        !FAMILY_ROLES.includes(
          parentMembership.role as (typeof FAMILY_ROLES)[number],
        )
      ) {
        return NextResponse.json(
          {
            error: "You do not manage this family.",
          },
          { status: 403 },
        );
      }

      const child = await prisma.user.findUnique({
        where: {
          email: childEmail,
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          emailVerified: true,
        },
      });

      if (!child) {
        return NextResponse.json(
          {
            error:
              "No Justdy learner account was found for that email.",
          },
          { status: 404 },
        );
      }

      if (child.id === userId) {
        return NextResponse.json(
          {
            error:
              "You cannot add your own account as a child.",
          },
          { status: 400 },
        );
      }

      if (child.status !== "Active") {
        return NextResponse.json(
          {
            error:
              "That learner account is not active.",
          },
          { status: 409 },
        );
      }

      if (!child.emailVerified) {
        return NextResponse.json(
          {
            error:
              "The learner must verify their Justdy email before being added.",
          },
          { status: 409 },
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.familyMember.upsert({
          where: {
            familyId_userId: {
              familyId,
              userId: child.id,
            },
          },
          update: {
            role: "CHILD",
          },
          create: {
            familyId,
            userId: child.id,
            role: "CHILD",
          },
        });

        await tx.user.update({
          where: {
            id: child.id,
          },
          data: {
            canLearn: true,
          },
        });

        await tx.studentProfile.upsert({
          where: {
            userId: child.id,
          },
          update: {},
          create: {
            userId: child.id,
          },
        });
      });

      await ensureCapabilities(child.id, [
        CAPABILITIES.LEARN,
        CAPABILITIES.BOOK_TUTORING,
      ]);

      return NextResponse.json({
        success: true,
        child: {
          id: child.id,
          name: child.name,
          email: child.email,
        },
      });
    }

    return NextResponse.json(
      {
        error: "Unsupported family action.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("POST /api/family error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update family.",
      },
      { status: 500 },
    );
  }
}