import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import prisma  from "@/lib/prisma";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_SHOW_GRACE_MINUTES = 15;
const REMINDER_WINDOWS = [
  { type: "TWENTY_FOUR_HOURS" as const, min: 23 * 60, max: 25 * 60 },
  { type: "ONE_HOUR" as const, min: 45, max: 75 },
];

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const value = request.headers.get("authorization")?.trim() ?? "";
  if (!secret || !value.startsWith("Bearer ")) return false;
  const supplied = value.slice(7).trim();
  return createHash("sha256").update(secret).digest().equals(createHash("sha256").update(supplied).digest());
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(value);
}
function formatTime(start: Date, end: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const now = new Date();
  const noShowCutoff = new Date(now.getTime() - NO_SHOW_GRACE_MINUTES * 60_000);
  let noShows = 0;
  let reminders = 0;
  let reminderErrors = 0;
  let orphanedBookings = 0;

  const stale = await prisma.booking.findMany({
    where: { status: "Scheduled", endTime: { lt: noShowCutoff } },
    include: { tutoringSession: true },
    take: 100,
  });

  for (const booking of stale) {
    const session = booking.tutoringSession;
    // A paid/scheduled booking should have a canonical tutoring session.
    // Do not silently convert an orphaned booking into a no-show; that would
    // hide a provisioning failure. Surface it for operational follow-up.
    if (!session) {
      orphanedBookings += 1;
      continue;
    }

    // Reconcile state mismatches first. These can happen if a request is
    // interrupted between the session and booking updates. Do not classify a
    // session that actually completed as a no-show.
    if (session.status === "COMPLETED") {
      await prisma.booking.updateMany({
        where: { id: booking.id, status: "Scheduled" },
        data: { status: "Completed" },
      });
      continue;
    }

    // An IN_PROGRESS session has a startedAt timestamp by design. It must
    // still reach the attendance reconciliation below after the scheduled
    // end time; do not let startedAt short-circuit that branch.

    if (session.status === "NO_SHOW") {
      await prisma.$transaction(async (tx) => {
        await tx.booking.updateMany({
          where: { id: booking.id, status: "Scheduled" },
          data: { status: "NoShow" },
        });
        if (booking.availabilityId) {
          await tx.availability.updateMany({
            where: { id: booking.availabilityId, status: "Booked" },
            data: { status: "Available" },
          });
        }
      });
      continue;
    }

    if (session.status === "CANCELLED") continue;

    // An interrupted browser/session request can leave a lesson IN_PROGRESS
    // after its scheduled end. Use the attendance recorded by the classroom
    // lifecycle to distinguish a real two-party lesson from a one-sided join.
    // A two-party lesson is completed; otherwise it is reconciled as a no-show.
    if (session.status === "IN_PROGRESS") {
      await prisma.$transaction(async (tx) => {
        if (session.learnerAttendance && session.educatorAttendance) {
          await tx.tutoringSession.updateMany({
            where: { bookingId: booking.id, status: "IN_PROGRESS" },
            data: {
              status: "COMPLETED",
              endedAt: session.endedAt ?? booking.endTime,
            },
          });
          await tx.booking.updateMany({
            where: { id: booking.id, status: "Scheduled" },
            data: { status: "Completed" },
          });
        } else {
          const updated = await tx.booking.updateMany({
            where: { id: booking.id, status: "Scheduled" },
            data: { status: "NoShow" },
          });
          if (!updated.count) return;
          await tx.tutoringSession.updateMany({
            where: { bookingId: booking.id, status: "IN_PROGRESS" },
            data: { status: "NO_SHOW" },
          });
          if (booking.availabilityId) {
            await tx.availability.updateMany({
              where: { id: booking.availabilityId, status: "Booked" },
              data: { status: "Available" },
            });
          }
          noShows += 1;
        }
      });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.updateMany({
        where: { id: booking.id, status: "Scheduled" },
        data: { status: "NoShow" },
      });
      if (!updated.count) return;
      await tx.tutoringSession.updateMany({
        where: { bookingId: booking.id, status: "SCHEDULED" },
        data: { status: "NO_SHOW" },
      });
      if (booking.availabilityId) {
        await tx.availability.updateMany({
          where: { id: booking.availabilityId, status: "Booked" },
          data: { status: "Available" },
        });
      }
      noShows += 1;
    });
  }

  const upcoming = await prisma.booking.findMany({
    where: { status: "Scheduled", startTime: { gt: now, lt: new Date(now.getTime() + 26 * 60 * 60_000) } },
    include: {
      student: { select: { name: true, email: true } },
      educator: { select: { name: true, email: true } },
      service: { select: { title: true, subject: true } },
    },
    take: 200,
  });

  for (const booking of upcoming) {
    const minutesUntil = (booking.startTime.getTime() - now.getTime()) / 60_000;
    const window = REMINDER_WINDOWS.find((item) => minutesUntil >= item.min && minutesUntil <= item.max);
    if (!window) continue;

    // Claim the reminder before sending so two concurrent scheduler runs
    // cannot both send the same email. A failed send removes the claim so a
    // later run can retry.
    try {
      await prisma.tutoringReminder.create({
  data: {
    id: crypto.randomUUID(),
    bookingId: booking.id,
    type: window.type,
  },
});
    } catch {
      continue;
    }

    const subject = booking.service?.subject || booking.subject || booking.service?.title || "Tutoring";
    const date = formatDate(booking.startTime);
    const time = formatTime(booking.startTime, booking.endTime);
    const url = `${process.env.NEXT_PUBLIC_URL || env.BETTER_AUTH_URL}/tutoring/sessions`;
    const lead = window.type === "ONE_HOUR" ? "Your Justdy tutoring session starts in about one hour. Please make sure you are ready to join." : "This is a reminder that your Justdy tutoring session is scheduled for tomorrow.";

    try {
      const ReminderEmail = (await import("@/app/_components/emails/TutoringSessionReminderEmail")).default;
      const people = [booking.student, booking.educator].filter((person) => person.email?.trim());
      if (!people.length) {
        await prisma.tutoringReminder.deleteMany({
          where: { bookingId: booking.id, type: window.type },
        });
        continue;
      }

      for (const person of people) {
        const result = await resend.emails.send({
          from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
          to: [person.email!.trim().toLowerCase()],
          subject: `Justdy tutoring reminder: ${subject}`,
          react: ReminderEmail({ username: person.name || "there", subject, date, time, tutoringUrl: url, lead }),
        });
        if (result.error) throw result.error;
      }

      reminders += 1;
    } catch (error) {
      reminderErrors += 1;
      await prisma.tutoringReminder.deleteMany({
        where: { bookingId: booking.id, type: window.type },
      });
      console.error("TUTORING REMINDER ERROR", booking.id, error);
    }
  }

  return NextResponse.json({ ok: true, noShows, orphanedBookings, reminders, reminderErrors });
}
