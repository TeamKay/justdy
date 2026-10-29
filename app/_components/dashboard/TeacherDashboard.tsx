import Link from "next/link";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

import ClientGrowthChart from "@/app/_components/ClientGrowthChart";

import {
  type DashboardAccount,
  type UpcomingTeacherLesson,
  type CompletedSession,
  type AdminStats,
  type ClientGrowthPoint,
  type LatestPayout,
  type Person,
  formatDate,
  formatTime,
  SectionHeader,
  EmptyState,
} from "@/app/_components/dashboard/DashboardShared";

type TeacherDashboardProps = {
  account: DashboardAccount;
  upcoming: UpcomingTeacherLesson[];
  completedSessions: CompletedSession[];
  latestPayout: LatestPayout;
  adminStats: AdminStats;
  clientGrowth: ClientGrowthPoint[];
  recentClients: Person[];
  showWelcome?: boolean;
};

export default function TeacherDashboard({
  account,
  upcoming,
  completedSessions,
  adminStats,
  clientGrowth,
  showWelcome = true,
}: TeacherDashboardProps) {
  const latestGrowth = clientGrowth[clientGrowth.length - 1]?.value ?? 0;

  const previousGrowth = clientGrowth[clientGrowth.length - 2]?.value ?? 0;

  const growthPercent =
    previousGrowth > 0
      ? Math.round(((latestGrowth - previousGrowth) / previousGrowth) * 100)
      : null;

  return (
    <div className="space-y-5">
      {showWelcome ? (
        <section className="flex flex-col gap-5 p-0 sm:py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-3xl">
              Welcome back, {account.name.split(" ")[0]}.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              A focused view of your tutoring business — clients, bookings,
              sessions, and growth.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/tutoring/sessions"
              className="inline-flex h-11 items-center gap-2 rounded-sm border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
            >
              <CalendarDays className="h-4 w-4" />
              View bookings
            </Link>

            <Link
              href="/educator"
              className="inline-flex h-11 items-center gap-2 rounded-sm bg-card px-4 text-sm font-semibold text-white hover:bg-emerald-950"
            >
              <GraduationCap className="h-4 w-4" />
              Teaching workspace
            </Link>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(300px,0.7fr)]">
        <section className="rounded-xl border border-border/70 bg-card p-5 sm:p-6">
          <div className="mb-6 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
              <div className="px-5 py-4 sm:px-6">
                <p className="text-xs font-medium text-muted-foreground">
                  New clients this month
                </p>

                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  {latestGrowth}
                </p>
              </div>

              <div className="px-5 py-4 sm:px-6">
                <p className="text-xs font-medium text-muted-foreground">
                  Total registered users
                </p>

                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  {adminStats?.totalUsers ?? 0}
                </p>
              </div>

              <div className="px-5 py-4 sm:px-6">
                <p className="text-xs font-medium text-muted-foreground">
                  Scheduled tutoring
                </p>

                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  {adminStats?.scheduledBookings ?? upcoming.length}
                </p>
              </div>

              <div className="px-5 py-4 sm:px-6">
                <p className="text-xs font-medium text-muted-foreground">
                  Completed sessions
                </p>

                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  {adminStats?.completedSessions ?? completedSessions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between gap-4">
            {growthPercent !== null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <TrendingUp className="h-3.5 w-3.5" />
                {growthPercent}% vs previous month
              </span>
            ) : null}
          </div>

          <ClientGrowthChart points={clientGrowth} />
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-6">
          <SectionHeader
            eyebrow="Schedule"
            title="Upcoming lessons"
            description="Your upcoming teaching sessions, starting with the next one."
            href="/tutoring/sessions"
            linkText="View all"
          />

          {upcoming.length ? (
            <div className="mt-5 space-y-3">
              {upcoming.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    index === 0
                      ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30"
                      : "border-border/70 bg-background hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        index === 0
                          ? "bg-emerald-900 text-white dark:bg-emerald-500 dark:text-emerald-950"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {lesson.student?.name ?? "Learner"}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {lesson.service?.title ?? "Tutoring lesson"}
                          </p>
                        </div>

                        {index === 0 ? (
                          <span className="shrink-0 rounded-full bg-emerald-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-emerald-500 dark:text-emerald-950">
                            Next
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-3 text-xs font-medium text-foreground">
                        {lesson.subject ?? "Mathematics"}
                        {lesson.gradeLevel ? ` · ${lesson.gradeLevel}` : ""}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{formatDate(lesson.startTime)}</span>

                        <span className="hidden h-3 w-px bg-border sm:block" />

                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {formatTime(lesson.startTime)} –{" "}
                          {formatTime(lesson.endTime)}
                        </span>
                      </div>

                      <Link
                        href={`/tutoring/sessions/${lesson.id}`}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        Open lesson
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                icon={CalendarDays}
                title="No upcoming lessons"
                description="Scheduled tutoring lessons will appear here when learners book your services."
                href="/educator/availability"
                action="Manage availability"
              />
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
