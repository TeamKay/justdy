import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Target,
  Video,
} from "lucide-react";
import { Instrument_Serif, Inter } from "next/font/google";

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

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
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

function formatDuration(minutes: number | null) {
  if (!minutes) return "Flexible duration";

  if (minutes < 60) {
    return `${minutes} minutes`;
  }

  if (minutes % 60 === 0) {
    return `${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  }

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function GridBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.9]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.10) 1px, transparent 0)",
        backgroundSize: "28px 28px",
        WebkitMaskImage:
          "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)",
        maskImage:
          "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)",
      }}
    />
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

function PricingCard({ service }: { service: PublicService }) {
  const grades = toStringArray(service.gradeLevels);

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_25px_80px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-white/15">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />

      <div className="p-7 sm:p-8 lg:p-9">
        <div className="flex items-start justify-between gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/[0.09] text-emerald-200">
            <GraduationCap className="h-5 w-5" />
          </div>

          <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
            Mathematics
          </span>
        </div>

        <h2 className="mt-7 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {service.title}
        </h2>

        <p className="mt-4 min-h-[72px] text-sm leading-7 text-white/50">
          {service.description ||
            "Personalized mathematics tutoring designed around the learner's needs, current level, and academic goals."}
        </p>

        <div className="mt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/30">
            Investment
          </p>

          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-semibold tracking-tight text-white">
              {formatPrice(service.price, service.currency)}
            </span>

            {service.durationMinutes ? (
              <span className="pb-1 text-sm text-white/35">
                / {formatDuration(service.durationMinutes)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/[0.035] p-4">
            <div className="flex items-center gap-2 text-xs text-white/35">
              <Clock3 className="h-3.5 w-3.5" />
              Duration
            </div>

            <p className="mt-2 text-sm font-semibold text-white/80">
              {formatDuration(service.durationMinutes)}
            </p>
          </div>

          <div className="rounded-xl bg-white/[0.035] p-4">
            <div className="flex items-center gap-2 text-xs text-white/35">
              <BookOpen className="h-3.5 w-3.5" />
              Subject
            </div>

            <p className="mt-2 truncate text-sm font-semibold text-white/80">
              {service.subject || "Mathematics"}
            </p>
          </div>
        </div>

        {grades.length > 0 ? (
          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/30">
              Suitable for
            </p>

            <div className="flex flex-wrap gap-2">
              {grades.slice(0, 5).map((grade) => (
                <span
                  key={grade}
                  className="rounded-md border border-white/8 bg-white/[0.035] px-3 py-1.5 text-xs text-white/60"
                >
                  {grade}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <Link
          href={`/tutoring/${encodeURIComponent(service.id)}`}
          className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-950"
        >
          View service
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

export default async function TutoringPricingPage() {
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
          <GridBackground />

          <div className="pointer-events-none absolute left-1/2 top-20 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-100/[0.06] blur-[140px]" />

          <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-16 sm:px-8 lg:px-12 lg:pb-24 lg:pt-20">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3.5 py-1.5 text-xs font-medium text-white/60">
                <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
                Tutoring pricing
              </div>

              <h1 className="mt-7 text-balance text-4xl font-semibold leading-[0.96] tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
                Simple, transparent pricing for focused math support.
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">
                Choose a tutoring service that matches your learner&apos;s
                needs, goals, and level. Every published service below can be
                explored before you book.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/tutor"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-900 px-7 text-sm font-semibold text-white transition hover:bg-emerald-950"
                >
                  Find a Tutor
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/tutoring"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-7 text-sm font-semibold text-white/75 transition hover:bg-white/[0.07]"
                >
                  Explore tutoring
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* VALUE */}
        <section className="border-b border-white/8 bg-background">
          <div className="mx-auto grid max-w-6xl gap-4 px-6 py-12 sm:px-8 md:grid-cols-3 lg:px-12">
            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300/[0.08] text-emerald-200">
                <Video className="h-4.5 w-4.5" />
              </div>

              <h2 className="mt-5 text-base font-semibold text-white">
                Live instruction
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Work directly with an educator through focused online
                mathematics sessions.
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300/[0.08] text-emerald-200">
                <Target className="h-4.5 w-4.5" />
              </div>

              <h2 className="mt-5 text-base font-semibold text-white">
                Personalized support
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Sessions can focus on learning gaps, difficult concepts,
                schoolwork, or exam preparation.
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300/[0.08] text-emerald-200">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>

              <h2 className="mt-5 text-base font-semibold text-white">
                Secure booking
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Select an available educator and secure your chosen session
                through the booking and payment flow.
              </p>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className="bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12 lg:py-24">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/70">
                  Available services
                </p>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Choose the support that fits.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
                  Pricing shown here comes directly from published tutoring
                  services on Justdy.
                </p>
              </div>

              <Link
                href="/tutor"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white"
              >
                Browse educators
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {services.length > 0 ? (
              <div className="mt-12 grid gap-6 lg:grid-cols-2">
                {services.map((service) => (
                  <PricingCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.025] px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-white/50">
                  <BookOpen className="h-5 w-5" />
                </div>

                <h2 className="mt-6 text-xl font-semibold text-white">
                  Tutoring services are being prepared.
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
                  Check back soon or browse available educators to find
                  mathematics support.
                </p>

                <Link
                  href="/tutor"
                  className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-900 px-6 text-sm font-semibold text-white transition hover:bg-emerald-950"
                >
                  Find a Tutor
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* INCLUDED */}
        <section className="border-t border-white/8 bg-white/[0.015]">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/70">
                  What your investment supports
                </p>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  More than just an hour of instruction.
                </h2>

                <p className="mt-5 text-sm leading-7 text-white/45 sm:text-base">
                  Justdy tutoring is designed around meaningful learning,
                  practical problem solving, and measurable academic progress.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Live online mathematics instruction",
                  "Personalized support based on student needs",
                  "Guided practice and problem solving",
                  "Homework and schoolwork support where applicable",
                  "Test and exam preparation where applicable",
                  "Progress-focused instruction",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-4"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300/[0.09] text-emerald-200">
                      <Check className="h-3 w-3" />
                    </div>

                    <span className="text-sm leading-6 text-white/60">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/8 bg-background">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:px-8 lg:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/70">
              Ready to get started?
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Find an educator and choose a time that works.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
              Browse verified educators, review their available services and
              times, then continue securely through the booking process.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/tutor"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-900 px-7 text-sm font-semibold text-white transition hover:bg-emerald-950"
              >
                Find a Tutor
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tutoring"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 bg-white/[0.035] px-7 text-sm font-semibold text-white/70 transition hover:bg-white/[0.07]"
              >
                Back to tutoring
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}