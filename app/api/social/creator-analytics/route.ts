import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getActiveSocialViewer } from "@/lib/social/access";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PERIOD = "30d";
const VALID_PERIODS = ["7d", "30d", "90d", "all"] as const;

type AnalyticsPeriod = (typeof VALID_PERIODS)[number];

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isVideoPostWhere() {
  return {
    OR: [
      {
        media: {
          some: {
            media: {
              is: {
                type: "VIDEO" as const,
                purpose: "SOCIAL_POST" as const,
                status: "ATTACHED" as const,
              },
            },
          },
        },
      },
      { content: { contains: "youtube.com", mode: "insensitive" as const } },
      { content: { contains: "youtu.be", mode: "insensitive" as const } },
      { content: { contains: "tiktok.com", mode: "insensitive" as const } },
      { content: { contains: "facebook.com", mode: "insensitive" as const } },
      { content: { contains: "fb.watch", mode: "insensitive" as const } },
    ],
  };
}

function getPeriod(value: string | null): AnalyticsPeriod {
  return VALID_PERIODS.includes(value as AnalyticsPeriod)
    ? (value as AnalyticsPeriod)
    : DEFAULT_PERIOD;
}

function getPeriodStart(period: AnalyticsPeriod, today: Date) {
  if (period === "all") return null;

  const days = Number.parseInt(period, 10);

  return new Date(today.getTime() - (days - 1) * DAY_MS);
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "You must be signed in." },
        { status: 401 },
      );
    }

    const viewer = await getActiveSocialViewer(userId);

    if (!viewer) {
      return NextResponse.json(
        {
          success: false,
          error: "An active social profile is required to view creator analytics.",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const selectedPeriod = getPeriod(searchParams.get("period"));

    const now = new Date();
    const today = startOfUtcDay(now);
    const since = getPeriodStart(selectedPeriod, today);

    // "All time" metrics cover all available history. Its chart remains
    // limited to the most recent 90 days so the daily chart stays readable.
    const trendSince =
      selectedPeriod === "all"
        ? new Date(today.getTime() - 89 * DAY_MS)
        : since!;

    // Creators can only see analytics for their own published videos.
    const posts = await prisma.socialPost.findMany({
      where: {
        authorId: userId,
        status: "PUBLISHED",
        ...isVideoPostWhere(),
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        content: true,
        publishedAt: true,
        createdAt: true,
        media: {
          orderBy: { position: "asc" },
          take: 1,
          select: {
            media: {
              select: {
                fileName: true,
              },
            },
          },
        },
      },
    });

    const postIds = posts.map((post) => post.id);

    const [events, reactions, comments, bookmarks] = await Promise.all([
      prisma.videoWatchEvent.findMany({
        where: {
          postId: { in: postIds },
          ...(since ? { occurredAt: { gte: since } } : {}),
        },
        select: {
          postId: true,
          userId: true,
          eventType: true,
          watchedDurationMs: true,
          occurredAt: true,
        },
        orderBy: { occurredAt: "asc" },
      }),

      prisma.socialReaction.findMany({
        where: {
          postId: { in: postIds },
          ...(since ? { createdAt: { gte: since } } : {}),
        },
        select: { postId: true },
      }),

      prisma.socialComment.findMany({
        where: {
          postId: { in: postIds },
          status: "VISIBLE",
          ...(since ? { createdAt: { gte: since } } : {}),
        },
        select: { postId: true },
      }),

      prisma.socialBookmark.findMany({
        where: {
          postId: { in: postIds },
          ...(since ? { createdAt: { gte: since } } : {}),
        },
        select: { postId: true },
      }),
    ]);

    const impressions = events.filter(
      (event) => event.eventType === "IMPRESSION",
    );

    const plays = events.filter((event) => event.eventType === "PLAY");

    const completions = events.filter(
      (event) => event.eventType === "COMPLETE",
    );

    const skips = events.filter((event) => event.eventType === "SKIP");

   // Each event stores only the watch duration credited for that event.
// Sum all event durations to avoid excluding valid credited watch time.
const totalWatchTimeMs = events.reduce(
  (total, event) => total + event.watchedDurationMs,
  0,
);

    const uniqueViewers = new Set(plays.map((event) => event.userId)).size;

    const completionRate =
      plays.length > 0
        ? Math.round((completions.length / plays.length) * 100)
        : 0;

    const trendMap = new Map<
      string,
      { date: string; impressions: number; plays: number; watchTimeMs: number }
    >();

    const trendDays = selectedPeriod === "all"
      ? 90
      : Number.parseInt(selectedPeriod, 10);

    for (let offset = 0; offset < trendDays; offset += 1) {
      const date = new Date(trendSince.getTime() + offset * DAY_MS);
      const key = dayKey(date);

      trendMap.set(key, {
        date: key,
        impressions: 0,
        plays: 0,
        watchTimeMs: 0,
      });
    }

    for (const event of events) {
      if (event.occurredAt < trendSince) continue;

      const day = trendMap.get(dayKey(event.occurredAt));
      if (!day) continue;

      if (event.eventType === "IMPRESSION") {
        day.impressions += 1;
      }

      if (event.eventType === "PLAY") {
        day.plays += 1;
      }

      day.watchTimeMs += event.watchedDurationMs;
    }

    const videos = posts.map((post) => {
      const videoEvents = events.filter(
        (event) => event.postId === post.id,
      );

      const videoImpressions = videoEvents.filter(
        (event) => event.eventType === "IMPRESSION",
      );

      const videoPlays = videoEvents.filter(
        (event) => event.eventType === "PLAY",
      );

      const videoCompletions = videoEvents.filter(
        (event) => event.eventType === "COMPLETE",
      );

     const videoWatchTime = videoEvents.reduce(
  (total, event) => total + event.watchedDurationMs,
  0,
);

      const videoReactions = reactions.filter(
        (item) => item.postId === post.id,
      ).length;

      const videoComments = comments.filter(
        (item) => item.postId === post.id,
      ).length;

      const videoBookmarks = bookmarks.filter(
        (item) => item.postId === post.id,
      ).length;

      const media = post.media[0]?.media ?? null;

      return {
        id: post.id,
        title:
          post.content?.trim().slice(0, 90) ||
          media?.fileName ||
          "Untitled video",
        thumbnail: null,
        publishedAt: post.publishedAt ?? post.createdAt,
        impressions: videoImpressions.length,
        plays: videoPlays.length,
        uniqueViewers: new Set(
          videoPlays.map((event) => event.userId),
        ).size,
        watchTimeMs: videoWatchTime,
        averageWatchTimeMs:
          videoPlays.length > 0
            ? Math.round(videoWatchTime / videoPlays.length)
            : 0,
        completions: videoCompletions.length,
        completionRate:
          videoPlays.length > 0
            ? Math.round(
                (videoCompletions.length / videoPlays.length) * 100,
              )
            : 0,
        reactions: videoReactions,
        comments: videoComments,
        bookmarks: videoBookmarks,
      };
    });

    videos.sort(
      (a, b) =>
        b.plays - a.plays ||
        b.impressions - a.impressions ||
        b.watchTimeMs - a.watchTimeMs,
    );

    return NextResponse.json({
      success: true,
      period: {
        selected: selectedPeriod,
        days: selectedPeriod === "all" ? null : trendDays,
        since: since?.toISOString() ?? null,
        trendDays,
        trendDescription:
          selectedPeriod === "all"
            ? "Daily activity over the last 90 days"
            : `Daily activity over the last ${trendDays} days`,
      },
      overview: {
        impressions: impressions.length,
        plays: plays.length,
        uniqueViewers,
        totalWatchTimeMs,
        averageWatchTimeMs:
          plays.length > 0
            ? Math.round(totalWatchTimeMs / plays.length)
            : 0,
        completions: completions.length,
        completionRate,
        skips: skips.length,
        reactions: reactions.length,
        comments: comments.length,
        bookmarks: bookmarks.length,
      },
      trend: Array.from(trendMap.values()),
      videos,
    });
  } catch (error) {
    console.error("[Creator analytics] Failed to load analytics:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load creator analytics.",
      },
      { status: 500 },
    );
  }
}