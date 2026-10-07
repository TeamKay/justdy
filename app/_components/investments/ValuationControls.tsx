"use client";

import { useState } from "react";
import { RefreshCw, Save } from "lucide-react";

type Currency = "USD" | "GHS";

type Asset = {
  id: string;
  name: string;
  symbol: string | null;
  currency: Currency;
  latest: {
    price: string;
    asOf: string;
    source: string;
  } | null;
};

type PriceResponse = {
  id: string;
  latest: {
    price: string;
  } | null;
};

type FxResponse = {
  base: Currency;
  quote: Currency;
  rate: string | number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPriceResponse(value: unknown): value is PriceResponse {
  if (!isRecord(value) || typeof value.id !== "string") {
    return false;
  }

  return (
    value.latest === null ||
    (isRecord(value.latest) && typeof value.latest.price === "string")
  );
}

function isFxResponse(value: unknown): value is FxResponse {
  if (
    !isRecord(value) ||
    (value.base !== "USD" && value.base !== "GHS") ||
    (value.quote !== "USD" && value.quote !== "GHS")
  ) {
    return false;
  }

  return (
    typeof value.rate === "string" ||
    typeof value.rate === "number"
  );
}

export default function ValuationControls({
  assets,
}: {
  assets: Asset[];
}) {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [assetId, setAssetId] = useState(assets[0]?.id ?? "");
  const [fx, setFx] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedAsset = assets.find((asset) => asset.id === assetId);
  const displayedPrice =
    prices[assetId] ?? selectedAsset?.latest?.price ?? "";

  async function savePrice() {
    if (!assetId || !displayedPrice) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/investments/prices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assetId,
          price: displayedPrice,
        }),
      });

      const data = (await response.json()) as { error?: string };
      setMessage(
        response.ok
          ? "Price saved and holding values recalculated."
          : data.error ?? "Unable to save price.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveFx() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/investments/fx", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          base: "USD",
          quote: "GHS",
          rate: fx,
        }),
      });

      const data = (await response.json()) as { error?: string };
      setMessage(
        response.ok
          ? "USD/GHS rate saved."
          : data.error ?? "Unable to save FX rate.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function refresh() {
    setLoading(true);

    try {
      const [pricesResponse, fxResponse] = await Promise.all([
        fetch("/api/admin/investments/prices"),
        fetch("/api/admin/investments/fx"),
      ]);

      const pricesPayload: unknown = await pricesResponse.json();
      const fxPayload: unknown = await fxResponse.json();

      if (Array.isArray(pricesPayload)) {
        const next: Record<string, string> = {};

        for (const item of pricesPayload) {
          if (isPriceResponse(item) && item.latest) {
            next[item.id] = item.latest.price;
          }
        }

        setPrices(next);
      }

      if (Array.isArray(fxPayload)) {
        const latest = fxPayload.find(isFxResponse);

        if (latest && latest.base === "USD" && latest.quote === "GHS") {
          setFx(Number(latest.rate));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Update market price</h2>
              <p className="text-xs text-muted-foreground">
                Manual prices are stored with their timestamp and marked as
                MANUAL.
              </p>
            </div>

            <button
              type="button"
              onClick={refresh}
              className="rounded-lg border p-2"
              title="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="rounded-xl border bg-background px-3 py-2.5 text-sm"
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.symbol ? `${asset.symbol} · ` : ""}
                  {asset.name}
                </option>
              ))}
            </select>

            <input
              value={displayedPrice}
              onChange={(e) =>
                setPrices((current) => ({
                  ...current,
                  [assetId]: e.target.value,
                }))
              }
              type="number"
              min="0"
              step="any"
              placeholder="Current price"
              className="rounded-xl border bg-background px-3 py-2.5 text-sm"
            />

            <button
              disabled={saving || !assetId}
              onClick={savePrice}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">USD / GHS FX rate</h2>
          <p className="text-xs text-muted-foreground">
            Enter how many GHS equal 1 USD.
          </p>

          <div className="mt-5 flex gap-3">
            <input
              value={fx}
              onChange={(e) => setFx(Number(e.target.value))}
              type="number"
              min="0.000001"
              step="any"
              className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm"
            />
            <button
              disabled={saving}
              onClick={saveFx}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
