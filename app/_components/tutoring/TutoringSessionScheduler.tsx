"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Save } from "lucide-react";

export type ScheduledTutoringSession = {
  id: string;
  sessionNumber: number;
  status: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  durationMinutes: number | null;
  timeZone: string | null;
  subject: string | null;
  gradeLevel: string | null;
  tutorNotes: string | null;
};

function localInputForZone(value: string | null, zone: string) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const p = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

function displayTime(value: string, zone: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: zone,
      dateStyle: "medium",
      timeStyle: "short",
      timeZoneName: "short",
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

export default function TutoringSessionScheduler({
  requestId,
  sessions,
  defaultDurationMinutes,
}: {
  requestId: string;
  sessions: ScheduledTutoringSession[];
  defaultDurationMinutes: number | null;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<
    Record<string, { start: string; duration: string }>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const browserZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";

  const [zone, setZone] = useState(browserZone);

  const TIME_ZONE_OPTIONS = [
    { value: "America/New_York", label: "Eastern Time — New York" },
    { value: "America/Chicago", label: "Central Time — Chicago" },
    { value: "America/Denver", label: "Mountain Time — Denver" },
    { value: "America/Los_Angeles", label: "Pacific Time — Los Angeles" },
    { value: "America/Anchorage", label: "Alaska Time — Anchorage" },
    { value: "Pacific/Honolulu", label: "Hawaii Time — Honolulu" },
    { value: "America/Toronto", label: "Eastern Time — Toronto" },
    { value: "America/Vancouver", label: "Pacific Time — Vancouver" },
    { value: "America/Mexico_City", label: "Central Time — Mexico City" },
    { value: "America/Sao_Paulo", label: "Brasília Time — São Paulo" },
    { value: "Europe/London", label: "United Kingdom — London" },
    { value: "Europe/Paris", label: "Central European Time — Paris" },
    { value: "Europe/Berlin", label: "Central European Time — Berlin" },
    { value: "Europe/Athens", label: "Eastern European Time — Athens" },
    { value: "Africa/Accra", label: "Ghana — Accra" },
    { value: "Africa/Lagos", label: "West Africa Time — Lagos" },
    { value: "Africa/Nairobi", label: "East Africa Time — Nairobi" },
    { value: "Asia/Dubai", label: "Gulf Standard Time — Dubai" },
    { value: "Asia/Kolkata", label: "India Standard Time — Kolkata" },
    { value: "Asia/Singapore", label: "Singapore Time — Singapore" },
    { value: "Asia/Tokyo", label: "Japan Standard Time — Tokyo" },
    { value: "Asia/Seoul", label: "Korea Standard Time — Seoul" },
    { value: "Asia/Shanghai", label: "China Standard Time — Shanghai" },
    { value: "Australia/Perth", label: "Australian Western Time — Perth" },
    { value: "Australia/Sydney", label: "Australian Eastern Time — Sydney" },
    { value: "Pacific/Auckland", label: "New Zealand Time — Auckland" },
  ];

  useEffect(() => {
    setZone(browserZone);
  }, [browserZone]);

  function draftFor(session: ScheduledTutoringSession) {
    const draft = drafts[session.id];
    return {
      start:
        draft?.start ??
        localInputForZone(session.scheduledStart, session.timeZone || zone),
      duration:
        draft?.duration ??
        String(session.durationMinutes ?? defaultDurationMinutes ?? 60),
    };
  }

  async function save(session: ScheduledTutoringSession) {
    const draft = draftFor(session);
    setSavingId(session.id);
    setSuccess(null);
    setErrors((current) => ({ ...current, [session.id]: "" }));
    try {
      const response = await fetch(
        `/api/admin/tutoring-sessions/${encodeURIComponent(session.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledStartLocal: draft.start,
            timeZone: zone,
            durationMinutes: Number(draft.duration),
          }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "Could not save the session.");
      setSuccess(`Session ${session.sessionNumber} scheduled.`);
      setDrafts((current) => {
        const next = { ...current };
        delete next[session.id];
        return next;
      });
      router.refresh();
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [session.id]:
          error instanceof Error
            ? error.message
            : "Could not save the session.",
      }));
    } finally {
      setSavingId(null);
    }
  }

  if (!sessions.length) {
    return (
      <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-semibold">Tutoring session schedule</h3>
        <p className="mt-2 text-sm text-slate-500">
          Session dates will appear here after the tutoring plan is marked as
          agreed.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-blue-200">
      {/* Compact header */}
      <div className="flex flex-col gap-3 border-b border-slate-300 bg-slate-50/80 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Session schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {sessions.length} {sessions.length === 1 ? "lesson" : "lessons"} ·
              Set date and duration
            </p>
          </div>
        </div>

        <div className="w-full sm:max-w-xs">
          <label
            htmlFor={`timezone-${requestId}`}
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            Time zone
          </label>

          <select
            id={`timezone-${requestId}`}
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-indigo-950"
          >
            {!TIME_ZONE_OPTIONS.some((option) => option.value === zone) && (
              <option value={zone}>{zone} — Current device zone</option>
            )}

            {TIME_ZONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Success feedback */}
      {success && (
        <div
          role="status"
          className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>
          {success}
        </div>
      )}

      {/* Session rows */}
      <div className="divide-y divide-slate-300">
        {sessions.map((session) => {
          const draft = draftFor(session);

          return (
            <article
              key={session.id}
              className="px-3 py-3 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
            >
              <div className="grid grid-cols-1 items-end gap-2.5 sm:grid-cols-[minmax(100px,0.7fr)_minmax(190px,1.5fr)_110px_40px]">
                {/* Session identity */}
                <div className="flex min-w-0 items-center gap-2 sm:self-center">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-xs font-bold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {String(session.sessionNumber).padStart(2, "0")}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                      Session {session.sessionNumber}
                    </p>

                    <span className="mt-1 inline-flex max-w-full rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-inset ring-slate-200 dark:text-slate-400 dark:ring-slate-700">
                      {session.status.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Date and time */}
                <label className="block min-w-0 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Date & time
                  <input
                    type="datetime-local"
                    value={draft.start}
                    onChange={(e) =>
                      setDrafts((current) => ({
                        ...current,
                        [session.id]: {
                          ...draft,
                          start: e.target.value,
                        },
                      }))
                    }
                    className="mt-1 block w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-950"
                  />
                </label>

                {/* Duration */}
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Duration
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min={15}
                      max={240}
                      step={15}
                      value={draft.duration}
                      onChange={(e) =>
                        setDrafts((current) => ({
                          ...current,
                          [session.id]: {
                            ...draft,
                            duration: e.target.value,
                          },
                        }))
                      }
                      className="block w-full rounded-md border border-slate-200 bg-white px-2 py-2 pr-8 text-xs text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-950"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                      min
                    </span>
                  </div>
                </label>

                {/* Icon-only save button */}
                <div className="flex justify-end sm:self-end">
                  <button
                    type="button"
                    onClick={() => save(session)}
                    disabled={savingId !== null || !draft.start || !zone.trim()}
                    aria-label={
                      savingId === session.id
                        ? "Saving session"
                        : `Save session ${session.sessionNumber}`
                    }
                    title={
                      savingId === session.id ? "Saving..." : "Save session"
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-600 bg-indigo-600 text-white shadow-sm transition hover:border-indigo-700 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus:ring-offset-slate-950"
                  >
                    {savingId === session.id ? (
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                        <path d="M17 21v-8H7v8" />
                        <path d="M7 3v5h8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Saved time summary */}
              {session.scheduledStart && session.timeZone && (
                <div className="ml-0 mt-2.5 flex flex-col gap-1 rounded-md bg-slate-50 px-2.5 py-2 text-[11px] dark:bg-slate-900 sm:ml-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                  <p className="text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Scheduled:
                    </span>{" "}
                    {displayTime(session.scheduledStart, session.timeZone)}
                    <span className="ml-1 text-slate-400">
                      ({session.timeZone})
                    </span>
                  </p>

                  <p className="text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Your time:</span>{" "}
                    {displayTime(session.scheduledStart, browserZone)}
                  </p>
                </div>
              )}

              {/* Error feedback */}
              {errors[session.id] && (
                <p
                  role="alert"
                  className="mt-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                >
                  {errors[session.id]}
                </p>
              )}
            </article>
          );
        })}

        {sessions.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              No sessions available
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Sessions appear here after the tutoring plan is agreed.
            </p>
          </div>
        )}
      </div>

      {/* Compact footer */}
      <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-800">
        <p className="text-[10px] leading-4 text-slate-500 dark:text-slate-400">
          Times are interpreted in the selected time zone and displayed in each
          viewer’s local time. Changing the time zone affects newly entered
          times.
        </p>
      </div>
    </section>
  );
}
