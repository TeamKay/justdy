
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Play,
  Search,
  Sparkles,
  Video as VideoIcon,
  X,
} from "lucide-react";

import { Video } from "@/lib/youtube";

interface VideoListProps {
  mathVideos: Video[];
  techVideos: Video[];
}

const COLORS = {
  ink: "#383232",
  muted: "#827A78",
  border: "#EAE6E2",
  surface: "#F7F6F3",
  white: "#FFFFFF",
  accent: "#B38B67",
};

const VIDEOS_PER_PAGE = 20;

function formatDate(date?: string) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function VideoList({
  mathVideos,
  techVideos,
}: VideoListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Combine and remove duplicate videos
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

  // Search videos
  const filteredVideos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return allVideos;

    return allVideos.filter((video) => {
      const title = video.title?.toLowerCase() ?? "";
      const description = video.description?.toLowerCase() ?? "";

      return (
        title.includes(query) ||
        description.includes(query)
      );
    });
  }, [allVideos, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(
    filteredVideos.length / VIDEOS_PER_PAGE
  );

  // Derive a valid page without triggering another render
  const activePage = Math.min(
    currentPage,
    Math.max(1, totalPages)
  );

  const startIndex = (activePage - 1) * VIDEOS_PER_PAGE;

  const paginatedVideos = filteredVideos.slice(
    startIndex,
    startIndex + VIDEOS_PER_PAGE
  );

  const startVideo =
    filteredVideos.length === 0 ? 0 : startIndex + 1;

  const endVideo = Math.min(
    startIndex + VIDEOS_PER_PAGE,
    filteredVideos.length
  );

  // Compact pagination numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, i) => i + 1
      );
    }

    pages.push(1);

    if (activePage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, activePage - 1);
    const end = Math.min(totalPages - 1, activePage + 1);

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    if (activePage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  const changePage = (page: number) => {
    setCurrentPage(
      Math.min(Math.max(1, page), Math.max(1, totalPages))
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen w-full bg-[#ffffff]">

      <section className="mx-auto max-w-360 px-4 pb-10 pt-5 sm:px-6 lg:px-10">

        {/* TOP NAVIGATION */}
        <div className="mb-0 flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-x-1 hover:shadow-sm"
            style={{
              borderColor: COLORS.border,
              color: COLORS.ink,
            }}
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back home
          </Link>
        </div>

        {/* HERO SECTION */}
        <div className="relative mb-0 overflow-hidden px-6 py-5 text-center sm:px-12 sm:py-10 lg:py-5">
          <div className="relative z-10 mx-auto max-w-3xl">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 backdrop-blur-sm">
              <Sparkles
                className="h-3.5 w-3.5"
                style={{ color: "#D8B795" }}
              />
              
            </div>

            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#000000] sm:text-4xl lg:text-[3.4rem]">
              Learn something{" "}
              <span
                className="font-normal font-chalkduster"
                style={{ color: "#D8B795" }}
              >
                new today.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Discover inspiring lessons, explore new ideas, and
              build your knowledge through carefully curated
              educational videos.
            </p>
          </div>
        </div>

       

        {/* SEARCH PANEL */}
        <div
          className="mb-8 flex flex-col gap-5 rounded-2xl border bg-white p-4 shadow-[0_3px_15px_rgba(56,50,50,0.025)] sm:flex-row sm:items-center sm:justify-between sm:p-5"
          style={{ borderColor: COLORS.border }}
        >

          <div className="w-full sm:max-w-xl">

            <label htmlFor="video-search" className="sr-only">
              Search learning videos
            </label>

            <div
              className="group relative flex h-[50px] items-center rounded-xl border bg-[#FAF9F7] transition-all duration-200 focus-within:border-[#B38B67] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(179,139,103,0.09)]"
              style={{ borderColor: COLORS.border }}
            >
              <Search
                className="absolute left-4 h-[18px] w-[18px]"
                style={{ color: COLORS.muted }}
              />

              <input
                id="video-search"
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search lessons, topics, or keywords..."
                className="h-full w-full bg-transparent pl-12 pr-12 text-sm outline-none placeholder:text-[#A9A19C]"
                style={{ color: COLORS.ink }}
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  aria-label="Clear search"
                  className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#F0ECE8]"
                  style={{ color: COLORS.muted }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Result information */}
          <div className="flex items-center gap-3 sm:justify-end">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4EFE9]">
              <VideoIcon
                className="h-[18px] w-[18px]"
                style={{ color: COLORS.accent }}
              />
            </div>

            <div>
              <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                {filteredVideos.length.toLocaleString()}{" "}
                {filteredVideos.length === 1 ? "video" : "videos"} found
              </p>

              <p className="mt-0.5 text-xs" style={{ color: COLORS.muted }}>
                {searchQuery
                  ? `Matching "${searchQuery}"`
                  : filteredVideos.length > 0
                    ? `Showing ${startVideo}–${endVideo}`
                    : "Your video collection"}
              </p>
            </div>

          </div>
        </div>

        {/* VIDEO COLLECTION */}
        {filteredVideos.length > 0 ? (
          <>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">

              {paginatedVideos.map((video, index) => (

                <Link
                  key={video.id || index}
                  href={`/videos/${video.id}`}
                  className="group block h-full rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-[#B38B67]/20"
                >

                  <article
                    className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_18px_45px_rgba(56,50,50,0.10)]"
                    style={{ borderColor: COLORS.border }}
                  >

                    {/* VIDEO THUMBNAIL */}
                    <div className="relative aspect-video w-full overflow-hidden bg-[#ECE8E3]">

                      <Image
                        src={video.thumbnail}
                        fill
                        alt={video.title}
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                      />

                      {/* Thumbnail overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/15 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

                      {/* Video label */}
                      <div className="absolute left-4 top-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm backdrop-blur-md">
                          <VideoIcon className="h-3 w-3" />
                          Video lesson
                        </span>
                      </div>

                      {/* Play button */}
                      <div className="absolute inset-0 flex items-center justify-center">

                        <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-white/40 bg-white/95 text-[#383232] shadow-[0_5px_25px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#383232] group-hover:text-white">

                          <Play className="ml-1 h-6 w-6 fill-current" />

                        </div>

                      </div>

                      {/* Bottom thumbnail information */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">

                        <span className="text-[11px] font-medium text-white/90">
                          Learn at your own pace
                        </span>

                        {video.viewCount && (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-black/35 px-2.5 py-1.5 text-[10px] font-medium text-white backdrop-blur-md">
                            <Eye className="h-3 w-3" />
                            {Number(video.viewCount).toLocaleString()}
                          </span>
                        )}

                      </div>
                    </div>

                    {/* VIDEO INFORMATION */}
                    <div className="flex flex-1 flex-col p-5 sm:p-6">

                      {/* Date */}
                      {video.publishedAt && (
                        <div
                          className="mb-3 flex items-center gap-1.5 text-[11px] font-medium"
                          style={{ color: COLORS.muted }}
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(video.publishedAt)}
                        </div>
                      )}

                      {/* Title */}
                      <h3
                        className="line-clamp-2 min-h-[48px] text-[16px] font-semibold leading-6 tracking-[-0.025em] transition-colors duration-200 group-hover:text-[#A47C58]"
                        style={{ color: COLORS.ink }}
                      >
                        {video.title}
                      </h3>

                      {/* Description */}
                      <p
                        className="mt-2 line-clamp-2 min-h-[44px] text-[13px] leading-[1.7]"
                        style={{ color: COLORS.muted }}
                      >
                        {video.description?.trim() ||
                          "Open this lesson to explore the topic and start learning."}
                      </p>

                      {/* Footer */}
                      <div
                        className="mt-5 flex items-center justify-between border-t pt-4"
                        style={{ borderColor: COLORS.border }}
                      >

                        <span
                          className="text-xs font-medium"
                          style={{ color: COLORS.muted }}
                        >
                          Explore lesson
                        </span>

                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F1EC] text-[#8D6C4E] transition-all duration-300 group-hover:bg-[#383232] group-hover:text-white">
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>

                      </div>

                    </div>

                  </article>

                </Link>

              ))}

            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (

              <div
                className="mt-14 border-t pt-9"
                style={{ borderColor: COLORS.border }}
              >

                <div className="flex flex-col items-center gap-6">

                  {/* Pagination summary */}
                  <p
                    className="text-sm"
                    style={{ color: COLORS.muted }}
                  >
                    Showing{" "}
                    <span className="font-semibold" style={{ color: COLORS.ink }}>
                      {startVideo}–{endVideo}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold" style={{ color: COLORS.ink }}>
                      {filteredVideos.length}
                    </span>{" "}
                    videos
                  </p>

                  {/* Navigation buttons */}
                  <nav
                    aria-label="Video pagination"
                    className="flex flex-wrap items-center justify-center gap-2"
                  >

                    {/* Previous */}
                    <button
                      type="button"
                      disabled={activePage === 1}
                      onClick={() => changePage(activePage - 1)}
                      className="inline-flex h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold transition-all hover:border-[#B38B67] hover:bg-[#FAF7F3] disabled:cursor-not-allowed disabled:opacity-35"
                      style={{
                        borderColor: COLORS.border,
                        color: COLORS.ink,
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>

                    {/* Page numbers */}
                    {getPageNumbers().map((page, index) =>

                      page === "..." ? (

                        <span
                          key={`ellipsis-${index}`}
                          className="px-1 text-sm"
                          style={{ color: COLORS.muted }}
                        >
                          ...
                        </span>

                      ) : (

                        <button
                          key={page}
                          type="button"
                          onClick={() => changePage(page as number)}
                          aria-label={`Go to page ${page}`}
                          aria-current={
                            activePage === page ? "page" : undefined
                          }
                          className="flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-all duration-200 hover:border-[#B38B67]"
                          style={{
                            borderColor:
                              activePage === page
                                ? COLORS.ink
                                : COLORS.border,
                            backgroundColor:
                              activePage === page
                                ? COLORS.ink
                                : COLORS.white,
                            color:
                              activePage === page
                                ? COLORS.white
                                : COLORS.ink,
                            boxShadow:
                              activePage === page
                                ? "0 4px 12px rgba(56,50,50,0.15)"
                                : "none",
                          }}
                        >
                          {page}
                        </button>

                      )

                    )}

                    {/* Next */}
                    <button
                      type="button"
                      disabled={activePage === totalPages}
                      onClick={() => changePage(activePage + 1)}
                      className="inline-flex h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold transition-all hover:border-[#B38B67] hover:bg-[#FAF7F3] disabled:cursor-not-allowed disabled:opacity-35"
                      style={{
                        borderColor: COLORS.border,
                        color: COLORS.ink,
                      }}
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>

                  </nav>

                  <p
                    className="text-[11px] font-medium tracking-wide"
                    style={{ color: "#A49D98" }}
                  >
                    PAGE {activePage} OF {totalPages}
                  </p>

                </div>

              </div>

            )}

          </>

        ) : (

          /* EMPTY SEARCH STATE */
          <div
            className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-6 py-16 text-center"
            style={{ borderColor: COLORS.border }}
          >

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F1EC]">
              <Search className="h-7 w-7" style={{ color: COLORS.accent }} />
            </div>

            <h3
              className="mt-6 text-xl font-semibold"
              style={{ color: COLORS.ink }}
            >
              No lessons found
            </h3>

            <p
              className="mt-2 max-w-sm text-sm leading-7"
              style={{ color: COLORS.muted }}
            >
              We couldn&apos;t find any videos matching &quot;{searchQuery}&quot;.
              Try another keyword or clear your search to explore
              the learning library.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ backgroundColor: COLORS.ink }}
            >
              <X className="h-4 w-4" />
              Clear search
            </button>

          </div>

        )}

      </section>
    </main>
  );
}
