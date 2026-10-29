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

export type Person = {
  id: string;
  name: string | null;
  imageUrl: string | null;
};

export type Service = {
  id: string;
  title: string;
  durationMinutes: number | null;
  price: number | null;
  currency: string;
};

export type UpcomingLearnerLesson = {
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

export type UpcomingTeacherLesson = {
  id: string;
  startTime: Date;
  endTime: Date;
  subject: string | null;
  gradeLevel: string | null;
  status: string;
  student: Person | null;
  service: Service | null;
};

export type CourseEnrollmentSummary = {
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

export type LearningActivity = {
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

export type CompletedSession = {
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

export type LatestPayout = {
  id: string;
  amount: number;
  netAmount: number;
  status: string;
  createdAt: Date;
} | null;

export type AdminStats = {
  totalUsers: number;
  pendingTeacherApprovals: number;
  totalBookings: number;
  scheduledBookings: number;
  completedSessions: number;
  payoutCount: number;
} | null;

export type ClientGrowthPoint = {
  date: string;
  label: string;
  value: number;
};

export type DashboardAccount = {
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

export type DashboardViewProps = {
  account: DashboardAccount;

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

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatMoney(amount: number, currency = "GHS") {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getInitials(name: string | null | undefined) {
  if (!name) return "J";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function PersonAvatar({
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

export function canJoinLesson(lesson: {
  startTime: Date;
  endTime: Date;
  status: string;
}) {
  const now = Date.now();
  const start = new Date(lesson.startTime).getTime();
  const end = new Date(lesson.endTime).getTime();

  const joinWindowStart = start - JOIN_WINDOW_MINUTES * 60 * 1000;

  return lesson.status === "Scheduled" && now >= joinWindowStart && now < end;
}

export function SectionHeader({
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

export function EmptyState({
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
