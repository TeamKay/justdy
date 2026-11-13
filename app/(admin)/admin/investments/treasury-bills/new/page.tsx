
import Link from "next/link";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";

import TreasuryBillForm from "./treasury-bill-form";

export default async function NewTreasuryBillPage() {
  let owner;

  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return null;
    }

    return null;
  }

  const profile = await prisma.investmentProfile.findUnique({
    where: { userId: owner.id },
    select: { id: true },
  });

  const accounts = profile
    ? await prisma.investmentAccount.findMany({
        where: {
          profileId: profile.id,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          currency: true,
        },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <Link
          href="/admin/investments/treasury-bills"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Back to Treasury bills
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          Add Treasury bill
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Record a Treasury bill purchase and track its maturity and return.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <TreasuryBillForm accounts={accounts} />
      </div>
    </div>
  );
}
