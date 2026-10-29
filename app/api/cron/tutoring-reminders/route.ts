import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { notifyUsers, getAdminIds } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // The 5-minute Vercel schedule gives a +/- 5 minute delivery window.
  const windows = [
    {
      type: "ONE_HOUR" as const,
      start: new Date(now.getTime() + 55 * 60_000),
      end: new Date(now.getTime() + 65 * 60_000),
      lead: "about one hour",
    },
    {
      type: "TEN_MINUTES" as const,
      start: new Date(now.getTime() + 5 * 60_000),
      end: new Date(now.getTime() + 15 * 60_000),
      lead: "about ten minutes",
    },
  ];
  const admins = await getAdminIds();
  let processed = 0;
  const errors: string[] = [];

  for (const window of windows) {
    const bookings = await prisma.booking.findMany({
      where: {
        status: "Scheduled",
        startTime: { gte: window.start, lt: window.end },
      },
      select: {
        id: true,
        studentId: true,
        educatorId: true,
        startTime: true,
        endTime: true,
        subject: true,
        student: { select: { name: true } },
        educator: { select: { name: true } },
        service: { select: { title: true } },
      },
      take: 250,
    });

    for (const booking of bookings) {
      const type = window.type;
      try {
        const existing = await prisma.tutoringReminder.findUnique({
          where: { bookingId_type: { bookingId: booking.id, type } },
          select: { id: true },
        });
        if (existing) continue;

        const date = booking.startTime.toLocaleDateString("en-US", {
          dateStyle: "full",
          timeZone: "UTC",
        });
        const time =
          booking.startTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
          }) + " UTC";
        const lesson =
          booking.service?.title || booking.subject || "Tutoring session";
        await notifyUsers([booking.studentId, booking.educatorId, ...admins], {
          eventKey: `session-reminder:${booking.id}:${type}`,
          type: "SESSION_REMINDER",
          title: `Tutoring session ${window.lead} away`,
          message: `${lesson} with ${booking.educator.name || "your tutor"} starts ${date} at ${time}.`,
          href: "/tutoring/sessions",
          hrefByUserId: Object.fromEntries([
            ...admins.map((id) => [id, "/admin"] as const),
            [booking.educatorId, "/educator"] as const,
            [booking.studentId, "/tutoring/sessions"] as const,
          ]),
          emailSubject: `Justdy session reminder: ${window.lead}`,
        });
        // Unique booking/type is the durable retry guard. Notifications have
        // their own per-recipient unique event keys, so parallel cron runs
        // cannot normally duplicate the inbox item or its email.
        await prisma.tutoringReminder.create({
          data: { bookingId: booking.id, type },
        });
        processed += 1;
      } catch (error) {
        if ((error as { code?: string })?.code === "P2002") continue;
        const message =
          error instanceof Error ? error.message : "Unknown reminder error";
        errors.push(`${booking.id}/${window.type}: ${message}`);
        console.error("Tutoring reminder processing failed", {
          bookingId: booking.id,
          type: window.type,
          message,
        });
      }
    }
  }

  return NextResponse.json(
    {
      ok: errors.length === 0,
      processed,
      errors: errors.slice(0, 20),
      checkedAt: now.toISOString(),
    },
    { status: errors.length ? 207 : 200 },
  );
}
