"use client";

import React, { useRef } from "react";
import { ArrowRight } from "lucide-react";

export default function InformationCard() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-4 relative">
      {/* Outer Banner Container */}
      <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-emerald-900 via-emerald-900/60 to-emerald-900/20 p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch gap-6">
          {/* Left CTA Column */}
          <div className="lg:w-2/4 flex flex-col justify-between shrink-0 pr-2">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight mb-3">
                Expert Tutoring Session with proven success record.
              </h2>
              <p className="text-xs md:text-sm text-blue-50 leading-relaxed font-normal">
                No prior experience needed to get started.
              </p>
            </div>

            <div className="mt-6">
              <button className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer">
                Explore programs <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Content Column */}
          <div className="lg:w-2/4 flex flex-col justify-between min-w-0">
            {/* Category Filter Pills & Scroll Controls */}

            {/* Horizontal Scrollable Cards Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2"
              style={{ scrollSnapType: "x mandatory" }}
            >
              mmmmm
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
