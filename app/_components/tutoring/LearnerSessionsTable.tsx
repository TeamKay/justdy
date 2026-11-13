"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TutoringSessionScheduler from "./TutoringSessionScheduler";
import Link from "next/link";
import {
  Search,
  Video,
  X,
} from "lucide-react";

type ActualSession = {
  id: string;
  bookingId: string;
  scheduledStart: Date | string | null;
  scheduledEnd: Date | string | null;
  status: string;
  learnerAttendance: boolean | null;
  educatorAttendance: boolean | null;
  topic: string | null;
  learner: {
    id: string;
    name: string | null;
    email: string;
    imageUrl: string | null;
  } | null;
  educator: {
    id: string;
    name: string | null;
    email: string;
    imageUrl: string | null;
  } | null;
  service: {
    id: string;
    title: string;
    type: string;
    subject: string | null;
    durationMinutes: number | null;
  } | null;
  booking: { id: string; status: string } | null;
};

type OnboardingSession = {
  id: string;
  bookingId: string | null;
  sessionNumber: number;
  status: string;
  scheduledStart: Date | string | null;
  scheduledEnd: Date | string | null;
  durationMinutes: number | null;
  subject: string | null;
  gradeLevel: string | null;
  timeZone: string | null;
  onboardingRequest: {
    id: string;
    studentName: string | null;
    guardianName: string | null;
    learnerEmail: string | null;
    email: string | null;
    subject: string | null;
    gradeLevel: string | null;
    assignedTutor: { id: string; name: string | null; email: string } | null;
  };
};

type Props = {
  actualSessions: ActualSession[];
  onboardingSessions: OnboardingSession[];
  search: string;
  status: string;
  summary: {
    actual: number;
    planned: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
};

type LearnerRow = {
  key: string;
  name: string;
  email: string;
  actual: ActualSession[];
  planned: OnboardingSession[];
};

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateTime(
  value: Date | string | null | undefined,
  timeZone?: string | null,
) {
  const date = asDate(value);
  if (!date) return "Not scheduled";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      ...(timeZone ? { timeZone } : {}),
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function labelStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
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

function canJoin(session: ActualSession) {
  return (
    (session.status === "SCHEDULED" || session.status === "IN_PROGRESS") &&
    session.booking?.status === "Scheduled"
  );
}

export default function LearnerSessionsTable({
  actualSessions,
  onboardingSessions,
  search,
  status,
  summary,
}: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(search);
  const [statusFilter, setStatusFilter] = useState(status || "ALL");
  const [selectedLearnerKey, setSelectedLearnerKey] = useState<string | null>(
    null,
  );

  // Apply search and status changes automatically, without a Search button.
  // A short debounce avoids requesting a new server render for every keystroke.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }
      if (statusFilter && statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const query = params.toString();
      router.replace(query ? `/admin/tutoring-sessions?${query}` : "/admin/tutoring-sessions", {
        scroll: false,
      });
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [searchTerm, statusFilter, router]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  async function connectClassroom(sessionId: string) {
    setConnectingId(sessionId);
    setConnectionError(null);
    try {
      const response = await fetch(
        `/api/admin/onboarding-sessions/${encodeURIComponent(sessionId)}/classroom`,
        { method: "POST" },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "Could not connect the classroom.");
      router.refresh();
    } catch (error) {
      setConnectionError(
        error instanceof Error
          ? error.message
          : "Could not connect the classroom.",
      );
    } finally {
      setConnectingId(null);
    }
  }

  const learners = useMemo(() => {
    const map = new Map<string, LearnerRow>();
    const getRow = (key: string, name: string, email: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const stableKey = normalizedEmail ? `email:${normalizedEmail}` : key;
      let row = map.get(stableKey);
      if (!row) {
        row = {
          key: stableKey,
          name: name || "Unnamed learner",
          email,
          actual: [],
          planned: [],
        };
        map.set(stableKey, row);
      } else {
        if (row.name === "Unnamed learner" && name) row.name = name;
        if (!row.email && email) row.email = email;
      }
      return row;
    };

    for (const session of actualSessions) {
      const learner = session.learner;
      getRow(
        `actual:${learner?.id ?? session.id}`,
        learner?.name ?? "Unnamed learner",
        learner?.email ?? "",
      ).actual.push(session);
    }
    for (const session of onboardingSessions) {
      const request = session.onboardingRequest;
      getRow(
        `onboarding:${request.id}`,
        request.studentName || request.guardianName || "Unnamed learner",
        request.learnerEmail || request.email || "",
      ).planned.push(session);
    }

    return [...map.values()]
      .map((row) => ({
        ...row,
        actual: [...row.actual].sort(
          (a, b) =>
            (asDate(a.scheduledStart)?.getTime() ?? Infinity) -
            (asDate(b.scheduledStart)?.getTime() ?? Infinity),
        ),
        planned: [...row.planned].sort(
          (a, b) =>
            (asDate(a.scheduledStart)?.getTime() ?? Infinity) -
            (asDate(b.scheduledStart)?.getTime() ?? Infinity),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [actualSessions, onboardingSessions]);

  const selectedLearner =
    learners.find((learner) => learner.key === selectedLearnerKey) ?? null;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Tutoring Sessions
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              View each learner’s session summary, open their session list, and
              join active classroom sessions.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex w-fit items-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Back to admin
          </Link>
        </header>

        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b p-5">
            <h2 className="font-semibold">Learners</h2>
            <form
              onSubmit={(event) => event.preventDefault()}
              className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search learner, tutor, subject, or session..."
                  aria-label="Search learners, tutors, subjects, or sessions"
                  className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <select
                name="status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter sessions by status"
                className="h-10 rounded-lg border bg-background px-3 text-sm"
              >
                <option value="ALL">All statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No show</option>
              </select>
              <Link
                href="/admin/tutoring-sessions"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                }}
                className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm hover:bg-muted"
              >
                Reset
              </Link>
            </form>
          </div>

          {learners.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Learner</th>
                    <th className="px-5 py-3 font-medium">Total sessions</th>
                    <th className="px-5 py-3 font-medium">Planned</th>
                    <th className="px-5 py-3 font-medium">Actual</th>
                    <th className="px-5 py-3 font-medium">
                      Next scheduled session
                    </th>
                    <th className="px-5 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {learners.map((learner) => {
                    const allDates = [
                      ...learner.actual
                        .filter(
                          (item) =>
                            item.status === "SCHEDULED" ||
                            item.status === "IN_PROGRESS",
                        )
                        .map((item) => ({
                          date: asDate(item.scheduledStart),
                          zone: null as string | null,
                        })),
                      ...learner.planned
                        .filter(
                          (item) =>
                            item.status === "SCHEDULED" ||
                            item.status === "PENDING_CONFIRMATION",
                        )
                        .map((item) => ({
                          date: asDate(item.scheduledStart),
                          zone: item.timeZone,
                        })),
                    ]
                      .filter((item) => item.date)
                      .sort((a, b) => a.date!.getTime() - b.date!.getTime());
                    return (
                      <tr key={learner.key} className="hover:bg-muted/20">
                        <td className="px-5 py-4">
                          <p className="font-medium">{learner.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {learner.email || "No email recorded"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold">
                          {learner.actual.length + learner.planned.length}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          {learner.planned.length}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          {learner.actual.length}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          {allDates[0]
                            ? dateTime(allDates[0].date, allDates[0].zone)
                            : "No upcoming session"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLearnerKey(learner.key)}
                            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                          >
                            View sessions
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <Video className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">
                No learners with sessions found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try changing the search or status filter.
              </p>
            </div>
          )}
        </section>
      </div>

      {selectedLearner ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setSelectedLearnerKey(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="learner-session-modal-title"
            className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border bg-card shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-5">
              <div className="min-w-0">
                <h2
                  id="learner-session-modal-title"
                  className="mt-1 truncate text-xl font-bold"
                >
                  {selectedLearner.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLearnerKey(null)}
                aria-label="Close dialog"
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-100px)] space-y-5 overflow-y-auto p-5 sm:p-6">
              {selectedLearner.actual.length === 0 &&
              selectedLearner.planned.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No sessions found for this learner.
                </p>
              ) : null}
              {selectedLearner.planned.length ? (
                <div>
                  <h3 className="mb-3 font-semibold">
                    Planned onboarding sessions{" "}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {selectedLearner.planned.length}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {selectedLearner.planned.map((item) => {
                      const request = item.onboardingRequest;
                      const tutor = request.assignedTutor;
                      return (
                        <article
                          key={item.id}
                          className="rounded-lg border p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold">
                                  Session {item.sessionNumber}
                                </h4>
                                <span
                                  className={`rounded-lg border px-2 py-0.5 text-xs ${statusClass(item.status)}`}
                                >
                                  {labelStatus(item.status)}
                                </span>
                                <span className="rounded-lg border px-2 py-0.5 text-xs">
                                  Planned
                                </span>
                              </div>
                              <p className="mt-2 text-sm">
                                {item.subject ||
                                  request.subject ||
                                  "Subject not specified"}{" "}
                                ·{" "}
                                {item.gradeLevel ||
                                  request.gradeLevel ||
                                  "Grade not specified"}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {dateTime(item.scheduledStart, item.timeZone)}
                                {item.scheduledEnd
                                  ? ` – ${dateTime(item.scheduledEnd, item.timeZone).split(", ").slice(-1)[0]}`
                                  : ` · ${item.durationMinutes ?? 60} min`}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Tutor: {tutor?.name || "Not assigned"}
                                {tutor?.email ? ` (${tutor.email})` : ""} ·
                                Timezone: {item.timeZone || "America/Chicago"}
                              </p>
                            </div>
                            {item.bookingId ? (
                              <Link
                                href={`/tutoring/sessions/${encodeURIComponent(item.bookingId)}`}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                              >
                                <Video className="h-4 w-4" /> Join session
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={() => connectClassroom(item.id)}
                                disabled={connectingId === item.id}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-wait disabled:opacity-60"
                              >
                                <Video className="h-4 w-4" />{" "}
                                {connectingId === item.id
                                  ? "Connecting…"
                                  : "Connect classroom"}
                              </button>
                            )}
                          </div>
                                                    {!item.bookingId ? (
                            <div className="mt-4">
                              <TutoringSessionScheduler
                                requestId={`${request.id}-${item.id}`}
                                sessions={[
                                  {
                                    id: item.id,
                                    sessionNumber: item.sessionNumber,
                                    status: item.status,
                                    scheduledStart: item.scheduledStart
                                      ? new Date(
                                          item.scheduledStart,
                                        ).toISOString()
                                      : null,
                                    scheduledEnd: item.scheduledEnd
                                      ? new Date(
                                          item.scheduledEnd,
                                        ).toISOString()
                                      : null,
                                    durationMinutes: item.durationMinutes,
                                    timeZone: item.timeZone,
                                    subject: item.subject,
                                    gradeLevel: item.gradeLevel,
                                    tutorNotes: null,
                                  },
                                ]}
                                defaultDurationMinutes={
                                  item.durationMinutes ?? 60
                                }
                              />
                            </div>
                          ) : null}
                          <p className="mt-3 text-xs text-muted-foreground">
                            {item.bookingId
                              ? `Classroom booking ID: ${item.bookingId}`
                              : "Connecting creates a Booking and TutoringSession for the existing classroom. The course must be fully paid, a learner account must be linked, a tutor must be assigned, and the session must have a start time."}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {selectedLearner.actual.length ? (
                <div>
                  <h3 className="mb-3 font-semibold">
                    Actual classroom sessions{" "}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {selectedLearner.actual.length}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {selectedLearner.actual.map((item) => (
                      <article key={item.id} className="rounded-xl border p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold">
                                {item.topic ||
                                  item.service?.title ||
                                  "Tutoring session"}
                              </h4>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(item.status)}`}
                              >
                                {labelStatus(item.status)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm">
                              {item.service?.subject || "Subject not recorded"}
                              {item.service?.durationMinutes
                                ? ` · ${item.service.durationMinutes} minutes`
                                : ""}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {dateTime(item.scheduledStart)}
                              {item.scheduledEnd
                                ? ` – ${dateTime(item.scheduledEnd)}`
                                : ""}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Tutor: {item.educator?.name || "Not assigned"} ·
                              Session ID: {item.id}
                            </p>
                          </div>
                          {canJoin(item) ? (
                            <Link
                              href={`/tutoring/sessions/${encodeURIComponent(item.bookingId)}`}
                              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                              <Video className="h-4 w-4" /> Join session
                            </Link>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="inline-flex shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground opacity-70"
                            >
                              <Video className="h-4 w-4" /> Join unavailable
                            </button>
                          )}
                        </div>
                        {item.status === "SCHEDULED" ||
                        item.status === "IN_PROGRESS" ? null : (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Classroom joining is only available for scheduled or
                            in-progress sessions with a scheduled booking.
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
              {connectionError ? (
                <div
                  role="alert"
                  className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {connectionError}
                </div>
              ) : null}
              <div className="flex justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedLearnerKey(null)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
