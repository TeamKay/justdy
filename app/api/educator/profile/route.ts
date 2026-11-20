
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type ProfileBody = {
  headline?: unknown;
  specialty?: unknown;
  experience?: unknown;
  description?: unknown;
  hourlyRate?: unknown;
  currency?: unknown;
  subjects?: unknown;
  gradeLevels?: unknown;
  imageMediaId?: unknown;
};

type CurrentUser = {
  id: string;
  role: string;
  status: string;
};

class InvalidProfileImageError extends Error {
  constructor() {
    super("The uploaded profile image could not be verified.");
    this.name = "InvalidProfileImageError";
  }
}

async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  // Read the authoritative role and account status from the database.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    role: user.role,
    status: user.status,
  };
}

async function canManageTeachingProfile(
  user: CurrentUser,
): Promise<boolean> {
  return (
    user.status === "Active" &&
    (user.role === "TUTOR" || user.role === "ADMIN")
  );
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
    .filter(Boolean)
    .slice(0, 50);
}

function parseExperience(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.min(80, Math.floor(parsed));
}

/*
 * TeachingProfile.hourlyRate is stored in cents.
 */
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

function parseImageMediaId(value: unknown): string | null {
  if (value === undefined) {
    return null;
  }

  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > 128
  ) {
    throw new InvalidProfileImageError();
  }

  return value.trim();
}

function validateImageMediaId(value: unknown): void {
  if (value === undefined) {
    return;
  }

  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > 128
  ) {
    throw new InvalidProfileImageError();
  }
}

function invalidImageResponse() {
  return NextResponse.json(
    {
      error: "The uploaded profile image could not be verified.",
    },
    { status: 400 },
  );
}

/*
 * ============================================================
 * GET
 * ============================================================
 *
 * Any authenticated user can read their own teaching profile.
 * Viewing an existing profile does not grant teaching access.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const profile = await prisma.teachingProfile.findUnique({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      user: {
        role: user.role,
        status: user.status,
      },
      profile,
    });
  } catch (error) {
    console.error("Get teaching profile error:", error);

    return NextResponse.json(
      { error: "Unable to load teaching profile." },
      { status: 500 },
    );
  }
}

/*
 * ============================================================
 * POST
 * ============================================================
 *
 * TUTOR and ADMIN accounts may create their own teaching profile,
 * including while it is awaiting administrator approval.
 * This does not grant permission to teach.
 */
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
        {
          error:
            "An active tutor or administrator account is required to create a teaching profile.",
        },
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
            "A teaching profile already exists. Use PATCH to update your profile.",
        },
        { status: 409 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as ProfileBody;

    validateImageMediaId(body.imageMediaId);

    const imageMediaId = parseImageMediaId(body.imageMediaId);

    const experience = parseExperience(body.experience);
    const hourlyRate = parseHourlyRateInCents(body.hourlyRate);

    if (
      body.experience !== undefined &&
      body.experience !== null &&
      body.experience !== "" &&
      experience === null
    ) {
      return NextResponse.json(
        {
          error:
            "Years of experience must be a valid non-negative number.",
        },
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
        {
          error: "Hourly rate must be a valid non-negative amount.",
        },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let imageUrl: string | undefined;

      if (imageMediaId) {
        const media = await tx.uploadedMedia.findFirst({
          where: {
            id: imageMediaId,
            uploaderId: user.id,
            purpose: "PROFILE_IMAGE",
            type: "IMAGE",
            status: "UPLOADED",
          },
          select: {
            id: true,
          },
        });

        if (!media) {
          throw new InvalidProfileImageError();
        }

        imageUrl = `/api/storage/profile-image/${user.id}`;

        await tx.uploadedMedia.update({
          where: {
            id: media.id,
          },
          data: {
            status: "ATTACHED",
          },
        });

        await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            imageUrl,
          },
        });
      }

      const profile = await tx.teachingProfile.create({
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

      return {
        profile,
        imageUrl,
      };
    });

    return NextResponse.json(
      {
        success: true,
        profile: result.profile,
        imageUrl: result.imageUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof InvalidProfileImageError) {
      return invalidImageResponse();
    }

    console.error("Create teaching profile error:", error);

    return NextResponse.json(
      { error: "Unable to create teaching profile." },
      { status: 500 },
    );
  }
}

/*
 * ============================================================
 * PATCH
 * ============================================================
 *
 * Active and pending TUTOR/ADMIN accounts may update their own
 * teaching profile. Teaching access remains separately controlled
 * by the verified-profile authorization checks.
 */
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
        {
          error:
            "An active tutor or administrator account is required to update a teaching profile.",
        },
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
          error:
            "Teaching profile not found. Submit a tutor application first.",
        },
        { status: 404 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as ProfileBody;

    validateImageMediaId(body.imageMediaId);

    const imageMediaId = parseImageMediaId(body.imageMediaId);

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
      if (body.experience === null || body.experience === "") {
        data.experience = null;
      } else {
        const experience = parseExperience(body.experience);

        if (experience === null) {
          return NextResponse.json(
            {
              error:
                "Years of experience must be a valid non-negative number.",
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

    const result = await prisma.$transaction(async (tx) => {
      let imageUrl: string | undefined;

      if (imageMediaId) {
        const media = await tx.uploadedMedia.findFirst({
          where: {
            id: imageMediaId,
            uploaderId: user.id,
            purpose: "PROFILE_IMAGE",
            type: "IMAGE",
            status: "UPLOADED",
          },
          select: {
            id: true,
          },
        });

        if (!media) {
          throw new InvalidProfileImageError();
        }

        imageUrl = `/api/storage/profile-image/${user.id}`;

        await tx.uploadedMedia.update({
          where: {
            id: media.id,
          },
          data: {
            status: "ATTACHED",
          },
        });

        await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            imageUrl,
          },
        });
      }

      const updatedProfile = await tx.teachingProfile.update({
        where: {
          id: profile.id,
        },
        data,
      });

      return {
        profile: updatedProfile,
        imageUrl,
      };
    });

    return NextResponse.json({
      success: true,
      profile: result.profile,
      imageUrl: result.imageUrl,
    });
  } catch (error) {
    if (error instanceof InvalidProfileImageError) {
      return invalidImageResponse();
    }

    console.error("Update teaching profile error:", error);

    return NextResponse.json(
      { error: "Unable to update teaching profile." },
      { status: 500 },
    );
  }
}
