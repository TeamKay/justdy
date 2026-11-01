"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const Whiteboard = dynamic(() => import("@/app/_components/Whiteboard"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-[#eef2f7] text-sm font-medium text-slate-600">
      Loading Whiteboard Studio…
    </div>
  ),
});

export default function AdminWhiteboardStudio() {
  const router = useRouter();

  return (
    <Whiteboard
      mode="standalone"
      onClose={() => router.push("/admin")}
    />
  );
}
