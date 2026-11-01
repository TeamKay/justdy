import Link from "next/link";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";

export default async function InvestmentTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  let owner;

  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      redirect("/login");
    }

    redirect("/admin");
  }

  const params = await searchParams;

  const profile = await prisma.investmentProfile.findUnique({
    where: { userId: owner.id },
    select: { id: true },
  });

  if (!profile) {
    redirect("/admin/investments");
  }

  const transactions = await prisma.investmentTransaction.findMany({
    where: {
      account: {
        profileId: profile.id,
      },
    },
    include: {
      account: {
        select: {
          name: true,
          provider: true,
        },
      },
      asset: {
        select: {
          name: true,
          symbol: true,
        },
      },
    },
    orderBy: [
      { occurredAt: "desc" },
      { createdAt: "desc" },
    ],
    take: 100,
  });

  function formatAmount(amount: string, currency: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  }

  function formatType(type: string) {
    const labels: Record<string, string> = {
      CONTRIBUTION: "Contribution",
      DEPOSIT: "Deposit",
      BUY: "Purchase",
      SELL: "Sale",
      DIVIDEND: "Dividend",
      INTEREST: "Interest",
      FEE: "Fee",
      WITHDRAWAL: "Withdrawal",
      TRANSFER_IN: "Transfer in",
      TRANSFER_OUT: "Transfer out",
      MATURITY: "Treasury bill maturity",
      REINVESTMENT: "Reinvestment",
      ADJUSTMENT: "Adjustment",
    };

    return labels[type] ?? type;
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/investments"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Investment dashboard
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Investment transactions
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Review purchases, sales, contributions, income, fees, and
            other investment activities.
          </p>
        </div>

        <Link
          href="/admin/investments/transactions/new"
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
        >
          + Record transaction
        </Link>
      </div>

      {params.created === "1" && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          Transaction recorded successfully.
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Recent activity
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Showing the latest {transactions.length} transactions,
            with a maximum of 100.
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <h3 className="font-semibold text-slate-900">
              No transactions yet
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Record your first transaction to start building your
              investment history.
            </p>
            <Link
              href="/admin/investments/transactions/new"
              className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Record your first transaction
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Transaction</th>
                  <th className="px-5 py-3 font-medium">Institution / account</th>
                  <th className="px-5 py-3 font-medium">Investment</th>
                  <th className="px-5 py-3 text-right font-medium">Quantity</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                      }).format(transaction.occurredAt)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {formatType(transaction.type)}
                      </p>
                      {transaction.description && (
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {transaction.description}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {transaction.account.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {transaction.account.provider}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {transaction.asset ? (
                        <>
                          <p>{transaction.asset.name}</p>
                          {transaction.asset.symbol && (
                            <p className="mt-1 text-xs text-slate-500">
                              {transaction.asset.symbol}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400">
                          Account-level activity
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                      {transaction.quantity?.toString() ?? "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-slate-900">
                      {formatAmount(
                        transaction.amount.toString(),
                        transaction.currency,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}