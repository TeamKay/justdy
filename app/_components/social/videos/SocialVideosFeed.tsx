
"use client";

import { useMemo, useState } from "react";
import {
  Expand,
  Minimize2,
  Play,
  Search,
  Video as VideoIcon,
  X,
  Eye,
} from "lucide-react";

import type { Video } from "@/lib/youtube";

type VideoCategory = "all" | "math" | "tech";

interface SocialVideosFeedProps {
  mathVideos: Video[];
  techVideos: Video[];
}

export default function SocialVideosFeed({
  mathVideos,
  techVideos,
}: SocialVideosFeedProps) {
  const [category, setCategory] = useState<VideoCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const videos = useMemo(() => {
    const source =
      category === "math"
        ? mathVideos
        : category === "tech"
          ? techVideos
          : [...mathVideos, ...techVideos];

    const unique = new Map<string, Video>();

    source.forEach((video) => {
      if (video.id && !unique.has(video.id)) {
        unique.set(video.id, video);
      }
    });

    return Array.from(unique.values()).filter((video) => {
      const query = searchQuery.trim().toLowerCase();

      if (!query) return true;

      return (
        video.title.toLowerCase().includes(query) ||
        (video.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [category, mathVideos, techVideos, searchQuery]);

  const selectedVideo = videos.find(
    (video) => video.id === selectedVideoId,
  );

  function playVideo(videoId: string) {
    setSelectedVideoId(videoId);
    setIsExpanded(false);
  }

  function closePlayer() {
    setSelectedVideoId(null);
    setIsExpanded(false);
  }

  return (
    <section className="min-w-0">
      {/* Heading */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#173B2F] sm:text-2xl">
              Learning videos
            </h1>

            <p className="mt-1 text-xs text-[#87938A] sm:text-sm">
              Watch lessons and build your knowledge at your own pace.
            </p>
          </div>

          <span className="rounded-full border border-[#E2E9E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#52665A] shadow-sm">
            {videos.length} {videos.length === 1 ? "video" : "videos"}
          </span>
        </div>
      </div>

      {/* Filters and search */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All videos"],
              ["math", "Mathematics"],
              ["tech", "Technology"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              aria-pressed={category === value}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                category === value
                  ? "bg-[#173B2F] text-white shadow-sm"
                  : "border border-[#E2E9E1] bg-white text-[#52665A] hover:bg-[#F0F4EF]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="relative block w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#929D93]" />

          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search videos..."
            className="h-10 w-full rounded-xl border border-[#E2E9E1] bg-white pl-10 pr-4 text-xs text-[#173B2F] outline-none transition placeholder:text-[#A1AAA2] focus:border-[#8CA792] focus:ring-4 focus:ring-[#315B43]/10"
          />
        </label>
      </div>

      {/* Video grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-1">
          {videos.map((video) => {
            const isPlaying = selectedVideoId === video.id;

            const playerContent = (
              <div className="overflow-hidden rounded-xl border border-[#E5EAE3] bg-white shadow-[0_5px_24px_rgba(23,59,47,0.07)]">
                {/* Player toolbar with improved spacing */}
                <div className="flex min-h-19 items-center justify-between gap-3 border-b border-[#EEF1EC] bg-white px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#87938A]">
                      Now playing
                    </p>

                    <h3 className="mt-1 line-clamp-2 text-[13px] font-bold leading-5 text-[#173B2F] sm:text-sm">
                      {video.title}
                    </h3>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setIsExpanded((current) => !current)
                      }
                      aria-label={
                        isExpanded ? "Reduce video size" : "Enlarge video"
                      }
                      title={
                        isExpanded ? "Reduce video size" : "Enlarge video"
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5EAE3] bg-[#F8FAF7] text-[#315B43] transition hover:border-[#C8D8C9] hover:bg-[#EAF1EB]"
                    >
                      {isExpanded ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Expand className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={closePlayer}
                      aria-label="Close video player"
                      title="Close player"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5EAE3] bg-[#F8FAF7] text-[#64746A] transition hover:border-[#E6C9C5] hover:bg-[#FCEFED] hover:text-[#A64D45]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* YouTube player */}
                <div className="aspect-video w-full overflow-hidden bg-black">
                  <iframe
                    key={video.id}
                    src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?autoplay=1&rel=0`}
                    title={video.title}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            );

            return (
              <article
                key={video.id}
                className={`min-w-0 overflow-hidden rounded-2xl border bg-white shadow-[0_3px_14px_rgba(23,59,47,0.04)] transition duration-200 hover:shadow-[0_10px_25px_rgba(23,59,47,0.08)] ${
                  isPlaying
                    ? "border-[#789477] ring-2 ring-[#789477]/15"
                    : "border-[#E5EAE3]"
                }`}
              >
                {/* The player replaces the thumbnail in this exact card */}
                {isPlaying ? (
                  isExpanded ? (
                    <div className="relative">
                      {playerContent}
                    </div>
                  ) : (
                    playerContent
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => playVideo(video.id)}
                    aria-label={`Play ${video.title}`}
                    className="group relative block aspect-video w-full overflow-hidden bg-[#EAF1EB] text-left"
                  >
                    {video.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#789477]">
                        <VideoIcon className="h-10 w-10" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/15 transition group-hover:bg-black/30" />

                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur">
                      <VideoIcon className="h-3 w-3" />
                      Video lesson
                    </span>

                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#173B2F] shadow-xl transition group-hover:scale-110 group-hover:bg-[#173B2F] group-hover:text-white">
                        <Play className="ml-0.5 h-5 w-5 fill-current" />
                      </span>
                    </span>
                  </button>
                )}

                {/* Video information */}
                <div className="p-4">
                  <h3 className="line-clamp-2 text-sm font-bold leading-6 text-[#173B2F]">
                    {video.title}
                  </h3>

                  {video.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#87938A]">
                      {video.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EEF1EC] pt-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#87938A]">
                      <Eye className="h-3.5 w-3.5" />

                      {video.viewCount
                        ? `${Number(video.viewCount).toLocaleString()} views`
                        : "Video lesson"}
                    </span>

                    <span className="text-[11px] font-semibold text-[#315B43]">
                      {isPlaying ? "Now playing" : "Watch video"}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#D5E0D5] bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1EB] text-[#315B43]">
            <Search className="h-6 w-6" />
          </div>

          <h2 className="mt-4 text-base font-bold text-[#173B2F]">
            No videos found
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-[#87938A]">
            {searchQuery
              ? "Try another search term or clear your search."
              : "There are currently no videos available in this category."}
          </p>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-4 rounded-xl bg-[#173B2F] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#24513F]"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Enlarged player overlay */}
      {isExpanded && selectedVideo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged video player"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsExpanded(false);
            }
          }}
        >
          <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
            <div className="flex min-h-[76px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#87938A]">
                  Now playing
                </p>

                <h2 className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-[#173B2F] sm:text-base">
                  {selectedVideo.title}
                </h2>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  aria-label="Reduce video size"
                  title="Return to video card"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5EAE3] bg-[#F8FAF7] text-[#315B43] transition hover:bg-[#EAF1EB]"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={closePlayer}
                  aria-label="Close video player"
                  title="Close player"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5EAE3] bg-[#F8FAF7] text-[#64746A] transition hover:bg-[#FCEFED] hover:text-[#A64D45]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="aspect-video w-full overflow-hidden bg-black">
              <iframe
                key={`${selectedVideo.id}-expanded`}
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(selectedVideo.id)}?autoplay=1&rel=0`}
                title={selectedVideo.title}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
