import { redirect } from "next/navigation";

import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";
import InvestmentAccountForm from "./account-form";

export const dynamic = "force-dynamic";

export default async function NewInvestmentAccountPage() {
  try {
    await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/admin");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-700">
          Investments
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Add investment account
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Add an account to track its holdings, transactions, and performance.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <InvestmentAccountForm />
      </div>
    </div>
  );
}
