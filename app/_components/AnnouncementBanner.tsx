"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Timer, ArrowRight } from "lucide-react";
import Link from "next/link";

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const targetDate = new Date("2026-03-20T23:59:59").getTime();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) {
        clearInterval(timer);
        return;
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 4s infinite linear;
        }
      `}</style>

      {/* Sticky Positioning: 
        'sticky top-0' keeps it at the top.
        'z-[100]' ensures it stays above Navbars.
        'backdrop-blur-md' makes it feel premium during scroll.
      */}
      <div className="top-0 z-100 flex h-10 w-full items-center overflow-hidden border-b border-white/10 bg-[#09090b]/80 px-4 backdrop-blur-md sm:px-6 shadow-2xl shadow-indigo-500/10">
        {/* The Shimmer Layer */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute inset-0 bg-linear-to-r from-transparent via-indigo-500/20 to-transparent animate-shimmer"
            style={{ width: "200%" }}
          />
        </div>

        <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
          {/* Left: Content */}
          <div className="flex items-center gap-3 p-4">
            <div className="hidden sm:flex h-5 w-5 items-center justify-center rounded bg-yellow-400/10 shrink-0">
              <Sparkles className="h-3 w-3 text-yellow-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] sm:text-[13px] font-medium text-white/90">
                First Sale:{" "}
                <span className="font-bold text-white">20% OFF</span>
              </span>
              <Link
                href="/courses"
                className="group flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Claim Now!!!{" "}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Right: Timer & Close */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 sm:px-2.5 py-0.5 ring-1 ring-inset ring-white/10">
              <Timer className="hidden xs:block h-3 w-3 text-white/40" />
              <div className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-bold text-white">
                <span className="tabular-nums">
                  {String(timeLeft.days).padStart(2, "0")}d
                </span>
                <span className="text-white/20">:</span>
                <span className="tabular-nums">
                  {String(timeLeft.hours).padStart(2, "0")}h
                </span>
                <span className="text-white/20">:</span>
                <span className="tabular-nums text-yellow-400">
                  {String(timeLeft.minutes).padStart(2, "0")}m
                </span>
                <span className="text-white/20">:</span>
                <span className="tabular-nums text-red-400">
                  {String(timeLeft.seconds).padStart(2, "0")}s
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsVisible(false)}
              className="group rounded-md p-1 transition-colors hover:bg-white/10"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5 text-white/40 group-hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
