"use client";

import { useEffect, useState, useRef } from "react";
import { Quote, CheckCircle2 } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Dr. Evelyn Brooks",
    role: "Community Member & Researcher",
    avatarColor: "from-purple-400 to-indigo-600",
    badgeRight: "Intellectual Community",
    content:
      "The community for intellectual discussions has completely elevated my weekly routine. The depth of tutoring and high-level debate here is incredibly hard to find anywhere else online. 🧠",
  },
  {
    id: 2,
    name: "Liam Henderson",
    role: "Computer Science Student",
    avatarColor: "from-cyan-400 to-blue-500",
    badgeRight: "AI Smart Tutor",
    content:
      "I was stuck on data structures for weeks, but the AI smart tutor broke down the concepts instantly. Having 24/7 access to tailored explanations feels like a literal learning superpower. ⚡",
  },
  {
    id: 3,
    name: "Sarah Jenkins",
    role: "Career Professional",
    avatarColor: "from-pink-400 to-rose-500",
    badgeRight: "Online Video Courses",
    content:
      "The self-paced online courses are masterfully structured. No fluff—just high-yield, step-by-step video modules that helped me completely upskill and land a promotion. 📈",
  },
  {
    id: 4,
    name: "Mateo Silva",
    role: "1-on-1 Mentee",
    avatarColor: "from-amber-400 to-orange-500",
    badgeRight: "Live 1:1 Sessions",
    content:
      "Booking the live online sessions was the best investment I made this year. The undivided attention, clear mentorship, and real-time feedback completely cleared my learning blockages. 🎯",
  },
  {
    id: 5,
    name: "Professor Amara Okafor",
    role: "Discussion Moderator",
    avatarColor: "from-teal-400 to-emerald-500",
    badgeRight: "Expert Tutoring",
    content:
      "A brilliant ecosystem where modern AI tools and deep human intellect meet. Whether you're taking a structured course or arguing complex concepts, the quality of engagement here is top-tier. 🌱",
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [centerOffset, setCenterOffset] = useState(0);

  // Auto-advance loop timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Generate a dynamic window of 5 elements so there's always physical padding to slide into
  const total = testimonials.length;
  const getCard = (offset: number) => {
    const index = (currentIndex + offset + total) % total;
    return { ...testimonials[index], virtualOffset: offset };
  };

  const visibleTrack = [
    getCard(-2),
    getCard(-1),
    getCard(0), // Center active item
    getCard(1),
    getCard(2),
  ];

  // Compute precise positional movement translations
  useEffect(() => {
    if (!stageRef.current) return;

    const calculateSpacing = () => {
      const stageWidth = stageRef.current?.offsetWidth || 0;
      const isDesktop = window.innerWidth >= 768;

      const centerCardWidth = isDesktop ? 768 : 320;
      const sideCardWidth = isDesktop ? 224 : 160;
      const gap = isDesktop ? 24 : 16;

      const stageCenter = stageWidth / 2;

      // Index 2 is our center element inside the 5-item visible window
      const totalWidthBeforeActive = 2 * (sideCardWidth + gap);
      const activeItemCenterAdjustment = centerCardWidth / 2;

      setCenterOffset(
        stageCenter - totalWidthBeforeActive - activeItemCenterAdjustment,
      );
    };

    calculateSpacing();
    window.addEventListener("resize", calculateSpacing);
    return () => window.removeEventListener("resize", calculateSpacing);
  }, [currentIndex]);

  return (
    <section className="py-24 bg-background overflow-hidden font-sans select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        {/* HEADER SECTION */}
        <div className="text-center mb-16 px-4">
          <h2 className="text-4xl font-semibold text-white mb-4 tracking-tight">
            Real Stories From Real satisfied learners
          </h2>
          <p className="mt-4 text-slate-500 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            See how our integrated ecosystem of interactive communities, AI
            assistance, and expert-led sessions changes the game.
          </p>
        </div>

        {/* INFINITE CONVEYOR STAGE */}
        <div
          ref={stageRef}
          className="relative w-full flex items-center min-h-105 overflow-hidden"
        >
          {/* THE MOVING TRACK FRAME */}
          <div
            className="flex gap-4 md:gap-6 items-center transition-transform duration-700"
            style={{
              transform: `translateX(${centerOffset}px)`,
              transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {visibleTrack.map((t) => {
              const isCenter = t.virtualOffset === 0;
              // Only reveal the main center card and its immediate left/right flanking companions
              const isVisibleInFrame = Math.abs(t.virtualOffset) <= 1;

              return (
                <div
                  key={t.id}
                  className={`bg-emerald-950/30 relative group flex flex-col justify-between border border-slate-100/20 rounded-md p-6 md:p-8 shrink-0 transition-all duration-700 ${
                    isCenter
                      ? "w-[320px] md:w-3xl h-90 scale-100 z-10 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12)] border-emerald-800 pointer-events-auto"
                      : "w-40 md:w-56 h-70 scale-90 z-0 shadow-none border-slate-100 pointer-events-none"
                  } ${
                    isVisibleInFrame
                      ? "opacity-100 md:opacity-100"
                      : "opacity-0 scale-75 pointer-events-none"
                  }`}
                  style={{
                    transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)",
                  }}
                >
                  {/* Visual Elements Exclusive to Center Card */}
                  {isCenter && (
                    <>
                      {/* Decorative Background Quote Accent */}
                      <div className="absolute top-6 right-8 text-slate-200 group-hover:text-pink-100/70 transition-colors duration-500">
                        <Quote className="w-12 h-12 transform rotate-180 fill-current" />
                      </div>

                      {/* Right Custom Service Badge */}
                      <div className="absolute top-6 right-8 bg-yellow-300 backdrop-blur-md border border-slate-900/10 px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-xs opacity-0 md:opacity-100 transition-opacity duration-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
                        <span className="text-xs font-bold text-slate-800">
                          {t.badgeRight}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Card Main Quote Body Content */}
                  <div className="flex-1 flex items-center min-h-35">
                    <p
                      className={`text-slate-300 leading-relaxed font-normal transition-all duration-500 ${
                        isCenter
                          ? "text-sm md:text-xl mb-4 pr-12"
                          : "text-xs line-clamp-3 md:line-clamp-4"
                      }`}
                    >
                      “{t.content}”
                    </p>
                  </div>

                  {/* Author Info Footer Row */}
                  <div
                    className={`flex items-center gap-3.5 border-t border-slate-100/80 pt-4 transition-opacity duration-500 ${
                      !isCenter && "opacity-40"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 shrink-0 rounded-2xl bg-linear-to-br ${t.avatarColor} flex items-center justify-center text-white font-extrabold text-xs shadow-xs`}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-white text-xs md:text-sm tracking-tight">
                        {t.name}
                      </h4>
                      <p className="text-[10px] md:text-[11px] font-semibold text-slate-400 mt-0.5 truncate">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
