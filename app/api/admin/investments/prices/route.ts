import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/lib/investments/admin";
import { recalculateHolding } from "@/lib/investments/engine";

export async function GET() {
  const user = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const assets = await prisma.investmentAsset.findMany({
    where: { userId: user.id, active: true },
    orderBy: [{ name: "asc" }],
    include: { prices: { orderBy: { asOf: "desc" }, take: 1 }, holdings: { select: { id: true, accountId: true } } },
  });
  return NextResponse.json(assets.map(a => ({
    id: a.id, name: a.name, symbol: a.symbol ?? a.tickerOrSymbol, currency: a.currency,
    latest: a.prices[0] ? { price: a.prices[0].price.toString(), asOf: a.prices[0].asOf, source: a.prices[0].source } : null,
    holdingCount: a.holdings.length,
  })));
}

export async function POST(request: Request) {
  const user = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { assetId?: string; price?: number | string; currency?: "USD" | "GHS"; asOf?: string } | null;
  if (!body?.assetId || body.price == null) return NextResponse.json({ error: "assetId and price are required." }, { status: 400 });
  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "Price must be a non-negative number." }, { status: 400 });
  const asset = await prisma.investmentAsset.findFirst({ where: { id: body.assetId, userId: user.id, active: true } });
  if (!asset) return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  const asOf = body.asOf ? new Date(body.asOf) : new Date();
  if (Number.isNaN(asOf.getTime())) return NextResponse.json({ error: "Invalid price date." }, { status: 400 });
  const currency = body.currency ?? asset.currency;
  const row = await prisma.investmentPrice.upsert({
    where: { assetId_asOf: { assetId: asset.id, asOf } },
    create: { userId: user.id, assetId: asset.id, price: price.toString(), currency, asOf, source: "MANUAL", isRealtime: false },
    update: { price: price.toString(), currency, source: "MANUAL", isRealtime: false },
  });
  const holdings = await prisma.investmentHolding.findMany({ where: { userId: user.id, assetId: asset.id }, select: { accountId: true } });
  for (const holding of holdings) await recalculateHolding(user.id, holding.accountId, asset.id);
  await prisma.investmentAuditLog.create({ data: { userId: user.id, action: "PRICE_UPDATED", entityType: "InvestmentPrice", entityId: row.id, details: { assetId: asset.id, price, currency, source: "MANUAL", asOf: asOf.toISOString() } } });
  return NextResponse.json({ id: row.id, price: row.price.toString(), asOf: row.asOf });
}
