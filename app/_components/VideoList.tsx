"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Video } from "@/lib/youtube";

interface VideoListProps {
  mathVideos: Video[];
  techVideos: Video[];
}

export default function VideoList({ mathVideos, techVideos }: VideoListProps) {
  const [activeCategory, setActiveCategory] = useState<"math" | "tech">("math");
  const [searchQuery, setSearchQuery] = useState("");

  // Select video set based on active toggle
  const currentVideos = activeCategory === "math" ? mathVideos : techVideos;

  // Filter based on selected channel and search query
  const filteredVideos = currentVideos.filter(
    (video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Search Bar & Category Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-background p-0 rounded-xl backdrop-blur-sm">
        {/* Category Switcher */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveCategory("math")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeCategory === "math"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Math Videos
          </button>
          <button
            onClick={() => setActiveCategory("tech")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeCategory === "tech"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tech Tutorials
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder={`Search ${activeCategory === "math" ? "math topics" : "tech tutorials"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background text-slate-100 placeholder-slate-400 text-sm rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Stats Counter */}
      {/* <div className="flex justify-end text-xs text-slate-400 font-medium">
        <p>
          Showing{" "}
          <span className="text-slate-200 font-semibold">
            {filteredVideos.length}
          </span>{" "}
          of {currentVideos.length} videos
        </p>
      </div> */}

      {/* Video Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video, index) => (
            <Link
              key={video.id || index}
              href={`/videos/${video.id}`}
              className="group"
            >
              <div className="h-full bg-emerald-900/10 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col">
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                  <Image
                    src={video.thumbnail}
                    fill
                    alt={video.title}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Overlay Icon */}
                  <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300">
                      <svg
                        className="w-5 h-5 text-white translate-x-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                  <h3 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                    {video.title}
                  </h3>

                  {video.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {video.description}
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between text-xs font-medium text-blue-400">
                    {/* Live Views Count */}
                    <div className="flex items-center text-slate-400">
                      <svg
                        className="w-4 h-4 mr-1.5 text-slate-400"
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

                    {/* Watch Video Link */}
                    <div className="flex items-center group-hover:translate-x-1 transition-transform">
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
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
          <p className="text-slate-400 text-sm">
            No videos found matching &ldquo;{searchQuery}&rdquo;
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-3 text-xs text-blue-400 hover:underline font-medium"
          >
            Clear search filter
          </button>
        </div>
      )}
    </div>
  );
}
