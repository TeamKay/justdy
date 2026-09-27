import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  BookOpen,
  Clock3,
  GraduationCap,
  Search,
  TrendingUp,
  Users,
  Video,
  Wallet,
} from "lucide-react";

import ClientGrowthChart from "@/app/_components/ClientGrowthChart";

type Person = {
  id: string;
  name: string | null;
  imageUrl: string | null;
};

type Service = {
  id: string;
  title: string;
  durationMinutes: number | null;
  price: number | null;
  currency: string;
};

type UpcomingLearnerLesson = {
  id: string;
  startTime: Date;
  endTime: Date;
  subject: string | null;
  gradeLevel: string | null;
  status: string;
  educator: Person | null;
  service: Service | null;
};

type UpcomingTeacherLesson = {
  id: string;
  startTime: Date;
  endTime: Date;
  subject: string | null;
  gradeLevel: string | null;
  status: string;
  student: Person | null;
  service: Service | null;
};

type CourseEnrollmentSummary = {
  id: string;
  progress: number;
  status: string;
  course: {
    id: string;
    title: string;
    slug: string;
    smallDescription: string | null;
    category: string | null;
    level: string;
    duration: number | null;
  };
};

type LearningActivity = {
  id: string;
  activityType: string;
  status: string;
  score: number | null;
  maxScore: number | null;
  createdAt: Date;
  completedAt: Date | null;
  resource: {
    id: string;
    title: string;
  } | null;
};

type CompletedSession = {
  id: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  topic: string | null;
  topicsCovered: unknown;
  strengths: string | null;
  needsPractice: string | null;
  nextStep: string | null;
  tutorNotes: string | null;
  learnerOutcome: string | null;
  learner: Person | null;
  educator: Person | null;
  service: {
    id: string;
    title: string;
    subject: string | null;
  } | null;
};

type LatestPayout = {
  id: string;
  amount: number;
  netAmount: number;
  status: string;
  createdAt: Date;
} | null;

type AdminStats = {
  totalUsers: number;
  pendingTeacherApprovals: number;
  totalBookings: number;
  scheduledBookings: number;
  completedSessions: number;
  payoutCount: number;
} | null;

type ClientGrowthPoint = {
  date: string;
  label: string;
  value: number;
};

type DashboardViewProps = {
  account: {
    name: string;
    email: string;
    imageUrl: string | null;
    isLearner: boolean;
    isTeacherAdmin: boolean;
    canBookTutoring: boolean;
    canReceivePayouts: boolean;
    teachingVerification: string | null;
    teachingHeadline: string | null;
  };

  learnerUpcoming: UpcomingLearnerLesson[];
  teacherUpcoming: UpcomingTeacherLesson[];
  completedSessions: CompletedSession[];
  learningActivities: LearningActivity[];
  courseEnrollments: CourseEnrollmentSummary[];
  latestPayout: LatestPayout;
  adminStats: AdminStats;
  clientGrowth: ClientGrowthPoint[];
  recentClients: Person[];
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatMoney(amount: number, currency = "GHS") {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}


function getInitials(name: string | null | undefined) {
  if (!name) return "J";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function PersonAvatar({
  person,
  size = 44,
}: {
  person: Person | null | undefined;
  size?: number;
}) {
  if (person?.imageUrl) {
    return (
      <Image
        src={person.imageUrl}
        alt={person.name ?? "User"}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center bg-amber-400 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
      style={{ width: size, height: size }}
    >
      {getInitials(person?.name)}
    </div>
  );
}

const JOIN_WINDOW_MINUTES = 30;

function canJoinLesson(lesson: {
  startTime: Date;
  endTime: Date;
  status: string;
}) {
  const now = Date.now();
  const start = new Date(lesson.startTime).getTime();
  const end = new Date(lesson.endTime).getTime();

  const joinWindowStart =
    start - JOIN_WINDOW_MINUTES * 60 * 1000;

  return (
    lesson.status === "Scheduled" &&
    now >= joinWindowStart &&
    now < end
  );
}

function SectionHeader({
  title,
  href,
  linkText,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-0 flex items-end justify-between gap-4 bg-card">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>

      {href && linkText ? (
        <Link
          href={href}
          className="hidden items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 sm:flex dark:text-indigo-400"
        >
          {linkText}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  action,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="border border-dashed border-border px-6 py-12 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {href && action ? (
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950"
        >
          {action}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}



function TeacherAdminDashboard({
  account,
  upcoming,
  completedSessions,
  adminStats,
  clientGrowth,
}: {
  account: DashboardViewProps["account"];
  upcoming: UpcomingTeacherLesson[];
  completedSessions: CompletedSession[];
  latestPayout: LatestPayout;
  adminStats: AdminStats;
  clientGrowth: ClientGrowthPoint[];
  recentClients: Person[];
}) {
  const latestGrowth = clientGrowth[clientGrowth.length - 1]?.value ?? 0;
  const previousGrowth = clientGrowth[clientGrowth.length - 2]?.value ?? 0;
  const growthPercent =
    previousGrowth > 0
      ? Math.round(((latestGrowth - previousGrowth) / previousGrowth) * 100)
      : null;

  return (
    <div className="space-y-5">
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

function CourseProgressSection({
  enrollments,
}: {
  enrollments: CourseEnrollmentSummary[];
}) {
  return (
    <section>
      <SectionHeader
        eyebrow="Courses"
        title="Continue learning"
        description="Pick up where you left off in your enrolled courses."
      />

      {enrollments.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {enrollments.slice(0, 6).map((enrollment) => {
            const progress = Math.max(0, Math.min(100, enrollment.progress));

            return (
              <div
                key={enrollment.id}
                className="rounded-xl border border-border/70 bg-card p-5 "
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">
                    {enrollment.status}
                  </span>
                </div>

                <h3 className="mt-5 line-clamp-2 font-semibold">
                  {enrollment.course.title}
                </h3>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                  {enrollment.course.smallDescription ??
                    enrollment.course.category ??
                    `${enrollment.course.level} course`}
                </p>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{enrollment.course.level}</span>
                  {enrollment.course.duration ? (
                    <span>{enrollment.course.duration} min</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No enrolled courses yet"
          description="Courses you enroll in will appear here with your saved progress."
          href="/products"
          action="Browse courses"
        />
      )}
    </section>
  );
}

function LearnerDashboard({
  account,
  upcoming,
  activities,
  courseEnrollments,
  completedSessions,
}: {
  account: DashboardViewProps["account"];
  upcoming: UpcomingLearnerLesson[];
  activities: LearningActivity[];
  courseEnrollments: CourseEnrollmentSummary[];
  completedSessions: CompletedSession[];
}) {
  const nextLesson = upcoming[0];

  return (
    <div className="space-y-7">
      <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          Learner dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back, {account.name.split(" ")[0]}.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Keep your learning moving with focused lessons, progress, and
          practice.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {account.canBookTutoring ? (
          <Link
            href="/tutoring"
            className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="mt-4 font-semibold">Find a tutor</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Find the right teacher and book your next lesson.
            </p>
          </Link>
        ) : null}

        <Link
          href="/tutoring/sessions"
          className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <CalendarDays className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="mt-4 font-semibold">My lessons</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View your upcoming and completed tutoring sessions.
          </p>
        </Link>

        <Link
          href="/progress"
          className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="mt-4 font-semibold">My progress</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review feedback, practice areas, and learning activity.
          </p>
        </Link>
      </section>

      <section>
        <SectionHeader
          eyebrow="Schedule"
          title="Next lesson"
          href="/tutoring/sessions"
          linkText="View all"
        />
        {nextLesson ? (
          <div className="rounded-2xl bg-indigo-600 p-6 text-white shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-100">
                  {nextLesson.service?.title ?? "Tutoring lesson"}
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  {nextLesson.educator?.name ?? "Teacher"}
                </h2>
                <p className="mt-1 text-sm text-indigo-100">
                  {nextLesson.subject ?? "Mathematics"}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-sm font-semibold">
                  {formatDate(nextLesson.startTime)}
                </p>
                <p className="mt-1 text-sm text-indigo-100">
                  {formatTime(nextLesson.startTime)} –{" "}
                  {formatTime(nextLesson.endTime)}
                </p>
                {(() => {
  const joinable = canJoinLesson(nextLesson);

  return (
    <Link
      href={
        joinable
          ? `/tutoring/sessions/${encodeURIComponent(
              nextLesson.id,
            )}`
          : `/dashboard/tutoring/sessions/${encodeURIComponent(
              nextLesson.id,
            )}`
      }
      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
    >
      {joinable ? (
        <>
          <Video className="h-3.5 w-3.5" />
          Join now
        </>
      ) : (
        <>
          Open lesson
          <ArrowRight className="h-3.5 w-3.5" />
        </>
      )}
    </Link>
  );
})()}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming lessons"
            description="Find a tutor and book your next tutoring session."
            href="/tutoring"
            action="Find a tutor"
          />
        )}
      </section>

      <CourseProgressSection enrollments={courseEnrollments} />

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeader
            eyebrow="Learning"
            title="Recent activity"
            href="/progress"
            linkText="View progress"
          />
          {activities.length ? (
            <div className="space-y-3">
              {activities.slice(0, 4).map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold">
                    {activity.resource?.title ?? "Learning activity"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activity.activityType} · {activity.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No learning activity yet"
              description="Your completed learning work will appear here."
            />
          )}
        </div>

        <div>
          <SectionHeader eyebrow="History" title="Recent lessons" />
          {completedSessions.length ? (
            <div className="space-y-3">
              {completedSessions.slice(0, 4).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
                >
                  <PersonAvatar person={session.educator} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {session.service?.title ?? "Tutoring lesson"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {session.educator?.name ?? "Teacher"} ·{" "}
                      {formatDate(session.scheduledStart)}
                    </p>
                  </div>
                  <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="No completed lessons yet"
              description="Your tutoring history will appear here after your first completed lesson."
            />
          )}
        </div>
      </section>
    </div>
  );
}

export default function DashboardView({
  account,
  learnerUpcoming,
  teacherUpcoming,
  completedSessions,
  learningActivities,
  courseEnrollments,
  latestPayout,
  adminStats,
  clientGrowth,
  recentClients,
}: DashboardViewProps) {
  if (account.isTeacherAdmin) {
    return (
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <TeacherAdminDashboard
          account={account}
          upcoming={teacherUpcoming}
          completedSessions={completedSessions}
          latestPayout={latestPayout}
          adminStats={adminStats}
          clientGrowth={clientGrowth}
          recentClients={recentClients}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <LearnerDashboard
        account={account}
        upcoming={learnerUpcoming}
        activities={learningActivities}
        courseEnrollments={courseEnrollments}
        completedSessions={completedSessions}
      />
    </main>
  );
}
