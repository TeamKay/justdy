// app/api/educator/availability/route.ts

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";


async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

async function authorize() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  const isAdmin = String(user.role ?? "").toLowerCase() === "admin";
  const canTeach = await hasCapability(user.id, CAPABILITIES.TEACH);

  if (!isAdmin && !canTeach) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Teacher workspace access is required." },
        { status: 403 },
      ),
    };
  }

  return { user, response: null };
}

export async function GET() {
  try {
    const { user, response } = await authorize();

    if (response || !user) {
      return response;
    }

    const [availability, recurringRules] = await Promise.all([
      prisma.availability.findMany({
        where: {
          educatorId: user.id,
          recurringRuleId: null,
          startTime: {
            gte: new Date(),
          },
        },
        orderBy: {
          startTime: "asc",
        },
        take: 200,
      }),
      prisma.recurringAvailability.findMany({
        where: {
          educatorId: user.id,
          active: true,
        },
        orderBy: [
          { dayOfWeek: "asc" },
          { startTime: "asc" },
        ],
      }),
    ]);

    return NextResponse.json({
      availability,
      recurringRules,
    });
  } catch (error) {
    console.error("Get availability error:", error);

    return NextResponse.json(
      { error: "Unable to load availability." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { user, response } = await authorize();

    if (response || !user) {
      return response;
    }

    const body = await req.json();

    const daysOfWeek: number[] = Array.isArray(body.daysOfWeek)
      ? Array.from(
          new Set(
            body.daysOfWeek
              .map((value: unknown) => Number(value))
              .filter(
                (day: number) =>
                  Number.isInteger(day) && day >= 0 && day <= 6,
              ),
          ),
        )
      : [];

    const startTime =
      typeof body.startTime === "string" ? body.startTime : "";
    const endTime =
      typeof body.endTime === "string" ? body.endTime : "";

    const timeZone =
      typeof body.timeZone === "string" && body.timeZone.trim()
        ? body.timeZone.trim()
        : "UTC";

    if (daysOfWeek.length === 0) {
      return NextResponse.json(
        { error: "Select at least one day." },
        { status: 400 },
      );
    }

    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      return NextResponse.json(
        { error: "Invalid start or end time." },
        { status: 400 },
      );
    }

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;

    if (
      startHour > 23 ||
      endHour > 23 ||
      startMinute > 59 ||
      endMinute > 59 ||
      endTotal <= startTotal
    ) {
      return NextResponse.json(
        { error: "The end time must be after the start time." },
        { status: 400 },
      );
    }

    if (endTotal - startTotal < 15) {
      return NextResponse.json(
        { error: "Availability must be at least 15 minutes long." },
        { status: 400 },
      );
    }

    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone,
      }).format(new Date());
    } catch {
      return NextResponse.json(
        { error: "Invalid time zone." },
        { status: 400 },
      );
    }

    // Validate all selected days before creating anything so a conflict
    // cannot leave the educator with only part of the requested schedule.
    for (const dayOfWeek of daysOfWeek) {
      const overlappingRule =
        await prisma.recurringAvailability.findFirst({
          where: {
            educatorId: user.id,
            active: true,
            dayOfWeek: dayOfWeek,
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        });

      if (overlappingRule) {
        return NextResponse.json(
          {
            error: `The recurring availability overlaps an existing ${[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ][dayOfWeek]} schedule.`,
          },
          { status: 409 },
        );
      }
    }

    const createdRules = await prisma.$transaction(
      daysOfWeek.map((dayOfWeek: number) =>
        prisma.recurringAvailability.create({
          data: {
            educatorId: user.id,
            dayOfWeek,
            startTime,
            endTime,
            timeZone,
            active: true,
          },
        }),
      ),
    );

    // A recurring schedule is the source of truth.
    // Do NOT materialize future occurrences into Availability rows.
    // Example: Monday 06:00-22:00 creates ONE recurring rule.
    // Future Mondays are calculated dynamically when needed.
    return NextResponse.json(
      {
        success: true,
        recurringRules: createdRules,
        availability: [],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create recurring availability error:", error);

    return NextResponse.json(
      { error: "Unable to create recurring availability." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { user, response } = await authorize();

    if (response || !user) {
      return response;
    }

    const body = await req.json();

    if (body.ruleId) {
      const rule = await prisma.recurringAvailability.findFirst({
        where: {
          id: body.ruleId,
          educatorId: user.id,
          active: true,
        },
        select: {
          id: true,
        },
      });

      if (!rule) {
        return NextResponse.json(
          { error: "Recurring availability not found." },
          { status: 404 },
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.recurringAvailability.update({
          where: { id: rule.id },
          data: { active: false },
        });

        await tx.availability.deleteMany({
          where: {
            recurringRuleId: rule.id,
            status: "Available",
            startTime: { gte: new Date() },
          },
        });
      });

      return NextResponse.json({ success: true });
    }

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "Availability ID is required." },
        { status: 400 },
      );
    }

    const slot = await prisma.availability.findFirst({
      where: {
        id: body.id,
        educatorId: user.id,
      },
      select: {
        id: true,
        status: true,
        recurringRuleId: true,
        occurrenceDate: true,
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: "Availability slot not found." },
        { status: 404 },
      );
    }

    if (slot.status === "Booked") {
      return NextResponse.json(
        { error: "Booked availability cannot be deleted." },
        { status: 409 },
      );
    }

    if (slot.recurringRuleId && slot.occurrenceDate) {
      const rule = await prisma.recurringAvailability.findUnique({
        where: { id: slot.recurringRuleId },
        select: {
          id: true,
          excludedDates: true,
        },
      });

      if (rule) {
        await prisma.$transaction(async (tx) => {
          await tx.recurringAvailability.update({
            where: { id: rule.id },
            data: {
              excludedDates: Array.from(
                new Set([...rule.excludedDates, slot.occurrenceDate!]),
              ),
            },
          });

          await tx.availability.delete({
            where: { id: slot.id },
          });
        });

        return NextResponse.json({ success: true });
      }
    }

    await prisma.availability.delete({
      where: { id: slot.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete availability error:", error);

    return NextResponse.json(
      { error: "Unable to remove availability." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { user, response } = await authorize();

    if (response || !user) {
      return response;
    }

    const body = await req.json();

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "Availability ID is required." },
        { status: 400 },
      );
    }

    const slot = await prisma.availability.findFirst({
      where: {
        id: body.id,
        educatorId: user.id,
      },
      select: {
        id: true,
        status: true,
        recurringRuleId: true,
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: "Availability slot not found." },
        { status: 404 },
      );
    }

    if (body.status) {
      if (!["Available", "Blocked"].includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid availability status." },
          { status: 400 },
        );
      }

      if (slot.status === "Booked") {
        return NextResponse.json(
          { error: "Booked availability cannot be changed." },
          { status: 409 },
        );
      }

      const availability = await prisma.availability.update({
        where: { id: slot.id },
        data: { status: body.status },
      });

      return NextResponse.json({
        success: true,
        availability,
      });
    }

    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid start or end time." },
        { status: 400 },
      );
    }

    if (startTime <= new Date()) {
      return NextResponse.json(
        { error: "Availability must be scheduled for a future time." },
        { status: 400 },
      );
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: "The end time must be after the start time." },
        { status: 400 },
      );
    }

    const overlapping = await prisma.availability.findFirst({
      where: {
        educatorId: user.id,
        id: { not: slot.id },
        status: { in: ["Available", "Booked"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "This time overlaps with an existing availability slot." },
        { status: 409 },
      );
    }

    // Editing a generated occurrence affects only that occurrence.
    // The recurring rule remains unchanged.
    const availability = await prisma.availability.update({
      where: { id: slot.id },
      data: {
        startTime,
        endTime,
        recurringRuleId: slot.recurringRuleId,
        status: "Available",
      },
    });

    return NextResponse.json({
      success: true,
      availability,
    });
  } catch (error) {
    console.error("Update availability error:", error);

    return NextResponse.json(
      { error: "Unable to update availability." },
      { status: 500 },
    );
  }
}
