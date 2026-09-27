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
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div
          className="
            overflow-hidden
            rounded-3xl
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
              <span>
                {Number(video.viewCount).toLocaleString()} views
              </span>

              {video.publishedAt && (
                <span>
                  {new Date(video.publishedAt).toLocaleDateString()}
                </span>
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