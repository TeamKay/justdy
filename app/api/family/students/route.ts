import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { canLearn, canManageChildren } from "@/lib/auth/capabilities";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to view learners." },
        { status: 401 },
      );
    }

    const learnerAllowed = await canLearn(userId);
    if (!learnerAllowed) {
      return NextResponse.json(
        { error: "Your account is not authorized to book tutoring." },
        { status: 403 },
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        studentProfile: {
          select: { gradeLevel: true },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Your account could not be found." },
        { status: 404 },
      );
    }

    const learners: Array<{
      id: string;
      name: string;
      gradeLevel: string | null;
      relationship: "self" | "child";
    }> = [
      {
        id: currentUser.id,
        name: currentUser.name,
        gradeLevel: currentUser.studentProfile?.gradeLevel ?? null,
        relationship: "self" as const,
      },
    ];

    const managesChildren = await canManageChildren(userId);

    if (managesChildren) {
      const parentMemberships = await prisma.familyMember.findMany({
        where: {
          userId,
          role: { in: ["PARENT", "GUARDIAN"] },
        },
        select: { familyId: true },
      });

      const familyIds = parentMemberships.map((membership) => membership.familyId);

      if (familyIds.length > 0) {
        const childMemberships = await prisma.familyMember.findMany({
          where: {
            familyId: { in: familyIds },
            role: "CHILD",
            userId: { not: userId },
          },
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                studentProfile: {
                  select: { gradeLevel: true },
                },
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        });

        const seen = new Set<string>();
        for (const membership of childMemberships) {
          if (seen.has(membership.userId)) continue;
          seen.add(membership.userId);
          learners.push({
            id: membership.user.id,
            name: membership.user.name,
            gradeLevel: membership.user.studentProfile?.gradeLevel ?? null,
            relationship: "child",
          });
        }
      }
    }

    return NextResponse.json({ learners });
  } catch (error) {
    console.error("Unable to load family learners:", error);
    return NextResponse.json(
      { error: "Unable to load eligible learners." },
      { status: 500 },
    );
  }
}
