
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Medal,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";

import { gradeSocialChallengeSubmission } from "@/app/actions/social-challenge";

type ChallengeSubmission = {
  id: string;
  answer: string;
  status: "PENDING" | "GRADED";
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
  learner: {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
    displayName: string | null;
    username: string | null;
  };
  graderName: string | null;
};

type Challenge = {
  id: string;
  title: string;
  opensAt: string;
  closesAt: string;
  maxScore: number;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  createdAt: string;
  participantCount: number;
  submissionCount: number;
  submissions: ChallengeSubmission[];
};

type Props = {
  challenges: Challenge[];
};

type View = "PENDING" | "GRADED" | "LEADERBOARD";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function learnerName(submission: ChallengeSubmission) {
  return (
    submission.learner.displayName ||
    submission.learner.name ||
    submission.learner.username ||
    "Learner"
  );
}

export default function AdminChallengeSubmissions({
  challenges,
}: Props) {
  const router = useRouter();

  const [view, setView] = useState<View>("PENDING");
  const [selectedChallengeId, setSelectedChallengeId] = useState(
    challenges[0]?.id ?? "",
  );
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedChallenge =
    challenges.find((challenge) => challenge.id === selectedChallengeId) ??
    null;

  const allSubmissions = useMemo(
    () =>
      challenges.flatMap((challenge) =>
        challenge.submissions.map((submission) => ({
          ...submission,
          challengeTitle: challenge.title,
          challengeId: challenge.id,
          maxScore: challenge.maxScore,
        })),
      ),
    [challenges],
  );

  const pendingSubmissions = allSubmissions.filter(
    (submission) => submission.status === "PENDING",
  );

  const gradedSubmissions = allSubmissions.filter(
    (submission) => submission.status === "GRADED",
  );

  const selectedSubmission = allSubmissions.find(
    (submission) => submission.id === selectedSubmissionId,
  );

    useEffect(() => {
    if (!selectedSubmission) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        setSelectedSubmissionId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedSubmission, isPending]);

  const totalParticipants = challenges.reduce(
    (total, challenge) => total + challenge.participantCount,
    0,
  );

  const totalSubmissions = allSubmissions.length;

  const leaderboard = useMemo(() => {
    if (!selectedChallenge) return [];

    const graded = selectedChallenge.submissions
      .filter(
        (
          submission,
        ): submission is ChallengeSubmission & { score: number } =>
          submission.status === "GRADED" &&
          submission.score !== null,
      )
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.submittedAt.localeCompare(b.submittedAt);
      });

    let previousScore: number | null = null;
    let previousRank = 0;

    return graded.map((submission, index) => {
      const rank =
        previousScore === submission.score
          ? previousRank
          : index + 1;

      previousScore = submission.score;
      previousRank = rank;

      return {
        ...submission,
        rank,
      };
    });
  }, [selectedChallenge]);

  function openGradingForm(submission: (typeof allSubmissions)[number]) {
    setSelectedSubmissionId(submission.id);
    setScore(
      submission.score !== null ? String(submission.score) : "",
    );
    setFeedback(submission.feedback ?? "");
    setError(null);
    setSuccess(null);
  }

  function handleGrade() {
    setError(null);
    setSuccess(null);

    if (!selectedSubmission) {
      setError("Select a submission to grade.");
      return;
    }

    if (score.trim() === "") {
      setError("Enter a score before saving.");
      return;
    }

    const numericScore = Number(score);

    if (
      !Number.isInteger(numericScore) ||
      numericScore < 0 ||
      numericScore > selectedSubmission.maxScore
    ) {
      setError(
        `Enter a whole-number score between 0 and ${selectedSubmission.maxScore}.`,
      );
      return;
    }

    startTransition(async () => {
      const result = await gradeSocialChallengeSubmission(
        selectedSubmission.id,
        numericScore,
        feedback,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess("Grade saved successfully.");
      setSelectedSubmissionId(null);
      setScore("");
      setFeedback("");
      router.refresh();
    });
  }

  const navigation: {
    id: View;
    label: string;
    count: number;
    icon: typeof Clock3;
  }[] = [
    {
      id: "PENDING",
      label: "Pending",
      count: pendingSubmissions.length,
      icon: Clock3,
    },
    {
      id: "GRADED",
      label: "Graded",
      count: gradedSubmissions.length,
      icon: CheckCircle2,
    },
    {
      id: "LEADERBOARD",
      label: "Leaderboard",
      count: 0,
      icon: Trophy,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page heading */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#52745D]">
          <Trophy className="h-4 w-4" />
          JUSTDY ADMINISTRATION
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#173B2F] sm:text-3xl">
          Challenge Submissions
        </h1>

        <p className="max-w-2xl text-sm leading-6 text-[#718078]">
          Review learner answers, award scores, provide feedback, and
          monitor mathematics challenge performance.
        </p>
      </div>

      {/* Summary cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={BookOpen}
          label="Published challenges"
          value={challenges.length}
        />
        <SummaryCard
          icon={Users}
          label="Total participants"
          value={totalParticipants}
        />
        <SummaryCard
          icon={Clock3}
          label="Pending submissions"
          value={pendingSubmissions.length}
        />
        <SummaryCard
          icon={Award}
          label="Graded submissions"
          value={gradedSubmissions.length}
        />
      </section>

      {/* Challenge selector */}
      <section className="rounded-2xl border border-[#E1E9E2] bg-white p-4 shadow-sm sm:p-5">
        <label
          htmlFor="challenge-selector"
          className="mb-2 block text-sm font-semibold text-[#244333]"
        >
          Select mathematics challenge
        </label>

        <select
          id="challenge-selector"
          value={selectedChallengeId}
          onChange={(event) => {
            setSelectedChallengeId(event.target.value);
            setSelectedSubmissionId(null);
            setError(null);
            setSuccess(null);
          }}
          className="w-full rounded-xl border border-[#DCE6DD] bg-white px-3 py-3 text-sm text-[#244333] outline-none transition focus:border-[#52745D] focus:ring-2 focus:ring-[#52745D]/15 sm:max-w-2xl"
        >
          {challenges.length === 0 && (
            <option value="">No challenges published yet</option>
          )}

          {challenges.map((challenge) => (
            <option key={challenge.id} value={challenge.id}>
              {challenge.title.slice(0, 100)}
            </option>
          ))}
        </select>

        {selectedChallenge && (
          <div className="mt-4 grid gap-3 border-t border-[#EDF1ED] pt-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[#849087]">Maximum score</p>
              <p className="mt-1 font-bold text-[#244333]">
                {selectedChallenge.maxScore} points
              </p>
            </div>
            <div>
              <p className="text-xs text-[#849087]">Participants</p>
              <p className="mt-1 font-bold text-[#244333]">
                {selectedChallenge.participantCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#849087]">Submission period</p>
              <p className="mt-1 text-sm font-semibold text-[#244333]">
                {formatDate(selectedChallenge.opensAt)}
              </p>
              <p className="text-xs text-[#849087]">
                Until {formatDate(selectedChallenge.closesAt)}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* View navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5EBE5] pb-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setView(item.id);
                setSelectedSubmissionId(null);
                setError(null);
                setSuccess(null);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-[#EAF2EA] text-[#315B3F]"
                  : "text-[#718078] hover:bg-[#F4F7F4] hover:text-[#315B3F]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {item.id !== "LEADERBOARD" && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    active
                      ? "bg-white text-[#315B3F]"
                      : "bg-[#F0F3F0] text-[#718078]"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Pending submissions */}
      {view === "PENDING" && (
        <SubmissionList
          submissions={pendingSubmissions}
          selectedSubmissionId={selectedSubmissionId}
          onSelect={openGradingForm}
          emptyTitle="No pending submissions"
          emptyDescription="New learner submissions awaiting grading will appear here."
          actionLabel="Grade answer"
        />
      )}

      {/* Graded submissions */}
      {view === "GRADED" && (
        <SubmissionList
          submissions={gradedSubmissions}
          selectedSubmissionId={selectedSubmissionId}
          onSelect={openGradingForm}
          emptyTitle="No graded submissions yet"
          emptyDescription="Submissions you have graded will appear here."
          actionLabel="Review / Edit grade"
        />
      )}

      {/* Leaderboard */}
      {view === "LEADERBOARD" && (
        <section className="overflow-hidden rounded-2xl border border-[#E1E9E2] bg-white shadow-sm">
          <div className="border-b border-[#E8EEE8] p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#52745D]" />
              <h2 className="font-bold text-[#244333]">
                Challenge leaderboard
              </h2>
            </div>
            <p className="mt-1 text-sm text-[#718078]">
              Only graded submissions are ranked. Equal scores receive
              the same position.
            </p>
          </div>

          {!selectedChallenge || leaderboard.length === 0 ? (
            <EmptyState
              title="Leaderboard not available yet"
              description="This challenge needs at least one graded submission before rankings can be displayed."
            />
          ) : (
            <div className="divide-y divide-[#EDF1ED]">
              {leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-4 sm:gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F5F0] font-bold text-[#315B3F]">
                    {entry.rank === 1 ? (
                      <Medal className="h-5 w-5" />
                    ) : (
                      entry.rank
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#244333]">
                      {learnerName(entry)}
                    </p>
                    <p className="truncate text-xs text-[#849087]">
                      {entry.learner.username
                        ? `@${entry.learner.username}`
                        : entry.learner.email}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold tabular-nums text-[#315B3F]">
                      {entry.score}/{selectedChallenge.maxScore}
                    </p>
                    <p className="text-xs text-[#849087]">
                      {Math.round(
                        (entry.score / selectedChallenge.maxScore) * 100,
                      )}
                      %
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    
      {/* Grading modal */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#10251B]/60 p-3 backdrop-blur-sm sm:p-6"
          role="presentation"
          onClick={(event) => {
            if (
              event.target === event.currentTarget &&
              !isPending
            ) {
              setSelectedSubmissionId(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="grading-modal-title"
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#E1E9E2] bg-white shadow-2xl"
          >
            {/* Modal header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#EDF1ED] bg-[#FAFCFA] p-4 sm:p-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#52745D]">
                  <Award className="h-4 w-4" />
                  Challenge grading
                </div>

                <h2
                  id="grading-modal-title"
                  className="mt-2 text-xl font-bold text-[#173B2F]"
                >
                  {learnerName(selectedSubmission)}
                </h2>

                <p className="mt-1 break-all text-sm text-[#849087]">
                  {selectedSubmission.learner.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubmissionId(null)}
                disabled={isPending}
                aria-label="Close grading window"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-[#718078] transition hover:bg-[#EAF2EA] hover:text-[#244333] disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* Scrollable modal content */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
              {/* Challenge information */}
              <div className="rounded-xl border border-[#E5EBE5] bg-[#F7F9F7] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#718078]">
                  Mathematics challenge
                </p>

                <p className="mt-1 break-words text-sm font-semibold leading-6 text-[#244333]">
                  {selectedSubmission.challengeTitle}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#849087]">
                  <span>
                    Submitted {formatDate(selectedSubmission.submittedAt)}
                  </span>

                  <span>
                    Maximum score: {selectedSubmission.maxScore} points
                  </span>
                </div>
              </div>

              {/* Learner answer */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#244333]">
                    Learner&apos;s answer
                  </h3>

                  <span className="text-xs text-[#849087]">
                    {selectedSubmission.answer.length.toLocaleString()} characters
                  </span>
                </div>

                <div className="max-h-[300px] overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-[#E1E9E2] bg-white p-4 text-sm leading-7 text-[#3D5145]">
                  {selectedSubmission.answer}
                </div>
              </div>

              {/* Score and feedback */}
              <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                <div>
                  <label
                    htmlFor="challenge-score"
                    className="mb-2 block text-sm font-semibold text-[#244333]"
                  >
                    Award score
                  </label>

                  <input
                    id="challenge-score"
                    type="number"
                    min={0}
                    max={selectedSubmission.maxScore}
                    step={1}
                    value={score}
                    onChange={(event) => setScore(event.target.value)}
                    disabled={isPending}
                    className="w-full rounded-xl border border-[#DCE6DD] px-3 py-3 text-sm outline-none transition focus:border-[#52745D] focus:ring-2 focus:ring-[#52745D]/15"
                  />

                  <p className="mt-2 text-xs text-[#849087]">
                    Maximum: {selectedSubmission.maxScore} points
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="challenge-feedback"
                    className="mb-2 block text-sm font-semibold text-[#244333]"
                  >
                    Feedback for learner
                  </label>

                  <textarea
                    id="challenge-feedback"
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    maxLength={5000}
                    rows={5}
                    disabled={isPending}
                    placeholder="Explain the score, highlight strengths, and suggest improvements..."
                    className="w-full resize-y rounded-xl border border-[#DCE6DD] px-3 py-3 text-sm leading-6 outline-none transition focus:border-[#52745D] focus:ring-2 focus:ring-[#52745D]/15"
                  />

                  <p className="mt-1 text-right text-xs text-[#849087]">
                    {feedback.length}/5,000
                  </p>
                </div>
              </div>

              {/* Validation error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-[#EDF1ED] bg-[#FAFCFA] p-4 sm:px-6">
              <button
                type="button"
                onClick={() => setSelectedSubmissionId(null)}
                disabled={isPending}
                className="rounded-xl border border-[#DCE6DD] px-5 py-2.5 text-sm font-semibold text-[#52665A] transition hover:bg-[#F0F5F0] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleGrade}
                disabled={isPending}
                className="rounded-xl bg-[#315B3F] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244333] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Saving grade..." : "Save grade"}
              </button>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#E1E9E2] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#718078]">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF2EA] text-[#315B3F]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-[#173B2F]">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function SubmissionList({
  submissions,
  selectedSubmissionId,
  onSelect,
  emptyTitle,
  emptyDescription,
  actionLabel,
}: {
  submissions: (ChallengeSubmission & {
    challengeTitle: string;
    challengeId: string;
    maxScore: number;
  })[];
  selectedSubmissionId: string | null;
  onSelect: (
    submission: (typeof submissions)[number],
  ) => void;
  emptyTitle: string;
  emptyDescription: string;
  actionLabel: string;
}) {
  if (submissions.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <section className="space-y-3">
      {submissions.map((submission) => (
        <article
          key={submission.id}
          className="rounded-2xl border border-[#E1E9E2] bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    submission.status === "GRADED"
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {submission.status === "GRADED" ? "Graded" : "Pending"}
                </span>
                <span className="text-xs text-[#849087]">
                  {formatDate(submission.submittedAt)}
                </span>
              </div>

              <h3 className="mt-3 font-bold text-[#244333]">
                {submission.challengeTitle}
              </h3>

              <p className="mt-1 text-sm font-semibold text-[#52665A]">
                {learnerName(submission)}
              </p>

              <p className="text-xs text-[#849087]">
                {submission.learner.username
                  ? `@${submission.learner.username} · `
                  : ""}
                {submission.learner.email}
              </p>

              <p className="mt-3 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#718078]">
                {submission.answer}
              </p>

              {submission.status === "GRADED" && (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-bold text-[#315B3F]">
                    Score: {submission.score}/{submission.maxScore}
                  </p>
                  {submission.feedback && (
                    <p className="line-clamp-2 text-[#718078]">
                      Feedback: {submission.feedback}
                    </p>
                  )}
                  {submission.graderName && (
                    <p className="text-xs text-[#849087]">
                      Graded by {submission.graderName}
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onSelect(submission)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                selectedSubmissionId === submission.id
                  ? "bg-[#EAF2EA] text-[#315B3F]"
                  : "bg-[#315B3F] text-white hover:bg-[#244333]"
              }`}
            >
              {selectedSubmissionId === submission.id
                ? "Selected"
                : actionLabel}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#DCE6DD] bg-white px-5 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF2EA] text-[#52745D]">
        <GraduationCap className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-bold text-[#244333]">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#849087]">
        {description}
      </p>
    </div>
  );
}
