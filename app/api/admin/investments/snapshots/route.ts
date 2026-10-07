import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/lib/investments/admin";

function dayStart() { const d = new Date(); d.setHours(0,0,0,0); return d; }

export async function GET() {
  const user = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.investmentPortfolioSnapshot.findMany({ where: { userId: user.id, reportingCurrency: "USD" }, orderBy: { snapshotDate: "asc" }, take: 365 });
  return NextResponse.json(rows.map(r => ({ id:r.id, snapshotDate:r.snapshotDate, capturedAt:r.capturedAt, totalValue:r.totalValue.toString(), costBasis:r.costBasis.toString(), unrealizedGain:r.unrealizedGain.toString(), contributions:r.contributions.toString(), withdrawals:r.withdrawals.toString() })));
}

export async function POST() {
  const user = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [holdings, transactions] = await Promise.all([
    prisma.investmentHolding.findMany({ where: { userId: user.id }, select: { marketValueUSD: true, marketValue: true, currency: true, costBasis: true, realizedGain: true, unrealizedGain: true, incomeReceived: true } }),
    prisma.investmentTransaction.findMany({ where: { userId: user.id, transactionDate: { lte: new Date() } }, select: { type: true, transactionDate: true, amountUSD: true, currency: true, netAmount: true, fees: true, taxes: true } }),
  ]);
  const totalValue = holdings.reduce((s,h)=>s + Number(h.currency === "USD" ? h.marketValueUSD ?? h.marketValue : 0),0);
  const costBasis = holdings.reduce((s,h)=>s + Number(h.currency === "USD" ? h.costBasis : 0),0);
  const realizedGain = holdings.reduce((s,h)=>s + Number(h.currency === "USD" ? h.realizedGain : 0),0);
  const unrealizedGain = holdings.reduce((s,h)=>s + Number(h.currency === "USD" ? h.unrealizedGain : 0),0);
  const income = holdings.reduce((s,h)=>s + Number(h.currency === "USD" ? h.incomeReceived : 0),0);
  const snapshotDate = dayStart();
  const snapshotCapturedAt = new Date();
  const previousSnapshot = await prisma.investmentPortfolioSnapshot.findFirst({
    where: {
      userId: user.id,
      reportingCurrency: "USD",
      snapshotDate: { lt: snapshotDate },
    },
    orderBy: { snapshotDate: "desc" },
    select: { snapshotDate: true },
  });
  const flowStart = previousSnapshot?.snapshotDate ?? new Date(0);
  const periodTransactions = transactions.filter((t) => t.transactionDate > flowStart && t.transactionDate <= snapshotCapturedAt);
  const periodContributions = periodTransactions
    .filter((t) => ["CONTRIBUTION", "TRANSFER_IN"].includes(t.type))
    .reduce((s, t) => s + Number(t.amountUSD ?? t.netAmount ?? 0), 0);
  const periodWithdrawals = periodTransactions
    .filter((t) => ["WITHDRAWAL", "TRANSFER_OUT"].includes(t.type))
    .reduce((s, t) => s + Math.abs(Number(t.amountUSD ?? t.netAmount ?? 0)), 0);
  const periodFeesTaxes = periodTransactions
    .reduce((s, t) => s + Number(t.currency === "USD" ? t.fees : 0) + Number(t.currency === "USD" ? t.taxes : 0), 0);
  const row = await prisma.investmentPortfolioSnapshot.upsert({ where: { userId_snapshotDate_reportingCurrency: { userId: user.id, snapshotDate, reportingCurrency: "USD" } }, create: { userId:user.id, snapshotDate, capturedAt:snapshotCapturedAt, reportingCurrency:"USD", totalValue:totalValue.toString(), investedValue:totalValue.toString(), costBasis:costBasis.toString(), realizedGain:realizedGain.toString(), unrealizedGain:unrealizedGain.toString(), dividendsAndInterest:income.toString(), feesAndTaxes:periodFeesTaxes.toString(), contributions:periodContributions.toString(), withdrawals:periodWithdrawals.toString() }, update: { capturedAt:snapshotCapturedAt, totalValue:totalValue.toString(), investedValue:totalValue.toString(), costBasis:costBasis.toString(), realizedGain:realizedGain.toString(), unrealizedGain:unrealizedGain.toString(), dividendsAndInterest:income.toString(), feesAndTaxes:periodFeesTaxes.toString(), contributions:periodContributions.toString(), withdrawals:periodWithdrawals.toString() } });
  await prisma.investmentAuditLog.create({ data: { userId:user.id, action:"SNAPSHOT_CREATED", entityType:"InvestmentPortfolioSnapshot", entityId:row.id, details:{ reportingCurrency:"USD", snapshotDate:row.snapshotDate.toISOString() } } });
  return NextResponse.json({ id:row.id, snapshotDate:row.snapshotDate });
}
