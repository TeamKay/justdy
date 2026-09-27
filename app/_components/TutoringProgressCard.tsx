"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Target, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

type Progress = {
  completedSessions: number;
  totalMinutes: number;
  topics: string[];
  strengths: string[];
  needsPractice: string[];
  nextSteps: string[];
  practice: {
    totalActivities: number;
    completedActivities: number;
    practicePercentage: number | null;
    recentActivities: Array<{
      id: string;
      activityType: string;
      status: string;
      score: number | null;
      maxScore: number | null;
      startedAt: string;
      completedAt: string | null;
      resource: { id: string; title: string; type: string; subject: string | null; topic: string | null };
    }>;
  };
  recentSessions: Array<{
    id: string;
    scheduledStart: string;
    topic: string | null;
    educatorName: string;
    serviceTitle: string | null;
    subject: string | null;
    gradeLevel: string | null;
    strengths: string | null;
    needsPractice: string | null;
    nextStep: string | null;
    learnerOutcome: string | null;
  }>;
};

function List({ values, empty }: { values: string[]; empty: string }) {
  if (!values.length) return <p className="text-sm text-slate-500">{empty}</p>;

  return (
    <ul className="space-y-2">
      {values.slice(0, 5).map((value) => (
        <li key={value} className="flex gap-2 text-sm leading-5 text-slate-600">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>{value}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TutoringProgressCard({ studentId, compact = false }: { studentId?: string; compact?: boolean }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [recommendations, setRecommendations] = useState<Array<{
    id: string;
    title: string;
    slug: string;
    type: string;
    subject: string | null;
    topic: string | null;
    grade: string | null;
    description: string | null;
    matchedTerms: string[];
    learnUrl: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
      void Promise.all([
        fetch(`/api/tutoring/progress${query}`, { cache: "no-store" })
          .then(async (response) => {
            if (!response.ok) return null;
            const data = (await response.json()) as { progress?: Progress };
            return data.progress ?? null;
          }),
        fetch(`/api/tutoring/practice-recommendations${query}`, { cache: "no-store" })
          .then(async (response) => {
            if (!response.ok) return [];
            const data = (await response.json()) as { recommendations?: typeof recommendations };
            return data.recommendations ?? [];
          }),
      ])
        .then(([nextProgress, nextRecommendations]) => {
          setProgress(nextProgress);
          setRecommendations(nextRecommendations);
        })
        .catch(() => {
          setProgress(null);
          setRecommendations([]);
        })
        .finally(() => setLoading(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [studentId]);

  if (loading || !progress || progress.completedSessions === 0) return compact ? <p className="text-sm text-muted-foreground">No completed tutoring lessons yet.</p> : null;

  return (
    <section className={compact ? "" : "mb-10"}>
      <div className="mb-5 flex items-end justify-between gap-6">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Tutoring progress
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Your recent learning progress
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Feedback from completed live math lessons, kept alongside your practice.
          </p>
        </div>
        <Link
          href="/tutoring/sessions"
          className="hidden items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-950 sm:flex"
        >
          Session history <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <TrendingUp className="h-4 w-4" />
            Learning activity
          </div>
          <div className="mt-5 flex items-end gap-2">
            <span className="text-3xl font-semibold text-slate-950">{progress.completedSessions}</span>
            <span className="pb-1 text-sm text-slate-500">completed lessons</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">{progress.totalMinutes} minutes of live instruction recorded.</p>
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Practice</p>
            <p className="mt-1 text-sm text-slate-600">
              {progress.practice.completedActivities} of {progress.practice.totalActivities} activities completed
              {progress.practice.practicePercentage !== null ? ` · ${progress.practice.practicePercentage}% scored` : ""}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {progress.topics.slice(0, 6).map((topic) => (
              <span key={topic} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {topic}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <CheckCircle2 className="h-4 w-4" />
            Strengths
          </div>
          <div className="mt-4"><List values={progress.strengths} empty="Your tutor has not recorded strengths yet." /></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Target className="h-4 w-4" />
            Areas to practice
          </div>
          <div className="mt-4"><List values={progress.needsPractice} empty="No practice areas have been recorded yet." /></div>
        </div>
      </div>

      {progress.practice.recentActivities.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <CheckCircle2 className="h-4 w-4" />
            Recent practice
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {progress.practice.recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{activity.resource.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{activity.resource.topic || activity.resource.subject || activity.activityType} · {activity.status}</p>
                </div>
                {activity.score !== null && activity.maxScore !== null && (
                  <span className="shrink-0 text-xs font-semibold text-slate-700">{activity.score}/{activity.maxScore}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <BookOpen className="h-4 w-4" />
                Practice resources
              </div>
              <p className="mt-1 text-sm text-slate-500">Free learning resources matched to recent tutoring topics.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.slice(0, 6).map((resource) => (
              <Link key={resource.id} href={resource.learnUrl} className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-400 hover:shadow-sm">
                <p className="text-sm font-semibold text-slate-950">{resource.title}</p>
                <p className="mt-1 text-xs text-slate-500">{resource.topic || resource.subject || resource.type.replaceAll("_", " ")}</p>
                {resource.matchedTerms.length > 0 && (
                  <p className="mt-3 text-xs text-slate-500">Matches: {resource.matchedTerms.slice(0, 2).join(", ")}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-700">Practice now <ArrowRight className="h-3.5 w-3.5" /></span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {progress.nextSteps.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <BookOpen className="h-4 w-4" />
            Recommended next steps
          </div>
          <div className="mt-4"><List values={progress.nextSteps} empty="No next steps have been recorded yet." /></div>
        </div>
      )}
    </section>
  );
}
