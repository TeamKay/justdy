"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  GraduationCap,
  Mail,
  Search,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/_components/ui/avatar";

type Learner = {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  emailVerified: boolean;
  status: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  canTeach: boolean;
  gradeLevel: string | null;
  learningStyle: string | null;
  bookingCount: number;
  upcomingBookingCount: number;
  completedSessionCount: number;
};

type GrowthPoint = {
  label: string;
  value: number;
};

type Props = {
  learners: Learner[];
  stats: {
    totalLearners: number;
    totalUsers: number;
    verifiedLearners: number;
    activeTutoringLearners: number;
    newThisMonth: number;
  };
  growth: GrowthPoint[];
};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "JU"
  );
}

function formatDate(date: Date | null) {
  if (!date) return "Never";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function relativeDate(date: Date | null) {
  if (!date) return "No login yet";

  const diff = Math.max(
    0,
    Date.now() - new Date(date).getTime(),
  );

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 30) return `${days}d ago`;

  return formatDate(date);
}

function GrowthChart({ data }: { data: GrowthPoint[] }) {
  const width = 760;
  const height = 300;
  const paddingX = 42;
  const paddingTop = 26;
  const paddingBottom = 42;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(
    5,
    ...data.map((point) => point.value),
  );

  const points = data.map((point, index) => {
    const x =
      paddingX +
      (data.length === 1
        ? chartWidth / 2
        : (index / (data.length - 1)) * chartWidth);

    const y =
      paddingTop +
      chartHeight -
      (point.value / maxValue) * chartHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
    )
    .join(" ");

  const areaPath = `${linePath} L ${
    points[points.length - 1]?.x ?? paddingX
  } ${paddingTop + chartHeight} L ${paddingX} ${
    paddingTop + chartHeight
  } Z`;

  const gridLines = [0, 1, 2, 3].map((index) => {
    const y = paddingTop + (chartHeight / 3) * index;
    return y;
  });

  return (
    <div className="mt-6 overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="New learners joining Justdy over the last six months"
      >
        <defs>
          <linearGradient
            id="learner-growth-fill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((y) => (
          <line
            key={y}
            x1={paddingX}
            x2={width - paddingX}
            y1={y}
            y2={y}
            stroke="currentColor"
            className="text-border/60"
            strokeWidth="1"
          />
        ))}

        <path
          d={areaPath}
          fill="url(#learner-growth-fill)"
        />

        <path
          d={linePath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => (
          <g key={`${point.label}-${point.value}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="hsl(var(--background))"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
            />
          </g>
        ))}

        {points.map((point) => (
          <text
            key={`label-${point.label}`}
            x={point.x}
            y={height - 12}
            textAnchor="middle"
            className="fill-muted-foreground text-[12px]"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  iconClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  detail: string;
  iconClassName: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex size-11 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="size-5" />
        </div>

        <ArrowUpRight className="size-4 text-muted-foreground" />
      </div>

      <p className="mt-5 text-sm font-medium text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>

      <p className="mt-2 text-xs text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

export default function LearnersView({
  learners,
  stats,
  growth,
}: Props) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<
    "all" | "verified" | "unverified" | "active"
  >("all");

  const filteredLearners = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return learners.filter((learner) => {
      const matchesQuery =
        !normalizedQuery ||
        learner.name.toLowerCase().includes(normalizedQuery) ||
        learner.email.toLowerCase().includes(normalizedQuery) ||
        (learner.gradeLevel ?? "")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus =
        status === "all" ||
        (status === "verified" && learner.emailVerified) ||
        (status === "unverified" && !learner.emailVerified) ||
        (status === "active" && learner.bookingCount > 0);

      return matchesQuery && matchesStatus;
    });
  }, [learners, query, status]);

  return (
    <main className="min-h-full bg-muted/20">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Link
                href="/dashboard"
                className="transition hover:text-foreground"
              >
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-foreground">Learners</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Learners
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Manage everyone who has joined Justdy as a learner and
              keep track of their tutoring activity.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
            <Users className="size-4" />
            <span>{stats.totalUsers.toLocaleString()} user accounts</span>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total learners"
            value={stats.totalLearners.toLocaleString()}
            detail="USER accounts with learning access"
            iconClassName="bg-primary/10 text-primary"
          />

          <StatCard
            icon={TrendingUp}
            label="Active tutoring"
            value={stats.activeTutoringLearners.toLocaleString()}
            detail="Learners with at least one booking"
            iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />

          <StatCard
            icon={CheckCircle2}
            label="Verified learners"
            value={stats.verifiedLearners.toLocaleString()}
            detail="Email verified accounts"
            iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          />

          <StatCard
            icon={UserPlus}
            label="New this month"
            value={stats.newThisMonth.toLocaleString()}
            detail="Learners who joined this month"
            iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <TrendingUp className="size-4" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Learner growth
                  </h2>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  New learners joining Justdy over the last six months.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">
                Last 6 months
              </div>
            </div>

            <GrowthChart data={growth} />

            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
              <span>Monthly learner registrations</span>
              <span className="font-medium text-foreground">
                {stats.newThisMonth} new this month
              </span>
            </div>
          </div>

          <aside className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Learner overview
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Current platform health
                </p>
              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="size-4" />
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Email verification
                  </span>
                  <span className="font-semibold">
                    {stats.totalLearners
                      ? Math.round(
                          (stats.verifiedLearners /
                            stats.totalLearners) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${
                        stats.totalLearners
                          ? Math.round(
                              (stats.verifiedLearners /
                                stats.totalLearners) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <CalendarDays className="size-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">
                      Tutoring activity
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {stats.activeTutoringLearners} learners have
                      booked tutoring.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <UserPlus className="size-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">
                      New registrations
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {stats.newThisMonth} learners joined this
                      month.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="border-b border-border/70 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  All learners
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filteredLearners.length.toLocaleString()} of{" "}
                  {learners.length.toLocaleString()} learners shown
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 sm:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search learners..."
                    className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <label className="relative">
                  <span className="sr-only">Filter learners</span>
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value as
                          | "all"
                          | "verified"
                          | "unverified"
                          | "active",
                      )
                    }
                    className="h-10 appearance-none rounded-xl border border-border bg-background pl-3 pr-9 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="all">All learners</option>
                    <option value="active">With tutoring activity</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </label>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-border/70 bg-muted/20">
                <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3.5 sm:px-6">Learner</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Grade</th>
                  <th className="px-5 py-3.5">Tutoring</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5">Last login</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {filteredLearners.map((learner) => (
                  <tr
                    key={learner.id}
                    className="transition hover:bg-muted/20"
                  >
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 border border-border">
                          <AvatarImage
                            src={learner.imageUrl ?? ""}
                            alt={learner.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {initials(learner.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {learner.name}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="size-3.5 shrink-0" />
                            <span className="truncate">
                              {learner.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            learner.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : learner.status === "Suspended"
                                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {learner.status}
                        </span>

                        {learner.emailVerified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                            <CheckCircle2 className="size-3" />
                            Verified
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {learner.gradeLevel || "Not set"}
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {learner.bookingCount} booking
                          {learner.bookingCount === 1 ? "" : "s"}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock3 className="size-3.5" />
                          {learner.upcomingBookingCount} upcoming
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {formatDate(learner.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{relativeDate(learner.lastLoginAt)}</span>
                        {learner.canTeach && (
                          <span
                            title="This USER also has teaching capability"
                            className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-700 dark:text-violet-400"
                          >
                            <GraduationCap className="size-3" />
                            Can teach
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {!filteredLearners.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                          <Search className="size-5" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold">
                          No learners found
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Try another search term or change the
                          learner filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
