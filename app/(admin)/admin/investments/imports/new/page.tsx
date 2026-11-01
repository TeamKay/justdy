
import Link from "next/link";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";
import { importFidelityTransactions } from "../actions";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900";

export default async function NewInvestmentImportPage({
  searchParams,
}: PageProps) {
  let owner;

  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    redirect("/admin");
  }

  const { error } = await searchParams;

  const profile = await prisma.investmentProfile.findUnique({
    where: { userId: owner.id },
    select: { id: true },
  });

  if (!profile) redirect("/admin/investments");

  const accounts = await prisma.investmentAccount.findMany({
    where: {
      profileId: profile.id,
      provider: "FIDELITY",
      isActive: true,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      currency: true,
    },
  });

  const messages: Record<string, string> = {
    file: "Select a CSV file to upload.",
    format: "Only CSV files up to 5 MB are supported.",
    account: "Select a valid Fidelity investment account.",
    provider: "This importer currently supports Fidelity accounts only.",
    csv: "The CSV file could not be read.",
    columns: "This file does not have the expected Fidelity transaction columns.",
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          href="/admin/investments/imports"
          className="text-sm font-medium text-blue-600"
        >
          ← Import history
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          Upload investment transactions
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Import transactions from a Fidelity account-history CSV export.
        </p>
      </div>

      {error && messages[error] && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {messages[error]}
        </div>
      )}

      {accounts.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-700">
            No active Fidelity accounts found. Create a Fidelity investment
            account before importing transactions.
          </p>
          <Link
            href="/admin/investments/accounts/new"
            className="mt-4 inline-block text-sm font-semibold text-blue-600"
          >
            Create Fidelity account →
          </Link>
        </section>
      ) : (
        <form
          action={importFidelityTransactions}
          encType="multipart/form-data"
          className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-slate-700">
              Destination account *
            </label>
            <select
              id="accountId"
              name="accountId"
              required
              className={inputClass}
              defaultValue=""
            >
              <option value="" disabled>
                Select a Fidelity account
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-slate-700">
              Fidelity account history CSV *
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className={`${inputClass} file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700`}
            />
            <p className="mt-2 text-xs text-slate-500">
              Upload the Fidelity Account History export. Maximum file size: 5 MB.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Before importing</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Export the transaction history from Fidelity as CSV.</li>
              <li>Select the matching investment account.</li>
              <li>Repeated uploads will skip transactions already imported.</li>
              <li>Portfolio positions CSV files are not accepted here.</li>
            </ul>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/investments/imports"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Upload and import transactions
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
