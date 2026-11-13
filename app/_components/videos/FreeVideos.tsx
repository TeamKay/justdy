import React from "react";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// OPTIONAL: Fallbacks if env variables are missing
const HARDCODED_API_KEY = process.env.YOUTUBE_API_KEY;
const HARDCODED_CHANNEL_ID = process.env.YOUTUBE_MATH_CHANNEL_ID;

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  viewCount?: string;
}

interface YouTubeThumbnail {
  url: string;
}

interface YouTubeApiItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      maxres?: YouTubeThumbnail;
      standard?: YouTubeThumbnail;
      high?: YouTubeThumbnail;
      medium?: YouTubeThumbnail;
    };
  };
}

interface YouTubeStatsItem {
  id: string;
  statistics?: {
    viewCount?: string;
  };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function getLatestVideos(): Promise<YouTubeVideo[]> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || HARDCODED_API_KEY;
  const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || HARDCODED_CHANNEL_ID;

  if (!YOUTUBE_API_KEY || !CHANNEL_ID) {
    console.warn("YouTube API Key or Channel ID missing.");
    return [];
  }

  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&type=video&maxResults=5`,
      { next: { revalidate: 3600 } },
    );

    if (!searchRes.ok) {
      console.error(`YouTube API returned status ${searchRes.status}`);
      return [];
    }

    const searchData = await searchRes.json();
    const videoItems: YouTubeApiItem[] = searchData.items || [];

    if (videoItems.length === 0) return [];

    const videoIds = videoItems.map((item) => item.id.videoId).join(",");
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=statistics`,
      { next: { revalidate: 3600 } },
    );

    const statsMap: Record<string, string> = {};
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      statsData.items?.forEach((item: YouTubeStatsItem) => {
        if (item.statistics?.viewCount) {
          statsMap[item.id] = item.statistics.viewCount;
        }
      });
    }

    return videoItems.map((item: YouTubeApiItem) => {
      const vId = item.id.videoId;

      // Fallback directly to maxresdefault URL or standard/high to ensure 16:9 ratio without built-in YouTube letterboxing
      const thumbnailUrl =
        item.snippet.thumbnails.maxres?.url ||
        item.snippet.thumbnails.standard?.url ||
        `https://i.ytimg.com/vi/${vId}/maxresdefault.jpg`;

      return {
        id: vId,
        title: decodeHtmlEntities(item.snippet.title),
        description: decodeHtmlEntities(item.snippet.description),
        thumbnail: thumbnailUrl,
        publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          },
        ),
        viewCount: statsMap[vId] || undefined,
      };
    });
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    return [];
  }
}

export default async function FreeVideos() {
  const tutorials = await getLatestVideos();

  if (!tutorials || tutorials.length === 0) {
    return null;
  }

  return (
    <section
      id="free-tutorials"
      className="py-12 bg-background relative overflow-hidden"
    >
      <div className="max-w-8xl mx-auto px-6 lg:px-28 relative z-10">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-3 gap-6">
          <div>
            <h2 className="text-xl sm:text-xl font-semibold tracking-tight text-slate-400">
              Latest Video Lessons
            </h2>
          </div>

          <Link
            href="/videos"
            className="group/link inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors self-start md:self-end"
          >
            <span>Browse Full Video Library</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform text-emerald-400" />
          </Link>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {tutorials.map((video) => (
            <Link
              key={video.id}
              href={`/videos/${video.id}`}
              className="group relative rounded-md bg-emerald-900/10 border border-slate-600 shadow-sm hover:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Fixed Video Thumbnail Container (Aspect-Video instead of h-44) */}
                <div className="relative rounded-t-md bg-slate-950 aspect-video w-full flex items-center justify-center overflow-hidden border-b border-slate-800/80">
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs">
                      No Thumbnail
                    </div>
                  )}

                  {/* Date Badge */}
                  <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-slate-900/90 backdrop-blur-md text-slate-200 border border-slate-700/60 text-[10px] font-medium tracking-wide">
                    {video.publishedAt}
                  </span>

                  {/* Play Button Overlay */}
                  <div className="relative z-10 w-10 h-10 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-slate-950 group-hover:border-emerald-400 transition-all duration-300 shadow-lg">
                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 pt-4">
                  <h3 className="font-bold text-white text-sm leading-snug group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {video.title}
                  </h3>
                  <p className="mt-1.5 text-slate-400 text-xs leading-relaxed font-normal line-clamp-1">
                    {video.description || "Watch full tutorial."}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 pt-2 flex items-center justify-between text-xs font-medium text-slate-400 border-t border-slate-800/50 mt-2">
                <div className="flex items-center text-slate-400">
                  <svg
                    className="w-4 h-4 mr-1.5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>
                    {video.viewCount
                      ? `${Number(video.viewCount).toLocaleString()} views`
                      : "0 views"}
                  </span>
                </div>

                <div className="flex items-center text-slate-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all">
                  Watch Video
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
