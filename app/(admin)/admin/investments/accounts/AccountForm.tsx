"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const accountTypes = [
  ["BROKERAGE", "Brokerage"],
  ["RETIREMENT", "Retirement"],
  ["PENSION", "Pension"],
  ["MUTUAL_FUND", "Mutual fund"],
  ["BANK_INVESTMENT", "Bank investment"],
  ["TREASURY", "Treasury"],
  ["BOND_ACCOUNT", "Bond account"],
  ["CASH", "Cash"],
  ["OTHER", "Other"],
] as const;

export default function AccountForm() {
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    institution: "",
    accountName: "",
    accountNumber: "",
    accountType: "BROKERAGE",
    currency: "USD",
    country: "USA",
  });

  function update(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch("/api/admin/investments/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to create account");
      toast.success("Investment account added");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-5 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Plus className="h-4 w-4" /></div>
          <div>
            <h3 className="font-semibold">Add account</h3>
            <p className="text-xs text-muted-foreground">Manual setup for Phase 1.</p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <Field label="Institution" value={form.institution} placeholder="Fidelity Investments" onChange={(v) => update("institution", v)} required />
        <Field label="Account name" value={form.accountName} placeholder="Main brokerage" onChange={(v) => update("accountName", v)} />
        <Field label="Account number" value={form.accountNumber} placeholder="Account number" onChange={(v) => update("accountNumber", v)} required />
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5">
            <span className="text-xs font-medium">Type</span>
            <select value={form.accountType} onChange={(e) => update("accountType", e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
              {accountTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium">Currency</span>
            <select value={form.currency} onChange={(e) => update("currency", e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="USD">USD</option>
              <option value="GHS">GHS</option>
            </select>
          </label>
        </div>
        <Field label="Country" value={form.country} placeholder="USA" onChange={(v) => update("country", v)} />
      </div>

      <button type="submit" disabled={pending} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {pending ? "Adding…" : "Add account"}
      </button>
    </form>
  );
}

function Field({ label, value, placeholder, onChange, required }: { label: string; value: string; placeholder?: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium">{label}</span>
      <input required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
    </label>
  );
}
