import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { CAPABILITIES, ensureCapabilities } from "@/lib/auth/capabilities";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to apply as an educator." },
        { status: 401 },
      );
    }

    const body = await req.json();

    const {
      headline,
      specialty,
      experience,
      description,
      hourlyRate,
      currency,
      subjects,
      gradeLevels,
    } = body;

    const existingProfile = await prisma.teachingProfile.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (existingProfile) {
      return NextResponse.json(
        {
          error: "You already have a teaching profile.",
          profile: existingProfile,
        },
        { status: 409 },
      );
    }

    const parsedExperience =
      experience === null || experience === undefined || experience === ""
        ? null
        : Number(experience);

    const parsedHourlyRate =
      hourlyRate === null || hourlyRate === undefined || hourlyRate === ""
        ? null
        : Number(hourlyRate);

    if (
      parsedExperience !== null &&
      (!Number.isFinite(parsedExperience) || parsedExperience < 0)
    ) {
      return NextResponse.json(
        { error: "Experience must be a valid positive number." },
        { status: 400 },
      );
    }

    if (
      parsedHourlyRate !== null &&
      (!Number.isFinite(parsedHourlyRate) || parsedHourlyRate < 0)
    ) {
      return NextResponse.json(
        { error: "Hourly rate must be a valid positive amount." },
        { status: 400 },
      );
    }

    const parsedSubjects =
      Array.isArray(subjects) && subjects.length > 0 ? subjects : null;

    const parsedGradeLevels =
      Array.isArray(gradeLevels) && gradeLevels.length > 0 ? gradeLevels : null;

    const profile = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          canTeach: true,
        },
      });

      const teachingProfile = await tx.teachingProfile.create({
        data: {
          userId: updatedUser.id,

          headline:
            typeof headline === "string" && headline.trim()
              ? headline.trim()
              : null,

          specialty:
            typeof specialty === "string" && specialty.trim()
              ? specialty.trim()
              : null,

          experience: parsedExperience,

          description:
            typeof description === "string" && description.trim()
              ? description.trim()
              : null,

          hourlyRate: parsedHourlyRate,

          currency:
            typeof currency === "string" && currency.trim()
              ? (currency.trim() as "USD" | "GHS")
              : "USD",

          /*
           * Prisma JSON fields require Prisma.JsonNull rather than
           * JavaScript null when explicitly storing JSON null.
           */
          subjects: parsedSubjects !== null ? parsedSubjects : Prisma.JsonNull,

          gradeLevels:
            parsedGradeLevels !== null ? parsedGradeLevels : Prisma.JsonNull,

          verificationStatus: "Pending",
        },
      });

      return teachingProfile;
    });

    await ensureCapabilities(session.user.id, [CAPABILITIES.TEACH]);

    return NextResponse.json(
      {
        success: true,
        message: "Your teaching profile has been submitted for verification.",
        profile,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Educator application error:", error);

    return NextResponse.json(
      {
        error: "Unable to submit educator application.",
      },
      { status: 500 },
    );
  }
}
