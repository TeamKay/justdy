import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  Target,
} from "lucide-react";

import {
  getGradeNumber,
  getLearningGrade,
  getLearningTopic,
  isLearningSubjectAvailable,
} from "@/lib/learning/learning-catalog";
import Grade8LinearEquationsExperience from "@/app/_components/learning/grade-8/Grade8LinearEquationsExperience";
import MarketingNavbar from "@/app/_components/MarketingNavbar";

interface TopicPageProps {
  params: Promise<{
    grade: string;
    topic: string;
  }>;
}

export async function generateMetadata({ params }: TopicPageProps) {
  const { grade: gradeSlug, topic: topicSlug } = await params;
  const grade = getLearningGrade(gradeSlug);

  if (!grade) return { title: "Topic Not Found | Justdy" };

  const gradeNumber = getGradeNumber(grade);
  if (gradeNumber === null) return { title: "Topic Not Found | Justdy" };

  const topic = getLearningTopic(
    gradeNumber,
    "mathematics",
    topicSlug,
  );

  return {
    title: topic
      ? `${topic.name} | ${grade.label} Mathematics | Justdy`
      : "Topic Not Found | Justdy",
    description: topic?.description ?? "Explore mathematics on Justdy.",
  };
}

export default async function MathematicsTopicPage({
  params,
}: TopicPageProps) {
  const {
    grade: gradeSlug,
    topic: topicSlug,
  } = await params;

  const grade = getLearningGrade(gradeSlug);

  if (!grade) notFound();

  const gradeNumber = getGradeNumber(grade);

  if (
    gradeNumber === null ||
    !isLearningSubjectAvailable(gradeNumber, "mathematics")
  ) {
    notFound();
  }

  const topic = getLearningTopic(
    gradeNumber,
    "mathematics",
    topicSlug,
  );

  if (!topic) notFound();

  return (
    <main className="min-h-screen bg-[#F7F9F6] text-[#26352D]">
      <MarketingNavbar />

      <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <Link
          href={`/learn/${grade.slug}/mathematics`}
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#718078] transition hover:text-[#147D72]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Mathematics
        </Link>

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#153F35] to-[#176B59] px-6 py-9 text-white shadow-sm sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5"
          />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-100">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                {grade.label}
              </span>
              <span>Mathematics</span>
              <span className="text-emerald-200/60">/</span>
              <span>{topic.unitTitle}</span>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <BookOpen className="h-6 w-6 text-emerald-100" />
              </span>
              <span className="text-sm font-semibold text-emerald-100">
                Your learning topic
              </span>
            </div>

            <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {topic.name}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
              {topic.description}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[#E4EBE2] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF4E6] text-[#47834B]">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#47834B]">
                Your learning goals
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#263D2D]">
                What you will learn
              </h2>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#718078]">
            By the end of this topic, you should be able to work towards the
            following objectives:
          </p>

          <ul className="mt-5 space-y-4">
            {topic.objectives.map((objective, index) => (
              <li key={`${index}-${objective}`} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#47834B]" />
                <span className="text-sm leading-6 text-[#46564B]">
                  {objective}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {gradeNumber === 8 && topicSlug === "linear-equations" ? (
          <Grade8LinearEquationsExperience />
        ) : (
          <>
<section className="mt-7 rounded-3xl border border-[#E4EBE2] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF4E6] text-[#47834B]">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#47834B]">
                Lesson
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#263D2D]">
                Understand the concept
              </h2>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-[#C9DCC6] bg-[#F7FAF5] p-6 sm:p-8">
            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#47834B] shadow-sm">
                <Lightbulb className="h-7 w-7" />
              </span>

              <h3 className="mt-5 text-lg font-bold text-[#263D2D]">
                Your lesson is being prepared
              </h3>

              <p className="mt-2 text-sm leading-7 text-[#718078]">
                This is where your interactive lesson will explain{" "}
                {topic.name.toLowerCase()}, introduce important concepts,
                demonstrate worked examples, and guide you through the topic
                step by step.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7 rounded-3xl border border-[#E4EBE2] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-[#263D2D]">
            Check your understanding
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#718078]">
            After studying the lesson, you will practise with multiple-choice
            questions. Justdy will adjust question difficulty according to
            your performance and explain your answers.
          </p>

          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#F0F7EE] p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#47834B]" />
            <p className="text-sm leading-6 text-[#526B54]">
              Your learning progress and assessment history will be connected
              to your learner account as we implement the adaptive learning
              system.
            </p>
          </div>
        </section>
          </>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/learn/${grade.slug}/mathematics`}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DDE6DA] bg-white px-5 py-3 text-sm font-bold text-[#526B54] transition hover:bg-[#F0F7EE]"
          >
            <ArrowLeft className="h-4 w-4" />
            All Mathematics topics
          </Link>

          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#47834B]">
            <BookOpen className="h-4 w-4" />
            Learn at your own pace
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </main>
  );
}
