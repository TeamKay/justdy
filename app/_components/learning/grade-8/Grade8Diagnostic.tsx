"use client";

import { useMemo, useState } from "react";
import { grade8LinearEquationsLesson } from "@/lib/learning/grade-8/mathematics/linear-equations";

const questions = grade8LinearEquationsLesson.diagnosticQuestions;

type AnswerRecord = {
  selected: number;
  correct: boolean;
};

type Grade8DiagnosticProps = {
  onComplete?: (result: {
    score: number;
    total: number;
    percentage: number;
    strengths: string[];
    areasToImprove: string[];
  }) => void;
};

export default function Grade8Diagnostic({
  onComplete,
}: Grade8DiagnosticProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [checked, setChecked] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id];
  const isCorrect = currentAnswer?.correct ?? false;

  const score = useMemo(
    () => Object.values(answers).filter((answer) => answer.correct).length,
    [answers],
  );

  const result = useMemo(() => {
    const strengths = questions
      .filter((question) => answers[question.id]?.correct)
      .map((question) => question.skill);

    const areasToImprove = questions
      .filter((question) => !answers[question.id]?.correct)
      .map((question) => question.skill);

    return {
      score,
      total: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      strengths,
      areasToImprove,
    };
  }, [answers, score]);

  function checkAnswer() {
    if (selectedAnswer === null || checked) return;

    const correct = selectedAnswer === currentQuestion.correctAnswer;

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: {
        selected: selectedAnswer,
        correct,
      },
    }));

    setChecked(true);
    setFeedbackOpen(true);
  }

  function goToNextQuestion() {
    setFeedbackOpen(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((previous) => previous + 1);
      setSelectedAnswer(null);
      setChecked(false);
      return;
    }

    setCompleted(true);

    const finalAnswers = {
      ...answers,
      [currentQuestion.id]: {
        selected: selectedAnswer ?? -1,
        correct: selectedAnswer === currentQuestion.correctAnswer,
      },
    };

    const finalScore = Object.values(finalAnswers).filter(
      (answer) => answer.correct,
    ).length;

    const finalStrengths = questions
      .filter((question) => finalAnswers[question.id]?.correct)
      .map((question) => question.skill);

    const finalAreasToImprove = questions
      .filter((question) => !finalAnswers[question.id]?.correct)
      .map((question) => question.skill);

    onComplete?.({
      score: finalScore,
      total: questions.length,
      percentage: Math.round((finalScore / questions.length) * 100),
      strengths: finalStrengths,
      areasToImprove: finalAreasToImprove,
    });
  }

  function restartDiagnostic() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    setChecked(false);
    setFeedbackOpen(false);
    setCompleted(false);
  }

  if (completed) {
    const passed = result.percentage >= 80;

    return (
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
            {passed ? "🎉" : "📚"}
          </div>

          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Diagnostic completed
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {passed ? "Great start!" : "Let's strengthen your foundation"}
          </h2>

          <p className="mt-2 text-gray-600">
            {passed
              ? "You demonstrated a good understanding of the prerequisite skills for linear equations."
              : "Your results help us identify which skills to practise before moving forward."}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-6 text-center">
          <p className="text-sm font-medium text-gray-600">Your score</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">
            {result.score}/{result.total}
          </p>
          <p className="mt-1 text-lg font-semibold text-blue-700">
            {result.percentage}%
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <h3 className="font-semibold text-green-900">
              Skills demonstrated
            </h3>

            {result.strengths.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-green-900">
                {result.strengths.map((skill) => (
                  <li key={skill}>✓ {skill}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-green-900">
                You have an opportunity to develop all the skills in this
                diagnostic.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-semibold text-amber-900">
              Skills to practise
            </h3>

            {result.areasToImprove.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-amber-900">
                {result.areasToImprove.map((skill) => (
                  <li key={skill}>• {skill}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-amber-900">
                Excellent! You answered every question correctly.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-900">
            Your next step
          </h3>
          <p className="mt-2 text-sm leading-6 text-blue-900">
            {result.percentage >= 80
              ? "You are ready to begin the linear equations lesson. Continue to the lesson and work through the examples."
              : "Do not worry about your score. Review the skills listed under 'Skills to practise', then work through the lesson carefully. You can repeat this diagnostic whenever you are ready."}
          </p>
        </div>

        <button
          type="button"
          onClick={restartDiagnostic}
          className="mt-6 w-full rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          Try the diagnostic again
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
          <h2 className="mt-1 text-xl font-bold text-gray-900">
            Let&apos;s check your foundations
          </h2>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800">
          {currentIndex + 1} of {questions.length}
        </span>
      </div>

      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-label="Diagnostic progress"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={currentIndex + 1}
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="mt-8">
        <p className="text-sm font-medium text-gray-500">
          Skill: {currentQuestion.skill}
        </p>

        <h3 className="mt-3 text-xl font-semibold leading-relaxed text-gray-900">
          {currentQuestion.question}
        </h3>
      </div>

      <div className="mt-6 space-y-3">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isAnswer = currentQuestion.correctAnswer === index;

          let optionStyle =
            "border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50";

          if (isSelected && !checked) {
            optionStyle = "border-blue-600 bg-blue-50 ring-2 ring-blue-100";
          }

          if (checked && isAnswer) {
            optionStyle = "border-green-500 bg-green-50 text-green-900";
          } else if (checked && isSelected && !isAnswer) {
            optionStyle = "border-red-400 bg-red-50 text-red-900";
          }

          return (
            <button
              key={option}
              type="button"
              disabled={checked}
              onClick={() => setSelectedAnswer(index)}
              aria-pressed={isSelected}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${optionStyle} ${
                checked ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-sm font-semibold">
                {String.fromCharCode(65 + index)}
              </span>

              <span className="flex-1 font-medium">{option}</span>

              {checked && isAnswer && (
                <span className="font-semibold text-green-700">
                  Correct
                </span>
              )}

              {checked && isSelected && !isAnswer && (
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
            aria-labelledby="diagnostic-feedback-title"
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
              {isCorrect ? "Correct answer" : "Let's keep learning"}
            </p>

            <h3
              id="diagnostic-feedback-title"
              className="mt-2 text-2xl font-bold text-gray-900"
            >
              {isCorrect ? "Well done!" : "Not quite. You can do this!"}
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
              <p className="font-semibold text-gray-900">Explanation</p>
              <p className="mt-2 text-sm leading-7 text-gray-700">
                {currentQuestion.explanation}
              </p>
            </div>

            <button
              type="button"
              onClick={goToNextQuestion}
              className="mt-6 w-full rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              {currentIndex === questions.length - 1
                ? "View my results"
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
          {checked
            ? `${score} correct so far`
            : "Choose the answer you think is correct."}
        </p>

        {!checked ? (
          <button
            type="button"
            disabled={selectedAnswer === null}
            onClick={checkAnswer}
            className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Check answer
          </button>
        ) : (
          <button
            type="button"
            onClick={goToNextQuestion}
            className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            {currentIndex === questions.length - 1
              ? "View my results"
              : "Next question"}
          </button>
        )}
      </div>
    </section>
  );
}
