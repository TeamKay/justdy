import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { refreshUsMarketPricesForProfile } from "@/lib/investments/refresh-us-market-prices";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerEmail = process.env.INVESTMENT_OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail) {
    return NextResponse.json({ error: "INVESTMENT_OWNER_EMAIL is not configured" }, { status: 503 });
  }

  const owner = await prisma.user.findFirst({
    where: { email: { equals: ownerEmail, mode: "insensitive" }, emailVerified: true },
    select: { investmentProfile: { select: { id: true } } },
  });
  const profileId = owner?.investmentProfile?.id;
  if (!profileId) {
    return NextResponse.json({ error: "Investment owner profile not found" }, { status: 404 });
  }

  const result = await refreshUsMarketPricesForProfile(profileId);
  return NextResponse.json({ ok: result.failures.length === 0, ...result });
}
