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
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <VideoList mathVideos={mathVideos} techVideos={techVideos} />
      </section>
    </main>
  );
}
