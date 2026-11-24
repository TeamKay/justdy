
"use client";

import Link from "next/link";
import Announcements, {
  type HomepageAnnouncement,
} from "@/app/_components/Announcements";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Play,
  Sparkles,
} from "lucide-react";

interface MathHeroProps {
  announcement: HomepageAnnouncement | null;
}

export default function MathHero({ announcement }: MathHeroProps) {
  const statistics = [
    {
      label: "Active Learners",
      value: "20K+",
    },
    {
      label: "Verified Tutors",
      value: "1K+",
    },
    {
      label: "Interactive Video Lessons",
      value: "50K+",
    },
    {
      label: "Guided Learning Projects",
      value: "15K+",
    },
  ];


  return (
    <div>
      <section
        className="relative isolate overflow-hidden bg-[#20242b]"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(13, 18, 25, 0.38),
              rgba(13, 18, 25, 0.48)
            ),
            url('/images/justdy-chalkboard-background.webp')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
       <Announcements announcement={announcement} />

        {/* MAIN HERO CONTENT */}
        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:px-12 lg:pb-10 lg:pt-18">

          {/* Main hero */}
          <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">

            {/* LEFT: Hero content */}
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">

              {/* Eyebrow */}
              <div className="mb-7 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#9EE66B] shadow-[0_0_8px_rgba(158,230,107,0.7)]" />
                <span className="text-xs font-bold tracking-[0.12em] text-[#C8E9B9]">
                  Your journey starts here
                </span>
                <Sparkles className="h-3.5 w-3.5 text-[#E6A62E]" />
              </div>

              {/* Heading */}
              <h1 className="max-w-2xl font-chalkduster text-[2.75rem] font-bold leading-[1.12] tracking-tight text-white sm:text-6xl lg:text-[4.25rem]">
                Math can be easier
                <span className="relative mt-1 block text-[#E6A52C]">
                  than you think.
                  <svg
                    className="absolute -bottom-3 left-1/2 w-52 -translate-x-1/2 sm:w-104 lg:left-0 lg:translate-x-0"
                    viewBox="0 0 260 17"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 12C64 2 176 2 256 10"
                      stroke="#E6A52C"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Description */}
              <p className="mx-auto mt-9 max-w-xl text-base leading-8 text-slate-200 sm:text-lg lg:mx-0">
                Discover a better way to learn mathematics. Ask questions,
                explore challenging problems, connect with experienced tutors,
                and build the confidence to solve anything.
              </p>

              {/* CTA */}
              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href="/tutoring"
                  className="group inline-flex h-13 w-full items-center justify-center gap-3 rounded-lg bg-[#8c9112] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#147D72]/20 transition duration-300 hover:-translate-y-1 hover:bg-[#787a2c] hover:shadow-xl sm:w-auto"
                >
                  Schedule Free Assessment
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/videos"
                  className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/90 px-7 py-4 text-sm font-bold text-[#302044] shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white sm:w-auto"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8c9112]">
                    <Play className="h-3.5 w-3.5 fill-white text-white" />
                  </span>
                  Explore Learning Videos
                </Link>
              </div>

              {/* Trust points */}
              <div className="mt-10 flex flex-nowrap items-center justify-center gap-x-3 border-t border-white/20 pt-7 lg:justify-start lg:gap-x-6">
                <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-200 sm:gap-2 sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#9EE66B]" />
                  Personalized learning
                </div>

                <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-200 sm:gap-2 sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#9EE66B]" />
                  Expert support
                </div>

                <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-200 sm:gap-2 sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#9EE66B]" />
                  Learn at your pace
                </div>
              </div>
            </div>

            {/* RIGHT: Welcome video and visual elements */}
            <div className="relative mx-auto w-full max-w-147.5 lg:ml-auto">

              {/* Decorative shapes */}
              <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-[#FFD43B] sm:-right-8 sm:h-36 sm:w-36" />
              <div className="absolute -bottom-8 -left-7 h-28 w-28 rounded-full bg-[#1e6f46]" />

              {/* Main video container */}
              <div className="relative z-10 rounded-lg border-0 bg-[#174B40] shadow-[0_30px_80px_rgba(0,0,0,0.3)] sm:border-0">
                <div className="relative aspect-4/3 overflow-hidden rounded-lg">
                  <video
                    autoPlay
                    muted
                    loop
                    controls
                    playsInline
                    preload="metadata"
                    poster="/images/justdy-welcome-poster.jpg"
                    aria-label="Welcome to Justdy"
                    className="absolute inset-0 h-full w-full object-cover"
                  >
                    <source
                      src="https://media.justdy.com/justdy-welcome.mp4"
                      type="video/mp4"
                    />
                    Your browser does not support HTML video.
                  </video>
                </div>
              </div>

              {/* Floating learning card */}
              <div className="absolute -left-5 top-[16%] z-20 hidden items-center gap-3 rounded-lg border border-[#E8EFE9] bg-white p-3.5 shadow-xl sm:flex lg:-left-12">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E6F4EB] text-[#147D72]">
                  <Calculator className="h-5 w-5" />
                </div>
              </div>

              {/* Floating video card */}
              <div className="absolute -bottom-7 right-3 z-20 flex items-center gap-3 rounded-lg border border-[#E8EFE9] bg-white p-3.5 shadow-xl sm:right-[-12px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF0C2] text-[#C78A18]">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATISTICS */}
        <div className="mx-auto max-w-6xl px-4 sm:px-12">
          <div className="mx-auto max-w-6xl border-y border-white/15">
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {statistics.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`
                    flex flex-col items-center justify-center
                    px-3 py-8 text-center sm:px-5 sm:py-10
                    ${index % 2 === 0 ? "border-r border-white/15" : ""}
                    ${index < 2 ? "border-b border-white/15 sm:border-b-0" : ""}
                    ${index < 3 ? "sm:border-r sm:border-white/15" : ""}
                  `}
                >
                  <h3 className="text-3xl font-bold tracking-tight text-[#F4B942] sm:text-4xl lg:text-5xl">
                    {stat.value}
                  </h3>

                  <p className="mt-3 max-w-45 text-xs font-medium leading-5 text-slate-200 sm:text-sm">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
