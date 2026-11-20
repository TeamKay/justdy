"use client";

import { useState } from "react";
import type { WorkedExampleCheck as WorkedExampleCheckType } from "@/lib/learning/grade-8/mathematics/linear-equations-checks";

type Props = {
  check: WorkedExampleCheckType;
};

export default function Grade8WorkedExampleCheck({ check }: Props) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [completed, setCompleted] = useState(false);

  const isCorrect = selectedAnswer === check.correctAnswer;

  function checkAnswer() {
    if (selectedAnswer === null) return;
    setFeedbackOpen(true);
  }

  function tryAgain() {
    setFeedbackOpen(false);
    setSelectedAnswer(null);
  }

  function continueLearning() {
    setFeedbackOpen(false);
    setCompleted(true);
  }

  return (
    <>
      <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-indigo-950">
            Check your understanding
          </p>

          {completed && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
              Completed ✓
            </span>
          )}
        </div>

        <p className="mt-3 text-sm font-medium leading-6 text-gray-800">
          {check.question}
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {check.options.map((option, index) => {
            const selected = selectedAnswer === index;

            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setSelectedAnswer(index);
                  setCompleted(false);
                }}
                disabled={completed}
                aria-pressed={selected}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                  selected
                    ? "border-blue-600 bg-blue-100 text-blue-950 ring-2 ring-blue-200"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                } disabled:cursor-default`}
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={checkAnswer}
            disabled={selectedAnswer === null || completed}
            className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Check my answer
          </button>

          {completed && (
            <button
              type="button"
              onClick={() => {
                setCompleted(false);
                setSelectedAnswer(null);
              }}
              className="rounded-xl border border-indigo-200 bg-white px-5 py-3 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
            >
              Try again
            </button>
          )}
        </div>
      </div>

      {feedbackOpen && (
        <div
          className="learning-feedback-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setFeedbackOpen(false);
            }
          }}
        >
          <div
            className="learning-feedback-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="worked-check-feedback-title"
          >
            <div
              className={`learning-feedback-icon ${
                isCorrect
                  ? "learning-feedback-icon-success"
                  : "learning-feedback-icon-retry"
              }`}
            >
              {isCorrect ? "✓" : "?"}
            </div>

            <h3
              id="worked-check-feedback-title"
              className="mt-4 text-xl font-bold text-gray-900"
            >
              {isCorrect ? "Excellent work!" : "Not quite. Keep trying!"}
            </h3>

            <p className="mt-3 text-sm leading-7 text-gray-600">
              {isCorrect
                ? "You selected the correct answer. You are building a strong understanding."
                : "Review the explanation below, then try the question again."}
            </p>

            {!isCorrect && (
              <div className="mt-4 rounded-xl bg-green-50 p-4 text-left">
                <p className="text-xs font-bold uppercase tracking-wide text-green-800">
                  Correct answer
                </p>
                <p className="mt-2 font-semibold text-green-950">
                  {check.options[check.correctAnswer]}
                </p>
              </div>
            )}

            <div className="mt-4 rounded-xl bg-blue-50 p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-800">
                Explanation
              </p>
              <p className="mt-2 text-sm leading-7 text-blue-950">
                {check.explanation}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {isCorrect ? (
                <button
                  type="button"
                  onClick={continueLearning}
                  className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                  Continue learning
                </button>
              ) : (
                <button
                  type="button"
                  onClick={tryAgain}
                  className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                  Try again
                </button>
              )}

              {!isCorrect && (
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(false)}
                  className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
