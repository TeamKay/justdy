
import Link from "next/link";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { authorizeInvestmentOwner } from "@/lib/investments/authorize-investment-owner";

type PageProps = {
  searchParams: Promise<{
    imported?: string;
    skipped?: string;
    failed?: string;
  }>;
};

const statusStyles: Record<string, string> = {
  PROCESSING: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  PARTIAL: "bg-amber-50 text-amber-700",
  FAILED: "bg-red-50 text-red-700",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ResultCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default async function InvestmentImportsPage({
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

  const params = await searchParams;

  const profile = await prisma.investmentProfile.findUnique({
    where: { userId: owner.id },
    select: { id: true },
  });

  if (!profile) {
    redirect("/admin/investments?error=profile");
  }

  const batches = await prisma.investmentImportBatch.findMany({
    where: {
      profileId: profile.id,
    },
    include: {
      account: {
        select: {
          name: true,
          provider: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  const totals = batches.reduce(
    (result, batch) => ({
      imported: result.imported + batch.importedRows,
      skipped: result.skipped + batch.skippedRows,
      failed: result.failed + batch.failedRows,
    }),
    { imported: 0, skipped: 0, failed: 0 },
  );

  const imported = Number(params.imported ?? 0);
  const skipped = Number(params.skipped ?? 0);
  const failed = Number(params.failed ?? 0);

  const hasImportResult =
    params.imported !== undefined ||
    params.skipped !== undefined ||
    params.failed !== undefined;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          href="/admin/investments"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Investment dashboard
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Investment imports
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Upload transaction statements and review your import history.
            </p>
          </div>

          <Link
            href="/admin/investments/imports/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Upload CSV
          </Link>
        </div>
      </div>

      {hasImportResult && (
        <section
          role="status"
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <h2 className="font-semibold text-slate-900">
            Latest import results
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ResultCard label="Imported" value={imported} />
            <ResultCard label="Skipped" value={skipped} />
            <ResultCard label="Failed" value={failed} />
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <ResultCard label="Imported transactions" value={totals.imported} />
        <ResultCard label="Skipped rows" value={totals.skipped} />
        <ResultCard label="Failed rows" value={totals.failed} />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Recent import history
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your 50 most recent import batches.
          </p>
        </div>

        {batches.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="font-semibold text-slate-900">
              No imports yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Upload your first investment transaction CSV to get started.
            </p>
            <Link
              href="/admin/investments/imports/new"
              className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Upload your first CSV
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">File</th>
                  <th className="px-4 py-3 font-semibold">Account</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Imported</th>
                  <th className="px-4 py-3 font-semibold">Skipped</th>
                  <th className="px-4 py-3 font-semibold">Failed</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50">
                    <td className="max-w-56 px-4 py-4">
                      <p className="truncate font-medium text-slate-900">
                        {batch.fileName || "Unnamed file"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {batch.source}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                      {batch.account?.name || "Account not specified"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {formatDate(batch.createdAt)}
                    </td>

                    <td className="px-4 py-4 font-medium text-green-700">
                      {batch.importedRows}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {batch.skippedRows}
                    </td>

                    <td className="px-4 py-4 text-red-600">
                      {batch.failedRows}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusStyles[batch.status] ??
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
