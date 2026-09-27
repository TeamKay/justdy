"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  GraduationCap,
  Layers3,
  MessageSquareText,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { Instrument_Serif, Inter } from "next/font/google";
import MarketingNavbar from "./MarketingNavbar";
import MarketingFooter from "./MarketingFooter";
import { JustdyChatbot } from "@/app/_components/chat/JustdyChatbot";
import Image from "next/image";

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

const showcaseGroups = [
  {
    title: "1-on-1 Math Tutoring",
    href: "/tutoring",
    media: [
      {
        type: "image" as const,
        src:
          "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=85",
        label: "One-on-one online math tutoring",
      },
    ],
  },
  {
    title: "Live Problem Solving",
    href: "/tutoring",
    media: [
      {
        type: "image" as const,
        src:
          "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=900&q=85",
        label: "Math problem solving",
      },
    ],
  },
  {
    title: "Shared Whiteboard",
    href: "/tutoring",
    media: [
      {
        type: "image" as const,
        src:
          "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=85",
        label: "Collaborative online learning",
      },
    ],
  },
  {
    title: "Homework Support",
    href: "/tutoring",
    media: [
      {
        type: "image" as const,
        src:
          "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=85",
        label: "Homework support",
      },
    ],
  },
  {
    title: "Exam Preparation",
    href: "/tutoring",
    media: [
      {
        type: "image" as const,
        src:
          "https://images.unsplash.com/photo-1453738773917-9c3eff1db985?auto=format&fit=crop&w=900&q=85",
        label: "Math exam preparation",
      },
    ],
  },
] as const;


/* ============================================================
   STRIPE-INSPIRED COLOR BACKGROUND
   ============================================================ */

function StripeColorBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Large ambient color fields */}
      <div className="absolute left-[15%] top-[-18%] h-[520px] w-[760px] rounded-full bg-blue-400/20 blur-[120px]" />
      <div className="absolute right-[-8%] top-[-5%] h-[620px] w-[620px] rounded-full bg-fuchsia-400/20 blur-[130px]" />
      <div className="absolute right-[12%] top-[20%] h-[520px] w-[520px] rounded-full bg-orange-400/20 blur-[120px]" />
      {/* Flowing ribbon */}
      <svg
        className="absolute -right-[14%] -top-[18%] h-[115%] w-[88%] min-w-[900px]"
        viewBox="0 0 1000 900"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="stripeGradientOne"
            x1="50"
            y1="100"
            x2="900"
            y2="700"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="28%" stopColor="#818cf8" />
            <stop offset="55%" stopColor="#c084fc" />
            <stop offset="78%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>

          <linearGradient
            id="stripeGradientTwo"
            x1="100"
            y1="0"
            x2="950"
            y2="800"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="25%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#d946ef" />
            <stop offset="72%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>

          <filter
            id="stripeBlur"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        {/* Soft outer ribbon */}
        <path
          d="M 130 -80
             C 300 120, 470 150, 620 310
             C 780 480, 830 640, 1100 830"
          stroke="url(#stripeGradientOne)"
          strokeWidth="170"
          strokeLinecap="round"
          opacity="0.22"
          filter="url(#stripeBlur)"
        />

        {/* Main colorful ribbon */}
        <path
          d="M 80 -100
             C 280 110, 430 140, 600 300
             C 790 475, 820 625, 1110 850"
          stroke="url(#stripeGradientTwo)"
          strokeWidth="115"
          strokeLinecap="round"
          opacity="0.68"
        />

        {/* Inner ribbon highlight */}
        <path
          d="M 90 -110
             C 285 105, 440 145, 605 295
             C 790 465, 830 615, 1110 845"
          stroke="url(#stripeGradientOne)"
          strokeWidth="34"
          strokeLinecap="round"
          opacity="0.58"
        />

        {/* Secondary flowing ribbon */}
        <path
          d="M 360 -120
             C 520 80, 620 170, 735 330
             C 850 490, 850 630, 1030 780"
          stroke="url(#stripeGradientTwo)"
          strokeWidth="44"
          strokeLinecap="round"
          opacity="0.38"
        />
      </svg>

      {/* Keep left side clean for text */}
      <div className="absolute inset-0 bg-linear-to-r from-background via-background/90 via-[52%] to-transparent" />
      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-background via-background/50 to-transparent" />
    </div>
  );
}





/* ============================================================
   SHOWCASE CARD
   ============================================================ */

function ShowcaseMediaCard({
  group,
}: {
  group: (typeof showcaseGroups)[number];
}) {
  const media = group.media[0];

  if (!media) return null;

  return (
    <Link
      href={group.href}
      className="group relative aspect-9/16 w-full max-w-46.25 justify-self-center overflow-hidden rounded-xl text-left shadow-[0_22px_65px_rgba(15,23,42,0.12)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_85px_rgba(15,23,42,0.18)]"
      aria-label={`Open ${group.title}`}
    >
      <div className="absolute inset-0 overflow-hidden bg-background">
        <Image
          key={media.src}
          src={media.src}
          alt={media.label}
          width={120}
          height={120}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-slate-950/90 via-slate-950/55 to-transparent px-4 pb-4 pt-20">
        <h2 className="text-sm font-semibold leading-tight tracking-[-0.02em] text-white">
          {group.title}
        </h2>
      </div>
    </Link>
  );
}


/* ============================================================
   LANDING PAGE
   ============================================================ */

export default function LandingPage() {
  return (
    <div
      className={`${inter.variable} ${instrumentSerif.variable} min-h-screen overflow-x-hidden bg-background text-foreground`}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      <MarketingNavbar />

      <main className="relative overflow-hidden">

        {/* Global subtle background */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.025),transparent_42%)]"
        />

        {/* ======================================================
            HERO
            ====================================================== */}

        <section className="relative overflow-hidden border-b border-black/6 bg-background">

          <StripeColorBackground />

          <div className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8 lg:px-12 lg:pb-28 lg:pt-14">

            {/* Hero copy */}
            <div className="mx-auto max-w-5xl text-center">

              {/* Eyebrow */}
              <div className="mx-auto inline-flex items-center gap-2 rounded-xl border border-black/8 bg-cyan-500 px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-xl bg-amber-400 shadow-[0_0_10px_rgba(16,185,129,0.55)]" />
                Live Math Tutoring
              </div>

            {/* Headline */}
            <h1
              className="mx-auto mt-8 max-w-6xl text-balance text-[3.0rem] font-bold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:text-[5rem] lg:text-[3rem]"
            >
              Personalized Math{" "}
              <span
                className="font-normal italic"
                style={{
                  fontFamily: "var(--font-instrument-serif), Georgia, serif",
                }}
              >
                Learning
              </span>
              <br />
              That Works.
            </h1>

            {/* Description */}
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-500 sm:text-md sm:leading-5">
              Structured, one-on-one mathematics instruction designed to
              strengthen skills, improve problem-solving, and build lasting
              confidence.
            </p>

              {/* CTA */}
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">

                <Link
                  href="/tutoring"
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-900 px-6 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(79,70,229,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-950 hover:shadow-[0_18px_40px_rgba(79,70,229,0.28)]"
                >
                  Explore Services
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/videos"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-emerald-900/20 bg-background px-6 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition hover:border-black/[0.14] hover:bg-white"
                >
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                  Free Lessons
                </Link>

              </div>
            </div>


            {/* LIVE TUTORING SHOWCASE */}
            <div className="relative mx-auto mt-12 max-w-245 sm:mt-14">

              <div className="grid grid-cols-2 items-start justify-center gap-3 sm:gap-4 md:grid-cols-5">
                {showcaseGroups.map((group) => (
                  <ShowcaseMediaCard
                    key={group.title}
                    group={group}
                  />
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">

                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live tutoring
                </span>

                <span className="hidden h-3 w-px bg-black/10 sm:block" />

                <span>
                  Live video · Math tutoring · Whiteboard · Practice · Exam prep
                </span>

              </div>
            </div>

          </div>
        </section>


        {/* ======================================================
            AUDIENCES
            ====================================================== */}

        <section className="relative border-b border-black/6 bg-background">
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12">

            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
                Math support for every learning moment.
              </h2>

              <p className="mt-4 text-lg leading-6 text-slate-600">
                Whether the need is homework help, concept review, exam
                preparation, or extra practice, live tutoring gives learners a
                place to ask, solve, and understand.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {audiences.map((audience) => {
                const Icon = audience.icon;

                return (
                  <div
                    key={audience.title}
                    className="group rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_65px_rgba(15,23,42,0.10)]"
                  >

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="mt-5 text-lg font-semibold text-slate-950">
                      {audience.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {audience.description}
                    </p>

                  </div>
                );
              })}

            </div>
          </div>
        </section>


        {/* ======================================================
            TUTORING FEATURES
            ====================================================== */}

        <section className="relative bg-background">

          <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12">

            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">

              <div>

                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                  <Sparkles className="h-5 w-5" />
                </div>

                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
                  What you get
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  More than just an answer.
                </h2>

                <p className="mt-5 text-lg leading-8 text-slate-600">
                  A live session is built around understanding. Your tutor can
                  explain the concept, demonstrate the steps, answer questions,
                  and guide you through practice until the process makes sense.
                </p>

                <Link
                  href="/tutoring"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                >
                  View 12-Week Program
                  <ArrowRight className="h-4 w-4" />
                </Link>

              </div>


              <div className="grid gap-4 sm:grid-cols-2">

                {tutoringFeatures.map((tool) => {
                  const Icon = tool.icon;

                  return (
                    <Link
                      key={tool.title}
                      href={tool.href}
                      className="group rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_65px_rgba(15,23,42,0.10)]"
                    >

                      <div className="flex items-start justify-between">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Icon className="h-5 w-5" />
                        </div>

                        <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" />

                      </div>

                      <h3 className="mt-5 font-semibold text-slate-950">
                        {tool.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {tool.description}
                      </p>

                    </Link>
                  );
                })}

              </div>
            </div>
          </div>
        </section>



        {/* ======================================================
            HOW IT WORKS
            ====================================================== */}

        <section className="relative border-y border-black/6 bg-background">
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
                How tutoring works
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                From stuck to understanding.
              </h2>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="relative rounded-2xl border border-black/[0.07] bg-white p-7 shadow-[0_18px_55px_rgba(15,23,42,0.05)]"
                >
                  <span className="text-sm font-bold text-indigo-600">
                    {step.number}
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {step.description}
                  </p>
                </div>
              ))}

            </div>
          </div>
        </section>


        {/* ======================================================
            TUTORING
            ====================================================== */}

        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_25px_80px_rgba(15,23,42,0.09)]">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 sm:p-12 lg:p-14">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
                    Live tutoring
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    Learn with a real person, in real time.
                  </h2>
                  <p className="mt-5 text-lg leading-8 text-slate-600">
                    Book a live one-on-one math tutoring session. Learn
                    face-to-face with live video, guided problem solving, and a
                    shared whiteboard.
                  </p>
                  <Link
                    href="/tutoring"
                    className="mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-emerald-900 px-5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(79,70,229,0.16)] transition hover:bg-emerald-950"
                  >
                    Start a tutoring session
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                </div>


                <div className="relative min-h-82.5 overflow-hidden border-t border-black/[0.06] bg-slate-50 lg:border-l lg:border-t-0">
                  <div className="absolute left-8 top-10 w-[calc(100%-4rem)] rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-xs text-slate-400">
                          Upcoming session
                        </p>

                        <p className="mt-1 font-semibold text-slate-950">
                          Mathematics · Live session
                        </p>

                      </div>

                      <div className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
                        Scheduled
                      </div>

                    </div>


                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div className="rounded-xl border border-black/[0.06] bg-slate-50 p-4">

                        <p className="text-xs text-slate-400">
                          Tutor
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-900">
                          Math tutor
                        </p>

                      </div>


                      <div className="rounded-xl border border-black/[0.06] bg-slate-50 p-4">

                        <p className="text-xs text-slate-400">
                          Format
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-900">
                          Online
                        </p>

                      </div>

                    </div>


                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-4 py-3">

                      <MessageSquareText className="h-4 w-4 text-indigo-600" />

                      <span className="text-xs text-slate-500">
                        Work through math problems together in real time
                      </span>

                    </div>

                  </div>

                </div>

              </div>
            </div>
          </div>
        </section>



        {/* ======================================================
            WHY CHOOSE US
            ====================================================== */}

        <section className="border-y border-black/[0.06] bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
                  Why choose personalized tutoring
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Learn the math, not just the answer.
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-600">
                  Students learn more effectively when they can ask questions,
                  receive immediate feedback, and work through challenging
                  problems with guidance.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                {[
                  [
                    "Personalized instruction",
                    "Lessons adapt to the student's needs, pace, and learning goals.",
                  ],
                  [
                    "Live 1-on-1 learning",
                    "Focused sessions with direct interaction and real-time support.",
                  ],
                  [
                    "Structured progress",
                    "Consistent weekly instruction creates a clear path for improvement.",
                  ],
                  [
                    "Real understanding",
                    "Build reasoning and problem-solving skills instead of memorizing answers.",
                  ],
                ].map(([title, text]) => (

                  <div
                    key={title}
                    className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.04)]"
                  >

                    <h3 className="text-sm font-semibold text-slate-950">
                      {title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {text}
                    </p>

                  </div>

                ))}

              </div>

            </div>
          </div>
        </section>


        {/* ======================================================
            FINAL CTA
            ====================================================== */}

        <section className="relative overflow-hidden bg-background">

          {/* Small decorative color fields */}
          <div className="pointer-events-none absolute left-[15%] top-0 h-72 w-72 rounded-full bg-indigo-300/15 blur-[100px]" />
          <div className="pointer-events-none absolute right-[15%] bottom-0 h-72 w-72 rounded-full bg-pink-300/15 blur-[100px]" />


          <div className="relative z-10 mx-auto max-w-6xl px-6 py-28 text-center sm:px-8">

            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-xs font-medium text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Personalized Math Support
            </div>

            <h2 className="mt-7 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Ready to build stronger math skills?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-slate-600">
              Give your child personalized instruction, consistent practice,
              and the support they need to grow in mathematics.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">

              <Link
                href="/tutoring"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-900 px-6 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(79,70,229,0.20)] transition hover:-translate-y-0.5 hover:bg-emerald-950"
              >
                Explore Tutoring Programs
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/tutoring"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-black/9 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-black/[0.14] hover:bg-slate-50"
              >
                Find a math tutor
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <JustdyChatbot />
    </div>
  );
}