"use client";

import { useMemo, useState } from "react";

type Question = {
  id: string;
  number: number;
  type: string;
  question: string;
  options: { id: string; text: string }[] | null;
  points: number;
};

type ResourceData = {
  id: string;
  type: string;
  title: string;
  gradeLevel: string;
  subject: string;
  topic: string;
  learningObjective?: string | null;
  questions: Question[];
};

export default function ResourceLearner({
  resourceId,
  initialResource,
}: {
  resourceId: string;
  initialResource: ResourceData;
}) {
  const [resource, setResource] = useState<ResourceData | null>(null);
  const [activityId, setActivityId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const questions = resource?.questions ?? initialResource.questions;
  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? "").trim()).length,
    [answers, questions],
  );

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/resources/${resourceId}/activity`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to start resource.");
      setResource(data.resource);
      setActivityId(data.activityId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start resource.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!activityId) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/resources/${resourceId}/activity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, answers }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !activityId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-600">Preparing your activity…</p>
        <button
          onClick={start}
          className="mt-4 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Start Resource
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={start}
          className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Completed</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          {result.percentage}%
        </h2>
        <p className="mt-2 text-slate-600">
          You scored {result.score} out of {result.maxScore} points.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  const activeResource = resource ?? initialResource;

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {activeResource.subject} · {activeResource.gradeLevel}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">
          {activeResource.title}
        </h1>
        {activeResource.learningObjective && (
          <p className="mt-2 text-sm text-slate-600">
            {activeResource.learningObjective}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          {answeredCount} of {questions.length} answered
        </p>
      </header>

      <div className="space-y-4">
        {questions.map((q) => (
          <section
            key={q.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex gap-3">
              <span className="font-bold text-slate-500">{q.number}.</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-7 text-slate-950">
                  {q.question}
                </p>

                {q.options?.length ? (
                  <div className="mt-4 space-y-2">
                    {q.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={option.text}
                          checked={answers[q.id] === option.text}
                          onChange={(e) =>
                            setAnswers((current) => ({
                              ...current,
                              [q.id]: e.target.value,
                            }))
                          }
                        />
                        <span className="text-sm text-slate-700">
                          {option.text}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    value={answers[q.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((current) => ({
                        ...current,
                        [q.id]: e.target.value,
                      }))
                    }
                    placeholder="Type your answer"
                    className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
                  />
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="sticky bottom-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <p className="text-sm text-slate-600">
          {answeredCount}/{questions.length} answered
        </p>
        <button
          onClick={submit}
          disabled={submitting || !activityId}
          className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit Answers"}
        </button>
      </div>
    </div>
  );
}
