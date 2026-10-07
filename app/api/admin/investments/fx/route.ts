import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/lib/investments/admin";

export async function GET() {
  const user = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.investmentFXRate.findMany({ where: { userId: user.id }, orderBy: { asOf: "desc" }, take: 20 });
  return NextResponse.json(rows.map(r => ({ id:r.id, base:r.base, quote:r.quote, rate:r.rate.toString(), asOf:r.asOf, source:r.source })));
}

export async function POST(request: Request) {
  const user = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { base?: "USD"|"GHS"; quote?: "USD"|"GHS"; rate?: number|string; asOf?: string } | null;
  if (!body?.base || !body?.quote || body.rate == null) return NextResponse.json({ error: "base, quote and rate are required." }, { status: 400 });
  if (body.base === body.quote) return NextResponse.json({ error: "Base and quote currencies must differ." }, { status: 400 });
  const rate = Number(body.rate);
  if (!Number.isFinite(rate) || rate <= 0) return NextResponse.json({ error: "FX rate must be greater than zero." }, { status: 400 });
  const asOf = body.asOf ? new Date(body.asOf) : new Date();
  if (Number.isNaN(asOf.getTime())) return NextResponse.json({ error: "Invalid FX date." }, { status: 400 });
  const row = await prisma.investmentFXRate.upsert({ where: { userId_base_quote_asOf: { userId:user.id, base:body.base, quote:body.quote, asOf } }, create: { userId:user.id, base:body.base, quote:body.quote, rate:rate.toString(), asOf, source:"MANUAL" }, update:{ rate:rate.toString(), source:"MANUAL" } });
  await prisma.investmentAuditLog.create({ data:{ userId:user.id, action:"FX_RATE_UPDATED", entityType:"InvestmentFXRate", entityId:row.id, details:{ base:body.base, quote:body.quote, rate, source:"MANUAL", asOf:asOf.toISOString() } } });
  return NextResponse.json({ id:row.id, rate:row.rate.toString(), asOf:row.asOf });
}
