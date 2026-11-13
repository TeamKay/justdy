"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
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

const COLORS = {
  ink: "#3F3838",
  muted: "#827A78",
  border: "#EAE6E4",
  surface: "#FAF9F8",
  white: "#FFFFFF",
};

export default function VideoList({ mathVideos, techVideos }: VideoListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const allVideos = useMemo(() => {
    const combined = [...mathVideos, ...techVideos];
    const uniqueVideos = new Map<string, Video>();

    combined.forEach((video, index) => {
      const key = video.id || `${video.title}-${index}`;
      if (!uniqueVideos.has(key)) uniqueVideos.set(key, video);
    });

    return Array.from(uniqueVideos.values());
  }, [mathVideos, techVideos]);

  const filteredVideos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allVideos;

    return allVideos.filter((video) => {
      const title = video.title?.toLowerCase() ?? "";
      const description = video.description?.toLowerCase() ?? "";
      return title.includes(query) || description.includes(query);
    });
  }, [allVideos, searchQuery]);

  return (
    <main
      className="w-full"
      style={
        {
          "--video-ink": COLORS.ink,
          "--video-muted": COLORS.muted,
          "--video-border": COLORS.border,
          "--video-surface": COLORS.surface,
        } as React.CSSProperties
      }
    >
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back home */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[#FAF9F8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3F3838]/15"
            style={{ borderColor: COLORS.border, color: COLORS.ink }}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back home
          </Link>
        </div>

        {/* Page intro */}
        <div className="mb-6 flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-center"
          style={{ borderColor: COLORS.border }}>
          <div className="max-w-2xl">
            <h1
              className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.65rem]"
              style={{ color: COLORS.ink }}
            >
              Learn something{" "}
              <span className="font-normal" style={{ color: COLORS.muted }}>
                new today.
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 sm:text-base justify-center"
              style={{ color: COLORS.muted }}>
              Explore bite-sized lessons and expert-led videos, curated to help you
              build skills at your own pace.
            </p>
          </div>
        </div>

        {/* Search and result count */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xl">
            <label htmlFor="video-search" className="sr-only">
              Search learning videos
            </label>
            <div
              className="group relative flex items-center rounded-xl border bg-white transition focus-within:ring-4"
              style={{
                borderColor: COLORS.border,
                ["--tw-ring-color" as string]: "rgba(63, 56, 56, 0.08)",
              }}
            >
              <Search
                className="pointer-events-none absolute left-4 h-[18px] w-[18px] transition-colors"
                style={{ color: COLORS.muted }}
                aria-hidden="true"
              />
              <input
                id="video-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by lesson, subject, or keyword..."
                className="h-12 w-full rounded-xl bg-transparent pl-11 pr-12 text-sm outline-none placeholder:text-[#A49D9A]"
                style={{ color: COLORS.ink }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#F5F2F0]"
                  style={{ color: COLORS.muted }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <p className="text-sm" style={{ color: COLORS.muted }} aria-live="polite">
            {searchQuery ? (
              <>
                <span className="font-semibold" style={{ color: COLORS.ink }}>
                  {filteredVideos.length}
                </span>{" "}
                {filteredVideos.length === 1 ? "result" : "results"} for “{searchQuery}”
              </>
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold" style={{ color: COLORS.ink }}>
                  {filteredVideos.length}
                </span>{" "}
                {filteredVideos.length === 1 ? "video" : "videos"}
              </>
            )}
          </p>
        </div>

        {/* Video grid */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredVideos.map((video, index) => (
              <Link
                key={video.id || index}
                href={`/videos/${video.id}`}
                className="group block h-full rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-[#3F3838]/15"
              >
                <article
                  className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_45px_rgba(63,56,56,0.09)]"
                  style={{ borderColor: COLORS.border }}
                >
                  <div className="relative aspect-video w-full overflow-hidden"
                    style={{ backgroundColor: COLORS.surface }}>
                    <Image
                      src={video.thumbnail}
                      fill
                      alt={video.title}
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 opacity-70 transition-opacity group-hover:opacity-100" />

                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
                      <VideoIcon className="h-3.5 w-3.5" />
                      Video lesson
                    </span>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#3F3838] shadow-lg transition duration-300 group-hover:scale-110 group-hover:bg-[#3F3838] group-hover:text-white">
                        <Play className="ml-0.5 h-[18px] w-[18px] fill-current" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h2
                      className="line-clamp-2 text-base font-semibold leading-6 tracking-[-0.02em] transition-colors"
                      style={{ color: COLORS.ink }}
                    >
                      {video.title}
                    </h2>

                    {video.description ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-6"
                        style={{ color: COLORS.muted }}>
                        {video.description}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm leading-6" style={{ color: COLORS.muted }}>
                        Open this lesson to start learning.
                      </p>
                    )}

                    <div
                      className="mt-5 flex items-center justify-between gap-3 border-t pt-4"
                      style={{ borderColor: COLORS.border }}
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: COLORS.muted }}>
                        <Eye className="h-4 w-4" />
                        {video.viewCount
                          ? `${Number(video.viewCount).toLocaleString()} views`
                          : "Start watching"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all group-hover:gap-2"
                        style={{ color: COLORS.ink }}>
                        Watch lesson
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-white"
              style={{ borderColor: COLORS.border, color: COLORS.ink }}>
              <Search className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-semibold" style={{ color: COLORS.ink }}>
              No lessons found
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6" style={{ color: COLORS.muted }}>
              We couldn’t find any videos matching “{searchQuery}”. Try another keyword
              or clear your search to explore all lessons.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-5 inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-85"
              style={{ backgroundColor: COLORS.ink, color: COLORS.white }}
            >
              Clear search
            </button>
          </div>
        )}
      </section>
    </main>
  );
}


// "use client";

// import { useMemo, useState } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import {
//   ArrowRight,
//   Eye,
//   Play,
//   Search,
//   Video as VideoIcon,
//   X,
// } from "lucide-react";

// import { Video } from "@/lib/youtube";

// interface VideoListProps {
//   mathVideos: Video[];
//   techVideos: Video[];
// }

// export default function VideoList({ mathVideos, techVideos }: VideoListProps) {
//   const [searchQuery, setSearchQuery] = useState("");

//   const allVideos = useMemo(() => {
//     const combined = [...mathVideos, ...techVideos];

//     const uniqueVideos = new Map<string, Video>();

//     combined.forEach((video, index) => {
//       const key = video.id || `${video.title}-${index}`;

//       if (!uniqueVideos.has(key)) {
//         uniqueVideos.set(key, video);
//       }
//     });

//     return Array.from(uniqueVideos.values());
//   }, [mathVideos, techVideos]);

//   const filteredVideos = useMemo(() => {
//     const query = searchQuery.trim().toLowerCase();

//     if (!query) {
//       return allVideos;
//     }

//     return allVideos.filter((video) => {
//       const title = video.title?.toLowerCase() ?? "";
//       const description = video.description?.toLowerCase() ?? "";

//       return title.includes(query) || description.includes(query);
//     });
//   }, [allVideos, searchQuery]);

//   return (
//     <div className="w-full">
//       {/* Search */}
//       <div className="mx-auto mb-8 max-w-5xl">
//         <div
//           className="
//             group relative flex items-center
//             rounded-2xl
//             border border-border/70
//             bg-card
//             shadow-sm
//             transition-all duration-200
//             focus-within:border-primary/50
//             focus-within:shadow-md
//             focus-within:ring-4
//             focus-within:ring-primary/10
//           "
//         >
//           <Search
//             className="
//               absolute left-4 top-1/2
//               h-5 w-5
//               -translate-y-1/2
//               text-muted-foreground
//               transition-colors
//               group-focus-within:text-primary
//             "
//             aria-hidden="true"
//           />

//           <input
//             type="text"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             placeholder="Search videos by title or topic..."
//             className="
//               h-13 w-full
//               rounded-2xl
//               bg-transparent
//               pl-12 pr-12
//               text-sm font-medium
//               text-foreground
//               outline-none
//               placeholder:text-muted-foreground
//             "
//           />

//           {searchQuery && (
//             <button
//               type="button"
//               onClick={() => setSearchQuery("")}
//               aria-label="Clear search"
//               className="
//                 absolute right-3 top-1/2
//                 flex h-8 w-8
//                 -translate-y-1/2
//                 items-center justify-center
//                 rounded-lg
//                 text-muted-foreground
//                 transition
//                 hover:bg-muted
//                 hover:text-foreground
//                 active:scale-95
//               "
//             >
//               <X className="h-4 w-4" />
//             </button>
//           )}
//         </div>

//         {/* Results */}
//         <div className="mt-3 px-1">
//           <p className="text-xs text-muted-foreground">
//             {searchQuery ? (
//               <>
//                 <span className="font-semibold text-foreground">
//                   {filteredVideos.length}
//                 </span>{" "}
//                 {filteredVideos.length === 1 ? "result" : "results"} for{" "}
//                 <span className="font-medium text-foreground">
//                   &ldquo;{searchQuery}&rdquo;
//                 </span>
//               </>
//             ) : (
//               <>
//                 <span className="font-semibold text-foreground">
//                   {allVideos.length}
//                 </span>{" "}
//                 {allVideos.length === 1 ? "video" : "videos"} available
//               </>
//             )}
//           </p>
//         </div>
//       </div>

//       {/* Video Grid */}
//       {filteredVideos.length > 0 ? (
//         <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
//           {filteredVideos.map((video, index) => (
//             <Link
//               key={video.id || index}
//               href={`/videos/${video.id}`}
//               className="group block h-full"
//             >
//               <article
//                 className="
//                   flex h-full flex-col
//                   overflow-hidden
//                   rounded-sm
//                   border border-border/70
//                   bg-card
//                   shadow-sm
//                   transition-all duration-300
//                   hover:-translate-y-1
//                   hover:border-primary/30
//                   hover:shadow-xl
//                   hover:shadow-primary/5
//                 "
//               >
//                 {/* Thumbnail */}
//                 <div className="relative aspect-video w-full overflow-hidden bg-muted">
//                   <Image
//                     src={video.thumbnail}
//                     fill
//                     alt={video.title}
//                     className="object-cover transition-transform duration-500 group-hover:scale-105"
//                   />

//                   {/* Image overlay */}
//                   <div
//                     className="
//                       absolute inset-0
//                       bg-black/0
//                       transition-colors duration-300
//                       group-hover:bg-black/15
//                     "
//                   />

//                   {/* Play button */}
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <div
//                       className="
//                         flex h-12 w-12
//                         items-center justify-center
//                         rounded-full
//                         bg-white/95
//                         text-primary
//                         shadow-xl
//                         ring-1 ring-white/50
//                         transition-all duration-300
//                         group-hover:scale-110
//                         group-hover:bg-primary
//                         group-hover:text-primary-foreground
//                       "
//                     >
//                       <Play className="ml-0.5 h-5 w-5 fill-current" />
//                     </div>
//                   </div>

//                   {/* Video badge */}
//                   <div className="absolute left-3 top-3">
//                     <span
//                       className="
//                         inline-flex items-center gap-1.5
//                         rounded-lg
//                         border border-white/20
//                         bg-black/50
//                         px-2.5 py-1.5
//                         text-[10px]
//                         font-semibold
//                         text-white
//                         shadow-sm
//                         backdrop-blur-md
//                       "
//                     >
//                       <VideoIcon className="h-3 w-3" />
//                       Video
//                     </span>
//                   </div>
//                 </div>

//                 {/* Content */}
//                 <div className="flex flex-1 flex-col p-5">
//                   <h2
//                     className="
//                       line-clamp-2
//                       text-sm
//                       font-bold
//                       leading-snug
//                       text-foreground
//                       transition-colors
//                       group-hover:text-primary
//                     "
//                   >
//                     {video.title}
//                   </h2>

//                   {video.description && (
//                     <p
//                       className="
//                         mt-2
//                         line-clamp-2
//                         text-xs
//                         leading-relaxed
//                         text-muted-foreground
//                       "
//                     >
//                       {video.description}
//                     </p>
//                   )}

//                   {/* Footer */}
//                   <div
//                     className="
//                       mt-auto
//                       flex items-center justify-between
//                       gap-3
//                       border-t border-border/60
//                       pt-4
//                     "
//                   >
//                     {/* Views */}
//                     <div
//                       className="
//                         flex items-center gap-1.5
//                         text-[11px]
//                         font-medium
//                         text-muted-foreground
//                       "
//                     >
//                       <Eye className="h-3.5 w-3.5" />

//                       <span>
//                         {video.viewCount
//                           ? `${Number(video.viewCount).toLocaleString()} views`
//                           : "0 views"}
//                       </span>
//                     </div>

//                     {/* Watch */}
//                     <div
//                       className="
//                         flex items-center gap-1
//                         text-[11px]
//                         font-semibold
//                         text-primary
//                         transition-all
//                         group-hover:gap-1.5
//                       "
//                     >
//                       Watch
//                       <ArrowRight className="h-3.5 w-3.5" />
//                     </div>
//                   </div>
//                 </div>
//               </article>
//             </Link>
//           ))}
//         </div>
//       ) : (
//         /* Empty State */
//         <div
//           className="
//             flex min-h-80
//             flex-col items-center justify-center
//             rounded-2xl
//             border border-dashed border-border
//             bg-muted/30
//             px-6
//             text-center
//           "
//         >
//           <div
//             className="
//               flex h-14 w-14
//               items-center justify-center
//               rounded-2xl
//               bg-card
//               text-muted-foreground
//               shadow-sm
//               ring-1 ring-border
//             "
//           >
//             <Search className="h-5 w-5" />
//           </div>

//           <h3 className="mt-4 text-sm font-semibold text-foreground">
//             No videos found
//           </h3>

//           <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
//             We couldn&apos;t find any videos matching{" "}
//             <span className="font-semibold text-foreground">
//               &ldquo;{searchQuery}&rdquo;
//             </span>
//             .
//           </p>

//           <button
//             type="button"
//             onClick={() => setSearchQuery("")}
//             className="
//               mt-4
//               inline-flex items-center
//               rounded-xl
//               border border-border
//               bg-card
//               px-4 py-2
//               text-xs
//               font-semibold
//               text-foreground
//               shadow-sm
//               transition-all
//               hover:border-primary/30
//               hover:bg-muted
//               hover:text-primary
//             "
//           >
//             Clear search
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
