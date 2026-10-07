import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/lib/investments/admin";
import { refreshMarketData } from "@/lib/investments/market-data";
import { recalculateAllHoldings } from "@/lib/investments/engine";

export async function POST() {
  try {
    const user = await requireAdminApi();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const result = await refreshMarketData(
      user.id,
    );

    await recalculateAllHoldings(user.id);

    await prisma.investmentAuditLog.create({
      data: {
        userId: user.id,
        action: "MARKET_DATA_REFRESH",
        entityType: "InvestmentPrice",
        details: JSON.stringify(result),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to refresh market data.",
      },
      { status: 400 },
    );
  }
}
