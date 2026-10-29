"use client";

import { useEffect, useState } from "react";

type Payment = {
  id: string;
  installmentNumber: number;
  expectedAmountCents: number;
  currency: string;
  status: string;
  paidAt: string | null;
  emailSentAt: string | null;
};
type BillingRequest = {
  id: string;
  studentName: string;
  subject: string | null;
  status: string;
  paymentStatus: string;
  paymentPlan: string;
  installmentCount: number;
  courseTotalCents: number | null;
  amountPaidCents: number;
  remainingCents: number;
  currency: string;
  planAgreedAt: string | null;
  tutoringPayments: Payment[];
};

function money(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`;
  }
}

export default function TutoringOnboardingBilling() {
  const [requests, setRequests] = useState<BillingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/tutoring/onboarding/my-billing", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(body.error || "Unable to load tutoring billing.");
        return body as { requests?: BillingRequest[] };
      })
      .then((body) => {
        if (alive)
          setRequests(Array.isArray(body.requests) ? body.requests : []);
      })
      .catch((cause: unknown) => {
        if (alive)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load tutoring billing.",
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading)
    return (
      <section className="rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Tutoring plan & billing</h2>
        <p className="mt-2 text-sm text-slate-500">
          Loading your tutoring details…
        </p>
      </section>
    );
  if (error)
    return (
      <section className="rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Tutoring plan & billing</h2>
        <p role="alert" className="mt-2 text-sm text-amber-800">
          {error}
        </p>
      </section>
    );
  if (!requests.length)
    return (
      <section className="rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Tutoring plan & billing</h2>
        <p className="mt-2 text-sm text-slate-500">
          No tutoring onboarding requests are linked to this learner account
          yet.
        </p>
      </section>
    );

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Tutoring plan & billing</h2>
      {requests.map((request) => (
        <article
          key={request.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">
                {request.subject || "Tutoring plan"}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Reference: {request.id}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
              {request.paymentStatus.replaceAll("_", " ")}
            </span>
          </div>
          {request.planAgreedAt ? (
            <p className="mt-3 text-sm text-slate-600">
              Plan agreed {new Date(request.planAgreedAt).toLocaleDateString()}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Your plan is still being prepared. No payment has been requested.
            </p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Course total</p>
              <p className="mt-1 font-semibold">
                {request.courseTotalCents == null
                  ? "Not agreed yet"
                  : money(request.courseTotalCents, request.currency)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Paid</p>
              <p className="mt-1 font-semibold">
                {money(request.amountPaidCents, request.currency)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Remaining</p>
              <p className="mt-1 font-semibold">
                {request.courseTotalCents == null
                  ? "—"
                  : money(request.remainingCents, request.currency)}
              </p>
            </div>
          </div>
          {request.tutoringPayments.length ? (
            <div className="mt-4">
              <h4 className="text-sm font-semibold">Installments</h4>
              <ul className="mt-2 divide-y divide-slate-100">
                {request.tutoringPayments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                  >
                    <span>Payment {payment.installmentNumber}</span>
                    <span>
                      {money(payment.expectedAmountCents, payment.currency)}
                    </span>
                    <span className="capitalize text-slate-600">
                      {payment.status.replaceAll("_", " ")}
                    </span>
                    {payment.paidAt ? (
                      <span className="text-xs text-slate-500">
                        Paid {new Date(payment.paidAt).toLocaleDateString()}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Payment details will appear here after your plan is agreed and the
              first payment link is sent.
            </p>
          )}
        </article>
      ))}
    </section>
  );
}
