import Link from "next/link";
import React from "react";

export default function AiIntegrationBanner() {
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-6 md:p-12 font-sans overflow-hidden select-none">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
        {/* LEFT SIDE: SMARTPHONE & ROBOT GRAPHIC */}
        <div className="lg:col-span-6 flex items-center justify-center relative min-h-112.5 md:min-h-137.5">
          {/* Ambient Glow Effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400/40 rounded-full blur-[80px] animate-pulse" />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-cyan-300/20 rounded-full blur-[100px]" />

          {/* Holographic Data UI Floating Shapes */}
          <div className="absolute left-[10%] top-[20%] w-10 h-10 border border-white/20 rounded-xl rotate-12 backdrop-blur-sm flex items-center justify-center text-white/40 text-xs">
            ✕
          </div>
          <div className="absolute right-[15%] top-[30%] w-8 h-8 border border-white/20 rounded-md -rotate-12 backdrop-blur-sm" />
          <div className="absolute left-[8%] bottom-[25%] w-12 h-12 border border-white/10 rounded-lg rotate-45 backdrop-blur-sm" />

          {/* Smartphone Container */}
          <div className="relative w-64 h-120 bg-linear-to-b from-white/10 to-white/5 rounded-[40px] border border-white/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md transform -rotate-6 flex flex-col justify-between p-4 overflow-hidden group hover:rotate-0 transition-transform duration-700 ease-out">
            {/* Top Speaker/Camera Bar */}
            <div className="w-20 h-4 bg-black/30 rounded-full mx-auto mb-2 flex items-center justify-end px-2">
              <div className="w-2 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Glowing UI Wireframes inside Phone */}
            <div className="flex-1 w-full border border-white/10 rounded-2xl p-3 flex flex-col justify-between bg-linear-to-b from-white/5 to-transparent">
              <div className="flex justify-between items-center">
                <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] text-white font-mono tracking-wider">
                  12:47
                </div>
                <div className="w-4 h-2 bg-white/40 rounded-sm" />
              </div>

              {/* Chart Lines Simulation */}
              <div className="space-y-2 opacity-60">
                <div className="h-1 bg-linear-to-r from-cyan-400 to-transparent rounded-full w-3/4" />
                <div className="h-1 bg-linear-to-r from-blue-400 to-transparent rounded-full w-1/2" />
                <div className="h-1 bg-linear-to-r from-white/30 to-transparent rounded-full w-5/6" />
              </div>
            </div>
          </div>

          {/* FLOATING 3D-STYLE ROBOT */}
          <div className="absolute top-[18%] left-[22%] transform translate-x-4 -translate-y-4 filter drop-shadow-[0_35px_35px_rgba(0,0,0,0.6)] animate-bounce animation-duration-[5s] flex flex-col items-center">
            {/* Head */}
            <div className="w-44 h-32 bg-linear-to-b from-white via-slate-100 to-slate-200 rounded-[50px] shadow-inner relative flex items-center justify-center p-4 border-b-4 border-slate-300">
              {/* Glossy Reflection overlay */}
              <div className="absolute top-2 left-6 right-6 h-6 bg-white/60 rounded-full blur-[1px]" />

              {/* Screen Face */}
              <div className="w-[85%] h-[80%] bg-[#09152e] rounded-[35px] flex items-center justify-center gap-5 p-2 shadow-inner border border-black/50">
                {/* Glowing Blue Eyes */}
                <div className="w-8 h-8 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee] animate-pulse" />
                <div className="w-8 h-8 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee] animate-pulse" />
              </div>

              {/* Headphones/Ears */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-5 h-14 bg-slate-400 rounded-l-xl shadow-md border-r border-slate-500" />
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-5 h-14 bg-slate-400 rounded-r-xl shadow-md border-l border-slate-500" />
            </div>

            {/* Neck Connection */}
            <div className="w-12 h-3 bg-slate-400/80 -mt-1 shadow-inner" />

            {/* Body */}
            <div className="w-36 h-24 bg-linear-to-b from-white to-slate-200 rounded-[40px] relative shadow-lg border-b-4 border-slate-300 flex items-center justify-center">
              {/* Decorative Chest Line */}
              <div className="w-16 h-1 bg-slate-300 rounded-full absolute top-4" />

              {/* Left Arm */}
              <div className="absolute -left-6 top-4 w-6 h-14 bg-white rounded-full origin-top rotate-12 shadow-md border-b-2 border-slate-300" />
              {/* Right Arm */}
              <div className="absolute -right-6 top-4 w-6 h-14 bg-white rounded-full origin-top -rotate-12 shadow-md border-b-2 border-slate-300" />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: TYPOGRAPHY BANNER CONTENT */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
          {/* Small Branding Header */}
          <div className="flex items-center gap-1 tracking-wider text-xs font-black text-[#0d2c7f] bg-white px-3 py-1 rounded-md shadow-sm">
            24/7 <span className="text-blue-600">AI Tutor</span>
          </div>

          {/* Dynamic Typography Stack */}
          <div className="space-y-1">
            <h3 className="text-white text-2xl md:text-2xl font-medium tracking-tight drop-shadow-sm">
              Explore the Future of Learning with Our
            </h3>
            <h1 className="text-5xl md:text-7xl font-black text-[#f0f022] tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] bg-clip-text bg-linear-to-b from-white via-white to-blue-100 py-1">
              Smart Tutor
            </h1>
          </div>

          {/* Pill-shaped Container for Subtitle */}
          <Link
            href="/ai-tutor"
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#857938] border border-neutral-700 px-10 py-3 rounded-lg transition-all duration-300 hover:bg-neutral-700 hover:border-neutral-600"
          >
            Try it now
          </Link>
        </div>
      </div>
    </div>
  );
}
