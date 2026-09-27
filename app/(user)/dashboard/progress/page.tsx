import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, GraduationCap, Target, TrendingUp } from "lucide-react";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

function asTopics(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export default async function LearnerProgressPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/auth?mode=signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, canLearn: true, emailVerified: true },
  });

  if (!user) redirect("/auth?mode=signin");
  if (!user.emailVerified) redirect(`/verify-request?email=${encodeURIComponent(session.user.email ?? "")}`);
  if (!user.canLearn) redirect("/dashboard");

  const [sessions, activities] = await Promise.all([
    prisma.tutoringSession.findMany({
      where: { learnerId: user.id, status: "COMPLETED" },
      orderBy: { scheduledStart: "desc" },
      take: 30,
      select: {
        id: true,
        scheduledStart: true,
        topic: true,
        topicsCovered: true,
        strengths: true,
        needsPractice: true,
        nextStep: true,
        learnerOutcome: true,
        educator: { select: { name: true } },
        service: { select: { title: true, subject: true } },
      },
    }),
    prisma.learningActivity.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
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

  const scored = activities.filter((a) => a.score !== null && a.maxScore !== null && a.maxScore > 0);
  const averageScore = scored.length
    ? Math.round(scored.reduce((sum, a) => sum + ((a.score ?? 0) / (a.maxScore ?? 1)) * 100, 0) / scored.length)
    : null;

  const completedActivities = activities.filter(
    (a) => a.status.toLowerCase() === "completed" || a.completedAt !== null,
  ).length;

  const practiceAreas = Array.from(
    new Set(
      sessions
        .flatMap((s) => (s.needsPractice ? [s.needsPractice.trim()] : []))
        .filter(Boolean),
    ),
  ).slice(0, 6);

  const nextSteps = sessions
    .filter((s) => s.nextStep?.trim())
    .slice(0, 4);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-sm font-medium text-emerald-600">Learning</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">My Progress</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            See your learning activity alongside the outcomes and next steps from tutoring sessions.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <p className="mt-4 text-sm text-muted-foreground">Recent score</p>
            <p className="mt-1 text-2xl font-bold">{averageScore !== null ? `${averageScore}%` : "—"}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
            <p className="mt-4 text-sm text-muted-foreground">Completed activities</p>
            <p className="mt-1 text-2xl font-bold">{completedActivities}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <GraduationCap className="h-5 w-5 text-amber-600" />
            <p className="mt-4 text-sm text-muted-foreground">Tutoring sessions</p>
            <p className="mt-1 text-2xl font-bold">{sessions.length}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <Target className="h-5 w-5 text-rose-600" />
            <p className="mt-4 text-sm text-muted-foreground">Practice areas</p>
            <p className="mt-1 text-2xl font-bold">{practiceAreas.length}</p>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Practice focus</h2>
              <p className="mt-1 text-sm text-muted-foreground">Areas tutors have identified for continued practice.</p>
            </div>
            <Target className="hidden h-5 w-5 text-rose-600 sm:block" />
          </div>

          {practiceAreas.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {practiceAreas.map((area) => (
                <div key={area} className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-sm leading-6">{area}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Practice areas from completed tutoring sessions will appear here.
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Latest learning activity</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your recent resources and assessment activity.</p>
              </div>
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>

            {activities.length ? (
              <div className="mt-5 divide-y">
                {activities.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{activity.resource?.title ?? activity.activityType}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(activity.createdAt)}</p>
                    </div>
                    {activity.score !== null && activity.maxScore ? (
                      <span className="shrink-0 text-sm font-semibold">
                        {Math.round((activity.score / activity.maxScore) * 100)}%
                      </span>
                    ) : (
                      <span className="text-xs capitalize text-muted-foreground">{activity.status.toLowerCase()}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Your learning activity will appear here.
              </div>
            )}
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Next steps from tutoring</h2>
                <p className="mt-1 text-sm text-muted-foreground">Continue from the recommendations in your recent sessions.</p>
              </div>
              <Clock3 className="h-5 w-5 text-indigo-600" />
            </div>

            {nextSteps.length ? (
              <div className="mt-5 space-y-3">
                {nextSteps.map((item) => (
                  <Link key={item.id} href={`/dashboard/tutoring/sessions/${item.id}`} className="group block rounded-2xl border p-4 transition hover:border-emerald-300 hover:shadow-sm">
                    <p className="text-sm leading-6">{item.nextStep}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.service?.title ?? item.topic ?? "Tutoring session"} · {formatDate(item.scheduledStart)}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      View session <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Next steps from completed tutoring sessions will appear here.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Recent tutoring outcomes</h2>
              <p className="mt-1 text-sm text-muted-foreground">A longitudinal view of your latest completed lessons.</p>
            </div>
            <Link href="/dashboard/tutoring/sessions" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              View all
            </Link>
          </div>

          <div className="mt-5 divide-y">
            {sessions.slice(0, 6).map((item) => {
              const topics = asTopics(item.topicsCovered);
              return (
                <Link key={item.id} href={`/dashboard/tutoring/sessions/${item.id}`} className="group flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.service?.title ?? item.topic ?? "Tutoring session"}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {item.educator?.name ?? "Tutor"} · {formatDate(item.scheduledStart)}
                      {topics.length ? ` · ${topics.slice(0, 2).join(", ")}` : ""}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                </Link>
              );
            })}
            {!sessions.length ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Completed tutoring outcomes will appear here.</div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
