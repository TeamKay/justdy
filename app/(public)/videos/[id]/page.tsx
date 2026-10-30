import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface YouTubeVideoItem {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelTitle?: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

interface YouTubeVideoResponse {
  items?: YouTubeVideoItem[];
}

async function getVideoById(id: string) {
  const API_KEY = process.env.YOUTUBE_API_KEY;

  if (!API_KEY || !id) {
    return null;
  }

  const url =
    `https://www.googleapis.com/youtube/v3/videos?` +
    new URLSearchParams({
      key: API_KEY,
      part: "snippet,statistics",
      id,
    });

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    const data: YouTubeVideoResponse = await response.json();
    const video = data.items?.[0];

    if (!video) {
      return null;
    }

    return {
      id: video.id,
      title: video.snippet?.title || "YouTube Video",
      description: video.snippet?.description || "",
      channelTitle: video.snippet?.channelTitle || "",
      publishedAt: video.snippet?.publishedAt,
      viewCount: video.statistics?.viewCount || "0",
    };
  } catch (error) {
    console.error("Failed to fetch YouTube video:", error);
    return null;
  }
}

interface VideoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { id } = await params;

  const video = await getVideoById(id);

  if (!video) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 mt-6 sm:px-6 lg:px-8">
       <div className="mb-0">
        <Link
          href="/videos"
          className="group inline-flex items-center gap-2 rounded-lg border border-[#3F3838]/10 bg-white px-4 py-2.5 text-sm font-medium text-[#3F3838] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3F3838]/20 hover:bg-[#FAF9F8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3F3838]/10"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          <span>Back home</span>
        </Link>
      </div>
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-5 sm:px-6 lg:px-0">
        <div
          className="
            overflow-hidden
            rounded-lg
            border border-border/70
            bg-card
            shadow-xl
            shadow-foreground/5
          "
        >
          {/* Video */}
          <div className="aspect-video w-full bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${video.id}`}
              title={video.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8">
            <h1
              className="
                text-xl
                font-bold
                tracking-tight
                text-foreground
                sm:text-2xl
              "
            >
              {video.title}
            </h1>

            {video.channelTitle && (
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {video.channelTitle}
              </p>
            )}

            <div
              className="
                mt-4
                flex flex-wrap items-center gap-x-5 gap-y-2
                text-xs
                text-muted-foreground
              "
            >
              <span>{Number(video.viewCount).toLocaleString()} views</span>

              {video.publishedAt && (
                <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
              )}
            </div>

            {video.description && (
              <div className="mt-7 border-t border-border/70 pt-6">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  About this video
                </h2>

                <p
                  className="
                    whitespace-pre-line
                    text-sm
                    leading-7
                    text-muted-foreground
                  "
                >
                  {video.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
