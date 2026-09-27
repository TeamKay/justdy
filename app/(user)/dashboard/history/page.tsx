import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, GraduationCap, History as HistoryIcon } from "lucide-react";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

export default async function LearnerHistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/auth?mode=signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, canLearn: true, emailVerified: true },
  });

  if (!user) redirect("/auth?mode=signin");
  if (!user.emailVerified) redirect(`/verify-request?email=${encodeURIComponent(session.user.email ?? "")}`);
  if (!user.canLearn) redirect("/dashboard");

  const [tutoringSessions, activities] = await Promise.all([
    prisma.tutoringSession.findMany({
      where: { learnerId: user.id },
      orderBy: { scheduledStart: "desc" },
      take: 50,
      select: {
        id: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
        topic: true,
        learnerOutcome: true,
        educator: { select: { name: true } },
        service: { select: { title: true, subject: true } },
      },
    }),
    prisma.learningActivity.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        activityType: true,
        status: true,
        score: true,
        maxScore: true,
        createdAt: true,
        completedAt: true,
        resource: { select: { title: true } },
      },
    }),
  ]);

  const events = [
    ...tutoringSessions.map((item) => ({
      id: `session-${item.id}`,
      date: item.scheduledStart,
      kind: "Tutoring session",
      title: item.service?.title ?? item.topic ?? "Tutoring session",
      description: item.learnerOutcome ?? `Session with ${item.educator?.name ?? "your tutor"}.`,
      href: `/dashboard/tutoring/sessions/${item.id}`,
      completed: item.status === "COMPLETED",
    })),
    ...activities.map((item) => ({
      id: `activity-${item.id}`,
      date: item.createdAt,
      kind: "Learning activity",
      title: item.resource?.title ?? item.activityType,
      description:
        item.score !== null && item.maxScore
          ? `Score: ${Math.round((item.score / item.maxScore) * 100)}%`
          : `Status: ${item.status.toLowerCase()}`,
      href: "/dashboard/progress",
      completed: item.status.toLowerCase() === "completed" || item.completedAt !== null,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-sm font-medium text-emerald-600">Learning</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">History</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            A chronological record of your tutoring sessions and learning activity.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            <p className="mt-4 text-sm text-muted-foreground">Tutoring sessions</p>
            <p className="mt-1 text-2xl font-bold">{tutoringSessions.length}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <p className="mt-4 text-sm text-muted-foreground">Learning activities</p>
            <p className="mt-1 text-2xl font-bold">{activities.length}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <HistoryIcon className="h-5 w-5 text-amber-600" />
            <p className="mt-4 text-sm text-muted-foreground">Total records</p>
            <p className="mt-1 text-2xl font-bold">{events.length}</p>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-xl font-semibold">Learning timeline</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your most recent learning records, newest first.</p>
            </div>
          </div>

          {events.length ? (
            <div className="mt-6 divide-y">
              {events.map((event) => (
                <Link key={event.id} href={event.href} className="group flex gap-4 py-5">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    {event.kind === "Tutoring session" ? (
                      <GraduationCap className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-indigo-600" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{event.title}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{event.kind}</span>
                      {event.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(event.date)}</p>
                  </div>

                  <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Your learning history will appear here as you complete activities and tutoring sessions.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
