
"use client";

import { useState, useTransition } from "react";
import { Check, X, UserRound, Clock } from "lucide-react";

import { respondToSocialFollowRequest } from "@/app/actions/social-follow";

type FollowRequest = {
  id: string;
  createdAt: string;
  follower: {
    id: string;
    imageUrl: string | null;
    socialProfile: {
      username: string;
      displayName: string;
    } | null;
  };
};

type Props = {
  initialRequests: FollowRequest[];
};

export default function SocialFollowRequests({
  initialRequests,
}: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDecision(
    followId: string,
    decision: "ACCEPT" | "REJECT",
  ) {
    if (isPending) return;

    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await respondToSocialFollowRequest({
        followId,
        decision,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setRequests((current) =>
        current.filter((request) => request.id !== followId),
      );

      setMessage(result.message);
    });
  }

  return (
    <div>
      {message && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-[#D9E8DB] bg-[#EDF5EE] px-4 py-3 text-sm text-[#315C3E]"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D9E1D8] bg-white px-5 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF1EB] text-[#52745D]">
            <UserRound className="h-8 w-8" />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-[#173B2F]">
            No pending requests
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#87938A]">
            When someone requests to follow your private profile, their
            request will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E8E9E2] bg-white">
          {requests.map((request, index) => {
            const profile = request.follower.socialProfile;

            return (
              <div
                key={request.id}
                className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${
                  index !== requests.length - 1
                    ? "border-b border-[#EEF0EB]"
                    : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF1EB] text-lg font-semibold text-[#173B2F]">
                    {request.follower.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={request.follower.imageUrl}
                        alt={profile?.displayName ?? "Member"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (profile?.displayName?.charAt(0).toUpperCase() ?? "J")
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#173B2F]">
                      {profile?.displayName ?? "Justdy member"}
                    </p>

                    {profile && (
                      <p className="mt-0.5 text-xs text-[#87938A]">
                        @{profile.username}
                      </p>
                    )}

                    <p className="mt-1 flex items-center gap-1 text-[11px] text-[#9AA49B]">
                      <Clock className="h-3 w-3" />
                      Requested{" "}
                      {new Date(request.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleDecision(request.id, "ACCEPT")
                    }
                    disabled={isPending}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#173B2F] px-4 text-xs font-semibold text-white transition hover:bg-[#24513F] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Accept
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDecision(request.id, "REJECT")
                    }
                    disabled={isPending}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E8E9E2] bg-white px-4 text-xs font-semibold text-[#64746A] transition hover:bg-[#F6F8F5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
