"use client";

import { useMemo, useState } from "react";
import { grade8LinearEquationsLesson } from "@/lib/learning/grade-8/mathematics/linear-equations";

type Grade8AssessmentProps = {
  onComplete?: (result: {
    score: number;
    total: number;
    percentage: number;
  }) => void;
};

export default function Grade8Assessment({
  onComplete,
}: Grade8AssessmentProps) {
  const questions = grade8LinearEquationsLesson.assessmentQuestions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const currentQuestion = questions[currentIndex];

  const score = useMemo(
    () =>
      questions.reduce(
        (total, question) =>
          total +
          (answers[question.id] === question.correctAnswer
            ? question.points
            : 0),
        0
      ),
    [answers, questions]
  );

  const totalPoints = useMemo(
    () => questions.reduce((total, question) => total + question.points, 0),
    [questions]
  );

  const percentage =
    totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  function selectAnswer(answerIndex: number) {
    if (submitted) return;

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: answerIndex,
    }));
  }

  function goToQuestion(index: number) {
    setCurrentIndex(Math.max(0, Math.min(index, questions.length - 1)));
  }

  function submitAssessment() {
    if (answeredCount !== questions.length || submitted) return;

    setSubmitted(true);

    onComplete?.({
      score,
      total: totalPoints,
      percentage,
    });
  }

  function restartAssessment() {
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
  }

  const performanceMessage =
    percentage >= 90
      ? "Excellent work! You have demonstrated a strong understanding of linear equations."
      : percentage >= 70
        ? "Good work! You understand many of the key ideas. Review the questions you missed."
        : percentage >= 50
          ? "You are making progress. Review the lesson and practise the skills that were challenging."
          : "Keep learning! Revisit the lesson and guided practice before trying the assessment again.";

  const performanceLabel =
    percentage >= 90
      ? "Excellent"
      : percentage >= 70
        ? "Good progress"
        : percentage >= 50
          ? "Developing"
          : "Keep practising";

  if (submitted) {
    return (
      <section className="space-y-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-3xl font-bold text-blue-700">
              {percentage}%
            </div>

            <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-blue-700">
              Assessment completed
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {performanceLabel}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl leading-7 text-gray-600">
              {performanceMessage}
            </p>

            <p className="mt-5 text-lg font-semibold text-gray-900">
              {score} out of {totalPoints} points
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {questions.length}
              </p>
              <p className="mt-1 text-sm text-gray-500">Questions</p>
            </div>

            <div className="rounded-2xl bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">
                {questions.filter(
                  (question) =>
                    answers[question.id] === question.correctAnswer
                ).length}
              </p>
              <p className="mt-1 text-sm text-green-700">Correct</p>
            </div>

            <div className="rounded-2xl bg-red-50 p-4 text-center">
              <p className="text-2xl font-bold text-red-700">
                {questions.filter(
                  (question) =>
                    answers[question.id] !== question.correctAnswer
                ).length}
              </p>
              <p className="mt-1 text-sm text-red-700">Incorrect</p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-5">
            <h3 className="text-xl font-bold text-gray-900">
              Review your answers
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Read the explanations carefully. They will help you understand
              any mistakes and strengthen your mathematical thinking.
            </p>
          </div>

          <div className="space-y-5">
            {questions.map((question, index) => {
              const selectedAnswer = answers[question.id];
              const isCorrect =
                selectedAnswer === question.correctAnswer;

              return (
                <article
                  key={question.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-500">
                      Question {index + 1}
                    </p>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  <h4 className="mt-4 font-semibold leading-7 text-gray-900">
                    {question.question}
                  </h4>

                  <div className="mt-4 space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = selectedAnswer === optionIndex;
                      const isAnswer =
                        question.correctAnswer === optionIndex;

                      return (
                        <div
                          key={optionIndex}
                          className={`rounded-xl border p-3 text-sm ${
                            isAnswer
                              ? "border-green-300 bg-green-50 text-green-900"
                              : isSelected
                                ? "border-red-300 bg-red-50 text-red-900"
                                : "border-gray-200 bg-white text-gray-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>
                              {String.fromCharCode(65 + optionIndex)}. {option}
                            </span>

                            {isAnswer && (
                              <span className="text-xs font-semibold text-green-700">
                                Correct answer
                              </span>
                            )}

                            {isSelected && !isAnswer && (
                              <span className="text-xs font-semibold text-red-700">
                                Your answer
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-xl bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-900">
                      Explanation
                    </p>
                    <p className="mt-2 text-sm leading-6 text-blue-900">
                      {question.explanation}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={restartAssessment}
            className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Try the assessment again
          </button>

          <button
            type="button"
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            Back to results
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Independent assessment
          </p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Test your understanding
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Answer each question independently. You can move between
            questions and change your answers before submitting.
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 px-4 py-3 text-right">
          <p className="text-xl font-bold text-blue-800">
            {currentIndex + 1}/{questions.length}
          </p>
          <p className="text-xs text-blue-700">Current question</p>
        </div>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {questions.map((question, index) => {
          const isAnswered = answers[question.id] !== undefined;
          const isCurrent = currentIndex === index;

          return (
            <button
              key={question.id}
              type="button"
              onClick={() => goToQuestion(index)}
              aria-label={`Go to question ${index + 1}${
                isAnswered ? ", answered" : ", unanswered"
              }`}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                isCurrent
                  ? "border-blue-700 bg-blue-700 text-white"
                  : isAnswered
                    ? "border-blue-200 bg-blue-50 text-blue-800"
                    : "border-gray-200 bg-white text-gray-500 hover:border-blue-300"
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-7 rounded-2xl bg-gray-50 p-5 sm:p-6">
        <p className="text-sm font-semibold text-gray-500">
          Question {currentIndex + 1}
        </p>

        <h3 className="mt-3 text-lg font-semibold leading-8 text-gray-900">
          {currentQuestion.question}
        </h3>

        <div className="mt-5 space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = answers[currentQuestion.id] === index;

            return (
              <button
                key={index}
                type="button"
                onClick={() => selectAnswer(index)}
                aria-pressed={isSelected}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    isSelected
                      ? "bg-blue-700 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </span>

                <span className="font-medium">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">
            {answeredCount} of {questions.length} answered
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {unansweredCount === 0
              ? "You have answered every question."
              : `${unansweredCount} ${
                  unansweredCount === 1 ? "question remains" : "questions remain"
                } unanswered.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => goToQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => goToQuestion(currentIndex + 1)}
              className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Next question
            </button>
          ) : (
            <button
              type="button"
              onClick={submitAssessment}
              disabled={unansweredCount > 0}
              className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit assessment
            </button>
          )}
        </div>
      </div>

      {currentIndex < questions.length - 1 && (
        <div className="mt-5 border-t border-gray-100 pt-5 text-right">
          <button
            type="button"
            onClick={submitAssessment}
            disabled={unansweredCount > 0}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit assessment
          </button>
        </div>
      )}
    </section>
  );
}
