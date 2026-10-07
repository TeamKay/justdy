"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Paperclip,
  Sparkles,
  X,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

type LiveRequest = {
  id: string;
  status: string;
  subject: string;
  gradeLevel: string | null;
  topic: string | null;
  description: string;
  assignmentUrl: string | null;
  assignmentName: string | null;
  assignmentType: string | null;
  requestedAt: string;
  waitingAt: string | null;
  selectedAt: string | null;
  connectingAt: string | null;
  activeAt: string | null;
  sessionId?: string | null;
};

type Props = {
  user: {
    id: string;
    name: string;
    role: string | null;
  };
};

const subjects = [
  "Mathematics",
  "English",
  "Science",
  "Social Studies",
  "Reading",
  "Writing",
  "Computer Science",
  "Other",
];

const gradeLevels = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

function statusTitle(status: string) {
  switch (status) {
    case "REQUESTED":
      return "Preparing your request";

    case "WAITING":
      return "Looking for an available teacher";

    case "SELECTED":
      return "A teacher selected your request";

    case "CONNECTING":
      return "Connecting you to your teacher";

    case "ACTIVE":
      return "Your live help session is active";

    case "ENDED":
      return "Your session has ended";

    default:
      return "Live Homework Help";
  }
}

function statusDescription(status: string) {
  switch (status) {
    case "REQUESTED":
      return "Your credit balance is checked when a teacher accepts your request. Credits are reserved for up to one hour at that teacher's rate.";

    case "WAITING":
      return "Teachers who are currently available can see your request.";

    case "SELECTED":
      return "Your teacher is preparing to join you.";

    case "CONNECTING":
      return "Your private learning room is being prepared.";

    case "ACTIVE":
      return "You are now connected with your teacher.";

    case "ENDED":
      return "Your live homework-help session is complete.";

    default:
      return "";
  }
}

export default function LiveHomeworkHelpWorkspace({ user }: Props) {
  const learnerName = user.name?.trim() || "Learner";
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");

  const [request, setRequest] = useState<LiveRequest | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRequest = useCallback(async () => {
    try {
      const response = await fetch("/api/live-homework-help", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load live homework help.");
      }

      const nextRequest = data.request ?? null;
      setRequest(nextRequest);

   
      if (
        nextRequest?.sessionId &&
        ["SELECTED", "CONNECTING", "ACTIVE"].includes(nextRequest.status)
      ) {
        window.location.href = `/live-help/classroom/${nextRequest.sessionId}`;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load live homework help.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRequest();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRequest]);

  useEffect(() => {
    if (
      !request ||
      !["WAITING", "SELECTED", "CONNECTING"].includes(request.status)
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadRequest();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [request, loadRequest]);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (!subject) {
      setError("Choose the subject you need help with.");
      return;
    }

    if (!description.trim()) {
      setError("Tell the teacher what you are working on.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/live-homework-help", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          gradeLevel,
          topic,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to request live help.");
      }

      const createdRequest = data.request as LiveRequest;
      setRequest(createdRequest);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to request live help.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const handleAttachmentChange = (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    setError("Please choose a file smaller than 10 MB.");
    event.target.value = "";
    return;
  }

  setError("");
  setAttachment(file);
};

const removeAttachment = () => {
  setAttachment(null);
};

  async function cancelRequest() {
    if (!request) {
      return;
    }

    setCancelling(true);
    setError(null);

    try {
      const response = await fetch("/api/live-homework-help", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: request.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to leave the waiting room.");
      }

      setRequest(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to cancel request.",
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading Live Homework Help...
        </div>
      </div>
    );
  }

  if (request) {
    return (
      <WaitingRoom
        request={request}
        cancelling={cancelling}
        error={error}
        onCancel={cancelRequest}
      />
    );
  }

  return (
    <div className=" w-full">
      <div className="mx-auto pt-10 flex w-full max-w-6xl flex-col px-3 sm:px-4">
        <div className="flex flex-1 overflow-hidden rounded-lg">
          <section className="flex min-h-0 w-full flex-col">

            {/* Header */}
            <div className=" px-5 py-5 text-center sm:px-8 sm:py-6">
              <div className="flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-violet-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  LIVE HUMAN SUPPORT
                </div>

                <h1 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
                  Get unstuck. Learn it live.
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Describe your project, we&apos;ll connect you
                  with available expert for one-on-one guidance in less than a minute.
                </p>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={submitRequest}
              className="mx-auto w-full max-w-4xl flex-1 px-5 py-5 sm:px-8 sm:py-6"
            >
              {/* Subject / Grade */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Subject">
                  <select
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="h-11 w-full rounded-lg px-3 text-sm text-slate-900 shadow-sm outline-none transition-all hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
                  >
                    <option value="">Select a subject</option>

                    {subjects.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Grade level">
                  <select
                    value={gradeLevel}
                    onChange={(event) => setGradeLevel(event.target.value)}
                    className="h-11 w-full rounded-lg px-3 text-sm text-slate-900 shadow-sm outline-none transition-all hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
                  >
                    <option value="">Select grade level</option>

                    {gradeLevels.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Topic */}
              <div className="mt-3">
                <Field label="Topic">
                  <input
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="e.g. Adding fractions"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
                  />
                </Field>
              </div>

              {/* Description */}
              <div className="mt-3">
                <Field label="Describe the problem">
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    placeholder="Tell the teacher what you are trying to solve, what you have tried, and where you got stuck..."
                    className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition-all hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
                  />
                </Field>
              </div>

              {/* Attachment */}
              <div className="mt-3">
                <Field label="Assignment attachment">
                  {!attachment ? (
                    <label className="group flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 transition-all hover:border-violet-300 hover:bg-violet-50/40">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm transition-colors group-hover:text-violet-600">
                          <Paperclip className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700">
                            Attach an assignment
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-400">
                            PDF, PNG, JPG, or WEBP · Up to 10 MB
                          </p>
                        </div>
                      </div>

                      <span className="ml-3 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors group-hover:border-violet-200 group-hover:text-violet-700">
                        Choose file
                      </span>

                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                        onChange={handleAttachmentChange}
                        className="sr-only"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border border-violet-100 bg-violet-50/50 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
                          <Paperclip className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800">
                            {attachment.name}
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={removeAttachment}
                        className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-red-500"
                        aria-label="Remove attachment"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </Field>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* Footer / Submit */}
              <div className="mt-5 flex flex-col items-center gap-3 border-t border-slate-100 pt-4">
                <p className="text-center text-[11px] leading-5 text-slate-400">
                  Your request is shared with available teachers only.
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 w-full max-w-sm items-center justify-center gap-2 rounded-lg bg-emerald-950 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-14px_rgba(15,23,42,0.7)] transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_16px_34px_-16px_rgba(15,23,42,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Entering queue...
                    </>
                  ) : (
                    <>
                      Get Live Homework Help
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}



function WaitingRoom({
  request,
  cancelling,
  error,
  onCancel,
}: {
  request: LiveRequest;
  cancelling: boolean;
  error: string | null;
  onCancel: () => void;
}) {
  const isWaiting =
    request.status === "WAITING" || request.status === "REQUESTED";

  const classroomReady =
    Boolean(request.sessionId) &&
    ["SELECTED", "CONNECTING", "ACTIVE"].includes(request.status);

  const steps = [
    {
      number: 1,
      title: "Request submitted",
      description: "Your homework request is ready",
      complete: true,
      active: false,
    },
    {
      number: 2,
      title: "Finding a teacher",
      description: "Searching for someone available",
      complete: request.status !== "REQUESTED",
      active: request.status === "REQUESTED" || request.status === "WAITING",
    },
    {
      number: 3,
      title: "Teacher selected",
      description: "Your teacher is joining",
      complete: ["CONNECTING", "ACTIVE"].includes(request.status),
      active: request.status === "SELECTED",
    },
    {
      number: 4,
      title: "Private classroom",
      description: "Your live session is ready",
      complete: request.status === "ACTIVE",
      active: request.status === "CONNECTING",
    },
  ];

  return (
    <div className="min-h-[calc(100dvh-64px)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-76px)] w-full max-w-6xl items-center">
        <div className="w-full overflow-hidden rounded-lg">
          <div className="px-5 py-7 sm:px-8 sm:py-8">

            {/* Visual progress */}
            <div className="mx-auto max-w-4xl">
              <div className="rounded-lg border border-slate-200 p-5 shadow-sm sm:p-7">

                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Your connection
                  </p>

                  <h2 className="mt-1.5 text-[25px] font-bold tracking-tight text-slate-950">
                    We&apos;re getting you connected
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Your request moves through these steps automatically.
                  </p>
                </div>

                {/* Progress track */}
                <div className="relative mt-8">

                  {/* Connecting line */}
                  <div className="absolute left-[12.5%] right-[12.5%] top-5 hidden h-0.5 bg-slate-200 sm:block" />

                  {/* Completed progress line */}
                  <div
                    className="absolute left-[12.5%] top-5 hidden h-0.5 bg-violet-500 transition-all duration-700 sm:block"
                    style={{
                      width:
                        request.status === "REQUESTED"
                          ? "0%"
                          : request.status === "WAITING"
                            ? "33%"
                            : request.status === "SELECTED"
                              ? "66%"
                              : "100%",
                    }}
                  />

                  <div className="relative grid gap-5 sm:grid-cols-4 sm:gap-0">
                    {steps.map((step) => {
                      const isActive = step.active;
                      const isComplete = step.complete;

                      return (
                        <div
                          key={step.number}
                          className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center"
                        >
                          {/* Mobile connector */}
                          {step.number > 1 && (
                            <div className="absolute left-5 -mt-5 h-5 w-px bg-slate-200 sm:hidden" />
                          )}

                          {/* Circle */}
                          <div
                            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 text-xs font-bold transition-all duration-500 ${
                              isComplete
                                ? "border-violet-500 bg-violet-500 text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,0.8)]"
                                : isActive
                                  ? "border-violet-500 bg-white text-violet-600 shadow-[0_0_0_5px_rgba(124,58,237,0.1)]"
                                  : "border-slate-200 bg-white text-slate-400"
                            }`}
                          >
                            {isComplete ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              step.number
                            )}

                            {isActive && (
                              <span className="absolute -inset-1.5 rounded-lg border border-violet-200 opacity-70" />
                            )}
                          </div>

                          {/* Text */}
                          <div className="pt-0.5 sm:mt-3 sm:pt-0">
                            <p
                              className={`text-xs font-bold ${
                                isComplete || isActive
                                  ? "text-slate-900"
                                  : "text-slate-400"
                              }`}
                            >
                              {step.title}
                            </p>

                            <p
                              className={`mt-1 text-[11px] leading-5 ${
                                isActive
                                  ? "text-violet-600"
                                  : "text-slate-400"
                              }`}
                            >
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current status */}
                {isWaiting && (
                  <div className="mt-8 flex items-center justify-center gap-3 rounded-lg bg-emerald-950 px-4 py-3">
                    <div className="relative flex h-7 w-7 items-center justify-center">
                      <span className="absolute inset-0 animate-ping rounded-full bg-violet-200 opacity-60" />
                      <span className="relative h-3.5 w-3.5 rounded-full bg-amber-300" />
                    </div>

                    <p className="text-xs font-medium text-white">
                      Looking for an available teacher...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Request details */}
            <div className="mx-auto mt-6 max-w-4xl">
              <div className="rounded-lg border border-slate-200 bg-emerald-950 p-5 sm:p-6">

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                      Your request
                    </p>

                    <h3 className="mt-1 text-sm font-bold text-white">
                      Homework details
                    </h3>
                  </div>

                  {isWaiting && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold text-amber-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-lg bg-amber-300" />
                      Waiting
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 rounded-lg">
                  <InfoPill>{request.subject}</InfoPill>

                  {request.gradeLevel && (
                    <InfoPill>{request.gradeLevel}</InfoPill>
                  )}

                  {request.topic && (
                    <InfoPill>{request.topic}</InfoPill>
                  )}
                </div>

                <div className="mt-4 rounded-lg bg-white px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Problem
                  </p>

                  <p className="mt-1.5 text-sm leading-6 text-slate-700">
                    {request.description}
                  </p>
                </div>

                {request.assignmentName && (
                  <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200/70 bg-white px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Attachment
                      </p>

                      <p className="truncate text-xs font-semibold text-slate-700">
                        {request.assignmentName}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Cancel */}
              {isWaiting && (
                <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-medium text-slate-600">
                      Need to make a change?
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-400">
                      You can leave the queue and submit a new request.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={cancelling}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-950 px-3.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cancelling ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}

                    {cancelling ? "Leaving..." : "Leave queue"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-center">
            <p className="text-[11px] text-slate-400">
              Your request is private and only shared with available teachers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



function ProgressStep({
  number,
  title,
  complete,
  active = false,
  last = false,
}: {
  number: string;
  title: string;
  complete: boolean;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            complete
              ? "bg-emerald-50 text-emerald-600"
              : active
                ? "bg-violet-50 text-violet-600"
                : "bg-slate-100 text-slate-400"
          }`}
        >
          {complete ? <CheckCircle2 className="h-4 w-4" /> : number}
        </div>

        {!last && <div className="my-1 h-8 w-px bg-slate-200" />}
      </div>

      <div className="pt-2">
        <p
          className={`text-sm font-semibold ${
            active || complete ? "text-slate-900" : "text-slate-400"
          }`}
        >
          {title}
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      {children}
    </label>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 transition-colors hover:bg-white">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
        {icon}
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function SideItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-300">
      <CheckCircle2 className="h-3.5 w-3.5 text-violet-300" />
      {text}
    </div>
  );
}

function InfoPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500">
      {children}
    </span>
  );
}
