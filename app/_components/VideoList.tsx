"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Play,
  Search,
  Video as VideoIcon,
  X,
} from "lucide-react";

import { Video } from "@/lib/youtube";

interface VideoListProps {
  mathVideos: Video[];
  techVideos: Video[];
}

export default function VideoList({
  mathVideos,
  techVideos,
}: VideoListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const allVideos = useMemo(() => {
    const combined = [...mathVideos, ...techVideos];

    const uniqueVideos = new Map<string, Video>();

    combined.forEach((video, index) => {
      const key = video.id || `${video.title}-${index}`;

      if (!uniqueVideos.has(key)) {
        uniqueVideos.set(key, video);
      }
    });

    return Array.from(uniqueVideos.values());
  }, [mathVideos, techVideos]);

  const filteredVideos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return allVideos;
    }

    return allVideos.filter((video) => {
      const title = video.title?.toLowerCase() ?? "";
      const description = video.description?.toLowerCase() ?? "";

      return title.includes(query) || description.includes(query);
    });
  }, [allVideos, searchQuery]);

  return (
    <div className="w-full">
      {/* Search */}
      <div className="mx-auto mb-8 max-w-5xl">
        <div
          className="
            group relative flex items-center
            rounded-2xl
            border border-border/70
            bg-card
            shadow-sm
            transition-all duration-200
            focus-within:border-primary/50
            focus-within:shadow-md
            focus-within:ring-4
            focus-within:ring-primary/10
          "
        >
          <Search
            className="
              absolute left-4 top-1/2
              h-5 w-5
              -translate-y-1/2
              text-muted-foreground
              transition-colors
              group-focus-within:text-primary
            "
            aria-hidden="true"
          />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos by title or topic..."
            className="
              h-13 w-full
              rounded-2xl
              bg-transparent
              pl-12 pr-12
              text-sm font-medium
              text-foreground
              outline-none
              placeholder:text-muted-foreground
            "
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="
                absolute right-3 top-1/2
                flex h-8 w-8
                -translate-y-1/2
                items-center justify-center
                rounded-lg
                text-muted-foreground
                transition
                hover:bg-muted
                hover:text-foreground
                active:scale-95
              "
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="mt-3 px-1">
          <p className="text-xs text-muted-foreground">
            {searchQuery ? (
              <>
                <span className="font-semibold text-foreground">
                  {filteredVideos.length}
                </span>{" "}
                {filteredVideos.length === 1 ? "result" : "results"} for{" "}
                <span className="font-medium text-foreground">
                  &ldquo;{searchQuery}&rdquo;
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">
                  {allVideos.length}
                </span>{" "}
                {allVideos.length === 1 ? "video" : "videos"} available
              </>
            )}
          </p>
        </div>
      </div>

      {/* Video Grid */}
      {filteredVideos.length > 0 ? (
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video, index) => (
            <Link
              key={video.id || index}
              href={`/videos/${video.id}`}
              className="group block h-full"
            >
              <article
                className="
                  flex h-full flex-col
                  overflow-hidden
                  rounded-sm
                  border border-border/70
                  bg-card
                  shadow-sm
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-primary/30
                  hover:shadow-xl
                  hover:shadow-primary/5
                "
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <Image
                    src={video.thumbnail}
                    fill
                    alt={video.title}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"/>

                  {/* Image overlay */}
                  <div
                    className="
                      absolute inset-0
                      bg-black/0
                      transition-colors duration-300
                      group-hover:bg-black/15
                    "
                  />

                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="
                        flex h-12 w-12
                        items-center justify-center
                        rounded-full
                        bg-white/95
                        text-primary
                        shadow-xl
                        ring-1 ring-white/50
                        transition-all duration-300
                        group-hover:scale-110
                        group-hover:bg-primary
                        group-hover:text-primary-foreground
                      "
                    >
                      <Play className="ml-0.5 h-5 w-5 fill-current" />
                    </div>
                  </div>

                  {/* Video badge */}
                  <div className="absolute left-3 top-3">
                    <span
                      className="
                        inline-flex items-center gap-1.5
                        rounded-lg
                        border border-white/20
                        bg-black/50
                        px-2.5 py-1.5
                        text-[10px]
                        font-semibold
                        text-white
                        shadow-sm
                        backdrop-blur-md
                      "
                    >
                      <VideoIcon className="h-3 w-3" />
                      Video
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <h2
                    className="
                      line-clamp-2
                      text-sm
                      font-bold
                      leading-snug
                      text-foreground
                      transition-colors
                      group-hover:text-primary
                    "
                  >
                    {video.title}
                  </h2>

                  {video.description && (
                    <p
                      className="
                        mt-2
                        line-clamp-2
                        text-xs
                        leading-relaxed
                        text-muted-foreground
                      "
                    >
                      {video.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div
                    className="
                      mt-auto
                      flex items-center justify-between
                      gap-3
                      border-t border-border/60
                      pt-4
                    "
                  >
                    {/* Views */}
                    <div
                      className="
                        flex items-center gap-1.5
                        text-[11px]
                        font-medium
                        text-muted-foreground
                      "
                    >
                      <Eye className="h-3.5 w-3.5" />

                      <span>
                        {video.viewCount
                          ? `${Number(
                              video.viewCount,
                            ).toLocaleString()} views`
                          : "0 views"}
                      </span>
                    </div>

                    {/* Watch */}
                    <div
                      className="
                        flex items-center gap-1
                        text-[11px]
                        font-semibold
                        text-primary
                        transition-all
                        group-hover:gap-1.5
                      "
                    >
                      Watch
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div
          className="
            flex min-h-80
            flex-col items-center justify-center
            rounded-2xl
            border border-dashed border-border
            bg-muted/30
            px-6
            text-center
          "
        >
          <div
            className="
              flex h-14 w-14
              items-center justify-center
              rounded-2xl
              bg-card
              text-muted-foreground
              shadow-sm
              ring-1 ring-border
            "
          >
            <Search className="h-5 w-5" />
          </div>

          <h3 className="mt-4 text-sm font-semibold text-foreground">
            No videos found
          </h3>

          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            We couldn&apos;t find any videos matching{" "}
            <span className="font-semibold text-foreground">
              &ldquo;{searchQuery}&rdquo;
            </span>
            .
          </p>

          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="
              mt-4
              inline-flex items-center
              rounded-xl
              border border-border
              bg-card
              px-4 py-2
              text-xs
              font-semibold
              text-foreground
              shadow-sm
              transition-all
              hover:border-primary/30
              hover:bg-muted
              hover:text-primary
            "
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}