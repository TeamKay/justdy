import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
export async function startResourceActivity({
  userId,
  resourceId,
}: {
  userId: string;
  resourceId: string;
}) {
  return prisma.learningActivity.create({
    data: {
      userId,
      resourceId,
      activityType: "RESOURCE_USE",
      status: "STARTED",
    },
    select: {
      id: true,
      resourceId: true,
      status: true,
      startedAt: true,
    },
  });
}

export async function completeResourceActivity({
  userId,
  activityId,
  score,
  maxScore,
  answers,
  metadata,
}: {
  userId: string;
  activityId: string;
  score: number;
  maxScore: number;
  answers: Record<string, string>;
  metadata?: Prisma.InputJsonValue;
}) {
  const safeScore = Number.isFinite(score) ? Math.max(0, score) : 0;
  const safeMax = Number.isFinite(maxScore) ? Math.max(0, maxScore) : 0;

  return prisma.learningActivity.updateMany({
    where: {
      id: activityId,
      userId,
      status: "STARTED",
    },
    data: {
      status: "COMPLETED",
      score: safeScore,
      maxScore: safeMax,
      answers,
      metadata,
      completedAt: new Date(),
    },
  });
}
