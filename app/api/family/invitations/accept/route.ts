import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canLearn } from "@/lib/auth/capabilities";
import { verifyFamilyInvitationToken } from "@/lib/family/invitation";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json({ error: "You must be signed in to accept this invitation." }, { status: 401 });
    }

    if (!(await canLearn(user.id))) {
      return NextResponse.json({ error: "Your account is not authorized as a learner." }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
    const token = typeof body?.token === "string" ? body.token : "";
    const invitation = verifyFamilyInvitationToken(token);

    if (!invitation) {
      return NextResponse.json({ error: "This family invitation is invalid or expired." }, { status: 400 });
    }

    const normalizedUserEmail = user.email.trim().toLowerCase();
    if (normalizedUserEmail !== invitation.childEmail) {
      return NextResponse.json(
        { error: "Sign in with the learner account that received this invitation." },
        { status: 403 },
      );
    }

    const family = await prisma.family.findUnique({
      where: { id: invitation.familyId },
      select: { id: true, name: true },
    });

    if (!family) {
      return NextResponse.json({ error: "The family no longer exists." }, { status: 404 });
    }

    const inviterMembership = await prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: invitation.familyId,
          userId: invitation.inviterId,
        },
      },
      select: { role: true },
    });

    if (!inviterMembership || (inviterMembership.role !== "PARENT" && inviterMembership.role !== "GUARDIAN")) {
      return NextResponse.json({ error: "The invitation is no longer authorized." }, { status: 403 });
    }

    const membership = await prisma.$transaction(async (tx) => {
      const existing = await tx.familyMember.findUnique({
        where: {
          familyId_userId: {
            familyId: invitation.familyId,
            userId: user.id,
          },
        },
        select: { role: true },
      });

      if (existing && existing.role !== "CHILD") {
        throw new Error("ALREADY_FAMILY_MANAGER");
      }

      await tx.familyMember.upsert({
        where: {
          familyId_userId: {
            familyId: invitation.familyId,
            userId: user.id,
          },
        },
        update: { role: "CHILD" },
        create: {
          familyId: invitation.familyId,
          userId: user.id,
          role: "CHILD",
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { role: "Learner", canLearn: true },
      });

      await tx.studentProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });

      return { familyId: invitation.familyId };
    });

    return NextResponse.json({
      success: true,
      familyId: membership.familyId,
      familyName: family.name,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_FAMILY_MANAGER") {
      return NextResponse.json(
        { error: "This account already manages this family and cannot accept the invitation as a child." },
        { status: 409 },
      );
    }

    console.error("POST /api/family/invitations/accept error:", error);
    return NextResponse.json({ error: "Unable to accept this family invitation." }, { status: 500 });
  }
}
