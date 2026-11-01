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

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";

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
  if (["SELL", "DIVIDEND", "INTEREST", "WITHDRAWAL", "TRANSFER_OUT"].includes(type)) {
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

  // A profile is created only for the authenticated owner.
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
    transactionCount,
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

    prisma.investmentTransaction.count({
      where: {
        account: {
          profileId: profile.id,
        },
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

  const upcomingBills = activeTreasuryBills.filter(
    (bill) => bill.maturityDate >= now,
  );

  const overdueBills = activeTreasuryBills.filter(
    (bill) => bill.maturityDate < now,
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

          <Link
            href="/admin/investments/accounts/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            Add account
          </Link>
          <Link href="/admin/investments/imports">
            Investment imports
          </Link>
        </header>

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Investment accounts"
            value={String(accounts.length)}
            description="Active accounts"
            icon={Landmark}
          />

          <SummaryCard
            title="Recorded transactions"
            value={transactionCount.toLocaleString("en-US")}
            description="Across your accounts"
            icon={ReceiptText}
          />

          <SummaryCard
            title="Upcoming maturities"
            value={String(upcomingBills.length)}
            description="Active bills not yet due"
            icon={CalendarClock}
          />

          <SummaryCard
            title="Needs attention"
            value={String(overdueBills.length)}
            description="Active bills past maturity"
            icon={PiggyBank}
          />
        </section>

        {/* Accounts */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Your accounts</h2>
              <p className="mt-1 text-sm text-slate-500">
                Fidelity, Ghana investments, and other tracked accounts.
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
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <Link
                  key={account.id}
                  href={`/admin/investments/accounts/${account.id}`}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Landmark className="h-5 w-5" />
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {account.currency}
                    </span>
                  </div>

                  <h3 className="mt-4 font-semibold">{account.name}</h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatLabel(account.provider)} ·{" "}
                    {formatLabel(account.type)}
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    {account.country}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Treasury bills */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Treasury bills</h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep track of maturity dates and expected proceeds.
              </p>
            </div>

            <Link
              href="/admin/investments/treasury-bills"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              View all
            </Link>
          </div>

          {activeTreasuryBills.length === 0 ? (
            <EmptyState
              title="No active treasury bills"
              description="Record a treasury bill to track its purchase price, face value, yield, and maturity."
              href="/admin/investments/treasury-bills/new"
              action="Add treasury bill"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Investment</th>
                    <th className="pb-3 pr-4 font-medium">Purchase price</th>
                    <th className="pb-3 pr-4 font-medium">Face value</th>
                    <th className="pb-3 pr-4 font-medium">Maturity</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {activeTreasuryBills.map((bill) => {
                    const overdue = bill.maturityDate < now;

                    return (
                      <tr
                        key={bill.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-4 pr-4">
                          <p className="font-medium">{bill.asset.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {bill.asset.currency}
                            {bill.annualizedYield !== null
                              ? ` · ${(Number(bill.annualizedYield) * 100).toFixed(2)}% yield`
                              : ""}
                          </p>
                        </td>

                        <td className="py-4 pr-4">
                          {formatMoney(
                            bill.purchasePrice.toString(),
                            bill.asset.currency,
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          {formatMoney(
                            bill.faceValue.toString(),
                            bill.asset.currency,
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          {formatDate(bill.maturityDate)}
                        </td>

                        <td className="py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              overdue
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {overdue ? "Past maturity" : "Active"}
                          </span>
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
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Recent transactions</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your latest recorded investment activity.
              </p>
            </div>

            <Link
              href="/admin/investments/transactions"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              View all
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <EmptyState
              title="No transactions recorded"
              description="Transactions will appear here as you add them or import statements."
              href="/admin/investments/transactions/new"
              action="Record a transaction"
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((transaction) => {
                const Icon = getTransactionIcon(transaction.type);

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {transaction.asset?.name ??
                          transaction.description ??
                          formatLabel(transaction.type)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {transaction.account.name} ·{" "}
                        {formatLabel(transaction.type)} ·{" "}
                        {formatDate(transaction.occurredAt)}
                      </p>
                    </div>

                    <p className="shrink-0 text-right text-sm font-semibold">
                      {formatMoney(
                        transaction.amount.toString(),
                        transaction.currency,
                      )}
                      <span className="mt-1 block text-xs font-normal text-slate-400">
                        {transaction.currency}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Imports */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Statement imports</h2>
              <p className="mt-1 text-sm text-slate-500">
                Recent CSV and statement-import activity.
              </p>
            </div>

            <Link
              href="/admin/investments/imports"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Manage imports
            </Link>
          </div>

          {importBatches.length === 0 ? (
            <p className="text-sm text-slate-500">
              No imports yet. You can start with a CSV export from your
              investment provider.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {importBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {batch.fileName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(batch.createdAt)} · {batch.importedRows}{" "}
                      imported · {batch.skippedRows} skipped ·{" "}
                      {batch.failedRows} failed
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {formatLabel(batch.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-slate-400">
          Reporting currency: {profile.baseCurrency}. Portfolio valuations and
          performance reporting will be enabled after asset pricing and
          exchange-rate calculations are implemented.
        </p>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <Icon className="h-5 w-5 text-blue-700" />
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
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
    <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {description}
      </p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
      >
        <Plus className="h-4 w-4" />
        {action}
      </Link>
    </div>
  );
}