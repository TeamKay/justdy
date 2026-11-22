
import { NextRequest, NextResponse } from "next/server";

import arcjet, { slidingWindow } from "@/lib/arcjet";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const applicationRateLimit = arcjet.withRule(
  slidingWindow({
    mode: "LIVE",
    interval: "2m",
    max: 5,
  }),
);

type ApplicationPayload = {
  name?: unknown;
  email?: unknown;
  phoneNumber?: unknown;
  headline?: unknown;
  specialty?: unknown;
  experience?: unknown;
  credentialUrl?: unknown;
  description?: unknown;
  hourlyRate?: unknown;
  currency?: unknown;
  subjects?: unknown;
  gradeLevels?: unknown;
};

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ].slice(0, 50);
}

function parseExperience(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 0 ||
    parsed > 80
  ) {
    return null;
  }

  return parsed;
}

function parseHourlyRate(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1000000) {
    return null;
  }

  return Math.round(parsed * 100);
}

function parseCredentialUrl(value: unknown): string | null {
  const raw = cleanString(value, 1000);

  if (!raw) return null;

  try {
    const url = new URL(raw);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest) {
  try {
    // Protect the public application endpoint against repeated submissions.
    const fingerprint =
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "tutor-application-unknown";

    const decision = await applicationRateLimit.protect(request, {
      fingerprint,
    });

    if (decision.isDenied()) {
      return errorResponse(
        "Too many attempts. Please try again later.",
        429,
      );
    }

    const body = (await request.json().catch(() => null)) as
      | ApplicationPayload
      | null;

    if (!body || typeof body !== "object") {
      return errorResponse("Invalid application information.", 400);
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    let userId: string | null = null;
    let name = cleanString(body.name, 120);
    let email = cleanString(body.email, 254).toLowerCase();

    if (session?.user?.id) {
      // Use the database account as the source of truth.
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          teachingProfile: {
            select: { id: true },
          },
        },
      });

      if (!user || user.status !== "Active") {
        return errorResponse(
          "Your account is not currently eligible to apply.",
          403,
        );
      }

      if (user.role === "TUTOR" || user.teachingProfile) {
        return errorResponse(
          "You already have a teaching profile. Please manage your existing profile instead.",
          409,
        );
      }

      if (user.role !== "LEARNER") {
        return errorResponse(
          "This account is not eligible to submit a tutor application.",
          403,
        );
      }

      if (
        email &&
        email !== user.email.trim().toLowerCase()
      ) {
        return errorResponse(
          "Please use the email address associated with your Justdy account.",
          400,
        );
      }

      userId = user.id;
      name = user.name.trim();
      email = user.email.trim().toLowerCase();
    } else {
      if (!name) {
        return errorResponse("Please enter your full name.", 400);
      }

      // Do not allow guests to claim an existing account's email.
      const existingUser = await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (existingUser) {
        return errorResponse(
          "An account already uses this email. Please sign in before submitting your application.",
          409,
        );
      }
    }

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return errorResponse("Please provide a valid email address.", 400);
    }

    const phoneNumber = cleanString(body.phoneNumber, 40) || null;
    const headline = cleanString(body.headline, 160);
    const specialty = cleanString(body.specialty, 160);
    const description = cleanString(body.description, 4000);
    const credentialUrl = parseCredentialUrl(body.credentialUrl);
    const subjects = cleanStringArray(body.subjects);
    const gradeLevels = cleanStringArray(body.gradeLevels);

    const experience = parseExperience(body.experience);
    const hourlyRate = parseHourlyRate(body.hourlyRate);

    if (body.experience !== undefined &&
        body.experience !== null &&
        body.experience !== "" &&
        experience === null) {
      return errorResponse(
        "Please provide a valid number of teaching experience years.",
        400,
      );
    }

    if (body.hourlyRate !== undefined &&
        body.hourlyRate !== null &&
        body.hourlyRate !== "" &&
        hourlyRate === null) {
      return errorResponse("Please provide a valid hourly rate.", 400);
    }

    if (body.credentialUrl && !credentialUrl) {
      return errorResponse(
        "Please provide a valid credential or portfolio URL.",
        400,
      );
    }

    const missingFields: string[] = [];

    if (!headline) missingFields.push("a teaching headline");
    if (!specialty) missingFields.push("a teaching specialty");
    if (!subjects.length) missingFields.push("at least one subject");
    if (!gradeLevels.length) missingFields.push("at least one grade level");
    if (!description) missingFields.push("a teaching description");

    if (missingFields.length) {
      return errorResponse(
        `Please provide ${missingFields.join(", ")}.`,
        400,
      );
    }

   const currency: "USD" | "GHS" =
  body.currency === "GHS" ? "GHS" : "USD";

    const existingApplication = await prisma.tutorApplication.findFirst({
      where: userId
        ? {
            OR: [
              { userId },
              { email: { equals: email, mode: "insensitive" } },
            ],
          }
        : {
            email: { equals: email, mode: "insensitive" },
          },
    });

    if (
      existingApplication?.userId &&
      existingApplication.userId !== userId
    ) {
      return errorResponse(
        "This application is already associated with another account. Please contact Justdy support.",
        409,
      );
    }

    if (
      existingApplication &&
      existingApplication.status !== "Rejected"
    ) {
      return errorResponse(
        existingApplication.status === "Approved"
          ? "Your tutor application has already been approved."
          : "You already have an application awaiting review.",
        409,
      );
    }

    const applicationData = {
      userId,
      name,
      email,
      phoneNumber,
      headline,
      specialty,
      experience,
      credentialUrl,
      description,
      hourlyRate,
      currency,
      subjects,
      gradeLevels,
      status: "Pending" as const,
      reviewedAt: null,
      reviewedById: null,
    };

    const application = existingApplication
      ? await prisma.tutorApplication.update({
          where: { id: existingApplication.id },
          data: applicationData,
        })
      : await prisma.tutorApplication.create({
          data: applicationData,
        });

    return NextResponse.json(
      {
        success: true,
        application: {
          id: application.id,
          status: application.status,
          message:
            "Your application has been submitted successfully. Our team will review it and contact you by email.",
        },
      },
      { status: existingApplication ? 200 : 201 },
    );
  } catch (error) {
    // Handle concurrent duplicate submissions safely.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return errorResponse(
        "An application already exists for this email or account.",
        409,
      );
    }

    console.error("Tutor application submission error:", error);

    return errorResponse(
      "Unable to submit your application. Please try again.",
      500,
    );
  }
}
