"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, LockKeyhole, Save } from "lucide-react";

type Props = {
  bookingId: string;
  status: string;
  initial: {
    topic: string;
    topicsCovered: string[];
    strengths: string;
    needsPractice: string;
    nextStep: string;
    tutorNotes: string;
    learnerOutcome: string;
  };
};

export default function EducatorSessionFeedbackForm({
  bookingId,
  status,
  initial,
}: Props) {
  const [topic, setTopic] = useState(initial.topic);
  const [topicsCoveredText, setTopicsCoveredText] = useState(
    initial.topicsCovered.join("\n"),
  );
  const [strengths, setStrengths] = useState(initial.strengths);
  const [needsPractice, setNeedsPractice] = useState(initial.needsPractice);
  const [nextStep, setNextStep] = useState(initial.nextStep);
  const [tutorNotes, setTutorNotes] = useState(initial.tutorNotes);
  const [learnerOutcome, setLearnerOutcome] = useState(initial.learnerOutcome);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function saveFeedback(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    const topicsCovered = topicsCoveredText
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    try {
      const response = await fetch(`/api/tutoring/sessions/${bookingId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim() || null,
          topicsCovered,
          strengths: strengths.trim() || null,
          needsPractice: needsPractice.trim() || null,
          nextStep: nextStep.trim() || null,
          tutorNotes: tutorNotes.trim() || null,
          learnerOutcome: learnerOutcome.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save session feedback.");
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save session feedback.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={saveFeedback} className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 border-b border-border/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-600">Session feedback</p>
          <h2 className="mt-1 text-xl font-bold">Record the learning outcome</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Learner-facing feedback becomes part of the learner&apos;s Progress and History automatically.
            Tutor notes remain private to the teaching workflow.
          </p>
        </div>

        <span className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          {status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-7 space-y-6">
        <Field label="Session topic" value={topic} onChange={setTopic} placeholder="e.g. Linear equations" />

        <div>
          <label className="text-sm font-semibold">Topics covered</label>
          <p className="mt-1 text-xs text-muted-foreground">
            One topic or skill per line.
          </p>
          <textarea
            value={topicsCoveredText}
            onChange={(event) => setTopicsCoveredText(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            placeholder={"Solving for x\nMulti-step equations"}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TextArea label="Strengths" value={strengths} onChange={setStrengths} placeholder="What did the learner do well?" />
          <TextArea label="Needs practice" value={needsPractice} onChange={setNeedsPractice} placeholder="What should the learner practice next?" />
          <TextArea label="Next step" value={nextStep} onChange={setNextStep} placeholder="What should happen after this session?" />
          <TextArea label="Learner outcome" value={learnerOutcome} onChange={setLearnerOutcome} placeholder="What can the learner now do or understand?" />
        </div>

        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex gap-3">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
            <div className="w-full">
              <p className="text-sm font-semibold">Private tutor notes</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                These notes are stored for the educator workflow and are not shown on the learner Progress or History pages.
              </p>
              <textarea
                value={tutorNotes}
                onChange={(event) => setTutorNotes(event.target.value)}
                rows={5}
                className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                placeholder="Private teaching notes..."
              />
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {saved ? (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="size-4" />
          Feedback saved. The learner record now reflects these learning outcomes.
        </div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          {saving ? "Saving..." : "Save feedback"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
      />
    </div>
  );
}
