import React from "react";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// 1. Added optional viewCount to interface
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
      high?: YouTubeThumbnail;
      medium?: YouTubeThumbnail;
    };
  };
}

// Interface for video statistics response
interface YouTubeStatsItem {
  id: string;
  statistics?: {
    viewCount?: string;
  };
}

async function getLatestVideos(): Promise<YouTubeVideo[]> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

  if (!YOUTUBE_API_KEY || !CHANNEL_ID) {
    console.warn("YouTube API Key or Channel ID missing.");
    return [];
  }

  try {
    // Fetch latest 3 videos
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&type=video&maxResults=3`,
      { next: { revalidate: 3600 } },
    );

    if (!searchRes.ok) throw new Error("Failed to fetch videos");

    const searchData = await searchRes.json();
    const videoItems: YouTubeApiItem[] = searchData.items || [];

    if (videoItems.length === 0) return [];

    // Extract video IDs to fetch statistics (viewCount)
    const videoIds = videoItems.map((item) => item.id.videoId).join(",");

    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=statistics`,
      { next: { revalidate: 3600 } },
    );

    // CHANGED: Use `const` instead of `let`
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
      return {
        id: vId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail:
          item.snippet.thumbnails.maxres?.url ||
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          "",
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

  return (
    <section
      id="free-tutorials"
      className="py-10 bg-background relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-400 tracking-tight">
              Free Videos
            </h2>
          </div>

          <Link
            href="/videos"
            className="group/link inline-flex items-center gap-1.5 text-xs font-normal text-slate-400 hover:text-slate-200 transition-colors self-start md:self-end"
          >
            <span>browse video library</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tutorials.map((video) => (
            <Link
              key={video.id}
              href={`/videos/${video.id}`}
              className="group relative rounded-2xl bg-neutral-900/40 border border-slate-800 p-3 shadow-xs hover:border-slate-700 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Video Thumbnail Container */}
                <div className="relative rounded-xl bg-slate-950 h-48 w-full flex items-center justify-center overflow-hidden border border-slate-800">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                  />

                  {/* Date Badge */}
                  <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700/60 text-[10px] font-medium tracking-wide">
                    {video.publishedAt}
                  </span>

                  {/* Play Button Overlay */}
                  <div className="relative z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white group-hover:text-slate-900 transition-all duration-300 shadow-lg">
                    <Play className="w-5 h-5 fill-current translate-x-0.5" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 pt-4">
                  <h3 className="font-bold text-slate-200 text-sm leading-snug group-hover:text-white transition-colors line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="mt-1.5 text-slate-400 text-xs leading-relaxed font-normal line-clamp-2">
                    {video.description || "Watch full tutorial."}
                  </p>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="p-3 pt-2 flex items-center justify-between text-xs font-medium text-slate-400">
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
                <div className="flex items-center group-hover:text-white group-hover:translate-x-1 transition-all">
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

// import React from "react";
// import { ArrowRight, Play } from "lucide-react";
// import Link from "next/link";
// import Image from "next/image";

// interface YouTubeVideo {
//   id: string;
//   title: string;
//   description: string;
//   thumbnail: string;
//   publishedAt: string;
// }

// // 1. Defined strong types for the YouTube API response
// interface YouTubeThumbnail {
//   url: string;
// }

// interface YouTubeApiItem {
//   id: {
//     videoId: string;
//   };
//   snippet: {
//     title: string;
//     description: string;
//     publishedAt: string;
//     thumbnails: {
//       maxres?: YouTubeThumbnail;
//       high?: YouTubeThumbnail;
//       medium?: YouTubeThumbnail;
//     };
//   };
// }

// async function getLatestVideos(): Promise<YouTubeVideo[]> {
//   const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
//   const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

//   if (!YOUTUBE_API_KEY || !CHANNEL_ID) {
//     console.warn("YouTube API Key or Channel ID missing.");
//     return [];
//   }

//   try {
//     const res = await fetch(
//       `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&type=video&maxResults=3`,
//       { next: { revalidate: 3600 } },
//     );

//     if (!res.ok) throw new Error("Failed to fetch videos");

//     const data = await res.json();

//     // 2. Applied YouTubeApiItem instead of any
//     return data.items.map((item: YouTubeApiItem) => ({
//       id: item.id.videoId,
//       title: item.snippet.title,
//       description: item.snippet.description,
//       thumbnail:
//         item.snippet.thumbnails.maxres?.url ||
//         item.snippet.thumbnails.high?.url ||
//         item.snippet.thumbnails.medium?.url ||
//         "",
//       publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(
//         "en-US",
//         {
//           month: "short",
//           day: "numeric",
//         },
//       ),
//     }));
//   } catch (error) {
//     console.error("Error fetching YouTube videos:", error);
//     return [];
//   }
// }

// export default async function FreeVideos() {
//   const tutorials = await getLatestVideos();

//   return (
//     <section
//       id="free-tutorials"
//       className="py-24 bg-background relative overflow-hidden"
//     >
//       <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
//         {/* Header Row */}
//         <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
//           <div>
//             <h2 className="text-2xl md:text-3xl font-semibold text-slate-400 tracking-tight">
//               Free Videos
//             </h2>
//           </div>

//           <Link
//             href="/free-lessons"
//             className="group/link inline-flex items-center gap-1.5 text-xs font-normal text-slate-400 hover:text-slate-200 transition-colors self-start md:self-end"
//           >
//             <span>View full video library</span>
//             <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
//           </Link>
//         </div>

//         {/* Video Cards Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {tutorials.map((video) => (
//             <a
//               key={video.id}
//               href={`https://www.youtube.com/watch?v=${video.id}`}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="group relative rounded-2xl bg-neutral-900/40 border border-slate-800 p-3 shadow-xs hover:border-slate-700 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
//             >
//               <div>
//                 {/* Video Thumbnail Container */}
//                 <div className="relative rounded-xl bg-slate-950 h-48 w-full flex items-center justify-center overflow-hidden border border-slate-800">
//                   <Image
//                     src={video.thumbnail}
//                     alt={video.title}
//                     fill
//                     className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
//                   />

//                   {/* Date Badge */}
//                   <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700/60 text-[10px] font-medium tracking-wide">
//                     {video.publishedAt}
//                   </span>

//                   {/* Play Button Overlay */}
//                   <div className="relative z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white group-hover:text-slate-900 transition-all duration-300 shadow-lg">
//                     <Play className="w-5 h-5 fill-current translate-x-0.5" />
//                   </div>
//                 </div>

//                 {/* Content */}
//                 <div className="p-3 pt-4">
//                   <h3 className="font-bold text-slate-200 text-sm leading-snug group-hover:text-white transition-colors line-clamp-2">
//                     {video.title}
//                   </h3>
//                   <p className="mt-1.5 text-slate-400 text-xs leading-relaxed font-normal line-clamp-2">
//                     {video.description || "Watch full tutorial on YouTube."}
//                   </p>
//                 </div>
//               </div>

//               {/* Card Footer Link */}
//               <div className="p-3 pt-2">
//                 <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 group-hover:text-white group-hover:underline">
//                   Watch Video{" "}
//                   <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
//                 </span>
//               </div>
//             </a>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }
