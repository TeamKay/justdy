import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  Video,
} from "lucide-react";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const JOIN_WINDOW_MINUTES = 30;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function canJoinSession(
  status: string,
  scheduledStart: Date,
  scheduledEnd: Date,
  now: Date,
) {
  if (status !== "SCHEDULED" && status !== "IN_PROGRESS") {
    return false;
  }

  const joinWindowStart = new Date(
    scheduledStart.getTime() - JOIN_WINDOW_MINUTES * 60 * 1000,
  );

  return now >= joinWindowStart && now < scheduledEnd;
}

function sessionHasStarted(scheduledStart: Date, now: Date) {
  return now >= scheduledStart;
}

export default async function LearnerSessionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/auth?mode=signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      canLearn: true,
      emailVerified: true,
    },
  });

  if (!user) {
    redirect("/auth?mode=signin");
  }

  if (!user.emailVerified) {
    redirect(
      `/verify-request?email=${encodeURIComponent(
        session.user.email ?? "",
      )}`,
    );
  }

  if (!user.canLearn) {
    redirect("/dashboard");
  }

  const now = new Date();

  const [upcoming, completed] = await Promise.all([
    prisma.tutoringSession.findMany({
      where: {
        learnerId: user.id,

        // Keep active sessions visible until their scheduled end.
        // This means a session that started 5 minutes ago is still
        // visible and can still be joined.
        scheduledEnd: {
          gt: now,
        },

        status: {
          in: ["SCHEDULED", "IN_PROGRESS"],
        },
      },
      orderBy: {
        scheduledStart: "asc",
      },
      take: 12,
      select: {
        id: true,
        bookingId: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
        topic: true,
        learnerAttendance: true,
        educatorAttendance: true,
        educator: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        service: {
          select: {
            title: true,
            subject: true,
            durationMinutes: true,
          },
        },
      },
    }),

    prisma.tutoringSession.findMany({
      where: {
        learnerId: user.id,
        status: "COMPLETED",
      },
      orderBy: {
        scheduledStart: "desc",
      },
      take: 20,
      select: {
        id: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
        topic: true,
        strengths: true,
        needsPractice: true,
        nextStep: true,
        learnerOutcome: true,
        educator: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
        service: {
          select: {
            title: true,
            subject: true,
          },
        },
      },
    }),
  ]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-sm font-medium text-emerald-600">
            Learning
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            My Sessions
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            Manage upcoming tutoring sessions and review what you learned
            after each lesson.
          </p>
        </header>

        <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Upcoming sessions
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Your next scheduled tutoring sessions.
              </p>
            </div>

            <CalendarDays className="hidden h-5 w-5 text-emerald-600 sm:block" />
          </div>

          {upcoming.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed p-8 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 font-medium">
                No upcoming sessions
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Book a tutor when you are ready for your next lesson.
              </p>

              <Link
                href="/tutor"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Find a tutor
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {upcoming.map((item) => {
                const nowForCard = new Date();

                const joinable = canJoinSession(
                  String(item.status),
                  item.scheduledStart,
                  item.scheduledEnd,
                  nowForCard,
                );

                const started = sessionHasStarted(
                  item.scheduledStart,
                  nowForCard,
                );

                const durationMinutes =
                  item.service?.durationMinutes ??
                  Math.round(
                    (item.scheduledEnd.getTime() -
                      item.scheduledStart.getTime()) /
                      60000,
                  );

                /*
                 * IMPORTANT:
                 *
                 * When the session is currently joinable, send the learner
                 * directly into the live classroom using the booking ID.
                 *
                 * Otherwise, keep the learner on the dashboard session
                 * details page.
                 */
                const sessionHref = joinable
                  ? `/tutoring/sessions/${encodeURIComponent(
                      item.bookingId,
                    )}`
                  : `/dashboard/tutoring/sessions/${item.id}`;

                return (
                  <Link
                    key={item.id}
                    href={sessionHref}
                    className="group rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {item.service?.title ??
                            item.topic ??
                            "Tutoring session"}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.educator?.name ?? "Your tutor"}
                        </p>
                      </div>

                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          joinable
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-emerald-50 text-emerald-700",
                        ].join(" ")}
                      >
                        {joinable
                          ? started
                            ? "Ready to join"
                            : "Join available"
                          : statusLabel(String(item.status))}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">
                          Date
                        </p>

                        <p className="mt-1 font-medium">
                          {formatDate(item.scheduledStart)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">
                          Time
                        </p>

                        <p className="mt-1 font-medium">
                          {formatTime(item.scheduledStart)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm font-medium">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Clock3 className="h-4 w-4" />
                        {durationMinutes} min
                      </span>

                      <span
                        className={
                          joinable
                            ? "inline-flex items-center gap-1 font-semibold text-emerald-700"
                            : "inline-flex items-center gap-1 text-muted-foreground"
                        }
                      >
                        {joinable ? (
                          <>
                            <Video className="h-4 w-4" />
                            Join session
                          </>
                        ) : (
                          <>
                            Open
                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                          </>
                        )}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Completed sessions
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Review your tutoring outcomes and next steps.
              </p>
            </div>

            <History className="hidden h-5 w-5 text-indigo-600 sm:block" />
          </div>

          {completed.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Your completed tutoring sessions will appear here.
            </div>
          ) : (
            <div className="mt-6 divide-y">
              {completed.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/tutoring/sessions/${item.id}`}
                  className="group flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {item.service?.title ??
                        item.topic ??
                        "Tutoring session"}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.educator?.name ?? "Tutor"} ·{" "}
                      {formatDate(item.scheduledStart)}
                    </p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-2 text-sm text-muted-foreground sm:flex">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Completed
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}