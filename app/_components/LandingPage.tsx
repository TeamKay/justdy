"use client";

import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full bg-background text-white flex flex-col justify-between items-center px-6 pt-32 pb-12 overflow-hidden font-sans select-none">
      {/* PERFECT CIRCLE.SO RADIATING RINGS BACKGROUND */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        {/* Central Radial Glow Layer */}
        <div className="absolute w-150 h-150 bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.4)_0%,transparent_70%)] blur-2xl" />
        <div className="absolute w-200 h-200 bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.2)_0%,transparent_70%)] blur-3xl" />

        {/* Perfectly Centered Concentric Circles */}
        <div className="absolute w-75 h-75 rounded-full border border-white/3" />
        <div className="absolute w-125 h-125 rounded-full border border-white/4" />
        <div className="absolute w-187.5 h-187.5 rounded-full border border-white/[0.035]" />
        <div className="absolute w-262.5 h-262.5 rounded-full border border-white/2.5" />
        <div className="absolute w-350 h-350 rounded-full border border-white/1.5" />
        <div className="absolute w-450 h-450 rounded-full border border-white/[0.008]" />

        {/* Orbiting Tech Nodes (Subtle Accent Highlights) */}
        <div className="absolute w-125 h-125 animate-[spin_80s_linear_infinite]">
          <span className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
        </div>
        <div className="absolute w-187.5 h-187.5 animate-[spin_120s_linear_infinite_reverse]">
          <span className="absolute bottom-1/4 left-0 w-1 h-1 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
        </div>
      </div>

      {/* HERO MAIN BODY */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center my-auto">
        {/* Trust Review Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-[#121626]/90 border border-slate-800/80 rounded-md px-4 py-1.5 shadow-xl shadow-black/20 mb-8 backdrop-blur-sm"
        >
          {/* Mock Micro-Avatars Layout */}
          <div className="flex -space-x-2">
            <div className="w-5 h-5 rounded-full bg-linear-to-r from-red-500 to-orange-500 border border-[#070913] flex items-center justify-center text-[8px] font-bold">
              G
            </div>
            <div className="w-5 h-5 rounded-full bg-linear-to-r from-blue-500 to-indigo-500 border border-[#070913] flex items-center justify-center text-[8px] font-bold">
              A
            </div>
            <div className="w-5 h-5 rounded-full bg-linear-to-r from-emerald-500 to-teal-500 border border-[#070913] flex items-center justify-center text-[8px] font-bold">
              P
            </div>
          </div>

          {/* Star Rating icons */}
          <div className="flex items-center gap-0.5 ml-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
              />
            ))}
          </div>

          <span className="text-xs font-medium text-slate-300 tracking-wide border-l border-slate-800 pl-2 ml-1">
            70k+ reviews
          </span>
        </motion.div>

        {/* Clean, Massive Heading Layer */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] max-w-3xl"
        >
          Elevate Your Learning <br />
          <span className="text-[#ebd07a] drop-shadow-sm">
            Anytime, Anywhere
          </span>
        </motion.h1>

        {/* Minimal Subtitle Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-400/90 max-w-2xl mx-auto leading-relaxed font-light"
        >
          Experience the recorded fast students growth with live tutoring,
          AI-powered lessons, interactive practice, and structured learning
          pathways built for modern education.
        </motion.p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/signup" className="w-full sm:w-auto">
            {/* Added px-4 sm:px-0 below */}
            <button className="w-full sm:w-52 h-12 px-4 sm:px-0 bg-[#857938] text-white hover:bg-[#5a30b5] text-sm rounded-md shadow-lg transition-all flex items-center justify-center gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/communities" className="w-full sm:w-auto">
            {/* Added px-4 sm:px-0 below */}
            <button className="w-full sm:w-52 h-12 px-4 sm:px-0 border border-emerald-400/20 text-sm hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-md transition-all flex items-center justify-center">
              Explore Communities
            </button>
          </Link>
        </div>
      </div>

      {/* FOOTER: TRUSTED BY SATELLITE ROW */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative z-10 w-full max-w-6xl mx-auto mt-auto pt-8 border-t border-white/10 flex flex-col items-center gap-5"
      ></motion.div>
    </section>
  );
}
