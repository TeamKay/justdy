import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/lib/investments/admin";

export async function GET() {
  const user = await requireAdminApi(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accounts = await prisma.investmentAccount.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { _count: { select: { holdings: true, transactions: true } } } });
  return NextResponse.json(accounts.map(a => ({ ...a, accountNumber: a.accountNumber.slice(-4), masked: true })));
}

export async function POST(request: Request) {
  const user = await requireAdminApi(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const institution = String(body.institution ?? "").trim(); const accountNumber = String(body.accountNumber ?? "").trim();
  if (!institution || !accountNumber) return NextResponse.json({ error: "Institution and account number are required." }, { status: 400 });
  const account = await prisma.investmentAccount.create({ data: { userId: user.id, institution, accountNumber, accountName: body.accountName ? String(body.accountName).trim() : null, accountType: body.accountType ?? "BROKERAGE", currency: body.currency ?? "USD", country: body.country ? String(body.country).trim() : null } });
  await prisma.investmentAuditLog.create({ data: { userId: user.id, action: "CREATE", entityType: "InvestmentAccount", entityId: account.id, details: { institution, accountLast4: accountNumber.slice(-4) } } });
  return NextResponse.json({ ...account, accountNumber: account.accountNumber.slice(-4), masked: true }, { status: 201 });
}
