"use client";

import { useState } from "react";

import Grade8Diagnostic from "./Grade8Diagnostic";
import Grade8LessonViewer from "./Grade8LessonViewer";
import Grade8GuidedPractice from "./Grade8GuidedPractice";
import Grade8Assessment from "./Grade8Assessment";

type LearningStage = "diagnostic" | "lesson" | "practice" | "assessment";

type DiagnosticResult = {
  score: number;
  total: number;
  percentage: number;
  strengths: string[];
  areasToImprove: string[];
};

const stages: {
  id: LearningStage;
  number: string;
  title: string;
  description: string;
}[] = [
  {
    id: "diagnostic",
    number: "01",
    title: "Diagnostic",
    description: "Discover what you already know",
  },
  {
    id: "lesson",
    number: "02",
    title: "Learn",
    description: "Understand the concepts",
  },
  {
    id: "practice",
    number: "03",
    title: "Guided practice",
    description: "Build confidence step by step",
  },
  {
    id: "assessment",
    number: "04",
    title: "Assessment",
    description: "Test your understanding",
  },
];

export default function Grade8LinearEquationsExperience() {
  const [activeStage, setActiveStage] =
    useState<LearningStage>("diagnostic");

  const [diagnosticResult, setDiagnosticResult] =
    useState<DiagnosticResult | null>(null);

  const [assessmentCompleted, setAssessmentCompleted] = useState(false);

  function handleDiagnosticComplete(result: DiagnosticResult) {
    setDiagnosticResult(result);
    setActiveStage("lesson");
  }

  function handleAssessmentComplete() {
    setAssessmentCompleted(true);
  }

  return (
    <div className="mt-8 space-y-7">
      <section className="rounded-3xl border border-[#E4EBE2] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#47834B]">
              Your learning journey
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#263D2D]">
              Learn at your own pace
            </h2>
          </div>

          <p className="text-sm text-[#718078]">
            Four stages · One step at a time
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stages.map((stage) => {
            const isActive = activeStage === stage.id;
            const isCompleted =
              (stage.id === "diagnostic" && diagnosticResult !== null) ||
              (stage.id === "assessment" && assessmentCompleted);

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStage(stage.id)}
                aria-current={isActive ? "step" : undefined}
                className={`rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? "border-[#47834B] bg-[#F0F7EE] ring-1 ring-[#47834B]"
                    : "border-[#E4EBE2] bg-white hover:border-[#A8C8A2] hover:bg-[#F8FBF7]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                      isActive
                        ? "bg-[#47834B] text-white"
                        : isCompleted
                          ? "bg-green-100 text-green-800"
                          : "bg-[#F0F3EF] text-[#718078]"
                    }`}
                  >
                    {isCompleted ? "✓" : stage.number}
                  </span>

                  {isActive && (
                    <span className="text-xs font-bold text-[#47834B]">
                      CURRENT
                    </span>
                  )}

                  {isCompleted && !isActive && (
                    <span className="text-xs font-semibold text-green-700">
                      COMPLETED
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-sm font-bold text-[#263D2D]">
                  {stage.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#718078]">
                  {stage.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {diagnosticResult && (
        <section className="rounded-2xl border border-[#DCE9D8] bg-[#F4F9F1] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#47834B]">
                Your diagnostic results
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#263D2D]">
                {diagnosticResult.percentage >= 80
                  ? "You have a strong starting foundation!"
                  : "Let's strengthen your foundation."}
              </h3>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-[#47834B]">
                {diagnosticResult.percentage}%
              </p>
              <p className="text-xs text-[#718078]">
                {diagnosticResult.score}/{diagnosticResult.total} correct
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-4">
              <h4 className="text-sm font-bold text-green-800">
                Skills you demonstrated
              </h4>

              {diagnosticResult.strengths.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {diagnosticResult.strengths.map((skill, index) => (
                    <li
                      key={`${skill}-${index}`}
                      className="flex gap-2 text-sm leading-5 text-[#526B54]"
                    >
                      <span className="text-green-700">✓</span>
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[#718078]">
                  These skills will become stronger as you work through the
                  lesson and practice activities.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-white p-4">
              <h4 className="text-sm font-bold text-amber-800">
                Skills to strengthen
              </h4>

              {diagnosticResult.areasToImprove.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {diagnosticResult.areasToImprove.map((skill, index) => (
                    <li
                      key={`${skill}-${index}`}
                      className="flex gap-2 text-sm leading-5 text-[#526B54]"
                    >
                      <span className="text-amber-700">•</span>
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[#718078]">
                  Excellent! You answered all diagnostic questions correctly.
                </p>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-[#718078]">
            Your diagnostic score helps identify areas to focus on. It does not
            limit your access to any part of this lesson.
          </p>
        </section>
      )}

      <section>
        <div className={activeStage === "diagnostic" ? "block" : "hidden"}>
          <Grade8Diagnostic onComplete={handleDiagnosticComplete} />
        </div>

        <div className={activeStage === "lesson" ? "block" : "hidden"}>
          <Grade8LessonViewer />
        </div>

        <div className={activeStage === "practice" ? "block" : "hidden"}>
          <Grade8GuidedPractice />
        </div>

        <div className={activeStage === "assessment" ? "block" : "hidden"}>
          <Grade8Assessment onComplete={handleAssessmentComplete} />
        </div>
      </section>

      <nav
        aria-label="Learning stage navigation"
        className="flex flex-col-reverse gap-3 border-t border-[#E4EBE2] pt-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <button
          type="button"
          onClick={() => {
            const currentIndex = stages.findIndex(
              (stage) => stage.id === activeStage
            );

            if (currentIndex > 0) {
              setActiveStage(stages[currentIndex - 1].id);
            }
          }}
          disabled={activeStage === "diagnostic"}
          className="rounded-xl border border-[#DDE6DA] bg-white px-5 py-3 text-sm font-bold text-[#526B54] transition hover:bg-[#F0F7EE] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous stage
        </button>

        <button
          type="button"
          onClick={() => {
            const currentIndex = stages.findIndex(
              (stage) => stage.id === activeStage
            );

            if (currentIndex < stages.length - 1) {
              setActiveStage(stages[currentIndex + 1].id);
            }
          }}
          disabled={activeStage === "assessment"}
          className="rounded-xl bg-[#176B59] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#125747] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue to next stage
        </button>
      </nav>
    </div>
  );
}
