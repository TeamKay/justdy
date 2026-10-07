import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/lib/investments/admin";

const ALLOWED_ASSET_TYPES = [
  "STOCK",
  "ETF",
  "MUTUAL_FUND",
  "BOND",
  "TREASURY_BILL",
  "TREASURY_NOTE",
  "TREASURY_BOND",
  "CASH",
  "MONEY_MARKET",
  "REIT",
  "CRYPTO",
  "REAL_ESTATE",
  "OTHER",
] as const;

type InvestmentAssetTypeValue = (typeof ALLOWED_ASSET_TYPES)[number];

function isInvestmentAssetType(
  value: string,
): value is InvestmentAssetTypeValue {
  return ALLOWED_ASSET_TYPES.includes(
    value as InvestmentAssetTypeValue,
  );
}

export async function GET() {
  const user = await requireAdminApi();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const targets =
    await prisma.investmentAllocationTarget.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      orderBy: {
        assetType: "asc",
      },
    });

  return NextResponse.json(
    targets.map((target) => ({
      ...target,
      targetPct: Number(target.targetPct),
      minPct:
        target.minPct == null
          ? null
          : Number(target.minPct),
      maxPct:
        target.maxPct == null
          ? null
          : Number(target.maxPct),
    })),
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminApi();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const assetTypeValue = String(
      body.assetType ?? "",
    )
      .trim()
      .toUpperCase();

    if (!isInvestmentAssetType(assetTypeValue)) {
      return NextResponse.json(
        { error: "Invalid asset type." },
        { status: 400 },
      );
    }

    const assetType = assetTypeValue;

    const targetPct = Number(body.targetPct);

    const minPct =
      body.minPct === "" || body.minPct == null
        ? null
        : Number(body.minPct);

    const maxPct =
      body.maxPct === "" || body.maxPct == null
        ? null
        : Number(body.maxPct);

    if (
      !Number.isFinite(targetPct) ||
      targetPct < 0 ||
      targetPct > 100
    ) {
      return NextResponse.json(
        { error: "Target must be between 0 and 100%." },
        { status: 400 },
      );
    }

    if (
      minPct != null &&
      (!Number.isFinite(minPct) ||
        minPct < 0 ||
        minPct > 100)
    ) {
      return NextResponse.json(
        { error: "Minimum must be between 0 and 100%." },
        { status: 400 },
      );
    }

    if (
      maxPct != null &&
      (!Number.isFinite(maxPct) ||
        maxPct < 0 ||
        maxPct > 100)
    ) {
      return NextResponse.json(
        { error: "Maximum must be between 0 and 100%." },
        { status: 400 },
      );
    }

    if (
      minPct != null &&
      maxPct != null &&
      minPct > maxPct
    ) {
      return NextResponse.json(
        { error: "Minimum cannot exceed maximum." },
        { status: 400 },
      );
    }

    const existing =
      await prisma.investmentAllocationTarget.findMany({
        where: {
          userId: user.id,
          active: true,
          NOT: {
            assetType,
          },
        },
        select: {
          targetPct: true,
        },
      });

    const targetTotal =
      existing.reduce(
        (sum, row) => sum + Number(row.targetPct),
        0,
      ) + targetPct;

    if (targetTotal > 100.0001) {
      return NextResponse.json(
        {
          error: `Active allocation targets total ${targetTotal.toFixed(
            2,
          )}%. Targets cannot exceed 100%.`,
        },
        { status: 400 },
      );
    }

    if (minPct != null && minPct > targetPct) {
      return NextResponse.json(
        { error: "Minimum cannot exceed the target." },
        { status: 400 },
      );
    }

    if (maxPct != null && maxPct < targetPct) {
      return NextResponse.json(
        { error: "Maximum cannot be below the target." },
        { status: 400 },
      );
    }

    const target =
      await prisma.investmentAllocationTarget.upsert({
        where: {
          userId_assetType: {
            userId: user.id,
            assetType,
          },
        },
        update: {
          targetPct,
          minPct,
          maxPct,
          active: true,
        },
        create: {
          userId: user.id,
          assetType,
          targetPct,
          minPct,
          maxPct,
        },
      });

    await prisma.investmentAuditLog.create({
      data: {
        userId: user.id,
        action: "UPSERT_ALLOCATION_TARGET",
        entityType: "InvestmentAllocationTarget",
        entityId: target.id,
        details: JSON.stringify({
          assetType,
          targetPct,
          minPct,
          maxPct,
        }),
      },
    });

    return NextResponse.json(target);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save allocation target.",
      },
      { status: 400 },
    );
  }
}
