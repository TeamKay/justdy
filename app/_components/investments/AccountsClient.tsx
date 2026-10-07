"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Plus, WalletCards } from "lucide-react";

const types = [
  "BROKERAGE",
  "RETIREMENT",
  "PENSION",
  "MUTUAL_FUND",
  "BANK_INVESTMENT",
  "TREASURY",
  "BOND_ACCOUNT",
  "CASH",
  "OTHER",
] as const;

type Currency = "USD" | "GHS";

type InvestmentAccount = {
  id: string;
  institution: string;
  accountNumber: string;
  accountName: string | null;
  accountType: string;
  currency: Currency;
  country: string | null;
  _count: {
    holdings: number;
    transactions: number;
  };
};

type AccountForm = {
  institution: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  currency: Currency;
  country: string;
};

export default function AccountsClient({
  initialAccounts,
}: {
  initialAccounts: InvestmentAccount[];
}) {
  const [accounts, setAccounts] = useState<InvestmentAccount[]>(initialAccounts);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AccountForm>({
    institution: "Fidelity Investments",
    accountNumber: "",
    accountName: "",
    accountType: "BROKERAGE",
    currency: "USD",
    country: "",
  });

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/investments/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as InvestmentAccount;

      if (!response.ok) {
        throw new Error(
          "error" in data && typeof data.error === "string"
            ? data.error
            : "Unable to create account",
        );
      }

      setAccounts((current) => [data, ...current]);
      setOpen(false);
      setForm((current) => ({
        ...current,
        accountNumber: "",
        accountName: "",
        country: "",
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to create account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portfolio setup</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Investment accounts
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep brokerage, retirement, treasury and cash accounts organized.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Add account
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="rounded-2xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-muted p-2">
                <WalletCards className="h-4 w-4" />
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
                {account.currency}
              </span>
            </div>

            <h2 className="mt-5 font-semibold">
              {account.accountName || account.institution}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {account.institution} · •••• {account.accountNumber}
            </p>

            <div className="mt-5 flex gap-5 text-xs text-muted-foreground">
              <span>{account._count.holdings} holdings</span>
              <span>{account._count.transactions} transactions</span>
            </div>
          </div>
        ))}

        {!accounts.length && (
          <div className="col-span-full rounded-2xl border border-dashed bg-card px-6 py-14 text-center text-sm text-muted-foreground">
            No accounts yet. Add your first investment account to begin.
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form
            onSubmit={save}
            className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Add investment account
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Only the last four digits are shown after saving.
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

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Institution">
                <input
                  required
                  value={form.institution}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      institution: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Account number">
                <input
                  required
                  value={form.accountNumber}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      accountNumber: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Account name">
                <input
                  value={form.accountName}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      accountName: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Country">
                <input
                  value={form.country}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      country: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Account type">
                <select
                  value={form.accountType}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      accountType: e.target.value,
                    }))
                  }
                >
                  {types.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </Field>

              <Field label="Currency">
                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      currency: e.target.value as Currency,
                    }))
                  }
                >
                  <option>USD</option>
                  <option>GHS</option>
                </select>
              </Field>
            </div>

            <button
              disabled={saving}
              className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Saving…" : "Create account"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
