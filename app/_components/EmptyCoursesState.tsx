"use client";

import { Sparkles, PackageOpen, LayoutGrid, Terminal } from "lucide-react";

export default function EmptyCoursesState() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden bg-background">
      {/* Structural Accent Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-size-[32px_32px] mask-[radial-gradient(circle_50%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />

      {/* Cybernetic Core Lighting Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
        {/* Animated Cybernetic Icon Node */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 blur-2xl bg-orange-500/20 rounded-full animate-pulse transition-transform duration-500 group-hover:scale-110" />
          <div className="relative bg-neutral-950 border border-neutral-800 p-6 rounded-2xl shadow-[0_0_30px_rgba(249,115,22,0.05)] transition-colors duration-300 group-hover:border-neutral-700">
            <PackageOpen className="w-10 h-10 text-orange-400 stroke-[1.5]" />
          </div>
        </div>

        {/* Console-style Micro Tag */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-1 font-mono text-[11px] text-neutral-500 tracking-wider uppercase">
          <Terminal className="w-3.5 h-3.5 text-orange-500" />
          <span>Status: Pipeline Compiling</span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl uppercase leading-[1.1]">
          Catalog Under <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 via-amber-200 to-white">
            Construction.
          </span>
        </h2>

        {/* Subtext */}
        <p className="mt-4 text-neutral-400 text-base md:text-lg font-light leading-relaxed max-w-md">
          Our digital product assets and deep-dive masterclasses are being
          rigorously compiled and tested. Production-ready resources are
          dropping soon.
        </p>

        {/* High-Tech Feature Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-neutral-900 bg-neutral-950/40 font-mono text-xs text-neutral-400 backdrop-blur-xs">
            <LayoutGrid className="w-3.5 h-3.5 text-orange-500/70" />
            <span>Premium Assets</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-neutral-900 bg-neutral-950/40 font-mono text-xs text-neutral-400 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-500/70" />
            <span>Curated Architectures</span>
          </div>
        </div>

        {/* Footnote Informational Strip */}
        <div className="mt-12 pt-6 border-t border-neutral-900/60 w-full max-w-xs">
          <p className="text-xs font-medium text-neutral-600 tracking-wide">
            STAY TUNED — UPDATES AUTOMATICALLY DISTRIBUTED
          </p>
        </div>
      </div>
    </div>
  );
}
