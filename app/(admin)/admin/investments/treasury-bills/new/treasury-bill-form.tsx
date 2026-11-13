
"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  createTreasuryBill,
  type TreasuryBillFormState,
} from "../actions";

type Account = {
  id: string;
  name: string;
  currency: string;
};

export default function TreasuryBillForm({
  accounts,
}: {
  accounts: Account[];
}) {
  const [state, formAction, pending] = useActionState<
    TreasuryBillFormState,
    FormData
  >(createTreasuryBill, {});

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>
          Treasury bill name
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={100}
          placeholder="e.g. Ghana 91-Day Treasury Bill"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="accountId" className={labelClass}>
          Investment account
        </label>
        <select
          id="accountId"
          name="accountId"
          required
          defaultValue=""
          className={inputClass}
        >
          <option value="" disabled>Select account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.currency})
            </option>
          ))}
        </select>
        {accounts.length === 0 && (
          <p className="mt-2 text-sm text-amber-700">
            Create an investment account before recording a Treasury bill.
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="purchaseDate" className={labelClass}>
            Purchase date
          </label>
          <input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="maturityDate" className={labelClass}>
            Maturity date
          </label>
          <input
            id="maturityDate"
            name="maturityDate"
            type="date"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="purchasePrice" className={labelClass}>
            Purchase price
          </label>
          <input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="9500.00"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="faceValue" className={labelClass}>
            Face value
          </label>
          <input
            id="faceValue"
            name="faceValue"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="10000.00"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="annualizedYield" className={labelClass}>
            Annualized yield (%)
          </label>
          <input
            id="annualizedYield"
            name="annualizedYield"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="25.00"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="fees" className={labelClass}>
            Purchase fees
          </label>
          <input
            id="fees"
            name="fees"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={2000}
          placeholder="Additional details"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/admin/investments/treasury-bills"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending || accounts.length === 0}
          className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving bill…" : "Create Treasury bill"}
        </button>
      </div>
    </form>
  );
}
