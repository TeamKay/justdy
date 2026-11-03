"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Brain,
  CheckCircle2,
  Clock3,
  Crown,
  Gamepad2,
  Gem,
  History,
  Medal,
  Play,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import MathQuestGame from "@/app/_components/games/MathQuestGame";
import QuizArenaGame from "@/app/_components/games/QuizArenaGame";

type Difficulty = "beginner" | "intermediate" | "advanced";
type GameMode = "practice" | "timed";

type GameAttempt = {
  id: string;
  gameId: string;
  gameTitle: string;
  score: number;
  totalQuestions: number;
  difficulty: Difficulty;
  mode: GameMode;
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

const GAME_PROGRESS_KEY = "justdy-games-progress";

const EMPTY_PROGRESS: GameProgress = {
  bestScores: {},
  completedGames: 0,
  totalXp: 0,
  perfectGames: 0,
  bestStreak: 0,
  history: [],
};

const DIFFICULTY_SETTINGS = {
  beginner: { label: "Beginner", seconds: 90, multiplier: 1 },
  intermediate: { label: "Intermediate", seconds: 60, multiplier: 1.5 },
  advanced: { label: "Advanced", seconds: 30, multiplier: 2 },
} as const;

function subscribeToGameProgress(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("justdy-games-progress-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("justdy-games-progress-change", onStoreChange);
  };
}

function getGameProgressSnapshot() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(GAME_PROGRESS_KEY);
  } catch {
    return null;
  }
}

function getServerGameProgressSnapshot() {
  return null;
}

function readGameProgress(snapshot: string | null): GameProgress {
  if (!snapshot) return EMPTY_PROGRESS;
  try {
    const parsed = JSON.parse(snapshot) as Partial<GameProgress>;
    return {
      bestScores: parsed.bestScores ?? {},
      completedGames: Number(parsed.completedGames ?? 0),
      totalXp: Number(parsed.totalXp ?? 0),
      perfectGames: Number(parsed.perfectGames ?? 0),
      bestStreak: Number(parsed.bestStreak ?? 0),
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

function saveCompletedGame(
  gameId: string,
  gameTitle: string,
  score: number,
  totalQuestions: number,
  difficulty: Difficulty,
  mode: GameMode,
  multiplier: number,
  streak: number,
) {
  if (typeof window === "undefined") return;

  try {
    const current = readGameProgress(getGameProgressSnapshot());
    const perfect = score === totalQuestions;
    const earnedXp =
      Math.round(score * 10 * multiplier) +
      (perfect ? 20 : 0) +
      (mode === "timed" ? 5 : 0) +
      Math.max(0, streak - 2) * 2;

    const attempt: GameAttempt = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      gameId,
      gameTitle,
      score,
      totalQuestions,
      difficulty,
      mode,
      xpEarned: earnedXp,
      streak,
      completedAt: new Date().toISOString(),
    };

    const next: GameProgress = {
      bestScores: {
        ...current.bestScores,
        [gameId]: Math.max(current.bestScores[gameId] ?? 0, score),
      },
      completedGames: current.completedGames + 1,
      totalXp: current.totalXp + earnedXp,
      perfectGames: current.perfectGames + (perfect ? 1 : 0),
      bestStreak: Math.max(current.bestStreak, streak),
      history: [attempt, ...current.history].slice(0, 30),
    };

    window.localStorage.setItem(GAME_PROGRESS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("justdy-games-progress-change"));

    // Keep the existing account-linked progress API; local progress remains available offline.
    void fetch("/api/games/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "attempt",
        gameId,
        gameTitle,
        score,
        totalQuestions,
        difficulty,
        mode,
        streak,
      }),
    }).catch(() => {});
  } catch {
    // The game remains playable if browser storage is unavailable.
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function StatTile({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-lg shadow-black/10 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-white/65">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-[11px] text-white/50">{detail}</p>
    </article>
  );
}

export default function GamesPage() {
  const progressSnapshot = useSyncExternalStore(
    subscribeToGameProgress,
    getGameProgressSnapshot,
    getServerGameProgressSnapshot,
  );
  const progress = readGameProgress(progressSnapshot);
  const { bestScores, completedGames, totalXp, perfectGames, bestStreak, history } = progress;

  useEffect(() => {
    let cancelled = false;

    async function syncAccountProgress() {
      try {
        const localProgress = readGameProgress(getGameProgressSnapshot());
        const response = await fetch("/api/games/progress", { cache: "no-store" });
        if (!response.ok) return;

        let payload = await response.json();
        let remoteProgress = payload.progress as GameProgress | undefined;

        if (
          remoteProgress &&
          remoteProgress.completedGames === 0 &&
          localProgress.completedGames > 0
        ) {
          const migration = await fetch("/api/games/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "migration", progress: localProgress }),
          });

          if (migration.ok) {
            const refreshed = await fetch("/api/games/progress", { cache: "no-store" });
            if (refreshed.ok) {
              payload = await refreshed.json();
              remoteProgress = payload.progress as GameProgress | undefined;
            }
          }
        }

        if (!cancelled && remoteProgress) {
          window.localStorage.setItem(GAME_PROGRESS_KEY, JSON.stringify(remoteProgress));
          window.dispatchEvent(new Event("justdy-games-progress-change"));
        }
      } catch {
        // Preserve locally saved progress if the account service is unavailable.
      }
    }

    void syncAccountProgress();
    return () => {
      cancelled = true;
    };
  }, []);

  const learnerLevel = Math.floor(totalXp / 100) + 1;
  const xpIntoLevel = totalXp % 100;
  const badges = [
    { id: "first-game", title: "First Steps", detail: "Complete your first game", unlocked: completedGames >= 1, icon: Play },
    { id: "five-games", title: "Game Explorer", detail: "Complete 5 games", unlocked: completedGames >= 5, icon: Gamepad2 },
    { id: "perfect", title: "Perfect Thinker", detail: "Earn a perfect score", unlocked: perfectGames >= 1, icon: Medal },
    { id: "xp-100", title: "Bright Mind", detail: "Earn 100 XP", unlocked: totalXp >= 100, icon: Sparkles },
  ];

  const [activeGame, setActiveGame] = useState<"math-quest" | "quiz-arena" | null>(null);
  const closeGame = () => setActiveGame(null);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070B1B] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[radial-gradient(ellipse_at_15%_15%,rgba(31,201,170,.22),transparent_34%),radial-gradient(ellipse_at_85%_25%,rgba(123,92,255,.25),transparent_35%),linear-gradient(135deg,#081426_0%,#101A3A_52%,#17123B_100%)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:54px_54px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="pointer-events-none absolute -left-36 top-20 h-80 w-80 rounded-full bg-teal-400/20 blur-[100px]" />
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-violet-500/20 blur-[110px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-100/10 px-4 py-2 text-[11px] font-black uppercase tracking-[.2em] text-cyan-100 shadow-lg shadow-cyan-950/20">
              <Sparkles className="h-4 w-4" /> Justdy Originals · Game Universe
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.04] tracking-[-.045em] sm:text-5xl lg:text-7xl">
              Two worlds.
              <span className="block bg-gradient-to-r from-cyan-200 via-white to-violet-200 bg-clip-text text-transparent">
                Endless ways to shine.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-blue-100/70 sm:text-lg">
              Step into the Justdy game universe. Explore a mathematical adventure, then
              test your skills in a competitive quiz arena. Learn, level up and make
              every answer count.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveGame("math-quest")}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-teal-300 to-emerald-400 px-5 text-sm font-black text-[#06251F] shadow-xl shadow-emerald-950/30 transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Play className="h-4 w-4 fill-current" /> Enter Math Quest
              </button>
              <a
                href="#featured-games"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Explore both games <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-blue-100/55">
              <span className="inline-flex items-center gap-2"><Gem className="h-4 w-4 text-teal-300" /> Earn XP and rewards</span>
              <span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-300" /> Build your best score</span>
              <span className="inline-flex items-center gap-2"><Target className="h-4 w-4 text-violet-300" /> Grow your mastery</span>
            </div>
          </div>

          <div className="relative mx-auto aspect-[1.12/1] w-full max-w-[570px]" aria-label="Illustration of the Justdy game universe">
            <div className="absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] rounded-[34%] border border-cyan-200/20 bg-cyan-300/[0.04] shadow-[0_0_90px_rgba(45,212,191,.12)] [transform:translate(-50%,-50%)_rotateX(62deg)_rotateZ(-18deg)]" />
            <div className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rotate-[24deg] rounded-[30%] border border-violet-200/20 bg-violet-300/[0.04] [transform:translate(-50%,-50%)_rotateX(62deg)_rotateZ(24deg)]" />
            <div className="absolute left-[13%] top-[15%] h-3 w-3 rounded-full bg-cyan-200 shadow-[0_0_24px_8px_rgba(103,232,249,.45)]" />
            <div className="absolute right-[12%] top-[25%] h-2 w-2 rounded-full bg-violet-200 shadow-[0_0_20px_7px_rgba(196,181,253,.55)]" />
            <div className="absolute bottom-[16%] left-[18%] h-2.5 w-2.5 rounded-full bg-amber-200 shadow-[0_0_20px_7px_rgba(252,211,77,.45)]" />

            <div className="absolute left-[7%] top-[19%] w-[55%] [perspective:900px]">
              <div className="relative aspect-[1.18/1] rounded-[28px] border border-teal-100/25 bg-gradient-to-br from-[#1E8F83] via-[#155C67] to-[#122B55] p-5 shadow-[0_28px_60px_rgba(0,0,0,.45)] [transform:rotateY(18deg)_rotateX(8deg)_rotateZ(-7deg)] sm:p-6">
                <div className="absolute inset-3 rounded-[20px] border border-white/15" />
                <div className="absolute right-5 top-5 h-16 w-16 rounded-2xl border border-white/20 bg-teal-200/15 shadow-[inset_0_0_24px_rgba(153,246,228,.2)] [transform:rotate(18deg)]" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-black/20 px-3 py-1 text-[9px] font-black tracking-[.18em] text-teal-100">WORLD 01</span>
                    <Brain className="h-7 w-7 text-teal-100" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-end gap-2">
                      <span className="text-5xl font-black leading-none text-white drop-shadow-lg">∑</span>
                      <span className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-100/70">Quest</span>
                    </div>
                    <p className="text-xl font-black leading-tight text-white sm:text-2xl">Math Quest</p>
                    <p className="mt-1 text-[10px] text-teal-100/70">Explore · Solve · Unlock</p>
                  </div>
                </div>
                <div className="absolute -bottom-4 left-8 right-8 h-5 rounded-full bg-black/35 blur-md" />
              </div>
            </div>

            <div className="absolute bottom-[12%] right-[2%] w-[55%] [perspective:900px]">
              <div className="relative aspect-[1.18/1] rounded-[28px] border border-violet-100/25 bg-gradient-to-br from-[#7659D9] via-[#433B9C] to-[#201D5C] p-5 shadow-[0_28px_60px_rgba(0,0,0,.5)] [transform:rotateY(-18deg)_rotateX(8deg)_rotateZ(7deg)] sm:p-6">
                <div className="absolute inset-3 rounded-[20px] border border-white/15" />
                <div className="absolute right-5 top-5 h-16 w-16 rounded-full border-[9px] border-violet-200/20 bg-violet-100/10 shadow-[0_0_35px_rgba(196,181,253,.25)]" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-black/20 px-3 py-1 text-[9px] font-black tracking-[.18em] text-violet-100">WORLD 02</span>
                    <Trophy className="h-7 w-7 text-amber-200" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-end gap-2">
                      <span className="text-5xl font-black leading-none text-white drop-shadow-lg">?</span>
                      <span className="mb-1 text-xs font-bold uppercase tracking-widest text-violet-100/70">Arena</span>
                    </div>
                    <p className="text-xl font-black leading-tight text-white sm:text-2xl">Quiz Arena</p>
                    <p className="mt-1 text-[10px] text-violet-100/70">Compete · Score · Rise</p>
                  </div>
                </div>
                <div className="absolute -bottom-4 left-8 right-8 h-5 rounded-full bg-black/35 blur-md" />
              </div>
            </div>

            <div className="absolute left-[45%] top-[7%] flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100/30 bg-gradient-to-br from-amber-200 to-orange-400 text-amber-950 shadow-[0_14px_40px_rgba(251,191,36,.28)] [transform:rotate(12deg)_translateZ(40px)]">
              <Crown className="h-7 w-7" />
            </div>
            <div className="absolute bottom-[7%] left-[8%] flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-100/30 bg-gradient-to-br from-cyan-200 to-teal-400 text-teal-950 shadow-[0_14px_40px_rgba(45,212,191,.25)] [transform:rotate(-12deg)]">
              <Zap className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Games completed" value={completedGames} detail="Recorded attempts" icon={Gamepad2} tone="bg-blue-300/15 text-blue-200" />
          <StatTile label="Total experience" value={totalXp.toLocaleString()} detail="XP earned so far" icon={Zap} tone="bg-amber-300/15 text-amber-200" />
          <StatTile label="Perfect scores" value={perfectGames} detail="Flawless game attempts" icon={Trophy} tone="bg-emerald-300/15 text-emerald-200" />
          <StatTile label="Best streak" value={bestStreak} detail="Correct answers in a row" icon={Target} tone="bg-violet-300/15 text-violet-200" />
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">Choose your universe</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">The two Justdy originals</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/55 sm:text-base">
              Two focused experiences, each built around a different way to learn and play.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-blue-100/65">
            <Star className="h-4 w-4 text-amber-300" /> 2 flagship games
          </span>
        </div>

        <div id="featured-games" className="mt-7 grid gap-6 lg:grid-cols-2">
          <article className="group relative isolate overflow-hidden rounded-[30px] border border-teal-200/20 bg-gradient-to-br from-[#0E3E47] via-[#102D43] to-[#111A35] shadow-[0_24px_70px_rgba(0,0,0,.3)] transition duration-300 hover:-translate-y-1 hover:border-teal-200/40 hover:shadow-[0_30px_80px_rgba(20,184,166,.12)]">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-300/15 blur-[70px]" />
            <div className="relative grid min-h-[260px] grid-cols-[1fr_.8fr] items-center gap-2 overflow-hidden p-6 sm:p-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-100/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.17em] text-teal-100">
                  <Gem className="h-3.5 w-3.5" /> Adventure RPG
                </span>
                <h3 className="mt-5 text-2xl font-black leading-tight text-white sm:text-3xl">Math Quest</h3>
                <p className="mt-1 text-sm font-semibold text-teal-100/80">The Learning Adventure</p>
                <p className="mt-3 max-w-sm text-xs leading-5 text-blue-100/60 sm:text-sm">
                  Explore fantasy regions, complete maths missions, collect crystals and unlock new adventure zones.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-teal-50/75">
                  <span className="rounded-full bg-white/10 px-3 py-1.5">3 regions</span>
                  <span className="rounded-full bg-white/10 px-3 py-1.5">3 difficulty levels</span>
                  <span className="rounded-full bg-white/10 px-3 py-1.5">Crystal rewards</span>
                </div>
              </div>
              <div className="relative mx-auto aspect-square w-full max-w-[220px] [perspective:700px]">
                <div className="absolute inset-[12%] rounded-[28%] border border-teal-100/20 bg-teal-300/10 shadow-[0_0_60px_rgba(45,212,191,.18)] [transform:rotateX(58deg)_rotateZ(45deg)]" />
                <div className="absolute inset-[20%] rounded-[25%] border border-emerald-100/30 bg-gradient-to-br from-emerald-200/30 to-teal-700/40 shadow-2xl [transform:rotateX(58deg)_rotateZ(45deg)_translateZ(30px)]" />
                <div className="absolute left-1/2 top-[23%] h-[48%] w-[43%] -translate-x-1/2 rounded-t-[48%] rounded-b-[22%] border border-teal-100/30 bg-gradient-to-b from-teal-200 via-emerald-500 to-[#164C4A] shadow-[0_20px_35px_rgba(0,0,0,.4)] [clip-path:polygon(50%_0,100%_35%,83%_100%,17%_100%,0_35%)] [transform:translateZ(55px)]" />
                <div className="absolute left-1/2 top-[36%] flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-2xl border border-white/30 bg-white/15 text-3xl font-black text-white shadow-[0_0_35px_rgba(153,246,228,.35)] backdrop-blur [transform:translateZ(80px)]">∑</div>
                <div className="absolute right-[8%] top-[14%] h-5 w-5 rotate-45 border border-amber-100/50 bg-amber-300 shadow-[0_0_24px_rgba(252,211,77,.65)]" />
                <div className="absolute bottom-[9%] left-[10%] h-3 w-3 rotate-45 bg-cyan-200 shadow-[0_0_20px_5px_rgba(103,232,249,.35)]" />
              </div>
            </div>
            <div className="relative flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-black/10 px-6 py-5 sm:px-8">
              <div className="flex items-center gap-4 text-xs text-teal-50/60">
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> 10–15 min</span>
                <span className="inline-flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> Best: {bestScores["math-quest"] ?? "—"}</span>
              </div>
              <button type="button" onClick={() => setActiveGame("math-quest")} className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-teal-300 to-emerald-400 px-5 text-sm font-black text-[#06251F] shadow-lg shadow-emerald-950/30 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Enter adventure <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>

          <article className="group relative isolate overflow-hidden rounded-[30px] border border-violet-200/20 bg-gradient-to-br from-[#29205E] via-[#242052] to-[#111A35] shadow-[0_24px_70px_rgba(0,0,0,.3)] transition duration-300 hover:-translate-y-1 hover:border-violet-200/40 hover:shadow-[0_30px_80px_rgba(139,92,246,.14)]">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-300/15 blur-[70px]" />
            <div className="relative grid min-h-[260px] grid-cols-[1fr_.8fr] items-center gap-2 overflow-hidden p-6 sm:p-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/20 bg-violet-100/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.17em] text-violet-100">
                  <Trophy className="h-3.5 w-3.5" /> Competitive quiz
                </span>
                <h3 className="mt-5 text-2xl font-black leading-tight text-white sm:text-3xl">Justdy Quiz Arena</h3>
                <p className="mt-3 max-w-sm text-xs leading-5 text-violet-100/65 sm:text-sm">
                  Challenge computer rivals, use strategic power-ups, beat the clock and climb the score table.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-violet-50/75">
                  <span className="rounded-full bg-white/10 px-3 py-1.5">Classic Clash</span>
                  <span className="rounded-full bg-white/10 px-3 py-1.5">Survival Streak</span>
                  <span className="rounded-full bg-white/10 px-3 py-1.5">Lightning Sprint</span>
                </div>
              </div>
              <div className="relative mx-auto aspect-square w-full max-w-[220px] [perspective:700px]">
                <div className="absolute inset-[12%] rounded-full border border-violet-100/20 bg-violet-300/10 shadow-[0_0_60px_rgba(167,139,250,.2)] [transform:rotateX(65deg)]" />
                <div className="absolute inset-[21%] rounded-full border-[10px] border-violet-200/30 bg-gradient-to-br from-violet-400/50 to-indigo-950/80 shadow-2xl [transform:rotateX(65deg)_translateZ(35px)]" />
                <div className="absolute left-1/2 top-[19%] flex h-[62%] w-[62%] -translate-x-1/2 items-center justify-center rounded-[28%] border border-violet-100/30 bg-gradient-to-br from-[#A78BFA] via-[#7654D6] to-[#382A83] text-7xl font-black text-white shadow-[0_24px_40px_rgba(0,0,0,.45)] [transform:rotateX(10deg)_rotateZ(-8deg)_translateZ(65px)]">?</div>
                <div className="absolute right-[9%] top-[10%] flex h-9 w-9 items-center justify-center rounded-xl border border-amber-100/40 bg-gradient-to-br from-amber-200 to-orange-400 text-amber-950 shadow-[0_0_24px_rgba(251,191,36,.35)] [transform:rotate(12deg)_translateZ(90px)]"><Crown className="h-5 w-5" /></div>
                <div className="absolute bottom-[12%] left-[5%] h-4 w-4 rotate-45 border border-cyan-100/40 bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,.6)]" />
              </div>
            </div>
            <div className="relative flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-black/10 px-6 py-5 sm:px-8">
              <div className="flex items-center gap-4 text-xs text-violet-50/60">
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> 5–10 min</span>
                <span className="inline-flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> Best: {bestScores["quiz-arena"] ?? "—"}</span>
              </div>
              <button type="button" onClick={() => setActiveGame("quiz-arena")} className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-300 to-fuchsia-300 px-5 text-sm font-black text-[#21134F] shadow-lg shadow-violet-950/30 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Enter the arena <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>
        </div>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.045] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-cyan-200"><Award className="h-4 w-4" /> Player progression</p>
              <h2 className="mt-2 text-2xl font-black text-white">Your learning journey</h2>
              <p className="mt-1 text-sm text-blue-100/50">Every completed challenge adds to your Justdy player profile.</p>
            </div>
            <span className="rounded-full border border-amber-200/20 bg-amber-100/10 px-4 py-2 text-sm font-black text-amber-100">Level {learnerLevel}</span>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs font-semibold text-blue-100/55">
            <span>{xpIntoLevel}/100 XP to next level</span>
            <span>{100 - xpIntoLevel} XP remaining</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-all" style={{ width: `${xpIntoLevel}%` }} />
          </div>

          <div className="mt-7 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-white">Achievement badges</h3>
            <span className="text-xs text-blue-100/45">{badges.filter((badge) => badge.unlocked).length} of {badges.length} unlocked</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {badges.map((badge) => {
              const BadgeIcon = badge.icon;
              return (
                <div key={badge.id} className={`rounded-2xl border p-3 ${badge.unlocked ? "border-amber-200/25 bg-amber-100/[0.08]" : "border-white/10 bg-white/[0.025] opacity-60"}`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${badge.unlocked ? "bg-amber-200/15 text-amber-200" : "bg-white/10 text-white/45"}`}><BadgeIcon className="h-4 w-4" /></div>
                  <p className="mt-2 text-xs font-bold text-white">{badge.title}</p>
                  <p className="mt-1 text-[11px] leading-4 text-blue-100/45">{badge.unlocked ? "Unlocked!" : badge.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.045] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-violet-200"><History className="h-4 w-4" /> Recent activity</p>
              <h2 className="mt-2 text-xl font-black text-white">Your latest game attempts</h2>
              <p className="mt-1 text-xs text-blue-100/45">Your previous records are retained, including attempts from the games no longer featured.</p>
            </div>
            <Link href="/dashboard/games" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-xs font-bold text-white transition hover:bg-white/10">
              Full game history <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {history.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-black/10 px-4 py-9 text-center">
              <Gamepad2 className="mx-auto h-8 w-8 text-cyan-200/60" />
              <p className="mt-3 text-sm font-bold text-white">Your story starts with one game</p>
              <p className="mt-1 text-xs text-blue-100/45">Complete a challenge and your result will appear here.</p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-blue-100/40">
                    <th className="px-3 py-3">Game</th><th className="px-3 py-3">Level</th><th className="px-3 py-3">Mode</th><th className="px-3 py-3">Score</th><th className="px-3 py-3">XP earned</th><th className="px-3 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 5).map((attempt) => (
                    <tr key={attempt.id} className="border-b border-white/[0.06] last:border-0">
                      <td className="px-3 py-3 font-semibold text-white/85">{attempt.gameTitle}</td>
                      <td className="px-3 py-3 capitalize text-blue-100/50">{attempt.difficulty}</td>
                      <td className="px-3 py-3 capitalize text-blue-100/50">{attempt.mode}</td>
                      <td className="px-3 py-3 font-bold tabular-nums text-white">{attempt.score}/{attempt.totalQuestions}</td>
                      <td className="px-3 py-3 font-bold tabular-nums text-emerald-200">+{attempt.xpEarned} XP</td>
                      <td className="px-3 py-3 text-xs text-blue-100/45">{formatDate(attempt.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-300/[0.08] via-white/[0.03] to-violet-300/[0.08] px-5 py-6 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-cyan-200"><CheckCircle2 className="h-5 w-5" /></div>
            <div><p className="font-bold text-white">Focused on two flagship experiences.</p><p className="mt-1 text-xs text-blue-100/45">More depth, more progression and a clearer learning journey.</p></div>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-blue-100/60"><Sparkles className="h-4 w-4 text-amber-200" /> Keep learning. Keep levelling up.</span>
        </div>
      </section>

      {activeGame === "math-quest" ? (
        <MathQuestGame
          onClose={closeGame}
          onComplete={(score, total, difficulty, mode, streak) =>
            saveCompletedGame(
              "math-quest",
              "Math Quest – The Learning Adventure",
              score,
              total,
              difficulty,
              mode,
              DIFFICULTY_SETTINGS[difficulty].multiplier,
              streak,
            )
          }
        />
      ) : activeGame === "quiz-arena" ? (
        <QuizArenaGame
          onClose={closeGame}
          onComplete={(score, total, difficulty, mode, streak) =>
            saveCompletedGame(
              "quiz-arena",
              "Justdy Quiz Arena",
              score,
              total,
              difficulty,
              mode,
              DIFFICULTY_SETTINGS[difficulty].multiplier,
              streak,
            )
          }
        />
      ) : null}
    </main>
  );
}
