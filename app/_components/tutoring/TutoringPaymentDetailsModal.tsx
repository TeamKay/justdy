"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  X,
  CreditCard,
  CheckCircle2,
  Clock3,
  Mail,
  CalendarDays,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

type Payment = {
  id: string;
  installmentNumber: number;
  expectedAmountCents: number;
  currency: string;
  status: string;
  paidAt: string | null;
  emailSentAt: string | null;
  createdAt: string | null;
  checkoutUrl: string | null;
  stripeCheckoutSessionId: string | null;
};

type Learner = {
  id: string;
  studentName: string;
  learnerEmail: string | null;
  billingEmail: string;
  currency: string;
  paymentPlan: string | null;
  installmentCount: number | null;
  paymentStatus: string | null;
  totalCents: number | null;
  paidCents: number;
  remainingCents: number | null;
  paidCount: number;
  paymentCount: number;
  payments: Payment[];
  requestCreatedAt: string;
  planAgreedAt: string | null;
};

function money(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(currency || "USD").toUpperCase()} ${(cents / 100).toFixed(2)}`;
  }
}

function dateTime(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      })
    : "Not recorded";
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "paid")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (normalized.includes("fail") || normalized.includes("cancel"))
    return "border-red-200 bg-red-50 text-red-800";
  if (
    normalized.includes("pending") ||
    normalized.includes("requested") ||
    normalized.includes("unpaid")
  )
    return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function TutoringPaymentDetailsModal({
  learner,
  paymentLinkAction,
}: {
  learner: Learner;
  paymentLinkAction?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  async function resendPaymentLink() {
    if (resending) return;
    const nextInstallmentNumber =
      learner.payments.filter(
        (payment) => payment.status.toLowerCase() === "paid",
      ).length + 1;
    const nextPayment = learner.payments.find(
      (payment) =>
        payment.installmentNumber === nextInstallmentNumber &&
        payment.status.toLowerCase() !== "paid",
    );
    if (!nextPayment) {
      setResendError(
        "There is no unpaid next installment available to resend.",
      );
      setResendMessage(null);
      return;
    }
    const recipient = learner.billingEmail;
    if (!recipient) {
      setResendError(
        "A billing recipient email is not recorded for this learner.",
      );
      setResendMessage(null);
      return;
    }
    const label =
      learner.paymentPlan === "full"
        ? "the full course payment"
        : `installment ${nextInstallmentNumber}`;
    if (
      !window.confirm(
        `Resend the payment link for ${label} to ${recipient}? This reuses the existing unpaid installment and will not advance the payment sequence.`,
      )
    )
      return;

    setResending(true);
    setResendError(null);
    setResendMessage(null);
    try {
      const response = await fetch(
        `/api/admin/tutoring-requests/${encodeURIComponent(learner.id)}/payment-link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            paymentKind:
              learner.paymentPlan === "full" ? "full" : "installment",
            recipientEmail: recipient,
          }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Unable to resend the payment link.",
        );
      }
      setResendMessage(
        typeof result.message === "string"
          ? result.message
          : `Payment link emailed to ${recipient}.`,
      );
      router.refresh();
    } catch (error) {
      setResendError(
        error instanceof Error
          ? error.message
          : "Unable to resend the payment link.",
      );
    } finally {
      setResending(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
      >
        <Eye className="mr-2 size-4" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-2 backdrop-blur-sm sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`payment-modal-title-${learner.id}`}
            className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-white/60 bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.55)]"
          >
            <header className="relative overflow-hidden bg-linear-to-r from-slate-950 via-slate-900 to-emerald-950 px-5 py-6 text-white sm:px-7">
              <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="min-w-0">
                    <h2
                      id={`payment-modal-title-${learner.id}`}
                      className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl"
                    >
                      {learner.studentName}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close payment details"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-slate-200 transition hover:bg-white/20 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
            </header>
            <div className="overflow-y-auto bg-slate-50/70 p-4 sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Payment overview
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize ${statusClasses(learner.paymentStatus || "pending")}`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {(learner.paymentStatus || "pending").replaceAll("_", " ")}
                </span>
              </div>

              <section className="mt-4 mb-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  {/* Payment link action */}
                  <div className="p-4 sm:p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Payment link
                    </h4>
                    {paymentLinkAction ? (
                      <div className="p-0 sm:pt-3">{paymentLinkAction}</div>
                    ) : null}
                  </div>

                  {/* Billing information */}
                  <div className="p-4 sm:p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Learner &amp; billing
                    </h4>

                    <dl className="mt-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                          <Mail className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <dt className="text-xs text-slate-500">
                            Billing recipient
                          </dt>
                          <dd className="mt-1 break-all text-sm font-semibold text-slate-800">
                            {learner.billingEmail || "Not recorded"}
                          </dd>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                          <CreditCard className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <dt className="text-xs text-slate-500">
                            Payment plan
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-800">
                            {learner.paymentPlan === "full"
                              ? "Full payment"
                              : `${learner.installmentCount ?? learner.payments.length} installments`}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </div>

                  {/* Timeline information */}
                  <div className="p-4 sm:p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Timeline
                    </h4>

                    <dl className="mt-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <CalendarDays className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <dt className="text-xs text-slate-500">
                            Request created
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-slate-800">
                            {dateTime(learner.requestCreatedAt)}
                          </dd>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <dt className="text-xs text-slate-500">
                            Plan agreed
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-slate-800">
                            {dateTime(learner.planAgreedAt)}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                </div>
              </section>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">
                  {/* Course Total */}
                  <div className="min-w-0 p-3 sm:p-4">
                    <p className="mt-3 wrap-break-word text-lg font-bold tracking-tight text-slate-900">
                      {learner.totalCents === null
                        ? "Not set"
                        : money(learner.totalCents, learner.currency)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Total bill</p>
                  </div>

                  {/* Total Received */}
                  <div className="min-w-0 bg-emerald-50/40 p-3 sm:p-4">
                    <p className="mt-3 break-words text-lg font-bold tracking-tight text-emerald-700">
                      {money(learner.paidCents, learner.currency)}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700/80">
                      Total paid
                    </p>
                  </div>

                  {/* Remaining Balance */}
                  <div className="min-w-0 bg-amber-50/40 p-3 sm:p-4">
                    <p className="mt-3 break-words text-lg font-bold tracking-tight text-amber-700">
                      {learner.remainingCents === null
                        ? "Not available"
                        : money(learner.remainingCents, learner.currency)}
                    </p>
                    <p className="mt-1 text-xs text-amber-700/80">
                      Outstanding balance
                    </p>
                  </div>

                  {/* Installments Paid */}
                  <div className="min-w-0 p-3 sm:p-4">
                    <p className="mt-3 text-lg font-bold tracking-tight text-slate-900">
                      {learner.paidCount}
                      <span className="ml-1 text-sm font-medium text-slate-400">
                        / {learner.installmentCount ?? learner.payments.length}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Payments completed
                    </p>
                  </div>
                </div>
              </div>

              <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Payment history
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      All recorded installments, links, and timestamps.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {learner.payments.length}{" "}
                    {learner.payments.length === 1 ? "record" : "records"}
                  </span>
                </div>
                {learner.payments.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">
                    No payment records found.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-200 text-left text-sm">
                      <thead className="bg-slate-50/90 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                        <tr>
                          {[
                            "Payment date",
                            "Amount",
                            "Status",
                            "Payment link emailed",
                            "Action",
                          ].map((label) => (
                            <th key={label} className="px-3 py-3">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {learner.payments.map((payment) => (
                          <tr
                            key={payment.id}
                            className="align-top transition-colors hover:bg-slate-50/80"
                          >
                            <td className="whitespace-nowrap px-3 py-3">
                              {dateTime(payment.paidAt)}
                            </td>
                            <td className="px-3 py-3 font-semibold">
                              {money(
                                payment.expectedAmountCents,
                                payment.currency || learner.currency,
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses(payment.status)}`}
                              >
                                {payment.status.replaceAll("_", " ")}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3">
                              {dateTime(payment.emailSentAt)}
                            </td>
                            <td className="px-3 py-3">
                              {payment.status.toLowerCase() === "paid" ? (
                                <span className="text-emerald-700">
                                  Payment received
                                </span>
                              ) : (
                                <>
                                  {payment.checkoutUrl ? (
                                    <a
                                      href={payment.checkoutUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950"
                                    >
                                      Open payment link{" "}
                                      <ExternalLink className="size-3.5" />
                                    </a>
                                  ) : (
                                    <span className="block text-slate-500">
                                      No active link
                                    </span>
                                  )}
                                  {payment.installmentNumber ===
                                    learner.paidCount + 1 && (
                                    <button
                                      type="button"
                                      onClick={resendPaymentLink}
                                      disabled={resending}
                                      className="mt-2 inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {resending ? (
                                        <>
                                          <RefreshCw className="size-3.5 animate-spin" />
                                          Sending…
                                        </>
                                      ) : (
                                        <>
                                          <RefreshCw className="size-3.5" />
                                          Resend link
                                        </>
                                      )}
                                    </button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              {(resendMessage || resendError) && (
                <div
                  role={resendError ? "alert" : "status"}
                  className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${resendError ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
                >
                  {resendError || resendMessage}
                </div>
              )}
              <p className="mt-4 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-xs leading-5 text-slate-500">
                The remaining balance is the saved course total minus recorded
                paid installments. A missing timestamp means it has not been
                recorded in the database. Resending is available only for the
                next unpaid installment; the existing payment-link API handles
                expired Checkout links.
              </p>
            </div>
            <footer className="flex justify-end border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
