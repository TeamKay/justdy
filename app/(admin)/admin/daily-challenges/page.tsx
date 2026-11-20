
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays, Sparkles } from "lucide-react";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DailyChallengeManager from "@/app/_components/admin/DailyChallengeManager";

export const dynamic = "force-dynamic";

export default async function DailyChallengesAdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/auth?mode=signin");
  }

  const administrator = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      status: true,
      emailVerified: true,
    },
  });

  if (
    !administrator ||
    administrator.role !== "ADMIN" ||
    administrator.status !== "Active"
  ) {
    redirect("/dashboard");
  }

  if (!administrator.emailVerified) {
    redirect("/verify-email-notice");
  }

  const records = await prisma.dailyChallenge.findMany({
    orderBy: [
      { challengeDate: "desc" },
      { createdAt: "desc" },
    ],
    take: 100,
    select: {
      id: true,
      challengeDate: true,
      gradeLevel: true,
      subject: true,
      topic: true,
      difficulty: true,
      title: true,
      question: true,
      options: true,
      correctAnswer: true,
      hint: true,
      explanation: true,
      points: true,
      status: true,
      _count: {
        select: {
          attempts: true,
        },
      },
    },
  });

  const challenges = records.map((challenge) => ({
    id: challenge.id,
    challengeDate: challenge.challengeDate.toISOString().slice(0, 10),
    gradeLevel: challenge.gradeLevel,
    subject: challenge.subject,
    topic: challenge.topic,
    difficulty: challenge.difficulty,
    title: challenge.title,
    question: challenge.question,
    options: Array.isArray(challenge.options)
      ? challenge.options.filter(
          (option): option is string => typeof option === "string"
        )
      : [],
    correctAnswer: challenge.correctAnswer,
    hint: challenge.hint,
    explanation: challenge.explanation,
    points: challenge.points,
    status: challenge.status,
    attemptCount: challenge._count.attempts,
  }));

  return (
    <div className="min-h-full bg-[#F8FAF7] px-4 py-8 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#214E31] via-[#327443] to-[#56A75B] px-6 py-8 text-white shadow-sm sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-white/5" />

          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-green-50">
              <Sparkles size={14} />
              JUSTDY LEARNING STUDIO
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Daily Challenge Manager
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-green-50/90 sm:text-base">
              Create meaningful daily learning moments. Prepare questions,
              target school grades and publish challenges that encourage
              learners to return and grow every day.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium">
              <CalendarDays size={16} />
              Question publishing and scheduling
            </div>
          </div>
        </header>

        <DailyChallengeManager initialChallenges={challenges} />
      </div>
    </div>
  );
}
