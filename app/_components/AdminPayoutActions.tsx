"use client";

import { useState } from "react";

export default function AdminPayoutActions({ payoutId, status }: { payoutId: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (status !== "Processing") return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{status}</span>;

  async function act(action: "markPaid" | "release") {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to process payout.");
      window.location.reload();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to process payout."); setBusy(false); }
  }

  return <div className="flex flex-col items-end gap-2"><div className="flex gap-2"><button disabled={busy} onClick={() => act("release")} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">Return to unpaid</button><button disabled={busy} onClick={() => act("markPaid")} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Mark paid</button></div>{error ? <p className="max-w-sm text-right text-xs text-red-600">{error}</p> : null}</div>;
}
