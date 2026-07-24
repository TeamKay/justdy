"use client";

import {
  Quote,
  CheckCircle2,
  LineChart,
  Bot,
  Video,
  Download,
  Sparkles,
} from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Dr. Evelyn Brooks",
    role: "Strategic Business Consulting Client",
    badgeRight: "Tutoring & Consulting",
    glow: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    icon: <LineChart className="w-4 h-4" />,
    className: "md:col-span-2", // Spans wide on desktop for visual weight
    content:
      "The private 1-on-1 consulting sessions completely transformed our workflow blueprint. Having direct access to an expert who can isolate operational roadblocks saved us months of costly trial and error. 📈",
  },
  {
    id: 2,
    name: "Liam Henderson",
    role: "Computer Science Student",
    badgeRight: "Smart AI Tutor",
    glow: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    icon: <Bot className="w-4 h-4" />,
    className: "md:col-span-1",
    content:
      "I was struggling with complex algorithms until I used the platform's AI tutor. Having 24/7 instant concept breakdowns and adaptive practice drills tailored to my exact pace felt like an absolute superpower. ⚡",
  },
  {
    id: 3,
    name: "Sarah Jenkins",
    role: "Up-skilling Professional",
    badgeRight: "Online Video Courses",
    glow: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    icon: <Video className="w-4 h-4" />,
    className: "md:col-span-1",
    content:
      "The self-paced video modules are incredibly deep and structured. There's zero fluff—just high-yield, step-by-step masterclasses that helped me build practical competencies and secure my promotion. 🎯",
  },
  {
    id: 4,
    name: "Mateo Silva",
    role: "Independent Creator",
    badgeRight: "Digital Products",
    glow: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    icon: <Download className="w-4 h-4" />,
    className: "md:col-span-1",
    content:
      "The premium layout templates and resource toolkits are worth every single penny. They are beautifully organized, production-ready source files that drastically cut down our development hours. 📁",
  },
  {
    id: 5,
    name: "Marcus Vance",
    role: "Advanced Academic Mentee",
    badgeRight: "1-on-1 Tutoring",
    glow: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    icon: <Sparkles className="w-4 h-4" />,
    className: "md:col-span-1 lg:col-span-1",
    content:
      "A remarkable platform where human expertise, smart AI infrastructure, and high-quality downloadable resources live together. My test scores and execution confidence skyrocketed. 🌱",
  },
];

export default function TestimonialsGrid() {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Structural Tech Grid Overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="max-w-7xl mx-auto px-12 lg:px-8 relative z-10">
        {/* HEADER SECTION */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-400 mb-4 tracking-tight">
            Real Impact. Verified Success.
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Success stories from real impactful clients
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
                <p className="text-neutral-300 text-base leading-relaxed mb-8 font-light">
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
