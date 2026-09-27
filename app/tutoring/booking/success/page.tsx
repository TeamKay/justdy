import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function TutoringBookingSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth?mode=signin&callbackUrl=/tutoring/success");
  }

  const params = await searchParams;
  const stripeSessionId = params.session_id;

  if (!stripeSessionId) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
              !
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Payment confirmation unavailable
            </h1>

            <p className="mt-3 text-slate-600">
              We could not find the Stripe checkout session associated with
              this page.
            </p>

            <div className="mt-8">
              <Link
                href="/tutoring"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Return to tutoring
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const booking = await prisma.booking.findFirst({
    where: {
      stripeSessionId: stripeSessionId,
      studentId: session.user.id,
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      subject: true,
      gradeLevel: true,
      status: true,
      service: {
        select: {
          id: true,
          title: true,
          description: true,
          durationMinutes: true,
          price: true,
          currency: true,
        },
      },
     educator: {
  select: {
    id: true,
    name: true,
    teachingProfile: {
      select: {
        headline: true,
        specialty: true,
      },
    },
  },
},
      tutoringSession: {
        select: {
          id: true,
          status: true,
          scheduledStart: true,
          scheduledEnd: true,
          topic: true,
        },
      },
    },
  });

  if (!booking) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
              !
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              We’re confirming your booking
            </h1>

            <p className="mt-3 leading-7 text-slate-600">
              Your payment was sent to Stripe successfully, but your tutoring
              booking is not available in our records yet.
            </p>

            <p className="mt-3 leading-7 text-slate-600">
              Please give us a moment for payment confirmation to finish.
              You can then check your tutoring sessions.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tutoring/sessions"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View my sessions
              </Link>

              <Link
                href="/tutoring"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Browse tutoring
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const sessionDetails = booking.tutoringSession;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Success header */}
          <div className="border-b border-slate-200 px-6 py-10 text-center sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-8 w-8 text-emerald-600"
                aria-hidden="true"
              >
                <path
                  d="M5 12.5L9.5 17L19 7.5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Booking confirmed
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Your tutoring session is booked
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
              Your payment was successfully processed and your tutoring
              session has been scheduled.
            </p>
          </div>

          {/* Booking details */}
          <div className="px-6 py-8 sm:px-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tutoring service
                </p>

                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {booking.service?.title ?? "Tutoring session"}
                </p>

                {booking.service?.durationMinutes ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {booking.service.durationMinutes} minutes
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tutor
                </p>

                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {booking.educator.name || "Your tutor"}
                </p>

                {booking.educator.teachingProfile?.headline ||
                booking.educator.teachingProfile?.specialty ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {booking.educator.teachingProfile.headline ??
                      booking.educator.teachingProfile.specialty}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date & time
                </p>

                <p className="mt-2 text-base font-semibold text-slate-900">
                  {formatDateTime(booking.startTime)}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Ends at{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(booking.endTime)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Subject & level
                </p>

                <p className="mt-2 text-base font-semibold text-slate-900">
                  {booking.subject || "Tutoring"}
                </p>

                {booking.gradeLevel ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {booking.gradeLevel}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Session status */}
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12.5L9.5 17L19 7.5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <h2 className="font-semibold text-emerald-950">
                    {sessionDetails
                      ? "Your tutoring session is ready"
                      : "Your booking is being finalized"}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-emerald-900/80">
                    {sessionDetails
                      ? "Your session has been created successfully. You can manage it from your tutoring sessions."
                      : "Your payment is confirmed. The tutoring session will appear in your sessions once processing is complete."}
                  </p>
                </div>
              </div>
            </div>

            {/* Reference */}
            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-slate-500">
                  Booking reference
                </span>

                <span className="font-mono text-xs font-medium text-slate-700">
                  {booking.id}
                </span>
              </div>

              {sessionDetails ? (
                <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-slate-500">
                    Session status
                  </span>

                  <span className="font-medium text-slate-700">
                    {sessionDetails.status}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tutoring/sessions"
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View my tutoring sessions
              </Link>

              <Link
                href="/tutoring"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Browse more tutoring
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Need help with your booking? Contact Justdy support.
        </p>
      </div>
    </main>
  );
}