"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import HeroImage from "@/public/images/hero.png";
import { BookOpen, Brain, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative w-full min-h-[90vh] bg-background text-foreground overflow-hidden font-sans">
      {/* FLOATING GLOWS */}
      <div className="absolute top-1/4 left-1/4 w-100 h-100 bg-blue-500/10 blur-[140px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-75 h-75 bg-[#857938]/10 blur-[120px] rounded-full" />

      <div className="relative z-10 container mx-auto px-6 md:px-10 pt-24 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          {/* LEFT */}
          <div className="space-y-8 text-center md:text-left">
            {/* BADGE */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/50 dark:bg-blue-950/20"
            >
              <div className="inline-flex items-center gap-2 text-xs tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                AI-powered learning platform
              </div>
            </motion.div>
            {/* TITLE */}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              // Merge your classes here
              className="text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight"
            >
              Elevate Your Learning
              <span className="block text-[#857938] dark:text-[#857938]">
                anytime, anywhere
              </span>
            </motion.h1>
            {/* DESCRIPTION */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl text-gray-400 text-sm md:text-lg leading-relaxed"
            >
              Join a premium learning platform combining live tutoring,
              AI-powered explanations, and structured practice designed to
              accelerate your mathematical mastery.
            </motion.p>
            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/signup">
                <Button className="px-8 py-6 text-sm font-semibold bg-[#857938] hover:bg-[#4e471b] transition text-white shadow-lg">
                  Get Started →
                </Button>
              </Link>

              <Link href="/educators">
                <Button
                  variant="outline"
                  className="px-8 py-6 text-sm font-semibold"
                >
                  Find Teacher
                </Button>
              </Link>
            </div>
            {/* FEATURES */}
            {/* MICRO FEATURES */}
            <div className="flex flex-wrap gap-6 pt-6 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4" /> Live Tutors
              </span>
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Structured Courses
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Adaptive AI
              </span>
            </div>
          </div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative flex justify-center md:justify-end"
          >
            <div className="relative w-full max-w-md md:max-w-lg">
              {/* glow */}
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-3xl" />

              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
                <Image
                  src={HeroImage}
                  alt="Hero"
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// "use client";

// import Link from "next/link";
// import { Button } from "./ui/button";

// export default function Hero() {
//   return (
//     <section className="relative w-full min-h-[70vh] bg-background text-foreground overflow-hidden font-sans">
//       {/* 1. Adaptive Grid Background - Low Brightness & Tight Gradient */}
//       <div
//         className="absolute inset-0
//         /* Light Mode: Extremely faint dark lines */
//         bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)]
//         /* Dark Mode: Extremely faint white lines */
//         dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]
//         bg-size-[20px_20px]
//         mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_85%,transparent_100%)]"
//       />

//       {/* 2. REFINED HERO GLOW - Reduced opacity for a cleaner look */}
//       <div
//         className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-100
//         bg-blue-400/10 dark:bg-blue-600/5 blur-[140px] rounded-full pointer-events-none"
//       />

//       <div className="relative z-10 container mx-auto px-4 md:px-8 pt-30 pb-12 text-center">
//         {/* Floating AI Badge */}
//         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50 mb-8 animate-bounce-slow">
//           <span className="relative flex h-2 w-2">
//             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
//             <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
//           </span>
//           <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">
//             Start with a Free Session Today!
//           </span>
//         </div>

//         <div className=" flex flex-col items-center justify-center px-6 text-center">
//           <div className="max-w-4xl space-y-6">
//             <h1 className="font-sans font-bold tracking-tight">
//               <span className="block text-5xl md:text-7xl dark:text-white text-black">
//                 Math Made Simple
//               </span>
//               <span className="block mt-4 md:mt-1 text-5xl md:text-6xl text-[#857938]">
//                 Think Deeper. Solve Smarter.
//               </span>
//             </h1>

//             <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed font-normal">
//               Build mathematical confidence with live classes, AI-powered
//               tutoring, and expert-led courses designed to help you think deeper
//               and solve smarter.
//             </p>
//           </div>
//         </div>

//         {/* Buttons */}
//         <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
//           <Link href="/signup" className="w-full max-w-xs sm:w-auto">
//             <Button className="group rounded-sm px-10 py-6 text-sm w-full sm:min-w-55 font-semibold shadow-lg shadow-[#c9b857]/20 bg-[#857938] hover:bg-[#857938] hover:scale-105 transition-all text-white border-none">
//               Get Started
//               <span className="ml-2 group-hover:translate-x-1 transition-transform">
//                 →
//               </span>
//             </Button>
//           </Link>

//           <Link href="/live-session" className="w-full max-w-xs sm:w-auto">
//             <Button
//               variant="outline"
//               className="relative rounded-sm px-10 py-6 text-sm w-full sm:min-w-55 font-semibold hover:bg-accent transition-all overflow-hidden"
//             >
//               <span className="flex items-center justify-center gap-2">
//                 <span className="h-1.5 w-1.5 rounded-sm bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
//                 Free Session
//               </span>
//             </Button>
//           </Link>
//         </div>

//         {/* Status List - Added mt-20 for better breathing room */}
//         <div className="mt-20 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[13px] font-medium text-gray-500/80">
//           <div className="flex items-center gap-2">
//             <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
//             <p>Interactive Online Courses</p>
//           </div>

//           <div className="flex items-center gap-2">
//             <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
//             <p>Expert-led Live Sessions</p>
//           </div>

//           <div className="flex items-center gap-2">
//             <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"></span>
//             <p>AI - Powered Tutoring</p>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }
