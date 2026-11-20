
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import {
  getActiveSocialViewer,
  visibleSocialPostWhere,
} from "@/lib/social/access";

export type VideoWatchEventType =
  | "IMPRESSION"
  | "PLAY"
  | "PROGRESS"
  | "COMPLETE"
  | "SKIP";

export type VideoWatchProvider =
  | "YOUTUBE"
  | "TIKTOK"
  | "FACEBOOK"
  | "DIRECT";

type RecordVideoWatchEventInput = {
  postId: string;
  sessionKey: string;
  event: VideoWatchEventType;
  provider: VideoWatchProvider;
  watchedMs?: number;
  progressPercent?: number;
};

const MAX_WATCH_DELTA_MS = 15_000;

function isValidSessionKey(value: string) {
  return /^[a-zA-Z0-9_-]{16,64}$/.test(value);
}

export async function recordVideoWatchEvent(
  input: RecordVideoWatchEventInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to record video activity.",
    };
  }

  const activeViewer = await getActiveSocialViewer(userId);

  if (!activeViewer) {
    return {
      success: false,
      error: "Your social profile is not available.",
    };
  }

  if (
    typeof input.postId !== "string" ||
    input.postId.length < 1 ||
    input.postId.length > 191 ||
    !isValidSessionKey(input.sessionKey) ||
    !["IMPRESSION", "PLAY", "PROGRESS", "COMPLETE", "SKIP"].includes(
      input.event,
    ) ||
    !["YOUTUBE", "TIKTOK", "FACEBOOK", "DIRECT"].includes(input.provider)
  ) {
    return {
      success: false,
      error: "Invalid video activity.",
    };
  }

  const watchedMs =
    input.event === "PROGRESS" || input.event === "COMPLETE"
      ? Math.min(
          MAX_WATCH_DELTA_MS,
          Math.max(0, Math.floor(Number(input.watchedMs) || 0)),
        )
      : 0;

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.floor(Number(input.progressPercent) || 0)),
  );

  const visibleVideoPost = await prisma.socialPost.findFirst({
    where: {
      id: input.postId,
      AND: [
        visibleSocialPostWhere(userId),
        {
          OR: [
            {
              media: {
                some: {
                  media: {
                    is: {
                      type: "VIDEO",
                      purpose: "SOCIAL_POST",
                      status: "ATTACHED",
                    },
                  },
                },
              },
            },
            {
              content: {
                contains: "youtube.com",
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: "youtu.be",
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: "tiktok.com",
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: "facebook.com",
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: "fb.watch",
                mode: "insensitive",
              },
            },
          ],
        },
      ],
    },
    select: { id: true },
  });

  if (!visibleVideoPost) {
    return {
      success: false,
      error: "This video is unavailable.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const uniqueKey = {
        userId_sessionKey: {
          userId,
          sessionKey: input.sessionKey,
        },
      };

      const existing = await tx.videoWatchSession.findUnique({
        where: uniqueKey,
        select: {
          id: true,
          postId: true,
          maxProgressPercent: true,
          impressionAt: true,
          firstPlayedAt: true,
          completedAt: true,
          skippedAt: true,
          updatedAt: true,
        },
      });

      if (existing && existing.postId !== input.postId) {
        throw new Error("WATCH_SESSION_POST_MISMATCH");
      }

      const eventTime = new Date();

      const elapsedSinceLastEventMs = existing
        ? Math.max(
            0,
            eventTime.getTime() - existing.updatedAt.getTime(),
          )
        : 0;

      const creditedWatchedMs = Math.min(
        watchedMs,
        elapsedSinceLastEventMs + 2_000,
      );

      const shouldRecordEvent =
        input.event === "PROGRESS" ||
        (input.event === "IMPRESSION" && !existing?.impressionAt) ||
        (input.event === "PLAY" && !existing?.firstPlayedAt) ||
        (input.event === "COMPLETE" && !existing?.completedAt) ||
        (input.event === "SKIP" && !existing?.skippedAt);

      const updateData = {
        provider: input.provider,
        watchedDurationMs: {
          increment: creditedWatchedMs,
        },
        maxProgressPercent: Math.max(
          existing?.maxProgressPercent ?? 0,
          progressPercent,
        ),
        ...(input.event === "IMPRESSION" && !existing?.impressionAt
          ? { impressionAt: eventTime }
          : {}),
        ...(input.event === "PLAY" && !existing?.firstPlayedAt
          ? { firstPlayedAt: eventTime }
          : {}),
        ...(input.event === "COMPLETE" && !existing?.completedAt
          ? {
              completedAt: eventTime,
              maxProgressPercent: 100,
            }
          : {}),
        ...(input.event === "SKIP" && !existing?.skippedAt
          ? { skippedAt: eventTime }
          : {}),
      };

      const savedSession = await tx.videoWatchSession.upsert({
        where: uniqueKey,
        create: {
          userId,
          postId: input.postId,
          sessionKey: input.sessionKey,
          provider: input.provider,
          watchedDurationMs: creditedWatchedMs,
          maxProgressPercent:
            input.event === "COMPLETE" ? 100 : progressPercent,
          ...(input.event === "IMPRESSION"
            ? { impressionAt: eventTime }
            : {}),
          ...(input.event === "PLAY"
            ? { firstPlayedAt: eventTime }
            : {}),
          ...(input.event === "COMPLETE"
            ? { completedAt: eventTime }
            : {}),
          ...(input.event === "SKIP"
            ? { skippedAt: eventTime }
            : {}),
        },
        update: updateData,
      });

      if (shouldRecordEvent) {
        await tx.videoWatchEvent.create({
          data: {
            sessionId: savedSession.id,
            userId,
            postId: input.postId,
            eventType: input.event,
            watchedDurationMs: creditedWatchedMs,
            progressPercent:
              input.event === "COMPLETE" ? 100 : progressPercent,
            occurredAt: eventTime,
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "WATCH_SESSION_POST_MISMATCH"
    ) {
      return {
        success: false,
        error: "Invalid video session.",
      };
    }

    console.error("Unable to record video watch activity:", error);

    return {
      success: false,
      error: "Unable to record video activity.",
    };
  }
}
