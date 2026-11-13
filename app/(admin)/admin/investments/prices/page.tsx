import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";
import { saveAssetPrice, saveExchangeRate } from "./actions";
import { refreshUsMarketPrices } from "./refresh-action";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function InvestmentPricesPage() {
  let owner;
  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    redirect("/admin");
  }

  const profile = await prisma.investmentProfile.findUnique({
    where: { userId: owner.id },
    select: { id: true },
  });
  if (!profile) redirect("/admin/investments?error=profile");

  const [assets, rates] = await Promise.all([
    prisma.investmentAsset.findMany({
      where: { profileId: profile.id, isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        symbol: true,
        currency: true,
        prices: {
          orderBy: { priceDate: "desc" },
          take: 1,
          select: { price: true, currency: true, priceDate: true, source: true },
        },
      },
    }),
    prisma.investmentExchangeRate.findMany({
      orderBy: { rateDate: "desc" },
      take: 8,
      select: {
        baseCurrency: true,
        quoteCurrency: true,
        rate: true,
        rateDate: true,
        source: true,
      },
    }),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <Link
            href="/admin/investments"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" /> Back to investments
          </Link>
          <p className="mt-6 text-sm font-medium text-blue-700">PORTFOLIO DATA</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Prices & exchange rates</h1>
          <p className="mt-2 text-sm text-slate-500">
            Record current asset prices and USD/GHS exchange rates. These values feed the portfolio valuation and growth dashboard.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <form action={refreshUsMarketPrices}>
              <button type="submit" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
                Refresh US market prices
              </button>
            </form>
            <p className="text-xs text-slate-500">Fetches the latest available daily quote for active USD stocks, ETFs and mutual funds with a ticker.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">Record an asset price</h2>
            <p className="mt-1 text-sm text-slate-500">Enter the unit price for a stock, ETF, mutual fund, or other asset.</p>
            {assets.length === 0 ? (
              <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Create an investment asset before recording its price.</p>
            ) : (
              <form action={saveAssetPrice} className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Asset
                  <select name="assetId" required defaultValue="" className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">
                    <option value="" disabled>Select asset</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>{asset.name}{asset.symbol ? ` (${asset.symbol})` : ""}</option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Unit price
                    <input name="price" type="number" min="0.00000001" step="any" required className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" placeholder="0.00" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Currency
                    <select name="currency" defaultValue="USD" required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">
                      <option value="USD">USD</option>
                      <option value="GHS">GHS</option>
                    </select>
                  </label>
                </div>
                <label className="block text-sm font-medium text-slate-700">
                  Price date
                  <input name="priceDate" type="date" defaultValue={today} required className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
                </label>
                <button type="submit" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Save asset price</button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">Record an exchange rate</h2>
            <p className="mt-1 text-sm text-slate-500">For example, if 1 USD = 15 GHS, enter USD as base, GHS as quote, and 15 as the rate.</p>
            <form action={saveExchangeRate} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Base currency
                  <select name="baseCurrency" defaultValue="USD" required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">
                    <option value="USD">USD</option>
                    <option value="GHS">GHS</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Quote currency
                  <select name="quoteCurrency" defaultValue="GHS" required className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">
                    <option value="USD">USD</option>
                    <option value="GHS">GHS</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Rate (quote units per 1 base unit)
                <input name="rate" type="number" min="0.00000001" step="any" required className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" placeholder="e.g. 15" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Rate date
                <input name="rateDate" type="date" defaultValue={today} required className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              </label>
              <button type="submit" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Save exchange rate</button>
            </form>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">Latest recorded asset prices</h2>
          {assets.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No assets have been created yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {assets.map((asset) => {
                const price = asset.prices[0];
                return (
                  <div key={asset.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{asset.name}{asset.symbol ? ` · ${asset.symbol}` : ""}</p>
                      <p className="text-xs text-slate-500">Asset currency: {asset.currency}</p>
                    </div>
                    <p className="text-sm text-slate-700">
                      {price ? `${Number(price.price).toLocaleString("en-US", { maximumFractionDigits: 6 })} ${price.currency} · ${formatDate(price.priceDate)} · ${price.source}` : "No price recorded"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">Latest exchange rates</h2>
          {rates.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No exchange rates recorded yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {rates.map((rate, index) => (
                <div key={`${rate.baseCurrency}-${rate.quoteCurrency}-${rate.rateDate.toISOString()}-${index}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium">1 {rate.baseCurrency} = {Number(rate.rate).toLocaleString("en-US", { maximumFractionDigits: 6 })} {rate.quoteCurrency}</p>
                  <p className="text-xs text-slate-500">{formatDate(rate.rateDate)} · {rate.source}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
