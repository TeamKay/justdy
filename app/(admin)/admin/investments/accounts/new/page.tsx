import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin/investments/accounts"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to accounts
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium text-blue-700">
            INVESTMENT ACCOUNTS
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Add an account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Set up an account before recording its transactions or holdings.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <InvestmentAccountForm />
        </section>
      </div>
    </main>
  );
}