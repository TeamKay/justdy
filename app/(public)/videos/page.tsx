import VideoList from "@/app/_components/VideoList";
import { getYoutubeVideos } from "@/lib/youtube";

export default async function VideosPage() {
  const videos = await getYoutubeVideos();

  return (
    <main className="min-h-screen bg-background text-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        {/* Search & Video Grid */}
        <VideoList initialVideos={videos} />
      </div>
    </main>
  );
}
