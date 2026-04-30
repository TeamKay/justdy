import VideoCall from "@/app/_components/VideoCall";

interface PageProps {
  searchParams: Promise<{
    sessionId?: string;
    token?: string;
  }>;
}

export default async function VideoCallPage({ searchParams }: PageProps) {
  const { sessionId, token } = await searchParams;

  if (!sessionId || !token) {
    return <div className="text-white p-10">Invalid Session or Token</div>;
  }

  return <VideoCall sessionId={sessionId} token={token} />;
}
