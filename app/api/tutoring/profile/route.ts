import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";

type ProfileBody = {
  headline?: unknown;
  specialty?: unknown;
  experience?: unknown;
  description?: unknown;
  hourlyRate?: unknown;
  currency?: unknown;
  subjects?: unknown;
  gradeLevels?: unknown;
};

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

async function canManageTeachingProfile(user: { id: string; role?: string | null }) {
  if (String(user.role ?? "").toLowerCase() === "admin") return true;
  return hasCapability(user.id, CAPABILITIES.TEACH);
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseExperience(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.floor(parsed);
}

function parseHourlyRateInCents(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed);
}

function parseCurrency(value: unknown): "USD" | "GHS" {
  return value === "GHS" ? "GHS" : "USD";
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    if (!(await canManageTeachingProfile(user))) {
      return NextResponse.json(
        { error: "Educator access is required." },
        { status: 403 },
      );
    }

    const profile = await prisma.teachingProfile.findUnique({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      profile,
    });
  } catch (error) {
    console.error("Get educator profile error:", error);

    return NextResponse.json(
      { error: "Unable to load educator profile." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    if (!(await canManageTeachingProfile(user))) {
      return NextResponse.json(
        { error: "Educator access is required." },
        { status: 403 },
      );
    }

    const existingProfile = await prisma.teachingProfile.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (existingProfile) {
      return NextResponse.json(
        {
          error:
            "An educator profile already exists. Use PATCH to update your profile.",
        },
        { status: 409 },
      );
    }

    const body = (await req.json()) as ProfileBody;

    const experience = parseExperience(body.experience);
    const hourlyRate = parseHourlyRateInCents(body.hourlyRate);

    if (
      body.experience !== undefined &&
      body.experience !== null &&
      body.experience !== "" &&
      experience === null
    ) {
      return NextResponse.json(
        { error: "Years of experience must be a valid non-negative number." },
        { status: 400 },
      );
    }

    if (
      body.hourlyRate !== undefined &&
      body.hourlyRate !== null &&
      body.hourlyRate !== "" &&
      hourlyRate === null
    ) {
      return NextResponse.json(
        { error: "Hourly rate must be a valid non-negative amount." },
        { status: 400 },
      );
    }

    const profile = await prisma.teachingProfile.create({
      data: {
        userId: user.id,
        headline: cleanString(body.headline),
        specialty: cleanString(body.specialty),
        experience,
        description: cleanString(body.description),
        hourlyRate,
        currency: parseCurrency(body.currency),
        subjects: cleanStringArray(body.subjects),
        gradeLevels: cleanStringArray(body.gradeLevels),
        verificationStatus: "Pending",
      },
    });

    return NextResponse.json(
      {
        success: true,
        profile,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create educator profile error:", error);

    return NextResponse.json(
      { error: "Unable to create educator profile." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    if (!(await canManageTeachingProfile(user))) {
      return NextResponse.json(
        { error: "Educator access is required." },
        { status: 403 },
      );
    }

    const profile = await prisma.teachingProfile.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          error: "Teaching profile not found. Create your profile first.",
        },
        { status: 404 },
      );
    }

    const body = (await req.json()) as ProfileBody;

    const data: {
      headline?: string | null;
      specialty?: string | null;
      experience?: number | null;
      description?: string | null;
      hourlyRate?: number | null;
      currency?: "USD" | "GHS";
      subjects?: string[];
      gradeLevels?: string[];
    } = {};

    if (body.headline !== undefined) {
      data.headline = cleanString(body.headline);
    }

    if (body.specialty !== undefined) {
      data.specialty = cleanString(body.specialty);
    }

    if (body.description !== undefined) {
      data.description = cleanString(body.description);
    }

    if (body.experience !== undefined) {
      if (
        body.experience === null ||
        body.experience === "" ||
        body.experience === undefined
      ) {
        data.experience = null;
      } else {
        const experience = parseExperience(body.experience);

        if (experience === null) {
          return NextResponse.json(
            {
              error: "Years of experience must be a valid non-negative number.",
            },
            { status: 400 },
          );
        }

        data.experience = experience;
      }
    }

    if (body.hourlyRate !== undefined) {
      if (body.hourlyRate === null || body.hourlyRate === "") {
        data.hourlyRate = null;
      } else {
        const hourlyRate = parseHourlyRateInCents(body.hourlyRate);

        if (hourlyRate === null) {
          return NextResponse.json(
            {
              error: "Hourly rate must be a valid non-negative amount.",
            },
            { status: 400 },
          );
        }

        data.hourlyRate = hourlyRate;
      }
    }

    if (body.currency !== undefined) {
      data.currency = parseCurrency(body.currency);
    }

    if (body.subjects !== undefined) {
      data.subjects = cleanStringArray(body.subjects);
    }

    if (body.gradeLevels !== undefined) {
      data.gradeLevels = cleanStringArray(body.gradeLevels);
    }

    const updatedProfile = await prisma.teachingProfile.update({
      where: {
        id: profile.id,
      },
      data,
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update educator profile error:", error);

    return NextResponse.json(
      { error: "Unable to update educator profile." },
      { status: 500 },
    );
  }
}
