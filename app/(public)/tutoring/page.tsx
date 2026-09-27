import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  Clock3,
  GraduationCap,
  MessageSquareText,
  ShieldCheck,
  Target,
  Video,
} from "lucide-react";
import { Instrument_Serif, Inter } from "next/font/google";


import { JustdyChatbot } from "@/app/_components/chat/JustdyChatbot";
import prisma from "@/lib/prisma";
import MarketingNavbar from "@/app/_components/MarketingNavbar";
import MarketingFooter from "@/app/_components/MarketingFooter";

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

type PublicService = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  price: number | null;
  currency: string;
  subject: string | null;
  gradeLevels: unknown;
};

const outcomes = [
  {
    icon: Brain,
    title: "Stronger understanding",
    text: "Move beyond memorizing steps and understand the reasoning behind the mathematics.",
  },
  {
    icon: Target,
    title: "Focused improvement",
    text: "Use tutoring time to address learning gaps, difficult concepts, and academic goals.",
  },
  {
    icon: MessageSquareText,
    title: "More confidence",
    text: "Ask questions, work through mistakes, and become more confident with challenging problems.",
  },
];

const includedBenefits = [
  "Live online mathematics instruction",
  "Personalized support based on student needs",
  "Guided practice and problem solving",
  "Homework and schoolwork support where applicable",
  "Test and exam preparation where applicable",
  "Clear feedback and progress-focused instruction",
];

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
}

function formatPrice(amount: number | null, currency: string) {
  if (amount === null || amount === undefined) {
    return "Contact us";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

  function ServiceCard({ service }: { service: PublicService }) {
      const grades = toStringArray(service.gradeLevels);

      return (
       <article className="group relative overflow-hidden rounded-sm border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_16px_45px_rgba(15,23,42,0.12)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-emerald-900" />
        <div className="p-6 sm:p-7">
          <div className="relative">
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50 text-emerald-900">
                <span className="text-base font-bold">
                 {formatPrice(service.price, service.currency)}
                </span>
              </div>
            </div>
            {/* Popular badge */}
            <span className="absolute right-0 top-1 rotate-[8deg] rounded-full bg-emerald-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-sm">
              New
            </span>

            {/* Title */}
            <div className="mt-4">
              <h3 className="text-[22px] font-semibold items-center leading-tight tracking-tight text-emerald-950">
                {service.title}
              </h3>
              <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-500">
                {service.description ||
                  "Personalized mathematics tutoring designed around the learner's needs, current level, and academic goals."}
              </p>
            </div>
          </div>

                      {/* -------------------------------------------------------
          * FEATURES
          * ------------------------------------------------------- */}
          <div className="mt-4">

            <h4 className="text-[15px] font-semibold tracking-tight text-emerald-900">
              Designed for
            </h4>

            {grades.length > 0 ? (
              <div className="mt-4 space-y-3">

                {grades.slice(0, 4).map((grade) => (
                  <div
                    key={grade}
                    className="flex items-center gap-2.5 text-sm text-slate-600"
                  >

                    {/* Checkmark */}
                    <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-white">
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        className="h-3 w-3"
                      >
                        <path
                          d="M5 10.5L8.2 13.5L15 6.5"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>

                    <span className="leading-5">
                      {grade}
                    </span>

                  </div>
                ))}

                {grades.length > 4 && (
                  <div className="flex items-center gap-2.5 text-sm text-emerald-950">

                    <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-950 text-[10px] font-semibold text-slate-500">
                      +
                    </span>

                    <span>
                      {grades.length - 4} more
                    </span>

                  </div>
                )}

              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2.5 text-sm text-slate-500">

                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-3 w-3"
                  >
                    <path
                      d="M5 10.5L8.2 13.5L15 6.5"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

                Personalized mathematics tutoring

              </div>
            )}

          </div>

    


          {/* -------------------------------------------------------
          * CTA
          * ------------------------------------------------------- */}
          <Link
            href={`/tutoring/${encodeURIComponent(service.id)}`}
            className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-emerald-900 px-5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(16,185,129,0.18)] transition-all duration-200 hover:bg-emerald-600 hover:shadow-[0_8px_24px_rgba(16,185,129,0.24)] active:scale-[0.99]"
          >
            Explore this package

            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>

        </div>
      </article>
      );
    }

async function getPublicServices(): Promise<PublicService[]> {
  return prisma.service.findMany({
    where: {
      type: "TUTORING",
      status: "Published",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      durationMinutes: true,
      price: true,
      currency: true,
      subject: true,
      gradeLevels: true,
    },
  });
}

export default async function TutoringPage() {
  const services = await getPublicServices();

  return (
    <div
      className={`${inter.variable} ${instrumentSerif.variable} min-h-screen overflow-x-hidden bg-background text-white`}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      <MarketingNavbar />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/8 bg-background">
          <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-16 sm:px-8 lg:px-12 lg:pb-24 lg:pt-20">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mt-7 text-balance text-3xl font-extrabold leading-[0.96] tracking-[-0.06em] text-emerald-950 sm:text-4xl lg:text-5xl">
                List of learning packages
              </h1>

              <p className="mx-auto mt-6 max-w-4xl text-base leading-6 text-emerald-900 sm:text-md">
                Explore our available tutoring services and learning programs.
                Each service is designed to provide focused mathematics instruction,
                practical support, and a clear path toward progress.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/tutors"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-emerald-900 px-7 text-sm font-semibold text-white transition hover:bg-emerald-950"
                >
                  Find a Tutor
                  <ArrowRight className="h-4 w-4" />
                </Link>
               
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className="border-b border-white/8 bg-background">
          <div className="mx-auto max-w-6xl px-6 py-2 sm:px-8 lg:px-10">
         

            {services.length > 0 ? (
              <div className="grid gap-2 lg:grid-cols-3">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="mt- rounded-sm border border-white/10 bg-white/2.5 p-10 text-center">
                <GraduationCap className="mx-auto h-8 w-8 text-white/30" />
                <h3 className="mt-4 text-lg font-semibold text-white">
                  Tutoring services are being prepared.
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/45">
                  Please check back soon for available mathematics tutoring programs.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* INCLUDED BENEFITS */}
        <section className="border-b mt-10 border-white/8 bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground">
                  What you can expect
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
                  Professional support from start to progress.
                </h2>
                <p className="mt-5 text-base leading-7 text-muted-foreground">
                  Service details vary by program, but every tutoring experience is
                  designed around meaningful mathematics learning.
                </p>
              </div>

              <div className="grid gap-3">
                {includedBenefits.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-4 rounded-sm bg-white p-3"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm leading-6 text-emerald-950">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* OUTCOMES */}
        <section className="border-b border-white/8 bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold tracking-[0.18em] text-emerald-950">
                The goal
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
                Designed for meaningful progress.
              </h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {outcomes.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-sm bg-white p-7"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-950 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-emerald-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-b border-white/8 bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
                Simple, focused, consistent.
              </h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                ["01", "Choose", "Review the available tutoring services and select the one that fits your goals."],
                ["02", "Enroll", "Create your learner account and continue with the selected service."],
                ["03", "Learn", "Meet for live instruction, practice, feedback, and continued progress."],
              ].map(([number, title, text]) => (
                <div
                  key={number}
                  className="rounded-sm bg-white p-7"
                >
                  <span className="text-sm font-bold text-muted-foreground">{number}</span>
                  <h3 className="mt-5 text-xl font-semibold text-emerald-900">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROGRAM DETAILS */}
        <section className="border-b border-white/8 bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                [Video, "Live instruction", "Learn face-to-face online with real-time guidance."],
                [Clock3, "Structured support", "Choose a service with a format designed around its learning goals."],
                [BookOpen, "Guided practice", "Work through problems with support and feedback."],
                [ShieldCheck, "Supportive learning", "Ask questions and learn in a focused environment."],
              ].map(([Icon, title, text]) => {
                const ItemIcon = Icon as typeof Video;

                return (
                  <div
                    key={title as string}
                    className="rounded-sm bg-white p-6"
                  >
                    <ItemIcon className="h-5 w-5 text-emerald-900" />
                    <h3 className="mt-4 text-sm font-semibold text-emerald-950">
                      {title as string}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {text as string}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative overflow-hidden bg-background">
         
          <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center sm:px-8">
            <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground">
              Start learning
            </p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-emerald-950 sm:text-5xl">
              Find the right math support.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">
              Explore the available services above, choose the learning experience
              that fits your needs, and continue to enrollment.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/tutors"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-emerald-900 px-7 text-sm font-semibold text-white transition hover:bg-emerald-950"
              >
                Find a Tutor
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#services"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-emerald-900 px-7 text-sm font-semibold text-emerald-950 transition hover:bg-white/[0.07]"
              >
                View services
              </a>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-sm border border-emerald-900 px-7 text-sm font-semibold text-emerald-950 transition hover:bg-white/[0.07]"
              >
                Back to Home
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
