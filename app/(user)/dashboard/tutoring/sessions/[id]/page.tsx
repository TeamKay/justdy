import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, GraduationCap, Video } from "lucide-react";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function asTopics(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function OutcomeBlock({ title, value }: { title: string; value: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}

export default async function LearnerSessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) redirect("/auth?mode=signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, canLearn: true, emailVerified: true },
  });

  if (!user) redirect("/auth?mode=signin");
  if (!user.emailVerified) redirect(`/verify-request?email=${encodeURIComponent(session.user.email ?? "")}`);
  if (!user.canLearn) redirect("/dashboard");

  const tutoringSession = await prisma.tutoringSession.findFirst({
    where: { id, learnerId: user.id },
    select: {
      id: true,
      bookingId: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      topic: true,
      topicsCovered: true,
      strengths: true,
      needsPractice: true,
      nextStep: true,
      learnerOutcome: true,
      learnerAttendance: true,
      educator: { select: { id: true, name: true, imageUrl: true } },
      service: { select: { title: true, subject: true, durationMinutes: true } },
      booking: { select: { status: true, videoSessionId: true } },
    },
  });

  if (!tutoringSession) notFound();

  const topics = asTopics(tutoringSession.topicsCovered);
  const isUpcoming = tutoringSession.status === "SCHEDULED" || tutoringSession.status === "IN_PROGRESS";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/dashboard/tutoring/sessions" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to My Sessions
        </Link>

        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="border-b bg-gradient-to-br from-emerald-50 via-card to-indigo-50 p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                  {isUpcoming ? <Video className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  {isUpcoming ? "Upcoming tutoring session" : "Completed tutoring session"}
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  {tutoringSession.service?.title ?? tutoringSession.topic ?? "Tutoring Session"}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {tutoringSession.educator?.name ?? "Your tutor"}
                  {tutoringSession.service?.subject ? ` · ${tutoringSession.service.subject}` : ""}
                </p>
              </div>

              {isUpcoming && tutoringSession.booking.videoSessionId ? (
                <Link href={`/tutoring/sessions/${tutoringSession.bookingId}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                  <Video className="h-4 w-4" /> Open classroom
                </Link>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-white/70 p-4">
                <CalendarDays className="h-4 w-4 text-emerald-600" />
                <p className="mt-2 text-xs text-muted-foreground">Date</p>
                <p className="mt-1 text-sm font-semibold">{formatDate(tutoringSession.scheduledStart)}</p>
              </div>
              <div className="rounded-2xl border bg-white/70 p-4">
                <Clock3 className="h-4 w-4 text-indigo-600" />
                <p className="mt-2 text-xs text-muted-foreground">Time</p>
                <p className="mt-1 text-sm font-semibold">{formatTime(tutoringSession.scheduledStart)} – {formatTime(tutoringSession.scheduledEnd)}</p>
              </div>
              <div className="rounded-2xl border bg-white/70 p-4">
                <GraduationCap className="h-4 w-4 text-amber-600" />
                <p className="mt-2 text-xs text-muted-foreground">Duration</p>
                <p className="mt-1 text-sm font-semibold">{tutoringSession.service?.durationMinutes ?? Math.round((tutoringSession.scheduledEnd.getTime() - tutoringSession.scheduledStart.getTime()) / 60000)} minutes</p>
              </div>
            </div>
          </div>
        </section>

        {isUpcoming ? (
          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Prepare for your session</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Join your classroom when your session is available. Your tutor will use this session to work through the scheduled topic with you.
            </p>
            {tutoringSession.topic ? (
              <div className="mt-5 rounded-2xl bg-muted/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Topic</p>
                <p className="mt-1 font-medium">{tutoringSession.topic}</p>
              </div>
            ) : null}
          </section>
        ) : (
          <>
            {topics.length > 0 ? (
              <section className="rounded-3xl border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold">What you worked on</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <span key={topic} className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">{topic}</span>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <OutcomeBlock title="Strengths" value={tutoringSession.strengths} />
              <OutcomeBlock title="Areas to practice" value={tutoringSession.needsPractice} />
              <OutcomeBlock title="Next step" value={tutoringSession.nextStep} />
              <OutcomeBlock title="Session outcome" value={tutoringSession.learnerOutcome} />
            </div>

            {!tutoringSession.strengths && !tutoringSession.needsPractice && !tutoringSession.nextStep && !tutoringSession.learnerOutcome && topics.length === 0 ? (
              <section className="rounded-3xl border border-dashed bg-card p-8 text-center">
                <p className="font-medium">Your tutor has not added a session summary yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">Check back later for your learning outcome and next steps.</p>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
