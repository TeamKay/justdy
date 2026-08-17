import VideoList from "@/app/_components/VideoList";
import { getYoutubeVideos } from "@/lib/youtube";

export default async function VideosPage() {
  const [mathVideos, techVideos] = await Promise.all([
    getYoutubeVideos("math"),
    getYoutubeVideos("tech"),
  ]);

  return (
    <main className="w-full bg-background text-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1600px] mx-auto px-12 space-y-6">
        <VideoList mathVideos={mathVideos} techVideos={techVideos} />
      </div>
    </main>
  );
}
