import Link from "next/link";
import { redirect } from "next/navigation";

import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";
import { createInvestmentAsset } from "../actions";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "block text-sm font-medium text-slate-700";

export default async function NewInvestmentAssetPage({
  searchParams,
}: PageProps) {
  try {
    await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/admin");
  }

  const { error } = await searchParams;

  const errorMessage =
    error === "duplicate"
      ? "An asset with that symbol already exists in your portfolio."
      : error === "invalid"
        ? "Please check the required fields and try again."
        : error === "profile"
          ? "Your investment profile could not be found."
          : null;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          href="/admin/investments/assets"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to investments
        </Link>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          Add an investment
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Register an individual investment to associate it with transactions
          and track its performance.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      <form
        action={createInvestmentAsset}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <label htmlFor="name" className={labelClass}>
            Investment name *
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={150}
            placeholder="e.g. Apple Inc., Ghana Treasury Bill"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="symbol" className={labelClass}>
            Symbol or reference
          </label>
          <input
            id="symbol"
            name="symbol"
            maxLength={40}
            placeholder="e.g. AAPL, GCB, or a short Treasury bill reference"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-500">
            Optional. If supplied, the symbol must be unique within your
            investment profile.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="assetType" className={labelClass}>
              Investment type *
            </label>
            <select
              id="assetType"
              name="assetType"
              required
              defaultValue="STOCK"
              className={inputClass}
            >
              <option value="STOCK">Stock</option>
              <option value="ETF">ETF</option>
              <option value="MUTUAL_FUND">Mutual fund</option>
              <option value="TREASURY_BILL">Treasury bill</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="currency" className={labelClass}>
              Currency *
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
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="exchange" className={labelClass}>
              Exchange or market
            </label>
            <input
              id="exchange"
              name="exchange"
              maxLength={100}
              placeholder="e.g. NYSE, NASDAQ, Ghana Stock Exchange"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="externalSymbol" className={labelClass}>
              Market-data symbol
            </label>
            <input
              id="externalSymbol"
              name="externalSymbol"
              maxLength={100}
              placeholder="Optional symbol used by a price provider"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Link
            href="/admin/investments/assets"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save investment
          </button>
        </div>
      </form>
    </main>
  );
}