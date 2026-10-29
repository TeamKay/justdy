import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CAPABILITIES, ensureCapabilities } from "@/lib/auth/capabilities";

function cleanString(value: unknown, max = 2000) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed.slice(0, max) : undefined;
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const cleaned = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 50);

  return cleaned.length > 0 ? cleaned : undefined;
}

function cleanExperience(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return undefined;
  }

  return Math.max(0, Math.min(80, Math.trunc(number)));
}

function cleanHourlyRate(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return undefined;
  }

  // Store monetary values in the database
  // as the smallest currency unit.
  return Math.round(number * 100);
}

function cleanCredentialUrl(value: unknown) {
  const valueString = cleanString(value, 1000);

  if (!valueString) {
    return undefined;
  }

  try {
    const url = new URL(valueString);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "You must be signed in to apply to become a tutor.",
        },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        role: true,
        status: true,
        teachingProfile: {
          select: {
            id: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!user || user.status !== "Active") {
      return NextResponse.json(
        {
          error: "Your account is not currently eligible to apply.",
        },
        { status: 403 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const headline = cleanString(body.headline, 160);

    const specialty = cleanString(body.specialty, 160);

    const description = cleanString(body.description, 4000);

    const credentialUrl = cleanCredentialUrl(body.credentialUrl);

    const subjects = cleanStringArray(body.subjects);

    const gradeLevels = cleanStringArray(body.gradeLevels);

    const experience = cleanExperience(body.experience);

    const hourlyRate = cleanHourlyRate(body.hourlyRate);

    /*
     * Basic application requirements.
     *
     * We intentionally keep these requirements
     * reasonable because administrator review remains
     * the final approval step.
     */
    const missingFields: string[] = [];

    if (!headline) {
      missingFields.push("teaching headline");
    }

    if (!specialty) {
      missingFields.push("specialty");
    }

    if (!subjects?.length) {
      missingFields.push("at least one subject");
    }

    if (!gradeLevels?.length) {
      missingFields.push("at least one grade level");
    }

    if (!description) {
      missingFields.push("teaching description");
    }

    if (body.credentialUrl && !credentialUrl) {
      return NextResponse.json(
        {
          error: "Please provide a valid credential or portfolio URL.",
        },
        { status: 400 },
      );
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Please provide ${missingFields.join(", ")}.`,
        },
        { status: 400 },
      );
    }

    /*
     * User.role is only the platform-level account role:
     *
     * USER  = normal account
     * ADMIN = platform administrator
     *
     * Teaching access is NOT represented by a
     * User.role value.
     *
     * Teaching access is represented by:
     *
     * TeachingProfile.verificationStatus
     * +
     * CAN_TEACH / CAN_TUTOR capabilities.
     */
    const isAdmin = user.role === "ADMIN";

    const currentStatus = user.teachingProfile?.verificationStatus ?? null;

    /*
     * A verified tutor remains verified when
     * editing their teaching profile.
     *
     * A pending application remains pending.
     *
     * A rejected applicant may submit again,
     * which moves the application back to Pending.
     */
    const nextVerificationStatus = isAdmin
      ? "Verified"
      : currentStatus === "Verified"
        ? "Verified"
        : "Pending";

    const profile = await prisma.teachingProfile.upsert({
      where: {
        userId: user.id,
      },

      create: {
        userId: user.id,

        headline,
        specialty,
        description,
        credentialUrl,
        subjects,
        gradeLevels,
        experience,
        hourlyRate,

        verificationStatus: nextVerificationStatus,
      },

      update: {
        headline,
        specialty,
        description,
        credentialUrl,
        subjects,
        gradeLevels,
        experience,
        hourlyRate,

        verificationStatus: nextVerificationStatus,
      },

      select: {
        id: true,
        verificationStatus: true,
      },
    });

    /*
     * Every normal account remains a learner.
     *
     * Applying to teach NEVER changes User.role.
     *
     * Normal users only receive learner capability
     * here. Teaching/tutor/payout capabilities are
     * granted by the administrator approval flow.
     */
    await ensureCapabilities(user.id, [
      CAPABILITIES.LEARN,

      ...(isAdmin
        ? [CAPABILITIES.TEACH, CAPABILITIES.TUTOR, CAPABILITIES.RECEIVE_PAYOUTS]
        : []),
    ]);

    const message = isAdmin
      ? "Your teaching profile is active."
      : profile.verificationStatus === "Verified"
        ? "Your teaching profile has been updated."
        : "Your tutor application has been submitted for administrator review.";

    return NextResponse.json(
      {
        success: true,

        application: {
          teachingProfileId: profile.id,

          status: profile.verificationStatus,

          message,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Tutor application error:", error);

    return NextResponse.json(
      {
        error: "Unable to submit your tutor application.",
      },
      { status: 500 },
    );
  }
}
