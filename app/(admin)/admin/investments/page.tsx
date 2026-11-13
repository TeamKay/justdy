import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Landmark,
  PiggyBank,
  Plus,
  ReceiptText,
} from "lucide-react";
import RedeemBillForm from "./treasury-bills/redeem-bill-form";
import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";
import { calculatePortfolioValuation } from "@/lib/investments/portfolio-valuation";
import PortfolioPerformanceChart from "./components/portfolio-performance-chart";
import { captureInvestmentSnapshot } from "./snapshots/actions";

export const dynamic = "force-dynamic";

function formatMoney(
  value: number | string,
  currency: "USD" | "GHS",
) {
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
  }).format(date);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getTransactionIcon(type: string) {
  if (
    ["SELL", "DIVIDEND", "INTEREST", "WITHDRAWAL", "TRANSFER_OUT"].includes(
      type,
    )
  ) {
    return ArrowUpRight;
  }

  return ArrowDownLeft;
}

export default async function InvestmentsPage() {
  let owner;

  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    if (
      error instanceof Error &&
      ["FORBIDDEN", "INVESTMENT_OWNER_NOT_CONFIGURED"].includes(error.message)
    ) {
      redirect("/admin");
    }

    throw error;
  }

  const profile = await prisma.investmentProfile.upsert({
    where: { userId: owner.id },
    update: {},
    create: { userId: owner.id },
    select: {
      id: true,
      baseCurrency: true,
    },
  });

  const now = new Date();

  const [
    accounts,
    recentTransactions,
    activeTreasuryBills,
    importBatches,
  ] = await Promise.all([
    prisma.investmentAccount.findMany({
      where: {
        profileId: profile.id,
        isActive: true,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        provider: true,
        type: true,
        currency: true,
        country: true,
        lastSyncedAt: true,
      },
    }),


    prisma.investmentTransaction.findMany({
      where: {
        account: {
          profileId: profile.id,
        },
      },
      orderBy: { occurredAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        occurredAt: true,
        amount: true,
        currency: true,
        description: true,
        account: {
          select: { name: true },
        },
        asset: {
          select: { name: true, symbol: true },
        },
      },
    }),

    prisma.investmentTreasuryBill.findMany({
      where: {
        status: "ACTIVE",
        asset: {
          profileId: profile.id,
        },
      },
      orderBy: { maturityDate: "asc" },
      take: 6,
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
    }),

    prisma.investmentImportBatch.findMany({
      where: {
        profileId: profile.id,
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        fileName: true,
        status: true,
        importedRows: true,
        skippedRows: true,
        failedRows: true,
        createdAt: true,
      },
    }),
  ]);

  const valuation = await calculatePortfolioValuation(
    profile.id,
    profile.baseCurrency,
  );


  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page heading */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">
              PERSONAL FINANCE
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Investments
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Monitor your accounts, investment activity, and treasury-bill
              maturities in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/admin/investments/accounts/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              <Plus className="h-4 w-4" />
              Add account
            </Link>
            <Link
              href="/admin/investments/prices"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Prices &amp; exchange rates
            </Link>
            <Link
              href="/admin/investments/imports"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Investment imports
            </Link>
          </div>
        </header>

        {/* Portfolio overview */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_1fr] lg:p-8">
            <div>
              <p className="text-sm font-medium text-slate-500">
                TOTAL PORTFOLIO VALUE
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                {formatMoney(valuation.totalValue, profile.baseCurrency)}
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                {valuation.missingFxCurrencies.length > 0
                  ? "Partial valuation — some currencies are excluded because exchange rates are missing."
                  : "Your investments across all active accounts."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">
                    Daily change
                  </p>
                  <p
                    className={`mt-1 text-lg font-semibold ${
                      valuation.dailyChange === null
                        ? "text-slate-500"
                        : valuation.dailyChange >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                    }`}
                  >
                    {valuation.dailyChange === null
                      ? "Unavailable"
                      : (
                          <>
                            {valuation.dailyChange >= 0 ? "+" : ""}
                            {formatMoney(
                              valuation.dailyChange,
                              profile.baseCurrency,
                            )}
                            {valuation.dailyChangePercent !== null && (
                              <span className="ml-2 text-sm">
                                ({valuation.dailyChangePercent >= 0 ? "+" : ""}
                                {valuation.dailyChangePercent.toFixed(2)}%)
                              </span>
                            )}
                          </>
                        )}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {valuation.dailyChangeNote}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">
                    Estimated holdings
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {valuation.estimatedHoldingCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Using estimated values
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-900">
                  Investment return
                </h3>
                <span className="text-xs text-slate-500">
                  Excludes deposits and withdrawals
                </span>
              </div>

              <p
                className={`mt-4 text-3xl font-bold tracking-tight ${
                  valuation.totalInvestmentReturn === null
                    ? "text-slate-500"
                    : valuation.totalInvestmentReturn >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                }`}
              >
                {valuation.totalInvestmentReturn === null
                  ? "Unavailable"
                  : formatMoney(
                      valuation.totalInvestmentReturn,
                      profile.baseCurrency,
                    )}
              </p>

              <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
                {[
                  {
                    label: "Realized gains",
                    value: valuation.realizedGainLoss,
                  },
                  {
                    label: "Unrealized gains",
                    value: valuation.unrealizedGainLoss,
                  },
                  {
                    label: "Dividends & interest",
                    value: valuation.investmentIncome,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {item.value === null
                        ? "Unavailable"
                        : formatMoney(item.value, profile.baseCurrency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio growth */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Portfolio growth</h2>
              <p className="mt-1 text-sm text-slate-500">
                Historical snapshots in {profile.baseCurrency}. Capture once
                per day to build your chart.
              </p>
            </div>
            <form action={captureInvestmentSnapshot}>
              <button
                type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Capture today&apos;s snapshot
              </button>
            </form>
          </div>
          <PortfolioPerformanceChart
            data={valuation.snapshots}
            currency={profile.baseCurrency}
          />
        </section>

        {/* Current holdings */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Current holdings</h2>
              <p className="mt-1 text-sm text-slate-500">
                Recorded investment positions and their latest available
                valuations.
              </p>
            </div>
            <Link
              href="/admin/investments/assets"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Manage assets
            </Link>
          </div>
          {valuation.holdings.length === 0 ? (
            <p className="text-sm text-slate-500">
              No investment positions have been recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Asset</th>
                    <th className="pb-3 pr-4 text-right font-medium">
                      Quantity
                    </th>
                    <th className="pb-3 pr-4 text-right font-medium">
                      Unit price / value
                    </th>
                    <th className="pb-3 pr-4 text-right font-medium">
                      Market value
                    </th>
                    <th className="pb-3 font-medium">Price basis</th>
                  </tr>
                </thead>
                <tbody>
                  {valuation.holdings.map((holding) => (
                    <tr
                      key={holding.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <p className="font-medium">{holding.name}</p>
                        {holding.symbol ? (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {holding.symbol}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {holding.quantity.toLocaleString("en-US", {
                          maximumFractionDigits: 6,
                        })}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {holding.price === null
                          ? "—"
                          : formatMoney(holding.price, holding.currency)}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold tabular-nums">
                        {holding.value === null
                          ? "Needs price"
                          : formatMoney(holding.value, holding.currency)}
                      </td>
                      <td className="py-3 text-xs text-slate-500">
                        {holding.priceSource}
                        {holding.priceDate
                          ? ` · ${formatDate(holding.priceDate)}`
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {Object.entries(valuation.cashByCurrency).some(
            ([, value]) => Number(value) !== 0,
          ) ? (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm font-semibold">
                Cash balances reconstructed from transactions
              </p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(valuation.cashByCurrency).map(
                  ([currency, value]) => (
                    <span
                      key={currency}
                      className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      {formatMoney(Number(value), currency as "USD" | "GHS")}
                    </span>
                  ),
                )}
              </div>
            </div>
          ) : null}
        </section>

        {/* Valuation warnings */}
        {valuation.missingFxCurrencies.length > 0 ||
        valuation.unpricedAssets.length > 0 ||
        valuation.stalePrices.length > 0 ||
        valuation.staleFxCurrencies.length > 0 ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
            <h2 className="font-semibold">Valuation needs attention</h2>
            {valuation.missingFxCurrencies.length > 0 ? (
              <p className="mt-2">
                Missing exchange rates for:{" "}
                {valuation.missingFxCurrencies.join(", ")}. Those amounts are
                excluded from the converted portfolio total.
              </p>
            ) : null}
            {valuation.unpricedAssets.length > 0 ? (
              <p className="mt-2">
                Missing prices and cost basis:{" "}
                {valuation.unpricedAssets.join(", ")}.
              </p>
            ) : null}
            {valuation.stalePrices.length > 0 ? (
              <p className="mt-2">
                Prices older than seven days:{" "}
                {valuation.stalePrices.join(", ")}.
              </p>
            ) : null}
            {valuation.staleFxCurrencies.length > 0 ? (
              <p className="mt-2">
                Exchange rates older than seven days:{" "}
                {valuation.staleFxCurrencies.join(", ")}.
              </p>
            ) : null}
          </section>
        ) : null}

        {/* Accounts */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Investment accounts</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your connected and manually tracked investment accounts.
              </p>
            </div>

            <Link
              href="/admin/investments/accounts"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              View all
            </Link>
          </div>

          {accounts.length === 0 ? (
            <EmptyState
              title="No investment accounts yet"
              description="Add your first account to begin recording your investments."
              href="/admin/investments/accounts/new"
              action="Add your first account"
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {accounts.map((account) => (
                <Link
                  key={account.id}
                  href={`/admin/investments/accounts/${account.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg py-4 transition hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Landmark className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {account.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {formatLabel(account.provider)} · {formatLabel(account.type)}
                        {account.country ? ` · ${account.country}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {account.currency}
                    </span>
                    <span className="text-slate-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <Link
              href="/admin/investments/accounts/new"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              <Plus className="h-4 w-4" />
              Add investment account
            </Link>
          </div>
        </section>

        {/* Treasury bills */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Treasury bills
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Maturities, expected proceeds, and redemption tracking.
              </p>
            </div>

            <Link
              href="/admin/investments/treasury-bills"
              className="shrink-0 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
            >
              View all <span aria-hidden="true">→</span>
            </Link>
          </div>

          {activeTreasuryBills.length === 0 ? (
            <div className="p-5 sm:p-6">
              <EmptyState
                title="No active treasury bills"
                description="Record a treasury bill to track its purchase price, face value, yield, and maturity."
                href="/admin/investments/treasury-bills/new"
                action="Add treasury bill"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50/80">
                  <tr className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium sm:px-6">Investment</th>
                    <th className="px-4 py-3 font-medium">Purchase price</th>
                    <th className="px-4 py-3 font-medium">Face value</th>
                    <th className="px-4 py-3 font-medium">Maturity date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium sm:px-6">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {activeTreasuryBills.map((bill) => {
                    const overdue = bill.maturityDate < now;

                    return (
                      <tr
                        key={bill.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <p className="font-semibold text-slate-900">
                            {bill.asset.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {bill.asset.currency}
                            {bill.annualizedYield !== null
                              ? ` · ${(Number(bill.annualizedYield) * 100).toFixed(2)}% annual yield`
                              : ""}
                          </p>
                        </td>

                        <td className="px-4 py-4 font-medium tabular-nums text-slate-700">
                          {formatMoney(
                            bill.purchasePrice.toString(),
                            bill.asset.currency,
                          )}
                        </td>

                        <td className="px-4 py-4 font-medium tabular-nums text-slate-700">
                          {formatMoney(
                            bill.faceValue.toString(),
                            bill.asset.currency,
                          )}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {formatDate(bill.maturityDate)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              overdue
                                ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200"
                                : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                            }`}
                          >
                            <span
                              className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                                overdue ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            />
                            {overdue ? "Past maturity" : "Active"}
                          </span>
                        </td>

                        <td className="px-5 py-4 sm:px-6">
                          {["ACTIVE", "MATURED"].includes(bill.status) ? (
                            <RedeemBillForm
                              billId={bill.id}
                              currency={bill.asset.currency}
                            />
                          ) : (
                            <span className="text-xs text-slate-400">
                              No action
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent transactions */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Recent activity
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                The latest movements across your investment accounts.
              </p>
            </div>

            <Link
              href="/admin/investments/transactions"
              className="shrink-0 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
            >
              View all <span aria-hidden="true">→</span>
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-5 sm:p-6">
              <EmptyState
                title="No transactions recorded"
                description="Transactions will appear here as you add them or import statements."
                href="/admin/investments/transactions/new"
                action="Record a transaction"
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((transaction) => {
                const Icon = getTransactionIcon(transaction.type);

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50/70 sm:gap-4 sm:px-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {transaction.asset?.name ??
                          transaction.description ??
                          formatLabel(transaction.type)}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {transaction.account.name}
                        <span className="mx-1.5 text-slate-300">·</span>
                        {formatLabel(transaction.type)}
                        <span className="mx-1.5 text-slate-300">·</span>
                        {formatDate(transaction.occurredAt)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        {formatMoney(
                          transaction.amount.toString(),
                          transaction.currency,
                        )}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {transaction.currency}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Imports */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Statement imports
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Track imported investment statements and CSV files.
              </p>
            </div>

            <Link
              href="/admin/investments/imports"
              className="shrink-0 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
            >
              Manage imports <span aria-hidden="true">→</span>
            </Link>
          </div>

          {importBatches.length === 0 ? (
            <div className="px-5 py-6 sm:px-6">
              <p className="text-sm text-slate-500">
                No imports yet. Start with a CSV export from your investment provider.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {importBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                      <span className="text-xs font-bold">CSV</span>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {batch.fileName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(batch.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pl-[52px] sm:pl-0">
                    <span className="text-xs text-slate-500">
                      {batch.importedRows} imported
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">
                      {batch.skippedRows} skipped
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">
                      {batch.failedRows} failed
                    </span>
                    <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {formatLabel(batch.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-slate-400">
          Reporting currency: {profile.baseCurrency}. Security values use the
          latest recorded price, or average purchase cost when no price is
          recorded. Treasury-bill values use estimated straight-line accrual.
          Daily performance is adjusted for recorded external cash flows and
          requires snapshots on consecutive days.
        </p>
      </div>
    </main>
  );
}


function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        {description}
      </p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
      >
        {action}
      </Link>
    </div>
  );
}
