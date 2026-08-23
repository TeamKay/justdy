// app/youtubevideos/[id]/page.tsx

import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VideoPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-background text-slate-50 py-5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto px-8 space-y-6">
        <Link
          href="/videos"
          className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-blue-500 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to all videos
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-md p-2 sm:p-0 shadow-xl overflow-hidden">
          <div className="aspect-video w-full rounded-md overflow-hidden bg-black">
            <iframe
              className="w-full h-full border-0"
              src={`https://www.youtube.com/embed/${id}?autoplay=1`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </main>
  );
}
