import VideoList from "@/app/_components/VideoList";
import { getYoutubeVideos } from "@/lib/youtube";

export default async function VideosPage() {
  const [mathVideos, techVideos] = await Promise.all([
    getYoutubeVideos("math"),
    getYoutubeVideos("tech"),
  ]);

  return (
    <main className="w-full bg-background px-3 py-4 text-slate-50 sm:px-4 sm:py-6 md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <VideoList mathVideos={mathVideos} techVideos={techVideos} />
      </div>
    </main>
  );
}
