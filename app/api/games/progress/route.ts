import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Difficulty = "beginner" | "intermediate" | "advanced";
type Mode = "practice" | "timed";

type GameAttempt = {
  id: string;
  gameId: string;
  gameTitle: string;
  score: number;
  totalQuestions: number;
  difficulty: Difficulty;
  mode: Mode;
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

function isDifficulty(value: unknown): value is Difficulty {
  return value === "beginner" || value === "intermediate" || value === "advanced";
}

function isMode(value: unknown): value is Mode {
  return value === "practice" || value === "timed";
}

function safeLegacyProgress(value: unknown): GameProgress | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<GameProgress>;
  if (
    !candidate.bestScores ||
    typeof candidate.bestScores !== "object" ||
    !Number.isFinite(candidate.completedGames) ||
    !Number.isFinite(candidate.totalXp)
  ) return null;

  const history = Array.isArray(candidate.history)
    ? candidate.history.slice(0, 30).filter((item): item is GameAttempt =>
        Boolean(
          item &&
          typeof item.id === "string" &&
          typeof item.gameId === "string" &&
          typeof item.gameTitle === "string" &&
          Number.isFinite(item.score) &&
          Number.isFinite(item.totalQuestions) &&
          isDifficulty(item.difficulty) &&
          isMode(item.mode) &&
          Number.isFinite(item.xpEarned) &&
          Number.isFinite(item.streak) &&
          typeof item.completedAt === "string"
        )
      )
    : [];

  return {
    bestScores: Object.fromEntries(
      Object.entries(candidate.bestScores).filter(
        ([key, score]) => typeof key === "string" && Number.isFinite(score)
      )
    ) as Record<string, number>,
    completedGames: Math.max(0, Math.floor(candidate.completedGames ?? 0)),
    totalXp: Math.max(0, Math.floor(candidate.totalXp ?? 0)),
    perfectGames: Math.max(0, Math.floor(candidate.perfectGames ?? 0)),
    bestStreak: Math.max(0, Math.floor(candidate.bestStreak ?? 0)),
    history,
  };
}

async function getUser() {
  return getAuthenticatedUser();
}

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to sync game progress." }, { status: 401 });
  }

  const records = await prisma.learningActivity.findMany({
    where: {
      userId: user.id,
      activityType: { in: ["GAME", "GAME_SUMMARY", "GAME_PROFILE"] },
    },
    orderBy: { createdAt: "desc" },
  });

  const summaryRecord = records.find((record) => record.activityType === "GAME_SUMMARY");
  const summaryMetadata = summaryRecord?.metadata as Prisma.JsonObject | null;
  const legacy = safeLegacyProgress(summaryMetadata?.progress);
  const profileRecord = records.find((record) => record.activityType === "GAME_PROFILE");
  const profileMetadata = profileRecord?.metadata as Prisma.JsonObject | null;
  const profile = profileMetadata?.profile ?? null;

  const attempts: GameAttempt[] = records
    .filter((record) => record.activityType === "GAME")
    .map((record) => {
      const metadata = (record.metadata ?? {}) as Prisma.JsonObject;
      return {
        id: String(metadata.id ?? record.id),
        gameId: String(metadata.gameId ?? "unknown"),
        gameTitle: String(metadata.gameTitle ?? "Game"),
        score: record.score ?? 0,
        totalQuestions: record.maxScore ?? 0,
        difficulty: isDifficulty(metadata.difficulty) ? metadata.difficulty : "beginner",
        mode: isMode(metadata.mode) ? metadata.mode : "practice",
        xpEarned: Number(metadata.xpEarned ?? 0),
        streak: Number(metadata.streak ?? 0),
        completedAt: (record.completedAt ?? record.createdAt).toISOString(),
      };
    });

  const base = legacy ?? EMPTY_PROGRESS;
  const bestScores = { ...base.bestScores };
  for (const attempt of attempts) {
    bestScores[attempt.gameId] = Math.max(bestScores[attempt.gameId] ?? 0, attempt.score);
  }

  const progress: GameProgress = {
    bestScores,
    completedGames: base.completedGames + attempts.length,
    totalXp: base.totalXp + attempts.reduce((sum, item) => sum + item.xpEarned, 0),
    perfectGames: base.perfectGames + attempts.filter((item) => item.score === item.totalQuestions).length,
    bestStreak: Math.max(base.bestStreak, ...attempts.map((item) => item.streak), 0),
    history: [...attempts, ...base.history]
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 30),
  };

  return NextResponse.json({ progress, profile });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to sync game progress." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.type === "profile") {
    const candidate = body.profile;
    const validGrade = Number.isInteger(candidate?.grade) && candidate.grade >= 1 && candidate.grade <= 8;
    const validAvatar = Number.isInteger(candidate?.avatar) && candidate.avatar >= 0 && candidate.avatar <= 5;
    const validStyle = ["knight", "ranger", "mage"].includes(candidate?.heroStyle);
    const validName = typeof candidate?.name === "string" && candidate.name.trim().length > 0 && candidate.name.length <= 18;
    const validCounters = ["xp", "coins", "wins", "bestStreak", "answered", "correct"].every(
      (key) => Number.isSafeInteger(candidate?.[key]) && candidate[key] >= 0
    );
    const validStats = candidate?.topicStats && typeof candidate.topicStats === "object" &&
      !Array.isArray(candidate.topicStats) && Object.entries(candidate.topicStats).every(([topic, value]) =>
        topic.length <= 100 && value !== null && typeof value === "object" &&
        Number.isSafeInteger((value as { right?: number }).right) && (value as { right: number }).right >= 0 &&
        Number.isSafeInteger((value as { total?: number }).total) && (value as { total: number }).total >= (value as { right: number }).right
      );
    const allowedWorlds = ["number-village", "fraction-forest", "geometry-isles", "algebra-citadel"];
    const validUnlocked = Array.isArray(candidate?.unlocked) && candidate.unlocked.length <= allowedWorlds.length &&
      candidate.unlocked.every((id: unknown) => typeof id === "string" && allowedWorlds.includes(id));

    if (!validGrade || !validAvatar || !validStyle || !validName || !validCounters || !validStats || !validUnlocked) {
      return NextResponse.json({ error: "Invalid Math Quest profile." }, { status: 400 });
    }

    const profile = {
      grade: candidate.grade,
      avatar: candidate.avatar,
      name: candidate.name.trim(),
      heroStyle: candidate.heroStyle,
      xp: candidate.xp,
      coins: candidate.coins,
      wins: candidate.wins,
      bestStreak: candidate.bestStreak,
      answered: candidate.answered,
      correct: Math.min(candidate.correct, candidate.answered),
      topicStats: candidate.topicStats,
      unlocked: Array.from(new Set(["number-village", ...candidate.unlocked])),
    };
    const existing = await prisma.learningActivity.findFirst({
      where: { userId: user.id, activityType: "GAME_PROFILE" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (existing) {
      await prisma.learningActivity.update({
        where: { id: existing.id },
        data: { metadata: { profile } as Prisma.InputJsonValue, status: "ACTIVE" },
      });
    } else {
      await prisma.learningActivity.create({
        data: {
          userId: user.id,
          activityType: "GAME_PROFILE",
          status: "ACTIVE",
          metadata: { profile } as Prisma.InputJsonValue,
        },
      });
    }
    return NextResponse.json({ ok: true, profile });
  }

  if (body.type === "migration") {
    const progress = safeLegacyProgress(body.progress);
    if (!progress || progress.completedGames <= 0) {
      return NextResponse.json({ error: "No legacy progress to migrate." }, { status: 400 });
    }

    const existing = await prisma.learningActivity.findFirst({
      where: { userId: user.id, activityType: "GAME_SUMMARY" },
      select: { id: true },
    });

    if (!existing) {
      await prisma.learningActivity.create({
        data: {
          userId: user.id,
          activityType: "GAME_SUMMARY",
          status: "MIGRATED",
          metadata: { progress } as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ ok: true, migrated: !existing });
  }

  if (body.type !== "attempt") {
    return NextResponse.json({ error: "Unsupported progress operation." }, { status: 400 });
  }

  const {
    gameId,
    gameTitle,
    score,
    totalQuestions,
    difficulty,
    mode,
    streak,
  } = body;

  if (
    typeof gameId !== "string" || gameId.length > 80 ||
    typeof gameTitle !== "string" || gameTitle.length > 120 ||
    !Number.isInteger(score) || !Number.isInteger(totalQuestions) ||
    totalQuestions < 1 || totalQuestions > 50 ||
    score < 0 || score > totalQuestions ||
    !isDifficulty(difficulty) || !isMode(mode) ||
    !Number.isInteger(streak) || streak < 0 || streak > totalQuestions
  ) {
    return NextResponse.json({ error: "Invalid game attempt." }, { status: 400 });
  }

  const multiplier = difficulty === "advanced" ? 2 : difficulty === "intermediate" ? 1.5 : 1;
  const perfect = score === totalQuestions;
  const xpEarned =
    Math.round(score * 10 * multiplier) +
    (perfect ? 20 : 0) +
    (mode === "timed" ? 5 : 0) +
    Math.max(0, streak - 2) * 2;

  const completedAt = new Date();
  const attemptId = crypto.randomUUID();

  await prisma.learningActivity.create({
    data: {
      userId: user.id,
      activityType: "GAME",
      status: "COMPLETED",
      score,
      maxScore: totalQuestions,
      answers: [] as Prisma.InputJsonValue,
      metadata: {
        id: attemptId,
        gameId,
        gameTitle,
        difficulty,
        mode,
        xpEarned,
        streak,
      } as Prisma.InputJsonValue,
      startedAt: completedAt,
      completedAt,
    },
  });

  return NextResponse.json({ ok: true, xpEarned });
}

export async function DELETE() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to manage account history." }, { status: 401 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.learningActivity.deleteMany({
      where: { userId: user.id, activityType: "GAME" },
    });

    const summary = await tx.learningActivity.findFirst({
      where: { userId: user.id, activityType: "GAME_SUMMARY" },
      select: { id: true, metadata: true },
    });

    if (summary) {
      const metadata = (summary.metadata ?? {}) as Prisma.JsonObject;
      const progress = safeLegacyProgress(metadata.progress);
      if (progress) {
        await tx.learningActivity.update({
          where: { id: summary.id },
          data: {
            metadata: {
              progress: { ...progress, history: [] },
            } as Prisma.InputJsonValue,
          },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
