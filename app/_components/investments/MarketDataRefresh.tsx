"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

export default function MarketDataRefresh() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function refresh() {
    setLoading(true); setMessage("");
    const response = await fetch("/api/admin/investments/market-data/refresh", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    setMessage(response.ok ? `Updated ${data.updatedPrices ?? 0} prices${data.fxUpdated ? " and USD/GHS FX" : ""}.` : data.error ?? "Unable to refresh market data.");
  }
  return <div className="flex flex-wrap items-center gap-3"><button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{loading ? "Refreshing…" : "Refresh market data"}</button>{message && <span className="text-sm text-muted-foreground">{message}</span>}</div>;
}
