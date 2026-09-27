import VideoList from "@/app/_components/VideoList";
import { getYoutubeVideos } from "@/lib/youtube";


export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const [mathVideos, techVideos] = await Promise.all([
    getYoutubeVideos("math"),
    getYoutubeVideos("tech"),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            Free learning library
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Free Tutoring Videos
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Explore lessons, tutorials, explanations, and educational content
            from YouTube — all in one place.
          </p>
        </div>

        <VideoList
          mathVideos={mathVideos}
          techVideos={techVideos}
        />
      </section>
    </main>
  );
}