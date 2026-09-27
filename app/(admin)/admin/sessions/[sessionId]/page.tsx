import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  UserRound,
  Video,
  XCircle,
} from "lucide-react";
import { headers } from "next/headers";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface SessionDetailsPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export const dynamic = "force-dynamic";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(value);
}

function formatTime(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    timeStyle: "short",
  }).format(value);
}

function formatDuration(
  start: Date | null | undefined,
  end: Date | null | undefined,
) {
  if (!start || !end) return "—";

  const minutes = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60),
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function getStatusClasses(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "IN_PROGRESS":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";

    case "NO_SHOW":
      return "border-orange-200 bg-orange-50 text-orange-700";

    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return "In Progress";

    case "NO_SHOW":
      return "No Show";

    default:
      return status;
  }
}

function formatJsonValue(value: unknown) {
  if (value === null || value === undefined) {
    return "Not recorded.";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "Not recorded.";
  }
}

function getAttendanceClasses(value: boolean | null | undefined) {
  if (value === true) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === false) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-border bg-muted text-muted-foreground";
}

function getAttendanceLabel(value: boolean | null | undefined) {
  if (value === true) return "Attended";
  if (value === false) return "Absent";
  return "Not recorded";
}

function getInitials(name: string | null | undefined) {
  if (!name) return "U";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default async function SessionDetailsPage({
  params,
}: SessionDetailsPageProps) {
  const { sessionId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/auth?mode=signin");
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
      emailVerified: true,
    },
  });

  if (!currentUser) {
    redirect("/auth?mode=signin");
  }

  const normalizedRole = String(currentUser.role ?? "")
    .trim()
    .toUpperCase();

  if (normalizedRole !== "ADMIN") {
    return (
      <div className="min-h-screen bg-background p-10">
        <div className="mx-auto max-w-xl rounded-xl border bg-card p-8">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="mt-3 text-muted-foreground">
            Your account does not have administrator access.
          </p>
        </div>
      </div>
    );
  }

  const tutoringSession = await prisma.tutoringSession.findUnique({
    where: {
      id: sessionId,
    },
    select: {
      id: true,
      bookingId: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      learnerAttendance: true,
      educatorAttendance: true,
      topic: true,
      topicsCovered: true,
      strengths: true,
      needsPractice: true,
      nextStep: true,
      tutorNotes: true,
      learnerOutcome: true,
      createdAt: true,
      updatedAt: true,

      learner: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },

      educator: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },

      service: {
        select: {
          id: true,
          title: true,
          type: true,
          subject: true,
          durationMinutes: true,
        },
      },

      booking: {
        select: {
          id: true,
          status: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  if (!tutoringSession) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              href="/admin/sessions"
              className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-colors hover:bg-muted"
              aria-label="Back to sessions"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <p className="text-sm text-muted-foreground">
                Tutoring session
              </p>

              <h1 className="text-2xl font-bold tracking-tight">
                Session #{tutoringSession.id}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Created {formatDateTime(tutoringSession.createdAt)}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-sm font-medium ${getStatusClasses(
              tutoringSession.status,
            )}`}
          >
            {getStatusLabel(tutoringSession.status)}
          </span>
        </div>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Session date
                </p>

                <p className="font-semibold">
                  {formatDate(tutoringSession.scheduledStart)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Clock3 className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Time
                </p>

                <p className="font-semibold">
                  {formatTime(tutoringSession.scheduledStart)} –{" "}
                  {formatTime(tutoringSession.scheduledEnd)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Clock3 className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Duration
                </p>

                <p className="font-semibold">
                  {formatDuration(
                    tutoringSession.scheduledStart,
                    tutoringSession.scheduledEnd,
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Subject
                </p>

                <p className="font-semibold">
                  {tutoringSession.service?.subject || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-6 lg:col-span-2">
            {/* Participants */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border bg-card">
                <div className="border-b px-5 py-4">
                  <h2 className="font-semibold">Learner</h2>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {getInitials(tutoringSession.learner?.name)}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold">
                        {tutoringSession.learner?.name ||
                          "Unnamed learner"}
                      </p>

                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {tutoringSession.learner?.email ||
                          "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getAttendanceClasses(
                        tutoringSession.learnerAttendance,
                      )}`}
                    >
                      Learner:{" "}
                      {getAttendanceLabel(
                        tutoringSession.learnerAttendance,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card">
                <div className="border-b px-5 py-4">
                  <h2 className="font-semibold">Tutor</h2>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {getInitials(tutoringSession.educator?.name)}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold">
                        {tutoringSession.educator?.name ||
                          "Unnamed tutor"}
                      </p>

                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {tutoringSession.educator?.email ||
                          "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getAttendanceClasses(
                        tutoringSession.educatorAttendance,
                      )}`}
                    >
                      Tutor:{" "}
                      {getAttendanceLabel(
                        tutoringSession.educatorAttendance,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Session topic */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold">Session topic</h2>
                </div>
              </div>

              <div className="p-5">
                <p className="text-base">
                  {tutoringSession.topic || "No topic recorded."}
                </p>
              </div>
            </div>

            {/* Learning information */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Learning information</h2>
              </div>

              <div className="grid gap-6 p-5 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Topics covered
                  </p>

                  <div className="mt-2 rounded-lg bg-muted/50 p-4 text-sm leading-6">
                   {formatJsonValue(tutoringSession.topicsCovered)}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Strengths
                  </p>

                  <div className="mt-2 rounded-lg bg-muted/50 p-4 text-sm leading-6">
                    {formatJsonValue(tutoringSession.strengths)}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Needs practice
                  </p>

                  <div className="mt-2 rounded-lg bg-muted/50 p-4 text-sm leading-6">
                    {formatJsonValue(tutoringSession.needsPractice)}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Next step
                  </p>

                  <div className="mt-2 rounded-lg bg-muted/50 p-4 text-sm leading-6">
                    {formatJsonValue(tutoringSession.nextStep)}
                  </div>
                </div>
              </div>
            </div>

            {/* Tutor notes */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Tutor notes</h2>
              </div>

              <div className="p-5">
                <div className="rounded-lg bg-muted/50 p-4 text-sm leading-6 whitespace-pre-wrap">
                  {formatJsonValue(tutoringSession.tutorNotes)}
                </div>
              </div>
            </div>

            {/* Learner outcome */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Learner outcome</h2>
              </div>

              <div className="p-5">
                <div className="rounded-lg bg-muted/50 p-4 text-sm leading-6 whitespace-pre-wrap">
                  {formatJsonValue(tutoringSession.learnerOutcome)}
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            {/* Session information */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Session information</h2>
              </div>

              <div className="divide-y">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-sm text-muted-foreground">
                    Session ID
                  </span>

                  <span className="max-w-[180px] truncate text-right text-sm font-medium">
                    {tutoringSession.id}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-sm text-muted-foreground">
                    Status
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                      tutoringSession.status,
                    )}`}
                  >
                    {getStatusLabel(tutoringSession.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-sm text-muted-foreground">
                    Created
                  </span>

                  <span className="text-right text-sm font-medium">
                    {formatDateTime(tutoringSession.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-sm text-muted-foreground">
                    Updated
                  </span>

                  <span className="text-right text-sm font-medium">
                    {formatDateTime(tutoringSession.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Service */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Tutoring service</h2>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Service
                  </p>

                  <p className="mt-1 font-medium">
                    {tutoringSession.service?.title || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Type
                  </p>

                  <p className="mt-1 font-medium">
                    {tutoringSession.service?.type || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Subject
                  </p>

                  <p className="mt-1 font-medium">
                    {tutoringSession.service?.subject || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Duration
                  </p>

                  <p className="mt-1 font-medium">
                    {tutoringSession.service?.durationMinutes
                      ? `${tutoringSession.service.durationMinutes} min`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Linked booking</h2>
              </div>

              <div className="p-5">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="font-medium">
                      Booking #{tutoringSession.booking?.id}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {tutoringSession.booking
                        ? formatDateTime(
                            tutoringSession.booking.startTime,
                          )
                        : "No booking"}
                    </p>

                    {tutoringSession.booking && (
                      <span
                        className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                          tutoringSession.booking.status,
                        )}`}
                      >
                        {getStatusLabel(
                          tutoringSession.booking.status,
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {tutoringSession.booking && (
                  <Link
                    href={`/admin/bookings/${tutoringSession.booking.id}`}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    View booking
                  </Link>
                )}
              </div>
            </div>

            {/* Attendance */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Attendance</h2>
              </div>

              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Learner</span>
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getAttendanceClasses(
                      tutoringSession.learnerAttendance,
                    )}`}
                  >
                    {getAttendanceLabel(
                      tutoringSession.learnerAttendance,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Tutor</span>
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getAttendanceClasses(
                      tutoringSession.educatorAttendance,
                    )}`}
                  >
                    {getAttendanceLabel(
                      tutoringSession.educatorAttendance,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Quick actions</h2>
              </div>

              <div className="space-y-2 p-5">
                <Link
                  href="/admin/sessions"
                  className="flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Back to sessions
                </Link>

                {tutoringSession.booking && (
                  <Link
                    href={`/admin/bookings/${tutoringSession.booking.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <Video className="h-4 w-4" />
                    Open booking
                  </Link>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-3">
                {tutoringSession.status === "COMPLETED" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                ) : tutoringSession.status === "CANCELLED" ||
                  tutoringSession.status === "NO_SHOW" ? (
                  <XCircle className="mt-0.5 h-5 w-5 text-red-600" />
                ) : (
                  <Video className="mt-0.5 h-5 w-5 text-muted-foreground" />
                )}

                <div>
                  <p className="font-medium">
                    {getStatusLabel(tutoringSession.status)}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {tutoringSession.status === "COMPLETED"
                      ? "This tutoring session has been completed."
                      : tutoringSession.status === "CANCELLED"
                        ? "This tutoring session was cancelled."
                        : tutoringSession.status === "NO_SHOW"
                          ? "This session was marked as a no-show."
                          : tutoringSession.status === "IN_PROGRESS"
                            ? "This tutoring session is currently in progress."
                            : "This tutoring session is scheduled."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}