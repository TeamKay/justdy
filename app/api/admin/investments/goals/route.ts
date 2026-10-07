import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/lib/investments/admin";

export async function GET() {
  const user = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const goals = await prisma.investmentGoal.findMany({ where: { userId: user.id }, orderBy: [{ isActive: "desc" }, { targetDate: "asc" }] });
  return NextResponse.json(goals.map((g) => ({ ...g, targetAmount: g.targetAmount.toString(), startingAmount: g.startingAmount.toString(), expectedAnnualReturn: g.expectedAnnualReturn?.toString() ?? null })));
}

export async function POST(request: Request) {
  const user = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const targetAmount = Number(body?.targetAmount);
  const startingAmount = Number(body?.startingAmount ?? 0);
  const targetDate = typeof body?.targetDate === "string" ? new Date(body.targetDate) : null;
  const currency = body?.currency === "GHS" ? "GHS" : "USD";
  const expectedAnnualReturn = body?.expectedAnnualReturn === "" || body?.expectedAnnualReturn == null ? null : Number(body.expectedAnnualReturn);
  if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0 || !targetDate || Number.isNaN(targetDate.getTime()) || targetDate <= new Date()) return NextResponse.json({ error: "Name, positive target amount and a future target date are required." }, { status: 400 });
  if (!Number.isFinite(startingAmount) || startingAmount < 0 || (expectedAnnualReturn !== null && (!Number.isFinite(expectedAnnualReturn) || expectedAnnualReturn < -100 || expectedAnnualReturn > 100))) return NextResponse.json({ error: "Invalid starting amount or expected return." }, { status: 400 });
  const goal = await prisma.investmentGoal.create({ data: { userId: user.id, name, targetAmount: targetAmount.toString(), startingAmount: startingAmount.toString(), currency, targetDate, expectedAnnualReturn: expectedAnnualReturn?.toString(), notes: typeof body?.notes === "string" ? body.notes.trim() || null : null } });
  await prisma.investmentAuditLog.create({ data: { userId: user.id, action: "CREATE", entityType: "InvestmentGoal", entityId: goal.id, details: { name, targetAmount, currency, targetDate: targetDate.toISOString() } } });
  return NextResponse.json({ id: goal.id }, { status: 201 });
}
