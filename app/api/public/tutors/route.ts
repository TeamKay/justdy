import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

/**
 * Public directory of verified, active tutors.
 * Profile photos are already stored as permanent UploadThing URLs in User.imageUrl.
 * Only public teaching-profile fields are returned; private account and credential
 * information is intentionally excluded.
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ["TUTOR", "ADMIN"] },
        status: "Active",
        verificationStatus: "Verified",
        teachingProfile: {
          is: { verificationStatus: "Verified" },
        },
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        teachingProfile: {
          select: {
            headline: true,
            specialty: true,
            experience: true,
            description: true,
            hourlyRate: true,
            currency: true,
            subjects: true,
            gradeLevels: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const tutors = users.flatMap((user) => {
      const profile = user.teachingProfile;
      if (!profile) return [];

      return [{
        id: user.id,
        name: user.name,
        // This is the exact UploadThing URL saved on User.imageUrl.
        imageUrl: user.imageUrl,
        teachingProfile: {
          headline: profile.headline,
          specialty: profile.specialty,
          experience: profile.experience,
          description: profile.description,
          hourlyRate: profile.hourlyRate,
          currency: profile.currency,
          subjects: jsonStringArray(profile.subjects),
          gradeLevels: jsonStringArray(profile.gradeLevels),
        },
      }];
    });

    return NextResponse.json(
      { tutors },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/public/tutors error:", error);
    return NextResponse.json(
      { error: "Unable to load verified tutors." },
      { status: 500 },
    );
  }
}
