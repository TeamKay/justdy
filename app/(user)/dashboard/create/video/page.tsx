import { Suspense } from "react";
import VideoCreateClient from "@/app/_components/create/VideoCreateClient";

export const dynamic = "force-dynamic";

export default function VideoCreatePage() {
  return (
    <Suspense fallback={null}>
      <VideoCreateClient />
    </Suspense>
  );
}
