import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Landmark } from "lucide-react";

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
      notes: true,
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">Investments</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Investment accounts
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage the accounts you use to track your investments.
          </p>
        </div>

        <Link
          href="/admin/investments/accounts/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add account
        </Link>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Landmark className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No investment accounts yet
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Add an account to start tracking your investments.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-100">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {account.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatLabel(account.provider)} · {formatLabel(account.type)}
                  </p>
                  {account.notes && (
                    <p className="mt-1 text-sm text-slate-500">
                      {account.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                    {account.currency}
                  </span>
                  <span className="text-sm text-slate-500">
                    {account.country}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
