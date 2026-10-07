import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/investments/admin";
import { recalculateAllHoldings } from "@/lib/investments/engine";
export async function POST() { const user = await requireAdminApi(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const count = await recalculateAllHoldings(user.id); return NextResponse.json({ recalculated: count }); }
