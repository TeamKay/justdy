"use client";

import { useState } from "react";
import { grade8LinearEquationsLesson } from "@/lib/learning/grade-8/mathematics/linear-equations";
import { linearEquationsWorkedChecks } from "@/lib/learning/grade-8/mathematics/linear-equations-checks";
import Grade8WorkedExampleCheck from "./Grade8WorkedExampleCheck";

const lesson = grade8LinearEquationsLesson;

export default function Grade8LessonViewer() {
  const [activeSection, setActiveSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [showVocabulary, setShowVocabulary] = useState(false);

  const section = lesson.sections[activeSection];
  const progress = Math.round(
    (completedSections.length / lesson.sections.length) * 100,
  );

  function markComplete() {
    setCompletedSections((previous) =>
      previous.includes(section.id)
        ? previous
        : [...previous, section.id],
    );
  }

  function goToSection(index: number) {
    setActiveSection(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 p-6 text-white shadow-sm sm:p-9">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">
            Grade 8 Mathematics · Lesson 1
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            {lesson.title}
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-blue-100">
            {lesson.subtitle}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-blue-100">
            <span className="rounded-full border border-blue-300/30 bg-white/10 px-3 py-1.5">
              Approximately {lesson.estimatedMinutes} minutes
            </span>
            <span className="rounded-full border border-blue-300/30 bg-white/10 px-3 py-1.5">
              {lesson.sections.length} learning sections
            </span>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-gray-900">Lesson contents</h2>
            <span className="text-sm font-semibold text-blue-700">
              {progress}%
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-gray-500">
            {completedSections.length} of {lesson.sections.length} sections
            completed
          </p>

          <nav className="mt-5 space-y-2" aria-label="Lesson sections">
            {lesson.sections.map((item, index) => {
              const active = activeSection === index;
              const complete = completedSections.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToSection(index)}
                  aria-current={active ? "step" : undefined}
                  className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                    active
                      ? "bg-blue-50 text-blue-900 ring-1 ring-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      complete
                        ? "bg-green-100 text-green-800"
                        : active
                          ? "bg-blue-700 text-white"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {complete ? "✓" : index + 1}
                  </span>

                  <span className="min-w-0 text-sm font-medium leading-5">
                    {item.title.replace(/^\d+\.\s*/, "")}
                  </span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setShowVocabulary((previous) => !previous)}
            className="mt-5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            aria-expanded={showVocabulary}
          >
            {showVocabulary ? "Hide" : "Open"} mathematics vocabulary
          </button>

          {showVocabulary && (
            <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
              {lesson.vocabulary.map((item) => (
                <div key={item.term}>
                  <h3 className="text-sm font-bold text-gray-900">
                    {item.term}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    {item.definition}
                  </p>
                  <p className="mt-1 text-xs text-blue-700">
                    Example: {item.example}
                  </p>
                </div>
              ))}
            </div>
          )}
        </aside>

        <main className="min-w-0 space-y-6">
          {activeSection === 0 && (
            <>
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                  Before we begin
                </p>

                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {lesson.introduction.heading}
                </h2>

                <div className="mt-5 space-y-4 text-base leading-8 text-gray-700">
                  {lesson.introduction.paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-blue-50 p-5">
                  <p className="text-sm font-semibold text-blue-800">
                    Consider this equation:
                  </p>
                  <p className="mt-3 text-center text-3xl font-bold tracking-wide text-blue-950">
                    {lesson.introduction.example}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-blue-900">
                    {lesson.introduction.exampleExplanation}
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
                  A useful mental model
                </p>

                <h2 className="mt-2 text-xl font-bold text-indigo-950">
                  {lesson.balanceModel.heading}
                </h2>

                <p className="mt-3 leading-7 text-indigo-950">
                  {lesson.balanceModel.explanation}
                </p>

                <div className="my-5 rounded-xl bg-white p-5 text-center">
                  <p className="text-3xl font-bold tracking-wider text-indigo-950">
                    {lesson.balanceModel.equation}
                  </p>
                </div>

                <ol className="space-y-3">
                  {lesson.balanceModel.steps.map((step, index) => (
                    <li key={index} className="flex gap-3 text-sm leading-6 text-indigo-950">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-200 text-xs font-bold">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                <p className="mt-5 rounded-xl bg-white p-4 text-sm font-semibold leading-6 text-indigo-950">
                  {lesson.balanceModel.conclusion}
                </p>
              </section>
            </>
          )}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Learning section {activeSection + 1}
              </p>

              {completedSections.includes(section.id) && (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                  Completed ✓
                </span>
              )}
            </div>

            <h2 className="mt-3 text-2xl font-bold leading-tight text-gray-900">
              {section.title}
            </h2>

            <p className="mt-5 text-base leading-8 text-gray-700">
              {section.explanation}
            </p>

            <div className="mt-6 rounded-xl border-l-4 border-blue-600 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-900">
                Remember this
              </p>
              <p className="mt-2 leading-7 text-blue-950">
                {section.keyIdea}
              </p>
            </div>
          </section>

          {section.examples.map((example, index) => (
            <section
              key={`${section.id}-${index}`}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-900">
                  Worked example {index + 1}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                {example.problem}
              </h3>

              <ol className="mt-6 space-y-4">
                {example.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                      {stepIndex + 1}
                    </span>
                    <p className="pt-1 text-sm leading-7 text-gray-700">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-green-800">
                  Final answer
                </p>
                <p className="mt-2 text-2xl font-bold text-green-950">
                  {example.answer}
                </p>
              </div>

              {linearEquationsWorkedChecks[`${section.id}-${index}`] ? (
                <Grade8WorkedExampleCheck
                  check={linearEquationsWorkedChecks[`${section.id}-${index}`]}
                />
              ) : (
                <div className="mt-4 rounded-xl bg-gray-50 p-5">
                  <p className="text-sm font-bold text-gray-900">
                    Check your answer
                  </p>
                  <p className="mt-2 text-sm leading-7 text-gray-700">
                    {example.check}
                  </p>
                </div>
              )}
            </section>
          ))}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-lg font-bold text-gray-900">
              Have you understood this section?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Mark this section as complete when you understand the explanation
              and can follow the worked examples.
            </p>

            <button
              type="button"
              onClick={markComplete}
              disabled={completedSections.includes(section.id)}
              className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-default disabled:bg-green-700 sm:w-auto"
            >
              {completedSections.includes(section.id)
                ? "Section completed ✓"
                : "Mark section as complete"}
            </button>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={activeSection === 0}
              onClick={() => goToSection(activeSection - 1)}
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous section
            </button>

            <button
              type="button"
              disabled={activeSection === lesson.sections.length - 1}
              onClick={() => goToSection(activeSection + 1)}
              className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next section
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
