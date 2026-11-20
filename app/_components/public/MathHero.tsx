
"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  MessageCircleQuestion,
  Sparkles,
} from "lucide-react";


export default function MathHero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#f0f3ea]">

      {/* Mathematical grid background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              linear-gradient(to right, #FAD6AC 1px, transparent 1px),
              linear-gradient(to bottom, #FAD6AC 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Hero content */}
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-5 pb-24 pt-16 text-center sm:px-8 sm:pb-28 sm:pt-20 lg:pt-30">

       
        {/* Glowing badge above main heading */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-[#55984A]/25 bg-white/80 px-4 py-2 shadow-[0_0_25px_rgba(85,152,74,0.18)] backdrop-blur-sm">

          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#70A94D] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#55984A] shadow-[0_0_10px_rgba(85,152,74,0.8)]" />
          </span>

          <span className="text-[10px] font-extrabold tracking-[0.16em] text-[#34523B] sm:text-xs">
            A BETTER WAY TO LEARN MATH
          </span>

          <Sparkles className="h-3.5 w-3.5 text-[#D99535]" />
        </div>

        {/* Main heading */}
        <h1 className="font-chalkduster max-w-6xl text-balance text-[2.5rem] font-bold leading-tight tracking-normal text-[#173B2F] sm:text-5xl md:text-6xl lg:text-[3.5rem]">
          Math Mastery{" "}
          <span className="relative inline-block bg-linear-to-r from-[#55984A] via-[#70A94D] to-[#E89A42] bg-clip-text text-transparent">
            with Fun!
          </span>
        </h1>
        {/* Description */}
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[#718078] sm:mt-6 sm:text-lg sm:leading-8">
          Discover a better way to learn mathematics. Ask questions, explore challenging problems, get personalized guidance, and build the confidence to solve anything.
        </p>

        {/* Main actions */}
        <div className="mt-6 flex w-full flex-col justify-center gap-3 sm:mt-7 sm:w-auto sm:flex-row sm:gap-4">

          <Link
            href="/tutoring"
            className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#55984A] px-6 text-sm font-extrabold text-white shadow-lg shadow-[#55984A]/20 transition duration-300 hover:-translate-y-1 hover:bg-[#427D3A] hover:shadow-xl"
          >
            <GraduationCap className="h-5 w-5" />
            Free Assessment
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>

          <Link
            href="/questions/new"
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#E3EDE0] bg-white/95 px-6 text-sm font-bold text-[#34523B] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#55984A]/40 hover:bg-[#F5F9F2]"
          >
            <MessageCircleQuestion className="h-5 w-5" />
            Begin with a Question
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

        </div>

    
        {/* Justdy Welcome Video */}
        <div className="relative mt-8 w-full max-w-5xl sm:mt-10 lg:mt-12">

          {/* Background glow */}
          <div className="absolute inset-x-12 -top-8 h-28 rounded-lg bg-[#DDF4E9] opacity-70 blur-3xl sm:inset-x-24" />

          {/* Video frame */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[#E3EDE0] bg-[#173B2F] shadow-[0_25px_80px_rgba(39,75,45,0.16)]">

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

          {/* Decorative icons */}
          <div className="absolute -left-4 top-[25%] hidden h-14 w-14 -rotate-10 items-center justify-center rounded-2xl border border-[#E3EDE0] bg-white text-[#55984A] shadow-xl sm:flex">
            <BookOpen className="h-6 w-6" />
          </div>

          <div className="absolute -right-4 bottom-[18%] hidden h-14 w-14 rotate-10 items-center justify-center rounded-2xl border border-[#F3E3C9] bg-white text-[#DC8725] shadow-xl sm:flex">
            <Sparkles className="h-6 w-6" />
          </div>

        </div>
      </div>

      {/* Bottom gradient: light green into white */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-b from-transparent via-white/75 to-white sm:h-40"
      />

    </section>
  );
}
