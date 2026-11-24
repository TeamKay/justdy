
/* =====================================================
   LATEST YOUTUBE VIDEOS
===================================================== */

import type { Video as YouTubeVideo } from "@/lib/youtube";
import { ArrowRight, PlayCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LatestVideosSection({
  videos,
}: {
  videos: YouTubeVideo[];
}) {
  // Hide the section if YouTube returns no videos
  if (!videos.length) return null;

  return (
    <section className="bg-[#ffffff] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl lg:px-0">
        <div className="mx-auto mb-0 max-w-5xl text-center">
        <div className="flex flex-row items-center justify-center gap-3">
          
          <h1 className="font-chalkduster max-w-6xl text-balance text-[2rem] font-bold leading-tight tracking-normal text-[#173B2F] sm:text-2xl md:text-5xl lg:text-[2.5rem]">
            Interactive Video!{" "}
            <span className="relative inline-block bg-linear-to-r from-[#55984A] via-[#70A94D] to-[#E89A42] bg-clip-text text-transparent">
              Lessons
            </span>
          </h1>
        </div>
          <p className="mx-auto mt-2 max-w-5xl text-base leading-8 text-[#718078] sm:text-lg">
            Explore our latest mathematics lessons, tutorials and
            educational videos. Watch, learn and keep growing.
          </p>
        </div>
       
        {/* Latest three videos */}
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">

          {videos.map((video) => (

            <Link
              key={video.id}
              href={`/videos/${video.id}`}
              className="group block h-full"
            >

              <article className="flex h-full flex-col overflow-hidden rounded-lg border border-[#E3EDE0] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#C8DFC0] hover:shadow-xl">
                {/* Video thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-[#F0F5ED]">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Thumbnail overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                  {/* Video label */}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-md">
                    <PlayCircle className="h-3.5 w-3.5" />
                    VIDEO LESSON
                  </span>

                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#315F3B] shadow-xl transition duration-300 group-hover:scale-110 group-hover:bg-[#55984A] group-hover:text-white">
                      <PlayCircle className="h-7 w-7" />
                    </div>
                  </div>

                </div>

                {/* Video information */}
                <div className="flex flex-1 flex-col p-5 sm:p-6">

                  <h3 className="line-clamp-2 text-base font-extrabold leading-6 tracking-tight text-[#263D34] transition-colors group-hover:text-[#55984A]">
                    {video.title}
                  </h3>

                  {video.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#788579]">
                      {video.description}
                    </p>
                  )}
                  {/* Video footer */}
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#EAEFE7] pt-5">
                    <span className="text-xs font-medium text-[#89958B]">
                      {video.viewCount
                        ? `${Number(video.viewCount).toLocaleString()} views`
                        : "Watch now"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#315F3B] transition group-hover:gap-2">
                      Watch video
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
           <div className="col-span-full flex justify-end pt-5">
            <Link
              href="/videos"
              className="group inline-flex items-center gap-2 text-sm font-bold text-[#315F3B] transition hover:text-[#55984A]"
            >
              Browse all videos
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
