import Link from "next/link";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/investments/admin";

const money = (n: number, c = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 2,
  }).format(n);

export default async function HoldingsPage() {
  const user = await requireAdminPage();

  const holdings = await prisma.investmentHolding.findMany({
    where: {
      userId: user.id,
      quantity: {
        gt: 0,
      },
    },
    include: {
      asset: {
        select: {
          name: true,
          symbol: true,
          assetType: true,
          region: true,
        },
      },
      account: {
        select: {
          institution: true,
          accountName: true,
        },
      },
    },
    orderBy: {
      marketValue: "desc",
    },
  });

  const total = holdings
    .filter((h) => h.currency === "USD")
    .reduce((sum, h) => sum + Number(h.marketValue), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">
            Current positions
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Holdings
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Live from your normalized transaction ledger and latest stored
            prices.
          </p>
        </div>

        <Link
          href="/admin/investments/transactions"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Add transaction
        </Link>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="text-xs font-medium text-muted-foreground">
          USD invested value
        </div>

        <div className="mt-1 text-3xl font-semibold">
          {money(total)}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="hidden grid-cols-[1.5fr_.8fr_.8fr_.8fr_1fr] gap-4 border-b px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
          <span>Asset</span>
          <span>Quantity</span>
          <span>Price</span>
          <span>Gain</span>
          <span>Market value</span>
        </div>

        <div className="divide-y">
          {holdings.map((h) => {
            const gain = Number(h.unrealizedGain);

            return (
              <div
                key={h.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[1.5fr_.8fr_.8fr_.8fr_1fr] md:items-center"
              >
                <div>
                  <div className="font-medium">{h.asset.name}</div>

                  <div className="text-xs text-muted-foreground">
                    {h.asset.symbol || "—"} ·{" "}
                    {h.account.accountName || h.account.institution}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground md:hidden">
                    Quantity
                  </div>

                  <span className="text-sm">
                    {Number(h.quantity).toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}
                  </span>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground md:hidden">
                    Price
                  </div>

                  <span className="text-sm">
                    {h.currentPrice == null
                      ? "—"
                      : money(Number(h.currentPrice), h.currency)}
                  </span>
                </div>

                <div
                  className={
                    gain >= 0
                      ? "text-sm text-emerald-600"
                      : "text-sm text-red-600"
                  }
                >
                  <div className="text-xs text-muted-foreground md:hidden">
                    Unrealized gain
                  </div>

                  {gain >= 0 ? "+" : ""}
                  {money(gain, h.currency)}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground md:hidden">
                      Market value
                    </div>

                    <span className="text-sm font-semibold">
                      {money(Number(h.marketValue), h.currency)}
                    </span>
                  </div>

                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            );
          })}

          {!holdings.length && (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
              </div>

              <h2 className="mt-4 font-semibold">
                No holdings yet
              </h2>

              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Add an asset, record a BUY transaction, and store a price to
                turn the transaction into a valued position.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}