"use client";

import { useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

const types = [
  "STOCK",
  "ETF",
  "MUTUAL_FUND",
  "BOND",
  "TREASURY_BILL",
  "TREASURY_NOTE",
  "TREASURY_BOND",
  "CASH",
  "MONEY_MARKET",
  "REIT",
  "CRYPTO",
  "REAL_ESTATE",
  "OTHER",
] as const;

const regions = ["USA", "GHANA", "GLOBAL"] as const;
type Currency = "USD" | "GHS";

type InvestmentAccount = {
  id: string;
  institution: string;
  accountName: string | null;
};

type InvestmentAsset = {
  id: string;
  name: string;
  symbol: string | null;
  assetType: string;
  region: string;
  currency: Currency;
  exchange: string | null;
  issuer: string | null;
  account: InvestmentAccount | null;
};

type AssetForm = {
  name: string;
  symbol: string;
  assetType: string;
  region: string;
  currency: Currency;
  exchange: string;
  issuer: string;
  accountId: string;
};

export default function AssetManager({
  initialAssets,
  accounts,
}: {
  initialAssets: InvestmentAsset[];
  accounts: InvestmentAccount[];
}) {
  const [assets, setAssets] = useState<InvestmentAsset[]>(initialAssets);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AssetForm>({
    name: "",
    symbol: "",
    assetType: "STOCK",
    region: "USA",
    currency: "USD",
    exchange: "",
    issuer: "",
    accountId: "",
  });

  const filtered = assets.filter((asset) =>
    `${asset.name} ${asset.symbol ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  function update(key: keyof AssetForm, value: string) {
    setForm((current) => ({
      ...current,
      [key]:
        key === "currency"
          ? (value as Currency)
          : value,
    }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/investments/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as InvestmentAsset & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Unable to add asset");
      }

      setAssets((current) =>
        [...current, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setForm({
        name: "",
        symbol: "",
        assetType: "STOCK",
        region: "USA",
        currency: "USD",
        exchange: "",
        issuer: "",
        accountId: "",
      });
      setOpen(false);
      toast.success("Asset added");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to add asset",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Your investment universe
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Assets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stocks, ETFs, funds, bonds and other instruments used by your ledger.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Add asset
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-xl border bg-card px-3 shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assets…"
          className="h-11 flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="grid grid-cols-[1.6fr_.7fr_.8fr_.7fr_.8fr] gap-4 border-b px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Asset</span>
          <span>Type</span>
          <span>Region</span>
          <span>Currency</span>
          <span>Account</span>
        </div>

        <div className="divide-y">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className="grid grid-cols-[1.6fr_.7fr_.8fr_.7fr_.8fr] items-center gap-4 px-5 py-4 text-sm"
            >
              <div>
                <div className="font-medium">{asset.name}</div>
                <div className="text-xs text-muted-foreground">
                  {asset.symbol || "No ticker"}
                  {asset.exchange ? ` · ${asset.exchange}` : ""}
                </div>
              </div>
              <span className="text-xs">
                {asset.assetType.replaceAll("_", " ")}
              </span>
              <span className="text-xs">{asset.region}</span>
              <span className="text-xs">{asset.currency}</span>
              <span className="text-xs text-muted-foreground">
                {asset.account?.accountName ||
                  asset.account?.institution ||
                  "All accounts"}
              </span>
            </div>
          ))}

          {!filtered.length && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No assets match your search.
            </div>
          )}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <form
            onSubmit={submit}
            className="w-full max-w-xl rounded-2xl border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Add investment asset
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create the instrument before recording trades.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="Name"
                value={form.name}
                required
                onChange={(value) => update("name", value)}
                placeholder="Apple Inc."
              />
              <Field
                label="Symbol"
                value={form.symbol}
                onChange={(value) => update("symbol", value)}
                placeholder="AAPL"
              />
              <Select
                label="Asset type"
                value={form.assetType}
                onChange={(value) => update("assetType", value)}
                options={[...types]}
              />
              <Select
                label="Region"
                value={form.region}
                onChange={(value) => update("region", value)}
                options={[...regions]}
              />
              <Select
                label="Currency"
                value={form.currency}
                onChange={(value) => update("currency", value)}
                options={["USD", "GHS"]}
              />
              <Field
                label="Exchange"
                value={form.exchange}
                onChange={(value) => update("exchange", value)}
                placeholder="NASDAQ"
              />
              <Field
                label="Issuer"
                value={form.issuer}
                onChange={(value) => update("issuer", value)}
                placeholder="Optional issuer"
              />

              <label className="space-y-1.5">
                <span className="text-xs font-medium">Default account</span>
                <select
                  value={form.accountId}
                  onChange={(e) => update("accountId", e.target.value)}
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountName || account.institution}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              disabled={saving}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {saving ? "Adding…" : "Add asset"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium">{label}</span>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
