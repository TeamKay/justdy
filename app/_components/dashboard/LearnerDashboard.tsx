import {
  type DashboardAccount,
  type UpcomingLearnerLesson,
  type LearningActivity,
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
  Sparkles,
  Target,
  TrendingUp,
  Video,
} from "lucide-react";

import Link from "next/link";
import type { ElementType } from "react";

type LearnerDashboardProps = {
  account: DashboardAccount;
  upcoming: UpcomingLearnerLesson[];
  activities: LearningActivity[];
  completedSessions: CompletedSession[];
  showWelcome?: boolean;
};

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ElementType;
  tone?: "blue" | "green" | "violet" | "amber";
}) {
  const tones = {
    blue: {
      surface: "bg-[#E5F1FF]",
      icon: "text-[#3475B9]",
      accent: "bg-[#6FA8E8]",
    },
    green: {
      surface: "bg-[#E5F4E6]",
      icon: "text-[#39804A]",
      accent: "bg-[#79B76C]",
    },
    violet: {
      surface: "bg-[#F0EAFE]",
      icon: "text-[#8062C4]",
      accent: "bg-[#A18ADB]",
    },
    amber: {
      surface: "bg-[#FFF2D9]",
      icon: "text-[#B27B28]",
      accent: "bg-[#E8BD63]",
    },
  };

  const selected = tones[tone];

  return (
    <article className="group relative overflow-hidden rounded-[1.6rem] border border-[#E8EEE5] bg-white p-5 shadow-[0_5px_22px_rgba(35,70,40,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#C9DFC5] hover:shadow-[0_16px_35px_rgba(35,70,40,0.09)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#718273]">{label}</p>
          <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#20442C]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${selected.surface} ${selected.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 max-w-[15rem] text-xs leading-5 text-[#879487]">
        {helper}
      </p>

      <div
        className={`absolute bottom-0 left-0 h-1 w-0 ${selected.accent} transition-all duration-300 group-hover:w-full`}
      />
    </article>
  );
}

function ProgressBar({
  value,
  label,
  detail,
  color = "bg-blue-600",
}: {
  value: number;
  label: string;
  detail: string;
  color?: string;
}) {
  const safeValue = Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {detail}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(safeValue)}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:gap-2 hover:text-blue-700 dark:text-blue-400"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function NextLessonCard({
  lesson,
}: {
  lesson?: UpcomingLearnerLesson;
}) {
  if (!lesson) {
    return (
      <section className="relative overflow-hidden rounded-[1.8rem] border border-dashed border-[#C9DEC7] bg-[#F0F8ED] p-6 sm:p-8">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-[#DDEFD8]/70" />

        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#43844D] shadow-sm">
            <CalendarDays className="h-6 w-6" />
          </div>

          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#65916A]">
            Your learning calendar
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#214A30]">
            Your next lesson is waiting.
          </h2>

          <p className="mt-2 max-w-lg text-sm leading-7 text-[#718473]">
            No upcoming lessons yet. Find a tutor and schedule a session to
            keep your learning journey moving.
          </p>

          <Link
            href="/tutoring"
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#286C40] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(40,108,64,0.16)] transition hover:-translate-y-0.5 hover:bg-[#1D5733] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A7D6A3]/50"
          >
            Find a tutor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  const readyToJoin = canJoinLesson(lesson);
  const sessionId = lesson.tutoringSessionId || lesson.id;

  const lessonHref = `/tutoring/sessions/${encodeURIComponent(
    readyToJoin ? lesson.id : sessionId,
  )}`;

  return (
    <section className="relative isolate overflow-hidden rounded-[1.8rem] bg-[#214F34] p-6 text-white shadow-[0_18px_45px_rgba(32,79,52,0.16)] sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full border-[45px] border-white/[0.06]" />
        <div className="absolute -bottom-36 right-1/3 h-72 w-72 rounded-full bg-[#6C9F5A]/20 blur-2xl" />
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#A8C96E]/10 blur-2xl" />
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-white/90">
            <CalendarDays className="h-4 w-4 text-[#D7EBAF]" />
            YOUR NEXT LESSON
          </span>

          {readyToJoin ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#B8E6A6]/15 px-3.5 py-2 text-xs font-bold text-[#D9F5C9]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#A9E58F]" />
              Ready to join
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/85">
              Upcoming
            </span>
          )}
        </div>

        <div className="mt-8 grid gap-7 md:grid-cols-[1fr_auto] md:items-end">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#C5DEB8]">
              Keep your learning momentum going
            </p>

            <h2 className="mt-2 max-w-2xl text-2xl font-black tracking-[-0.035em] sm:text-3xl">
              {lesson.service?.title ?? "Tutoring lesson"}
            </h2>

            <p className="mt-2 text-sm text-white/75">
              {lesson.subject ?? "Learning session"} with{" "}
              {lesson.educator?.name ?? "your tutor"}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-3.5 py-2.5 text-xs font-semibold text-white/90">
                <CalendarDays className="h-4 w-4 text-[#D7EBAF]" />
                {formatDate(lesson.startTime)}
              </span>

              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-3.5 py-2.5 text-xs font-semibold text-white/90">
                <Clock3 className="h-4 w-4 text-[#D7EBAF]" />
                {formatTime(lesson.startTime)} –{" "}
                {formatTime(lesson.endTime)}
              </span>
            </div>
          </div>

          <Link
            href={lessonHref}
            className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-xl bg-[#E8F5D9] px-5 py-3 text-sm font-extrabold text-[#245333] shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
          >
            {readyToJoin ? (
              <>
                <Video className="h-4 w-4" />
                Join classroom
              </>
            ) : (
              <>
                View lesson
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Link>
        </div>
      </div>
    </section>
  );
}

function LearningProgress({
  activities,
  completedSessions,
}: {
  activities: LearningActivity[];
  completedSessions: CompletedSession[];
}) {
  const completedActivities = activities.filter(
    (activity) => activity.status.toLowerCase() === "completed",
  ).length;

  const scoredActivities = activities.filter(
    (activity) =>
      activity.score !== null &&
      activity.maxScore !== null &&
      Number(activity.maxScore) > 0,
  );

  const averageScore = scoredActivities.length
    ? scoredActivities.reduce(
        (total, activity) =>
          total + (Number(activity.score) / Number(activity.maxScore)) * 100,
        0,
      ) / scoredActivities.length
    : null;

  const activityCompletion = activities.length
    ? (completedActivities / activities.length) * 100
    : 0;

  return (
   <section className="rounded-[1.7rem] border border-[#E7EEE4] bg-white p-6 shadow-[0_5px_22px_rgba(35,70,40,0.035)] sm:p-8">
      <SectionHeading
        eyebrow="Your development"
        title="Learning progress"
        description="A snapshot of your activity and results based on your recorded learning."
        href="/dashboard/progress"
        linkLabel="Full progress report"
      />

      {activities.length === 0 && completedSessions.length === 0 ? (
        <div className="mt-6 rounded-xl bg-muted/40 px-5 py-8 text-center">
          <Target className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold text-foreground">
            Your progress journey starts here
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            Complete learning activities and tutoring sessions to build your
            progress history.
          </p>
          <Link
            href="/tutoring"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Explore tutoring
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-7 grid gap-7 lg:grid-cols-2">
          <div className="space-y-6">
            <ProgressBar
              label="Activity completion"
              value={activityCompletion}
              detail={`${completedActivities} of ${activities.length}`}
              color="bg-blue-600"
            />
            <div className="rounded-xl border border-border/70 p-4">
              <p className="text-sm font-semibold text-foreground">
                Tutoring sessions completed
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {completedSessions.length}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Sessions recorded in your completed lesson history.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-xl bg-muted/40 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Average activity score
            </div>
            {averageScore !== null ? (
              <>
                <p className="mt-2 text-4xl font-bold tracking-tight text-foreground">
                  {Math.round(averageScore)}%
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Calculated from {scoredActivities.length}{" "}
                  {scoredActivities.length === 1 ? "scored activity" : "scored activities"}.
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-xl font-bold text-foreground">
                  No scores yet
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Scores will appear here when your activities include results.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function RecentLearning({
  activities,
  completedSessions,
}: {
  activities: LearningActivity[];
  completedSessions: CompletedSession[];
}) {
  const recentActivities = [...activities]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);

  const recentSessions = [...completedSessions]
    .sort(
      (a, b) =>
        new Date(b.scheduledStart).getTime() -
        new Date(a.scheduledStart).getTime(),
    )
    .slice(0, 3);

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
      <SectionHeading
        title="Recent learning"
        description="Pick up where you left off and review your latest work."
        href="/dashboard/progress"
        linkLabel="View all activity"
      />

      {recentActivities.length === 0 && recentSessions.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={GraduationCap}
            title="No learning activity yet"
            description="Book a lesson or complete an activity and your learning history will appear here."
            href="/tutoring"
            action="Start learning"
          />
        </div>
      ) : (
        <div className="mt-5 divide-y divide-border/70">
          {recentActivities.map((activity) => {
            const isCompleted =
              activity.status.toLowerCase() === "completed";

            return (
              <div
                key={`activity-${activity.id}`}
                className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      Learning activity
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(activity.createdAt)}
                      {activity.score !== null && activity.maxScore !== null
                        ? ` · Score: ${activity.score}/${activity.maxScore}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isCompleted
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    }`}
                  >
                    {activity.status}
                  </span>
                  <Link
                    href="/dashboard/progress"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Review <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}

          {recentSessions.map((session) => (
            <div
              key={`session-${session.id}`}
              className="flex flex-col gap-3 py-4 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <PersonAvatar person={session.educator} size={40} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {session.service?.title ?? "Tutoring lesson"}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {session.educator?.name ?? "Teacher"} ·{" "}
                    {formatDate(session.scheduledStart)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
                <Link
                  href="/tutoring/sessions"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Details <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function LearnerDashboard({
  account,
  upcoming,
  completedSessions,
  activities,
  showWelcome = true,
}: LearnerDashboardProps) {
  const firstName = account.name?.trim().split(/\s+/)[0] || "there";

  const completedActivities = activities.filter(
    (activity) => activity.status.toLowerCase() === "completed",
  ).length;

  const scoredActivities = activities.filter(
    (activity) =>
      activity.score !== null &&
      activity.maxScore !== null &&
      Number(activity.maxScore) > 0,
  );

  const averageScore = scoredActivities.length
    ? Math.round(
        scoredActivities.reduce(
          (total, activity) =>
            total + (Number(activity.score) / Number(activity.maxScore)) * 100,
          0,
        ) / scoredActivities.length,
      )
    : null;

  return (
   <div className="mx-auto w-full max-w-7xl space-y-7 pb-8">
     {showWelcome ? (
  <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#F0F7E9] px-6 py-8 sm:px-9 sm:py-10 lg:px-11">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#D7EBCB]/80 blur-2xl" />
      <div className="absolute bottom-[-9rem] right-[28%] h-64 w-64 rounded-full bg-[#E4EED0] blur-2xl" />
      <div className="absolute right-[16%] top-8 text-7xl font-black text-[#7EA66D]/10">
        +
      </div>
      <div className="absolute bottom-2 right-8 rotate-12 text-8xl font-black text-[#7EA66D]/10">
        ÷
      </div>
    </div>

    <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#D6E7CF] bg-white/75 px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#548052]">
          <Sparkles className="h-3.5 w-3.5" />
          Your personal learning space
        </span>

        <h1 className="mt-5 text-3xl font-black leading-tight tracking-[-0.045em] text-[#20452D] sm:text-4xl lg:text-5xl">
          Welcome back, {firstName}.
          <br />
          <span className="text-[#5B9949]">Ready to grow today?</span>
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-7 text-[#718273] sm:text-base">
          Every question you ask and every skill you practise takes you one
          step further. Your learning journey continues here.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 lg:max-w-[270px] lg:flex-col">
        <Link
          href="/dashboard/progress"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#D7E5D1] bg-white/90 px-5 py-3 text-sm font-bold text-[#315B3A] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
        >
          <TrendingUp className="h-4 w-4 text-[#55924D]" />
          View my progress
        </Link>

        <Link
          href="/tutoring"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#286C40] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(40,108,64,0.16)] transition hover:-translate-y-0.5 hover:bg-[#1D5733]"
        >
          Find a tutor
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  </section>
) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Upcoming lessons"
          value={upcoming.length}
          helper="Your scheduled tutoring sessions."
          icon={CalendarDays}
          tone="blue"
        />
        <MetricCard
          label="Completed lessons"
          value={completedSessions.length}
          helper="Tutoring sessions in your learning history."
          icon={GraduationCap}
          tone="green"
        />
        <MetricCard
          label="Completed activities"
          value={completedActivities}
          helper={`Out of ${activities.length} recorded learning activities.`}
          icon={CheckCircle2}
          tone="violet"
        />
        <MetricCard
          label="Average score"
          value={averageScore === null ? "—" : `${averageScore}%`}
          helper={
            averageScore === null
              ? "Scores will appear when graded activities are recorded."
              : `Based on ${scoredActivities.length} scored activities.`
          }
          icon={TrendingUp}
          tone="amber"
        />
      </section>

      <NextLessonCard lesson={upcoming[0]} />
    

      <LearningProgress
        activities={activities}
        completedSessions={completedSessions}
      />

      <RecentLearning
        activities={activities}
        completedSessions={completedSessions}
      />

     <section className="rounded-[1.7rem] border border-[#E1EBDD] bg-[#F2F7ED] p-6 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-card dark:text-blue-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">
              Ready for your next learning goal?
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Explore your progress report to review activity results and
              identify what to work on next.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/progress"
          className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted sm:mt-0"
        >
          Explore my progress
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
