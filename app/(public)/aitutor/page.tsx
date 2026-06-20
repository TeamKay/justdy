"use client";

import React, { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-100 h-100 bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <section
        className="relative pt-24 pb-20 md:pt-32 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        id="waitlist"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-300 text-xs font-medium mb-6 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          Revolutionizing modern learning 24/7
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.15] bg-linear-to-b from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
          <span className="bg-linear-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            AI Tutor Coming Soon
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Stuck on a problem at 3 AM? Experience instant, hyper-personalized
          academic mastery across any subject. No judgment, just pure
          breakthroughs.
        </p>

        {/* Waitlist Form */}
        <div className="mt-10 max-w-md mx-auto">
          {submitted ? (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 font-medium text-sm">
              🎉 Awesome! You&apos;ve secured early access. We&apos;ll update
              you soon.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-2 p-1.5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur"
            >
              <input
                type="email"
                required
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent px-4 py-3 text-sm text-white placeholder-slate-500 outline-none grow rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-sm px-6 py-3 rounded-lg transition-all shadow-lg shadow-indigo-600/10 active:scale-[0.98]"
              >
                Get Early Access
              </button>
            </form>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Join 4,200+ students and professionals waiting in line.
          </p>
        </div>
      </section>
    </div>
  );
}
