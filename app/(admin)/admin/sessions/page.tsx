import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  Search,
  UserRound,
  Video,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface SessionsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

const PAGE_SIZE = 20;

type SessionStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

const SESSION_STATUSES: SessionStatus[] = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(value);
}


function formatTime(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    timeStyle: "short",
  }).format(value);
}

function formatDuration(
  start: Date | null | undefined,
  end: Date | null | undefined,
) {
  if (!start || !end) return "—";

  const minutes = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60),
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "Scheduled";

    case "IN_PROGRESS":
      return "In Progress";

    case "COMPLETED":
      return "Completed";

    case "CANCELLED":
      return "Cancelled";

    case "NO_SHOW":
      return "No Show";

    default:
      return status;
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "IN_PROGRESS":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";

    case "NO_SHOW":
      return "border-orange-200 bg-orange-50 text-orange-700";

    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getAttendanceLabel(value: boolean | null | undefined) {
  if (value === true) return "Attended";
  if (value === false) return "Absent";
  return "Not recorded";
}

function getAttendanceClasses(value: boolean | null | undefined) {
  if (value === true) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === false) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-border bg-muted text-muted-foreground";
}

function getInitials(name: string | null | undefined) {
  if (!name) return "U";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function normalizeStatus(
  value: string | undefined,
): SessionStatus | undefined {
  if (!value) return undefined;

  if (
    value === "SCHEDULED" ||
    value === "IN_PROGRESS" ||
    value === "COMPLETED" ||
    value === "CANCELLED" ||
    value === "NO_SHOW"
  ) {
    return value;
  }

  return undefined;
}

function buildPageUrl({
  page,
  search,
  status,
}: {
  page: number;
  search: string;
  status: string;
}) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (search) {
    params.set("search", search);
  }

  if (status && status !== "ALL") {
    params.set("status", status);
  }

  const query = params.toString();

  return query ? `/admin/sessions?${query}` : "/admin/sessions";
}

export default async function AdminSessionsPage({
  searchParams,
}: SessionsPageProps) {
  const params = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/auth?mode=signin");
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
      emailVerified: true,
    },
  });

  if (!currentUser) {
    redirect("/auth?mode=signin");
  }

  const normalizedRole = String(currentUser.role ?? "")
    .trim()
    .toUpperCase();

  if (normalizedRole !== "ADMIN") {
    return (
      <div className="min-h-screen bg-background p-10">
        <div className="mx-auto max-w-xl rounded-xl border bg-card p-8">
          <h1 className="text-2xl font-bold">Access denied</h1>

          <p className="mt-3 text-muted-foreground">
            Your account does not have administrator access.
          </p>

          <p className="mt-4 text-sm text-muted-foreground">
            Current role:{" "}
            <span className="font-medium">
              {String(currentUser.role ?? "Unknown")}
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser.emailVerified) {
    redirect("/verify-email-notice");
  }

  const page = parsePage(params.page);
  const search = params.search?.trim() ?? "";
  const selectedStatus = normalizeStatus(params.status);

  /*
   * ------------------------------------------------------------
   * TYPED WHERE CLAUSE
   * ------------------------------------------------------------
   *
   * We derive the exact where type from the existing Prisma
   * client instead of importing Prisma from @prisma/client.
   *
   * This avoids:
   *
   *   Unexpected any
   *
   * and also avoids:
   *
   *   Module "@prisma/client" has no exported member "Prisma"
   */
 type SessionFindManyArgs = NonNullable<
  Parameters<typeof prisma.tutoringSession.findMany>[0]
>;

type SessionWhere = NonNullable<SessionFindManyArgs["where"]>;

const where: SessionWhere = {};

  if (selectedStatus) {
    where.status = selectedStatus;
  }

  if (search) {
    where.OR = [
      {
        id: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        bookingId: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        topic: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        learner: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        learner: {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        educator: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        educator: {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        service: {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        service: {
          subject: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const skip = (page - 1) * PAGE_SIZE;

  const [
    totalSessions,
    scheduledSessions,
    inProgressSessions,
    completedSessions,
    cancelledSessions,
    noShowSessions,
    sessions,
  ] = await Promise.all([
    prisma.tutoringSession.count(),

    prisma.tutoringSession.count({
      where: {
        status: "SCHEDULED",
      },
    }),

    prisma.tutoringSession.count({
      where: {
        status: "IN_PROGRESS",
      },
    }),

    prisma.tutoringSession.count({
      where: {
        status: "COMPLETED",
      },
    }),

    prisma.tutoringSession.count({
      where: {
        status: "CANCELLED",
      },
    }),

    prisma.tutoringSession.count({
      where: {
        status: "NO_SHOW",
      },
    }),

    prisma.tutoringSession.findMany({
      where,
      orderBy: {
        scheduledStart: "desc",
      },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        bookingId: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
        learnerAttendance: true,
        educatorAttendance: true,
        topic: true,
        topicsCovered: true,
        strengths: true,
        needsPractice: true,
        nextStep: true,
        tutorNotes: true,
        learnerOutcome: true,
        createdAt: true,
        updatedAt: true,

        learner: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },

        educator: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },

        service: {
          select: {
            id: true,
            title: true,
            type: true,
            subject: true,
            durationMinutes: true,
          },
        },

        booking: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalSessions / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const showingFrom =
    totalSessions === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const showingTo = Math.min(
    currentPage * PAGE_SIZE,
    totalSessions,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Tutoring Sessions
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Review tutoring sessions, attendance, participants,
              services, and session outcomes.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex w-fit items-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Back to admin
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SummaryCard
            label="All sessions"
            value={totalSessions}
            icon={Video}
          />

          <SummaryCard
            label="Scheduled"
            value={scheduledSessions}
            icon={CalendarDays}
          />

          <SummaryCard
            label="In progress"
            value={inProgressSessions}
            icon={Clock3}
          />

          <SummaryCard
            label="Completed"
            value={completedSessions}
            icon={GraduationCap}
          />

          <SummaryCard
            label="Cancelled"
            value={cancelledSessions}
            icon={Video}
          />

          <SummaryCard
            label="No shows"
            value={noShowSessions}
            icon={UserRound}
          />
        </div>

        {/* Filters */}
        <div className="rounded-xl border bg-card p-5">
          <form
            method="get"
            action="/admin/sessions"
            className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto]"
          >
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium"
              >
                Search
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  id="search"
                  name="search"
                  type="search"
                  defaultValue={search}
                  placeholder="Session ID, learner, tutor, topic, service..."
                  className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={selectedStatus ?? "ALL"}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="ALL">All statuses</option>

                {SESSION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Search
              </button>

              <Link
                href="/admin/sessions"
                className="inline-flex h-10 items-center justify-center rounded-lg border px-5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Reset
              </Link>
            </div>
          </form>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
          <div className="border-b px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">All sessions</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {totalSessions === 0
                    ? "No sessions found."
                    : `Showing ${showingFrom}–${showingTo} of ${totalSessions} sessions.`}
                </p>
              </div>
            </div>
          </div>

          {sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">
                      Session
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Learner
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Tutor
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Service
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Schedule
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Attendance
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {sessions.map((session) => (
                    <tr
                      key={session.id}
                      className="transition-colors hover:bg-muted/20"
                    >
                      <td className="px-5 py-4 align-top">
                        <div className="max-w-[220px]">
                          <Link
                            href={`/admin/sessions/${session.id}`}
                            className="font-medium hover:underline"
                          >
                            #{session.id}
                          </Link>

                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {session.topic || "No topic recorded"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Booking #{session.bookingId}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <PersonCell person={session.learner} />
                      </td>

                      <td className="px-5 py-4 align-top">
                        <PersonCell person={session.educator} />
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="max-w-[180px]">
                          <p className="truncate text-sm font-medium">
                            {session.service?.title ||
                              "Tutoring session"}
                          </p>

                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {session.service?.subject || "No subject"}
                          </p>

                          {session.service?.durationMinutes ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {session.service.durationMinutes} min
                            </p>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div>
                          <p className="text-sm font-medium">
                            {formatDate(session.scheduledStart)}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatTime(session.scheduledStart)} –{" "}
                            {formatTime(session.scheduledEnd)}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDuration(
                              session.scheduledStart,
                              session.scheduledEnd,
                            )}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${getAttendanceClasses(
                              session.learnerAttendance,
                            )}`}
                          >
                            Learner:{" "}
                            {getAttendanceLabel(
                              session.learnerAttendance,
                            )}
                          </span>

                          <br />

                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${getAttendanceClasses(
                              session.educatorAttendance,
                            )}`}
                          >
                            Tutor:{" "}
                            {getAttendanceLabel(
                              session.educatorAttendance,
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            session.status,
                          )}`}
                        >
                          {getStatusLabel(session.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right align-top">
                        <div className="flex flex-col items-end gap-2">
    {(session.status === "SCHEDULED" ||
      session.status === "IN_PROGRESS") &&
    session.booking?.status === "Scheduled" ? (
      <Link
        href={`/tutoring/sessions/${encodeURIComponent(
          session.bookingId,
        )}`}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        <Video className="h-4 w-4" />
        Join session
      </Link>
    ) : null}

    <Link
      href={`/admin/sessions/${encodeURIComponent(
        session.id,
      )}`}
      className="inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
    >
      View
    </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState search={search} />
          )}
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 lg:hidden">
          <div>
            <h2 className="font-semibold">All sessions</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {totalSessions === 0
                ? "No sessions found."
                : `Showing ${showingFrom}–${showingTo} of ${totalSessions} sessions.`}
            </p>
          </div>

          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      Session #{session.id}
                    </p>

                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {session.topic || "No topic recorded"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                      session.status,
                    )}`}
                  >
                    {getStatusLabel(session.status)}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Learner
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {getInitials(session.learner?.name)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {session.learner?.name ||
                            "Unnamed learner"}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {session.learner?.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Tutor
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {getInitials(session.educator?.name)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {session.educator?.name ||
                            "Unnamed tutor"}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {session.educator?.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Service
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {session.service?.title ||
                        "Tutoring session"}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {session.service?.subject ||
                        "No subject"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Schedule
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {formatDate(session.scheduledStart)}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTime(session.scheduledStart)} –{" "}
                      {formatTime(session.scheduledEnd)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getAttendanceClasses(
                      session.learnerAttendance,
                    )}`}
                  >
                    Learner:{" "}
                    {getAttendanceLabel(
                      session.learnerAttendance,
                    )}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getAttendanceClasses(
                      session.educatorAttendance,
                    )}`}
                  >
                    Tutor:{" "}
                    {getAttendanceLabel(
                      session.educatorAttendance,
                    )}
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(
                        session.scheduledStart,
                        session.scheduledEnd,
                      )}
                    </span>

                    <Link
                      href={`/admin/sessions/${encodeURIComponent(
                        session.id,
                      )}`}
                      className="text-sm font-medium hover:underline"
                    >
                      View session →
                    </Link>
                  </div>

                  {(session.status === "SCHEDULED" ||
                    session.status === "IN_PROGRESS") &&
                  session.booking?.status === "Scheduled" ? (
                    <Link
                      href={`/tutoring/sessions/${encodeURIComponent(
                        session.bookingId,
                      )}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                      <Video className="h-4 w-4" />
                      Join session
                    </Link>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <EmptyState search={search} />
          )}
        </div>

        {/* Pagination */}
        {totalSessions > 0 && totalPages > 1 ? (
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={buildPageUrl({
                    page: currentPage - 1,
                    search,
                    status: params.status ?? "",
                  })}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground opacity-50">
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </span>
              )}

              {currentPage < totalPages ? (
                <Link
                  href={buildPageUrl({
                    page: currentPage + 1,
                    search,
                    status: params.status ?? "",
                  })}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground opacity-50">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Video;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>

        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function PersonCell({
  person,
}: {
  person: {
    id: string;
    name: string | null;
    email: string;
    imageUrl: string | null;
  } | null;
}) {
  return (
    <div className="flex min-w-[180px] items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
        {getInitials(person?.name)}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {person?.name || "Unnamed"}
        </p>

        <p className="truncate text-xs text-muted-foreground">
          {person?.email || "No email"}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="rounded-xl border bg-card p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Video className="h-5 w-5 text-muted-foreground" />
      </div>

      <h3 className="mt-4 font-semibold">
        {search
          ? "No matching sessions"
          : "No tutoring sessions yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {search
          ? "Try a different search term or reset the filters."
          : "Tutoring sessions will appear here once they are created."}
      </p>

      {search ? (
        <Link
          href="/admin/sessions"
          className="mt-5 inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}