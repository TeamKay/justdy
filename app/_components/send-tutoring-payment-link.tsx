"use client";

import { useEffect, useState } from "react";

export default function SendTutoringPaymentLink({
  requestId,
  status,
  paymentStatus,
  rateCents,
  durationMinutes,
  sessionsPerWeek,
  courseDurationWeeks,
  currency,
  paymentPlan,
  installmentCount,
  email,
  learnerEmail,
  billingEmail,
  sentAt,
}: {
  requestId: string;
  status: string;
  paymentStatus: string;
  rateCents: number | null;
  durationMinutes: number | null;
  sessionsPerWeek: number | null;
  courseDurationWeeks: number | null;
  currency: string;
  paymentPlan: string;
  installmentCount: number | null;
  email: string;
  learnerEmail: string;
  billingEmail: string;
  sentAt: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const agreedPaymentPlan =
    paymentPlan === "installments" ? "installments" : "full";
  const [paymentKind, setPaymentKind] = useState<"full" | "installment">(
    agreedPaymentPlan === "installments" ? "installment" : "full",
  );
  const [recipientEmail, setRecipientEmail] = useState(
    billingEmail && billingEmail !== email && billingEmail !== learnerEmail
      ? "custom"
      : billingEmail || email,
  );
  const [customRecipientEmail, setCustomRecipientEmail] = useState(
    billingEmail || email,
  );

  // Initial payment is available after plan agreement. Later installment requests
  // remain available after the first payment moves the request to payment_received.
  const canRequestPayment =
    status === "plan_agreed" ||
    (agreedPaymentPlan === "installments" && status === "payment_received");
  const eligible =
    canRequestPayment && paymentStatus !== "paid" && (rateCents ?? 0) > 0;

  const safeCurrency = ["usd", "ghs", "gbp", "eur"].includes(
    (currency || "usd").toLowerCase(),
  )
    ? (currency || "usd").toUpperCase()
    : "USD";
  const money = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
    }).format(cents / 100);
  const totalSessions =
    Math.max(0, sessionsPerWeek ?? 0) * Math.max(0, courseDurationWeeks ?? 0);
  const totalCents = Math.max(0, rateCents ?? 0) * totalSessions;
  const installments = Math.max(1, installmentCount ?? 1);
  const installmentCents = Math.floor(totalCents / installments);

  useEffect(() => {
    if (!confirmOpen || busy) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConfirmOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmOpen, busy]);

  function openConfirmation() {
    if (!eligible || busy) return;

    setMessage("");
    setError("");
    setPaymentKind(
      agreedPaymentPlan === "installments" ? "installment" : "full",
    );
    setRecipientEmail(
      billingEmail && billingEmail !== email && billingEmail !== learnerEmail
        ? "custom"
        : billingEmail || email,
    );
    setCustomRecipientEmail(billingEmail || email);
    setConfirmOpen(true);
  }

  async function send() {
    if (!eligible || busy || !confirmOpen) return;
    const finalRecipient =
      recipientEmail === "custom"
        ? customRecipientEmail.trim()
        : recipientEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalRecipient)) {
      setError("Enter a valid payment recipient email address.");
      return;
    }

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/tutoring-requests/${encodeURIComponent(
          requestId,
        )}/payment-link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            paymentKind,
            recipientEmail:
              recipientEmail === "custom"
                ? customRecipientEmail.trim()
                : recipientEmail,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to send payment link.");
      }

      setConfirmOpen(false);
      setMessage(data.message || "Payment link emailed.");

      window.location.reload();
    } catch (e) {
      setConfirmOpen(false);
      setError(e instanceof Error ? e.message : "Unable to send payment link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="mt-0 bg-white p-0 dark:border-slate-700 dark:bg-slate-950">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {paymentStatus === "paid"
                ? "Payment received and verified by Stripe."
                : sentAt
                  ? `Link emailed ${new Date(sentAt).toLocaleString()}.`
                  : "No payment link has been emailed."}
            </p>
          </div>
        </div>

        {!canRequestPayment && paymentStatus !== "paid" && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Agree the tutoring plan before requesting payment.
          </p>
        )}

        {eligible && (
          <button
            type="button"
            onClick={openConfirmation}
            disabled={busy}
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
            {agreedPaymentPlan === "installments" &&
            paymentStatus !== "not_requested"
              ? "Send Next Installment"
              : agreedPaymentPlan === "installments"
                ? "Send First Installment"
                : "Send Payment Link"}
          </button>
        )}

        {canRequestPayment && paymentStatus === "payment_requested" && (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {agreedPaymentPlan === "installments"
              ? "Installment payment requested. The selected recipient has been emailed."
              : "Payment requested. The selected recipient has been emailed."}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mt-3 text-sm text-emerald-700 dark:text-emerald-400"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        )}
      </section>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) {
              setConfirmOpen(false);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="payment-confirmation-title"
            aria-describedby="payment-confirmation-description"
            className="my-auto w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="23"
                    height="23"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <h2
                    id="payment-confirmation-title"
                    className="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                  >
                    Send payment link?
                  </h2>
                  <p className="mt-0 text-[13px] leading-5 text-slate-600 dark:text-slate-400">
                    Ready to send ecure Stripe payment link?
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close confirmation"
                  disabled={busy}
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="m18 6-12 12M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div
                id="payment-confirmation-description"
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60"
              >
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Session duration
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {durationMinutes ?? "—"} minutes
                  </span>
                </div>
                <div className="mt-4 rounded-lg bg-white p-3 dark:bg-slate-900">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Agreed payment arrangement
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {agreedPaymentPlan === "installments"
                      ? `${installments} installments`
                      : "Full course payment"}
                  </p>
                </div>
                {agreedPaymentPlan === "installments" ? (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Payment to request
                      <select
                        value={paymentKind}
                        onChange={(event) =>
                          setPaymentKind(
                            event.target.value as "full" | "installment",
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        disabled={busy}
                      >
                        <option value="installment">Next installment</option>
                      </select>
                    </label>
                  </div>
                ) : null}

                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Amount
                  </span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {money(
                      agreedPaymentPlan === "installments"
                        ? installmentCents
                        : totalCents,
                    )}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {totalSessions} sessions × {money(rateCents ?? 0)} per session
                  = {money(totalCents)} course total.
                  {agreedPaymentPlan === "installments"
                    ? ` Estimated installment: ${money(installmentCents)}; the final amount may vary slightly due to rounding.`
                    : " The full course total will be requested."}
                </p>

                <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Payment link recipient
                    <select
                      value={recipientEmail}
                      onChange={(event) =>
                        setRecipientEmail(event.target.value)
                      }
                      disabled={busy}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value={email}>Guardian/contact — {email}</option>
                      {learnerEmail.trim() &&
                      learnerEmail.trim().toLowerCase() !==
                        email.trim().toLowerCase() ? (
                        <option
                          value={learnerEmail}
                        >{`Learner — ${learnerEmail}`}</option>
                      ) : null}
                      <option value="custom">Different email address</option>
                    </select>
                  </label>
                  {recipientEmail === "custom" ? (
                    <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Other recipient email
                      <input
                        type="email"
                        required
                        value={customRecipientEmail}
                        onChange={(event) =>
                          setCustomRecipientEmail(event.target.value)
                        }
                        placeholder="payer@example.com"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      />
                    </label>
                  ) : null}
                  <p className="mt-2 break-all text-xs text-slate-500">
                    Selected recipient:{" "}
                    {recipientEmail === "custom"
                      ? customRecipientEmail || "Enter an email address"
                      : recipientEmail}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg bg-blue-50 p-3 text-sm leading-5 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                <svg
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <p>
                  This action emails a payment link only. No charge is made by
                  sending this email. The amount is validated against the agreed
                  course plan and the selected payment record.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmOpen(false)}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={busy || !eligible}
                onClick={send}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <svg
                      aria-hidden="true"
                      className="animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="opacity-25"
                      />
                      <path
                        d="M4 12a8 8 0 0 1 8-8"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="opacity-75"
                      />
                    </svg>
                    Sending email…
                  </>
                ) : (
                  <>
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                    Confirm and send email
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
