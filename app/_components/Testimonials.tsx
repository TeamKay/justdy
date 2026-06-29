"use client";

import {
  Quote,
  CheckCircle2,
  MessageSquareCode,
  Brain,
  Video,
  GraduationCap,
  Sparkles,
} from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Dr. Evelyn Brooks",
    role: "Community Member & Researcher",
    badgeRight: "Intellectual Community",
    glow: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    icon: <MessageSquareCode className="w-4 h-4" />,
    className: "md:col-span-2", // Spans wide on desktop for visual weight
    content:
      "The community for intellectual discussions has completely elevated my weekly routine. The depth of tutoring and high-level debate here is incredibly hard to find anywhere else online. 🧠",
  },
  {
    id: 2,
    name: "Liam Henderson",
    role: "Computer Science Student",
    badgeRight: "AI Smart Tutor",
    glow: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    icon: <Brain className="w-4 h-4" />,
    className: "md:col-span-1",
    content:
      "I was stuck on data structures for weeks, but the AI smart tutor broke down concepts instantly. Having 24/7 access to tailored explanations feels like a learning superpower. ⚡",
  },
  {
    id: 3,
    name: "Sarah Jenkins",
    role: "Career Professional",
    badgeRight: "Online Video Courses",
    glow: "bg-pink-500/10 border-pink-500/20 text-pink-400",
    icon: <Video className="w-4 h-4" />,
    className: "md:col-span-1",
    content:
      "The self-paced online courses are masterfully structured. No fluff—just high-yield, step-by-step video modules that helped me completely upskill and land a promotion. 📈",
  },
  {
    id: 4,
    name: "Mateo Silva",
    role: "1-on-1 Mentee",
    badgeRight: "Live 1:1 Sessions",
    glow: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    icon: <GraduationCap className="w-4 h-4" />,
    className: "md:col-span-1",
    content:
      "Booking live online sessions was the best investment I made this year. The undivided attention and real-time feedback completely cleared my learning blockages. 🎯",
  },
  {
    id: 5,
    name: "Prof. Amara Okafor",
    role: "Discussion Moderator",
    badgeRight: "Expert Tutoring",
    glow: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    icon: <Sparkles className="w-4 h-4" />,
    className: "md:col-span-1 lg:col-span-1",
    content:
      "A brilliant ecosystem where modern AI tools and deep human intellect meet. The quality of engagement here is absolute top-tier. 🌱",
  },
];

export default function TestimonialsGrid() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Structural Tech Grid Overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="max-w-7xl mx-auto px-12 lg:px-12 relative z-10">
        {/* HEADER SECTION */}
        <div className="text-center mb-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <span>Student Success</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight md:text-5xl">
            Real Stories From Real Learners
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
            See how our integrated ecosystem of interactive communities, AI
            assistance, and expert-led sessions changes the game.
          </p>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className={`group relative bg-neutral-900/40 border border-neutral-800 rounded-md p-6 md:p-8 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-neutral-700 hover:-translate-y-1 hover:shadow-xl ${t.className}`}
            >
              {/* Background ambient lighting halo glow */}
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/5 rounded-md blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-500" />

              {/* Decorative Subtle Quote Mark Icon */}
              <div className="absolute bottom-6 right-6 text-neutral-800 pointer-events-none group-hover:text-neutral-700/50 transition-colors duration-300">
                <Quote className="w-20 h-20 transform rotate-180 stroke-[0.5] fill-current opacity-20" />
              </div>

              <div className="relative z-10">
                {/* Header Feature Badge Lineup */}
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-medium ${t.glow}`}
                  >
                    {t.icon}
                    <span>{t.badgeRight}</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-neutral-600 group-hover:text-emerald-500 transition-colors" />
                </div>

                {/* Content Quote Text Box */}
                <p className="text-neutral-300 text-base leading-relaxed mb-8 font-normal">
                  “{t.content}”
                </p>
              </div>

              {/* Author Info Profile Container */}
              <div className="relative z-10 flex items-center gap-3.5 pt-4 border-t border-neutral-800/80">
                <div className="w-10 h-10 shrink-0 rounded-md border border-neutral-700 bg-neutral-800 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-inner">
                  {t.name.charAt(0)}
                </div>
                <div className="truncate">
                  <h4 className="font-semibold text-white text-sm tracking-tight group-hover:text-emerald-400 transition-colors">
                    {t.name}
                  </h4>
                  <p className="text-xs font-medium text-neutral-500 mt-0.5 truncate">
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
