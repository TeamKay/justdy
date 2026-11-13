"use client";
import { useEffect, useState } from "react";

type Installment = {
  id: string;
  installmentNumber: number;
  amountCents: number;
  currency: string;
  status: string;
  paidAt: string | null;
};
type Item = {
  id: string;
  studentName: string;
  subject: string | null;
  currency: string;
  totalCents: number | null;
  paidCents: number;
  remainingCents: number | null;
  paymentPlan: string | null;
  installmentCount: number | null;
  installments: Installment[];
};
function money(cents: number | null, currency: string) {
  if (cents == null) return "Not finalized";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}
export default function TutoringBillingSummary() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    fetch("/api/tutoring/billing", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (!cancelled)
          setItems(Array.isArray(data.billing) ? data.billing : []);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "We couldn't load billing right now. Refresh and try again.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  if (loading)
    return (
      <section className="rounded-xl border p-5">
        Loading tutoring billing…
      </section>
    );
  if (error)
    return (
      <section role="alert" className="rounded-xl border p-5 text-sm">
        {error}
      </section>
    );
  if (!items.length) return null;
  return (
    <section className="space-y-4" aria-label="Tutoring billing">
      <div>
        <h2 className="text-xl font-semibold">Tutoring billing</h2>
        <p className="text-sm text-muted-foreground">
          Paid amounts update after Stripe confirms each installment.
        </p>
      </div>
      {items.map((item) => (
        <article key={item.id} className="space-y-4 rounded-xl border p-4">
          <div>
            <h3 className="font-semibold">
              {item.studentName}
              {item.subject ? ` · ${item.subject}` : ""}
            </h3>
            <p className="text-sm text-muted-foreground">
              {item.paymentPlan || "Agreed payment plan"}
              {item.installmentCount
                ? ` · ${item.installmentCount} installment(s)`
                : ""}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["Total bill", item.totalCents],
              ["Paid", item.paidCents],
              ["Remaining", item.remainingCents],
            ].map(([label, amount]) => (
              <div key={String(label)} className="rounded-lg bg-muted/40 p-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">
                  {money(amount as number | null, item.currency)}
                </p>
              </div>
            ))}
          </div>
          {item.installments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Installment history</h4>
              <ul className="divide-y">
                {item.installments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                  >
                    <span>Installment {p.installmentNumber}</span>
                    <span>{money(p.amountCents, p.currency)}</span>
                    <span className="capitalize">
                      {p.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-muted-foreground">
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString()
                        : "Not paid"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
