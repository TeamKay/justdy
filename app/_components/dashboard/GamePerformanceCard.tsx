"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Gamepad2,
  Loader2,
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

export default function GamePerformanceCard() {
  const [progress, setProgress] = useState<GameProgress>(EMPTY_PROGRESS);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      try {
        const response = await fetch("/api/games/progress", {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          if (active) setUnavailable(true);
          return;
        }

        const payload: { progress?: Partial<GameProgress> } = await response.json();
        const remote = payload.progress;
        if (!remote || !active) return;

        setProgress({
          bestScores: remote.bestScores ?? {},
          completedGames: Number(remote.completedGames ?? 0),
          totalXp: Number(remote.totalXp ?? 0),
          perfectGames: Number(remote.perfectGames ?? 0),
          bestStreak: Number(remote.bestStreak ?? 0),
          history: Array.isArray(remote.history) ? remote.history : [],
        });
      } catch {
        if (active) setUnavailable(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProgress();
    return () => {
      active = false;
    };
  }, []);

  const latestAttempt = progress.history[0];

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-400">
            Practice & play
          </p>
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Game performance
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Track your quiz results, experience points and personal bests.
          </p>
        </div>
               <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/dashboard/games"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-violet-600 transition hover:gap-2 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            View full game history <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/games"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:gap-2 hover:text-blue-700 dark:text-blue-400"
          >
            Play games <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-muted/40 px-4 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your game performance…
        </div>
      ) : unavailable ? (
        <div className="mt-6 rounded-xl border border-dashed border-border px-5 py-7 text-center">
          <Gamepad2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold text-foreground">Game progress is unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in again or visit the Games page to continue practising. Your dashboard will show account progress when it can be loaded.
          </p>
          <Link href="/games" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
            Explore games <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : progress.completedGames === 0 ? (
        <div className="mt-6 rounded-xl bg-muted/40 px-5 py-8 text-center">
          <Gamepad2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold text-foreground">Your game journey starts here</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            Complete a game to earn XP, build your streak and see your performance here.
          </p>
          <Link href="/games" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
            Play your first game <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat label="Games completed" value={progress.completedGames} icon={Gamepad2} tone="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" />
            <Stat label="Total XP earned" value={progress.totalXp.toLocaleString()} icon={Zap} tone="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" />
            <Stat label="Perfect scores" value={progress.perfectGames} icon={Trophy} tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" />
            <Stat label="Best answer streak" value={progress.bestStreak} icon={Target} tone="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" />
          </div>

          {latestAttempt ? (
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                  <Award className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Latest game</p>
                  <p className="mt-0.5 truncate font-semibold text-foreground">{latestAttempt.gameTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(latestAttempt.completedAt)} · {latestAttempt.difficulty} · {latestAttempt.mode}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:justify-end">
                <div>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="font-bold tabular-nums text-foreground">{latestAttempt.score}/{latestAttempt.totalQuestions}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">XP earned</p>
                  <p className="inline-flex items-center gap-1 font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    <Sparkles className="h-3.5 w-3.5" /> {latestAttempt.xpEarned}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
