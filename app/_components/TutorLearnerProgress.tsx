"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Loader2, Target, Users } from "lucide-react";
import Link from "next/link";

type Learner = {
  learner: { id: string; name: string; email: string; imageUrl: string | null };
  gradeLevels: string[];
  subjects: string[];
  completedSessions: number;
  practice: { totalActivities: number; completedActivities: number; percentage: number | null };
  topics: string[];
  needsPractice: string[];
  nextSteps: string[];
  lastSession: { id: string; scheduledStart: string; topic: string | null; strengths: string | null; needsPractice: string | null; nextStep: string | null; learnerOutcome: string | null; tutorNotes: string | null } | null;
  lastPractice: { id: string; status: string; score: number | null; maxScore: number | null; completedAt: string | null; resource: { id: string; title: string; subject: string | null; topic: string | null } } | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function TutorLearnerProgress() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/tutoring/learner-progress", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { learners?: Learner[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Unable to load learner progress.");
        if (active) setLearners(data.learners ?? []);
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Unable to load learner progress."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6"><Loader2 className="h-5 w-5 animate-spin text-violet-600" /></div>;
  if (error || learners.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950"><Users className="h-4 w-4" /> Learner progress</div>
          <p className="mt-1 text-sm text-slate-500">Review what each learner practiced after your lessons so the next session can build on it.</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {learners.map((item) => (
          <article key={item.learner.id} className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-950">{item.learner.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{item.gradeLevels.join(" · ") || "Grade not recorded"}{item.subjects.length ? ` · ${item.subjects.join(", ")}` : ""}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{item.completedSessions} lessons</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Practice completed</p><p className="mt-1 font-semibold text-slate-900">{item.practice.completedActivities}/{item.practice.totalActivities}</p></div>
              <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Scored practice</p><p className="mt-1 font-semibold text-slate-900">{item.practice.percentage === null ? "—" : `${item.practice.percentage}%`}</p></div>
            </div>
            {item.needsPractice.length > 0 && <div className="mt-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400"><Target className="h-3.5 w-3.5" /> Practice areas</p><div className="mt-2 flex flex-wrap gap-2">{item.needsPractice.slice(0, 4).map((value) => <span key={value} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700">{value}</span>)}</div></div>}
            {item.lastPractice && <div className="mt-4 rounded-2xl border border-slate-100 p-3"><div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><BookOpen className="h-3.5 w-3.5" /> Latest practice</div><p className="mt-1 text-sm font-medium text-slate-900">{item.lastPractice.resource.title}</p><p className="mt-1 text-xs text-slate-500">{item.lastPractice.completedAt ? formatDate(item.lastPractice.completedAt) : "In progress"}{item.lastPractice.score !== null && item.lastPractice.maxScore !== null ? ` · ${item.lastPractice.score}/${item.lastPractice.maxScore}` : ""}</p></div>}
            {item.lastSession && <div className="mt-4 rounded-2xl border border-slate-100 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last lesson · {formatDate(item.lastSession.scheduledStart)}</p><p className="mt-1 text-sm font-medium text-slate-900">{item.lastSession.topic || "Math lesson"}</p>{item.lastSession.nextStep && <p className="mt-2 text-sm leading-5 text-slate-600"><span className="font-medium text-slate-800">Next:</span> {item.lastSession.nextStep}</p>}</div>}
            <Link href={`/tutoring/sessions?studentId=${encodeURIComponent(item.learner.id)}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-950">View learner record <ArrowRight className="h-4 w-4" /></Link>
          </article>
        ))}
      </div>
    </section>
  );
}
