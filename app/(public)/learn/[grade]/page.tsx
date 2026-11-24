
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FlaskConical,
  Languages,
  Monitor,
} from "lucide-react";


import {
  getGradeNumber,
  getLearningGrade,
  getLearningSubjects,
  getLearningTopics,
  isLearningSubjectAvailable,
} from "@/lib/learning/learning-catalog";
import MarketingNavbar from "@/app/_components/Navbar";

export const metadata = {
  title: "Explore Your Grade | Justdy",
  description:
    "Discover subjects, explore learning topics, and build your skills with Justdy.",
};

interface GradePageProps {
  params: Promise<{
    grade: string;
  }>;
}

const subjectIcons = {
  mathematics: BookOpen,
  science: FlaskConical,
  english: Languages,
  technology: Monitor,
};

const subjectColors = {
  mathematics: {
    icon: "bg-emerald-50 text-emerald-700",
    accent: "border-emerald-100",
  },
  science: {
    icon: "bg-sky-50 text-sky-700",
    accent: "border-sky-100",
  },
  english: {
    icon: "bg-violet-50 text-violet-700",
    accent: "border-violet-100",
  },
  technology: {
    icon: "bg-amber-50 text-amber-700",
    accent: "border-amber-100",
  },
};

export default async function GradeLearningPage({
  params,
}: GradePageProps) {
  const { grade: gradeSlug } = await params;

  const grade = getLearningGrade(gradeSlug);

  if (!grade) {
    notFound();
  }

  const gradeNumber = getGradeNumber(grade);
  const subjects = getLearningSubjects();

  const schoolLevelLabel = {
    elementary: "Elementary School",
    middle: "Middle School",
    high: "High School",
  }[grade.schoolLevel];

  return (
    <main className="min-h-screen bg-[#F7F9F6] text-[#26352D]">
      <MarketingNavbar />

      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#718078] transition hover:text-[#147D72]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to learning home
        </Link>

        {/* Grade introduction */}
        <section className="relative mb-10 overflow-hidden rounded-3xl bg-[#153F35] px-6 py-9 text-white shadow-sm sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-28 right-32 h-64 w-64 rounded-full bg-emerald-300/10" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-100">
              {schoolLevelLabel}
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Welcome to {grade.label}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-50/85 sm:text-base">
              Your learning journey starts here. Choose a subject, explore
              interesting topics, and build your knowledge one step at a time.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-emerald-50/90">
              <span className="inline-flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Explore subjects
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Learn at your pace
              </span>
            </div>
          </div>
        </section>

        {/* Subject selection */}
        <section>
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#147D72]">
              Your learning pathway
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#26352D] sm:text-3xl">
              Choose a subject
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718078]">
              Start with a subject that interests you. Each subject will guide
              you through topics and learning activities for your grade.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {subjects.map((subject) => {
              const Icon =
                subjectIcons[subject.id as keyof typeof subjectIcons] ??
                BookOpen;

              const colors =
                subjectColors[
                  subject.id as keyof typeof subjectColors
                ] ?? subjectColors.mathematics;

              const available =
                gradeNumber !== null &&
                isLearningSubjectAvailable(gradeNumber, subject.id);

              const topics =
                gradeNumber !== null && available
                  ? getLearningTopics(gradeNumber, subject.id)
                  : [];

              const cardContent = (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors.icon}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    {available ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F2] px-3 py-1 text-xs font-semibold text-[#7A8580]">
                        <Clock3 className="h-3.5 w-3.5" />
                        Coming soon
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-[#26352D]">
                    {subject.name}
                  </h3>

                  <p className="mt-2 min-h-12 text-sm leading-6 text-[#718078]">
                    {subject.description}
                  </p>

                  {available ? (
                    <>
                      <div className="mt-5 border-t border-[#E9EEE8] pt-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#829087]">
                          Topics in this grade
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {topics.map((topic) => (
                            <span
                              key={topic.slug}
                              className="rounded-lg bg-[#F3F7F2] px-2.5 py-1.5 text-xs font-medium text-[#52665A]"
                            >
                              {topic.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-[#E9EEE8] pt-4 text-sm font-semibold text-[#147D72]">
                        <span>
                          Explore {topics.length} topics
                        </span>
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </>
                  ) : (
                    <div className="mt-6 border-t border-[#E9EEE8] pt-4 text-sm text-[#829087]">
                      Learning resources for this subject are being prepared.
                    </div>
                  )}
                </>
              );

              return available ? (
                <Link
                  key={subject.id}
                  href={`/learn/${grade.slug}/${subject.id}`}
                  className={`group rounded-2xl border bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#147D72]/40 hover:shadow-lg ${colors.accent}`}
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={subject.id}
                  aria-disabled="true"
                  className="rounded-2xl border border-[#E9EEE8] bg-white p-6 opacity-80 shadow-sm"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        </section>

        {/* Learning pathway guide */}
        <section className="mt-12 rounded-2xl border border-[#E5ECE4] bg-white p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[#26352D]">
            How your learning journey works
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#718078]">
            Justdy organizes learning into simple steps so you always know
            where to go next.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {[
              { number: "01", title: "Choose a grade", detail: grade.label },
              { number: "02", title: "Select a subject", detail: "Explore subjects" },
              { number: "03", title: "Pick a topic", detail: "Build understanding" },
              { number: "04", title: "Start learning", detail: "Practice and grow" },
            ].map((step) => (
              <div
                key={step.number}
                className="rounded-xl bg-[#F7F9F6] p-4"
              >
                <span className="text-xs font-bold text-[#147D72]">
                  {step.number}
                </span>
                <h3 className="mt-2 text-sm font-bold text-[#26352D]">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs text-[#829087]">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
