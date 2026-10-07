import prisma from "@/lib/prisma";

type Tx = {
  type: string; quantity: number | null; price: number | null; grossAmount: number | null; netAmount: number | null; fees: number; taxes: number;
};

export async function recalculateHolding(userId: string, accountId: string, assetId: string) {
  const transactions = await prisma.investmentTransaction.findMany({
    where: { userId, accountId, assetId },
    orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
    select: { type: true, quantity: true, price: true, grossAmount: true, netAmount: true, fees: true, taxes: true },
  });
  let quantity = 0, costBasis = 0, realizedGain = 0, incomeReceived = 0;
  for (const raw of transactions) {
    const tx: Tx = { ...raw, quantity: raw.quantity == null ? null : Number(raw.quantity), price: raw.price == null ? null : Number(raw.price), grossAmount: raw.grossAmount == null ? null : Number(raw.grossAmount), netAmount: raw.netAmount == null ? null : Number(raw.netAmount), fees: Number(raw.fees), taxes: Number(raw.taxes) };
    const amount = Math.abs(tx.netAmount ?? tx.grossAmount ?? ((tx.quantity ?? 0) * (tx.price ?? 0)));
    if (tx.type === "BUY" || tx.type === "DRIP") { const q = tx.quantity ?? 0; quantity += q; costBasis += amount + tx.fees + tx.taxes; }
    else if (tx.type === "SELL") { const q = Math.min(Math.max(tx.quantity ?? 0, 0), quantity); const avg = quantity > 0 ? costBasis / quantity : 0; const allocated = avg * q; quantity -= q; costBasis = Math.max(0, costBasis - allocated); realizedGain += amount - tx.fees - tx.taxes - allocated; }
    else if (tx.type === "DIVIDEND" || tx.type === "INTEREST") incomeReceived += amount;
  }
  const latest = await prisma.investmentPrice.findFirst({ where: { userId, assetId }, orderBy: { asOf: "desc" }, select: { price: true, asOf: true } });
  const currentPrice = latest ? Number(latest.price) : null;
  const marketValue = currentPrice == null ? 0 : quantity * currentPrice;
  const unrealizedGain = marketValue - costBasis;
  const unrealizedGainPct = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : null;
  const asset = await prisma.investmentAsset.findUnique({ where: { id: assetId }, select: { currency: true } });
  if (!asset) throw new Error("Asset not found");
  return prisma.investmentHolding.upsert({
    where: { accountId_assetId: { accountId, assetId } },
    create: { userId, accountId, assetId, quantity: quantity.toString(), averageCost: quantity > 0 ? (costBasis / quantity).toString() : null, costBasis: costBasis.toString(), currentPrice: currentPrice?.toString(), marketValue: marketValue.toString(), realizedGain: realizedGain.toString(), unrealizedGain: unrealizedGain.toString(), unrealizedGainPct: unrealizedGainPct?.toString(), incomeReceived: incomeReceived.toString(), currency: asset.currency, marketValueUSD: asset.currency === "USD" ? marketValue.toString() : null, marketValueGHS: asset.currency === "GHS" ? marketValue.toString() : null, lastPriceAt: latest?.asOf },
    update: { quantity: quantity.toString(), averageCost: quantity > 0 ? (costBasis / quantity).toString() : null, costBasis: costBasis.toString(), currentPrice: currentPrice?.toString(), marketValue: marketValue.toString(), realizedGain: realizedGain.toString(), unrealizedGain: unrealizedGain.toString(), unrealizedGainPct: unrealizedGainPct?.toString(), incomeReceived: incomeReceived.toString(), currency: asset.currency, marketValueUSD: asset.currency === "USD" ? marketValue.toString() : null, marketValueGHS: asset.currency === "GHS" ? marketValue.toString() : null, lastPriceAt: latest?.asOf, lastCalculatedAt: new Date() },
  });
}

export async function recalculateAllHoldings(userId: string) {
  const pairs = await prisma.investmentTransaction.findMany({ where: { userId, assetId: { not: null } }, distinct: ["accountId", "assetId"], select: { accountId: true, assetId: true } });
  for (const pair of pairs) if (pair.assetId) await recalculateHolding(userId, pair.accountId, pair.assetId);
  return pairs.length;
}
