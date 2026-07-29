import VideoList from "@/app/_components/VideoList";
import { getYoutubeVideos } from "@/lib/youtube";

export default async function VideosPage() {
  // Fetch both channels concurrently on the server
  const [mathVideos, techVideos] = await Promise.all([
    getYoutubeVideos("math"), // Adjust parameter to match your lib/youtube function signature
    getYoutubeVideos("tech"),
  ]);

  return (
    <main className="min-h-screen bg-background text-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        <VideoList mathVideos={mathVideos} techVideos={techVideos} />
      </div>
    </main>
  );
}
