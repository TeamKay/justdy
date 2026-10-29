import prisma from "@/lib/prisma";

const MATERIALIZE_DAYS = 120;

type RecurringRule = {
  id: string;
  educatorId: string;
  dayOfWeek: number | null;
  weeklyStartTime: string | null;
  weeklyEndTime: string | null;
  timeZone: string;
  active: boolean;
  excludedDates: string[];
  isAlwaysAvailable: boolean;
};

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
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
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      map.weekday,
    ),
  };
}

function addDays(year: number, month: number, day: number, amount: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/**
 * Converts a local wall-clock date/time in an IANA timezone to UTC.
 */
function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  time: string,
  timeZone: string,
) {
  const [hour, minute] = time.split(":").map(Number);

  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

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

    const actual = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour),
      Number(map.minute),
    );

    const desired = Date.UTC(year, month - 1, day, hour, minute);

    const difference = desired - actual;

    if (Math.abs(difference) < 1000) {
      return guess;
    }

    guess = new Date(guess.getTime() + difference);
  }

  return guess;
}

/**
 * Materializes ONLY normal weekly recurring schedules.
 *
 * 24/7 availability is concrete and therefore MUST NEVER be expanded here.
 * This guard is intentionally duplicated in both the query and the loop so
 * a future refactor cannot accidentally turn 24/7 back into hundreds of rows.
 */
export async function materializeRecurringAvailability(
  educatorId?: string,
): Promise<void> {
  const rules = await prisma.availability.findMany({
    where: {
      ...(educatorId ? { educatorId } : {}),
      type: "RECURRING",
      active: true,
      isAlwaysAvailable: false,
    },
    select: {
      id: true,
      educatorId: true,
      dayOfWeek: true,
      weeklyStartTime: true,
      weeklyEndTime: true,
      timeZone: true,
      active: true,
      excludedDates: true,
      isAlwaysAvailable: true,
    },
  });

  if (rules.length === 0) {
    return;
  }

  const now = new Date();

  for (const rule of rules as RecurringRule[]) {
    // Defensive guard. 24/7 never belongs in this materializer.
    if (rule.isAlwaysAvailable) {
      continue;
    }

    if (
      rule.dayOfWeek === null ||
      rule.weeklyStartTime === null ||
      rule.weeklyEndTime === null
    ) {
      continue;
    }

    const localToday = getDatePartsInTimeZone(now, rule.timeZone);

    for (let offset = 0; offset <= MATERIALIZE_DAYS; offset += 1) {
      const target = addDays(
        localToday.year,
        localToday.month,
        localToday.day,
        offset,
      );

      const targetDateKey = dateKey(target.year, target.month, target.day);

      if (rule.excludedDates.includes(targetDateKey)) {
        continue;
      }

      const targetWeekday = new Date(
        Date.UTC(target.year, target.month - 1, target.day),
      ).getUTCDay();

      if (targetWeekday !== rule.dayOfWeek) {
        continue;
      }

      const startTime = zonedDateTimeToUtc(
        target.year,
        target.month,
        target.day,
        rule.weeklyStartTime,
        rule.timeZone,
      );

      const endTime = zonedDateTimeToUtc(
        target.year,
        target.month,
        target.day,
        rule.weeklyEndTime,
        rule.timeZone,
      );

      if (endTime <= startTime || startTime <= now) {
        continue;
      }

      await prisma.availability.upsert({
        where: {
          recurrenceKey_occurrenceDate: {
            recurrenceKey: rule.id,
            occurrenceDate: targetDateKey,
          },
        },
        create: {
          educatorId: rule.educatorId,
          type: "OCCURRENCE",
          startTime,
          endTime,
          dayOfWeek: rule.dayOfWeek,
          weeklyStartTime: null,
          weeklyEndTime: null,
          timeZone: rule.timeZone,
          active: true,
          isAlwaysAvailable: false,
          excludedDates: [],
          recurrenceKey: rule.id,
          occurrenceDate: targetDateKey,
          status: "Available",
        },
        update: {
          startTime,
          endTime,
          active: true,
        },
      });
    }
  }
}
