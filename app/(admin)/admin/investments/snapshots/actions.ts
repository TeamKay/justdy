
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";
import { calculatePortfolioValuation } from "@/lib/investments/portfolio-valuation";

export async function captureInvestmentSnapshot() {
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
    select: { id: true, baseCurrency: true },
  });

  if (!profile) redirect("/admin/investments?error=profile");

  const valuation = await calculatePortfolioValuation(
    profile.id,
    profile.baseCurrency,
  );

  const now = new Date();

  const snapshotDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    ),
  );

  const previousSnapshot =
    await prisma.investmentPortfolioSnapshot.findFirst({
      where: {
        profileId: profile.id,
        baseCurrency: profile.baseCurrency,
        snapshotDate: { lt: snapshotDate },
      },
      orderBy: { snapshotDate: "desc" },
      select: {
        snapshotDate: true,
        metadata: true,
      },
    });

  const previousMetadata = previousSnapshot?.metadata as
    | { capturedAt?: string }
    | null;

  const previousCapturedAt = previousMetadata?.capturedAt
    ? new Date(previousMetadata.capturedAt)
    : previousSnapshot
      ? new Date(previousSnapshot.snapshotDate.getTime() + 86400000)
      : null;

  const externalFlowsSincePreviousSnapshot = previousCapturedAt
    ? valuation.externalFlows
        .filter((flow) => flow.date > previousCapturedAt)
        .map((flow) => ({
          date: flow.date.toISOString(),
          amount: flow.amount,
          currency: flow.currency,
        }))
    : [];

  await prisma.investmentPortfolioSnapshot.createMany({
    skipDuplicates: true,
    data: [
      {
        profileId: profile.id,
        snapshotDate,
        baseCurrency: profile.baseCurrency,
        totalValue: valuation.totalValue.toString(),

        accountValues: {
          cashByCurrency: valuation.cashByCurrency,
          currencyValues: valuation.currencyValues,
          holdings: valuation.holdings.map((holding) => ({
            assetId: holding.id,
            name: holding.name,
            quantity: holding.quantity,
            value: holding.value,
            currency: holding.currency,
            estimated: holding.estimated,
          })),
        },

        metadata: {
          capturedAt: now.toISOString(),
          missingFxCurrencies: valuation.missingFxCurrencies,
          unpricedAssets: valuation.unpricedAssets,
          estimatedHoldingCount: valuation.estimatedHoldingCount,
          externalFlowsSincePreviousSnapshot,

          performance: {
            realizedGainLoss: valuation.realizedGainLoss,
            unrealizedGainLoss: valuation.unrealizedGainLoss,
            totalGainLoss: valuation.totalGainLoss,
            investmentIncome: valuation.investmentIncome,
            totalInvestmentReturn: valuation.totalInvestmentReturn,
          },
        },
      },
    ],
  });

  revalidatePath("/admin/investments");
  redirect("/admin/investments?snapshot=1");
}
