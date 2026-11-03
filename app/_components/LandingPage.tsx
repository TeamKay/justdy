"use client";

import Link from "next/link";
import {
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

const audiences = [
  {
    icon: GraduationCap,
    title: "Strengthen number sense",
    description:
      "Build confidence with fractions, decimals, percentages, ratios, and the skills that support later math.",
  },
  {
    icon: Layers3,
    title: "Think algebraically",
    description:
      "Develop comfort with expressions, equations, patterns, and proportional reasoning.",
  },
  {
    icon: BookOpen,
    title: "Solve problems strategically",
    description:
      "Practise multi-step problems, explain mathematical thinking, and apply concepts in new situations.",
  },
  {
    icon: Users,
    title: "Grow independent confidence",
    description:
      "Learn with a tutor and practise independently so students are better prepared for high school expectations.",
  },
];

const steps = [
  {
    number: "WEEKS 01–04",
    title: "Build a strong foundation",
    description:
      "Begin with a skills check, identify learning gaps, and strengthen essential middle school concepts such as fractions, decimals, percentages, ratios, and number sense.",
  },
  {
    number: "WEEKS 05–08",
    title: "Develop essential math skills",
    description:
      "Build algebraic thinking, work with expressions and equations, explore geometry and proportional reasoning, and practise multi-step problem-solving.",
  },
  {
    number: "WEEKS 09–12",
    title: "Get ready for high school",
    description:
      "Apply skills to more challenging problems, strengthen independent learning habits, and review progress with a final readiness check and next-step plan.",
  },
];



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
    <div className="group rounded-xs border border-slate-200/80 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-900/5">
      <div className="flex h-12 w-12 items-center justify-center rounded-xs bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
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
      className={`${inter.variable} ${instrumentSerif.variable} min-h-screen overflow-x-hidden bg-[#FAD6AC] text-slate-950`}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      <div className="relative isolate overflow-hidden bg-[#FAD6AC] text-[#171717]">
        {/* Warm peach background with the fine orange dotted pattern from the reference. */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(244,171,82,0.72) 1.15px, transparent 1.3px)",
            backgroundSize: "25px 25px",
          }}
        />
       <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <span className="absolute left-[8%] top-[22%] -rotate-12 font-serif text-5xl text-[#B97832]/20 sm:text-7xl">∑</span>
          <span className="absolute right-[12%] top-[25%] rotate-[9deg] font-serif text-4xl text-[#B97832]/25 sm:text-6xl">π</span>

          <span className="absolute bottom-[20%] left-[15%] font-mono text-sm text-muted-foreground/35 sm:text-base">
            x² + y² = z²
          </span>
          <span className="absolute bottom-[26%] right-[9%] font-mono text-sm text-[#9A642F]/35 sm:text-base">
            f(x) = mx + b
          </span>

          {/* Additional math symbols */}
          <span className="absolute left-[28%] top-[12%] rotate-12 font-serif text-4xl text-[#B97832]/20 sm:text-6xl">
            ∫
          </span>
          <span className="absolute right-[30%] top-[16%] -rotate-6 font-serif text-4xl text-[#9A642F]/25 sm:text-5xl">
            √
          </span>
          <span className="absolute left-[45%] bottom-[15%] rotate-12 font-serif text-5xl text-[#B97832]/20 sm:text-6xl">
            ∞
          </span>
          <span className="absolute right-[22%] bottom-[12%] -rotate-12 font-serif text-4xl text-[#9A642F]/25 sm:text-5xl">
            Δ
          </span>
          <span className="absolute left-[5%] top-[65%] rotate-6 font-serif text-4xl text-[#B97832]/20 sm:text-5xl">
            θ
          </span>
        </div>
        <MarketingNavbar />

              
        <main>
          <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-12 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-20">
             
            {/* Centered hero content */}
            <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white px-4 py-2 text-xs font-medium text-black shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-lg bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,.75)]" />
                Math Mastery Made Simple
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </div>

              {/* Main heading */}
              <h1 className="mx-auto mt-7 max-w-6xl text-4xl font-semibold leading-[1.08] tracking-[-.055em] text-[#372149] sm:text-5xl lg:text-[3.8em]">
                You Deserve to Shine in Math.
                <span className="block text-[3.0rem] text-[#ffffff]">
                  Build Confidence, Unlock Potential.
                </span>
              </h1>

              {/* Supporting description */}
              <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-[#66584B] sm:text-lg sm:leading-8">
                Help your child understand mathematics, overcome learning challenges,
                and develop the confidence to reach their full potential—one step at a time.
              </p>

              {/* Call-to-action buttons */}
              <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">

                <Link
                  href="/tutoring"
                  className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-white px-7 text-sm font-semibold text-black shadow-md shadow-[#A96A2B]/20 transition hover:-translate-y-0.5 hover:bg-white/90 sm:w-auto"
                >
                  Schedule a pre-assessment
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/videos"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#A96A2B]/55 bg-white/25 px-7 text-sm font-medium text-[#29231D] transition hover:border-[#A96A2B] hover:bg-white/45 sm:w-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  Explore Learning Videos
                </Link>

              </div>

              {/* Justdy introduction video */}
          
            {/* Centered Justdy introduction video */}
            <div className="relative mx-auto mt-12 w-full max-w-270 sm:mt-14">

              {/* Subtle background glow */}
              <div className="absolute -inset-3 rounded-lg bg-[#D9903D]/20 blur-2xl" />

              {/* Video container */}
              <div className="relative overflow-hidden rounded-lg border border-[#A96A2B]/25 bg-black shadow-2xl shadow-[#8B5A2B]/20">

                {/* 16:9 YouTube video */}
                <div className="relative aspect-video w-full">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src="https://www.youtube-nocookie.com/embed/_LLraEGFDwQ?rel=0"
                    title="Introducing Justdy — personalized middle school math support"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

              </div>
            </div>


            </div>

            {/* Program highlights */}
            <div className="mx-auto mt-16 grid w-full max-w-4xl grid-cols-3 border-y border-[#A96A2B]/35 py-7 sm:mt-20 sm:py-8">

              <div className="px-2 text-center sm:px-5">
                <p className="text-xl font-semibold tracking-tight text-[#372149] sm:text-2xl">
                  12 Weeks
                </p>
                <p className="mt-2 text-xs leading-5 text-[#735F4C] sm:text-sm">
                  Structured learning journey
                </p>
              </div>

              <div className="border-l border-[#A96A2B]/35 px-2 text-center sm:px-5">
                <p className="text-xl font-semibold tracking-tight text-[#372149] sm:text-2xl">
                  Grades 6–8
                </p>
                <p className="mt-2 text-xs leading-5 text-[#735F4C] sm:text-sm">
                  Middle school focus
                </p>
              </div>

              <div className="border-l border-[#A96A2B]/35 px-2 text-center sm:px-5">
                <p className="text-xl font-semibold tracking-tight text-[#372149] sm:text-2xl">
                  1-on-1 + Practice
                </p>
                <p className="mt-2 text-xs leading-5 text-[#735F4C] sm:text-sm">
                  Tutor and independent learning
                </p>
              </div>

            </div>

          </section>
        </main>

      </div>

      <section className="bg-[#fbfefb]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="mt-4 text-3xl font-bold tracking-tighter text-[#372149] sm:text-5xl">
              The middle school skills that prepare students for what comes next.
            </h2>
            <p className="mx-auto mt-5 max-w-4xl text-base leading-7 text-muted-foreground sm:text-sm sm:leading-8">
              A strong high school transition starts with strong middle school foundations. Justdy combines one-on-one tutor instruction with independent practice between sessions, helping students understand concepts, apply their skills, and grow in confidence.
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


      <section className="bg-[#f0f7f1]">
        <div className="mx-auto grid max-w-7xl items-start gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:px-12 lg:py-28">
          <div className="lg:sticky lg:top-24">
            <h2 className="mt-4 text-3xl font-bold tracking-tighter text-[#372149] sm:text-5xl">
              Two ways to learn. One clear goal: high school readiness.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Students work directly with a tutor and continue learning between sessions through structured practice, review, and learning resources.
            </p>
            <Link
              href="/tutoring"
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-slate-950 transition hover:text-emerald-700"
            >
              Schedule Free Pre-assessment <ChevronRight className="h-4 w-4" />
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
                title: "Educational games",
                description:
                  "Reinforce tutoring lessons with focused practice and step-by-step support.",
                href: "/tutoring",
              },
              {
                icon: BookOpen,
                title: "Free lesson videos",
                description:
                  "Review completed work, identify what needs more attention, and see how skills are developing.",
                href: "/videos",
              },
              {
                icon: Sparkles,
                title: "Learning resources",
                description:
                  "Use learning materials and activities to revisit concepts and practise at your own pace.",
                href: "/resources",
              },
            ].map(({ icon: Icon, title, description, href }) => (
              <Link
                key={title}
                href={href}
                className="group flex items-center gap-5 rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg sm:p-6"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#3f3830] text-white transition group-hover:bg-emerald-600">
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
                <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
              </Link>
            ))}
          </div>
        </div>
      </section>


      <section className=" text-[#372149]">
         <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(244,171,82,0.72) 1.15px, transparent 1.3px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#372149]">
              YOUR 12-WEEK LEARNING JOURNEY
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tighter sm:text-5xl">
              A focused path from middle school math to high school readiness.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              The program combines one-on-one tutoring with independent practice. Each phase builds on the last, with progress reviews to help guide the next steps.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="rounded-lg border border-white/10 bg-white p-7 transition hover:bg-white/40 sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#372149]">
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


      <section className="bg-[#fbfefb]">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8 lg:py-28">
          <div className="mx-auto h-1 w-12 rounded-lg bg-[#3f3830]" />
          <blockquote className="mx-auto mt-8 max-w-4xl text-3xl font-semibold leading-tight tracking-tighter text-[#372149] sm:text-5xl">
            “The right support at the right moment can change the way you
            learn.”
          </blockquote>
          <p className="mt-6 text-sm font-semibold text-slate-400">
            The Justdy learning experience
          </p>
        </div>
      </section>


      <section className="relative isolate overflow-hidden bg-[#FAD6AC] text-[#372149]">
          <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(244,171,82,0.72) 1.15px, transparent 1.3px)",
            backgroundSize: "25px 25px",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(52,211,153,.23),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(190,242,100,.16),transparent_35%)]" />
        <div className="mx-auto max-w-6xl px-5 py-20 text-center sm:px-8 lg:py-28">
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white px-4 py-2 text-xs font-semibold text-[#372149]">
            <Sparkles className="h-3.5 w-3.5 text-blue-900" /> A STRONGER START TO HIGH SCHOOL
          </div>
          <h2 className="mt-7 text-4xl font-bold tracking-[-.06em] sm:text-6xl">
            Ready to build high school confidence?
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
            Start with a conversation about your student’s current math skills and goals. We’ll help you identify the right support for their 12-week journey toward high school readiness.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/tutoring"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-7 text-sm font-bold text-slate-950 transition hover:bg-emerald-100"
            >
              Start with free pre-assessment <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
                  href="/videos"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#A96A2B]/55 bg-white/25 px-7 text-sm font-medium text-[#29231D] transition hover:border-[#A96A2B] hover:bg-white/45 sm:w-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  Explore Learning Videos
                </Link>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}


