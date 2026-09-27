"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Loader2,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface QuizQuestion {
  id: string;
  type?: string;
  question?: string;
  options?: string[];
  points?: number;
}

interface QuizContent {
  title: string;
  description?: string;
  instructions?: string;
  questions: QuizQuestion[];
}

interface QuizResult {
  questionId: string;
  correct: boolean;
  awardedPoints: number;
  points: number;
  explanation: string | null;
}

interface QuizSubmissionResult {
  activityId: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  results: QuizResult[];
}

interface QuizLearnerProps {
  resourceId: string;
  slug: string;
  quiz: QuizContent;
}

function getQuestionType(
  question: QuizQuestion,
) {
  return (
    question.type
      ?.trim()
      .toLowerCase() || "multiple choice"
  );
}

function isChoiceQuestion(
  question: QuizQuestion,
) {
  const type = getQuestionType(question);

  return (
    type.includes("multiple") ||
    type.includes("choice") ||
    type.includes("true") ||
    type.includes("false")
  );
}

export default function QuizLearner({
  resourceId,
  slug,
  quiz,
}: QuizLearnerProps) {
  const [answers, setAnswers] = useState<
    Record<string, string>
  >({});

  const [activityId, setActivityId] =
    useState<string | null>(null);

  const [isStarting, setIsStarting] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [result, setResult] =
    useState<QuizSubmissionResult | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const questions = quiz.questions ?? [];

  const answeredCount = useMemo(
    () =>
      questions.filter(
        (question) =>
          typeof answers[question.id] ===
            "string" &&
          answers[question.id].trim() !== "",
      ).length,
    [answers, questions],
  );

  const current =
    questions[currentQuestion] ?? null;

  useEffect(() => {
    let cancelled = false;

    async function startAttempt() {
      try {
        const response = await fetch(
          `/api/resources/${encodeURIComponent(
            resourceId,
          )}/quiz/submit`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action: "start",
            }),
          },
        );

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (response.ok && data.activityId) {
          setActivityId(data.activityId);
        }
      } catch {
        /*
         * Starting an activity is useful for tracking,
         * but it should not prevent a learner from
         * taking the quiz.
         */
      } finally {
        if (!cancelled) {
          setIsStarting(false);
        }
      }
    }

    void startAttempt();

    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  function setAnswer(
    questionId: string,
    value: string,
  ) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));
  }

  async function submitQuiz() {
    if (questions.length === 0) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/resources/${encodeURIComponent(
          resourceId,
        )}/quiz/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "submit",
            activityId,
            answers,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to submit the quiz.",
        );
      }

      setResult({
        activityId: data.activityId,
        score: data.score,
        maxScore: data.maxScore,
        percentage: data.percentage,
        correctCount: data.correctCount,
        totalQuestions:
          data.totalQuestions,
        results: data.results ?? [],
      });

      setActivityId(data.activityId);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit the quiz.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function restartQuiz() {
    setAnswers({});
    setResult(null);
    setError(null);
    setCurrentQuestion(0);
    setActivityId(null);
    setIsStarting(true);

    void (async () => {
      try {
        const response = await fetch(
          `/api/resources/${encodeURIComponent(
            resourceId,
          )}/quiz/submit`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action: "start",
            }),
          },
        );

        const data = await response.json();

        if (
          response.ok &&
          data.activityId
        ) {
          setActivityId(
            data.activityId,
          );
        }
      } catch {
        // The quiz can still be taken.
      } finally {
        setIsStarting(false);
      }
    })();
  }

  if (result) {
    return (
      <main className="min-h-screen bg-muted/30 px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="overflow-hidden rounded-3xl border bg-background shadow-sm">
            <div className="border-b px-6 py-8 text-center sm:px-10">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="size-8 text-primary" />
              </div>

              <p className="text-sm font-medium text-muted-foreground">
                Quiz completed
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {quiz.title}
              </h1>

              <div className="mt-6 text-6xl font-bold tracking-tight">
                {result.percentage}%
              </div>

              <p className="mt-2 text-muted-foreground">
                {result.correctCount} of{" "}
                {result.totalQuestions}{" "}
                questions correct
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {result.score} /{" "}
                {result.maxScore} points
              </p>
            </div>

            <div className="grid gap-4 border-b p-6 sm:grid-cols-3">
              <div className="rounded-2xl border p-5 text-center">
                <div className="text-2xl font-bold">
                  {result.correctCount}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Correct
                </div>
              </div>

              <div className="rounded-2xl border p-5 text-center">
                <div className="text-2xl font-bold">
                  {result.totalQuestions -
                    result.correctCount}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Incorrect
                </div>
              </div>

              <div className="rounded-2xl border p-5 text-center">
                <div className="text-2xl font-bold">
                  {result.percentage}%
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Score
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6 sm:p-8">
              <h2 className="text-lg font-semibold">
                Review your answers
              </h2>

              {questions.map(
                (question, index) => {
                  const questionResult =
                    result.results.find(
                      (item) =>
                        item.questionId ===
                        question.id,
                    );

                  const correct =
                    questionResult?.correct ??
                    false;

                  return (
                    <article
                      key={question.id}
                      className="rounded-2xl border p-5"
                    >
                      <div className="flex gap-4">
                        <div className="shrink-0 pt-0.5">
                          {correct ? (
                            <CheckCircle2 className="size-5 text-green-600" />
                          ) : (
                            <XCircle className="size-5 text-destructive" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-medium">
                              {index + 1}.{" "}
                              {question.question}
                            </h3>

                            <span className="shrink-0 text-sm text-muted-foreground">
                              {questionResult?.awardedPoints ??
                                0}{" "}
                              /{" "}
                              {questionResult?.points ??
                                question.points ??
                                1}
                            </span>
                          </div>

                          {!correct &&
                            answers[
                              question.id
                            ] && (
                              <p className="mt-3 text-sm">
                                <span className="font-medium">
                                  Your answer:
                                </span>{" "}
                                {
                                  answers[
                                    question.id
                                  ]
                                }
                              </p>
                            )}

                          {questionResult?.explanation && (
                            <div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm">
                              <p className="font-medium">
                                Explanation
                              </p>

                              <p className="mt-1 text-muted-foreground">
                                {
                                  questionResult.explanation
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>

            <div className="flex flex-col gap-3 border-t p-6 sm:flex-row sm:justify-between">
              <Link
                href={`/resources/${encodeURIComponent(
                  slug,
                )}`}
                className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium transition hover:bg-muted"
              >
                Back to resource
              </Link>

              <button
                type="button"
                onClick={restartQuiz}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                <RotateCcw className="size-4" />
                Try Again
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <section className="overflow-hidden rounded-3xl border bg-background shadow-sm">
          <header className="border-b px-6 py-7 sm:px-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">
                  Quiz
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {quiz.title}
                </h1>

                {quiz.description && (
                  <p className="mt-3 max-w-2xl text-muted-foreground">
                    {quiz.description}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm">
                <div className="font-medium">
                  {answeredCount} /{" "}
                  {questions.length}
                </div>
                <div className="text-muted-foreground">
                  answered
                </div>
              </div>
            </div>

            {quiz.instructions && (
              <div className="mt-6 rounded-2xl bg-muted/50 p-4 text-sm">
                <p className="font-medium">
                  Instructions
                </p>

                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {quiz.instructions}
                </p>
              </div>
            )}
          </header>

          <div className="border-b px-6 py-4 sm:px-10">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Question{" "}
                {Math.min(
                  currentQuestion + 1,
                  questions.length,
                )}{" "}
                of {questions.length}
              </span>

              <span className="text-muted-foreground">
                {answeredCount} answered
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${
                    questions.length
                      ? ((currentQuestion + 1) /
                          questions.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {isStarting && (
              <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Preparing your quiz...
              </div>
            )}

            {error && (
              <div className="mb-6 flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />

                <div>
                  <p className="font-medium">
                    Unable to submit
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {current && (
              <div className="space-y-7">
                <div>
                  <div className="flex items-start gap-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                      {currentQuestion + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold leading-relaxed">
                        {current.question}
                      </h2>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {current.points ??
                          1}{" "}
                        point
                        {(current.points ??
                          1) !== 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {isChoiceQuestion(
                  current,
                ) ? (
                  <div className="space-y-3">
                    {(
                      current.options ??
                      []
                    ).map((option, index) => {
                      const selected =
                        answers[
                          current.id
                        ] === option;

                      return (
                        <button
                          key={`${current.id}-${index}`}
                          type="button"
                          onClick={() =>
                            setAnswer(
                              current.id,
                              option,
                            )
                          }
                          className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "bg-background"
                            }`}
                          >
                            {String.fromCharCode(
                              65 + index,
                            )}
                          </span>

                          <span className="font-medium">
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    value={
                      answers[current.id] ??
                      ""
                    }
                    onChange={(event) =>
                      setAnswer(
                        current.id,
                        event.target.value,
                      )
                    }
                    placeholder="Type your answer..."
                    rows={5}
                    className="w-full rounded-2xl border bg-background p-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                )}

                <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    disabled={
                      currentQuestion === 0
                    }
                    onClick={() =>
                      setCurrentQuestion(
                        (value) =>
                          Math.max(
                            0,
                            value - 1,
                          ),
                      )
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </button>

                  {currentQuestion <
                  questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentQuestion(
                          (value) =>
                            Math.min(
                              questions.length -
                                1,
                              value + 1,
                            ),
                        )
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={submitQuiz}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Quiz
                          <CheckCircle2 className="size-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {questions.length > 1 && (
            <div className="border-t bg-muted/20 px-6 py-5 sm:px-10">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Questions
              </p>

              <div className="flex flex-wrap gap-2">
                {questions.map(
                  (question, index) => {
                    const answered =
                      Boolean(
                        answers[
                          question.id
                        ]?.trim(),
                      );

                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() =>
                          setCurrentQuestion(
                            index,
                          )
                        }
                        className={`flex size-9 items-center justify-center rounded-lg border text-xs font-medium transition ${
                          index ===
                          currentQuestion
                            ? "border-primary bg-primary text-primary-foreground"
                            : answered
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "bg-background hover:bg-muted"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}