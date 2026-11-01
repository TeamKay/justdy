import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Landmark,
  Plus,
} from "lucide-react";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";

export const dynamic = "force-dynamic";

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function InvestmentAccountsPage() {
  let owner;

  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/admin");
  }

  const profile = await prisma.investmentProfile.upsert({
    where: { userId: owner.id },
    update: {},
    create: { userId: owner.id },
    select: { id: true },
  });

  const accounts = await prisma.investmentAccount.findMany({
    where: { profileId: profile.id },
    orderBy: [
      { isActive: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      name: true,
      provider: true,
      type: true,
      currency: true,
      country: true,
      notes: true,
      isActive: true,
      createdAt: true,
      lastSyncedAt: true,
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  const activeCount = accounts.filter((account) => account.isActive).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">
              PORTFOLIO SETTINGS
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Investment accounts
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Organize your Fidelity, Ghanaian investment, and cash accounts.
            </p>
          </div>

          <Link
            href="/admin/investments/accounts/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            Add account
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Total accounts" value={accounts.length} />
          <SummaryCard label="Active accounts" value={activeCount} />
          <SummaryCard
            label="Recorded transactions"
            value={accounts.reduce(
              (total, account) => total + account._count.transactions,
              0,
            )}
          />
        </section>

        {accounts.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Landmark className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No accounts yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Create your first investment account to begin organizing
              transactions and holdings.
            </p>

            <Link
              href="/admin/investments/accounts/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              <Plus className="h-4 w-4" />
              Create your first account
            </Link>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Landmark className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-slate-900">
                          {account.name}
                        </h2>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            account.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {account.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatLabel(account.provider)} ·{" "}
                        {formatLabel(account.type)}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {account.country} · {account.currency} ·{" "}
                        {account._count.transactions} transaction
                        {account._count.transactions === 1 ? "" : "s"}
                      </p>

                      {account.notes && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
                          {account.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <p className="text-xs text-slate-400">
                      Added{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(account.createdAt)}
                    </p>

                    <span
                      className="inline-flex items-center gap-1 text-sm font-medium text-slate-400"
                      aria-label="Account details page will be added in a later phase"
                      title="Account details will be added in a later phase"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <Link
          href="/admin/investments"
          className="inline-flex text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          ← Back to investments overview
        </Link>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {value.toLocaleString("en-US")}
      </p>
    </div>
  );
}