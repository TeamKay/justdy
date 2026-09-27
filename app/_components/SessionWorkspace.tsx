"use client";

import * as React from "react";
import { Check, Loader2, Play, Save, Square, Video } from "lucide-react";

interface SessionValue {
  id: string;
  bookingId: string;
  status: string;
  educatorAttendance: boolean | null;
  topic: string | null;
  topicsCovered: string[];
  strengths: string | null;
  needsPractice: string | null;
  nextStep: string | null;
  tutorNotes: string | null;
  learnerOutcome: string | null;
}

export default function SessionWorkspace({ session }: { session: SessionValue }) {
  const [status, setStatus] = React.useState(session.status);
  const [attendance, setAttendance] = React.useState<boolean | null>(session.educatorAttendance);
  const [topic, setTopic] = React.useState(session.topic ?? "");
  const [topicsCovered, setTopicsCovered] = React.useState(session.topicsCovered.join("\n"));
  const [strengths, setStrengths] = React.useState(session.strengths ?? "");
  const [needsPractice, setNeedsPractice] = React.useState(session.needsPractice ?? "");
  const [nextStep, setNextStep] = React.useState(session.nextStep ?? "");
  const [tutorNotes, setTutorNotes] = React.useState(session.tutorNotes ?? "");
  const [learnerOutcome, setLearnerOutcome] = React.useState(session.learnerOutcome ?? "");
  const [busy, setBusy] = React.useState<"save" | "start" | "end" | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function runLifecycle(action: "start" | "end") {
    setBusy(action);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/tutoring/sessions/${encodeURIComponent(session.bookingId)}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || `Unable to ${action} session.`);
      setStatus(data?.status ?? (action === "start" ? "IN_PROGRESS" : "COMPLETED"));
      setMessage(action === "start" ? "Session started." : "Session completed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update the session.");
    } finally {
      setBusy(null);
    }
  }

  async function saveNotes() {
    setBusy("save");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/educator/sessions/${encodeURIComponent(session.id)}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          topicsCovered: topicsCovered.split("\n").map((value) => value.trim()).filter(Boolean),
          strengths,
          needsPractice,
          nextStep,
          tutorNotes,
          learnerOutcome,
          educatorAttendance: attendance,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Unable to save session notes.");
      setMessage("Session notes saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save session notes.");
    } finally {
      setBusy(null);
    }
  }

  const canStart = status === "SCHEDULED";
  const canEnd = status === "IN_PROGRESS";
  const completed = status === "COMPLETED";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-xl font-semibold">Session outcome</h2><p className="mt-1 text-sm text-muted-foreground">Record what was taught and what the learner should work on next.</p></div>
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold">{status.replaceAll("_", " ")}</span>
        </div>

        <div className="mt-6 grid gap-5">
          <Field label="Session topic"><input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What was the main focus?" className="field" /></Field>
          <Field label="Topics covered"><textarea value={topicsCovered} onChange={(e) => setTopicsCovered(e.target.value)} placeholder="One topic per line" rows={4} className="field" /></Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Strengths"><textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={5} className="field" placeholder="What did the learner do well?" /></Field>
            <Field label="Needs practice"><textarea value={needsPractice} onChange={(e) => setNeedsPractice(e.target.value)} rows={5} className="field" placeholder="What needs reinforcement?" /></Field>
            <Field label="Next step"><textarea value={nextStep} onChange={(e) => setNextStep(e.target.value)} rows={5} className="field" placeholder="What should happen next?" /></Field>
            <Field label="Learner outcome"><textarea value={learnerOutcome} onChange={(e) => setLearnerOutcome(e.target.value)} rows={5} className="field" placeholder="Summarize the learner's outcome." /></Field>
          </div>
          <Field label="Private tutor notes"><textarea value={tutorNotes} onChange={(e) => setTutorNotes(e.target.value)} rows={6} className="field" placeholder="Private notes for your teaching records." /></Field>
        </div>

        {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {message && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><Check className="mr-2 inline h-4 w-4" />{message}</p>}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={saveNotes} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50"><Save className="h-4 w-4" />{busy === "save" ? "Saving…" : "Save notes"}</button>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold">Session controls</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use the lifecycle controls to keep the session status synchronized with the live classroom.</p>
          <div className="mt-5 space-y-3">
            {canStart && <button type="button" onClick={() => runLifecycle("start")} disabled={busy !== null} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Play className="h-4 w-4" />{busy === "start" ? "Starting…" : "Start session"}</button>}
            {canEnd && <button type="button" onClick={() => runLifecycle("end")} disabled={busy !== null} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"><Square className="h-4 w-4" />{busy === "end" ? "Completing…" : "Complete session"}</button>}
            {completed && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><Check className="mr-2 inline h-4 w-4" />This session is completed. You can still update its notes.</div>}
            <a href={`/tutoring/sessions/${session.bookingId}`} className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-muted"><Video className="h-4 w-4" />Open live classroom</a>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold">Attendance</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setAttendance(true)} className={`rounded-lg border px-3 py-2 text-sm font-medium ${attendance === true ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "hover:bg-muted"}`}>Attended</button>
            <button type="button" onClick={() => setAttendance(false)} className={`rounded-lg border px-3 py-2 text-sm font-medium ${attendance === false ? "border-rose-300 bg-rose-50 text-rose-700" : "hover:bg-muted"}`}>Absent</button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Save notes to persist the attendance value.</p>
        </div>
      </aside>

      <style jsx>{`.field{width:100%;border-radius:.75rem;border:1px solid hsl(var(--border));background:transparent;padding:.7rem .8rem;font-size:.875rem;outline:none}.field:focus{box-shadow:0 0 0 2px rgb(16 185 129 / .18);border-color:rgb(16 185 129 / .55)} textarea.field{resize:vertical}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2"><span className="text-sm font-medium">{label}</span>{children}</label>;
}
