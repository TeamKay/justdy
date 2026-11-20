
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, LockKeyhole, Users } from "lucide-react";

import { joinSocialChallenge } from "@/app/actions/social-challenge";
import ChallengeCountdown from "./ChallengeCountdown";

type JoinChallengeButtonProps = {
  challengeId: string | null;
  participantCount: number;
  isJoined: boolean;
  isLearner: boolean;
  opensAt: string | null;
  closesAt: string | null;
  status: "OPEN" | "CLOSED" | "CANCELLED" | null;
};

function formatChallengeDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function JoinChallengeButton({
  challengeId,
  participantCount: initialParticipantCount,
  isJoined: initialIsJoined,
  isLearner,
  opensAt,
  closesAt,
  status,
}: JoinChallengeButtonProps) {
  const router = useRouter();

  const [isJoined, setIsJoined] = useState(initialIsJoined);
  const [participantCount, setParticipantCount] = useState(
    initialParticipantCount,
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const updateCurrentTime = () => {
      setNow(Date.now());
    };

    updateCurrentTime();

    const interval = window.setInterval(updateCurrentTime, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const openingTime = opensAt ? new Date(opensAt).getTime() : null;
  const closingTime = closesAt ? new Date(closesAt).getTime() : null;

  const hasSchedule =
    openingTime !== null &&
    closingTime !== null &&
    Number.isFinite(openingTime) &&
    Number.isFinite(closingTime);

  const isBeforeOpening =
    now !== null &&
    hasSchedule &&
    now < openingTime!;

  const isPastDeadline =
    now !== null &&
    hasSchedule &&
    now >= closingTime!;

  const canJoin =
    now !== null &&
    Boolean(challengeId) &&
    isLearner &&
    status === "OPEN" &&
    hasSchedule &&
    !isBeforeOpening &&
    !isPastDeadline;

  function handleJoin() {
    if (!challengeId || !canJoin || isPending || isJoined) {
      return;
    }

    setError("");

    startTransition(async () => {
      const result = await joinSocialChallenge(challengeId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsJoined(true);
      setParticipantCount(result.participantCount);

      router.refresh();
    });
  }

  return (
    <div className="mt-5 rounded-xl border border-[#E9E2D1] bg-[#FFFCF5] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#694A2D]">
          <Users className="h-5 w-5" />
          <span className="text-sm font-semibold">
            Challenge participants
          </span>
        </div>

        <span
          className="text-lg font-bold tabular-nums text-[#315B43]"
          aria-live="polite"
        >
          {participantCount}
        </span>
      </div>

      {hasSchedule && (
        <div className="mt-3 space-y-2 text-xs text-[#806C4E]">
          <p className="flex items-start gap-2">
            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Opens: {formatChallengeDate(opensAt!)}
            </span>
          </p>

          <p className="flex items-start gap-2">
            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Closes: {formatChallengeDate(closesAt!)}
            </span>
          </p>
        </div>
      )}

      <ChallengeCountdown
        opensAt={opensAt}
        closesAt={closesAt}
        now={now}
        status={status}
      />

      {!challengeId ? (
        <p className="mt-4 text-sm text-[#806C4E]">
          Challenge participation is not available for this post.
        </p>
      ) : isJoined ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#EAF3EA] px-4 py-3 text-sm font-semibold text-[#315B43]">
          <Check className="h-4 w-4" />
          You&apos;re participating
        </div>
      ) : now === null ? (
        <div className="mt-4 rounded-lg bg-[#F1F2EF] px-4 py-3 text-center text-sm font-medium text-[#69746C]">
          Checking challenge schedule...
        </div>
      ) : !isLearner ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#F1F2EF] px-4 py-3 text-sm font-medium text-[#69746C]">
          <LockKeyhole className="h-4 w-4" />
          Participation is for learners
        </div>
      ) : status === "CANCELLED" ? (
        <div className="mt-4 rounded-lg bg-[#F1F2EF] px-4 py-3 text-center text-sm font-medium text-[#69746C]">
          This challenge has been cancelled.
        </div>
      ) : status === "CLOSED" || isPastDeadline ? (
        <div className="mt-4 rounded-lg bg-[#F1F2EF] px-4 py-3 text-center text-sm font-medium text-[#69746C]">
          Challenge registration is closed.
        </div>
      ) : isBeforeOpening ? (
        <div className="mt-4 rounded-lg bg-[#F1F2EF] px-4 py-3 text-center text-sm font-medium text-[#69746C]">
          Registration has not opened yet.
        </div>
      ) : !hasSchedule || status !== "OPEN" ? (
        <div className="mt-4 rounded-lg bg-[#F1F2EF] px-4 py-3 text-center text-sm font-medium text-[#69746C]">
          Challenge registration is unavailable.
        </div>
      ) : (
        <button
          type="button"
          onClick={handleJoin}
          disabled={!canJoin || isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#315B43] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#254A35] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Joining challenge..." : "Join Challenge"}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs leading-5 text-red-600">
          {error}
        </p>
      )}

      <p className="mt-3 text-center text-xs leading-5 text-[#8A806F]">
        Join the challenge to register your participation.
      </p>
    </div>
  );
}
