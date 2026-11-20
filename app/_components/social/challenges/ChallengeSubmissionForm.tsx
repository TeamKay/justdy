
"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  LockKeyhole,
  Send,
  Trophy,
} from "lucide-react";

import { submitSocialChallengeAnswer } from "@/app/actions/social-challenge";
import ChallengeCountdown from "./ChallengeCountdown";

type SubmissionStatus = "PENDING" | "GRADED";

type ChallengeSubmission = {
  id: string;
  answer: string;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
};

type ChallengeSubmissionFormProps = {
  challengeId: string | null;
  isJoined: boolean;
  opensAt: string | null;
  closesAt: string | null;
  challengeStatus: "OPEN" | "CLOSED" | "CANCELLED" | null;
  initialSubmission: ChallengeSubmission | null;
};

function formatChallengeDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ChallengeSubmissionForm({
  challengeId,
  isJoined,
  opensAt,
  closesAt,
  challengeStatus,
  initialSubmission,
}: ChallengeSubmissionFormProps) {
  const [submission, setSubmission] =
    useState<ChallengeSubmission | null>(initialSubmission);

  const [answer, setAnswer] = useState(
    initialSubmission?.answer ?? "",
  );

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  // The deadline is exclusive. At the exact closing time,
  // submissions and updates are no longer accepted.
  const isPastDeadline =
    now !== null &&
    hasSchedule &&
    now >= closingTime!;

  const canSubmit =
    now !== null &&
    Boolean(challengeId) &&
    isJoined &&
    challengeStatus === "OPEN" &&
    hasSchedule &&
    !isBeforeOpening &&
    !isPastDeadline;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!challengeId || !canSubmit || isPending) {
      return;
    }

    if (!answer.trim()) {
      setError("Please enter your answer before submitting.");
      return;
    }

    setError("");
    setSuccessMessage("");

    startTransition(async () => {
      try {
        const result = await submitSocialChallengeAnswer(
          challengeId,
          answer,
        );

        if (!result.success) {
          setError(result.error);
          return;
        }

        setSubmission({
          id: result.submission.id,
          answer: answer.trim(),
          status: result.submission.status,
          score: null,
          feedback: null,
          submittedAt: result.submission.submittedAt,
          gradedAt: null,
        });

        setAnswer(answer.trim());

        setSuccessMessage(
          "Your answer has been submitted successfully.",
        );
      } catch {
        setError(
          "Something went wrong while submitting your answer. Please try again.",
        );
      }
    });
  }

  if (!challengeId) {
    return null;
  }

  if (!isJoined) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#E9EEE8] bg-[#F8FAF7] p-4">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#718174]" />

        <div>
          <p className="text-sm font-semibold text-[#315B43]">
            Join before submitting
          </p>

          <p className="mt-1 text-xs leading-5 text-[#718174]">
            Register for this mathematics challenge before submitting your solution.
          </p>
        </div>
      </div>
    );
  }

  if (now === null) {
    return (
      <div className="mt-4 rounded-xl border border-[#E9EEE8] bg-[#F8FAF7] p-4 text-sm text-[#718174]">
        Checking submission availability...
      </div>
    );
  }

  if (isBeforeOpening) {
    return (
      <div className="mt-4 rounded-xl border border-[#E9EEE8] bg-[#F8FAF7] p-4">
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#718174]" />

          <div>
            <p className="text-sm font-semibold text-[#315B43]">
              Submissions have not opened
            </p>

            <p className="mt-1 text-xs leading-5 text-[#718174]">
              You can submit your answer from {formatChallengeDate(opensAt!)}.
            </p>
          </div>
        </div>

        <ChallengeCountdown
          opensAt={opensAt}
          closesAt={closesAt}
          now={now}
          status={challengeStatus}
        />
      </div>
    );
  }

  const submissionClosed =
    challengeStatus !== "OPEN" ||
    isPastDeadline ||
    !hasSchedule;

  if (submissionClosed && !submission) {
    return (
      <div className="mt-4 rounded-xl border border-[#E9EEE8] bg-[#F8FAF7] p-4">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#718174]" />

          <div>
            <p className="text-sm font-semibold text-[#526457]">
              Submissions are closed
            </p>

            <p className="mt-1 text-xs leading-5 text-[#718174]">
              This challenge is no longer accepting answers.
            </p>
          </div>
        </div>

        <ChallengeCountdown
          opensAt={opensAt}
          closesAt={closesAt}
          now={now}
          status={challengeStatus}
        />
      </div>
    );
  }

  const isEditable = canSubmit;

  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-[#DCE9DE] bg-white">
      <div className="flex items-center gap-2 border-b border-[#E9EEE8] bg-[#F5F9F5] px-4 py-3">
        <FileText className="h-4 w-4 text-[#315B43]" />

        <h3 className="text-sm font-bold text-[#315B43]">
          Your Challenge Answer
        </h3>
      </div>

      <div className="p-4">
        <ChallengeCountdown
          opensAt={opensAt}
          closesAt={closesAt}
          now={now}
          status={challengeStatus}
        />

        {submission && (
          <div className="mt-4 mb-4 rounded-lg border border-[#E9EEE8] bg-[#FAFCFA] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {submission.status === "GRADED" ? (
                  <Trophy className="h-4 w-4 text-[#B08036]" />
                ) : (
                  <Clock3 className="h-4 w-4 text-[#718174]" />
                )}

                <span className="text-sm font-semibold text-[#315B43]">
                  {submission.status === "GRADED"
                    ? "Answer graded"
                    : "Answer submitted"}
                </span>
              </div>

              {submission.status === "GRADED" && (
                <span className="rounded-full bg-[#EAF3EA] px-3 py-1 text-sm font-bold text-[#315B43]">
                  {submission.score ?? 0} points
                </span>
              )}
            </div>

            <p className="mt-2 text-xs text-[#718174]">
              Last submitted: {formatChallengeDate(submission.submittedAt)}
            </p>

            {submission.status === "GRADED" &&
              submission.feedback && (
                <div className="mt-3 border-t border-[#E9EEE8] pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#718174]">
                    Administrator feedback
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#46564A]">
                    {submission.feedback}
                  </p>
                </div>
              )}
          </div>
        )}

        {isEditable ? (
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="challenge-answer"
              className="mb-2 block text-sm font-semibold text-[#354A3A]"
            >
              {submission
                ? "Edit your mathematical solution"
                : "Write your mathematical solution"}
            </label>

            <textarea
              id="challenge-answer"
              value={answer}
              onChange={(event) => {
                setAnswer(event.target.value);
                setError("");
                setSuccessMessage("");
              }}
              maxLength={20000}
              rows={8}
              placeholder="Explain your reasoning and show your working here..."
              disabled={isPending}
              className="w-full resize-y rounded-lg border border-[#DCE5DC] bg-white px-4 py-3 text-sm leading-7 text-[#303B34] outline-none transition placeholder:text-[#A1AAA2] focus:border-[#6D9675] focus:ring-2 focus:ring-[#6D9675]/15 disabled:cursor-not-allowed disabled:bg-[#F8FAF8]"
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-[#8A968B]">
                Show your working and explain your reasoning.
              </p>

              <span className="shrink-0 text-xs tabular-nums text-[#8A968B]">
                {answer.length.toLocaleString()}/20,000
              </span>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2 text-xs leading-5 text-red-600"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#315B43]"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !answer.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#315B43] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#254A35] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />

              {isPending
                ? "Submitting answer..."
                : submission
                  ? "Update Answer"
                  : "Submit Answer"}
            </button>

            {submission && (
              <p className="mt-3 text-center text-xs text-[#8A968B]">
                You can update your answer until the submission deadline.
              </p>
            )}
          </form>
        ) : (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#718174]">
              Your submitted answer
            </p>

            <div className="whitespace-pre-wrap rounded-lg bg-[#FAFCFA] p-4 text-sm leading-7 text-[#46564A]">
              {submission?.answer}
            </div>

            <p className="mt-3 text-xs text-[#8A968B]">
              {isPastDeadline
                ? "The deadline has passed. Your answer is locked and can no longer be changed."
                : "This submission is locked."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
