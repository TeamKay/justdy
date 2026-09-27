import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const role = String(session.user.role ?? "").trim().toUpperCase();

  if (role !== "ADMIN") {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  }

  try {
    const profiles = await prisma.teachingProfile.findMany({
      where: {
        verificationStatus: "Pending",
        user: {
          status: {
            not: "Deleted",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        userId: true,
        headline: true,
        specialty: true,
        experience: true,
        description: true,
        hourlyRate: true,
        currency: true,
        verificationStatus: true,
        subjects: true,
        gradeLevels: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            status: true,
            role: true,
            canTeach: true,
            canTutor: true,
          },
        },
      },
    });

    return NextResponse.json({
      applications: profiles.map((profile) => ({
        id: profile.id,
        userId: profile.userId,
        name: profile.user.name,
        email: profile.user.email,
        imageUrl: profile.user.imageUrl,
        role: profile.user.role,
        accountStatus: profile.user.status,
        headline: profile.headline,
        specialty: profile.specialty,
        experience: profile.experience,
        description: profile.description,
        hourlyRate: profile.hourlyRate,
        currency: profile.currency,
        verificationStatus: profile.verificationStatus,
        subjects: profile.subjects,
        gradeLevels: profile.gradeLevels,
        canTeach: profile.user.canTeach,
        canTutor: profile.user.canTutor,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      })),
      count: profiles.length,
    });
  } catch (error) {
    console.error("Admin teaching applications error:", error);

    return NextResponse.json(
      {
        error: "Unable to load teaching applications.",
      },
      { status: 500 },
    );
  }
}
