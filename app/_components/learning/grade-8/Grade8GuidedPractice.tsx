"use client";

import { useMemo, useState } from "react";
import { grade8LinearEquationsLesson } from "@/lib/learning/grade-8/mathematics/linear-equations";

const questions = grade8LinearEquationsLesson.guidedPractice;

export default function Grade8GuidedPractice() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [checked, setChecked] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
      const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [retryMode, setRetryMode] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  const score = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers],
  );

  const incorrectQuestions = useMemo(
    () => questions.filter((question) => answers[question.id] === false),
    [answers],
  );

  function checkAnswer() {
    if (selectedAnswer === null || checked) return;

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: isCorrect,
    }));

    setChecked(true);
    setFeedbackOpen(true);
  }

  function moveNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((previous) => previous + 1);
      setSelectedAnswer(null);
      setShowHint(false);
      setChecked(false);
      setFeedbackOpen(false);
      return;
    }

    if (incorrectQuestions.length > 0) {
      setRetryMode(true);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowHint(false);
      setChecked(false);
      setFeedbackOpen(false);
      return;
    }

    setRetryMode(false);
  }

  function restartPractice() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowHint(false);
    setChecked(false);
    setFeedbackOpen(false);
    setAnswers({});
    setRetryMode(false);
  }

  if (!retryMode && Object.keys(answers).length === questions.length &&
      incorrectQuestions.length === 0) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-green-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
            🎉
          </div>

          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-green-700">
            Guided practice completed
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Excellent work!
          </h2>

          <p className="mt-3 leading-7 text-gray-600">
            You have answered all the guided practice questions correctly.
            Keep using the same step-by-step approach when solving equations.
          </p>
        </div>

        <div className="mt-7 rounded-xl bg-green-50 p-6 text-center">
          <p className="text-sm font-medium text-green-800">
            Your practice score
          </p>
          <p className="mt-1 text-4xl font-bold text-green-950">
            {score}/{questions.length}
          </p>
        </div>

        <button
          type="button"
          onClick={restartPractice}
          className="mt-6 w-full rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          Practise again
        </button>
      </section>
    );
  }

  if (retryMode) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Practice review
        </p>

        <h2 className="mt-3 text-2xl font-bold text-gray-900">
          Let's strengthen your understanding
        </h2>

        <p className="mt-3 leading-7 text-gray-600">
          You have completed the practice questions. Review the questions you
          found difficult and try them again.
        </p>

        <div className="mt-6 space-y-3">
          {incorrectQuestions.map((question) => (
            <div
              key={question.id}
              className="rounded-xl border border-amber-200 bg-amber-50 p-4"
            >
              <p className="font-semibold text-gray-900">
                {question.question}
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Correct answer: {question.options[question.correctAnswer]}
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {question.explanation}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setRetryMode(false);
            setCurrentIndex(
              questions.findIndex((question) => answers[question.id] === false),
            );
            setSelectedAnswer(null);
            setShowHint(false);
            setChecked(false);
            setFeedbackOpen(false);
          }}
          className="mt-6 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
        >
          Try the questions again
        </button>

        <button
          type="button"
          onClick={restartPractice}
          className="mt-3 w-full rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Restart all practice questions
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Grade 8 Mathematics
          </p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            Guided practice
          </h2>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="mt-8 rounded-xl bg-gray-50 p-5 sm:p-6">
        <p className="text-sm font-medium text-gray-500">
          Take your time. You can ask for a hint before choosing your answer.
        </p>

        <h3 className="mt-4 text-xl font-bold leading-relaxed text-gray-900">
          {currentQuestion.question}
        </h3>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => setShowHint((previous) => !previous)}
          aria-expanded={showHint}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
        >
          <span aria-hidden="true">💡</span>
          {showHint ? "Hide hint" : "I need a hint"}
        </button>

        {showHint && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Hint</p>
            <p className="mt-2 text-sm leading-6 text-amber-950">
              {currentQuestion.hint}
            </p>
          </div>
        )}
      </div>

      <div className="mt-7 space-y-3">
        {currentQuestion.options.map((option, index) => {
          const selected = selectedAnswer === index;
          const correctOption = index === currentQuestion.correctAnswer;

          let style =
            "border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50";

          if (selected && !checked) {
            style = "border-blue-600 bg-blue-50 ring-2 ring-blue-100";
          }

          if (checked && correctOption) {
            style = "border-green-500 bg-green-50 text-green-900";
          } else if (checked && selected && !correctOption) {
            style = "border-red-400 bg-red-50 text-red-900";
          }

          return (
            <button
              key={option}
              type="button"
              disabled={checked}
              onClick={() => setSelectedAnswer(index)}
              aria-pressed={selected}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${style}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-sm font-semibold">
                {String.fromCharCode(65 + index)}
              </span>

              <span className="flex-1 font-medium">{option}</span>

              {checked && correctOption && (
                <span className="font-semibold text-green-700">
                  Correct
                </span>
              )}

              {checked && selected && !correctOption && (
                <span className="font-semibold text-red-700">
                  Incorrect
                </span>
              )}
            </button>
          );
        })}
      </div>

      {checked && feedbackOpen && (
        <div
          className="learning-feedback-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4"
          onClick={() => setFeedbackOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="practice-feedback-title"
            className="learning-feedback-dialog relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFeedbackOpen(false)}
              aria-label="Close feedback"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              ×
            </button>

            <div className={`learning-feedback-icon flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
              isCorrect
                ? "learning-feedback-correct bg-green-100 text-green-700"
                : "learning-feedback-try-again bg-amber-100 text-amber-700"
            }`}>
              {isCorrect ? "✓" : "!"}
            </div>

            <p className={`mt-5 text-sm font-bold uppercase tracking-wide ${
              isCorrect ? "text-green-700" : "text-amber-700"
            }`}>
              {isCorrect ? "Correct answer" : "Not quite"}
            </p>

            <h3
              id="practice-feedback-title"
              className="mt-2 text-2xl font-bold text-gray-900"
            >
              {isCorrect ? "Well done!" : "Let's learn from this."}
            </h3>

            {!isCorrect && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  Correct answer
                </p>
                <p className="mt-1 text-lg font-bold text-green-950">
                  {currentQuestion.options[currentQuestion.correctAnswer]}
                </p>
              </div>
            )}

            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                Explanation
              </p>
              <p className="mt-2 text-sm leading-7 text-gray-700">
                {currentQuestion.explanation}
              </p>
            </div>

            <button
              type="button"
              onClick={moveNext}
              className="mt-6 w-full rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              {currentIndex === questions.length - 1
                ? "Review my practice"
                : "Continue"}
            </button>

            <button
              type="button"
              onClick={() => setFeedbackOpen(false)}
              className="mt-2 w-full rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          {score} of {questions.length} questions answered correctly
        </p>

        {!checked ? (
          <button
            type="button"
            onClick={checkAnswer}
            disabled={selectedAnswer === null}
            className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Check my answer
          </button>
        ) : (
          <button
            type="button"
            onClick={moveNext}
            className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            {currentIndex === questions.length - 1
              ? "Review my practice"
              : "Next question"}
          </button>
        )}
      </div>
    </section>
  );
}
