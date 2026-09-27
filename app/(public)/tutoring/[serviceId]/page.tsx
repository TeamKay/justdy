import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Target,
  Video,
} from "lucide-react";
import { Instrument_Serif, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { JustdyChatbot } from "@/app/_components/chat/JustdyChatbot";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import MarketingFooter from "@/app/_components/MarketingFooter";
import MarketingNavbar from "@/app/_components/MarketingNavbar";

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

type PageProps = {
  params: Promise<{
    serviceId: string;
  }>;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
}

function formatPrice(amount: number | null, currency: string) {
  if (amount === null || amount === undefined) return "Contact us";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatDuration(minutes: number | null) {
  if (!minutes) return "Flexible duration";
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

async function getService(serviceId: string) {
  return prisma.service.findFirst({
    where: {
      id: serviceId,
      type: "TUTORING",
      status: "Published",
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
      provider: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export default async function TutoringServiceDetailPage({ params }: PageProps) {
  const { serviceId } = await params;
  const service = await getService(serviceId);

  if (!service) notFound();

  // Read the Better Auth session on the server so the enrollment CTA
  // behaves correctly for both authenticated and unauthenticated users.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const enrollmentUrl = `/tutoring/enroll?serviceId=${encodeURIComponent(service.id)}`;
  const continueUrl = session?.user
    ? enrollmentUrl
    : `/auth?mode=signup&serviceId=${encodeURIComponent(service.id)}&callbackUrl=${encodeURIComponent(enrollmentUrl)}`;

  const grades = toStringArray(service.gradeLevels);
  const price = formatPrice(service.price, service.currency);

  const benefits = [
    "Personalized mathematics instruction",
    "Live online learning and real-time guidance",
    "Focused practice and problem solving",
    "Support aligned with the learner's needs",
    "Questions, feedback, and clarification during instruction",
    "Progress-focused learning support",
  ];

  return (
    <div
      className={`${inter.variable} ${instrumentSerif.variable} min-h-screen overflow-x-hidden bg-background text-white`}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      <MarketingNavbar />

      <main>
        <section className="relative overflow-hidden border-b border-white/8 bg-background">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.10) 1px, transparent 0)",
              backgroundSize: "28px 28px",
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))",
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))",
            }}
          />

          <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-10 sm:px-8 lg:px-12 lg:pb-24">
            <Link
              href="/tutoring"
              className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white/75"
            >
              <ArrowLeft className="h-4 w-4" />
              All tutoring services
            </Link>

            <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3.5 py-1.5 text-xs font-medium text-white/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Mathematics Tutoring
                </div>

                <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
                  {service.title}
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">
                  {service.description ||
                    "Personalized mathematics tutoring designed around the learner's needs, goals, and current level of understanding."}
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  {service.subject ? (
                    <span className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs text-white/60">
                      {service.subject}
                    </span>
                  ) : null}

                  {grades.map((grade) => (
                    <span
                      key={grade}
                      className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs text-white/60"
                    >
                      {grade}
                    </span>
                  ))}
                </div>
              </div>

              <aside className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 shadow-[0_25px_80px_rgba(0,0,0,0.28)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
                  Service investment
                </p>

                <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                  {price}
                </p>

                <div className="mt-6 grid gap-3">
                  <div className="flex items-center justify-between rounded-xl bg-white/[0.035] px-4 py-3">
                    <span className="flex items-center gap-2 text-xs text-white/40">
                      <Clock3 className="h-4 w-4" />
                      Duration
                    </span>
                    <span className="text-sm font-medium text-white/75">
                      {formatDuration(service.durationMinutes)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/[0.035] px-4 py-3">
                    <span className="flex items-center gap-2 text-xs text-white/40">
                      <BookOpen className="h-4 w-4" />
                      Subject
                    </span>
                    <span className="max-w-[55%] text-right text-sm font-medium text-white/75">
                      {service.subject || "Mathematics"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/[0.035] px-4 py-3">
                    <span className="flex items-center gap-2 text-xs text-white/40">
                      <GraduationCap className="h-4 w-4" />
                      Instructor
                    </span>
                    <span className="max-w-[55%] truncate text-right text-sm font-medium text-white/75">
                      {service.provider.name || "Mathematics tutor"}
                    </span>
                  </div>
                </div>

                <Link
                  href={continueUrl}
                  className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-900 px-6 text-sm font-semibold text-white transition hover:bg-emerald-950"
                >
                  {session?.user ? "Continue to enrollment" : "Sign in to continue"}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="mt-4 text-center text-xs leading-5 text-white/30">
                  {session?.user
                    ? "You are signed in. Continue to enrollment to confirm this service and provide the required details."
                    : "You will create or sign in to your learner account before enrollment."}
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-b border-white/8 bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-100">
                  What is included
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Focused support built around learning.
                </h2>
                <p className="mt-5 text-sm leading-7 text-white/45">
                  The exact structure of the service is determined by the package
                  details shown above. The learning experience is designed to keep
                  instruction focused, practical, and personalized.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-300/[0.09] text-emerald-200">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm leading-6 text-white/65">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/8 bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                [Video, "Live learning", "Real-time instruction and guidance during the learning experience."],
                [Target, "Focused progress", "Use tutoring time to work directly on the learner's goals and needs."],
                [ShieldCheck, "Supportive environment", "A structured space to ask questions, practice, and build understanding."],
              ].map(([Icon, title, text]) => {
                const ItemIcon = Icon as typeof Video;

                return (
                  <div
                    key={title as string}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7"
                  >
                    <ItemIcon className="h-5 w-5 text-sky-100" />
                    <h3 className="mt-5 text-lg font-semibold text-white">
                      {title as string}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/45">
                      {text as string}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-background">
          <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:px-8">
            <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Ready to continue?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/45">
              Continue to enrollment to confirm this service and complete the next
              steps for your learner account.
            </p>

            <Link
              href={continueUrl}
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-900 px-7 text-sm font-semibold text-white transition hover:bg-emerald-950"
            >
              Continue to enrollment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <JustdyChatbot />
    </div>
  );
}
