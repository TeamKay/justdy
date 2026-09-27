import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TUTOR = "CAN_TUTOR";
const LOOKAHEAD_DAYS = 120;

type RecurringRule = {
  id: string;
  educatorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timeZone: string;
  excludedDates: string[];
};

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  time: string,
  timeZone: string,
) {
  const [hour, minute] = time.split(":").map(Number);
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  for (let i = 0; i < 4; i += 1) {
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
    const diff = desired - actual;

    if (Math.abs(diff) < 1000) return guess;
    guess = new Date(guess.getTime() + diff);
  }

  return guess;
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


function buildRecurringOccurrences(
  rules: RecurringRule[],
  now: Date,
) {
  const occurrences: Array<{
    id: string;
    recurringRuleId: string;
    startTime: string;
    endTime: string;
    status: "Available";
  }> = [];

  const seen = new Set<string>();

  for (const rule of rules) {
    const local = getDatePartsInTimeZone(now, rule.timeZone);

    for (let offset = 0; offset <= LOOKAHEAD_DAYS; offset += 1) {
      const target = addDays(local.year, local.month, local.day, offset);
      const key = dateKey(target.year, target.month, target.day);

      if (rule.excludedDates.includes(key)) continue;

      const targetDate = new Date(
        Date.UTC(target.year, target.month - 1, target.day),
      );

      if (targetDate.getUTCDay() !== rule.dayOfWeek) continue;

      const start = zonedDateTimeToUtc(
        target.year,
        target.month,
        target.day,
        rule.startTime,
        rule.timeZone,
      );
      const end = zonedDateTimeToUtc(
        target.year,
        target.month,
        target.day,
        rule.endTime,
        rule.timeZone,
      );

      if (end <= start || end <= now) continue;

      const occurrenceKey = `${rule.id}:${key}`;
      if (seen.has(occurrenceKey)) continue;
      seen.add(occurrenceKey);

      occurrences.push({
        // This is intentionally a stable synthetic identifier for the
        // recurring occurrence. It is NOT treated as a Prisma Availability ID.
        id: `recurring:${rule.id}:${key}`,
        recurringRuleId: rule.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: "Available",
      });
    }
  }

  return occurrences.sort(
    (a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}


function findFirstBookableSlot(
  availabilitySlots: Array<{
    id: string;
    recurringRuleId?: string;
    startTime: string;
    endTime: string;
    status: "Available";
  }>,
  bookings: Array<{
    startTime: Date;
    endTime: Date;
  }>,
  durationMinutes: number,
  now: Date,
) {
  const durationMs = Math.max(1, durationMinutes) * 60_000;

  const orderedSlots = [...availabilitySlots].sort(
    (a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  for (const availability of orderedSlots) {
    const availabilityStart = new Date(availability.startTime).getTime();
    const availabilityEnd = new Date(availability.endTime).getTime();

    if (
      !Number.isFinite(availabilityStart) ||
      !Number.isFinite(availabilityEnd) ||
      availabilityEnd <= availabilityStart
    ) {
      continue;
    }

    let candidateStart = Math.max(availabilityStart, now.getTime());

    while (candidateStart + durationMs <= availabilityEnd) {
      const candidateEnd = candidateStart + durationMs;

      const overlapsBooking = bookings.some((booking) => {
        const bookingStart = booking.startTime.getTime();
        const bookingEnd = booking.endTime.getTime();

        return candidateStart < bookingEnd && candidateEnd > bookingStart;
      });

      if (!overlapsBooking) {
        return {
          id: `${availability.id}:bookable:${candidateStart}`,
          recurringRuleId: availability.recurringRuleId,
          startTime: new Date(candidateStart).toISOString(),
          endTime: new Date(candidateEnd).toISOString(),
          status: "Available" as const,
          durationMinutes,
        };
      }

      // Move to the end of the conflicting booking when possible. This
      // avoids scanning minute-by-minute through long blocked periods.
      const conflictingEnd = bookings.reduce((latest, booking) => {
        const bookingStart = booking.startTime.getTime();
        const bookingEnd = booking.endTime.getTime();

        if (candidateStart < bookingEnd && candidateEnd > bookingStart) {
          return Math.max(latest, bookingEnd);
        }

        return latest;
      }, candidateStart + 60_000);

      candidateStart = Math.max(candidateStart + 60_000, conflictingEnd);
    }
  }

  return null;
}

async function hasTutorCapability(userId: string) {
  const capability = await prisma.capability.findUnique({
    where: { key: TUTOR },
    select: { id: true },
  });

  if (!capability) return false;

  const assignment = await prisma.userCapability.findUnique({
    where: {
      userId_capabilityId: {
        userId,
        capabilityId: capability.id,
      },
    },
    select: { userId: true },
  });

  return Boolean(assignment);
}

export async function GET() {
  try {
    const now = new Date();

    // Do not rely on User relation fields here. Query the canonical models
    // directly so this route remains compatible with the generated Prisma
    // client currently used by the application.
    const users = await prisma.user.findMany({
      where: { status: "Active" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    });

    if (users.length === 0) {
      return NextResponse.json({ tutors: [], count: 0 });
    }

    const userIds = users.map((user) => user.id);

    const [profiles, recurringRules, concreteAvailability, bookings, services] =
      await Promise.all([
        prisma.teachingProfile.findMany({
          where: {
            userId: { in: userIds },
            verificationStatus: "Verified",
          },
          select: {
            id: true,
            userId: true,
            headline: true,
            specialty: true,
            experience: true,
            description: true,
            verificationStatus: true,
            hourlyRate: true,
            currency: true,
          },
        }),
        prisma.recurringAvailability.findMany({
          where: {
            educatorId: { in: userIds },
            active: true,
          },
          select: {
            id: true,
            educatorId: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            timeZone: true,
            excludedDates: true,
          },
        }),
        prisma.availability.findMany({
          where: {
            educatorId: { in: userIds },
            status: "Available",
            endTime: { gt: now },
          },
          orderBy: { startTime: "asc" },
          take: Math.max(200, userIds.length * 50),
          select: {
            id: true,
            educatorId: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        }),
        prisma.booking.findMany({
          where: {
            educatorId: { in: userIds },
            status: { in: ["PendingPayment", "Scheduled"] },
            endTime: { gt: now },
          },
          orderBy: { startTime: "asc" },
          take: Math.max(500, userIds.length * 100),
          select: {
            educatorId: true,
            startTime: true,
            endTime: true,
          },
        }),
        prisma.service.findMany({
          where: {
            providerId: { in: userIds },
            type: "TUTORING",
            status: "Published",
          },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            providerId: true,
            title: true,
            description: true,
            durationMinutes: true,
            price: true,
            currency: true,
            subject: true,
            gradeLevels: true,
          },
        }),
      ]);

    const profileByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));
    const rulesByUserId = new Map<string, RecurringRule[]>();
    const availabilityByUserId = new Map<string, typeof concreteAvailability>();
    const bookingsByUserId = new Map<string, typeof bookings>();
    const servicesByUserId = new Map<string, typeof services>();

    for (const rule of recurringRules) {
      const list = rulesByUserId.get(rule.educatorId) ?? [];
      list.push(rule);
      rulesByUserId.set(rule.educatorId, list);
    }

    for (const slot of concreteAvailability) {
      const list = availabilityByUserId.get(slot.educatorId) ?? [];
      list.push(slot);
      availabilityByUserId.set(slot.educatorId, list);
    }

    for (const booking of bookings) {
      const list = bookingsByUserId.get(booking.educatorId) ?? [];
      list.push(booking);
      bookingsByUserId.set(booking.educatorId, list);
    }

    for (const service of services) {
      const list = servicesByUserId.get(service.providerId) ?? [];
      list.push(service);
      servicesByUserId.set(service.providerId, list);
    }

    const tutors = [];

    for (const user of users) {
      const profile = profileByUserId.get(user.id);
      if (!profile) continue;

      const canTutor = await hasTutorCapability(user.id);
      if (!canTutor) continue;

      const recurring = buildRecurringOccurrences(
        rulesByUserId.get(user.id) ?? [],
        now,
      );

      // Prefer dynamically calculated recurring availability. Concrete rows
      // are retained as a compatibility fallback for older schedules.
      const slots = recurring.length
        ? recurring
        : (availabilityByUserId.get(user.id) ?? []).map((slot) => ({
            id: slot.id,
            recurringRuleId: undefined,
            startTime: slot.startTime.toISOString(),
            endTime: slot.endTime.toISOString(),
            status: "Available" as const,
          }));

      const tutorBookings = bookingsByUserId.get(user.id) ?? [];
      const tutorServices = servicesByUserId.get(user.id) ?? [];

      // The marketplace's "next availability" must be an actually
      // bookable session, not merely the beginning of a recurring window.
      // Use the shortest published tutoring service so the marketplace can
      // truthfully advertise the earliest usable appointment.
      const serviceDurationMinutes =
        tutorServices.reduce<number | null>((shortest, service) => {
          const duration = Number(service.durationMinutes);

          if (!Number.isFinite(duration) || duration <= 0) {
            return shortest;
          }

          return shortest == null ? duration : Math.min(shortest, duration);
        }, null) ?? 60;

      const firstAvailableSlot = findFirstBookableSlot(
        slots,
        tutorBookings,
        serviceDurationMinutes,
        now,
      );

      tutors.push({
        id: user.id,
        name: user.name,
        imageUrl: user.imageUrl,
        teachingProfile: {
          id: profile.id,
          headline: profile.headline,
          specialty: profile.specialty,
          experience: profile.experience,
          description: profile.description,
          verificationStatus: profile.verificationStatus,
          hourlyRate: profile.hourlyRate,
          currency: profile.currency,
        },
        facilitatorProfile: {
          specialty: profile.specialty,
          experience: profile.experience,
          description: profile.description,
          verificationStatus: profile.verificationStatus,
        },
        firstAvailableSlot,
        availabilities: slots.slice(0, 500),
        bookings: tutorBookings.map((booking) => ({
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
        })),
        services: tutorServices,
        verified: true,
      });
    }

    return NextResponse.json(
      { tutors, count: tutors.length },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/tutoring/tutors:", error);

    return NextResponse.json(
      { error: "Unable to load tutors." },
      { status: 500 },
    );
  }
}
