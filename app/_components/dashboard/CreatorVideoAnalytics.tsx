
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Overview = {
  impressions: number;
  plays: number;
  uniqueViewers: number;
  totalWatchTimeMs: number;
  averageWatchTimeMs: number;
  completions: number;
  completionRate: number;
  skips: number;
  reactions: number;
  comments: number;
  bookmarks: number;
};

type TrendItem = {
  date: string;
  impressions: number;
  plays: number;
  watchTimeMs: number;
};

type VideoItem = {
  id: string;
  title: string;
  publishedAt: string;
  impressions: number;
  plays: number;
  uniqueViewers: number;
  watchTimeMs: number;
  averageWatchTimeMs: number;
  completions: number;
  completionRate: number;
  reactions: number;
  comments: number;
  bookmarks: number;
};

type AnalyticsPeriod = "7d" | "30d" | "90d" | "all";

type AnalyticsData = {
  success: true;
  period: {
    selected: AnalyticsPeriod;
    days: number | null;
    since: string | null;
    trendDays: number;
    trendDescription: string;
  };
  overview: Overview;
  trend: TrendItem[];
  videos: VideoItem[];
};

type ApiError = {
  success: false;
  error?: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m ${seconds}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatChartDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export default function CreatorVideoAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] =
    useState<AnalyticsPeriod>("30d");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAnalytics = useCallback(async (): Promise<AnalyticsData> => {
    const response = await fetch(
      `/api/social/creator-analytics?period=${selectedPeriod}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const result = (await response.json()) as AnalyticsData | ApiError;

    if (!response.ok || !result.success) {
      throw new Error(
        "error" in result
          ? result.error || "Unable to load analytics."
          : "Unable to load analytics.",
      );
    }

    return result;
  }, [selectedPeriod]);

  useEffect(() => {
    let cancelled = false;

    loadAnalytics()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError("");
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Something went wrong while loading analytics.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadAnalytics, refreshKey]);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded-lg bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-32 rounded-2xl bg-muted" />
            ))}
          </div>
          <div className="h-80 rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-destructive/20 bg-card p-6">
          <h1 className="text-xl font-semibold">Creator Analytics</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error || "Analytics data is unavailable."}
          </p>
          <button
            type="button"
          onClick={() => {
            setIsLoading(true);
            setError("");
            setRefreshKey((current) => current + 1);
          }}
            className="mt-5 rounded-lg bg-[#173B2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#245640]"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const { overview, trend, videos, period } = data;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#B97832]">
            CREATOR STUDIO
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Video Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Understand how people discover, watch, and engage with your
            Community Videos.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {period.selected === "all"
              ? "Showing all available activity · Updated when you refresh"
              : `Showing the last ${period.days} days · Updated when you refresh`}
          </p>
        </div>

       <div className="flex flex-wrap items-center gap-3">
  <select
    aria-label="Select analytics date range"
    value={selectedPeriod}
   onChange={(event) => {
  setIsLoading(true);
  setError("");
  setSelectedPeriod(event.target.value as AnalyticsPeriod);
}}
    disabled={isLoading}
    className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground outline-none transition focus:ring-2 focus:ring-[#B97832] disabled:opacity-60"
  >
    <option value="7d">Last 7 days</option>
    <option value="30d">Last 30 days</option>
    <option value="90d">Last 90 days</option>
    <option value="all">All time</option>
  </select>

  <button
    type="button"
    onClick={() => void loadAnalytics()}
    disabled={isLoading}
    className="w-fit rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
  >
    {isLoading ? "Loading..." : "Refresh analytics"}
  </button>
</div>
      </header>

      <section aria-label="Video performance overview">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Performance overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {period.selected === "all"
                ? "Your video activity across all available history."
                : `Your video activity over the last ${period.days} days.`}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Impressions"
            value={formatNumber(overview.impressions)}
            description="Recorded viewing sessions"
          />
          <MetricCard
            label="Plays"
            value={formatNumber(overview.plays)}
            description="Sessions that started playback"
          />
          <MetricCard
            label="Unique viewers"
            value={formatNumber(overview.uniqueViewers)}
            description="Distinct accounts that played your videos"
          />
          <MetricCard
            label="Total watch time"
            value={formatDuration(overview.totalWatchTimeMs)}
            description="Validated watch duration"
          />
          <MetricCard
            label="Average watch time"
            value={formatDuration(overview.averageWatchTimeMs)}
            description="Average per recorded play"
          />
          <MetricCard
            label="Completion rate"
            value={`${overview.completionRate}%`}
            description={`${formatNumber(overview.completions)} completed sessions`}
          />
          <MetricCard
            label="Reactions"
            value={formatNumber(overview.reactions)}
            description="Reactions received"
          />
          <MetricCard
            label="Comments"
            value={formatNumber(overview.comments)}
            description="Visible comments received"
          />
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
        <div className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Views over time</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Recorded impressions and playback starts by day.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trend}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  labelFormatter={(value) => formatChartDate(String(value))}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    color: "var(--card-foreground)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  name="Impressions"
                  stroke="#D97706"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="plays"
                  name="Plays"
                  stroke="#173B2F"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">Audience engagement</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Interactions with your videos.
          </p>

          <div className="mt-6 space-y-5">
            {[
              { label: "Reactions", value: overview.reactions },
              { label: "Comments", value: overview.comments },
              { label: "Bookmarks", value: overview.bookmarks },
              { label: "Skipped sessions", value: overview.skips },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4"
              >
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatNumber(item.value)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-xl bg-muted/60 p-4">
            <p className="text-sm font-medium">Completion rate</p>
            <p className="mt-1 text-3xl font-semibold">
              {overview.completionRate}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Of sessions that started playback.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-border p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">Your video performance</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Videos ranked by plays, then impressions.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {videos.length} {videos.length === 1 ? "video" : "videos"}
          </span>
        </div>

        {videos.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="font-semibold">No published videos yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Once you publish videos and viewers interact with them, their
              performance will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-medium">Video</th>
                  <th className="px-4 py-4 font-medium">Published</th>
                  <th className="px-4 py-4 text-right font-medium">Plays</th>
                  <th className="px-4 py-4 text-right font-medium">Viewers</th>
                  <th className="px-4 py-4 text-right font-medium">Watch time</th>
                  <th className="px-4 py-4 text-right font-medium">Completion</th>
                  <th className="px-5 py-4 text-right font-medium">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {videos.map((video) => (
                  <tr key={video.id} className="transition hover:bg-muted/30">
                    <td className="max-w-[300px] px-5 py-4">
                      <p className="truncate font-medium text-foreground">
                        {video.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatNumber(video.impressions)} impressions
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                      {formatDate(video.publishedAt)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium tabular-nums">
                      {formatNumber(video.plays)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums">
                      {formatNumber(video.uniqueViewers)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">
                      {formatDuration(video.watchTimeMs)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums">
                      {video.completionRate}%
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {formatNumber(
                        video.reactions + video.comments + video.bookmarks,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-5 text-xs leading-5 text-muted-foreground">
        Analytics are based on recorded activity during the selected period.
        Impressions represent recorded viewing sessions, not independently
        verified human views. Embedded video providers may report different
        playback details depending on their tracking integration.
      </p>
    </main>
  );
}
