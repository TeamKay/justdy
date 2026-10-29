import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function parseLocalDateTime(value: unknown): LocalParts | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  const parts = {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: Number(h),
    minute: Number(mi),
  };
  const check = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute),
  );
  if (
    check.getUTCFullYear() !== parts.year ||
    check.getUTCMonth() !== parts.month - 1 ||
    check.getUTCDate() !== parts.day ||
    check.getUTCHours() !== parts.hour ||
    check.getUTCMinutes() !== parts.minute
  )
    return null;
  return parts;
}

function formatParts(date: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: Number(value.year),
    month: Number(value.month),
    day: Number(value.day),
    hour: Number(value.hour),
    minute: Number(value.minute),
  };
}

function sameParts(a: LocalParts, b: LocalParts) {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute
  );
}

/** Converts a wall-clock time in an explicit IANA zone to UTC.
 * Rejects nonexistent and ambiguous local times around DST transitions.
 */
function localTimeToUtc(local: LocalParts, timeZone: string): Date {
  const desired = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
  );
  let guess = desired;
  for (let i = 0; i < 5; i++) {
    const represented = formatParts(new Date(guess), timeZone);
    const representedUtc = Date.UTC(
      represented.year,
      represented.month - 1,
      represented.day,
      represented.hour,
      represented.minute,
    );
    const delta = desired - representedUtc;
    guess += delta;
    if (delta === 0) break;
  }

  const matches: number[] = [];
  // Search the nearby three-hour window minute-by-minute to detect DST gaps/folds.
  for (
    let candidate = guess - 3 * 60 * 60 * 1000;
    candidate <= guess + 3 * 60 * 60 * 1000;
    candidate += 60 * 1000
  ) {
    if (
      formatParts(new Date(candidate), timeZone).year === local.year &&
      sameParts(formatParts(new Date(candidate), timeZone), local)
    )
      matches.push(candidate);
    if (matches.length > 1) break;
  }
  if (matches.length === 0)
    throw new Error(
      "That local time does not exist in this time zone because of a daylight-saving change. Choose another time.",
    );
  if (matches.length > 1)
    throw new Error(
      "That local time occurs twice in this time zone because of a daylight-saving change. Choose another time.",
    );
  return new Date(matches[0]);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const authSession = await auth.api.getSession({ headers: await headers() });
    if (!authSession?.user)
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const actor = await prisma.user.findUnique({
      where: { id: authSession.user.id },
      select: {
        id: true,
        role: true,
        status: true,
        emailVerified: true,
        teachingProfile: { select: { verificationStatus: true } },
      },
    });
    const role = String(actor?.role ?? "").toUpperCase();
    const isAdmin = role === "ADMIN" && Boolean(actor?.emailVerified);
    const isVerifiedTutor =
      role === "TUTOR" &&
      actor?.status === "Active" &&
      Boolean(actor.emailVerified) &&
      actor.teachingProfile?.verificationStatus === "Verified";
    if (!actor || (!isAdmin && !isVerifiedTutor)) {
      return NextResponse.json(
        { error: "Administrator or verified active tutor access required." },
        { status: 403 },
      );
    }

    const { sessionId } = await context.params;
    const row = await prisma.tutoringOnboardingSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        durationMinutes: true,
        onboardingRequest: { select: { assignedTutorId: true } },
      },
    });
    if (!row)
      return NextResponse.json(
        { error: "Tutoring session not found." },
        { status: 404 },
      );
    if (!isAdmin && row.onboardingRequest.assignedTutorId !== actor.id) {
      return NextResponse.json(
        {
          error: "You can only schedule sessions for requests assigned to you.",
        },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => null)) as null | {
      scheduledStartLocal?: unknown;
      timeZone?: unknown;
      durationMinutes?: unknown;
    };
    const local = parseLocalDateTime(body?.scheduledStartLocal);
    if (!local)
      return NextResponse.json(
        { error: "Enter a valid session date and start time." },
        { status: 400 },
      );
    const timeZone =
      typeof body?.timeZone === "string" ? body.timeZone.trim() : "";
    if (!timeZone || timeZone.length > 100)
      return NextResponse.json(
        { error: "Enter a valid IANA time zone, such as America/Chicago." },
        { status: 400 },
      );
    try {
      new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    } catch {
      return NextResponse.json(
        {
          error:
            "That time zone is not recognized. Use an IANA zone such as America/Chicago or Africa/Accra.",
        },
        { status: 400 },
      );
    }

    const duration =
      body?.durationMinutes === undefined
        ? row.durationMinutes
        : Number(body.durationMinutes);
    if (
      !Number.isInteger(duration) ||
      !duration ||
      duration < 15 ||
      duration > 240
    ) {
      return NextResponse.json(
        { error: "Session duration must be between 15 and 240 minutes." },
        { status: 400 },
      );
    }

    let start: Date;
    try {
      start = localTimeToUtc(local, timeZone);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Invalid local time.",
        },
        { status: 400 },
      );
    }
    if (start.getTime() <= Date.now())
      return NextResponse.json(
        { error: "Choose a future start time." },
        { status: 400 },
      );
    const end = new Date(start.getTime() + duration * 60_000);

    const updated = await prisma.tutoringOnboardingSession.update({
      where: { id: sessionId },
      data: {
        scheduledStart: start,
        scheduledEnd: end,
        timeZone,
        durationMinutes: duration,
        status: "SCHEDULED",
      },
      select: {
        id: true,
        sessionNumber: true,
        status: true,
        scheduledStart: true,
        scheduledEnd: true,
        durationMinutes: true,
        timeZone: true,
        subject: true,
        gradeLevel: true,
        tutorNotes: true,
      },
    });
    return NextResponse.json({
      session: {
        ...updated,
        scheduledStart: updated.scheduledStart?.toISOString() ?? null,
        scheduledEnd: updated.scheduledEnd?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to schedule tutoring session:", error);
    return NextResponse.json(
      { error: "Unable to schedule this tutoring session right now." },
      { status: 500 },
    );
  }
}
