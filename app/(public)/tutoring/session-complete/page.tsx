import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Heart,
  Sparkles,
} from "lucide-react";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TutoringSessionCompletePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/auth?mode=signin");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (!user) {
    redirect("/auth?mode=signin");
  }

  const normalizedRole = String(user.role ?? "")
    .trim()
    .toUpperCase();

  // Resolve the dashboard using the authenticated database role.
  // Check ADMIN first because an admin may also teach.
  const dashboardUrl =
    normalizedRole === "ADMIN"
      ? "/admin"
      : normalizedRole === "TUTOR"
        ? "/dashboard/educator"
        : "/dashboard";

  const isEducator = normalizedRole === "TUTOR" ||
    normalizedRole === "ADMIN";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F1F5F9] px-4 py-12 text-[#142F57]">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-blue-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-indigo-300/20 blur-3xl" />

      <section className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-white/80 bg-white shadow-[0_30px_100px_rgba(20,47,87,0.12)]">
        {/* Brand header */}
        <header className="relative overflow-hidden bg-[#142F57] px-7 py-8 text-white sm:px-12">
          <div className="absolute -right-12 -top-20 size-64 rounded-full border border-white/10" />
          <div className="absolute -right-2 -top-10 size-44 rounded-full border border-white/10" />

          <div className="relative mt-9">
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-blue-200">
              {isEducator ? "Session ended" : "You're all set"}
            </p>

            <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {isEducator
                ? "Great teaching makes a difference."
                : "Another step forward in your learning."}
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-6 text-blue-100 sm:text-base">
              {isEducator
                ? "Your tutoring session has been completed. Thank you for helping your learner grow."
                : "Thank you for learning with Justdy. Every question you ask and every concept you master moves you forward."}
            </p>
          </div>
        </header>

        {/* Completion content */}
        <div className="px-7 py-8 sm:px-12 sm:py-10">
          <div className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              {isEducator ? (
                <GraduationCap className="size-5" />
              ) : (
                <BookOpen className="size-5" />
              )}
            </div>

            <div>
              <h2 className="font-semibold text-[#142F57]">
                {isEducator
                  ? "Thank you for teaching with Justdy"
                  : "Keep your learning momentum"}
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                {isEducator
                  ? "You can return to your dashboard to manage upcoming sessions and continue supporting your learners."
                  : "Take a moment to reflect on what you learned today. Your learning history and future sessions can help you stay on track."}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={dashboardUrl}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#142F57] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#1D4378]"
            >
              {normalizedRole === "ADMIN"
                ? "Go to admin dashboard"
                : "Go to dashboard"}
              <ArrowRight className="size-4" />
            </Link>

            {!isEducator && (
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#142F57] transition hover:bg-slate-50"
              >
                <Heart className="size-4 text-rose-500" />
                Continue learning
              </Link>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
            <Sparkles className="size-4 text-blue-500" />
            <span>Every session is progress. Keep moving forward.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
