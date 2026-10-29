import Link from "next/link";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

type SuccessPageProps = { searchParams: Promise<{ session_id?: string }> };

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
  const params = await searchParams;
  const stripeSessionId = params.session_id?.trim();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!stripeSessionId) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Payment confirmation unavailable
          </h1>
          <p className="mt-3 text-slate-600">
            We could not find the checkout session for this page.
          </p>
          <Link
            href="/tutoring"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Return to tutoring
          </Link>
        </div>
      </main>
    );
  }

  // Guest checkout completion is safe to show without a session cookie because
  // this page only reveals a generic confirmation and never exposes PII.
  const guest = await prisma.guestTutoringCheckout.findFirst({
    where: { stripeSessionId: stripeSessionId },
    select: {
      id: true,
      status: true,
      subject: true,
      gradeLevel: true,
      startTime: true,
      endTime: true,
      studentId: true,
      bookingId: true,
      accountCreatedByCheckout: true,
    },
  });

  if (guest) {
    const paid = guest.status === "Paid" && Boolean(guest.bookingId);
    const refunded = guest.status === "Refunded";
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-8 text-center sm:px-10">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}
            >
              {paid ? "✓" : "…"}
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
              {paid
                ? "Your tutoring session is confirmed"
                : refunded
                  ? "Your payment is being refunded"
                  : "We’re confirming your booking"}
            </h1>
            <p className="mt-3 leading-7 text-slate-600">
              {paid
                ? "Your payment has been verified and your session has been scheduled."
                : refunded
                  ? "We couldn't safely confirm the selected time, so a refund was initiated. Please choose another time; your payment provider may take a little while to display the refund."
                  : "Stripe returned you to Justdy. We’re still checking the final payment and booking status. Please refresh this page in a moment."}
            </p>
          </div>
          <div className="space-y-4 px-6 py-7 sm:px-10">
            {paid ? (
              <>
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Subject and grade
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {guest.subject} · {guest.gradeLevel}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Session time
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {formatDateTime(guest.startTime)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Ends {formatDateTime(guest.endTime)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
                  {guest.accountCreatedByCheckout
                    ? "We’ve created your Justdy learner account. Check your email for a secure link to set your password and access your session."
                    : "Your booking is linked to your Justdy account. Sign in with the email you used at checkout to view your session."}
                </div>
              </>
            ) : refunded ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
                No tutoring session was scheduled for this payment. Return to
                tutoring to select another available time.
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                Your booking details will appear here once payment finalization
                is complete. If payment was taken but this page does not update,
                contact Justdy support and include your Stripe receipt.
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth?mode=signin&callbackUrl=%2Fdashboard%2Ftutoring%2Fbookings"
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Sign in to Justdy
              </Link>
              <Link
                href="/tutoring"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to tutoring
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            We’re checking your payment
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            This checkout is not available as a guest booking. If you completed
            payment, please check your receipt or contact support.
          </p>
          <Link
            href="/tutoring"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Return to tutoring
          </Link>
        </div>
      </main>
    );
  }

  const booking = await prisma.booking.findFirst({
    where: { stripeSessionId: stripeSessionId, studentId: session.user.id },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      subject: true,
      gradeLevel: true,
      status: true,
      service: { select: { title: true, durationMinutes: true } },
      educator: {
        select: {
          name: true,
          teachingProfile: { select: { specialty: true } },
        },
      },
    },
  });

  if (!booking) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            We’re confirming your booking
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Your payment return was received, but we could not find the
            confirmed booking yet. Refresh shortly or contact support if the
            issue persists.
          </p>
          <Link
            href="/dashboard/tutoring/bookings"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            View tutoring bookings
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          Booking confirmed
        </h1>
        <p className="mt-2 text-slate-600">
          Your payment has been verified and your tutoring session is scheduled.
        </p>
        <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-5">
          <p>
            <span className="text-slate-500">Service:</span>{" "}
            <strong>
              {booking.service?.title ?? booking.subject ?? "Tutoring session"}
            </strong>
          </p>
          <p>
            <span className="text-slate-500">Tutor:</span>{" "}
            <strong>{booking.educator.name}</strong>
          </p>
          <p>
            <span className="text-slate-500">Date:</span>{" "}
            <strong>{formatDateTime(booking.startTime)}</strong>
          </p>
          <p>
            <span className="text-slate-500">Grade:</span>{" "}
            <strong>{booking.gradeLevel ?? "—"}</strong>
          </p>
        </div>
        <Link
          href="/dashboard/tutoring/bookings"
          className="mt-6 inline-flex rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white"
        >
          View tutoring bookings
        </Link>
      </div>
    </main>
  );
}
