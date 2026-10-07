import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Users } from "lucide-react";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
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

function statusClasses(status: string) {
  if (status === "COMPLETED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "IN_PROGRESS") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }
  return "border-border bg-muted text-muted-foreground";
}

export default async function EducatorSessionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth?mode=signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, canTeach: true },
  });

  if (!user) redirect("/auth?mode=signin");

  if (String(user.role ?? "").trim().toUpperCase() === "ADMIN") {
    redirect("/admin/sessions");
  }

  if (!user.canTeach) redirect("/dashboard");

  const now = new Date();

  const [upcoming, recent] = await Promise.all([
    prisma.tutoringSession.findMany({
      where: {
        educatorId: user.id,
        scheduledEnd: { gte: now },
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
      orderBy: { scheduledStart: "asc" },
      take: 20,
      select: {
        id: true,
        bookingId: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
        topic: true,
        learner: { select: { id: true, name: true, imageUrl: true } },
        service: { select: { title: true, subject: true } },
      },
    }),
    prisma.tutoringSession.findMany({
      where: {
        educatorId: user.id,
        status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] },
      },
      orderBy: { scheduledStart: "desc" },
      take: 30,
      select: {
        id: true,
        bookingId: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
        topic: true,
        nextStep: true,
        needsPractice: true,
        learner: { select: { id: true, name: true, imageUrl: true } },
        service: { select: { title: true, subject: true } },
      },
    }),
  ]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-7">
          <p className="text-sm font-semibold text-emerald-600">Teaching</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Teaching sessions
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage upcoming lessons and complete learner feedback from one place.
            Feedback saved here flows directly into the learner&apos;s progress record.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <CalendarDays className="size-5 text-muted-foreground" />
            <p className="mt-4 text-2xl font-bold">{upcoming.length}</p>
            <p className="text-sm text-muted-foreground">Upcoming sessions</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <CheckCircle2 className="size-5 text-emerald-600" />
            <p className="mt-4 text-2xl font-bold">
              {recent.filter((item) => item.status === "COMPLETED").length}
            </p>
            <p className="text-sm text-muted-foreground">Completed recently</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <Users className="size-5 text-muted-foreground" />
            <p className="mt-4 text-2xl font-bold">
              {new Set([...upcoming, ...recent].map((item) => item.learner.id)).size}
            </p>
            <p className="text-sm text-muted-foreground">Learners represented</p>
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="border-b border-border/70 p-5 sm:p-6">
            <h2 className="font-semibold">Upcoming</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Open a session to review the learner context and join when available.
            </p>
          </div>

          {upcoming.length ? (
            <div className="divide-y divide-border/60">
              {upcoming.map((item) => (
                <Link
                  key={item.id}
                  href={`/educator/sessions/${item.id}`}
                  className="flex flex-col gap-4 p-5 transition hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted font-semibold">
                      {(item.learner.name ?? "L").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {item.service?.title ?? "Tutoring session"}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {item.learner.name ?? "Learner"} · {item.service?.subject ?? "Tutoring"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold">
                        {formatDate(item.scheduledStart)}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock3 className="size-3" />
                        {formatTime(item.scheduledStart)} – {formatTime(item.scheduledEnd)}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(item.status)}`}>
                      {item.status.replace("_", " ")}
                    </span>
                    <ArrowRight className="hidden size-4 text-muted-foreground sm:block" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No upcoming tutoring sessions.
            </div>
          )}
        </section>

        <section className="mt-7 rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="border-b border-border/70 p-5 sm:p-6">
            <h2 className="font-semibold">Recent session records</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Completed sessions stay available for feedback updates and review.
            </p>
          </div>

          {recent.length ? (
            <div className="divide-y divide-border/60">
              {recent.map((item) => (
                <Link
                  key={item.id}
                  href={`/educator/sessions/${item.id}`}
                  className="flex flex-col gap-3 p-5 transition hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div>
                    <p className="font-semibold">
                      {item.service?.title ?? "Tutoring session"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.learner.name ?? "Learner"} · {formatDate(item.scheduledStart)}
                    </p>
                    {item.topic ? (
                      <p className="mt-1 text-xs text-muted-foreground">Topic: {item.topic}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(item.status)}`}>
                      {item.status.replace("_", " ")}
                    </span>
                    {item.status === "COMPLETED" && !item.nextStep && !item.needsPractice ? (
                      <span className="text-xs font-semibold text-amber-600">Feedback needed</span>
                    ) : null}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No completed session records yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
