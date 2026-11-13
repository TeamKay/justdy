import { redirect } from "next/navigation";
import Link from "next/link";
import { FileSpreadsheet, ArrowLeft } from "lucide-react";
import StatementUpload from "./statement-upload";
import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";

export const dynamic = "force-dynamic";

export default async function InvestmentImportsPage() {
  let owner;

  try {
    owner = await authorizeInvestmentOwner();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    if (
      error instanceof Error &&
      ["FORBIDDEN", "INVESTMENT_OWNER_NOT_CONFIGURED"].includes(error.message)
    ) {
      redirect("/admin");
    }

    throw error;
  }

  const profile = await prisma.investmentProfile.upsert({
    where: { userId: owner.id },
    update: {},
    create: { userId: owner.id },
    select: { id: true },
  });

  const [accounts, batches] = await Promise.all([
    prisma.investmentAccount.findMany({
      where: {
        profileId: profile.id,
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        provider: true,
        currency: true,
      },
    }),

    prisma.investmentImportBatch.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        fileName: true,
        source: true,
        status: true,
        totalRows: true,
        importedRows: true,
        skippedRows: true,
        failedRows: true,
        createdAt: true,
        completedAt: true,
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <Link
            href="/admin/investments"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to investments
          </Link>

          <div className="mt-5">
            <p className="text-sm font-medium text-blue-700">
              PORTFOLIO MANAGEMENT
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Statement imports
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Import investment transactions from CSV and Excel statements.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Upload investment statement</h2>
              <p className="text-sm text-slate-500">
               Upload a statement and review its transactions before importing.
              </p>
            </div>
          </div>

          {accounts.length === 0 ? (
            <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              You need to create an investment account before importing
              transactions.
            </p>
          ) : (
            <StatementUpload accounts={accounts} />
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="font-semibold">Import history</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your previous statement imports and their results.
            </p>
          </div>

          {batches.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-500">
              No statements have been imported yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">File</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Imported</th>
                    <th className="px-4 py-3 font-medium">Skipped</th>
                    <th className="px-4 py-3 font-medium">Failed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((batch) => (
                    <tr key={batch.id}>
                      <td className="px-6 py-4">
                        <p className="font-medium">
                          {batch.fileName || "Unnamed file"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {batch.source}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {batch.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        {batch.status.replaceAll("_", " ")}
                      </td>
                      <td className="px-4 py-4 tabular-nums">
                        {batch.importedRows}
                      </td>
                      <td className="px-4 py-4 tabular-nums">
                        {batch.skippedRows}
                      </td>
                      <td className="px-4 py-4 tabular-nums">
                        {batch.failedRows}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
