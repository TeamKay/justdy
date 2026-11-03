"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Gamepad2,
  Loader2,
  Search,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

type GameAttempt = {
  id: string;
  gameId: string;
  gameTitle: string;
  score: number;
  totalQuestions: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  mode: "practice" | "timed";
  xpEarned: number;
  streak: number;
  completedAt: string;
};

type GameProgress = {
  bestScores: Record<string, number>;
  completedGames: number;
  totalXp: number;
  perfectGames: number;
  bestStreak: number;
  history: GameAttempt[];
};

const EMPTY_PROGRESS: GameProgress = {
  bestScores: {},
  completedGames: 0,
  totalXp: 0,
  perfectGames: 0,
  bestStreak: 0,
  history: [],
};

type Filter = "all" | "math" | "arena" | "other";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getGameKind(gameId: string, gameTitle: string): Filter {
  const value = `${gameId} ${gameTitle}`.toLowerCase();
  if (value.includes("math-quest") || value.includes("math quest")) return "math";
  if (value.includes("quiz-arena") || value.includes("quiz arena")) return "arena";
  return "other";
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p>
    </article>
  );
}

export default function GameHistoryClient() {
  const [progress, setProgress] = useState<GameProgress>(EMPTY_PROGRESS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest">("newest");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/games/progress", {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (response.status === 401) {
          if (active) setError("Sign in to view your saved game history.");
          return;
        }
        if (!response.ok) throw new Error("We couldn't load your game history.");

        const payload: { progress?: Partial<GameProgress> } = await response.json();
        const remote = payload.progress;
        if (!remote) throw new Error("The game history response was incomplete.");

        if (active) {
          setProgress({
            bestScores: remote.bestScores ?? {},
            completedGames: Number(remote.completedGames ?? 0),
            totalXp: Number(remote.totalXp ?? 0),
            perfectGames: Number(remote.perfectGames ?? 0),
            bestStreak: Number(remote.bestStreak ?? 0),
            history: Array.isArray(remote.history) ? remote.history : [],
          });
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const rows = progress.history.filter((attempt) => {
      const matchesFilter = filter === "all" || getGameKind(attempt.gameId, attempt.gameTitle) === filter;
      const matchesQuery =
        !normalizedQuery ||
        attempt.gameTitle.toLowerCase().includes(normalizedQuery) ||
        attempt.gameId.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });

    return rows.sort((a, b) => {
      if (sortOrder === "highest") {
        return b.score / Math.max(1, b.totalQuestions) - a.score / Math.max(1, a.totalQuestions);
      }
      const difference = new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
      return sortOrder === "newest" ? -difference : difference;
    });
  }, [progress.history, filter, query, sortOrder]);

  const averageAccuracy = progress.history.length
    ? Math.round(
        (progress.history.reduce(
          (sum, attempt) => sum + (attempt.score / Math.max(1, attempt.totalQuestions)) * 100,
          0,
        ) / progress.history.length),
      )
    : 0;

  const bestAccuracy = progress.history.length
    ? Math.max(...progress.history.map((attempt) => Math.round((attempt.score / Math.max(1, attempt.totalQuestions)) * 100)))
    : 0;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
            Your learning arcade
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Game history & performance
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Review your completed games, celebrate your progress and see where your next practice session can take you.
          </p>
        </div>
        <Link
          href="/games"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Gamepad2 className="h-4 w-4" /> Play games <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-3 rounded-2xl border border-border/70 bg-card text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading your game performance…
        </div>
      ) : error ? (
        <section className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <Gamepad2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold text-foreground">Game history unavailable</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{error}</p>
          <Link href="/games" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Continue playing <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Games completed" value={progress.completedGames} helper="All recorded game attempts" icon={Gamepad2} tone="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" />
            <StatCard label="Experience earned" value={progress.totalXp.toLocaleString()} helper="XP collected from completed games" icon={Sparkles} tone="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" />
            <StatCard label="Perfect scores" value={progress.perfectGames} helper="Games completed with every answer correct" icon={Trophy} tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" />
            <StatCard label="Best answer streak" value={progress.bestStreak} helper="Your longest correct-answer streak" icon={Flame} tone="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <article className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Target className="h-4 w-4" /> Accuracy snapshot
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-4xl font-bold tracking-tight text-foreground">{averageAccuracy}%</p>
                  <p className="mt-1 text-sm text-muted-foreground">Average accuracy across the {progress.history.length} attempts currently available.</p>
                </div>
                <div>
                  <p className="text-4xl font-bold tracking-tight text-foreground">{bestAccuracy}%</p>
                  <p className="mt-1 text-sm text-muted-foreground">Best single-attempt accuracy in your available history.</p>
                </div>
              </div>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all" style={{ width: `${averageAccuracy}%` }} />
              </div>
            </article>
            <article className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Award className="h-4 w-4" /> Personal bests
              </div>
              {Object.keys(progress.bestScores).length ? (
                <div className="mt-4 space-y-3">
                  {Object.entries(progress.bestScores)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([gameId, score]) => (
                      <div key={gameId} className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                        <span className="truncate text-sm font-medium text-foreground">{gameId.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}</span>
                        <span className="shrink-0 rounded-lg bg-muted px-2.5 py-1 text-sm font-bold tabular-nums text-foreground">{score} correct</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Your best scores will appear here after your first game.</p>
              )}
            </article>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Your completed games</h2>
                <p className="mt-1 text-sm text-muted-foreground">The game history endpoint currently provides your 30 most recent attempts.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative block min-w-0 sm:min-w-56">
                  <span className="sr-only">Search game history</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search games…" className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15" />
                </label>
                <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-blue-500">
                  <option value="all">All games</option>
                  <option value="math">Math Quest</option>
                  <option value="arena">Quiz Arena</option>
                  <option value="other">Other games</option>
                </select>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-blue-500">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="highest">Highest accuracy</option>
                </select>
              </div>
            </div>

            {filteredHistory.length ? (
              <div className="mt-5 divide-y divide-border/70">
                {filteredHistory.map((attempt) => {
                  const accuracy = Math.round((attempt.score / Math.max(1, attempt.totalQuestions)) * 100);
                  const isPerfect = attempt.score === attempt.totalQuestions;
                  return (
                    <article key={attempt.id} className="flex flex-col gap-4 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                          <Gamepad2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{attempt.gameTitle}</h3>
                            {isPerfect && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 className="h-3 w-3" /> Perfect</span>}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(attempt.completedAt)}</span>
                            <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {formatTime(attempt.completedAt)}</span>
                            <span className="capitalize">{attempt.difficulty}</span>
                            <span className="capitalize">{attempt.mode}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 sm:min-w-64">
                        <div><p className="text-[11px] text-muted-foreground">Score</p><p className="mt-1 text-sm font-bold tabular-nums text-foreground">{attempt.score}/{attempt.totalQuestions}</p></div>
                        <div><p className="text-[11px] text-muted-foreground">Accuracy</p><p className="mt-1 text-sm font-bold tabular-nums text-foreground">{accuracy}%</p></div>
                        <div><p className="text-[11px] text-muted-foreground">XP earned</p><p className="mt-1 inline-flex items-center gap-1 text-sm font-bold tabular-nums text-amber-700 dark:text-amber-300"><Zap className="h-3.5 w-3.5" />{attempt.xpEarned}</p></div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-border px-5 py-12 text-center">
                <BookOpen className="mx-auto h-9 w-9 text-muted-foreground" />
                <h3 className="mt-3 font-semibold text-foreground">{progress.history.length ? "No matching games" : "Your game journey starts here"}</h3>
                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                  {progress.history.length ? "Try a different search or filter to find an attempt." : "Complete a game in the Justdy Playground and your saved results will appear here."}
                </p>
                <Link href="/games" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Explore games <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
