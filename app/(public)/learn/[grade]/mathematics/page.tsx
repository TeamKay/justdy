import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Target,
} from "lucide-react";

import {
  getGradeNumber,
  getLearningGrade,
  getLearningTopics,
  getLearningUnits,
  isLearningSubjectAvailable,
} from "@/lib/learning/learning-catalog";
import MarketingNavbar from "@/app/_components/Navbar";

interface MathematicsPageProps {
  params: Promise<{ grade: string }>;
}

export const metadata = {
  title: "Mathematics Curriculum | Justdy",
  description:
    "Explore structured, grade-level mathematics learning pathways on Justdy.",
};

export default async function MathematicsLearningPage({
  params,
}: MathematicsPageProps) {
  const { grade: gradeSlug } = await params;
  const grade = getLearningGrade(gradeSlug);

  if (!grade) notFound();

  const gradeNumber = getGradeNumber(grade);

  if (
    gradeNumber === null ||
    !isLearningSubjectAvailable(gradeNumber, "mathematics")
  ) {
    notFound();
  }

  const units = getLearningUnits(gradeNumber, "mathematics");
  const topics = getLearningTopics(gradeNumber, "mathematics");

  return (
    <main className="min-h-screen bg-[#F7F9F6] text-[#26352D]">
      <MarketingNavbar />

      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <Link
          href={`/learn/${grade.slug}`}
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#718078] transition hover:text-[#147D72]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {grade.label}
        </Link>

        <section className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-[#153F35] to-[#176B59] px-6 py-9 text-white shadow-sm sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 right-32 h-64 w-64 rounded-full bg-emerald-300/10"
          />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              <GraduationCap className="h-4 w-4" />
              {grade.label} Mathematics
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Your Mathematics Pathway
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-50/90 sm:text-base">
              Learn step by step, build strong foundations, and develop the
              confidence to solve increasingly challenging problems. Choose a
              unit below to explore its topics.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-emerald-50/90">
              <span className="inline-flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {units.length} curriculum units
              </span>
              <span className="inline-flex items-center gap-2">
                <Target className="h-4 w-4" />
                {topics.length} learning topics
              </span>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#147D72]">
              Your curriculum
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#26352D] sm:text-3xl">
              Explore your learning units
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718078]">
              Each unit is divided into focused topics. Select a topic to open
              its learning page and work through it at your own pace.
            </p>
          </div>

          <div className="space-y-7">
            {units.map((unit, unitIndex) => {
              const unitTopics = topics.filter(
                (topic) => topic.unitId === unit.id,
              );

              return (
                <section
                  key={unit.id}
                  className="overflow-hidden rounded-3xl border border-[#E4EBE2] bg-white shadow-sm"
                >
                  <div className="border-b border-[#EDF1EB] bg-gradient-to-r from-[#F0F7EE] to-white px-5 py-6 sm:px-7">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DDEED8] text-lg font-black text-[#397448]">
                        {String(unitIndex + 1).padStart(2, "0")}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-[#263D2D] sm:text-xl">
                          {unit.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[#718078]">
                          {unit.description}
                        </p>
                        <p className="mt-3 text-xs font-bold text-[#47834B]">
                          {unitTopics.length}{" "}
                          {unitTopics.length === 1 ? "topic" : "topics"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
                    {unitTopics.map((topic, topicIndex) => (
                      <Link
                        key={topic.slug}
                        href={`/learn/${grade.slug}/mathematics/${topic.slug}`}
                        className="group rounded-2xl border border-[#E9EEE7] bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#9BC69A] hover:bg-[#FBFDF9] hover:shadow-md sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF4E6] text-[#47834B]">
                              <BookOpen className="h-4 w-4" />
                            </span>
                            <h4 className="font-bold leading-5 text-[#263D2D]">
                              {topic.name}
                            </h4>
                          </div>
                          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#91A38F] transition-transform group-hover:translate-x-1 group-hover:text-[#47834B]" />
                        </div>

                        <p className="mt-3 text-sm leading-6 text-[#718078]">
                          {topic.description}
                        </p>

                        <div className="mt-4 flex items-center gap-2 border-t border-[#EDF1EB] pt-3 text-xs font-semibold text-[#47834B]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {topic.objectives.length} learning{" "}
                          {topic.objectives.length === 1
                            ? "objective"
                            : "objectives"}
                          <span className="ml-auto text-[#91A38F]">
                            Topic {topicIndex + 1}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-[#DDEBDD] bg-[#F0F7EE] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#47834B] shadow-sm">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#263D2D]">
                Build understanding, one topic at a time
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#718078]">
                The learning experience will guide you through explanations,
                worked examples, practice questions, and progressively
                challenging assessments as you develop your skills in{" "}
                {grade.label} Mathematics.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
