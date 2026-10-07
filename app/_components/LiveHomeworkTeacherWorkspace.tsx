"use client";

import {
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  MessageCircleQuestion,
  Power,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type User = {
  id: string;
  name: string;
  role: string | null;
};

type LiveHomeworkRequest = {
  id: string;
  learnerId: string;
  teacherId?: string | null;
  status: string;
  subject: string;
  gradeLevel?: string | null;
  topic?: string | null;
  description: string;
  assignmentUrl?: string | null;
  assignmentName?: string | null;
  assignmentType?: string | null;
  requestedAt: string;
  waitingAt?: string | null;
  selectedAt?: string | null;
  connectingAt?: string | null;
  activeAt?: string | null;
  endedAt?: string | null;
  learner?: {
    id?: string;
    name?: string | null;
    image?: string | null;
  } | null;
};

type Props = {
  user: User;
};

const ACTIVE_REQUEST_STATUSES = new Set([
  "REQUESTED",
  "WAITING",
  "SELECTED",
  "CONNECTING",
]);

function formatTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "Just now";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  return `${hours}h ago`;
}

function normalizeRequests(data: unknown): LiveHomeworkRequest[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const record = data as Record<string, unknown>;

  const candidates = [record.requests, record.queue, record.items, record.data];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as LiveHomeworkRequest[];
    }
  }

  if (Array.isArray(data)) {
    return data as LiveHomeworkRequest[];
  }

  return [];
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  if (normalized === "WAITING" || normalized === "REQUESTED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
        <Clock3 className="h-3.5 w-3.5" />
        Waiting
      </span>
    );
  }

  if (normalized === "SELECTED" || normalized === "CONNECTING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Connecting
      </span>
    );
  }

  if (normalized === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      {status}
    </span>
  );
}

function StatItem({
  icon,
  label,
  value,
  description,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
  active?: boolean;
}) {
  return (
    <div
      className={`group flex min-w-0 flex-1 items-center gap-3 px-5 py-4 transition ${
        active ? "bg-emerald-50/60" : "hover:bg-slate-50/80"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
          active
            ? "bg-emerald-100 text-emerald-600"
            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="truncate text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </p>
        </div>

        <p className="mt-0.5 truncate text-xs text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function QueueEmptyState({ available }: { available: boolean }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
        <MessageCircleQuestion className="h-8 w-8" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-slate-950">
        {available ? "You're ready for learners" : "Turn on Live Help to start"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {available
          ? "No learners are waiting right now. New homework-help requests will appear here automatically."
          : "When you're available, learners looking for immediate homework help can enter your live-help queue."}
      </p>

      {available && (
        <div className="mt-5 flex items-center gap-2 text-xs font-medium text-slate-400">
          <RefreshCw className="h-3.5 w-3.5" />
          Queue refreshes automatically
        </div>
      )}
    </div>
  );
}

export default function LiveHomeworkTeacherWorkspace({ user }: Props) {
  const router = useRouter();
  const [isAvailable, setIsAvailable] = useState(false);
  const [requests, setRequests] = useState<LiveHomeworkRequest[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<LiveHomeworkRequest | null>(null);

  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [changingAvailability, setChangingAvailability] = useState(false);
  const [selectingRequestId, setSelectingRequestId] = useState<string | null>(
    null,
  );

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");

  // Prevent an availability GET that started before a toggle from
  // overwriting the newer state returned by the toggle request.
  const availabilityRequestVersionRef = useRef(0);
  const availabilityMutationRef = useRef(false);

  const loadAvailability = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    if (availabilityMutationRef.current) {
      return;
    }

    const requestVersion = ++availabilityRequestVersionRef.current;

    try {
      if (!silent) {
        setLoadingAvailability(true);
      }

      const response = await fetch("/api/live-homework-help/availability", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load Live Homework Help availability.",
        );
      }

      // Ignore stale responses. A toggle may have changed the database
      // after this GET started, so an older response must never win.
      if (
        requestVersion !== availabilityRequestVersionRef.current ||
        availabilityMutationRef.current
      ) {
        return;
      }

      const availabilityValue =
        typeof data?.isAvailable === "boolean"
          ? data.isAvailable
          : typeof data?.availability?.isAvailable === "boolean"
            ? data.availability.isAvailable
            : false;

      setIsAvailable(availabilityValue);
    } catch (err) {
      if (
        requestVersion !== availabilityRequestVersionRef.current ||
        availabilityMutationRef.current
      ) {
        return;
      }

      if (!silent) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Unable to load Live Homework Help availability.",
        );
      }
    } finally {
      if (requestVersion === availabilityRequestVersionRef.current && !silent) {
        setLoadingAvailability(false);
      }
    }
  }, []);

  const loadQueue = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    try {
      if (!silent) {
        setLoadingQueue(true);
      }

      const response = await fetch("/api/live-homework-help", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load the Live Homework Help queue.",
        );
      }

      const nextRequests = normalizeRequests(data).filter((request) =>
        ACTIVE_REQUEST_STATUSES.has(request.status?.toUpperCase()),
      );

      setRequests(nextRequests);

      setSelectedRequest((current) => {
        if (!current) return null;

        return (
          nextRequests.find((request) => request.id === current.id) ?? null
        );
      });
    } catch (err) {
      if (!silent) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Unable to load the Live Homework Help queue.",
        );
      }
    } finally {
      if (!silent) {
        setLoadingQueue(false);
      }
    }
  }, []);

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => {
      void loadAvailability();
      void loadQueue();
    }, 0);

    return () => {
      window.clearTimeout(initialLoadTimer);
    };
  }, [loadAvailability, loadQueue]);

  useEffect(() => {
    // Background polling stays fast, but is completely silent so the
    // primary Go Live control never enters a loading state on each tick.
    const interval = window.setInterval(() => {
      void loadQueue({ silent: true });
      void loadAvailability({ silent: true });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadAvailability, loadQueue]);

  const toggleAvailability = async () => {
    const currentAvailability = isAvailable;

    try {
      setChangingAvailability(true);
      availabilityMutationRef.current = true;

      // Invalidate every availability GET that was already in flight.
      availabilityRequestVersionRef.current += 1;

      const method = currentAvailability ? "DELETE" : "POST";

      const response = await fetch("/api/live-homework-help/availability", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Unable to ${currentAvailability ? "leave" : "enter"} Live Homework Help.`,
        );
      }

      const nextAvailability =
        typeof data?.isAvailable === "boolean"
          ? data.isAvailable
          : typeof data?.availability?.isAvailable === "boolean"
            ? data.availability.isAvailable
            : !currentAvailability;

      setIsAvailable(nextAvailability);

      toast.success(
        nextAvailability
          ? "You are now available for Live Homework Help."
          : "You are now offline for Live Homework Help.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to update Live Homework Help availability.",
      );
    } finally {
      availabilityMutationRef.current = false;
      setChangingAvailability(false);

      // Reconcile with the database after the mutation has completed.
      void loadAvailability();
    }
  };

  const selectLearner = async (request: LiveHomeworkRequest) => {
    if (selectingRequestId) {
      return;
    }

    try {
      setSelectingRequestId(request.id);
      const response = await fetch("/api/live-homework-help/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: request.id,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to select this learner. They may have already been connected with another teacher.",
        );
      }

      const selected = data?.request ?? data?.liveHomeworkRequest ?? request;
      const sessionId =
        data?.sessionId ??
        selected?.sessionId ??
        data?.session?.id ??
        data?.liveHomeworkSession?.id ??
        null;

      if (!sessionId) {
        throw new Error(
          "The learner was selected, but no live classroom session was returned.",
        );
      }

      setSelectedRequest(selected as LiveHomeworkRequest);

      setRequests((current) =>
        current.filter((item) => item.id !== request.id),
      );

      toast.success(
        `You selected ${
          request.learner?.name || "this learner"
        }. Preparing the live classroom...`,
      );

      /*
       * The learner is already redirected to the classroom when the
       * selected request receives a sessionId. The teacher must do the
       * same thing here; otherwise the teacher remains on /live-help and
       * never initializes Vonage, so the learner has nobody publishing
       * audio/video into the classroom.
       */
      router.push(`/live-help/classroom/${sessionId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to select this learner.",
      );

      await loadQueue();
    } finally {
      setSelectingRequestId(null);
    }
  };

  const subjects = useMemo(() => {
    const values = requests
      .map((request) => request.subject?.trim())
      .filter(Boolean) as string[];

    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSubject =
        subjectFilter === "all" ||
        request.subject?.toLowerCase() === subjectFilter.toLowerCase();

      if (!matchesSubject) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      return [
        request.subject,
        request.gradeLevel,
        request.topic,
        request.description,
        request.learner?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue));
    });
  }, [requests, search, subjectFilter]);

  const waitingCount = requests.filter(
    (request) =>
      request.status?.toUpperCase() === "WAITING" ||
      request.status?.toUpperCase() === "REQUESTED",
  ).length;

  const connectingCount = requests.filter(
    (request) =>
      request.status?.toUpperCase() === "SELECTED" ||
      request.status?.toUpperCase() === "CONNECTING",
  ).length;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {/* Live Help hero */}
      <section className="relative overflow-hidden">
        <div className="flex flex-col gap-8 p-5 sm:p-9 lg:flex-row lg:items-center lg:justify-between lg:p-5">
          {/* Left content */}
          <div className="max-w-2xl">
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-emerald-950 sm:text-4xl lg:text-[46px] lg:leading-[1.05]">
              Live tutoring command center
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
              Go live when you&apos;re ready. New learners appear automatically,
              and you can jump into a request without leaving this workspace.
            </p>
          </div>

          {/* Right content */}
          <div className="flex shrink-0 items-center justify-center lg:ml-12">
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => void toggleAvailability()}
                disabled={changingAvailability}
                aria-label={
                  changingAvailability
                    ? isAvailable
                      ? "Going offline"
                      : "Going live"
                    : isAvailable
                      ? "Live and accepting learners"
                      : "Go live"
                }
                className={`group relative mt-0 flex h-40 w-40 shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-lg text-center text-base font-extrabold tracking-tight transition duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${
                  isAvailable
                    ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
                    : "bg-emerald-400 text-slate-950 hover:-translate-y-1 hover:bg-emerald-300"
                }`}
              >
                {/* Hover shine */}
                {!isAvailable && !changingAvailability ? (
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition duration-700 group-hover:translate-x-full" />
                ) : null}

                {/* Icon / status */}
                {changingAvailability ? (
                  <Loader2 className="relative h-8 w-8 animate-spin" />
                ) : isAvailable ? (
                  <Power className="relative h-8 w-8" />
                ) : (
                  <span className="relative flex h-5 w-5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-slate-950/30" />
                    <span className="relative h-5 w-5 rounded-full bg-slate-950" />
                  </span>
                )}

                {/* Main label */}
                <span className="relative text-lg leading-tight">
                  {changingAvailability
                    ? isAvailable
                      ? "Going offline..."
                      : "Going live..."
                    : isAvailable
                      ? "LIVE"
                      : "GO LIVE"}
                </span>

                {/* Secondary label */}
                {!changingAvailability ? (
                  <span
                    className={`relative text-[9px] font-black uppercase tracking-[0.16em] ${
                      isAvailable
                        ? "text-emerald-300/70"
                        : "text-slate-950/60"
                    }`}
                  >
                    {isAvailable ? "Accepting learners" : "Start"}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      </section>

  
       {/* Stats */}
        <section className="mt-3 overflow-hidden rounded-lg border border-emerald-400 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)]">
          <div className="flex flex-col divide-y divide-slate-500 md:flex-row md:divide-x md:divide-y-0">
            <StatItem
              icon={<Users className="h-5 w-5" />}
              label="Waiting"
              value={waitingCount}
              description="Learners needing help"
            />

            <StatItem
              icon={<Clock3 className="h-5 w-5" />}
              label="Connecting"
              value={connectingCount}
              description="Requests being connected"
            />

            <StatItem
              icon={<BookOpen className="h-5 w-5" />}
              label="Subjects"
              value={subjects.length}
              description="Subjects currently requested"
            />

            <StatItem
              icon={<GraduationCap className="h-5 w-5" />}
              label="Availability"
              value={isAvailable ? "ON" : "OFF"}
              description={
                isAvailable
                  ? "Visible to waiting learners"
                  : "Not accepting requests"
              }
              active={isAvailable}
            />
          </div>
        </section>

        {/* Selected learner */}
        {selectedRequest && (
          <section className="mt-6 overflow-hidden rounded-lg border border-violet-200 bg-white shadow-sm">
            <div className="border-b border-violet-100 bg-violet-50/60 px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-600">
                        Learner selected
                      </p>

                      <h2 className="mt-0.5 text-lg font-semibold text-slate-950">
                        {selectedRequest.learner?.name || "Learner"}
                      </h2>
                    </div>
                  </div>
                </div>

                <StatusPill status={selectedRequest.status} />
              </div>
            </div>

            <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Homework request
                </p>

                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                  {selectedRequest.topic || selectedRequest.subject}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {selectedRequest.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                    {selectedRequest.subject}
                  </span>

                  {selectedRequest.gradeLevel && (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                      {selectedRequest.gradeLevel}
                    </span>
                  )}

                  {selectedRequest.topic && (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                      {selectedRequest.topic}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center lg:items-end">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white opacity-60"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing classroom
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Queue */}
        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-blue-700">
                Learners waiting for help
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review the request before deciding who you can help.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                void loadQueue();
              }}
              disabled={loadingQueue}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${loadingQueue ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search learners, subjects, topics..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              <option value="all">All subjects</option>

              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {loadingQueue && requests.length === 0 ? (
            <div className="flex min-h-105 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-col items-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />

                <p className="mt-3 text-sm font-medium text-slate-700">
                  Loading live-help queue...
                </p>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <QueueEmptyState available={isAvailable} />
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((request) => {
                const isSelecting = selectingRequestId === request.id;

                return (
                  <article
                    key={request.id}
                    className="group rounded-lg border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_-24px_rgba(15,23,42,0.3)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_20px_45px_-25px_rgba(76,29,149,0.22)] sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill status={request.status} />

                          <span className="text-xs text-slate-400">
                            Requested {formatRelativeTime(request.requestedAt)}
                          </span>
                        </div>

                        <div className="mt-4 flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                            {(request.learner?.name || "L")[0]?.toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-semibold text-slate-950">
                              {request.learner?.name || "Learner"}
                            </h3>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                              <span>{request.subject}</span>

                              {request.gradeLevel && (
                                <>
                                  <span className="text-slate-300">•</span>

                                  <span>{request.gradeLevel}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 rounded-lg bg-slate-50 p-4">
                          <div className="flex items-start gap-3">
                            <MessageCircleQuestion className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                                What they need help with
                              </p>

                              {request.topic && (
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                  {request.topic}
                                </p>
                              )}

                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {request.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {request.subject && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                              <BookOpen className="h-3.5 w-3.5" />
                              {request.subject}
                            </span>
                          )}

                          {request.gradeLevel && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                              <GraduationCap className="h-3.5 w-3.5" />
                              {request.gradeLevel}
                            </span>
                          )}

                          {request.assignmentName && (
                            <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                              {request.assignmentName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 lg:w-44">
                        <button
                          type="button"
                          onClick={() => {
                            void selectLearner(request);
                          }}
                          disabled={
                            !isAvailable ||
                            Boolean(selectingRequestId) ||
                            request.status?.toUpperCase() !== "WAITING"
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          {isSelecting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Help this learner
                            </>
                          )}
                        </button>

                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
                          Request received at {formatTime(request.requestedAt)}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
