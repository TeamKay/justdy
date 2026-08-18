"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Play,
  Search,
  SlidersHorizontal,
  Video as VideoIcon,
  X,
} from "lucide-react";

import { Video } from "@/lib/youtube";

interface VideoListProps {
  mathVideos: Video[];
  techVideos: Video[];
}

export default function VideoList({ mathVideos, techVideos }: VideoListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // ============================================================
  // COMBINE VIDEOS
  // ============================================================
  //
  // Both arrays are coming from the same channel, so we treat
  // them as one video library.
  //
  // We also remove duplicate videos based on their YouTube ID.
  // ============================================================

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

  // ============================================================
  // SEARCH
  // ============================================================

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
      <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 lg:px-10">
        {/* ======================================================
            PAGE HEADER
        ======================================================= */}

        <div className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Learn. Explore. Grow.
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
                Explore our collection of educational videos, tutorials, and
                practical lessons designed to help you learn at your own pace.
              </p>
            </div>

            {/* Video count */}
            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                <Play className="h-4 w-4 fill-blue-600 text-blue-600" />
              </div>

              <div>
                <p className="text-lg font-bold leading-none text-slate-900">
                  {allVideos.length}
                </p>

                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  {allVideos.length === 1
                    ? "Available video"
                    : "Available videos"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            SEARCH / TOOLBAR
        ======================================================= */}

        <div className="mb-7 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos by title or topic..."
                className="
                  h-11
                  w-full
                  rounded-lg
                  border border-slate-200
                  bg-slate-50
                  pl-10
                  pr-10
                  text-sm
                  text-slate-900
                  outline-none
                  placeholder:text-slate-400
                  transition-all
                  focus:border-blue-400
                  focus:bg-white
                  focus:ring-4
                  focus:ring-blue-500/10
                "
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="
                    absolute
                    right-3
                    top-1/2
                    flex
                    h-6
                    w-6
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-md
                    text-slate-400
                    transition
                    hover:bg-slate-100
                    hover:text-slate-700
                  "
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter label */}
            <div className="flex h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />

              <span className="text-xs font-medium text-slate-600">
                All videos
              </span>
            </div>
          </div>

          {/* Results information */}
          <div className="mt-3 flex items-center justify-between px-1">
            <p className="text-xs text-slate-500">
              {searchQuery ? (
                <>
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredVideos.length}
                  </span>{" "}
                  results for{" "}
                  <span className="font-semibold text-slate-800">
                    &ldquo;{searchQuery}&rdquo;
                  </span>
                </>
              ) : (
                <>
                  Showing all{" "}
                  <span className="font-semibold text-slate-800">
                    {allVideos.length}
                  </span>{" "}
                  videos
                </>
              )}
            </p>
          </div>
        </div>

        {/* ======================================================
            VIDEO GRID
        ======================================================= */}

        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVideos.map((video, index) => (
              <Link
                key={video.id || index}
                href={`/videos/${video.id}`}
                className="group block h-full"
              >
                <article
                  className="
                    flex
                    h-full
                    flex-col
                    overflow-hidden
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-blue-200
                    hover:shadow-xl
                    hover:shadow-slate-200/60
                  "
                >
                  {/* ==================================================
                      VIDEO THUMBNAIL
                  =================================================== */}

                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <Image
                      src={video.thumbnail}
                      fill
                      alt={video.title}
                      className="
                        object-cover
                        transition-transform
                        duration-500
                        group-hover:scale-105
                      "
                    />

                    {/* Image overlay */}
                    <div
                      className="
                        absolute
                        inset-0
                        bg-slate-950/10
                        transition-colors
                        duration-300
                        group-hover:bg-slate-950/20
                      "
                    />

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="
                          flex
                          h-12
                          w-12
                          items-center
                          justify-center
                          rounded-full
                          bg-white/95
                          text-blue-600
                          shadow-xl
                          ring-1
                          ring-white/60
                          transition-all
                          duration-300
                          group-hover:scale-110
                          group-hover:bg-blue-600
                          group-hover:text-white
                        "
                      >
                        <Play className="ml-0.5 h-5 w-5 fill-current" />
                      </div>
                    </div>

                    {/* Video badge */}
                    <div className="absolute left-3 top-3">
                      <span
                        className="
                          inline-flex
                          items-center
                          gap-1.5
                          rounded-full
                          border
                          border-white/60
                          bg-white/90
                          px-2.5
                          py-1
                          text-[10px]
                          font-semibold
                          text-slate-700
                          shadow-sm
                          backdrop-blur-md
                        "
                      >
                        <VideoIcon className="h-3 w-3 text-blue-600" />
                        Video
                      </span>
                    </div>
                  </div>

                  {/* ==================================================
                      VIDEO CONTENT
                  =================================================== */}

                  <div className="flex flex-1 flex-col p-4">
                    <h2
                      className="
                        line-clamp-2
                        text-sm
                        font-bold
                        leading-snug
                        text-slate-900
                        transition-colors
                        group-hover:text-blue-600
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
                          text-slate-500
                        "
                      >
                        {video.description}
                      </p>
                    )}

                    {/* ==================================================
                        CARD FOOTER
                    =================================================== */}

                    <div
                      className="
                        mt-auto
                        flex
                        items-center
                        justify-between
                        gap-3
                        border-t
                        border-slate-100
                        pt-3
                      "
                    >
                      {/* Views */}
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />

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
                          flex
                          items-center
                          gap-1
                          text-[11px]
                          font-semibold
                          text-blue-600
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
          /* ======================================================
             EMPTY STATE
          ======================================================= */

          <div
            className="
              flex
              min-h-80
              flex-col
              items-center
              justify-center
              rounded-2xl
              border
              border-dashed
              border-slate-300
              bg-slate-50/50
              px-6
              text-center
            "
          >
            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-white
                text-slate-400
                shadow-sm
                ring-1
                ring-slate-200
              "
            >
              <Search className="h-5 w-5" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No videos found
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              We couldn&apos;t find any videos matching{" "}
              <span className="font-semibold text-slate-700">
                &ldquo;{searchQuery}&rdquo;
              </span>
              .
            </p>

            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="
                mt-4
                inline-flex
                items-center
                rounded-lg
                border
                border-slate-200
                bg-white
                px-4
                py-2
                text-xs
                font-semibold
                text-slate-700
                shadow-sm
                transition-all
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-600
              "
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
