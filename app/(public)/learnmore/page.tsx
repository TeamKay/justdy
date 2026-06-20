"use client";

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
  User2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function SessionPage() {
  const roles = [
    {
      title: "Learn as a Student",
      desc: "Join live classes, book tutors, use AI support, and track progress.",
      icon: GraduationCap,
      href: "/signup?role=student",
    },
    {
      title: "Teach as a Tutor",
      desc: "Create courses, host sessions, chat with learners, and earn payouts.",
      icon: UserCog,
      href: "/signup?role=tutor",
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
    <div className="min-h-screen bg-background text-[#1A1A1A] font-sans selection:bg-[#FF5A1F]/20">
      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-10 pb-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center bg-emerald-900/10 rounded-md p-6 md:p-10 shadow-xs overflow-hidden">
          {/* Left Column: Visual Asset Panel */}
          <div className="lg:col-span-5 relative bg-background rounded-2xl p-8 min-h-115 flex flex-col justify-between overflow-hidden group">
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 text-white text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-700 animate-pulse" />
              Trusted by 10k+ learners
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Master New Skills <br />
              <span className="text-white">Track Your Progress</span>
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
              <button className="flex items-center gap-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-sm font-semibold px-6 py-2 rounded-md transition border border-neutral-200/60">
                <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center border border-neutral-200 shadow-xs text-[#FF5A1F]">
                  <User2 className="w-2.5 h-2.5 fill-[#FF5A1F]" />
                </div>
                Communities
              </button>
            </div>
          </div>
        </div>

        {/* ROLE CARDS SELECTION */}
        <div className="grid md:grid-cols-2 gap-6 mt-16">
          {roles.map((role, i) => {
            const Icon = role.icon;
            return (
              <Link
                key={i}
                href={role.href}
                className="group relative p-8 rounded-md bg-emerald-900/10 hover:border-[#FF5A1F]/30 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-md bg-[#FF5A1F]/5 border border-[#FF5A1F]/10 group-hover:bg-[#FF5A1F] group-hover:text-white transition-colors duration-300 text-[#FF5A1F]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-bold text-white">
                      {role.title}
                    </h2>
                    <p className="text-sm text-white/40 leading-relaxed">
                      {role.desc}
                    </p>
                    <div className="pt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5A1F]">
                      Get Started{" "}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* COMPREHENSIVE FEATURES MATRIX */}
        <div className="mt-20 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Everything you need in one platform
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto text-sm">
              Engineered beautifully to connect professional mentors and student
              communities.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-md bg-emerald-900/10 hover:shadow-xs transition"
                >
                  <div className="w-10 h-10 rounded-md bg-neutral-50 flex items-center justify-center text-neutral-800 mb-4 border border-neutral-100">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-white mb-1">
                    {f.title}
                  </h3>
                  <p className="text-xs text-white leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

// "use client";

// import React from "react";
// import {
//   Video,
//   Calendar,
//   MessageSquare,
//   GraduationCap,
//   UserCog,
//   Brain,
//   BookOpen,
//   Wallet,
//   ArrowRight,
//   Sparkles,
// } from "lucide-react";
// import Link from "next/link";

// export default function SessionPage() {
//   const roles = [
//     {
//       title: "Learn as a Student",
//       desc: "Join live classes, book tutors, use AI support, and track progress.",
//       icon: GraduationCap,
//       href: "/signup?role=student",
//       accent: "from-emerald-400 to-teal-500",
//     },
//     {
//       title: "Teach as a Tutor",
//       desc: "Create courses, host sessions, chat with learners, and earn payouts.",
//       icon: UserCog,
//       href: "/signup?role=tutor",
//       accent: "from-cyan-400 to-emerald-500",
//     },
//   ];

//   const features = [
//     {
//       title: "Live Sessions",
//       desc: "Video classrooms with real-time collaboration.",
//       icon: Video,
//     },
//     {
//       title: "Smart Scheduling",
//       desc: "Instant booking between tutors and learners.",
//       icon: Calendar,
//     },
//     {
//       title: "Community Hub",
//       desc: "Discussions, Q&A, and shared learning spaces.",
//       icon: MessageSquare,
//     },
//     {
//       title: "AI Tutor",
//       desc: "Instant explanations and guided learning support.",
//       icon: Brain,
//     },
//     {
//       title: "Courses",
//       desc: "Structured lessons and learning paths.",
//       icon: BookOpen,
//     },
//     {
//       title: "Earnings",
//       desc: "Transparent payouts and revenue tracking.",
//       icon: Wallet,
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-[#050705] text-white relative overflow-hidden">
//       {/* background glow */}
//       <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_50%)]" />

//       <div className="relative max-w-7xl mx-auto px-12 py-14 space-y-16">
//         {/* HERO */}
//         <div className="text-center space-y-5">
//           <div className="inline-flex items-center gap-2 px-4 py-1 rounded-md bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs">
//             <Sparkles className="w-3.5 h-3.5" />
//             Next-Gen Learning Platform
//           </div>

//           <h1 className="text-4xl md:text-5xl font-bold leading-tight">
//             Learn. Teach. <span className="text-emerald-400">Grow Faster.</span>
//           </h1>

//           <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
//             A unified ecosystem for live tutoring, AI-assisted learning,
//             structured courses, and community-driven education.
//           </p>
//         </div>

//         {/* ROLE CARDS */}
//         <div className="grid md:grid-cols-2 gap-6">
//           {roles.map((role, i) => {
//             const Icon = role.icon;

//             return (
//               <Link
//                 key={i}
//                 href={role.href}
//                 className="group relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all"
//               >
//                 <div className="relative">
//                   <div className="flex items-center gap-3 mb-3">
//                     <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
//                       <Icon className="w-5 h-5 text-emerald-300" />
//                     </div>
//                     <h2 className="text-lg font-semibold">{role.title}</h2>
//                   </div>

//                   <p className="text-sm text-gray-400">{role.desc}</p>

//                   <div className="mt-5 inline-flex items-center gap-2 text-emerald-300 text-sm">
//                     Continue{" "}
//                     <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
//                   </div>
//                 </div>
//               </Link>
//             );
//           })}
//         </div>

//         {/* FEATURES */}
//         <div className="space-y-6">
//           <h2 className="text-2xl font-semibold text-center">
//             Everything you need in one platform
//           </h2>

//           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//             {features.map((f, i) => {
//               const Icon = f.icon;

//               return (
//                 <div
//                   key={i}
//                   className="p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
//                 >
//                   <Icon className="w-5 h-5 text-emerald-300 mb-3" />
//                   <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
//                   <p className="text-xs text-gray-400">{f.desc}</p>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* HOW IT WORKS */}
//         <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
//           <h2 className="text-xl font-semibold mb-6 text-center">
//             How it works
//           </h2>

//           <div className="grid md:grid-cols-4 gap-6">
//             {["Sign Up", "Choose Role", "Join Community", "Start Learning"].map(
//               (step, i) => (
//                 <div key={i} className="text-center">
//                   <div className="mx-auto w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-300 font-semibold">
//                     {i + 1}
//                   </div>
//                   <p className="text-sm mt-2 text-gray-300">{step}</p>
//                 </div>
//               ),
//             )}
//           </div>
//         </div>

//         {/* CTA */}
//         <div className="text-center p-10 rounded-2xl border border-emerald-400/20 bg-linear-to-r from-emerald-500/10 via-transparent to-transparent">
//           <h2 className="text-2xl font-bold mb-2">
//             Ready to transform your learning experience?
//           </h2>
//           <p className="text-sm text-gray-400 mb-5">
//             Join learners and tutors already building the future of education.
//           </p>

//           <Link
//             href="/signup"
//             className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold"
//           >
//             Get Started <ArrowRight className="w-4 h-4" />
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }
