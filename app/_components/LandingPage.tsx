"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, HelpCircle, Star } from "lucide-react";
import Image from "next/image";
import HeroImage from "@/public/images/hero.png";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-background min-h-screen mt-20 font-sans">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(13,44,87,0.08),transparent_60%)]" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 grid lg:grid-cols-2 gap-14 items-center relative z-10">
        {/* LEFT CONTENT */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 rounded-full bg-emerald-500/10 px-5 py-2 shadow-md border border-blue-200/20 mb-6"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute h-3 w-3 rounded-full bg-blue-400 opacity-70 animate-ping" />
              <span className="h-2.5 w-2.5 rounded-full bg-blue-300 animate-pulse" />
            </div>
            <span className="text-sm font-medium text-white tracking-wide">
              AI-Powered Personalized Learning
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0d2c57] dark:text-white leading-[1.2]">
            Elevate Your Learning
            <br />
            Anytime, Anywhere
            <br />
            <span className="text-[#f4a11a]">In Just 4 Weeks</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground dark:text-muted-foreground max-w-xl leading-relaxed">
            Experience the recorded fast students growth with live tutoring,
            AI-powered lessons, interactive practice, and structured learning
            pathways built for modern education.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/signup" className="w-full sm:w-auto">
              <button className="w-full sm:w-52 h-12 bg-[#857938] hover:bg-[#123d74] text-white font-semibold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2">
                Start Learning
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/educators" className="w-full sm:w-auto">
              <button className="w-full sm:w-52 h-12 bg-white border border-gray-300 hover:border-[#0d2c57] text-[#0d2c57] font-semibold rounded-lg transition-all flex items-center justify-center">
                Find Teachers
              </button>
            </Link>
          </div>
        </div>

        {/* RIGHT VISUAL - UPDATED WITH FLOATING CARDS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative flex justify-center items-center"
        >
          {/* Red Circle Background Accent */}
          <div className="absolute w-[80%] h-[80%] bg-red-500 rounded-full opacity-10 dark:opacity-20 blur-2xl" />
          <div className="absolute w-[70%] h-[70%] border-2 border-dashed border-red-200 dark:border-red-900/30 rounded-full animate-[spin_20s_linear_infinite]" />

          {/* Main Hero Image Wrapper */}
          <div className="relative z-10 w-full max-w-112.5">
            <Image
              src={HeroImage}
              alt="Student using tablet"
              className="relative z-20 w-full h-auto drop-shadow-2xl"
              priority
            />

            {/* Floating Card: FREE SESSION (Top Right) - NEW */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-12 -right-4 z-30 bg-white dark:bg-gray-900 p-3 rounded-md shadow-xl flex items-center gap-3 border border-emerald-100 dark:border-emerald-900/30 min-w-48"
            >
              <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg">
                <Star className="w-5 h-5 text-emerald-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0d2c57] dark:text-white leading-none">
                  1 Free Session
                </p>
                <p className="text-[10px] text-emerald-600 font-medium mt-1">
                  On Signup
                </p>
              </div>
            </motion.div>

            {/* Floating Card 1: Video Lessons (Top Left) */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -left-10 z-30 bg-white dark:bg-gray-900 p-3 rounded-md shadow-xl flex items-center gap-3 border border-gray-100 dark:border-gray-800 min-w-45"
            >
              <div className="bg-red-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#0d2c57] dark:text-white leading-none">
                  4,000+
                </p>
                <p className="text-xs text-gray-500">Video Lessons</p>
              </div>
            </motion.div>

            {/* Floating Card 2: Personalized Reporting (Mid Left) */}
            <motion.div
              animate={{ x: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-10 -left-20 z-30 bg-white dark:bg-gray-900 p-4 rounded-md shadow-2xl border border-gray-100 dark:border-gray-800 max-w-50"
            >
              <h4 className="text-sm font-bold text-[#0d2c57] dark:text-white mb-1">
                Personalized Reporting
              </h4>
              <p className="text-[10px] text-gray-400 mb-3 leading-tight">
                Get real-time improvement and mastery data
              </p>
              <div className="flex items-end gap-1 h-12">
                <div className="w-2 h-8 bg-cyan-400 rounded-full" />
                <div className="w-2 h-4 bg-cyan-200 rounded-full" />
                <div className="w-2 h-6 bg-cyan-400 rounded-full" />
                <div className="w-2 h-10 bg-cyan-400 rounded-full" />
                <div className="w-2 h-5 bg-cyan-200 rounded-full" />
                <div className="w-2 h-7 bg-cyan-400 rounded-full" />
              </div>
            </motion.div>

            {/* Floating Card 3: Assessment Questions (Mid Right) */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1/2 -right-12 z-30 bg-white dark:bg-gray-900 p-3 rounded-md shadow-xl flex items-center gap-3 border border-gray-100 dark:border-gray-800 min-w-50"
            >
              <div className="bg-cyan-50 p-2 rounded-lg">
                <HelpCircle className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#0d2c57] dark:text-white leading-none">
                  100,000+
                </p>
                <p className="text-xs text-gray-500">Assessment Questions</p>
              </div>
            </motion.div>

            {/* Chat Bubble (Bottom Right) */}
            <div className="absolute -bottom-4 right-0 z-40 bg-white dark:bg-gray-900 px-4 py-2 rounded-md shadow-lg border border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <span className="text-sm">👋 Hi! How can we help?</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
