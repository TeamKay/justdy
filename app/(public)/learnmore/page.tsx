"use client";

import React from "react";
import {
  Video,
  Calendar,
  MessageSquare,
  GraduationCap,
  UserCog,
  Brain,
  BookOpen,
  Wallet,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function SessionPage() {
  const roles = [
    {
      title: "Learn as a Student",
      desc: "Join live classes, book tutors, use AI support, and track progress.",
      icon: GraduationCap,
      href: "/signup?role=student",
      accent: "from-emerald-400 to-teal-500",
    },
    {
      title: "Teach as a Tutor",
      desc: "Create courses, host sessions, chat with learners, and earn payouts.",
      icon: UserCog,
      href: "/signup?role=tutor",
      accent: "from-cyan-400 to-emerald-500",
    },
  ];

  const features = [
    {
      title: "Live Sessions",
      desc: "Video classrooms with real-time collaboration.",
      icon: Video,
    },
    {
      title: "Smart Scheduling",
      desc: "Instant booking between tutors and learners.",
      icon: Calendar,
    },
    {
      title: "Community Hub",
      desc: "Discussions, Q&A, and shared learning spaces.",
      icon: MessageSquare,
    },
    {
      title: "AI Tutor",
      desc: "Instant explanations and guided learning support.",
      icon: Brain,
    },
    {
      title: "Courses",
      desc: "Structured lessons and learning paths.",
      icon: BookOpen,
    },
    {
      title: "Earnings",
      desc: "Transparent payouts and revenue tracking.",
      icon: Wallet,
    },
  ];

  return (
    <div className="min-h-screen bg-[#050705] text-white relative overflow-hidden">
      {/* background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-12 py-14 space-y-16">
        {/* HERO */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-md bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Learning Platform
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Learn. Teach. <span className="text-emerald-400">Grow Faster.</span>
          </h1>

          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
            A unified ecosystem for live tutoring, AI-assisted learning,
            structured courses, and community-driven education.
          </p>
        </div>

        {/* ROLE CARDS */}
        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((role, i) => {
            const Icon = role.icon;

            return (
              <Link
                key={i}
                href={role.href}
                className="group relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all"
              >
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
                      <Icon className="w-5 h-5 text-emerald-300" />
                    </div>
                    <h2 className="text-lg font-semibold">{role.title}</h2>
                  </div>

                  <p className="text-sm text-gray-400">{role.desc}</p>

                  <div className="mt-5 inline-flex items-center gap-2 text-emerald-300 text-sm">
                    Continue{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* FEATURES */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">
            Everything you need in one platform
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;

              return (
                <div
                  key={i}
                  className="p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                >
                  <Icon className="w-5 h-5 text-emerald-300 mb-3" />
                  <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-400">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-6 text-center">
            How it works
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {["Sign Up", "Choose Role", "Join Community", "Start Learning"].map(
              (step, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-300 font-semibold">
                    {i + 1}
                  </div>
                  <p className="text-sm mt-2 text-gray-300">{step}</p>
                </div>
              ),
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-10 rounded-2xl border border-emerald-400/20 bg-linear-to-r from-emerald-500/10 via-transparent to-transparent">
          <h2 className="text-2xl font-bold mb-2">
            Ready to transform your learning experience?
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            Join learners and tutors already building the future of education.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
