import prisma from "@/lib/prisma";

export default async function RevenueCard({
  educatorId,
}: {
  educatorId: string;
}) {
  // Aggregate payouts
  const payouts = await prisma.payout.aggregate({
    where: { educatorId, status: "Paid" },
    _sum: { netAmount: true },
  });

  const pendingPayouts = await prisma.payout.aggregate({
    where: { educatorId, status: "Processing" },
    _sum: { netAmount: true },
  });

  const totalPaidInCents = payouts._sum.netAmount || 0;
  const pendingInCents = pendingPayouts._sum.netAmount || 0;

  return (
    <div className="p-5 border rounded-xl bg-card text-card-foreground shadow-sm h-full">
      <h3 className="font-semibold text-lg mb-4">Earnings Overview</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-muted/50 border">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Total Paid Out
          </p>
          <p className="text-2xl font-bold mt-1">
            ${(totalPaidInCents / 100).toFixed(2)}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Processing Payouts
          </p>
          <p className="text-2xl font-bold mt-1 text-amber-600">
            ${(pendingInCents / 100).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
