import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";
import prisma from "@/lib/prisma";
import { materializeRecurringAvailability } from "@/lib/tutoring/recurring-availability";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type DateParts = {
  year: number;
  month: number;
  day: number;
};

type AvailabilityWithDates = {
  id: string;
  educatorId: string;
  type: "ONE_OFF" | "RECURRING" | "OCCURRENCE";
  startTime: Date | null;
  endTime: Date | null;
  dayOfWeek: number | null;
  weeklyStartTime: string | null;
  weeklyEndTime: string | null;
  timeZone: string;
  active: boolean;
  isAlwaysAvailable: boolean;
  excludedDates: string[];
  recurrenceKey: string | null;
  occurrenceDate: string | null;
  status: "Available" | "Booked" | "Blocked";
  createdAt: Date;
  updatedAt: Date;
};

async function authorize() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  const isAdmin = String(user.role ?? "").trim().toUpperCase() === "ADMIN";
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

function parseTime(value: unknown) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hour, minute] = value.split(":").map(Number);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return {
    value,
    total: hour * 60 + minute,
  };
}

function parseDays(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter(
          (day) => Number.isInteger(day) && day >= 0 && day <= 6,
        ),
    ),
  ).sort((a, b) => a - b);
}

function validTimeZone(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "UTC";

  const timeZone = value.trim();

  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return null;
  }
}

function getDatePartsInTimeZone(
  date: Date,
  timeZone: string,
): DateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

function addDays(
  year: number,
  month: number,
  day: number,
  amount: number,
): DateParts {
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

/**
 * Converts a local wall-clock date/time in an IANA timezone to UTC.
 *
 * This is used for 24/7 because a "day" means the educator's local
 * calendar day, not a fixed 24-hour UTC interval. Around DST changes,
 * the UTC duration can therefore be 23 or 25 hours while still
 * representing one complete local calendar day.
 */
function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
) {
  let guess = new Date(
    Date.UTC(year, month - 1, day, hour, minute, 0, 0),
  );

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(guess);

    const map = Object.fromEntries(
      parts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );

    const actualLocal = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour),
      Number(map.minute),
    );

    const desiredLocal = Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
    );

    const difference = desiredLocal - actualLocal;

    if (Math.abs(difference) < 1000) {
      return guess;
    }

    guess = new Date(guess.getTime() + difference);
  }

  return guess;
}

/**
 * Creates exactly seven concrete 24/7 availability rows.
 *
 * There are deliberately NO RECURRING rows and NO OCCURRENCE rows for
 * 24/7 availability.
 */
async function createSeven24HourDays(
  educatorId: string,
  timeZone: string,
) {
  const now = new Date();
  const localToday = getDatePartsInTimeZone(now, timeZone);

  const created = await prisma.$transaction(async (tx) => {
    const rows: Array<AvailabilityWithDates> = [];

    // Start tomorrow so every generated row is a future, complete
    // local calendar day. The seven rows are tomorrow through +7 days.
    for (let offset = 1; offset <= 7; offset += 1) {
      const startDate = addDays(
        localToday.year,
        localToday.month,
        localToday.day,
        offset,
      );
      const endDate = addDays(
        startDate.year,
        startDate.month,
        startDate.day,
        1,
      );

      const startTime = zonedDateTimeToUtc(
        startDate.year,
        startDate.month,
        startDate.day,
        0,
        0,
        timeZone,
      );

      const endTime = zonedDateTimeToUtc(
        endDate.year,
        endDate.month,
        endDate.day,
        0,
        0,
        timeZone,
      );

      const dayOfWeek = new Date(
        Date.UTC(
          startDate.year,
          startDate.month - 1,
          startDate.day,
        ),
      ).getUTCDay();

      const row = await tx.availability.create({
        data: {
          educatorId,
          type: "ONE_OFF",
          startTime,
          endTime,
          dayOfWeek,
          weeklyStartTime: null,
          weeklyEndTime: null,
          timeZone,
          active: true,
          isAlwaysAvailable: true,
          excludedDates: [],
          recurrenceKey: null,
          occurrenceDate: null,
          status: "Available",
        },
      });

      rows.push(row as AvailabilityWithDates);
    }

    return rows;
  });

  return created;
}

async function removeLegacy24x7Availability(
  educatorId: string,
) {
  const now = new Date();

  // Delete generated 24/7 occurrences first. Booked rows are preserved.
  await prisma.availability.deleteMany({
    where: {
      educatorId,
      type: "OCCURRENCE",
      isAlwaysAvailable: true,
      status: "Available",
      startTime: { gte: now },
    },
  });

  // Delete concrete 24/7 rows from previous implementations. Booked rows
  // are intentionally preserved.
  await prisma.availability.deleteMany({
    where: {
      educatorId,
      type: "ONE_OFF",
      isAlwaysAvailable: true,
      status: "Available",
      startTime: { gte: now },
    },
  });

  // Delete any legacy recurring 24/7 rules and their future available
  // occurrences. This is the important guard against recreating 200+ rows.
  const legacyRules = await prisma.availability.findMany({
    where: {
      educatorId,
      type: "RECURRING",
      isAlwaysAvailable: true,
    },
    select: {
      id: true,
    },
  });

  if (legacyRules.length > 0) {
    const ruleIds = legacyRules.map((rule) => rule.id);

    await prisma.availability.deleteMany({
      where: {
        educatorId,
        type: "OCCURRENCE",
        recurrenceKey: { in: ruleIds },
        status: "Available",
        startTime: { gte: now },
      },
    });

    await prisma.availability.deleteMany({
      where: {
        educatorId,
        type: "RECURRING",
        isAlwaysAvailable: true,
      },
    });
  }
}

export async function GET() {
  try {
    const { user, response } = await authorize();
    if (response || !user) return response;

    // Normal weekly schedules may still materialize into OCCURRENCE rows.
    // The materializer explicitly ignores isAlwaysAvailable rows.
    await materializeRecurringAvailability(user.id);

    const now = new Date();

    const [availability, recurringRules] = await Promise.all([
      prisma.availability.findMany({
        where: {
          educatorId: user.id,
          type: { in: ["ONE_OFF", "OCCURRENCE"] },
          startTime: { gte: now },
        },
        orderBy: { startTime: "asc" },
        take: 200,
      }),
      prisma.availability.findMany({
        where: {
          educatorId: user.id,
          type: "RECURRING",
          active: true,
          // 24/7 is no longer a recurring schedule.
          isAlwaysAvailable: false,
        },
        orderBy: [
          { dayOfWeek: "asc" },
          { weeklyStartTime: "asc" },
        ],
      }),
    ]);

    return NextResponse.json({
      availability,
      recurringRules,
    });
  } catch (error) {
    console.error("Get educator availability error:", error);
    return NextResponse.json(
      { error: "Unable to load availability." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user, response } = await authorize();
    if (response || !user) return response;

    const body = (await request.json()) as {
      daysOfWeek?: unknown;
      startTime?: unknown;
      endTime?: unknown;
      timeZone?: unknown;
      isAlwaysAvailable?: unknown;
    };

    const isAlwaysAvailable = body.isAlwaysAvailable === true;
    const timeZone = validTimeZone(body.timeZone);

    if (!timeZone) {
      return NextResponse.json(
        { error: "Invalid time zone." },
        { status: 400 },
      );
    }

    /*
     * 24/7 is a concrete seven-day schedule, NOT a recurring rule.
     */
    if (isAlwaysAvailable) {
      await removeLegacy24x7Availability(user.id);

      const created = await createSeven24HourDays(
        user.id,
        timeZone,
      );

      return NextResponse.json(
        {
          success: true,
          mode: "SEVEN_DAY_24_HOUR",
          availability: created,
          recurringRules: [],
        },
        { status: 201 },
      );
    }

    const daysOfWeek = parseDays(body.daysOfWeek);

    if (daysOfWeek.length === 0) {
      return NextResponse.json(
        { error: "Select at least one day." },
        { status: 400 },
      );
    }

    const start = parseTime(body.startTime);
    const end = parseTime(body.endTime);

    if (!start || !end) {
      return NextResponse.json(
        { error: "Invalid start or end time." },
        { status: 400 },
      );
    }

    if (end.total <= start.total) {
      return NextResponse.json(
        { error: "The end time must be after the start time." },
        { status: 400 },
      );
    }

    if (end.total - start.total < 15) {
      return NextResponse.json(
        { error: "Availability must be at least 15 minutes long." },
        { status: 400 },
      );
    }

    for (const dayOfWeek of daysOfWeek) {
      const overlap = await prisma.availability.findFirst({
        where: {
          educatorId: user.id,
          type: "RECURRING",
          active: true,
          isAlwaysAvailable: false,
          dayOfWeek,
          weeklyStartTime: { lt: end.value },
          weeklyEndTime: { gt: start.value },
        },
        select: { id: true },
      });

      if (overlap) {
        return NextResponse.json(
          {
            error: `The recurring availability overlaps an existing ${DAYS[dayOfWeek]} schedule.`,
          },
          { status: 409 },
        );
      }
    }

    const createdRules = await prisma.$transaction(async (tx) => {
      const rules = [];

      for (const dayOfWeek of daysOfWeek) {
        const rule = await tx.availability.create({
          data: {
            educatorId: user.id,
            type: "RECURRING",
            startTime: null,
            endTime: null,
            dayOfWeek,
            weeklyStartTime: start.value,
            weeklyEndTime: end.value,
            timeZone,
            active: true,
            isAlwaysAvailable: false,
            recurrenceKey: null,
            excludedDates: [],
            occurrenceDate: null,
            status: "Available",
          },
        });

        const updated = await tx.availability.update({
          where: { id: rule.id },
          data: { recurrenceKey: rule.id },
        });

        rules.push(updated);
      }

      return rules;
    });

    return NextResponse.json(
      {
        success: true,
        recurringRules: createdRules,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create educator availability error:", error);
    return NextResponse.json(
      { error: "Unable to create availability." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, response } = await authorize();
    if (response || !user) return response;

    const body = (await request.json()) as {
      id?: unknown;
      ruleId?: unknown;
      active?: unknown;
      dayOfWeek?: unknown;
      startTime?: unknown;
      endTime?: unknown;
      timeZone?: unknown;
      isAlwaysAvailable?: unknown;
    };

    const ruleId =
      typeof body.ruleId === "string" ? body.ruleId.trim() : null;

    /*
     * Editing a legacy 24/7 recurring rule converts the old model to
     * the new concrete seven-day model.
     */
    if (ruleId) {
      const rule = await prisma.availability.findFirst({
        where: {
          id: ruleId,
          educatorId: user.id,
          type: "RECURRING",
        },
      });

      if (!rule) {
        return NextResponse.json(
          { error: "Recurring availability not found." },
          { status: 404 },
        );
      }

      if (
        typeof body.active === "boolean" &&
        Object.keys(body).length <= 3
      ) {
        const updated = await prisma.availability.update({
          where: { id: rule.id },
          data: { active: body.active },
        });

        return NextResponse.json({
          success: true,
          recurringRule: updated,
        });
      }

      const isAlwaysAvailable = body.isAlwaysAvailable === true;

      if (isAlwaysAvailable) {
        const timeZone = validTimeZone(
          body.timeZone ?? rule.timeZone,
        );

        if (!timeZone) {
          return NextResponse.json(
            { error: "Invalid time zone." },
            { status: 400 },
          );
        }

        await removeLegacy24x7Availability(user.id);

        const created = await createSeven24HourDays(
          user.id,
          timeZone,
        );

        return NextResponse.json({
          success: true,
          mode: "SEVEN_DAY_24_HOUR",
          availability: created,
          recurringRules: [],
        });
      }

      const dayOfWeek = Number(body.dayOfWeek);
      const start = parseTime(body.startTime);
      const end = parseTime(body.endTime);
      const timeZone = validTimeZone(
        body.timeZone ?? rule.timeZone,
      );

      if (!timeZone) {
        return NextResponse.json(
          { error: "Invalid time zone." },
          { status: 400 },
        );
      }

      if (
        !Number.isInteger(dayOfWeek) ||
        dayOfWeek < 0 ||
        dayOfWeek > 6
      ) {
        return NextResponse.json(
          { error: "Invalid day of week." },
          { status: 400 },
        );
      }

      if (!start || !end || end.total <= start.total) {
        return NextResponse.json(
          { error: "The end time must be after the start time." },
          { status: 400 },
        );
      }

      if (end.total - start.total < 15) {
        return NextResponse.json(
          { error: "Availability must be at least 15 minutes long." },
          { status: 400 },
        );
      }

      const overlap = await prisma.availability.findFirst({
        where: {
          educatorId: user.id,
          type: "RECURRING",
          active: true,
          isAlwaysAvailable: false,
          id: { not: rule.id },
          dayOfWeek,
          weeklyStartTime: { lt: end.value },
          weeklyEndTime: { gt: start.value },
        },
        select: { id: true },
      });

      if (overlap) {
        return NextResponse.json(
          {
            error: `The schedule overlaps an existing ${DAYS[dayOfWeek]} schedule.`,
          },
          { status: 409 },
        );
      }

      const updated = await prisma.availability.update({
        where: { id: rule.id },
        data: {
          dayOfWeek,
          weeklyStartTime: start.value,
          weeklyEndTime: end.value,
          timeZone,
          isAlwaysAvailable: false,
          active:
            typeof body.active === "boolean"
              ? body.active
              : rule.active,
        },
      });

      return NextResponse.json({
        success: true,
        recurringRule: updated,
      });
    }

    const id =
      typeof body.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json(
        { error: "Availability ID is required." },
        { status: 400 },
      );
    }

    const start =
      body.startTime instanceof Date
        ? body.startTime
        : new Date(String(body.startTime));
    const end =
      body.endTime instanceof Date
        ? body.endTime
        : new Date(String(body.endTime));

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid start or end time." },
        { status: 400 },
      );
    }

    if (start <= new Date() || end <= start) {
      return NextResponse.json(
        { error: "The availability times are invalid." },
        { status: 400 },
      );
    }

    if (end.getTime() - start.getTime() < 15 * 60_000) {
      return NextResponse.json(
        { error: "Availability must be at least 15 minutes long." },
        { status: 400 },
      );
    }

    const existing = await prisma.availability.findFirst({
      where: {
        id,
        educatorId: user.id,
        type: { in: ["ONE_OFF", "OCCURRENCE"] },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Availability slot not found." },
        { status: 404 },
      );
    }

    if (existing.status !== "Available") {
      return NextResponse.json(
        { error: "Only available slots can be edited." },
        { status: 409 },
      );
    }

    const overlap = await prisma.availability.findFirst({
      where: {
        educatorId: user.id,
        id: { not: id },
        type: { in: ["ONE_OFF", "OCCURRENCE"] },
        status: "Available",
        startTime: { lt: end },
        endTime: { gt: start },
      },
      select: { id: true },
    });

    if (overlap) {
      return NextResponse.json(
        { error: "The availability overlaps another available slot." },
        { status: 409 },
      );
    }

    const updated = await prisma.availability.update({
      where: { id },
      data: {
        startTime: start,
        endTime: end,
      },
    });

    return NextResponse.json({
      success: true,
      availability: updated,
    });
  } catch (error) {
    console.error("Update educator availability error:", error);
    return NextResponse.json(
      { error: "Unable to update availability." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, response } = await authorize();
    if (response || !user) return response;

    const body = (await request.json()) as {
      id?: unknown;
      ruleId?: unknown;
      disable24x7?: unknown;
    };

    /*
     * Explicitly turn off the concrete 24/7 schedule.
     * Existing booked rows are preserved.
     */
    if (body.disable24x7 === true) {
      const now = new Date();

      const deletedOccurrences =
        await prisma.availability.deleteMany({
          where: {
            educatorId: user.id,
            type: "OCCURRENCE",
            isAlwaysAvailable: true,
            status: "Available",
            startTime: { gte: now },
          },
        });

      const deletedOneOff =
        await prisma.availability.deleteMany({
          where: {
            educatorId: user.id,
            type: "ONE_OFF",
            isAlwaysAvailable: true,
            status: "Available",
            startTime: { gte: now },
          },
        });

      await prisma.availability.deleteMany({
        where: {
          educatorId: user.id,
          type: "RECURRING",
          isAlwaysAvailable: true,
        },
      });

      return NextResponse.json({
        success: true,
        disabled24x7: true,
        deleted: {
          occurrences: deletedOccurrences.count,
          oneOff: deletedOneOff.count,
        },
      });
    }

    const ruleId =
      typeof body.ruleId === "string" ? body.ruleId.trim() : null;

    if (ruleId) {
      const rule = await prisma.availability.findFirst({
        where: {
          id: ruleId,
          educatorId: user.id,
          type: "RECURRING",
        },
        select: {
          id: true,
          recurrenceKey: true,
          isAlwaysAvailable: true,
        },
      });

      if (!rule) {
        return NextResponse.json(
          { error: "Recurring availability not found." },
          { status: 404 },
        );
      }

      if (rule.isAlwaysAvailable) {
        await removeLegacy24x7Availability(user.id);
        return NextResponse.json({
          success: true,
          disabled24x7: true,
        });
      }

      await prisma.$transaction([
        prisma.availability.deleteMany({
          where: {
            educatorId: user.id,
            type: "OCCURRENCE",
            recurrenceKey: rule.recurrenceKey ?? rule.id,
            status: "Available",
            startTime: { gte: new Date() },
          },
        }),
        prisma.availability.delete({
          where: { id: rule.id },
        }),
      ]);

      return NextResponse.json({ success: true });
    }

    const id =
      typeof body.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json(
        { error: "Availability ID is required." },
        { status: 400 },
      );
    }

    const slot = await prisma.availability.findFirst({
      where: {
        id,
        educatorId: user.id,
        type: { in: ["ONE_OFF", "OCCURRENCE"] },
      },
      select: {
        id: true,
        status: true,
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

    await prisma.availability.delete({
      where: { id: slot.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete educator availability error:", error);
    return NextResponse.json(
      { error: "Unable to delete availability." },
      { status: 500 },
    );
  }
}
