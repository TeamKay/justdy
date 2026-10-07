import { createHash } from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/lib/investments/admin";
import { recalculateHolding } from "@/lib/investments/engine";

export async function POST(request: Request) {
  const user = await requireAdminApi(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await request.json();
  if (!b.accountId || !b.type || !b.transactionDate || !b.currency) return NextResponse.json({ error: "Account, type, date and currency are required." }, { status: 400 });
  const account = await prisma.investmentAccount.findFirst({ where: { id: b.accountId, userId: user.id } }); if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (b.assetId) { const asset = await prisma.investmentAsset.findFirst({ where: { id: b.assetId, userId: user.id } }); if (!asset) return NextResponse.json({ error: "Asset not found." }, { status: 404 }); }
  const fingerprint = createHash("sha256").update(JSON.stringify({ userId: user.id, accountId: b.accountId, assetId: b.assetId ?? null, type: b.type, transactionDate: b.transactionDate, quantity: b.quantity ?? null, grossAmount: b.grossAmount ?? null, netAmount: b.netAmount ?? null })).digest("hex");
  try {
    const tx = await prisma.investmentTransaction.create({ data: { userId: user.id, accountId: b.accountId, assetId: b.assetId || null, type: b.type, transactionDate: new Date(b.transactionDate), settlementDate: b.settlementDate ? new Date(b.settlementDate) : null, quantity: b.quantity == null || b.quantity === "" ? null : String(b.quantity), price: b.price == null || b.price === "" ? null : String(b.price), grossAmount: b.grossAmount == null || b.grossAmount === "" ? null : String(b.grossAmount), netAmount: b.netAmount == null || b.netAmount === "" ? null : String(b.netAmount), fees: String(b.fees ?? 0), taxes: String(b.taxes ?? 0), currency: b.currency, fingerprint, source: "MANUAL", importStatus: "IMPORTED", notes: b.notes ? String(b.notes).trim() : null } });
    if (b.assetId) await recalculateHolding(user.id, b.accountId, b.assetId);
    await prisma.investmentAuditLog.create({ data: { userId: user.id, action: "CREATE", entityType: "InvestmentTransaction", entityId: tx.id, details: { type: b.type, accountId: b.accountId, assetId: b.assetId ?? null } } });
    return NextResponse.json(tx, { status: 201 });
  } catch (error) { if (String(error).includes("Unique constraint")) return NextResponse.json({ error: "This transaction already exists." }, { status: 409 }); throw error; }
}
