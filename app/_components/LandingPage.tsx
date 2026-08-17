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
    <div className="text-slate-900 font-sans antialiased overflow-x-hidden relative selection:bg-emerald-500 selection:text-white">
      {/* SaaS Background Ambient Light & Fine Dot Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Crisp Dot Pattern */}
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

      {/* Main Container - Dual Banner Layout maintaining exact dimensions */}
      <main className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 lg:px-28 pt-5 pb-5">
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 items-stretch">
          <div className="relative rounded-md bg-linear-to-br bg-emerald-900/20 border border-emerald-500/20 text-white p-0 sm:p-8 overflow-hidden shadow-2xl shadow-emerald-950/20 flex flex-col justify-between">
            {/* SaaS Ambient Glow Effects */}
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 pointer-events-none blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-500/10 pointer-events-none blur-3xl" />

            {/* Right Side: Enhanced Beautiful Slanted Diagonal Image Carousel Filling the Right Edge */}
            <div className="absolute right-0 top-0 bottom-0 w-[55%] z-20 hidden sm:flex items-center justify-end pointer-events-none">
              <div
                className="relative w-full h-full overflow-hidden shadow-2xl bg-slate-900"
                style={{
                  clipPath: "polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)",
                }}
              >
                {/* Image overlay gradient for depth and clarity */}
                <div className="absolute inset-0 bg-linear-to-r from-slate-950/95 via-slate-950/30 to-transparent z-10" />

                {CAROUSEL_IMAGES.map((img, index) => (
                  <div
                    key={img.url}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      index === currentImageIndex
                        ? "opacity-100 z-1"
                        : "opacity-0 z-0"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      priority={index === 0}
                      className="object-cover object-center transform scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Badges Aligned Horizontally on Top of the Right-Side Slanted Image */}
            <div className="absolute right-8 lg:right-30 bottom-6 z-30 hidden lg:flex items-center gap-3 pointer-events-auto">
              <div className="bg-slate-900/60 backdrop-blur-2xl border border-emerald-500/40 px-6 py-3 rounded-xl shadow-2xl text-white flex items-center gap-3 transition-transform hover:scale-105 duration-300">
                <div className="p-2 rounded-lg bg-emerald-500/25 text-emerald-400 shadow-inner">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white tracking-wide">
                    Top Rated
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Expert-led paths
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-2xl border border-emerald-500/40 px-6 py-3 rounded-xl shadow-2xl text-white flex items-center gap-3 transition-transform hover:scale-105 duration-300">
                <div className="p-2 rounded-lg bg-emerald-500/25 text-emerald-400 shadow-inner">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white tracking-wide">
                    Printables
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Workbooks, planners, and more
                  </p>
                </div>
              </div>
            </div>

            {/* Left Content */}
            <div className="relative z-10 max-w-4xl pr-0 sm:pr-80 lg:pr-96">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-6 text-blue-600">
                Learn. Create. Grow.
              </h1>

              <p className="text-slate-700 text-base sm:text-[16px] mb-5 font-normal leading-relaxed">
                Discover quality learning materials that makes learning
                engaging, fun, and productive, as well as quality one-on-one
                tutoring from experts.
              </p>

              {/* Action Buttons with Redesigned Beautiful Styling */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-4 w-full sm:w-auto mb-6">
                <Link
                  href="/free-assessment"
                  className="inline-flex h-12 items-center justify-center gap-2.5 px-6 rounded-md bg-[#857938] hover:bg-blue-500 hover:to-teal-400 text-white font-extrabold text-base transition-all duration-300 shadow-xl shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 border border-emerald-400/40"
                >
                  <Sparkles className="size-4 text-white" />
                  <span>Free Assessment</span>
                  <ArrowRight className="size-4 ml-0.5 text-white" />
                </Link>

                <Link
                  href="/videos"
                  className="inline-flex h-12 items-center justify-center gap-2.5 px-6 rounded-md hover:bg-blue-500 text-blue-600 hover:to-teal-400 hover:text-white font-semibold text-base transition-all duration-300 shadow-lg border border-[#857938] hover:border-emerald-400/60 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Compass className="size-4 text-blue-500 hover:to-teal-400" />
                  <span>Free Lesson Videos</span>
                </Link>
              </div>

              {/* Feature Tags */}
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-slate-800 backdrop-blur-sm">
                  <div className="size-4 rounded-full bg-[#857938] flex items-center justify-center">
                    <Check className="size-3 text-white shrink-0" />
                  </div>
                  <span>Instant Downloads</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-slate-800 backdrop-blur-sm">
                  <div className="size-4 rounded-full bg-[#857938] flex items-center justify-center">
                    <Check className="size-3 text-white shrink-0" />
                  </div>
                  <span>Secured Payments</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-slate-800 backdrop-blur-sm">
                  <div className="size-4 rounded-full bg-[#857938] flex items-center justify-center">
                    <Check className="size-3 text-white shrink-0" />
                  </div>
                  <span>Learn Anywhere</span>
                </div>
              </div>
            </div>

            {/* Mobile / Fallback Image layout view */}
            <div className="relative mt-8 flex sm:hidden justify-center z-10">
              <div className="relative w-full h-48 rounded-xl border border-emerald-500/30 overflow-hidden shadow-2xl bg-slate-900">
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
