import prisma from "@/lib/prisma";

type CashFlow = { date: Date; amount: number };
type Snapshot = { snapshotDate: Date; totalValue: number };

export function xirr(flows: CashFlow[], guess = 0.1): number | null {
  if (flows.length < 2) return null;
  const dates = flows.map((f) => f.date.getTime());
  const first = dates[0];
  const npv = (rate: number) => flows.reduce((sum, f, i) => sum + f.amount / Math.pow(1 + rate, (dates[i] - first) / 31536000000), 0);
  let low = -0.9999, high = 10;
  let lowNpv = npv(low), highNpv = npv(high);
  let guard = 0;
  while (lowNpv * highNpv > 0 && guard++ < 20) { high *= 2; highNpv = npv(high); }
  if (lowNpv * highNpv > 0) return null;
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const value = npv(mid);
    if (Math.abs(value) < 0.000001) return mid;
    if (lowNpv * value <= 0) { high = mid; highNpv = value; } else { low = mid; lowNpv = value; }
  }
  return (low + high) / 2;
}

export function twr(snapshots: Snapshot[], cashFlows: CashFlow[]): number | null {
  if (snapshots.length < 2) return null;
  let linked = 1;
  for (let i = 1; i < snapshots.length; i++) {
    const start = snapshots[i - 1];
    const end = snapshots[i];
    if (start.totalValue <= 0) continue;
    const flow = cashFlows.filter((f) => f.date > start.snapshotDate && f.date <= end.snapshotDate).reduce((s, f) => s + f.amount, 0);
    linked *= (end.totalValue - flow) / start.totalValue;
  }
  return linked - 1;
}

export async function calculatePerformance(userId: string) {
  const [snapshots, transactions] = await Promise.all([
    prisma.investmentPortfolioSnapshot.findMany({ where: { userId, reportingCurrency: "USD" }, orderBy: { snapshotDate: "asc" }, take: 365 }),
    prisma.investmentTransaction.findMany({ where: { userId, currency: "USD", type: { in: ["CONTRIBUTION", "WITHDRAWAL", "TRANSFER_IN", "TRANSFER_OUT"] } }, orderBy: { transactionDate: "asc" }, select: { type: true, transactionDate: true, amountUSD: true, netAmount: true, grossAmount: true } }),
  ]);
  const normalizedSnapshots = snapshots.map((s) => ({ snapshotDate: s.capturedAt ?? s.snapshotDate, totalValue: Number(s.totalValue) }));
  const cashFlows = transactions.map((t) => { const amount = Math.abs(Number(t.amountUSD ?? t.netAmount ?? t.grossAmount ?? 0)); const inflow = t.type === "CONTRIBUTION" || t.type === "TRANSFER_IN"; return { date: t.transactionDate, amount: inflow ? amount : -amount }; });
  const latest = normalizedSnapshots.at(-1)?.totalValue ?? 0;
  const investorFlows = cashFlows.map((f) => ({ ...f, amount: -f.amount }));
  if (normalizedSnapshots.length) investorFlows.push({ date: normalizedSnapshots.at(-1)!.snapshotDate, amount: latest });
  return { snapshots: normalizedSnapshots, twr: twr(normalizedSnapshots, cashFlows), mwr: xirr(investorFlows) };
}
