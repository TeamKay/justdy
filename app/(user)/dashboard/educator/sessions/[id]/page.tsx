import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, ExternalLink, UserRound } from "lucide-react";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import EducatorSessionFeedbackForm from "@/app/_components/EducatorSessionFeedbackForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

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

export default async function EducatorSessionDetailPage({ params }: PageProps) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth?mode=signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, canTeach: true },
  });

  if (!user) redirect("/auth?mode=signin");

  if (String(user.role ?? "").trim().toUpperCase() === "ADMIN") {
    redirect(`/admin/sessions/${id}`);
  }

  if (!user.canTeach) redirect("/dashboard");

  const tutoringSession = await prisma.tutoringSession.findFirst({
    where: {
      id,
      educatorId: user.id,
    },
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
      tutorNotes: true,
      learnerOutcome: true,
      learner: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
      service: {
        select: {
          id: true,
          title: true,
          subject: true,
          durationMinutes: true,
        },
      },
      booking: {
        select: {
          id: true,
          status: true,
          videoSessionId: true,
        },
      },
    },
  });

  if (!tutoringSession) notFound();

  const topicsCovered = Array.isArray(tutoringSession.topicsCovered)
    ? tutoringSession.topicsCovered.filter(
        (value): value is string => typeof value === "string",
      )
    : [];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/educator/sessions"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to teaching sessions
        </Link>

        <header className="mt-6 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600">Tutoring session</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {tutoringSession.service?.title ?? "Tutoring session"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {tutoringSession.learner.name ?? "Learner"} · {tutoringSession.service?.subject ?? "Tutoring"}
              </p>
            </div>

            <div className="rounded-2xl bg-muted/50 p-4 text-sm">
              <p className="font-semibold">{formatDate(tutoringSession.scheduledStart)}</p>
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <Clock3 className="size-3.5" />
                {formatTime(tutoringSession.scheduledStart)} – {formatTime(tutoringSession.scheduledEnd)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 p-4">
              <CalendarDays className="size-4 text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">Status</p>
              <p className="mt-1 text-sm font-semibold">{tutoringSession.status.replace("_", " ")}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <UserRound className="size-4 text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">Learner</p>
              <p className="mt-1 text-sm font-semibold">{tutoringSession.learner.name ?? "Learner"}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <Clock3 className="size-4 text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">Duration</p>
              <p className="mt-1 text-sm font-semibold">
                {tutoringSession.service?.durationMinutes ?? Math.round(
                  (tutoringSession.scheduledEnd.getTime() - tutoringSession.scheduledStart.getTime()) / 60000,
                )} minutes
              </p>
            </div>
          </div>

          {tutoringSession.booking.videoSessionId &&
          tutoringSession.status !== "COMPLETED" &&
          tutoringSession.status !== "CANCELLED" ? (
            <Link
              href={`/tutoring/sessions/${tutoringSession.bookingId}`}
              className="mt-6 inline-flex h-11 items-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Open tutoring classroom
              <ExternalLink className="ml-2 size-4" />
            </Link>
          ) : null}
        </header>

        <section className="mt-7">
          <EducatorSessionFeedbackForm
            bookingId={tutoringSession.bookingId}
            status={tutoringSession.status}
            initial={{
              topic: tutoringSession.topic ?? "",
              topicsCovered,
              strengths: tutoringSession.strengths ?? "",
              needsPractice: tutoringSession.needsPractice ?? "",
              nextStep: tutoringSession.nextStep ?? "",
              tutorNotes: tutoringSession.tutorNotes ?? "",
              learnerOutcome: tutoringSession.learnerOutcome ?? "",
            }}
          />
        </section>
      </div>
    </main>
  );
}
