import Link from "next/link";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";

type PageProps = {
  searchParams: Promise<{ created?: string }>;
};

const assetTypeLabels: Record<string, string> = {
  STOCK: "Stock",
  ETF: "ETF",
  MUTUAL_FUND: "Mutual fund",
  TREASURY_BILL: "Treasury bill",
  CASH: "Cash",
  OTHER: "Other",
};

export default async function InvestmentAssetsPage({
  searchParams,
}: PageProps) {
  let owner;

  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/admin");
  }

  const { created } = await searchParams;

  const profile = await prisma.investmentProfile.findUnique({
    where: { userId: owner.id },
    select: { id: true },
  });

  if (!profile) {
    redirect("/admin/investments?error=profile");
  }

  const assets = await prisma.investmentAsset.findMany({
    where: { profileId: profile.id },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/investments"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Investment dashboard
          </Link>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            Investments
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Manage the individual assets held across your investment accounts.
          </p>
        </div>

        <Link
          href="/admin/investments/assets/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add investment
        </Link>
      </div>

      {created === "1" && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          Investment created successfully.
        </div>
      )}

      {assets.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No investments registered yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Add your first stock, ETF, mutual fund, Treasury bill, or other
            asset. You can then link transactions to it.
          </p>
          <Link
            href="/admin/investments/assets/new"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add your first investment
          </Link>
        </section>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Total investments" value={assets.length} />
            <SummaryCard
              label="Active investments"
              value={assets.filter((asset) => asset.isActive).length}
            />
            <SummaryCard
              label="Linked transactions"
              value={assets.reduce(
                (total, asset) => total + asset._count.transactions,
                0,
              )}
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Investment</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Currency</th>
                    <th className="px-4 py-3 font-semibold">Market</th>
                    <th className="px-4 py-3 font-semibold">Transactions</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">
                          {asset.name}
                        </p>
                        {asset.symbol && (
                          <p className="mt-1 text-xs text-slate-500">
                            {asset.symbol}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {assetTypeLabels[asset.assetType] ?? asset.assetType}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {asset.currency}
                      </td>

                      <td className="px-4 py-4 text-slate-700">
                        {asset.exchange || "—"}
                      </td>

                      <td className="px-4 py-4 text-slate-700">
                        {asset._count.transactions}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={
                            asset.isActive
                              ? "inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                              : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                          }
                        >
                          {asset.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </section>
  );
}