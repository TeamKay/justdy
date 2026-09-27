import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Mail,
  UserRound,
  Video,
  XCircle,
} from "lucide-react";
import { headers } from "next/headers";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface BookingDetailsPageProps {
  params: Promise<{
    bookingId: string;
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

function formatMoney(
  value: number | null | undefined,
  currency?: string | null,
) {
  if (value === null || value === undefined) return "—";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(value);
  } catch {
    return `${currency || ""} ${value.toLocaleString()}`.trim();
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "Scheduled":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "PendingPayment":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "Completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Cancelled":
      return "border-red-200 bg-red-50 text-red-700";

    case "NoShow":
      return "border-orange-200 bg-orange-50 text-orange-700";

    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PendingPayment":
      return "Pending Payment";

    case "NoShow":
      return "No Show";

    default:
      return status;
  }
}

function getInitials(name: string | null | undefined) {
  if (!name) return "U";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default async function BookingDetailsPage({
  params,
}: BookingDetailsPageProps) {
  const { bookingId } = await params;

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

  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    select: {
      id: true,
      status: true,
      startTime: true,
      endTime: true,
      createdAt: true,
      updatedAt: true,

      student: {
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

      availability: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      },

      tutoringSession: {
        select: {
          id: true,
          scheduledStart: true,
          scheduledEnd: true,
          status: true,
          learnerAttendance: true,
          educatorAttendance: true,
          topic: true,
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  const sessionData = booking.tutoringSession;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              href="/admin/bookings"
              className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-colors hover:bg-muted"
              aria-label="Back to bookings"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <p className="text-sm text-muted-foreground">
                Booking details
              </p>

              <h1 className="text-2xl font-bold tracking-tight">
                Booking #{booking.id}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Created {formatDateTime(booking.createdAt)}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-sm font-medium ${getStatusClasses(
              booking.status,
            )}`}
          >
            {getStatusLabel(booking.status)}
          </span>
        </div>

        {/* Overview */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">
                  {formatDate(booking.startTime)}
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
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">
                  {formatTime(booking.startTime)} –{" "}
                  {formatTime(booking.endTime)}
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
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">
                  {formatDuration(
                    booking.startTime,
                    booking.endTime,
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <GraduationCap className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="font-semibold">
                  {booking.service?.subject || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-6 lg:col-span-2">
            {/* Learner / Tutor */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border bg-card">
                <div className="border-b px-5 py-4">
                  <h2 className="font-semibold">Learner</h2>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {getInitials(booking.student?.name)}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold">
                        {booking.student?.name || "Unnamed learner"}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {booking.student?.email || "No email"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/admin/learners/${booking.student.id}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <UserRound className="h-4 w-4" />
                    View learner
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border bg-card">
                <div className="border-b px-5 py-4">
                  <h2 className="font-semibold">Tutor</h2>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {getInitials(booking.educator?.name)}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold">
                        {booking.educator?.name || "Unnamed tutor"}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {booking.educator?.email || "No email"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    Tutor
                  </div>
                </div>
              </div>
            </div>

            {/* Service */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Tutoring service</h2>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="mt-1 font-medium">
                    {booking.service?.title || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="mt-1 font-medium">
                    {booking.service?.type || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="mt-1 font-medium">
                    {booking.service?.subject || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Service duration
                  </p>
                  <p className="mt-1 font-medium">
                    {booking.service?.durationMinutes
                      ? `${booking.service.durationMinutes} min`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Schedule</h2>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Start
                  </p>
                  <p className="mt-1 font-medium">
                    {formatDateTime(booking.startTime)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    End
                  </p>
                  <p className="mt-1 font-medium">
                    {formatDateTime(booking.endTime)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Availability
                  </p>
                  <p className="mt-1 font-medium">
                    {booking.availability?.id || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Linked session */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Tutoring session</h2>
              </div>

              <div className="p-5">
                {sessionData ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground" />

                        <p className="font-medium">
                          Session #{sessionData.id}
                        </p>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTime(sessionData.scheduledStart)}
                      </p>

                      {sessionData.topic && (
                        <p className="mt-2 text-sm">
                          Topic:{" "}
                          <span className="font-medium">
                            {sessionData.topic}
                          </span>
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/admin/sessions/${sessionData.id}`}
                      className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      View session
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    No tutoring session has been created for this booking yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            {/* Booking information */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Booking information</h2>
              </div>

              <div className="divide-y">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-sm text-muted-foreground">
                    Booking ID
                  </span>
                  <span className="max-w-[180px] truncate text-right text-sm font-medium">
                    {booking.id}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-sm text-muted-foreground">
                    Status
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                      booking.status,
                    )}`}
                  >
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-sm text-muted-foreground">
                    Created
                  </span>
                  <span className="text-right text-sm font-medium">
                    {formatDateTime(booking.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-sm text-muted-foreground">
                    Last updated
                  </span>
                  <span className="text-right text-sm font-medium">
                    {formatDateTime(booking.updatedAt)}
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
                  href="/admin/bookings"
                  className="flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Back to bookings
                </Link>

                {sessionData && (
                  <Link
                    href={`/admin/sessions/${sessionData.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <Video className="h-4 w-4" />
                    Open session
                  </Link>
                )}
              </div>
            </div>

            {/* Status explanation */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-3">
                {booking.status === "Completed" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                ) : booking.status === "Cancelled" ||
                  booking.status === "NoShow" ? (
                  <XCircle className="mt-0.5 h-5 w-5 text-red-600" />
                ) : (
                  <CalendarDays className="mt-0.5 h-5 w-5 text-muted-foreground" />
                )}

                <div>
                  <p className="font-medium">
                    {getStatusLabel(booking.status)}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {booking.status === "Completed"
                      ? "This booking has been completed."
                      : booking.status === "Cancelled"
                        ? "This booking was cancelled."
                        : booking.status === "NoShow"
                          ? "The booking was marked as a no-show."
                          : booking.status === "PendingPayment"
                            ? "Payment is still pending for this booking."
                            : "This booking is currently scheduled."}
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