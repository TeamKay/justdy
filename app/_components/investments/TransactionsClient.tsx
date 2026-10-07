"use client";

import { useState } from "react";

type Currency = "USD" | "GHS";

type InvestmentAccount = {
  id: string;
  institution: string;
  accountName: string | null;
  currency: Currency;
};

type InvestmentAsset = {
  id: string;
  name: string;
  symbol: string | null;
  currency: Currency;
};

type Transaction = {
  id: string;
  type: string;
  transactionDate: string;
  quantity: string | number | null;
  price: string | number | null;
  grossAmount: string | number | null;
  netAmount: string | number | null;
  currency: Currency;
  asset: {
    symbol: string | null;
    name: string;
  } | null;
  account: {
    institution: string;
  };
};

type TransactionForm = {
  accountId: string;
  assetId: string;
  type: string;
  transactionDate: string;
  quantity: string;
  price: string;
  grossAmount: string;
  netAmount: string;
  fees: string;
  taxes: string;
  currency: Currency;
  notes: string;
};

export default function TransactionsClient({
  accounts,
  assets,
  initialTransactions,
}: {
  accounts: InvestmentAccount[];
  assets: InvestmentAsset[];
  initialTransactions: Transaction[];
}) {
  const [form, setForm] = useState<TransactionForm>({
    accountId: accounts[0]?.id || "",
    assetId: assets[0]?.id || "",
    type: "BUY",
    transactionDate: new Date().toISOString().slice(0, 10),
    quantity: "",
    price: "",
    grossAmount: "",
    netAmount: "",
    fees: "0",
    taxes: "0",
    currency: accounts[0]?.currency || "USD",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(
        "/api/admin/investments/transactions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        alert(data.error || "Unable to save transaction");
        return;
      }

      location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Portfolio activity</p>
        <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Record trades and income events. Holdings are recalculated from the
          transaction ledger.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form
          onSubmit={save}
          className="rounded-2xl border bg-card p-5 shadow-sm"
        >
          <h2 className="font-semibold">Add transaction</h2>

          <div className="mt-5 grid gap-3">
            <Select
              label="Account"
              value={form.accountId}
              set={(value) =>
                setForm((current) => ({
                  ...current,
                  accountId: value,
                  currency:
                    accounts.find((account) => account.id === value)?.currency ||
                    current.currency,
                }))
              }
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountName || account.institution} ·{" "}
                  {account.currency}
                </option>
              ))}
            </Select>

            <Select
              label="Asset"
              value={form.assetId}
              set={(value) =>
                setForm((current) => ({
                  ...current,
                  assetId: value,
                  currency:
                    assets.find((asset) => asset.id === value)?.currency ||
                    current.currency,
                }))
              }
            >
              <option value="">Cash / income</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                  {asset.symbol ? ` (${asset.symbol})` : ""}
                </option>
              ))}
            </Select>

            <Select
              label="Type"
              value={form.type}
              set={(value) =>
                setForm((current) => ({ ...current, type: value }))
              }
            >
              {[
                "BUY",
                "SELL",
                "DIVIDEND",
                "DRIP",
                "INTEREST",
                "FEE",
                "TAX",
                "CONTRIBUTION",
                "WITHDRAWAL",
                "TRANSFER_IN",
                "TRANSFER_OUT",
                "CASH",
                "OTHER",
              ].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </Select>

            <Input
              label="Date"
              type="date"
              value={form.transactionDate}
              set={(value) =>
                setForm((current) => ({
                  ...current,
                  transactionDate: value,
                }))
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Quantity"
                value={form.quantity}
                set={(value) =>
                  setForm((current) => ({ ...current, quantity: value }))
                }
              />
              <Input
                label="Price"
                value={form.price}
                set={(value) =>
                  setForm((current) => ({ ...current, price: value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Gross amount"
                value={form.grossAmount}
                set={(value) =>
                  setForm((current) => ({ ...current, grossAmount: value }))
                }
              />
              <Input
                label="Net amount"
                value={form.netAmount}
                set={(value) =>
                  setForm((current) => ({ ...current, netAmount: value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Fees"
                value={form.fees}
                set={(value) =>
                  setForm((current) => ({ ...current, fees: value }))
                }
              />
              <Input
                label="Taxes"
                value={form.taxes}
                set={(value) =>
                  setForm((current) => ({ ...current, taxes: value }))
                }
              />
            </div>

            <button
              disabled={saving || !accounts.length}
              className="mt-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save transaction"}
            </button>
          </div>
        </form>

        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Recent transactions</h2>
          </div>

          <div className="divide-y">
            {initialTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div>
                  <div className="text-sm font-medium">
                    {transaction.type.replaceAll("_", " ")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {transaction.asset?.symbol ||
                      transaction.asset?.name ||
                      "Cash"}{" "}
                    · {transaction.account.institution} ·{" "}
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-sm font-semibold">
                  {Number(
                    transaction.netAmount ??
                      transaction.grossAmount ??
                      0,
                  ).toLocaleString(undefined, {
                    style: "currency",
                    currency: transaction.currency,
                  })}
                </div>
              </div>
            ))}

            {!initialTransactions.length && (
              <div className="p-8 text-sm text-muted-foreground">
                No transactions yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  set,
  type = "text",
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => set(e.target.value)}
        className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-offset-background focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}

function Select({
  label,
  value,
  set,
  children,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => set(e.target.value)}
        className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground"
      >
        {children}
      </select>
    </label>
  );
}
