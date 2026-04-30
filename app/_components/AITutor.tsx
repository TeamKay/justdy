import React, { ReactNode } from "react";
import { BotIcon, BarChart3, Database, Cloud, Grid3X3 } from "lucide-react";

type GlassCardProps = {
  title: string;
  icon: ReactNode;
  desc: string;
};

export default function AiBotInterface() {
  return (
    <div className="min-h-screen bg-background text-gray-400 relative overflow-hidden font-sans">
      {/* FLOATING DATA LINES */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-px h-40 bg-blue-500/20 rotate-45" />
        <div className="absolute top-1/2 right-1/3 w-px h-52 bg-blue-500/10 -rotate-12" />
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-12 gap-8 z-10">
        {/* HERO */}
        <div className="md:col-span-12 flex flex-col items-center justify-center mb-10">
          <h1 className="text-white text-3xl md:text-3xl font-semibold mt-6">
            AI Learning System
          </h1>
          <p className="text-gray-500 mt-2 text-center max-w-md">
            An intelligent tutoring platform that adapts to each student,
            delivers real-time explanations, and accelerates mastery with AI.
          </p>

          {/* BOT */}
          <div className="relative pt-5">
            <div className="absolute inset-0 rounded-full blur-3xl bg-blue-600/30 animate-pulse" />

            <div className="w-56 h-56 bg-white rounded-full flex flex-col items-center justify-center border border-white/20 shadow-2xl relative">
              <div className="flex gap-4 mb-4">
                <div className="w-12 h-6 bg-blue-600 rounded-full" />
                <div className="w-12 h-6 bg-blue-600 rounded-full" />
              </div>
              <div className="w-20 h-2 bg-blue-300 rounded-full" />
            </div>

            {/* EARS */}
            <div className="absolute top-1/2 -left-8 -translate-y-1/2 w-12 h-20 bg-white/80 backdrop-blur rounded-l-3xl" />
            <div className="absolute top-1/2 -right-8 -translate-y-1/2 w-12 h-20 bg-white/80 backdrop-blur rounded-r-3xl" />
          </div>
        </div>

        {/* LEFT */}
        <div className="md:col-span-4">
          <GlassCard
            title="Student Identity & Profiles"
            icon={<Grid3X3 className="w-5 h-5 text-blue-400" />}
            desc="Secure student accounts with personalized profiles, learning history, and progress tracking."
          />
        </div>

        {/* CENTER */}
        <div className="md:col-span-4 flex flex-col gap-6 items-center">
          <GlassCard
            title="AI Tutor Engine"
            icon={<BotIcon className="w-5 h-5 text-blue-400" />}
            desc="Real-time AI explanations, adaptive questioning, and intelligent guidance tailored to each learner."
          />
        </div>

        {/* RIGHT */}
        <div className="md:col-span-4">
          <GlassCard
            title="Learning Data System"
            icon={<Database className="w-5 h-5 text-blue-400" />}
            desc="Stores student interactions, performance data, and learning patterns to continuously improve recommendations."
          />
        </div>

        {/* BOTTOM LEFT */}
        <div className="md:col-span-6">
          <GlassCard
            title="Interactive Learning API"
            icon={<Cloud className="w-5 h-5 text-blue-400" />}
            desc="Delivers real-time sessions, voice tutoring, and seamless AI interactions across devices."
          />
        </div>

        {/* BOTTOM RIGHT */}
        <div className="md:col-span-6">
          <GlassCard
            title="AI Learning Analytics"
            icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
            desc="Tracks progress, identifies weak areas, and provides actionable insights to accelerate student performance."
          />
        </div>
      </div>
    </div>
  );
}

/* GLASS CARD */
const GlassCard = ({ title, icon, desc }: GlassCardProps) => {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-background blur-2xl opacity-0 group-hover:opacity-100 transition" />

      <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <h3 className="text-white font-medium">{title}</h3>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};
