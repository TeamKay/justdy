import Link from "next/link";
import prisma from "@/lib/prisma";
import TutoringPaymentDetailsModal from "@/app/_components/TutoringPaymentDetailsModal";
import SendTutoringPaymentLink from "@/app/_components/send-tutoring-payment-link";

export const dynamic = "force-dynamic";

function money(cents: number | null | undefined, currency: string) {
  if (cents == null) return "Not set";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(currency || "USD").toUpperCase()} ${(cents / 100).toFixed(2)}`;
  }
}

function readableStatus(value: string | null | undefined) {
  return (value || "pending").replaceAll("_", " ");
}

export default async function TutoringPaymentsPage() {
  const requests = await prisma.tutoringOnboardingRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      studentName: true,
      guardianName: true,
      learnerEmail: true,
      email: true,
      billingEmail: true,
      status: true,
      agreedRateCents: true,
      sessionDurationMinutes: true,
      sessionsPerWeek: true,
      courseDurationWeeks: true,
      paymentLinkEmailSentAt: true,
      paymentPlan: true,
      installmentCount: true,
      paymentStatus: true,
      courseTotalCents: true,
      amountPaidCents: true,
      currency: true,
      createdAt: true,
      planAgreedAt: true,
      tutoringPayments: {
        orderBy: { installmentNumber: "asc" },
        select: {
          id: true,
          installmentNumber: true,
          expectedAmountCents: true,
          currency: true,
          status: true,
          paidAt: true,
          emailSentAt: true,
          createdAt: true,
          checkoutUrl: true,
          stripeCheckoutSessionId: true,
        },
      },
    },
  });

  const learners = requests
    .map((request) => {
      const currency = (request.currency || "usd").toLowerCase();
      const totalCents = request.courseTotalCents;
      const paidCents = request.tutoringPayments.reduce(
        (sum, payment) =>
          sum +
          (payment.status.toLowerCase() === "paid"
            ? payment.expectedAmountCents
            : 0),
        0,
      );
      const remainingCents =
        totalCents == null ? null : Math.max(0, totalCents - paidCents);

      return {
        id: request.id,
        studentName: request.studentName,
        learnerEmail: request.learnerEmail,
        billingEmail: request.billingEmail || request.email,
        currency,
        paymentPlan: request.paymentPlan,
        installmentCount: request.installmentCount,
        paymentStatus: request.paymentStatus,
        totalCents,
        paidCents,
        status: request.status,
        agreedRateCents: request.agreedRateCents,
        sessionDurationMinutes: request.sessionDurationMinutes,
        sessionsPerWeek: request.sessionsPerWeek,
        courseDurationWeeks: request.courseDurationWeeks,
        paymentLinkEmailSentAt:
          request.paymentLinkEmailSentAt?.toISOString() ?? null,
        email: request.email,
        remainingCents,
        paidCount: request.tutoringPayments.filter(
          (payment) => payment.status.toLowerCase() === "paid",
        ).length,
        paymentCount: request.tutoringPayments.length,
        payments: request.tutoringPayments.map((payment) => ({
          ...payment,
          paidAt: payment.paidAt?.toISOString() ?? null,
          emailSentAt: payment.emailSentAt?.toISOString() ?? null,
          createdAt: payment.createdAt.toISOString(),
        })),
        requestCreatedAt: request.createdAt.toISOString(),
        planAgreedAt: request.planAgreedAt?.toISOString() ?? null,
      };
    })
    .filter(
      (learner) =>
        learner.paymentCount > 0 ||
        learner.status === "plan_agreed" ||
        learner.status === "payment_received",
    );

  const totalPaidCents = learners.reduce(
    (sum, learner) => sum + learner.paidCents,
    0,
  );
  const outstandingCents = learners.reduce(
    (sum, learner) => sum + (learner.remainingCents ?? 0),
    0,
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Tutoring payments
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review each learner’s payment history and resend a link for the next
            unpaid installment.
          </p>
        </div>
        <Link
          href="/admin/tutoring-requests"
          className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Tutoring requests
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            Learners with payment records
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {learners.length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-800">Total received</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">
            {money(totalPaidCents, "usd")}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-800">Recorded outstanding balance</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">
            {money(outstandingCents, "usd")}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Learner payment summary
          </h2>
        </div>
        {learners.length === 0 ? (
          <p className="p-8 text-sm text-slate-500">
            No tutoring payment records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-250 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {[
                    "Learner",
                    "Payment plan",
                    "Payments",
                    "Total bill",
                    "Received",
                    "Remaining",
                    "Status",
                    "Details",
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {learners.map((learner) => (
                  <tr
                    key={learner.id}
                    className="align-top hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">
                        {learner.studentName}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {learner.paymentPlan === "full"
                        ? "Full payment"
                        : `${learner.installmentCount} installments`}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {learner.paidCount} paid / {learner.paymentCount} records
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-medium">
                      {money(learner.totalCents, learner.currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-emerald-700">
                      {money(learner.paidCents, learner.currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-amber-800">
                      {money(learner.remainingCents, learner.currency)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs capitalize text-slate-700">
                        {readableStatus(learner.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <TutoringPaymentDetailsModal
                        learner={learner}
                        paymentLinkAction={
                          <SendTutoringPaymentLink
                            requestId={learner.id}
                            status={learner.status}
                            paymentStatus={learner.paymentStatus}
                            rateCents={learner.agreedRateCents}
                            durationMinutes={learner.sessionDurationMinutes}
                            sessionsPerWeek={learner.sessionsPerWeek}
                            courseDurationWeeks={learner.courseDurationWeeks}
                            currency={learner.currency}
                            paymentPlan={learner.paymentPlan}
                            installmentCount={learner.installmentCount}
                            email={learner.email}
                            learnerEmail={learner.learnerEmail ?? ""}
                            billingEmail={learner.billingEmail}
                            sentAt={learner.paymentLinkEmailSentAt}
                          />
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
