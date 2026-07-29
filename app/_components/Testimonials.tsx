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
    icon: <LineChart className="w-3.5 h-3.5" />,
    content:
      "The private 1-on-1 consulting sessions completely transformed our workflow blueprint. Direct access to an expert saved us months of trial and error.",
  },
  {
    id: 2,
    name: "Liam Henderson",
    role: "Computer Science Student",
    badgeRight: "Smart AI Tutor",
    glow: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    icon: <Bot className="w-3.5 h-3.5" />,
    content:
      "Having 24/7 instant concept breakdowns and adaptive practice drills tailored to my exact pace felt like an absolute superpower.",
  },
  {
    id: 3,
    name: "Sarah Jenkins",
    role: "Up-skilling Professional",
    badgeRight: "Online Video Courses",
    glow: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    icon: <Video className="w-3.5 h-3.5" />,
    content:
      "The self-paced video modules are deep and structured. Zero fluff—just step-by-step masterclasses that helped me secure my promotion.",
  },
  {
    id: 4,
    name: "Mateo Silva",
    role: "Independent Creator",
    badgeRight: "Digital Products",
    glow: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    icon: <Download className="w-3.5 h-3.5" />,
    content:
      "The premium layout templates and resource toolkits are worth every single penny. Production-ready source files that drastically cut development hours.",
  },
  {
    id: 5,
    name: "Marcus Vance",
    role: "Advanced Academic Mentee",
    badgeRight: "1-on-1 Tutoring",
    glow: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    icon: <Sparkles className="w-3.5 h-3.5" />,
    content:
      "A remarkable platform where human expertise, smart AI infrastructure, and high-quality downloadable resources live together.",
  },
];

// Duplicate items for seamless infinite scroll
const doubledTestimonials = [...testimonials, ...testimonials];

export default function TestimonialsCarousel() {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Keyframe animation inlined */}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
      `}</style>

      {/* Structural Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* BOUNDED CONTAINER WRAPPER */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-white mb-3 tracking-tight">
            Real Impact. Verified Success.
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Trusted by professionals, students, and businesses worldwide.
          </p>
        </div>

        {/* CAROUSEL WRAPPER - CLIPPED EXACTLY WITHIN MAX-W-7XL */}
        <div className="relative w-full overflow-hidden py-4 rounded-2xl">
          {/* Left & Right Soft Fade Masks (Clipped inside max-w-7xl) */}
          <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

          {/* Marquee Track */}
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-6">
            {doubledTestimonials.map((t, idx) => (
              <div
                key={`${t.id}-${idx}`}
                className="w-[320px] sm:w-[360px] shrink-0 group relative bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-6 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-900/90 shadow-sm"
              >
                {/* Background ambient lighting halo glow */}
                <div className="absolute -top-12 -left-12 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-500" />

                {/* Decorative Quote Icon */}
                <div className="absolute bottom-4 right-4 text-neutral-800 pointer-events-none group-hover:text-neutral-700/40 transition-colors duration-300">
                  <Quote className="w-16 h-16 transform rotate-180 stroke-[0.5] fill-current opacity-20" />
                </div>

                <div className="relative z-10">
                  {/* Header Badge & Check */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium ${t.glow}`}
                    >
                      {t.icon}
                      <span>{t.badgeRight}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-neutral-600 group-hover:text-emerald-500 transition-colors" />
                  </div>

                  {/* Quote Content */}
                  <p className="text-neutral-300 text-sm leading-relaxed mb-6 font-light">
                    “{t.content}”
                  </p>
                </div>

                {/* Author Profile */}
                <div className="relative z-10 flex items-center gap-3 pt-4 border-t border-neutral-800/80">
                  <div className="w-9 h-9 shrink-0 rounded-lg border border-neutral-700 bg-neutral-800 flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-inner">
                    {t.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <h4 className="font-semibold text-white text-xs tracking-tight group-hover:text-emerald-400 transition-colors">
                      {t.name}
                    </h4>
                    <p className="text-[11px] font-medium text-neutral-500 truncate">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
