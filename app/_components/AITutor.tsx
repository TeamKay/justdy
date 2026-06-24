"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
  Brain,
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function AiIntegrationBannerAlternative() {
  const [messages] = useState([
    { role: "user", text: "Can you explain how to find the derivative of x²?" },
    {
      role: "assistant",
      text: "Bring the exponent down to the front (2) and subtract 1 from the power. So, f'(x) = 2x! Try x³ next.",
    },
  ]);

  return (
    <section className="relative overflow-hidden py-24 bg-background">
      {/* Blueprint Topographic Dot Matrix Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Cybernetic Core Lighting Halos */}
      <div className="absolute top-1/4 left-1/4 w-125 h-125 bg-blue-500/10 blur-[130px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-100 h-100 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* LEFT COLUMN: Modern Glassmorphic AI Chat Simulator Simulation (Spans 6) */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Micro Category Badge */}
            <div className="inline-flex items-center gap-2 rounded-md border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-xs font-semibold text-blue-400 uppercase tracking-widest">
              <Brain className="w-3.5 h-3.5" />
              <span>Adaptive Intelligence</span>
            </div>

            {/* Structured Headings Hierarchy */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
              Explore the Future <br />
              of Learning with an <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-cyan-200 to-white">
                Intelligent Tutor.
              </span>
            </h1>

            <p className="max-w-xl text-neutral-400 text-base md:text-lg leading-relaxed font-light">
              Get personalized step-by-step math breakdowns, instant vector
              dynamic corrections, and targeted curriculum feedback 24 hours a
              day.
            </p>

            {/* Core Action Call Target Link */}
            <div className="pt-4 w-full sm:w-auto">
              <Link
                href="/"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2 rounded-md bg-[#857938] text-white font-bold shadow-[0_4px_20px_-5px_rgba(59,130,246,0.4)] transition-all duration-300 hover:bg-blue-400 hover:shadow-[0_4px_24px_-2px_rgba(59,130,246,0.5)] hover:-translate-y-0.5"
              >
                <span>Launch Smart Tutor</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Editorial Clean Value Core Block (Spans 6) */}

          <div className="lg:col-span-6 relative w-full max-w-lg mx-auto lg:max-w-none">
            {/* Underlying technical geometry brackets */}
            <div className="absolute -inset-4 border border-neutral-800/40 rounded-3xl mask-[linear-gradient(to_bottom,black_30%,transparent_100%)] hidden sm:block" />

            {/* Main Interactive Sandbox Mockup Frame */}
            <div className="relative rounded-2xl border border-neutral-800/80 bg-neutral-950/60 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Window Header Utility Tab */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-900 bg-neutral-900/30">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10 text-blue-400">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-mono tracking-wider text-neutral-400">
                    justdy_core_tutor.sh
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
                    Active Engine
                  </span>
                </div>
              </div>

              {/* Chat Thread Body Area */}
              <div className="p-6 space-y-4 min-h-64 flex flex-col justify-end">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-[85%] ${
                      msg.role === "user"
                        ? "ml-auto flex-row-reverse"
                        : "mr-auto"
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-md shrink-0 flex items-center justify-center border text-xs ${
                        msg.role === "user"
                          ? "bg-neutral-900 border-neutral-800 text-neutral-300"
                          : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div
                      className={`rounded-xl p-3.5 text-sm leading-relaxed shadow-xs ${
                        msg.role === "user"
                          ? "bg-neutral-900 border border-neutral-800 text-neutral-200"
                          : "bg-neutral-900/40 border border-neutral-800/50 text-neutral-300"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dummy input bar action wrapper */}
              <div className="p-4 border-t border-neutral-950 bg-neutral-900/20 flex items-center gap-3">
                <div className="flex-1 text-xs text-neutral-600 font-mono bg-neutral-950/60 border border-neutral-900 rounded-lg px-3 py-2.5 flex items-center justify-between">
                  <span>Type a math system formula...</span>
                  <Send className="w-3 h-3 text-neutral-700" />
                </div>
              </div>
            </div>

            {/* Micro Floating Diagnostic Node */}
            <div className="absolute -bottom-6 -right-4 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 shadow-xl hidden sm:flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-[11px] font-mono text-neutral-300 tracking-wide">
                Context Window: Optimized
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
