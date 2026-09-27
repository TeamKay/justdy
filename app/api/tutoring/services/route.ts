import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";
import { getVerifiedTutor } from "@/lib/tutoring/authorization";

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

async function canManageEducatorWorkspace(user: { id: string; role?: string | null }) {
  if (user.role === "ADMIN") return true;

  return hasCapability(user.id, CAPABILITIES.TEACH);
}

function parseOptionalDuration(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const duration = Number(value);

  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error("Duration must be a positive whole number.");
  }

  if (duration > 1440) {
    throw new Error("Duration cannot exceed 1440 minutes.");
  }

  return duration;
}

function parseOptionalPrice(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new Error("Price must be zero or greater.");
  }

  /*
   * Services store monetary values in the smallest currency unit.
   * For example:
   *
   * $25.00 -> 2500
   * GH₵100.00 -> 10000
   */
  return Math.round(numericValue * 100);
}

function parseStringArray(value: unknown): string[] | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Array.isArray(value)) {
    throw new Error("Expected an array of strings.");
  }

  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : null;
}

function parseCurrency(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "USD" as const;
  }

  if (value !== "USD" && value !== "GHS") {
    throw new Error("Currency must be USD or GHS.");
  }

  return value;
}

function parseStatus(value: unknown) {
  if (value !== "Draft" && value !== "Published" && value !== "Archived") {
    throw new Error("Status must be Draft, Published, or Archived.");
  }

  return value;
}

/**
 * GET
 *
 * Return all services belonging to the current educator/admin.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!(await canManageEducatorWorkspace(user))) {
      return NextResponse.json(
        { error: "Educator workspace access required." },
        { status: 403 },
      );
    }

    const services = await prisma.service.findMany({
      where: {
        providerId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      services,
    });
  } catch (error) {
    console.error("GET /api/educator/services error:", error);

    return NextResponse.json(
      {
        error: "Failed to load teaching services.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * POST
 *
 * Create a new teaching/tutoring service.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!(await canManageEducatorWorkspace(user))) {
      return NextResponse.json(
        { error: "Educator workspace access required." },
        { status: 403 },
      );
    }

    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";

    const description =
      typeof body.description === "string" ? body.description.trim() : null;

    const subject =
      typeof body.subject === "string" ? body.subject.trim() : null;

    if (!title) {
      return NextResponse.json(
        { error: "Service title is required." },
        { status: 400 },
      );
    }

    if (title.length > 120) {
      return NextResponse.json(
        {
          error: "Service title cannot exceed 120 characters.",
        },
        { status: 400 },
      );
    }

    if (description && description.length > 2000) {
      return NextResponse.json(
        {
          error: "Service description cannot exceed 2000 characters.",
        },
        { status: 400 },
      );
    }

    if (subject && subject.length > 120) {
      return NextResponse.json(
        {
          error: "Subject cannot exceed 120 characters.",
        },
        { status: 400 },
      );
    }

    let durationMinutes: number | null;
    let price: number | null;
    let gradeLevels: string[] | null;
    let currency: "USD" | "GHS";

    try {
      durationMinutes = parseOptionalDuration(body.durationMinutes);

      price = parseOptionalPrice(body.price);

      gradeLevels = parseStringArray(body.gradeLevels);

      currency = parseCurrency(body.currency);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid service data.",
        },
        { status: 400 },
      );
    }

    const service = await prisma.service.create({
      data: {
        providerId: user.id,
        title,
        description,
        type: "TUTORING",
        durationMinutes,
        price,
        currency,
        status: "Draft",
        subject,

        /*
         * Prisma JSON fields cannot receive JavaScript null
         * directly. Use Prisma.JsonNull when the field should
         * explicitly contain JSON null.
         */
        gradeLevels: gradeLevels !== null ? gradeLevels : Prisma.JsonNull,
      },
    });

    return NextResponse.json(
      {
        service,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("POST /api/educator/services error:", error);

    return NextResponse.json(
      {
        error: "Failed to create teaching service.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * PATCH
 *
 * Update a service owned by the current educator/admin.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!(await canManageEducatorWorkspace(user))) {
      return NextResponse.json(
        { error: "Educator workspace access required." },
        { status: 403 },
      );
    }

    const body = await request.json();

    const serviceId = typeof body.id === "string" ? body.id.trim() : "";

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service id is required." },
        { status: 400 },
      );
    }

    const existingService = await prisma.service.findFirst({
      where: {
        id: serviceId,
        providerId: user.id,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        {
          error: "Teaching service not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Use Prisma's generated update-input type here.
     *
     * This is important because gradeLevels is a Prisma JSON
     * field. A manually-created type such as
     * `string[] | null` is not compatible with Prisma's
     * NullableJsonNullValueInput.
     */
    const data: Prisma.ServiceUpdateInput = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string") {
        return NextResponse.json(
          {
            error: "Title must be a string.",
          },
          {
            status: 400,
          },
        );
      }

      const title = body.title.trim();

      if (!title) {
        return NextResponse.json(
          {
            error: "Service title cannot be empty.",
          },
          {
            status: 400,
          },
        );
      }

      if (title.length > 120) {
        return NextResponse.json(
          {
            error: "Service title cannot exceed 120 characters.",
          },
          {
            status: 400,
          },
        );
      }

      data.title = title;
    }

    if (body.description !== undefined) {
      if (body.description !== null && typeof body.description !== "string") {
        return NextResponse.json(
          {
            error: "Description must be a string.",
          },
          {
            status: 400,
          },
        );
      }

      const description =
        typeof body.description === "string" ? body.description.trim() : null;

      if (description && description.length > 2000) {
        return NextResponse.json(
          {
            error: "Service description cannot exceed 2000 characters.",
          },
          {
            status: 400,
          },
        );
      }

      data.description = description;
    }

    if (body.subject !== undefined) {
      if (body.subject !== null && typeof body.subject !== "string") {
        return NextResponse.json(
          {
            error: "Subject must be a string.",
          },
          {
            status: 400,
          },
        );
      }

      const subject =
        typeof body.subject === "string" ? body.subject.trim() : null;

      if (subject && subject.length > 120) {
        return NextResponse.json(
          {
            error: "Subject cannot exceed 120 characters.",
          },
          {
            status: 400,
          },
        );
      }

      data.subject = subject;
    }

    try {
      if (body.gradeLevels !== undefined) {
        const parsedGradeLevels = parseStringArray(body.gradeLevels);

        /*
         * Explicitly convert JavaScript null to Prisma.JsonNull.
         */
        data.gradeLevels =
          parsedGradeLevels !== null ? parsedGradeLevels : Prisma.JsonNull;
      }

      if (body.durationMinutes !== undefined) {
        data.durationMinutes = parseOptionalDuration(body.durationMinutes);
      }

      if (body.price !== undefined) {
        data.price = parseOptionalPrice(body.price);
      }

      if (body.currency !== undefined) {
        data.currency = parseCurrency(body.currency);
      }

      if (body.status !== undefined) {
        data.status = parseStatus(body.status);
      }
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid service data.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Do not perform an empty update.
     *
     * This protects against requests containing only an id.
     */
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          error: "At least one service field must be provided for update.",
        },
        {
          status: 400,
        },
      );
    }

    const nextStatus = data.status ?? existingService.status;

    if (nextStatus === "Published") {
      const tutor = await getVerifiedTutor(user.id);

      if (!tutor) {
        return NextResponse.json(
          { error: "Only verified tutors can publish tutoring services." },
          { status: 403 },
        );
      }

     const nextDuration =
  typeof data.durationMinutes === "number"
    ? data.durationMinutes
    : existingService.durationMinutes;
      const nextPrice =
  typeof data.price === "number"
    ? data.price
    : existingService.price;
      const nextSubject = data.subject ?? existingService.subject;
      const nextGradeLevels = data.gradeLevels ?? existingService.gradeLevels;

      if (nextDuration === null || nextDuration === undefined || nextDuration <= 0) {
        return NextResponse.json(
          { error: "A published tutoring service must have a duration." },
          { status: 400 },
        );
      }

      if (nextPrice === null || nextPrice === undefined || nextPrice < 0) {
        return NextResponse.json(
          { error: "A published tutoring service must have a price." },
          { status: 400 },
        );
      }

      if (typeof nextSubject !== "string" || !nextSubject.trim()) {
        return NextResponse.json(
          { error: "A published tutoring service must specify a subject." },
          { status: 400 },
        );
      }

      if (!Array.isArray(nextGradeLevels) || nextGradeLevels.length === 0) {
        return NextResponse.json(
          { error: "A published tutoring service must specify grade levels." },
          { status: 400 },
        );
      }
    }

    const service = await prisma.service.update({
      where: {
        id: existingService.id,
      },
      data,
    });

    return NextResponse.json({
      service,
    });
  } catch (error) {
    console.error("PATCH /api/educator/services error:", error);

    return NextResponse.json(
      {
        error: "Failed to update teaching service.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * DELETE
 *
 * Services are archived instead of physically deleted.
 * This preserves historical relationships and future booking records.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!(await canManageEducatorWorkspace(user))) {
      return NextResponse.json(
        { error: "Educator workspace access required." },
        { status: 403 },
      );
    }

    const body = await request.json();

    const serviceId = typeof body.id === "string" ? body.id.trim() : "";

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service id is required." },
        { status: 400 },
      );
    }

    const existingService = await prisma.service.findFirst({
      where: {
        id: serviceId,
        providerId: user.id,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        {
          error: "Teaching service not found.",
        },
        {
          status: 404,
        },
      );
    }

    const service = await prisma.service.update({
      where: {
        id: existingService.id,
      },
      data: {
        status: "Archived",
      },
    });

    return NextResponse.json({
      service,
    });
  } catch (error) {
    console.error("DELETE /api/educator/services error:", error);

    return NextResponse.json(
      {
        error: "Failed to archive teaching service.",
      },
      {
        status: 500,
      },
    );
  }
}
