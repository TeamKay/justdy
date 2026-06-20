"use client";

import {
  Video,
  MessageSquare,
  GraduationCap,
  ArrowRight,
  User2,
  Trophy,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function SessionPage() {
  const features = [
    {
      title: "Interactive Classrooms",
      desc: "Go beyond static viewing. Create deep engagement with structured course syllabi, module-by-module tracks, and seamless rich-text learning assignments.",
      icon: GraduationCap,
    },
    {
      title: "Vibrant Hubs & Subgroups",
      desc: "Break major channels down into micro-spaces. Members can split off into specialized reading circles, regional discussion forums, or distinct writing squads.",
      icon: Users,
    },
    {
      title: "Integrated Video Hosting",
      desc: "Upload community introductions, video lectures, and live-session archives smoothly via automated storage pipelines without forcing users away from your core platform.",
      icon: Video,
    },
    {
      title: "Gamified Member Engagement",
      desc: "Incentivize top contributors organically. Track member actions, reward deep forum insights, and award unique point tallies to build consistent, everyday retention.",
      icon: Trophy,
    },
    {
      title: "Real-Time Discussions",
      desc: "Facilitate direct peer-to-peer conversations. Fast, clean comment feeds let mentors evaluate assignments and field direct inquiries instantly in real time.",
      icon: MessageSquare,
    },
    {
      title: "Secure Member Controls",
      desc: "Delegate management authority safely. Scale up your team profiles with explicit admin controls, automated membership validations, and custom workspace rules.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-[#1A1A1A] font-sans selection:bg-[#FF5A1F]/20">
      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-10 pb-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center bg-emerald-900/10 rounded-md p-6 md:p-10 shadow-xs overflow-hidden">
          {/* Left Column: Visual Asset Panel */}
          <div className="lg:col-span-5 relative bg-background rounded-md p-8 min-h-115 flex flex-col justify-between overflow-hidden group">
            {/* Soft decorative light layer */}
            <div className="absolute inset-0 bg-radial-gradient(circle at bottom, rgba(255,90,31,0.1), transparent 70%)" />

            {/* Main Instructor Image Placeholder */}
            <div className="absolute inset-x-0 bottom-0 h-[85%] flex justify-center items-end">
              <Image
                src="/images/hero.png"
                alt="Student taking an online math class"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain drop-shadow-2xl scale-130"
              />
            </div>
          </div>

          {/* Right Column: Copy & Actions */}
          <div className="lg:col-span-7 space-y-8 lg:pl-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/40 text-white text-xs font-semibold w-fit">
              <span className="w-1.5 h-1.5 rounded-md bg-blue-700 animate-pulse" />
              Trusted by 10k+ learners
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Unlock Your
              <br />
              <span className="text-white">Math Potential</span>
            </h1>

            <p className="text-neutral-500 text-base md:text-lg max-w-xl leading-relaxed">
              Join thousands of learners advancing their careers with
              personalized learning paths and real-time progress tracking.
            </p>

            {/* Split Button Call-to-Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/signup"
                className="bg-[#FF5A1F] hover:bg-[#E04810] text-white text-sm font-semibold px-8 py-3 rounded-md transition shadow-md shadow-[#FF5A1F]/20 flex items-center gap-2 group"
              >
                Start Free
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/communities"
                className="flex items-center gap-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-sm font-semibold px-6 py-2 rounded-md transition border border-neutral-200/60 w-fit"
              >
                <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center border border-neutral-200 shadow-xs text-[#FF5A1F]">
                  <User2 className="w-2.5 h-2.5 fill-[#FF5A1F]" />
                </div>
                Communities
              </Link>
            </div>
          </div>
        </div>

        {/* COMPREHENSIVE FEATURES MATRIX */}
        <div className="mt-16 sm:mt-24 space-y-16">
          {/* HEADER */}
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              All-In-One Ecosystem
            </span>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
              Everything you need in one platform
            </h2>

            <p className="text-neutral-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Engineered beautifully to unify curriculum, content, and
              collaboration—bridging the gap between professional mentors and
              student networks.
            </p>
          </div>

          {/* GRID LAYOUT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="group relative p-6 sm:p-8 rounded-xl bg-neutral-900/40 border border-neutral-800/60 hover:border-emerald-700/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-emerald-950/20"
                >
                  {/* Decorative Subtle Background Glow on Hover */}
                  <div className="absolute inset-0 bg-linear-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div>
                    {/* ICON BOX */}
                    <div className="w-12 h-12 rounded-lg bg-emerald-950/50 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-neutral-950 transition-all duration-300 shadow-inner">
                      <Icon className="w-5 h-5 stroke-2" />
                    </div>

                    {/* TEXT CONTENT */}
                    <h3 className="font-bold text-base text-neutral-100 mb-2 group-hover:text-white transition-colors">
                      {f.title}
                    </h3>

                    <p className="text-sm text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
