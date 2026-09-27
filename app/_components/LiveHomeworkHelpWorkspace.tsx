"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  HelpCircle,
  Loader2,
  Paperclip,
  Send,
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
      return "Your request is being prepared.";

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

      /*
       * Once a teacher has selected the learner, the API creates
       * a LiveHomeworkSession. Move the learner directly into
       * that private classroom.
       */
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

  /*
   * While waiting for a teacher, refresh the request state.
   */
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

      setRequest(data.request);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to request live help.",
      );
    } finally {
      setSubmitting(false);
    }
  }

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
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
            <Sparkles className="h-3.5 w-3.5" />
            Immediate human help
          </div>

          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Stuck on homework?
            <br />
            Get help now.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500">
            Tell us what you&apos;re working on and enter the live-help queue.
            An available teacher can review your request and connect with you
            for one-on-one guidance.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Feature
              icon={<Send className="h-4 w-4" />}
              title="Tell us"
              description="Describe the problem."
            />

            <Feature
              icon={<Clock3 className="h-4 w-4" />}
              title="Wait briefly"
              description="Available teachers see the queue."
            />

            <Feature
              icon={<GraduationCap className="h-4 w-4" />}
              title="Learn live"
              description="Work through it together."
            />
          </div>

          <form
            onSubmit={submitRequest}
            className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-7">
              <h2 className="text-xl font-semibold text-slate-950">
                What do you need help with, {learnerName}?
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Give your teacher enough context to understand the problem
                before connecting.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Subject">
                <select
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
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

            <div className="mt-5">
              <Field label="Topic">
                <input
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="e.g. Adding fractions"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                />
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Describe the problem">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={6}
                  placeholder="Tell the teacher what you are trying to solve, what you have tried, and where you got stuck..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                />
              </Field>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <Paperclip className="mt-0.5 h-4 w-4 text-slate-400" />

                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Assignment attachment
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    File/image upload will connect to the existing Justdy file
                    system in the next layer. For now, describe the problem
                    above.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entering live-help queue...
                </>
              ) : (
                <>
                  Get Live Homework Help
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <BookOpen className="h-5 w-5" />
            </div>

            <h3 className="mt-5 text-base font-semibold text-slate-950">
              Built for homework
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This isn&apos;t a scheduled tutoring appointment. It&apos;s for
              the moments when you&apos;re working on something right now and
              need guidance.
            </p>

            <div className="mt-5 space-y-3">
              <SideItem text="One-on-one teacher connection" />
              <SideItem text="Assignment-focused help" />
              <SideItem text="Live whiteboard learning" />
              <SideItem text="Private classroom" />
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <HelpCircle className="h-5 w-5 text-violet-300" />

            <p className="mt-4 text-sm font-semibold">Need immediate help?</p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Available teachers will see your request while you wait.
            </p>
          </div>
        </aside>
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

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 lg:px-8 lg:py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-600">
            {isWaiting ? (
              <Clock3 className="h-7 w-7 animate-pulse" />
            ) : (
              <CheckCircle2 className="h-7 w-7" />
            )}
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            Live Homework Help
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {statusTitle(request.status)}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {statusDescription(request.status)}
          </p>

          {classroomReady && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Opening your private classroom...
            </div>
          )}
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-3xl bg-slate-50 p-5">
          <div className="flex flex-wrap gap-2">
            <InfoPill>{request.subject}</InfoPill>

            {request.gradeLevel && <InfoPill>{request.gradeLevel}</InfoPill>}

            {request.topic && <InfoPill>{request.topic}</InfoPill>}
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-700">
            {request.description}
          </p>

          {request.assignmentName && (
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
              <FileText className="h-4 w-4" />
              {request.assignmentName}
            </div>
          )}
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          <ProgressStep number="1" title="Request submitted" complete />

          <ProgressStep
            number="2"
            title="Waiting for an available teacher"
            complete={request.status !== "REQUESTED"}
            active={request.status === "WAITING"}
          />

          <ProgressStep
            number="3"
            title="Teacher selected"
            complete={["SELECTED", "CONNECTING", "ACTIVE"].includes(
              request.status,
            )}
            active={request.status === "SELECTED"}
          />

          <ProgressStep
            number="4"
            title="Private classroom"
            complete={request.status === "ACTIVE"}
            active={request.status === "CONNECTING"}
            last
          />
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isWaiting && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              {cancelling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Leave waiting room
            </button>
          </div>
        )}
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
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
