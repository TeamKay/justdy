"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Layers3,
  MessageSquareText,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { Inter, Instrument_Serif } from "next/font/google";
import MarketingNavbar from "./MarketingNavbar";
import MarketingFooter from "./MarketingFooter";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

const slides = [
  {
    eyebrow: "LIVE 1-ON-1 TUTORING",
    title: "Understand more.\nWorry less.",
    description:
      "Meet with a tutor, ask questions in real time, and work through difficult math problems one clear step at a time.",
    href: "/tutoring",
    action: "Find a tutor",
    icon: Video,
    tag: "Live learning room",
    visual: "tutoring",
    number: "01",
  },

  {
    eyebrow: "HOMEWORK SUPPORT",
    title: "Turn stuck moments\ninto breakthroughs.",
    description:
      "Get focused help with challenging homework and build the understanding to solve the next problem yourself.",
    href: "/dashboard/live-help",
    action: "Get homework help",
    icon: MessageSquareText,
    tag: "Guided problem solving",
    visual: "homework",
    number: "02",
  },

  {
    eyebrow: "LEARNING RESOURCES",
    title: "Make learning\nyour own.",
    description:
      "Explore study guides, practice activities, and learning resources to support your goals.",
    href: "/dashboard/library",
    action: "Explore resources",
    icon: BookOpen,
    tag: "Your learning library",
    visual: "library",
    number: "03",
  },
] as const;

const audiences = [
  {
    icon: GraduationCap,
    title: "Strengthen math skills",
    description:
      "Build a solid foundation through personalized instruction and guided practice.",
  },
  {
    icon: Users,
    title: "Fill learning gaps",
    description:
      "Get focused support on the concepts that need a little more time and attention.",
  },
  {
    icon: BookOpen,
    title: "Prepare with purpose",
    description:
      "Review important topics and practise problem-solving before tests and exams.",
  },
  {
    icon: Layers3,
    title: "Grow your confidence",
    description:
      "Learn the reasoning behind each solution and feel ready for what comes next.",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose what you need",
    description:
      "Start with a topic, homework question, exam goal, or learning resource you want to create.",
  },
  {
    number: "02",
    title: "Get the right support",
    description:
      "Connect with a tutor, get guided help, or use the creation studio to build learning materials.",
  },
  {
    number: "03",
    title: "Keep making progress",
    description:
      "Practise, ask questions, and build understanding you can carry into the next challenge.",
  },
];

function SlidePreview({
  visual,
}: {
  visual: (typeof slides)[number]["visual"];
}) {
  if (visual === "tutoring") {
    return (
      <div className="relative h-full min-h-82.5 overflow-hidden rounded-lg bg-[#11162d] p-5 text-white sm:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_15%,rgba(154,117,255,.55),transparent_34%),radial-gradient(circle_at_15%_90%,rgba(40,123,255,.28),transparent_42%)]" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
              <Video className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-200">
                Live tutoring
              </p>
              <p className="mt-1 text-sm font-semibold">Algebra session</p>
            </div>
          </div>
          <span className="flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> LIVE
          </span>
        </div>

        <div className="relative mt-7 grid min-h-55 grid-cols-[1.05fr_.95fr] gap-3">
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-linear-to-br from-violet-400/40 via-indigo-950 to-slate-950 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,.16),transparent_30%)]" />
            <div className="absolute bottom-4 left-4">
              <p className="text-sm font-semibold">Your tutor</p>
              <p className="mt-1 text-[10px] text-white/55">
                Explaining step by step
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-slate-900 shadow-xl">
            <p className="text-[9px] font-bold uppercase tracking-[.16em] text-violet-500">
              Shared whiteboard
            </p>
            <p className="mt-6 font-mono text-base font-bold sm:text-xl">
              2x + 6 = 18
            </p>
            <div className="mt-4 space-y-3 text-[10px] text-slate-500">
              <p className="border-l-2 border-violet-300 pl-2">
                Subtract 6 from both sides
              </p>
              <p className="border-l-2 border-violet-300 pl-2">
                Divide each side by 2
              </p>
            </div>
            <div className="mt-5 rounded-xl bg-violet-600 px-3 py-2 text-center font-mono text-sm font-bold text-white">
              x = 6
            </div>
          </div>
        </div>
        <div className="relative mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/45">
              Next step
            </p>
            <p className="mt-1 text-xs font-medium">Practise together</p>
          </div>
          <span className="rounded-xl bg-white px-3 py-2 text-[10px] font-bold text-slate-900">
            Continue
          </span>
        </div>
      </div>
    );
  }

  if (visual === "homework") {
    return (
      <div className="relative h-full min-h-[330px] overflow-hidden rounded-[1.5rem] bg-[#e8f7f3] p-5 text-slate-900 sm:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_8%,rgba(20,184,166,.28),transparent_35%),radial-gradient(circle_at_8%_95%,rgba(16,185,129,.16),transparent_40%)]" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
              <MessageSquareText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-700">
                Homework help
              </p>
              <p className="mt-1 text-sm font-semibold">
                Let&apos;s solve it together
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white px-3 py-2 text-[9px] font-bold text-emerald-700">
            GUIDED HELP
          </span>
        </div>
        <div className="relative mt-7 space-y-4 rounded-3xl border border-slate-900/5 bg-white/90 p-4 shadow-xl shadow-emerald-900/5 sm:p-5">
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
              Q
            </span>
            <div className="flex-1 rounded-2xl rounded-tl-md bg-slate-50 p-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Your question
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                How do I find the area of a triangle?
              </p>
              <div className="mt-3 flex h-20 items-end justify-center">
                <svg
                  viewBox="0 0 180 90"
                  className="h-full w-44"
                  aria-label="Triangle diagram"
                >
                  <path
                    d="M25 75 L90 12 L155 75 Z"
                    fill="#d1fae5"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                  <path
                    d="M90 12 L90 75"
                    stroke="#10b981"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="90"
                    y="88"
                    fontSize="10"
                    textAnchor="middle"
                    fill="#64748b"
                  >
                    12 cm
                  </text>
                  <text x="96" y="49" fontSize="10" fill="#64748b">
                    8 cm
                  </text>
                </svg>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-xs font-bold text-white">
              J
            </span>
            <div className="flex-1 rounded-2xl rounded-tl-md bg-emerald-50 p-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-700">
                First, understand
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Area is half the base multiplied by the height.
              </p>
              <div className="mt-3 rounded-xl bg-white px-3 py-2 font-mono text-xs font-bold text-emerald-700">
                A = ½ × base × height
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-82.5 overflow-hidden rounded-[1.5rem] bg-[#20172e] p-5 text-white sm:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(251,146,60,.36),transparent_34%),radial-gradient(circle_at_10%_90%,rgba(168,85,247,.32),transparent_42%)]" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-orange-200">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-200">
              AI creation studio
            </p>
            <p className="mt-1 text-sm font-semibold">Build a study kit</p>
          </div>
        </div>
        <span className="rounded-full border border-orange-200/20 bg-orange-200/10 px-3 py-2 text-[9px] font-bold text-orange-100">
          READY TO CREATE
        </span>
      </div>
      <div className="relative mt-7 rounded-3xl border border-white/10 bg-white/[.07] p-4 shadow-2xl backdrop-blur sm:p-5">
        <div className="rounded-2xl bg-black/20 p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/45">
            Your idea
          </p>
          <p className="mt-2 text-sm leading-6 text-white/85">
            Create a revision guide for quadratic equations with examples and
            practice questions.
          </p>
        </div>
        <div className="mt-4 rounded-2xl bg-white p-4 text-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-violet-500">
                Your generated resource
              </p>
              <p className="mt-1 text-sm font-bold">
                Quadratics — Quick Review
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-5 space-y-2">
            {[
              ["01", "Key concepts", "3 min"],
              ["02", "Worked examples", "6 min"],
              ["03", "Practice questions", "10 min"],
            ].map(([n, label, time]) => (
              <div
                key={n}
                className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3"
              >
                <span className="text-[10px] font-bold text-violet-500">
                  {n}
                </span>
                <span className="flex-1 text-xs font-semibold text-slate-700">
                  {label}
                </span>
                <span className="text-[10px] text-slate-400">{time}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-violet-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[active];
  const Icon = slide.icon;

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      6500,
    );
    return () => window.clearInterval(timer);
  }, [paused]);

  const previous = () =>
    setActive((current) => (current - 1 + slides.length) % slides.length);
  const next = () => setActive((current) => (current + 1) % slides.length);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setPaused(false);
      }}
    >
      <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-violet-500/20 via-blue-500/10 to-emerald-400/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.8rem] border border-white/15 bg-white/10 p-2 shadow-[0_30px_100px_rgba(0,0,0,.3)] backdrop-blur-xl sm:p-3">
        <div className="mb-3 flex items-center justify-between gap-3 px-2 pt-1 sm:px-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/50">
                Explore Justdy
              </p>
              <p className="mt-0.5 text-xs font-semibold text-white">
                {slide.tag}
              </p>
            </div>
          </div>
          <span className="font-mono text-xs text-white/55">
            {slide.number} <span className="text-white/25">/ 03</span>
          </span>
        </div>
        <div className="relative">
          <SlidePreview visual={slide.visual} />
        </div>
        <div className="flex items-center justify-between gap-4 px-2 py-3 sm:px-3">
          <div
            className="flex items-center gap-2"
            aria-label="Choose carousel slide"
          >
            {slides.map((item, index) => (
              <button
                key={item.number}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show slide ${index + 1}: ${item.tag}`}
                aria-pressed={active === index}
                className={`h-1.5 rounded-full transition-all ${active === index ? "w-8 bg-violet-300" : "w-1.5 bg-white/35 hover:bg-white/70"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={previous}
              aria-label="Previous slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white transition hover:bg-white/10"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Video;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-3xl border border-slate-200/80 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-slate-900/5">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 transition group-hover:bg-violet-600 group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-6 text-base font-bold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div
      className={`${inter.variable} ${instrumentSerif.variable} min-h-screen overflow-x-hidden bg-[#f7f8fc] text-slate-950`}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      <div className="relative isolate overflow-hidden bg-[#071d2b] text-white">
        {/* The uploaded reference image is used as the full-bleed hero background. */}
        <div
          className="absolute inset-0 -z-20 bg-[url('/images/justdy-landing-background.png')] bg-cover bg-center"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(3,24,37,.96)_0%,rgba(18,34,73,.89)_48%,rgba(3,45,48,.88)_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-size-[54px_54px]"
          aria-hidden="true"
        />
        <MarketingNavbar />

        <main>
          <section className="relative mx-auto flex min-h-162.5 max-w-7xl flex-col items-center justify-center px-5 pb-16 pt-25 text-center sm:px-8 lg:min-h-172.5 lg:px-12">
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/4 px-4 py-2 text-xs font-medium text-slate-300 shadow-sm backdrop-blur-md">
              <span className="h-2 w-2 rounded-lg bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.7)]" />
              Personalized learning, all in one place
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </div>

            <h1 className="mt-12 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-[-.065em] text-white sm:text-6xl lg:text-[5.25rem]">
              Math made easy.
              <span className="block">Create without limits.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-slate-300/75 sm:text-lg sm:leading-8">
              Get personalized math tutoring, solve homework step by step, and
              create beautiful learning resources with AI. Everything you need
              to learn, teach, and grow — all in one place.
            </p>

            <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/tutoring"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-black shadow-lg shadow-sky-950/30 transition hover:-translate-y-0.5 hover:shadow-sky-950/50"
              >
                Start learning
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>

              <Link
                href="/dashboard/create"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <Sparkles className="h-4 w-4" />
                Explore AI creation
              </Link>
            </div>

            <div className="mt-16 grid w-full max-w-5xl grid-cols-3 border-y border-white/40 py-5 sm:mt-20">
              <div className="px-2 sm:px-5">
                <p className="text-2xl font-semibold tracking-tight text-white sm:text-xl">
                  1 - on - 1
                </p>
                <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                  Live tutoring
                </p>
              </div>
              <div className="border-l border-white/40 px-2 sm:px-5">
                <p className="text-2xl font-semibold tracking-tight text-white sm:text-xl">
                  Live HD
                </p>
                <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                  Homework help
                </p>
              </div>
              <div className="border-l border-white/40 px-2 sm:px-5">
                <p className="text-2xl font-semibold tracking-tight text-white sm:text-xl">
                  AI
                </p>
                <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                  Creative tools
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-700">
              Support for your next step
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tighter text-slate-950 sm:text-5xl">
              Learning gets easier when you&apos;re not doing it alone.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
              Whether you’re mastering a tricky concept or preparing for an
              important test, Justdy helps you keep moving forward.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {audiences.map(({ icon, title, description }) => (
              <FeatureCard
                key={title}
                icon={icon}
                title={title}
                description={description}
              />
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#f6f7fb]">
        <div className="mx-auto grid max-w-7xl items-start gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:px-12 lg:py-28">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-700">
              The Justdy toolkit
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-.05em] text-slate-950 sm:text-5xl">
              The right kind of help, right when you need it.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Move between live support and creative tools without losing sight
              of your learning goals.
            </p>
            <Link
              href="/tutoring"
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-slate-950 transition hover:text-violet-700"
            >
              Explore tutoring <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {[
              {
                icon: Video,
                title: "Live tutoring",
                description:
                  "Learn face-to-face with a tutor in a focused online session.",
                href: "/tutoring",
              },
              {
                icon: MessageSquareText,
                title: "Homework help",
                description:
                  "Work through difficult questions with clear, step-by-step guidance.",
                href: "/dashboard/live-help",
              },
              {
                icon: BookOpen,
                title: "Practice and review",
                description:
                  "Reinforce what you’ve learned with useful practice and revision.",
                href: "/tutoring",
              },
              {
                icon: Sparkles,
                title: "Create with AI",
                description:
                  "Turn your ideas into assessments, study resources, and learning activities.",
                href: "/dashboard/create",
              },
            ].map(({ icon: Icon, title, description, href }) => (
              <Link
                key={title}
                href={href}
                className="group flex items-center gap-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg sm:p-6"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-violet-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-slate-950">
                    {title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-500">
                    {description}
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#0b1023] text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">
              Simple by design
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-.05em] sm:text-5xl">
              From question to confidence.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              A straightforward path to finding the help, tools, and momentum
              you need.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="rounded-lg border border-white/10 bg-white/[.04] p-7 transition hover:bg-white/[.07] sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-violet-300">
                    {step.number}
                  </span>
                  {index < 2 && (
                    <ArrowRight className="h-4 w-4 text-white/30" />
                  )}
                </div>
                <h3 className="mt-10 text-xl font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8 lg:py-28">
          <div className="mx-auto h-1 w-12 rounded-lg bg-violet-500" />
          <blockquote className="mx-auto mt-8 max-w-4xl text-3xl font-semibold leading-tight tracking-[-.05em] text-slate-950 sm:text-5xl">
            “The right support at the right moment can change the way you
            learn.”
          </blockquote>
          <p className="mt-6 text-sm font-semibold text-slate-400">
            The Justdy learning experience
          </p>
        </div>
      </section>
      <section className="relative isolate overflow-hidden bg-[#111a3a] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(139,92,246,.25),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(20,184,166,.18),transparent_35%)]" />
        <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8 lg:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-4 py-2 text-xs font-semibold text-white/75">
            <Sparkles className="h-3.5 w-3.5 text-violet-300" /> Your next
            learning moment starts here
          </div>
          <h2 className="mt-7 text-4xl font-bold tracking-[-.06em] sm:text-6xl">
            Ready to learn with{" "}
            <span className="bg-gradient-to-r from-violet-300 to-blue-200 bg-clip-text text-transparent">
              confidence?
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Book a tutor, get help with homework, or create something useful
            with AI — all from Justdy.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/tutoring"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-7 text-sm font-bold text-slate-950 transition hover:bg-violet-100"
            >
              Explore tutoring <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/create"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 bg-white/[.06] px-7 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4" /> Create with AI
            </Link>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
