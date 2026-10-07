import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Search,
  TrendingUp,
  Users,
  Video,
  Sparkles,
  MessageCircle,
  ChevronRight,
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
  tutoringSessionId: string | null;
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
      className="flex shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
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

/* -------------------------------------------------------------------------- */
/* Shared UI                                                                  */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  eyebrow,
  title,
  description,
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
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>

        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {href && linkText ? (
        <Link
          href={href}
          className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-emerald-700 transition hover:text-emerald-900 sm:flex dark:text-emerald-400 dark:hover:text-emerald-300"
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
    <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60">
        <Icon className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
      </div>

      <h3 className="mt-4 font-semibold text-foreground">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      {href && action ? (
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950"
        >
          {action}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function DashboardCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-md border border-border/70 bg-card shadow-[0_8px_30px_-24px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Tutor dashboard                                                            */
/* -------------------------------------------------------------------------- */

function TeacherAdminDashboard({
  account,
  upcoming,
  completedSessions,
  adminStats,
  clientGrowth,
  latestPayout,
}: {
  account: DashboardViewProps["account"];
  upcoming: UpcomingTeacherLesson[];
  completedSessions: CompletedSession[];
  latestPayout: LatestPayout;
  adminStats: AdminStats;
  clientGrowth: ClientGrowthPoint[];
  recentClients: Person[];
}) {
  const latestGrowth =
    clientGrowth[clientGrowth.length - 1]?.value ?? 0;

  const previousGrowth =
    clientGrowth[clientGrowth.length - 2]?.value ?? 0;

  const growthPercent =
    previousGrowth > 0
      ? Math.round(
          ((latestGrowth - previousGrowth) / previousGrowth) *
            100,
        )
      : null;

  const firstName = account.name.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden px-0 py-4 text-emerald-950 sm:px-0 lg:px-0 lg:py-0">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="absolute -bottom-28 right-32 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.0rem]">
              Welcome back, {firstName}.
            </h1>

            <p className="mt-0 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Everything you need to manage your learners,
              sessions, availability, and teaching activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/bookings"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-emerald-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900"
            >
              <CalendarDays className="h-4 w-4" />
              View bookings
            </Link>

          

            <Link
              href="/admin/live-help"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              <MessageCircle className="h-4 w-4" />
              Live Homework Help
            </Link>
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            value: latestGrowth,
            icon: Users,
            detail: "New clients",
          },
          {
            value: adminStats?.totalUsers ?? 0,
            icon: Users,
            detail: "Registered users",
          },
          {
            value:
              adminStats?.scheduledBookings ?? upcoming.length,
            icon: CalendarDays,
            detail: "Upcoming lessons",
          },
          {
            value:
              adminStats?.completedSessions ??
              completedSessions.length,
            icon: CheckCircle2,
            detail: "Sessions completed",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <DashboardCard key={item.detail} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                  <Icon className="h-4.5 w-4.5 text-emerald-700 dark:text-emerald-400" />
                </div>
              </div>
            </DashboardCard>
          );
        })}
      </section>

      {/* Main workspace */}
      <section className="grid gap-6">
      <DashboardCard className="p-5 sm:p-6">
        <div className="min-h-75">
          <ClientGrowthChart points={clientGrowth} />
        </div>
      </DashboardCard>
    </section>

     
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Learner dashboard                                                          */
/* -------------------------------------------------------------------------- */

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
        description="Pick up where you left off."
        href="/products"
        linkText="Browse courses"
      />

      {enrollments.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {enrollments.slice(0, 6).map((enrollment) => {
            const progress = Math.max(
              0,
              Math.min(100, enrollment.progress),
            );

            return (
              <Link
                href={`/courses/${enrollment.course.slug}`}
                key={enrollment.id}
                className="group rounded-2xl border border-border/70 bg-card p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <BookOpen className="h-5 w-5" />
                  </div>

                  <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {enrollment.status}
                  </span>
                </div>

                <h3 className="mt-5 line-clamp-2 font-semibold group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                  {enrollment.course.title}
                </h3>

                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                  {enrollment.course.smallDescription ??
                    enrollment.course.category ??
                    `${enrollment.course.level} course`}
                </p>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Progress
                    </span>

                    <span className="font-semibold">
                      {Math.round(progress)}%
                    </span>
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
                    <span>
                      {enrollment.course.duration} min
                    </span>
                  ) : null}
                </div>
              </Link>
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
  const firstName = account.name.split(" ")[0] || "there";

  const completedCount = completedSessions.length;

  const averageProgress =
    courseEnrollments.length
      ? Math.round(
          courseEnrollments.reduce(
            (total, course) =>
              total +
              Math.max(0, Math.min(100, course.progress)),
            0,
          ) / courseEnrollments.length,
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* Learner hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-emerald-100/70 blur-3xl dark:bg-emerald-950/30" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Your learning workspace
            </p>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.7rem]">
              Welcome back, {firstName}.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Continue building your skills with tutoring,
              courses, practice, and personalized learning.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {account.canBookTutoring ? (
              <Link
                href="/tutoring"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950"
              >
                <Search className="h-4 w-4" />
                Find a tutor
              </Link>
            ) : null}

            <Link
              href="/dashboard/create"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
            >
              <Sparkles className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              Create with AI
            </Link>
          </div>
        </div>
      </section>

      {/* Learner overview */}
      <section className="grid gap-3 sm:grid-cols-3">
        <DashboardCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Active courses
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {courseEnrollments.length}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
              <BookOpen className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Course progress
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {averageProgress}%
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
              <TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Lessons completed
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {completedCount}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            </div>
          </div>
        </DashboardCard>
      </section>

      {/* Next lesson */}
      <section>
        <SectionHeader
          eyebrow="Your schedule"
          title="Next lesson"
          href="/tutoring/sessions"
          linkText="View all"
        />

        {nextLesson ? (
          <div className="relative overflow-hidden rounded-3xl bg-[#063B2B] p-6 text-white shadow-lg sm:p-8">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <PersonAvatar
                  person={nextLesson.educator}
                  size={56}
                />

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-200">
                    {nextLesson.service?.title ??
                      "Tutoring lesson"}
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    {nextLesson.educator?.name ?? "Your tutor"}
                  </h2>

                  <p className="mt-1 text-sm text-emerald-100/80">
                    {nextLesson.subject ?? "Mathematics"}
                    {nextLesson.gradeLevel
                      ? ` · ${nextLesson.gradeLevel}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-emerald-100/70">
                    {formatDate(nextLesson.startTime)}
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {formatTime(nextLesson.startTime)} –{" "}
                    {formatTime(nextLesson.endTime)}
                  </p>
                </div>

                {(() => {
                  const joinable =
                    canJoinLesson(nextLesson);

                  const href = joinable
                    ? `/tutoring/sessions/${encodeURIComponent(
                        nextLesson.id,
                      )}`
                    : nextLesson.tutoringSessionId
                      ? `/dashboard/tutoring/sessions/${encodeURIComponent(
                          nextLesson.tutoringSessionId,
                        )}`
                      : `/tutoring/sessions/${encodeURIComponent(
                          nextLesson.id,
                        )}`;

                  return (
                    <Link
                      href={href}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
                    >
                      {joinable ? (
                        <>
                          <Video className="h-4 w-4" />
                          Join lesson
                        </>
                      ) : (
                        <>
                          Open lesson
                          <ArrowRight className="h-4 w-4" />
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
            description="Find a tutor and book your next tutoring session to start learning."
            href="/tutoring"
            action="Find a tutor"
          />
        )}
      </section>

      {/* Courses */}
      <CourseProgressSection
        enrollments={courseEnrollments}
      />

      {/* Activity + history */}
      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardCard className="p-5 sm:p-6">
          <SectionHeader
            eyebrow="Learning"
            title="Recent activity"
            href="/progress"
            linkText="View progress"
          />

          {activities.length ? (
            <div className="space-y-2">
              {activities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-3.5 transition hover:bg-muted/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                    <BookOpen className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {activity.resource?.title ??
                        "Learning activity"}
                    </p>

                    <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                      {activity.activityType} ·{" "}
                      {activity.status}
                    </p>
                  </div>

                  {activity.score !== null &&
                  activity.maxScore ? (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {activity.score}/
                      {activity.maxScore}
                    </span>
                  ) : null}
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
        </DashboardCard>

        <DashboardCard className="p-5 sm:p-6">
          <SectionHeader
            eyebrow="History"
            title="Recent lessons"
          />

          {completedSessions.length ? (
            <div className="space-y-2">
              {completedSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-3.5"
                >
                  <PersonAvatar
                    person={session.educator}
                    size={40}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {session.service?.title ??
                        "Tutoring lesson"}
                    </p>

                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {session.educator?.name ??
                        "Teacher"}{" "}
                      · {formatDate(session.scheduledStart)}
                    </p>
                  </div>

                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
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
        </DashboardCard>
      </section>

      {/* Learner actions */}
      <section>
        <SectionHeader
          eyebrow="Explore Justdy"
          title="What would you like to do?"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/dashboard/live-help"
            className="group rounded-2xl border border-border/70 bg-card p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
              <MessageCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            </div>

            <h3 className="mt-4 font-semibold">
              Homework help
            </h3>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Get help understanding a difficult problem with a live tutor.
            </p>

            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Get help
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link
            href="/dashboard/create"
            className="group rounded-2xl border border-border/70 bg-card p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
              <Sparkles className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            </div>

            <h3 className="mt-4 font-semibold">
              Create with AI
            </h3>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Create learning materials, assessments, images, and more.
            </p>

            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Open AI studio
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link
            href="/tutoring"
            className="group rounded-2xl border border-border/70 bg-card p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
              <Search className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            </div>

            <h3 className="mt-4 font-semibold">
              Find a tutor
            </h3>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Find a tutor who matches your subject and learning goals.
            </p>

            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Browse tutors
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page entry                                                                 */
/* -------------------------------------------------------------------------- */

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
      <main className="mx-auto w-full max-w-6xl mt-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
    <main className="mx-auto w-full max-w-6xl mt-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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