"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  BookOpen,
  Download,
  Youtube,
  ChevronRight,
  Video,
} from "lucide-react";
import Link from "next/link";
import React from "react";

export default function LandingPage() {
  const features = [
    {
      icon: BookOpen,
      text: "HD Live Sessions",
    },
    {
      icon: Calendar,
      text: "10+ Interactive Courses",
    },
    {
      icon: Download,
      text: "Downloadable Digital Resources",
    },
    {
      icon: Video,
      text: "20+ Free Video Lessons",
    },
  ];
  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-17 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-100/80 via-slate-50/50 to-white overflow-hidden">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-slate-200/80 bg-white/80 backdrop-blur-md text-slate-700 text-xs font-semibold shadow-xs mb-8 transition-colors hover:border-slate-300">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-800">
            All-in-One Educational Platform
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-400 max-w-4xl mx-auto leading-[1.08]">
          Courses, Live Sessions &{" "}
          <span className="bg-linear-to-r from-slate-200 via-slate-700 to-slate-100 bg-clip-text text-transparent underline decoration-slate-300 decoration-2 underline-offset-8">
            Premium Resources
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-base md:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          From structured online courses and 1-on-1 expert consultations to
          downloadable digital assets and free video tutorials—everything you
          need in one place.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Button
            asChild
            size="lg"
            className="h-12 px-14 py-2 text-sm font-semibold text-white bg-[#857938] rounded-md hover:bg-blue-700 transition shadow-sm"
          >
            <Link href="/products" className="flex items-center gap-2">
              Explore Products <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 px-10 rounded-md text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-yellow-200 transition-all shadow-xs"
          >
            <Link href="/videos" className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-600 fill-red-600/10" />
              Watch Free Lessons
            </Link>
          </Button>
        </div>

        {/* Feature Badges Banner */}
        <div className="mt-12 pt-8 max-w-5xl mx-auto px-4">
          <div className="w-full rounded-2xl bg-neutral-900/50 border border-slate-800/80 backdrop-blur-md p-4 md:px-8 md:py-4 shadow-xl shadow-slate-950/20">
            <div className="flex flex-wrap items-center justify-center md:justify-between gap-4 md:gap-6 text-xs text-slate-400 font-medium">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <React.Fragment key={feature.text}>
                    <div className="group flex items-center gap-2.5 transition-colors hover:text-slate-200">
                      <div className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 group-hover:text-white group-hover:border-slate-600 transition-all">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="tracking-wide">{feature.text}</span>
                    </div>

                    {/* Divider between items (hidden on mobile or last item) */}
                    {index < features.length - 1 && (
                      <span className="hidden md:inline text-slate-800 text-sm select-none">
                        •
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
