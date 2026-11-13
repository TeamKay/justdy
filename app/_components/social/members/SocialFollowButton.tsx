
"use client";

import { useState, useTransition } from "react";
import {
  cancelSocialFollowRequest,
  createSocialFollow,
  unfollowSocialUser,
} from "@/app/actions/social-follow";

type FollowStatus = "PENDING" | "ACCEPTED" | "REJECTED" | null;

type Props = {
  username: string;
  isPrivate: boolean;
  initialStatus: FollowStatus;
};

export default function SocialFollowButton({
  username,
  isPrivate,
  initialStatus,
}: Props) {
  const [status, setStatus] = useState<FollowStatus>(initialStatus);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleFollowAction() {
    if (isPending) return;

    setError("");
    setMessage("");

    startTransition(async () => {
      let result;

      if (status === "PENDING") {
        result = await cancelSocialFollowRequest({ username });

        if (result.success) setStatus(null);
      } else if (status === "ACCEPTED") {
        result = await unfollowSocialUser({ username });

        if (result.success) setStatus(null);
      } else {
        result = await createSocialFollow({ username });

        if (result.success) {
          setStatus(result.status ?? (isPrivate ? "PENDING" : "ACCEPTED"));
        }
      }

      if (result.success) {
        setMessage(result.message);
      } else {
        setError(result.error);
      }
    });
  }

  const label =
    status === "PENDING"
      ? "Requested"
      : status === "ACCEPTED"
        ? "Following"
        : "Follow";

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleFollowAction}
        disabled={isPending}
        aria-label={
          status === "PENDING"
            ? "Cancel follow request"
            : status === "ACCEPTED"
              ? "Unfollow profile"
              : "Follow profile"
        }
        className={`inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          status === "ACCEPTED" || status === "PENDING"
            ? "border border-[#D9E1D8] bg-white text-[#52665A] hover:bg-[#F6F8F5]"
            : "bg-[#173B2F] text-white hover:bg-[#24513F]"
        }`}
      >
        {isPending ? "Please wait..." : label}
      </button>

      {message && (
        <p role="status" className="text-xs text-[#52745D]">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
