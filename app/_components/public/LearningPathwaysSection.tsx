
"use client";

import Link from "next/link";
import {
  Video,
  Gamepad2,
  BookOpen,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

const learningOptions = [
  {
    number: "01",
    icon: Video,
    title: "Live tutoring",
    description:
      "Learn directly with a tutor in a focused online session. Get personal guidance, ask questions, and build confidence.",
    detail: "Personalized instruction",
    href: "/tutoring",
    color: "bg-[#147D72]",
  },
  {
    number: "02",
    icon: Gamepad2,
    title: "Educational games",
    description:
      "Make mathematics engaging through interactive games that reinforce concepts and strengthen problem-solving skills.",
    detail: "Learn through practice",
    href: "/games",
    color: "bg-[#76529A]",
  },
  {
    number: "03",
    icon: BookOpen,
    title: "Free lesson videos",
    description:
      "Explore mathematics lessons, revisit difficult topics, and learn at your own pace with helpful video explanations.",
    detail: "Learn anytime, anywhere",
    href: "/videos",
    color: "bg-[#D28A43]",
  },
  {
    number: "04",
    icon: Sparkles,
    title: "Learning resources",
    description:
      "Access learning materials and activities designed to help you review concepts, practise independently, and grow.",
    detail: "Build stronger foundations",
    href: "/resources",
    color: "bg-[#3977A8]",
  },
];

export default function LearningPathwaysSection() {
  return (
    <section className="relative overflow-hidden bg-[#f0f7f1] px-5 py-20 sm:px-8 lg:py-28">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-[#147D72]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#76529A]/[0.05] blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-start gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        {/* Introduction */}
        <div className="lg:sticky lg:top-24">
          <div className="h-1 w-12 rounded-full bg-[#147D72]" />

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-[#147D72]">
            Your learning journey
          </p>

          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#302044] sm:text-4xl lg:text-5xl">
            More than one way to learn.{" "}
            <span className="text-[#147D72]">
              One goal: helping you succeed.
            </span>
          </h2>

          <p className="mt-6 text-base leading-8 text-[#51465D]">
            Every learner is different. That is why Justdy brings together
            personalized tutoring, interactive practice, videos, and learning
            resources to help students develop strong mathematical foundations
            and prepare for high school and beyond.
          </p>

          <Link
            href="/tutoring"
            className="mt-8 inline-flex items-center gap-3 rounded-lg bg-[#147D72] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#147D72]/15 transition hover:-translate-y-0.5 hover:bg-[#10675E] hover:shadow-lg"
          >
            Schedule Free Pre-assessment
            <ChevronRight className="h-4 w-4" />
          </Link>

          <p className="mt-5 text-sm text-[#51465D]/65">
            Start with the support you need. Grow at your own pace.
          </p>
        </div>

        {/* Learning options */}
        <div className="grid gap-4 sm:grid-cols-2">
          {learningOptions.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.number}
                href={item.href}
                className="group relative flex min-h-[260px] flex-col overflow-hidden rounded-lg border border-[#302044]/[0.07] bg-white p-6 shadow-[0_5px_25px_rgba(48,32,68,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#147D72]/30 hover:shadow-[0_16px_40px_rgba(48,32,68,0.09)] sm:p-7"
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color} text-white shadow-sm transition duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <span className="text-sm font-bold tracking-widest text-[#302044]/20">
                    {item.number}
                  </span>
                </div>

                <div className="mt-7 flex-1">
                  <h3 className="text-xl font-bold tracking-tight text-[#302044] transition group-hover:text-[#147D72]">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#51465D]/80">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[#302044]/[0.07] pt-4">
                  <span className="text-xs font-semibold text-[#147D72]">
                    {item.detail}
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f7f1] text-[#147D72] transition duration-300 group-hover:translate-x-1 group-hover:bg-[#147D72] group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
