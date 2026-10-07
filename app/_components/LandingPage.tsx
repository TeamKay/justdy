"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Calculator,
  GraduationCap,
  Layers3,
  MessageSquareText,
  Sparkles,
  Users,
  Video,
  PenBoxIcon,
} from "lucide-react";
import { Instrument_Serif, Inter } from "next/font/google";
import MarketingNavbar from "./MarketingNavbar";
import MarketingFooter from "./MarketingFooter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

const audiences = [
  {
    icon: GraduationCap,
    title: "Improve Math Skills",
    description:
      "Build stronger mathematical skills through personalized instruction, guided practice, and consistent support.",
  },
  {
    icon: Users,
    title: "Catch Up & Fill Learning Gaps",
    description:
      "Identify learning gaps and give your child the focused support needed to strengthen foundational concepts.",
  },
  {
    icon: BookOpen,
    title: "Prepare for Tests & Exams",
    description:
      "Prepare with targeted review, guided problem solving, and practice designed around upcoming assessments.",
  },
  {
    icon: Layers3,
    title: "Build Confidence",
    description:
      "Develop the confidence to approach challenging mathematics independently and understand the reasoning behind each solution.",
  },
];

const tutoringFeatures = [
  {
    icon: Video,
    title: "Live video sessions",
    description:
      "Learn face-to-face with a tutor in a focused online math session.",
    href: "/tutoring",
  },
  {
    icon: Calculator,
    title: "Step-by-step math",
    description:
      "Work through problems together instead of only receiving an answer.",
    href: "/tutoring",
  },
  {
    icon: MessageSquareText,
    title: "Ask questions live",
    description:
      "Get immediate explanations when a concept, formula, or problem feels confusing.",
    href: "/tutoring",
  },
  {
    icon: BookOpen,
    title: "Practice & review",
    description:
      "Use guided practice to reinforce what was covered during the session.",
    href: "/tutoring",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose your math support",
    description:
      "Tell us the grade level, topic, homework, exam, or specific math problem you want help with.",
  },
  {
    number: "02",
    title: "Meet your tutor online",
    description:
      "Join a live video session where you can ask questions and work through mathematics together.",
  },
  {
    number: "03",
    title: "Solve it together",
    description:
      "Learn the reasoning step by step, practice with guidance, and build confidence for the next problem.",
  },
];

const heroServices = [
  {
    eyebrow: "LIVE TUTORING",
    title: "Tutoring",
    description:
      "Meet a tutor live, ask questions, and work through difficult concepts together.",
    href: "/tutoring",
    icon: Video,
    accent: "from-indigo-500 via-violet-500 to-fuchsia-500",
    soft: "bg-indigo-50 text-indigo-600",
    visual: "tutoring",
  },
  {
    eyebrow: "ON-DEMAND SUPPORT",
    title: "Live Homework",
    description:
      "Get focused help when homework gets difficult, with clear guidance instead of just an answer.",
    href: "/homework-help",
    icon: MessageSquareText,
    accent: "from-emerald-400 via-teal-500 to-cyan-500",
    soft: "bg-emerald-50 text-emerald-700",
    visual: "homework",
  },
  {
    eyebrow: "CREATE WITH AI",
    title: "AI Creation",
    description:
      "Turn ideas into lessons, study materials, practice activities, and useful learning resources.",
    href: "/ai",
    icon: Sparkles,
    accent: "from-orange-400 via-pink-500 to-violet-500",
    soft: "bg-orange-50 text-orange-600",
    visual: "ai",
  },
] as const;





/* ============================================================
   HERO CAROUSEL — THREE JUSTDY EXPERIENCES
   ============================================================ */

function HeroVisual({
  service,
}: {
  service: (typeof heroServices)[number];
}) {
  const Icon = service.icon;

  if (service.visual === "tutoring") {
    return (
      <div className="relative h-full overflow-hidden rounded-none bg-[#17152a]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(139,92,246,0.55),transparent_35%),radial-gradient(circle_at_18%_82%,rgba(79,70,229,0.32),transparent_38%)]" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-none bg-violet-400/20 blur-3xl" />

        <div className="relative flex h-full flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-none bg-white/10 ring-1 ring-white/10">
                <Video className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/70">
                  Live tutoring
                </p>
                <p className="mt-0.5 text-sm font-semibold">Algebra session</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-none border border-emerald-300/15 bg-emerald-400/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-none bg-emerald-300" />
              LIVE
            </span>
          </div>

          <div className="relative mt-5 min-h-0 flex-1">
            <div className="absolute left-0 top-0 h-[68%] w-[68%] overflow-hidden rounded-none border border-white/10 bg-linear-to-br from-violet-400/25 via-slate-800 to-slate-950 shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_30%,rgba(255,255,255,0.16),transparent_28%)]" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Your tutor</p>
                  <p className="mt-0.5 text-[10px] text-white/45">Explaining step by step</p>
                </div>
                <span className="rounded-none bg-black/30 px-2 py-1 text-[9px] text-white/60 backdrop-blur">
                  HD
                </span>
              </div>
            </div>

            <div className="absolute bottom-0 right-0 h-[58%] w-[58%] rounded-none border border-slate-200 bg-white p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Shared whiteboard
                </p>
                <span className="rounded-none bg-violet-50 px-2 py-1 text-[8px] font-semibold text-violet-600">
                  Working together
                </span>
              </div>
              <div className="mt-5 rounded-none bg-slate-50 p-4">
                <p className="font-mono text-sm font-semibold tracking-tight text-slate-900">
                  2x + 6 = 18
                </p>
                <div className="mt-3 space-y-2 text-[10px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="h-px w-5 bg-violet-300" />
                    <span>Subtract 6 from both sides</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-px w-5 bg-violet-300" />
                    <span>Divide by 2</span>
                  </div>
                </div>
                <div className="mt-4 rounded-none bg-violet-600 px-3 py-2 text-center font-mono text-xs font-bold text-white">
                  x = 6
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-none border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
            <div>
              <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">Next</p>
              <p className="mt-1 text-xs font-medium text-white/80">Practice together</p>
            </div>
            <span className="rounded-none bg-white px-3 py-1.5 text-[9px] font-bold text-slate-900">
              Continue
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (service.visual === "homework") {
    return (
      <div className="relative h-full overflow-hidden rounded-none bg-[#eaf7f3]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(20,184,166,0.30),transparent_35%),radial-gradient(circle_at_8%_92%,rgba(16,185,129,0.18),transparent_40%)]" />

        <div className="relative flex h-full flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-none bg-white text-emerald-600 shadow-sm ring-1 ring-black/5">
                <MessageSquareText className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">
                  Live homework
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-950">Get unstuck</p>
              </div>
            </div>
            <span className="rounded-none bg-white px-3 py-1.5 text-[9px] font-bold text-emerald-700 shadow-sm">
              HELP NOW
            </span>
          </div>

          <div className="mt-5 flex-1 rounded-none border border-slate-900/8 bg-white/85 p-4 shadow-[0_25px_70px_rgba(15,118,110,0.10)] backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-slate-950 text-[10px] font-bold text-white">
                Q
              </div>
              <div className="min-w-0 flex-1 rounded-none rounded-tl-md bg-slate-50 p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Your question
                </p>
                <p className="mt-1.5 text-xs leading-5 text-slate-700">
                  How do I find the area of this triangle?
                </p>
                <div className="mt-3 rounded-none border border-slate-200 bg-white p-3">
                  <div className="relative mx-auto h-24 w-32">
                    <div className="absolute bottom-2 left-1/2 h-20 w-px -translate-x-1/2 rotate-[28deg] bg-emerald-400" />
                    <div className="absolute bottom-2 left-3 right-3 h-px bg-emerald-400" />
                    <div className="absolute bottom-2 left-3 h-20 w-px rotate-[62deg] bg-emerald-400" />
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] text-slate-400">
                      12 cm
                    </span>
                    <span className="absolute left-0 top-7 text-[8px] text-slate-400">
                      8 cm
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-emerald-500 text-[10px] font-bold text-white">
                J
              </div>
              <div className="rounded-none rounded-tl-md bg-emerald-50 p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-700/55">
                  Guided solution
                </p>
                <p className="mt-1.5 text-xs leading-5 text-slate-700">
                  Start with the triangle area formula.
                </p>
                <div className="mt-2 rounded-none bg-white px-3 py-2 font-mono text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  A = ½ × base × height
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {["Understand", "Practice", "Check"].map((label, index) => (
                <div
                  key={label}
                  className={`rounded-none px-3 py-2 text-center text-[9px] font-semibold ${
                    index === 0
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-50 text-slate-400"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-none bg-[#211a25]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_14%,rgba(251,146,60,0.42),transparent_34%),radial-gradient(circle_at_20%_90%,rgba(217,70,239,0.25),transparent_42%)]" />

      <div className="relative flex h-full flex-col p-5 text-white sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
              <Sparkles className="h-4.5 w-4.5 text-orange-200" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-200/65">
                AI creation
              </p>
              <p className="mt-0.5 text-sm font-semibold">Create a study kit</p>
            </div>
          </div>
          <span className="rounded-full border border-orange-200/15 bg-orange-200/10 px-3 py-1.5 text-[9px] font-bold text-orange-100">
            AI READY
          </span>
        </div>

        <div className="mt-5 flex-1 rounded-none border border-white/10 bg-white/[0.07] p-4 shadow-2xl backdrop-blur">
          <div className="rounded-xl bg-black/20 p-3 ring-1 ring-white/8">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
              Prompt
            </p>
            <p className="mt-2 text-xs leading-5 text-white/80">
              Create a revision guide for quadratic equations with examples and practice questions.
            </p>
          </div>

          <div className="mt-3 rounded-xl bg-white p-4 text-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-violet-500">
                  Generated
                </p>
                <p className="mt-1 text-sm font-semibold">Quadratics — Quick Review</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {[
                ["01", "Key concepts", "3 min"],
                ["02", "Worked examples", "6 min"],
                ["03", "Practice set", "10 min"],
              ].map(([number, title, time]) => (
                <div
                  key={number}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                >
                  <span className="text-[9px] font-bold text-violet-500">{number}</span>
                  <span className="flex-1 text-[10px] font-semibold text-slate-700">
                    {title}
                  </span>
                  <span className="text-[9px] text-slate-400">{time}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-violet-500" />
            </div>
            <p className="mt-2 text-[9px] text-slate-400">Personalized for your goal</p>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl border border-white/8 bg-black/10 px-3 py-2.5">
            <span className="text-[9px] text-white/45">Ready to customize</span>
            <span className="rounded-lg bg-white px-3 py-1.5 text-[9px] font-bold text-slate-900">
              Open
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroServiceCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroServices.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <div
      className="relative mx-auto w-full max-w-140"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="absolute -inset-8 rounded-lg" />
      <div className="relative">
        <div className="relative h-127.5 overflow-hidden sm:h-142.5 sm:p-3">
          <div className="relative h-full overflow-hidden rounded-lg">
            {heroServices.map((service, index) => (
              <div
                key={service.title}
                className={`absolute inset-0 transition-all duration-700 ${
                  index === activeIndex
                    ? "translate-x-0 scale-100 opacity-100"
                    : index < activeIndex
                      ? "-translate-x-8 scale-[0.98] opacity-0"
                      : "translate-x-8 scale-[0.98] opacity-0"
                }`}
                aria-hidden={index !== activeIndex}
              >
                <HeroVisual service={service} />
              </div>
            ))}

            <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between">
              <div className="rounded-lg border border-white/50 bg-white/85 px-3 py-2 shadow-lg backdrop-blur">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Justdy
                </p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-800">
                  Learn in the way that works for you.
                </p>
              </div>
              <span className="rounded-lg border border-white/60 bg-white/85 px-3 py-2 text-[9px] font-semibold text-slate-600 shadow-lg backdrop-blur">
                {String(activeIndex + 1).padStart(2, "0")} / 03
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



/* ============================================================
   SUPPORTING PRODUCT PREVIEW
   ============================================================ */

function FeatureRow({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof Video;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-5 rounded-none border border-slate-900/8 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none bg-slate-950 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-950" />
    </Link>
  );
}

/* ============================================================
   LANDING PAGE
   ============================================================ */

export default function LandingPage() {
  return (
    <div
      className={`${inter.variable} ${instrumentSerif.variable} min-h-screen overflow-x-hidden bg-[#181818] text-slate-950`}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      <MarketingNavbar />

      <main>
        <section className="relative overflow-hidden">
          <div className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pb-20 lg:px-12 lg:pb-40 lg:pt-25">
            <div className="grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-10 xl:gap-16">
              <div className="relative z-20 max-w-2xl">
                <h1
                  className="mt-7 max-w-2xl text-[2.8rem] font-bold leading-[0.95] tracking-[-0.055em] text-white sm:text-5xl lg:text-[3.5rem]"
                >
                  Master Math.  
                  <br/>
                  Learn with confidence. Grow without limits.
                </h1>

                <p className="mt-7 max-w-xl text-md leading-7 text-slate-300 sm:text-sm sm:leading-6">
                  Your all-in-one space for learning, tutoring, and creating amazing educational content
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/tutoring"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-7 text-sm font-semibold text-emerald-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-white/70"
                  >
                    Start learning
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>

                  <Link
                  
                   href="/dashboard/create"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/15 bg-emerald-950 px-7 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/10"
                  >
                     <PenBoxIcon className="h-4 w-4" />
                    Create with AI
                  </Link>
                </div>

                <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-300">
                  {["Live 1-on-1 support", "Homework help", "AI creation"].map(
                    (item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        {item}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <HeroServiceCarousel />
            </div>
          </div>
        </section>

       {/* ALL-IN-ONE VALUE */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
            {/* Section Header */}
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                One platform. Less friction.
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">
                Stop piecing learning together.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-500">
                Whether you are learning a concept, stuck on tonight&apos;s homework,
                or building your own study materials, Justdy keeps the experience
                connected.
              </p>
            </div>

            {/* Audience Cards */}
            <div className="mt-14 grid gap-4 lg:grid-cols-4">
              {audiences.map((audience, index) => {
                const Icon = audience.icon;

                return (
                  <div
                    key={audience.title}
                    className="rounded-lg border border-slate-900/8 bg-[#181818] p-6 transition hover:-translate-y-1 hover:bg-emerald-900 hover:shadow-[0_20px_55px_rgba(15,23,42,0.07)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>

                      <span className="text-xs font-bold text-slate-300">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-8 text-lg font-semibold text-white">
                      {audience.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {audience.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PRODUCT SUITE */}
        <section className="relative overflow-hidden bg-[#f5f5f7]">
        

          <div className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
            <div className="grid items-start gap-14 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="lg:sticky lg:top-24">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                  The Justdy toolkit
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">
                  Every part of learning, connected.
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-600">
                  Get the right kind of support without jumping between
                  disconnected tools.
                </p>
                <Link
                  href="/tutoring"
                  className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-950"
                >
                  Explore tutoring
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {tutoringFeatures.map((tool) => (
                  <FeatureRow key={tool.title} {...tool} />
                ))}
                <FeatureRow
                  icon={Sparkles}
                  title="Create with AI"
                  description="Turn ideas into useful lessons, study resources, and practice activities."
                  href="/dashboard/create"
                />
                <FeatureRow
                  icon={MessageSquareText}
                  title="Get live homework help"
                  description="Ask for focused guidance when you are stuck and keep moving."
                  href="/tutoring"
                />
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        <section className="bg-[#181818] text-white">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-28">

            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white">
                Simple by design
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
                From question to clarity.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-500">
               Choose the support you need, connect with the right experience,
                and keep building momentum.
              </p>
            </div>

            <div className="mt-16 grid gap-3 md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className="relative rounded-none border border-white/10 bg-white/4.5 p-7 transition hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-300">
                      {step.number}
                    </span>
                    {index < 2 && (
                      <ArrowRight className="hidden h-4 w-4 text-white/20 md:block" />
                    )}
                  </div>
                  <h3 className="mt-14 text-xl font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LIVE TUTORING PRODUCT SHOWCASE */}
        <section className="bg-[#f5f5f7]">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
            <div className="overflow-hidden rounded-sm bg-[#f5f5f7] shadow-[0_25px_90px_rgba(15,23,42,0.08)]">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 sm:p-12 lg:p-16">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
                    <Video className="h-5 w-5" />
                  </div>
                  <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                    Live tutoring
                  </p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">
                    A real learning room, built for focus.
                  </h2>
                  <p className="mt-5 text-lg leading-8 text-slate-600">
                    Meet a tutor face-to-face with live video, guided problem
                    solving, and a shared whiteboard designed around
                    understanding.
                  </p>
                  <Link
                    href="/tutoring"
                    className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Book a session
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="relative min-h-107.5 overflow-hidden bg-slate-950 p-6 sm:p-10">
                  <div className="absolute -right-20 -top-20 h-64 w-64 rounded-lg bg-indigo-500/25 blur-3xl" />
                  <div className="relative rounded-lg border border-white/10 bg-white/6 p-4 shadow-2xl backdrop-blur">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 rounded-lg bg-red-300" />
                        <span className="h-2 w-2 rounded-lg bg-yellow-300" />
                        <span className="h-2 w-2 rounded-lg bg-green-300" />
                      </div>
                      <span className="rounded-none bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold text-emerald-300">
                        SESSION LIVE
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-[1fr_0.7fr] gap-3">
                      <div className="min-h-52 rounded-lg bg-linear-to-br from-indigo-500/30 via-slate-800 to-slate-900 p-4">
                        <div className="flex h-full items-end">
                          <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-[10px] text-white/70">
                            Tutor video
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg bg-white p-4">
                        <p className="text-[10px] font-semibold text-slate-400">
                          WHITEBOARD
                        </p>
                        <div className="mt-8 space-y-3">
                          <div className="h-1.5 w-3/4 rounded-lg bg-indigo-200" />
                          <div className="h-1.5 w-1/2 rounded-lg bg-slate-200" />
                          <div className="h-1.5 w-2/3 rounded-lg bg-slate-200" />
                          <div className="mt-7 h-14 rounded-lg border border-dashed border-slate-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY JUSTDY */}
        <section className="bg-[#f5f5f7]">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Why Justdy
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Built around the way people actually learn.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Less friction. More guidance. Better tools for the moments when
                you need to understand, practice, or create.
              </p>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Personalized instruction",
                  "Support adapts to your goals, pace, and learning needs.",
                ],
                [
                  "Live 1-on-1 learning",
                  "Ask questions and get direct feedback in real time.",
                ],
                [
                  "Structured progress",
                  "Keep a clear path from today’s question to long-term improvement.",
                ],
                [
                  "Real understanding",
                  "Build reasoning and problem-solving skills instead of memorizing answers.",
                ],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-none border border-slate-900/8 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.04)]"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="mt-7 font-semibold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BRAND STATEMENT */}
        <section className="bg-[#f5f5f7]">
          <div className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-8 lg:py-32">
            <div className="mx-auto h-1 w-12 rounded-lg bg-indigo-500" />
            <blockquote className="mx-auto mt-8 max-w-4xl text-3xl font-medium leading-tight tracking-[-0.04em] text-slate-950 sm:text-5xl">
              The right support at the right moment can change the way you
              learn.
            </blockquote>
            <p className="mt-7 text-sm font-semibold text-slate-400">
              The Justdy learning experience
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-[#181818]">
          <div className="relative z-10 mx-auto max-w-5xl px-5 py-28 text-center sm:px-8 lg:py-32">
            <div className="mx-auto inline-flex items-center gap-2 rounded-none border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">
              One platform for your next learning moment
            </div>
            <h2 className="mt-7 text-4xl font-semibold tracking-tighter text-white sm:text-6xl">
              Ready to make learning{" "}
              <span
                className="font-normal italic"
                style={{
                  fontFamily: "var(--font-instrument-serif), Georgia, serif",
                }}
              >
                easier?
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Book a tutor, get help with homework, or create something useful
              with AI — all from Justdy.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/tutoring"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-7 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Explore Justdy
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
               href="/dashboard/create"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-7 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Create with AI
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
