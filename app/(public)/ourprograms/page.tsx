"use client";

import React, { useState } from "react";
import {
  Check,
  Award,
  TrendingUp,
  Compass,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";

export default function OurPrograms() {
  const [activeTab, setActiveTab] = useState<
    "all" | "foundation" | "growth" | "excellence"
  >("all");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

  const processSteps = [
    {
      step: "01",
      title: "Free Consultation",
      desc: "Discuss your academic goals with our lead educators.",
    },
    {
      step: "02",
      title: "Diagnostic Assessment",
      desc: "Identify core strengths and specific learning gaps.",
    },
    {
      step: "03",
      title: "Personalized Plan",
      desc: "Custom-tailored roadmap designed for optimal growth.",
    },
    {
      step: "04",
      title: "Tier Matching",
      desc: "We pair your child with the exact program tier needed.",
    },
    {
      step: "05",
      title: "Structured Learning",
      desc: "Begin interactive sessions and track ongoing mastery.",
    },
  ];

  // Price calculations based on billing cycle (15% discount for annual)
  const getPrice = (monthlyPrice: number) => {
    if (billingCycle === "annual") {
      return Math.round(monthlyPrice * 0.85);
    }
    return monthlyPrice;
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 antialiased font-sans selection:bg-indigo-500 selection:text-white relative">
      <div className="relative z-10">
        {/* Header / Hero Section */}
        <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-background backdrop-blur-md">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-slate-200 tracking-tight mb-6">
              Empower Your Child&apos;s <br className="hidden sm:inline" />
              <span className="bg-linear-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                Academic Journey
              </span>
            </h1>

            <div className="mt-8 bg-linear-to-r bg-emerald-800/20 border-indigo-800/30 p-4 rounded-xl max-w-3xl mx-auto text-center flex items-center justify-center gap-3">
              <p className="text-xs sm:text-sm text-indigo-200/90 font-medium">
                <strong>Diagnostic First:</strong> We never lock you into a
                program blindly. Recommendations are grounded in your
                child&apos;s diagnostic metrics.
              </p>
            </div>

            {/* Process Flow Timeline */}
            <div className=" mt-16 text-left">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center mb-8">
                How We Personalize Success
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                {processSteps.map((item, index) => (
                  <div
                    key={index}
                    className="relative bg-background border border-slate-800 p-4 rounded-xl flex flex-col hover:border-indigo-500/50 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800/50 px-2 py-0.5 rounded-md">
                        {item.step}
                      </span>
                      {index < processSteps.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-slate-600 hidden md:block group-hover:text-indigo-400 transition-colors" />
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-200 text-sm mb-1 group-hover:text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Tiers Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Explore Our Programs
            </h2>
            <p className="text-slate-400 mt-2 text-sm">
              Select a tier to discover feature inclusions and recommended
              profiles.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* 1. Foundation Plan */}
            {(activeTab === "all" || activeTab === "foundation") && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                      <Compass className="w-3.5 h-3.5 text-indigo-400" /> Tier 1
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 12 Weeks
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white">
                    Foundation Plan
                  </h3>
                  <p className="text-xs text-indigo-400 font-medium mt-1">
                    Build Confidence & Strengthen Core Concepts
                  </p>

                  {/* Pricing Display */}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      ${getPrice(149)}
                    </span>
                    <span className="text-xs text-slate-400">/month</span>
                    {billingCycle === "annual" && (
                      <span className="text-[10px] text-slate-500 line-through ml-1">
                        $119
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    Designed for students struggling with learning gaps or low
                    classroom confidence who need structured reinforcement.
                  </p>

                  <hr className="my-6 border-slate-800" />

                  <div className="mb-6">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Recommended Profile
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span> Students
                        earning C&apos;s or below
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span> Struggling
                        with fundamental homework
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span> Lacking
                        confidence in STEM subjects
                      </li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Key Inclusions
                    </h4>
                    <ul className="space-y-3 text-xs text-slate-300">
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Diagnostic consultation & baseline test</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>1x 60-min live weekly instruction</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Guided practice aligned to school syllabus</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Bi-weekly parent progress reports</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <button className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center justify-center gap-2 group">
                    Subscribe Now{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. Academic Growth Plan (Featured) */}
            {(activeTab === "all" || activeTab === "growth") && (
              <div className="bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-2 border-indigo-500/80 rounded-2xl p-8 flex flex-col justify-between relative shadow-2xl shadow-indigo-950/50 scale-[1.02] transition-all duration-300">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                  Most Popular Choice
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />{" "}
                      Tier 2
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 12 Weeks
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white">
                    Academic Growth Plan
                  </h3>
                  <p className="text-xs text-indigo-300 font-medium mt-1">
                    Accelerate Progress & Improve Exam Grades
                  </p>

                  {/* Pricing Display */}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      ${getPrice(279)}
                    </span>
                    <span className="text-xs text-slate-400">/month</span>
                    {billingCycle === "annual" && (
                      <span className="text-[10px] text-slate-500 line-through ml-1">
                        $279
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    Ideal for students who grasp basic concepts but need
                    structure to elevate test scores and conquer advanced
                    coursework.
                  </p>

                  <hr className="my-6 border-slate-800" />

                  <div className="mb-6">
                    <h4 className="text-[11px] font-bold text-indigo-300/60 uppercase tracking-wider mb-3">
                      Recommended Profile
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span> Students
                        aiming for B+ to A grades
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span> Transitioning
                        into advanced/honors math
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span> Needing
                        consistent weekly accountability
                      </li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-[11px] font-bold text-indigo-300/60 uppercase tracking-wider mb-3">
                      Includes Everything in Tier 1 Plus
                    </h4>
                    <ul className="space-y-3 text-xs text-slate-200">
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <span>2x live lessons per week</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <span>Dedicated challenging homework help</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <span>Monthly 1-on-1 virtual parent conference</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <span>Study skills & time-management coaching</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <button className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group">
                    Subscribe Now{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* 3. Academic Excellence Plan */}
            {(activeTab === "all" || activeTab === "excellence") && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                      <Award className="w-3.5 h-3.5 text-amber-400" /> Tier 3
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Ongoing
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white">
                    Excellence Plan
                  </h3>
                  <p className="text-xs text-amber-400 font-medium mt-1">
                    1-on-1 Coaching & Complete Academic Mentorship
                  </p>

                  {/* Pricing Display */}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      ${getPrice(499)}
                    </span>
                    <span className="text-xs text-slate-400">/month</span>
                    {billingCycle === "annual" && (
                      <span className="text-[10px] text-slate-500 line-through ml-1">
                        $499
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    Our elite tier offering personalized mentorship, instant
                    teacher feedback, and strategic preparation for top
                    achievements.
                  </p>

                  <hr className="my-6 border-slate-800" />

                  <div className="mb-6">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Recommended Profile
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span> High
                        achievers preparing for competition/AP math
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span> Families
                        seeking direct daily communications
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span> Long-term
                        holistic mindset development
                      </li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Includes Everything in Tier 2 Plus
                    </h4>
                    <ul className="space-y-3 text-xs text-slate-300">
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Direct parent-mentor messaging channel</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Dedicated online portal & live materials</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Customized supplemental worksheets & videos</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Academic goal setting & mindset coaching</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <button className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center justify-center gap-2 group">
                    Subscribe Now{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Feature Matrix Table */}
        <section className="py-16 bg-slate-900/40 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Detailed Feature Matrix
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                A side-by-side comparison to help you choose the right
                commitment level.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-200">
                    <th className="p-4 font-semibold">Plan Features</th>
                    <th className="p-4 font-semibold text-center w-1/4 text-slate-400">
                      Foundation ($149/mo)
                    </th>
                    <th className="p-4 font-semibold text-center w-1/4 text-indigo-400 bg-indigo-950/20">
                      Growth ($279/mo)
                    </th>
                    <th className="p-4 font-semibold text-center w-1/4 text-slate-400">
                      Excellence ($499/mo)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="p-4 font-medium">Diagnostic Evaluation</td>
                    <td className="p-4 text-center">
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center bg-indigo-950/10">
                      <Check className="w-4 h-4 text-indigo-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Custom Academic Roadmap</td>
                    <td className="p-4 text-center">
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center bg-indigo-950/10">
                      <Check className="w-4 h-4 text-indigo-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">
                      Live Instruction Frequency
                    </td>
                    <td className="p-4 text-center text-slate-400">
                      1x / week
                    </td>
                    <td className="p-4 text-center text-indigo-300 font-semibold bg-indigo-950/10">
                      2x / week
                    </td>
                    <td className="p-4 text-center text-slate-200 font-medium">
                      Custom / Unlimited
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">
                      Dedicated Homework Assistance
                    </td>
                    <td className="p-4 text-center text-slate-600">
                      <X className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="p-4 text-center bg-indigo-950/10">
                      <Check className="w-4 h-4 text-indigo-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">
                      Parent Progress Briefings
                    </td>
                    <td className="p-4 text-center text-slate-400 text-xs">
                      Bi-Weekly Email
                    </td>
                    <td className="p-4 text-center text-indigo-300 text-xs bg-indigo-950/10">
                      Monthly Conference
                    </td>
                    <td className="p-4 text-center text-slate-300 text-xs">
                      Weekly Detailed Reports
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">
                      Study Skills & Test Tactics
                    </td>
                    <td className="p-4 text-center text-slate-600">
                      <X className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="p-4 text-center bg-indigo-950/10">
                      <Check className="w-4 h-4 text-indigo-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Direct Mentor Messaging</td>
                    <td className="p-4 text-center text-slate-600">
                      <X className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="p-4 text-center text-slate-600 bg-indigo-950/10">
                      <X className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA Callout */}
        <section className="py-20 px-4 text-center relative overflow-hidden">
          <div className="max-w-3xl mx-auto bg-linear-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 p-10 rounded-3xl backdrop-blur-xl relative z-10 shadow-2xl">
            <h2 className="text-3xl font-extrabold text-white mb-4">
              Ready to See Measurable Growth?
            </h2>
            <p className="text-slate-300 text-sm mb-8 leading-relaxed max-w-xl mx-auto">
              Book a no-obligation consultation today. We&apos;ll perform an
              initial diagnostic assessment and build a custom Academic Success
              Plan for your child.
            </p>
            <button className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3.5 px-8 rounded-xl shadow-xl shadow-indigo-500/20 transition-all text-sm">
              Book Your Free Consultation
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
