import { redirect } from "next/navigation";
import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  MessageSquareText,
  Target,
  TrendingUp,
} from "lucide-react";

import { getDashboardData } from "../dashboard-data";
import {
  formatDate,
  type LearningActivity,
  type CompletedSession,
} from "@/app/_components/dashboard/DashboardShared";

function dateKey(date: Date | string) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(value.getDate()).padStart(2, "0")}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getLearningDates(
  activities: LearningActivity[],
  sessions: CompletedSession[],
) {
  return new Set([
    ...activities.map((activity) =>
      dateKey(activity.completedAt ?? activity.createdAt),
    ),
    ...sessions.map((session) => dateKey(session.scheduledStart)),
  ]);
}

function getCurrentStreak(activeDates: Set<string>) {
  const today = startOfDay(new Date());
  const todayKey = dateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // A streak remains current if the learner was active today or yesterday.
  let cursor = activeDates.has(todayKey) ? today : yesterday;
  if (!activeDates.has(dateKey(cursor))) return 0;

  let streak = 0;
  while (activeDates.has(dateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getScore(activity: LearningActivity) {
  if (
    activity.score === null ||
    activity.maxScore === null ||
    Number(activity.maxScore) <= 0
  ) {
    return null;
  }

  return Math.min(
    100,
    Math.max(0, (Number(activity.score) / Number(activity.maxScore)) * 100),
  );
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: ElementType;
}) {
  return (
    <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{note}</p>
    </article>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function WeeklyActivity({
  activities,
  sessions,
}: {
  activities: LearningActivity[];
  sessions: CompletedSession[];
}) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = dateKey(date);

    const activityCount = activities.filter(
      (activity) =>
        dateKey(activity.completedAt ?? activity.createdAt) === key,
    ).length;

    const sessionCount = sessions.filter(
      (session) => dateKey(session.scheduledStart) === key,
    ).length;

    return {
      key,
      label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
        date,
      ),
      count: activityCount + sessionCount,
      isToday: key === dateKey(today),
    };
  });

  const max = Math.max(1, ...days.map((day) => day.count));

  return (
    <Panel
      title="Your weekly activity"
      description="Recorded learning activities and completed tutoring sessions over the last seven days."
    >
      <div className="flex h-44 items-end justify-between gap-2">
        {days.map((day) => (
          <div
            key={day.key}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {day.count || ""}
            </span>
            <div className="flex h-28 w-full items-end justify-center">
              <div
                className={`w-full max-w-10 rounded-t-lg transition-all ${
                  day.isToday
                    ? "bg-blue-600"
                    : "bg-blue-200 dark:bg-blue-900"
                }`}
                style={{
                  height: `${day.count ? Math.max(9, (day.count / max) * 100) : 3}%`,
                  opacity: day.count ? 1 : 0.35,
                }}
                title={`${day.count} learning records`}
              />
            </div>
            <span
              className={`text-xs ${
                day.isToday
                  ? "font-bold text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground"
              }`}
            >
              {day.label}
            </span>
          </div>
        ))}
      </div>
      {days.every((day) => day.count === 0) ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          No learning records in this seven-day period yet.
        </p>
      ) : null}
    </Panel>
  );
}

function SubjectBreakdown({ sessions }: { sessions: CompletedSession[] }) {
  const counts = new Map<string, number>();

  for (const session of sessions) {
    const subject = session.service?.subject?.trim() || "Other";
    counts.set(subject, (counts.get(subject) ?? 0) + 1);
  }

  const subjects = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...subjects.map(([, count]) => count));

  return (
    <Panel
      title="Subject activity"
      description="Completed tutoring sessions grouped by the subject recorded on each service."
    >
      {subjects.length ? (
        <div className="space-y-5">
          {subjects.map(([subject, count]) => (
            <div key={subject}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">
                  {subject}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {count} {count === 1 ? "session" : "sessions"}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-muted/40 px-4 py-8 text-center">
          <BookOpen className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            No subject history yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Subject activity will appear after completed tutoring sessions
            with a subject recorded.
          </p>
        </div>
      )}
    </Panel>
  );
}

function ScoreHistory({ activities }: { activities: LearningActivity[] }) {
  const scored = activities
    .filter((activity) => getScore(activity) !== null)
    .slice(0, 8)
    .reverse();

  return (
    <Panel
      title="Assessment results"
      description="Scores from your recorded learning activities. Only activities with a valid score are included."
    >
      {scored.length ? (
        <div className="space-y-4">
          {scored.map((activity) => {
            const score = getScore(activity) ?? 0;

            return (
              <div key={activity.id}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {activity.activityType.replace(/_/g, " ")}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(activity.completedAt ?? activity.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                    {Math.round(score)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-muted/40 px-4 py-8 text-center">
          <TrendingUp className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            No scored activities yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your assessment results will appear here when scores are saved.
          </p>
        </div>
      )}
    </Panel>
  );
}

function TutorFeedback({ sessions }: { sessions: CompletedSession[] }) {
  const feedback = sessions.filter(
    (session) =>
      session.strengths ||
      session.needsPractice ||
      session.nextStep ||
      session.tutorNotes ||
      session.learnerOutcome,
  );

  return (
    <Panel
      title="Tutor feedback"
      description="Recommendations and notes recorded after your completed tutoring sessions."
    >
      {feedback.length ? (
        <div className="space-y-4">
          {feedback.slice(0, 5).map((session) => (
            <article
              key={session.id}
              className="rounded-xl border border-border/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-foreground">
                  {session.service?.title ?? session.topic ?? "Tutoring session"}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatDate(session.scheduledStart)}
                </span>
              </div>
              {session.strengths ? (
                <div className="mt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Strengths
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {session.strengths}
                  </p>
                </div>
              ) : null}
              {session.needsPractice ? (
                <div className="mt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Areas to practice
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {session.needsPractice}
                  </p>
                </div>
              ) : null}
              {session.nextStep ? (
                <div className="mt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                    Recommended next step
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {session.nextStep}
                  </p>
                </div>
              ) : null}
              {session.tutorNotes ? (
                <div className="mt-3 border-t border-border/70 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Tutor notes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {session.tutorNotes}
                  </p>
                </div>
              ) : null}
              {session.learnerOutcome ? (
                <div className="mt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Learning outcome
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {session.learnerOutcome}
                  </p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-muted/40 px-4 py-8 text-center">
          <MessageSquareText className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            No tutor feedback available yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Feedback will show here when your tutor adds notes to a completed
            session.
          </p>
        </div>
      )}
    </Panel>
  );
}

export default async function LearnerProgressPage() {
  const data = await getDashboardData();

  if (!data.account.isLearner) {
    redirect(
      data.account.isTeacherAdmin
        ? "/dashboard/teacher"
        : "/auth?mode=signin",
    );
  }

  const activities = data.learningActivities;
  const sessions = data.completedSessions;
  const completedActivities = activities.filter(
    (activity) => activity.status.toLowerCase() === "completed",
  );
  const scoredActivities = activities
    .map((activity) => getScore(activity))
    .filter((score): score is number => score !== null);

  const averageScore = scoredActivities.length
    ? Math.round(
        scoredActivities.reduce((sum, score) => sum + score, 0) /
          scoredActivities.length,
      )
    : null;

  const learningDates = getLearningDates(activities, sessions);
  const streak = getCurrentStreak(learningDates);

  const totalLearningRecords = activities.length + sessions.length;

  const milestones = [
    {
      title: "First learning activity",
      description: "Record your first learning activity.",
      earned: activities.length >= 1,
    },
    {
      title: "First completed lesson",
      description: "Complete your first tutoring session.",
      earned: sessions.length >= 1,
    },
    {
      title: "Five learning activities",
      description: "Build a history of five learning activities.",
      earned: activities.length >= 5,
    },
    {
      title: "Five completed lessons",
      description: "Complete five tutoring sessions.",
      earned: sessions.length >= 5,
    },
    {
      title: "First assessment score",
      description: "Receive your first recorded activity score.",
      earned: scoredActivities.length >= 1,
    },
  ];

  const earnedMilestones = milestones.filter((item) => item.earned).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
              YOUR LEARNING JOURNEY
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              My learning progress
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Understand your learning activity, review your results, and use
              tutor feedback to decide what to work on next.
            </p>
          </div>
          <Link
            href="/tutoring"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Book a lesson <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Learning activities"
          value={activities.length}
          note={`${completedActivities.length} marked as completed`}
          icon={BookOpen}
        />
        <Metric
          label="Completed lessons"
          value={sessions.length}
          note="Tutoring sessions in your history"
          icon={GraduationCap}
        />
        <Metric
          label="Average activity score"
          value={averageScore === null ? "—" : `${averageScore}%`}
          note={
            averageScore === null
              ? "No scored activities recorded yet"
              : `From ${scoredActivities.length} scored activities`
          }
          icon={TrendingUp}
        />
        <Metric
          label="Learning streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          note="Consecutive days with recorded learning"
          icon={Flame}
        />
      </section>

      {totalLearningRecords === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <Target className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold text-foreground">
            Your progress story starts here
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Once you complete learning activities or tutoring sessions, this
            page will show your learning history, scores, subject activity,
            streaks, and tutor feedback.
          </p>
          <Link
            href="/tutoring"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Find a tutor <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      ) : (
        <>
          <section className="grid gap-5 lg:grid-cols-2">
            <WeeklyActivity activities={activities} sessions={sessions} />
            <SubjectBreakdown sessions={sessions} />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <ScoreHistory activities={activities} />
            <Panel
              title="Learning milestones"
              description="Milestones earned from the learning records currently available in your account."
            >
              <div className="mb-4 flex items-center justify-between rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Milestones achieved
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Based on your recorded activity
                  </p>
                </div>
                <p className="text-2xl font-bold tabular-nums text-blue-700 dark:text-blue-300">
                  {earnedMilestones}/{milestones.length}
                </p>
              </div>
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.title}
                    className="flex items-center gap-3 rounded-xl border border-border/70 p-3"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        milestone.earned
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {milestone.earned ? (
                        <Award className="h-5 w-5" />
                      ) : (
                        <Clock3 className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {milestone.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {milestone.description}
                      </p>
                    </div>
                    {milestone.earned ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        In progress
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <TutorFeedback sessions={sessions} />
        </>
      )}

      <div className="rounded-2xl border border-border/70 bg-muted/30 p-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-blue-600 shadow-sm dark:text-blue-400">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold text-foreground">Keep your learning moving</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Visit your lessons page to see upcoming sessions and continue
              learning with your tutor.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/sessions"
          className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted sm:mt-0"
        >
          My lessons <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
