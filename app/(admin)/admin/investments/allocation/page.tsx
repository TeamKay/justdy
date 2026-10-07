import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/investments/admin";
import AllocationTargets from "@/app/_components/investments/AllocationTargets";

export default async function AllocationPage() {
  const user = await requireAdminPage();

  const [rows, targets] = await Promise.all([
    prisma.investmentHolding.findMany({
      where: {
        userId: user.id,
        quantity: { gt: 0 },
      },
      include: {
        asset: {
          select: {
            assetType: true,
          },
        },
      },
    }),
    prisma.investmentAllocationTarget.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      orderBy: {
        assetType: "asc",
      },
    }),
  ]);

  const grouped = new Map<
    (typeof rows)[number]["asset"]["assetType"],
    number
  >();

  for (const row of rows) {
    if (row.currency !== "USD") {
      continue;
    }

    const current = grouped.get(row.asset.assetType) ?? 0;
    grouped.set(
      row.asset.assetType,
      current + Number(row.marketValue),
    );
  }

  const total = Array.from(grouped.values()).reduce(
    (sum, value) => sum + value,
    0,
  );

  const targetMap = new Map(
    targets.map((target) => [
      target.assetType,
      {
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
      },
    ]),
  );

  const types = Array.from(
    new Set([
      ...grouped.keys(),
      ...targets.map((target) => target.assetType),
    ]),
  ).sort();

  const data = types.map((type) => {
    const value = grouped.get(type) ?? 0;

    return {
      type,
      value,
      currentPct: total
        ? (value / total) * 100
        : 0,
      target: targetMap.get(type) ?? null,
    };
  });

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm text-muted-foreground">
          Portfolio composition
        </p>

        <h1 className="text-3xl font-semibold tracking-tight">
          Allocation
        </h1>

        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Set target ranges and compare them with your current USD portfolio
          allocation. Drift is shown in percentage points.
        </p>
      </div>

      <AllocationTargets
        rows={data}
        initialTargets={Array.from(targetMap.values())}
      />
    </div>
  );
}
