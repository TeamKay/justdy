
"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";


export default function MathHero() {
  return (
     <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-12 sm:pt-15 lg:px-8 lg:pb-0 lg:pt-15">
                
        {/* Centered hero content */}
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-lg border border-[#302044]/10 bg-white px-4 py-2 text-xs font-medium text-[#302044] shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 rounded-lg bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,.75)]" />
            Math Mastery Made Simple
            <ArrowRight className="h-3.5 w-3.5 text-[#51465D]/70" />
          </div>

          <h1 className="pt-5 font-chalkduster max-w-6xl text-balance text-[2.5rem] font-bold leading-tight tracking-normal text-[#0F625A] sm:text-5xl md:text-6xl lg:text-[3.5rem]">
              Math Mastery{" "}
              <span className="relative inline-block bg-linear-to-r from-[#55984A] via-[#70A94D] to-[#E89A42] bg-clip-text text-transparent">
                with Fun!
              </span>
            </h1>

        
          {/* Supporting description */}
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-[#51465D] sm:text-lg sm:leading-8">
            Discover a better way to learn mathematics. Ask questions, explore challenging problems, get personalized guidance, and build the confidence to solve anything.
          </p>

          {/* Call-to-action buttons */}
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">

            <Link
              href="/tutoring"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#147D72] px-7 text-sm font-semibold text-white shadow-md shadow-[#147D72]/20 transition hover:-translate-y-0.5 hover:bg-[#0F625A] sm:w-auto"
            >
              Schedule Free Assessment
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>

            <Link
              href="/videos"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#302044]/35 bg-white/70 px-7 text-sm font-medium text-[#302044] transition hover:border-[#302044] hover:bg-white sm:w-auto"
            >
              <Sparkles className="h-4 w-4" />
              Explore Learning Videos
            </Link>

          </div>

          {/* Justdy introduction video */}
      
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

                    
   
             </section>
  );
}
