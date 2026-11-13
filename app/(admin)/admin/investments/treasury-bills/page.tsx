import Link from "next/link";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";

function formatMoney(value: number | string, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function statusStyle(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-blue-50 text-blue-700";
    case "MATURED":
      return "bg-amber-50 text-amber-700";
    case "REDEEMED":
      return "bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default async function TreasuryBillsPage() {
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

  if (!profile) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Treasury bills
        </h1>
        <p className="text-sm text-slate-500">
          You haven&apos;t recorded any Treasury bills yet.
        </p>
        <Link
          href="/admin/investments/treasury-bills/new"
          className="inline-flex rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Add Treasury bill
        </Link>
      </div>
    );
  }

  const bills = await prisma.investmentTreasuryBill.findMany({
    where: {
      asset: {
        profileId: profile.id,
      },
    },
    orderBy: { maturityDate: "asc" },
    select: {
      id: true,
      purchaseDate: true,
      maturityDate: true,
      purchasePrice: true,
      faceValue: true,
      annualizedYield: true,
      status: true,
      asset: {
        select: {
          name: true,
          symbol: true,
          currency: true,
        },
      },
    },
  });

  const activeBills = bills.filter((bill) => bill.status === "ACTIVE");

  // Calculate totals independently for each currency.
  const currencyTotals = activeBills.reduce<
    Record<string, { invested: number; expectedReturn: number }>
  >((totals, bill) => {
    const currency = bill.asset.currency;

    if (!totals[currency]) {
      totals[currency] = {
        invested: 0,
        expectedReturn: 0,
      };
    }

    const purchasePrice = Number(bill.purchasePrice);
    const faceValue = Number(bill.faceValue);

    totals[currency].invested += purchasePrice;
    totals[currency].expectedReturn += faceValue - purchasePrice;

    return totals;
  }, {});

  const currencies = Object.keys(currencyTotals).sort();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/investments"
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            ← Back to investments
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Treasury bills
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track purchases, expected returns, and maturity dates.
          </p>
        </div>

        <Link
          href="/admin/investments/treasury-bills/new"
          className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Add Treasury bill
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active bills</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {activeBills.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active amount invested</p>

          {currencies.length > 0 ? (
            <div className="mt-2 space-y-2">
              {currencies.map((currency) => (
                <p
                  key={currency}
                  className="text-xl font-bold text-slate-900"
                >
                  {formatMoney(currencyTotals[currency].invested, currency)}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xl font-bold text-slate-900">—</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Expected return</p>

          {currencies.length > 0 ? (
            <div className="mt-2 space-y-2">
              {currencies.map((currency) => (
                <p
                  key={currency}
                  className="text-xl font-bold text-emerald-700"
                >
                  {formatMoney(
                    currencyTotals[currency].expectedReturn,
                    currency,
                  )}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xl font-bold text-slate-900">—</p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">All Treasury bills</h2>
          <p className="mt-1 text-sm text-slate-500">
            {bills.length} recorded {bills.length === 1 ? "bill" : "bills"}
          </p>
        </div>

        {bills.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-medium text-slate-900">
              No Treasury bills recorded yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first Treasury bill to start tracking it.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Bill</th>
                  <th className="px-5 py-3 font-semibold">Purchased</th>
                  <th className="px-5 py-3 font-semibold">Maturity</th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Purchase price
                  </th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Face value
                  </th>
                  <th className="px-5 py-3 text-right font-semibold">Yield</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {bill.asset.name}
                      </p>
                      {bill.asset.symbol && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {bill.asset.symbol}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(bill.purchaseDate)}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(bill.maturityDate)}
                    </td>

                    <td className="px-5 py-4 text-right font-medium text-slate-900">
                      {formatMoney(
                        bill.purchasePrice.toString(),
                        bill.asset.currency,
                      )}
                    </td>

                    <td className="px-5 py-4 text-right font-medium text-slate-900">
                      {formatMoney(
                        bill.faceValue.toString(),
                        bill.asset.currency,
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-600">
                      {bill.annualizedYield !== null
                        ? `${(Number(bill.annualizedYield) * 100).toFixed(2)}%`
                        : "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(bill.status)}`}
                      >
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}