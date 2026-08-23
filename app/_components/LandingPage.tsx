"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Compass, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface LandingPageProps {
  uploadthingImages?: string[];
}

const CAROUSEL_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1200&auto=format&fit=crop",
    alt: "Online math tutoring and digital workspace products",
  },
  {
    url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200&auto=format&fit=crop",
    alt: "Printable workbooks and study planners for students",
  },
  {
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
    alt: "Interactive digital learning sessions and online tutoring",
  },
];

export default function LandingPageClient({}: LandingPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % CAROUSEL_IMAGES.length,
      );
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-x-hidden font-sans antialiased text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* ================================================================ */}
      {/* BACKGROUND                                                       */}
      {/* ================================================================ */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-[radial-gradient(#000_0px,transparent_1px)] bg-size-[15px_15px]"
          style={{
            maskImage:
              "radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)",
          }}
        />
      </div>

      {/* ================================================================ */}
      {/* MAIN CONTAINER                                                   */}
      {/* ================================================================ */}

      <main
        className="
          relative
          z-10
          mx-auto
          max-w-8xl
          px-4
          py-5
          sm:px-6
          lg:px-28
        "
      >
        <div className="grid grid-cols-1 items-stretch gap-8">
          {/* ============================================================ */}
          {/* HERO CARD                                                     */}
          {/* ============================================================ */}

          <div
            className="
              relative
              flex
              flex-col
              justify-between
              overflow-hidden
              rounded-md
              border
              border-emerald-500/20
              bg-linear-to-br
              bg-emerald-900/20
              p-5
              shadow-2xl
              shadow-emerald-950/20
              sm:p-8
            "
          >
            {/* ========================================================== */}
            {/* AMBIENT GLOW                                                */}
            {/* ========================================================== */}

            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

            {/* ========================================================== */}
            {/* DESKTOP IMAGE CAROUSEL                                      */}
            {/* ========================================================== */}

            <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-20 hidden w-[55%] items-center justify-end sm:flex">
              <div
                className="relative h-full w-full overflow-hidden bg-slate-900 shadow-2xl"
                style={{
                  clipPath: "polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)",
                }}
              >
                {/* Image overlay */}
                <div className="absolute inset-0 z-10 bg-linear-to-r from-slate-950/95 via-slate-950/30 to-transparent" />

                {CAROUSEL_IMAGES.map((img, index) => (
                  <div
                    key={img.url}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      index === currentImageIndex
                        ? "z-1 opacity-100"
                        : "z-0 opacity-0"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      priority={index === 0}
                      className="transform object-cover object-center scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================================== */}
            {/* FLOATING BADGES                                             */}
            {/* ========================================================== */}

            <div className="pointer-events-auto absolute bottom-6 right-8 z-30 hidden items-center gap-3 lg:right-30 lg:flex">
              <div className="flex items-center gap-3 rounded-md border border-emerald-500/40 bg-blue-600 px-6 py-3 text-white shadow-2xl backdrop-blur-2xl transition-transform duration-300 hover:scale-105">
                <div className="rounded-lg bg-blue-500 p-2 text-emerald-400 shadow-inner">
                  <Sparkles className="size-4" />
                </div>

                <div>
                  <div className="text-xs font-bold tracking-wide text-white">
                    Top Rated
                  </div>

                  <p className="text-[11px] font-medium text-slate-300">
                    Expert-led paths
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-blue-600 px-6 py-3 text-white shadow-2xl backdrop-blur-2xl transition-transform duration-300 hover:scale-105">
                <div className="rounded-lg bg-blue-500 p-2 text-emerald-400 shadow-inner">
                  <Sparkles className="size-4" />
                </div>

                <div>
                  <div className="text-xs font-bold tracking-wide text-white">
                    Printables
                  </div>

                  <p className="text-[11px] font-medium text-slate-300">
                    Workbooks, planners, and more
                  </p>
                </div>
              </div>
            </div>

            {/* ========================================================== */}
            {/* LEFT CONTENT                                                */}
            {/* ========================================================== */}

            <div className="relative z-10 max-w-4xl pr-0 sm:pr-80 lg:pr-96">
              <h1 className="mb-5 text-3xl font-extrabold leading-[1.1] tracking-tight text-blue-600 sm:mb-6 sm:text-3xl lg:text-5xl">
                Learn. Create. Grow.
              </h1>

              <p className="mb-5 text-base font-normal leading-relaxed text-slate-700 sm:text-[16px]">
                Discover quality learning materials that makes learning
                engaging, fun, and productive, as well as quality one-on-one
                tutoring from experts.
              </p>

              {/* ======================================================== */}
              {/* ACTION BUTTONS                                            */}
              {/* ======================================================== */}

              <div className="mb-6 flex w-full flex-col items-stretch justify-start gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href="/free-assessment"
                  className="
                    inline-flex
                    h-12
                    w-full
                    items-center
                    justify-center
                    gap-2.5
                    rounded-md
                    border
                    border-emerald-400/40
                    bg-blue-500
                    px-6
                    text-base
                    font-extrabold
                    text-white
                    shadow-xl
                    shadow-emerald-500/30
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:bg-blue-600
                    active:translate-y-0
                    sm:w-auto
                  "
                >
                  <Sparkles className="size-4 text-white" />

                  <span>Free Assessment</span>

                  <ArrowRight className="ml-0.5 size-4 text-white" />
                </Link>

                <Link
                  href="/videos"
                  className="
                    inline-flex
                    h-12
                    w-full
                    items-center
                    justify-center
                    gap-2.5
                    rounded-md
                    border
                    border-blue-500
                    px-6
                    text-base
                    font-semibold
                    text-blue-600
                    shadow-lg
                    transition-all
                    duration-300
                    hover:border-blue-600
                    hover:text-white
                    active:translate-y-0
                    sm:w-auto
                  "
                >
                  <Compass className="size-4 text-blue-500" />

                  <span>Free Lesson Videos</span>
                </Link>
              </div>

              {/* ======================================================== */}
              {/* FEATURE TAGS                                             */}
              {/* ======================================================== */}

              <div className="flex flex-wrap items-start gap-0 sm:gap-1">
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-800 backdrop-blur-sm sm:px-3">
                  <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-500">
                    <Check className="size-3 text-white" />
                  </div>

                  <span>Instant Downloads</span>
                </div>

                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-800 backdrop-blur-sm sm:px-3">
                  <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-500">
                    <Check className="size-3 text-white" />
                  </div>

                  <span>Secured Payments</span>
                </div>

                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-800 backdrop-blur-sm sm:px-3">
                  <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-500">
                    <Check className="size-3 text-white" />
                  </div>

                  <span>Learn Anywhere</span>
                </div>
              </div>
            </div>

            {/* ========================================================== */}
            {/* MOBILE IMAGE                                                */}
            {/* ========================================================== */}

            <div className="relative z-10 mt-7 flex justify-center sm:hidden">
              <div className="relative h-48 w-full overflow-hidden rounded-xl border border-emerald-500/30 bg-slate-900 shadow-2xl">
                <Image
                  src={CAROUSEL_IMAGES[currentImageIndex].url}
                  alt={CAROUSEL_IMAGES[currentImageIndex].alt}
                  fill
                  className="object-cover object-center transition-opacity duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
