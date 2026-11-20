
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { dismissWelcomePost } from "@/app/actions/social-official-post";

export default function DismissWelcomePostButton({
  postId,
}: {
  postId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDismiss() {
    setError(null);

    startTransition(async () => {
      const result = await dismissWelcomePost(postId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDismiss}
        disabled={isPending}
        aria-label="Dismiss welcome post"
        title="Dismiss welcome post"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#718078] transition hover:bg-[#EAF1EB] hover:text-[#173B2F] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <X className="h-4 w-4" />
      </button>

      {error && (
        <span
          role="alert"
          className="max-w-48 text-right text-xs text-red-600"
        >
          {error}
        </span>
      )}
    </div>
  );
}
