import {
  type DashboardAccount,
  type UpcomingLearnerLesson,
  type LearningActivity,
  type CourseEnrollmentSummary,
  type CompletedSession,
  PersonAvatar,
  canJoinLesson,
  formatDate,
  formatTime,
  EmptyState,
} from "@/app/_components/dashboard/DashboardShared";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Search,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";

import Link from "next/link";

type LearnerDashboardProps = {
  account: DashboardAccount;
  upcoming: UpcomingLearnerLesson[];
  activities: LearningActivity[];
  courseEnrollments: CourseEnrollmentSummary[];
  completedSessions: CompletedSession[];
  showWelcome?: boolean;
};

function StatusBadge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "indigo" | "emerald" | "amber";
}) {
  const styles = {
    neutral: "border-border bg-muted text-muted-foreground",
    indigo:
      "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

function TypeBadge({
  type,
}: {
  type: "lesson" | "course" | "activity" | "history";
}) {
  const config = {
    lesson: {
      label: "Next lesson",
      icon: CalendarDays,
      className:
        "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
    },
    course: {
      label: "Online learning",
      icon: BookOpen,
      className:
        "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
    },
    activity: {
      label: "Recent activity",
      icon: Sparkles,
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    },
    history: {
      label: "Recent lesson",
      icon: CheckCircle2,
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    },
  }[type];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const value = Math.min(100, Math.max(0, Number(progress)));

  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-lg bg-muted">
        <div
          className="h-full rounded-lg bg-indigo-600 transition-all dark:bg-indigo-500"
          style={{ width: `${value}%` }}
        />
      </div>

      <span className="shrink-0 text-xs font-semibold text-muted-foreground">
        {Math.round(value)}%
      </span>
    </div>
  );
}

function LearningOverview({
  upcoming,
  activities,
  courseEnrollments,
  completedSessions,
}: {
  upcoming: UpcomingLearnerLesson[];
  activities: LearningActivity[];
  courseEnrollments: CourseEnrollmentSummary[];
  completedSessions: CompletedSession[];
}) {
  const nextLesson = upcoming[0];

  const rows = [
    ...(nextLesson
      ? [
          {
            id: `lesson-${nextLesson.id}`,
            type: "lesson" as const,

            content: (
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {nextLesson.service?.title ?? "Tutoring lesson"}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>{nextLesson.educator?.name ?? "Teacher"}</span>

                  <span aria-hidden="true">•</span>

                  <span>{nextLesson.subject ?? "Mathematics"}</span>
                </div>
              </div>
            ),

            date: (
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(nextLesson.startTime)}
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatTime(nextLesson.startTime)} –{" "}
                  {formatTime(nextLesson.endTime)}
                </p>
              </div>
            ),

            status: canJoinLesson(nextLesson) ? (
              <StatusBadge variant="emerald">
                <span className="mr-1 h-1.5 w-1.5 rounded-lg bg-white" />
                Ready to join
              </StatusBadge>
            ) : (
              <StatusBadge variant="indigo">Upcoming</StatusBadge>
            ),

            action: (
              <Link
                href={
                  canJoinLesson(nextLesson)
                    ? `/tutoring/sessions/${encodeURIComponent(nextLesson.id)}`
                    : nextLesson.tutoringSessionId
                      ? `/tutoring/sessions/${encodeURIComponent(
                          nextLesson.tutoringSessionId,
                        )}`
                      : `/tutoring/sessions/${encodeURIComponent(
                          nextLesson.id,
                        )}`
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                {canJoinLesson(nextLesson) ? (
                  <>
                    <Video className="h-3.5 w-3.5" />
                    Join Now
                  </>
                ) : (
                  <>
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Link>
            ),
          },
        ]
      : []),

    ...courseEnrollments.slice(0, 3).map((enrollment) => {
      const progress = Math.min(
        100,
        Math.max(0, Number(enrollment.progress ?? 0)),
      );

      return {
        id: `course-${enrollment.id}`,
        type: "course" as const,

        content: (
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {enrollment.course.title}
            </p>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {enrollment.course.category ??
                enrollment.course.level ??
                "Online course"}
            </p>

            <ProgressBar progress={progress} />
          </div>
        ),

        date: (
          <div>
            <p className="text-sm font-semibold text-foreground">
              {Math.round(progress)}% complete
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {enrollment.status === "Active"
                ? "In progress"
                : enrollment.status}
            </p>
          </div>
        ),

        status:
          progress >= 100 ? (
            <StatusBadge variant="emerald">Completed</StatusBadge>
          ) : (
            <StatusBadge variant="indigo">Learning</StatusBadge>
          ),

        action: (
          <Link
            href={`/courses/${encodeURIComponent(enrollment.course.slug)}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ),
      };
    }),

    ...activities.slice(0, 3).map((activity) => ({
      id: `activity-${activity.id}`,
      type: "activity" as const,

      content: (
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {activity.resource?.title ?? "Learning activity"}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {activity.activityType}
          </p>
        </div>
      ),

      date: (
        <div>
          <p className="text-sm font-semibold text-foreground">
            {formatDate(activity.createdAt)}
          </p>

          {activity.score !== null && activity.maxScore !== null ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Score: {activity.score}/{activity.maxScore}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Learning activity
            </p>
          )}
        </div>
      ),

      status:
        activity.status.toLowerCase() === "completed" ? (
          <StatusBadge variant="emerald">Completed</StatusBadge>
        ) : (
          <StatusBadge variant="amber">{activity.status}</StatusBadge>
        ),

      action: (
        <Link
          href="/dashboard/progress"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
        >
          Review
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ),
    })),

    ...completedSessions.slice(0, 3).map((session) => ({
      id: `history-${session.id}`,
      type: "history" as const,

      content: (
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar person={session.educator} size={38} />

          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {session.service?.title ?? "Tutoring lesson"}
            </p>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {session.educator?.name ?? "Teacher"}
            </p>
          </div>
        </div>
      ),

      date: (
        <div>
          <p className="text-sm font-semibold text-foreground">
            {formatDate(session.scheduledStart)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {session.service?.subject ?? session.topic ?? "Tutoring"}
          </p>
        </div>
      ),

      status: (
        <StatusBadge variant="emerald">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Completed
        </StatusBadge>
      ),

      action: (
        <Link
          href="/tutoring/sessions"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
        >
          Details
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ),
    })),
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-border/70 bg-white shadow-sm">
      <div className="border-b border-border/70 bg-muted/30 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Learning overview
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Your lessons, courses, activities, and recent progress in one
              place.
            </p>
          </div>

          <Link
            href="/dashboard/progress"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            View progress
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {rows.length ? (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-212.5">
              <thead>
                <tr className="border-b border-border/70 bg-muted/20 text-left">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Type
                  </th>

                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Learning
                  </th>

                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>

                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/60 last:border-0 transition hover:bg-muted/20"
                  >
                    <td className="px-5 py-4 align-middle">
                      <TypeBadge type={row.type} />
                    </td>

                    <td className="px-5 py-4 align-middle">{row.content}</td>

                    <td className="px-5 py-4 align-middle">{row.date}</td>

                    <td className="px-5 py-4 align-middle">{row.status}</td>

                    <td className="px-5 py-4 text-right align-middle">
                      {row.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-border/60 md:hidden">
            {rows.map((row) => (
              <div key={row.id} className="space-y-4 p-5">
                <TypeBadge type={row.type} />

                <div>{row.content}</div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>{row.date}</div>

                  <div>{row.status}</div>

                  <div className="ml-auto">{row.action}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="px-5 py-12 sm:px-6">
          <EmptyState
            icon={GraduationCap}
            title="Your learning overview is empty"
            description="Book a lesson or start an online course and your learning activity will appear here."
            href="/tutoring"
            action="Start learning"
          />
        </div>
      )}
    </section>
  );
}

export default function LearnerDashboard({
  account,
  upcoming,
  activities,
  courseEnrollments,
  completedSessions,
  showWelcome = true,
}: LearnerDashboardProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Welcome */}
      {showWelcome ? (
        <section className="p-0 sm:p-0">
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-2xl">
            Welcome back, {account.name.split(" ")[0]}.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Keep your learning moving with focused lessons, online courses,
            practice, and tutoring.
          </p>
        </section>
      ) : null}

      {/* Quick actions */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {account.canBookTutoring ? (
          <Link
            href="/tutoring"
            className="group rounded-lg border border-border/70 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-indigo-950/50">
              <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Find the right teacher and book your next lesson.
            </p>

            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition group-hover:gap-2 dark:text-indigo-400">
              Find a tutor
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ) : null}

        <Link
          href="/dashboard/sessions"
          className="group rounded-lg border border-border/70 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
            <CalendarDays className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            View upcoming and completed tutoring sessions.
          </p>

          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 transition group-hover:gap-2 dark:text-emerald-400">
            My lessons
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <Link
          href="/dashboard/progress"
          className="group rounded-lg border border-border/70 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/50">
            <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Feedback, practices, and learning activity.
          </p>

          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet-700 transition group-hover:gap-2 dark:text-violet-400">
            My progress
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </section>

      {/* Unified learning table */}
      <LearningOverview
        upcoming={upcoming}
        activities={activities}
        courseEnrollments={courseEnrollments}
        completedSessions={completedSessions}
      />
    </div>
  );
}
