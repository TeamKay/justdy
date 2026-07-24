"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
  Video,
  Play,
  Layers,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Clock,
} from "lucide-react";

export default function OnlineCoursesBanner() {
  // State updated to mimic an active course syllabus curriculum selection
  const [modules] = useState([
    {
      number: "Module 1",
      title: "Foundational Blueprints & Core Frameworks",
      duration: "45 mins",
      active: false,
    },
    {
      number: "Module 2",
      title: "Advanced Deep-Dive Strategy & Execution",
      duration: "1h 15m",
      active: true,
    },
    {
      number: "Module 3",
      title: "Real-World Case Studies & Troubleshooting",
      duration: "50 mins",
      active: false,
    },
  ]);

  return (
    <section className="relative overflow-hidden py-24 bg-background">
      {/* Blueprint Topographic Dot Matrix Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Cybernetic Core Lighting Halos */}
      <div className="absolute top-1/4 left-1/4 w-125 h-125 bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-100 h-100 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* LEFT COLUMN: Clean Value Core Block (Spans 6) */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Micro Category Badge */}
            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              <Video className="w-3.5 h-3.5" />
              <span>On-Demand Learning</span>
            </div>

            {/* Structured Headings Hierarchy */}
            <h1 className="text-4xl font-semibold text-white mb-4 tracking-tight">
              Master High-Demand <br />
              Skills with Premium <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 via-teal-200 to-white">
                Online Courses.
              </span>
            </h1>

            <p className="text-neutral-400 text-base max-w-2xl mx-auto">
              Gain lifetime access to comprehensive, self-paced video modules.
              Learn step-by-step from expert-vetted curricula designed to turn
              concepts into practical mastery.
            </p>

            {/* Core Action Call Target Link */}
            <div className="pt-4 w-full sm:w-auto">
              <Link
                href="/courses"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-md bg-[#857938] text-white font-bold shadow-[0_4px_20px_-5px_rgba(16,185,129,0.4)] transition-all duration-300 hover:bg-emerald-500 hover:shadow-[0_4px_24px_-2px_rgba(16,185,129,0.5)] hover:-translate-y-0.5"
              >
                <span>Browse Course Catalog</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Glassmorphic Course Interface Mockup Frame (Spans 6) */}
          <div className="lg:col-span-6 relative w-full max-w-lg mx-auto lg:max-w-none">
            {/* Underlying technical geometry brackets */}
            <div className="absolute -inset-4 border border-neutral-800/40 rounded-3xl mask-[linear-gradient(to_bottom,black_30%,transparent_100%)] hidden sm:block" />

            {/* Main Interactive Sandbox Mockup Frame */}
            <div className="relative rounded-2xl border border-neutral-800/80 bg-neutral-950/60 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Window Header Utility Tab */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-900 bg-neutral-900/30">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-mono tracking-wider text-neutral-400">
                    course_player_v2.dmg
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
                    HD STREAMING
                  </span>
                </div>
              </div>

              {/* Course Player / Syllabus body area */}
              <div className="p-6 space-y-3 min-h-64 flex flex-col justify-center">
                <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">
                  Curriculum Preview
                </p>

                {modules.map((mod, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-xl p-3.5 transition-all duration-300 border ${
                      mod.active
                        ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                        : "bg-neutral-900/40 border-neutral-800/60 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`h-7 w-7 rounded-md shrink-0 flex items-center justify-center border text-xs ${
                          mod.active
                            ? "bg-emerald-500 border-emerald-400 text-neutral-950"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400"
                        }`}
                      >
                        {mod.active ? (
                          <Play className="w-3 h-3 fill-current" />
                        ) : (
                          <Layers className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                          {mod.number}
                        </span>
                        <p className="text-sm font-medium text-neutral-200 mt-0.5 leading-tight">
                          {mod.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-500 font-mono text-[11px] shrink-0 pl-4">
                      <Clock className="w-3 h-3" />
                      <span>{mod.duration}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mockup bottom feature status bar */}
              <div className="p-4 border-t border-neutral-950 bg-neutral-900/20 flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5 font-light">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />{" "}
                  Including Source Files & Project Homework
                </span>
              </div>
            </div>

            {/* Micro Floating Diagnostic Node */}
            <div className="absolute -bottom-6 -right-4 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 shadow-xl hidden sm:flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-[11px] font-mono text-neutral-300 tracking-wide">
                Lifetime Access Unlocked
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
