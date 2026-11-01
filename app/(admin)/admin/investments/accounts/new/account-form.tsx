"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  createInvestmentAccount,
  type AccountFormState,
} from "../actions";

const initialState: AccountFormState = {};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

const labelClass = "block text-sm font-medium text-slate-700";

export default function InvestmentAccountForm() {
  const [state, formAction, pending] = useActionState(
    createInvestmentAccount,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>
          Account name
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={80}
          placeholder="e.g. Fidelity Roth IRA"
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="provider" className={labelClass}>
            Provider
          </label>
          <select
            id="provider"
            name="provider"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Select provider
            </option>
            <option value="FIDELITY">Fidelity</option>
            <option value="BANK_OF_GHANA">Bank of Ghana</option>
            <option value="GHANA_STOCK_EXCHANGE">
              Ghana Stock Exchange
            </option>
            <option value="STANBIC">Stanbic</option>
            <option value="MANUAL">Manual tracking</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="type" className={labelClass}>
            Account type
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Select account type
            </option>
            <option value="ROTH_IRA">Roth IRA</option>
            <option value="TREASURY_BILLS">Treasury bills</option>
            <option value="STOCKS">Stocks</option>
            <option value="MUTUAL_FUND">Mutual fund</option>
            <option value="CASH">Cash</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="currency" className={labelClass}>
            Account currency
          </label>
          <select
            id="currency"
            name="currency"
            required
            defaultValue="USD"
            className={inputClass}
          >
            <option value="USD">USD — US dollar</option>
            <option value="GHS">GHS — Ghanaian cedi</option>
          </select>
        </div>

        <div>
          <label htmlFor="country" className={labelClass}>
            Country
          </label>
          <select
            id="country"
            name="country"
            required
            defaultValue="United States"
            className={inputClass}
          >
            <option value="United States">United States</option>
            <option value="Ghana">Ghana</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={2000}
          placeholder="Optional details about this account"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/admin/investments/accounts"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving account…" : "Create account"}
        </button>
      </div>
    </form>
  );
}