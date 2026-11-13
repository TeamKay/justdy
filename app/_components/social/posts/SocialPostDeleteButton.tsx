"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteSocialPost } from "@/app/actions/social-post";

type SocialPostDeleteButtonProps = {
  postId: string;
};

export default function SocialPostDeleteButton({
  postId,
}: SocialPostDeleteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (isPending) return;
    setError("");

    startTransition(async () => {
      const result = await deleteSocialPost(postId);
      if (!result.success) {
        setError(result.error ?? "Unable to delete this post. Please try again.");
        return;
      }
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setIsOpen(true);
        }}
        aria-label="Delete post"
        title="Delete post"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#87938A] transition hover:bg-red-50 hover:text-red-600"
      >
        <X className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#173B2F]/45 px-4 py-6 backdrop-blur-[3px]"
          onClick={() => {
            if (!isPending) {
              setIsOpen(false);
              setError("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-post-title"
            className="w-full max-w-sm rounded-lg border border-[#E8E9E2] bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="delete-post-title"
              className="mt-1 text-left text-lg font-semibold text-[#173B2F]"
            >
              Delete this post?
            </h2>
            <p className="mt-2 text-left text-sm leading-6 text-[#718075]">
              This post will be removed from your feed. You won&apos;t be able to
              restore it.
            </p>
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600"
              >
                {error}
              </p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setError("");
                }}
                disabled={isPending}
                className="rounded-xl border border-[#E5E9E2] px-4 py-3 text-sm font-medium text-[#526258] transition hover:bg-[#F7F8F5] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Deleting..." : "Delete post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
