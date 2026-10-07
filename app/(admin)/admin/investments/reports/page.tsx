import { FileUp, ShieldCheck } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/investments/admin";
import ImportWizard from "@/app/_components/investments/ImportWizard";

export default async function InvestmentReportsPage() {
  const user = await requireAdminPage();
  const [accounts, reports] = await Promise.all([
    prisma.investmentAccount.findMany({ where: { userId: user.id, isActive: true }, orderBy: { institution: "asc" } }),
    prisma.investmentReport.findMany({ where: { userId: user.id }, orderBy: { uploadedAt: "desc" }, take: 10 }),
  ]);
  const accountLabels = accounts.map(a => ({ id: a.id, label: `${a.institution} ••••${a.accountNumber.slice(-4)}` }));

  return <div className="space-y-8 p-6 lg:p-8">
    <div><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><FileUp className="h-5 w-5 text-primary"/></div><div><h1 className="text-2xl font-semibold tracking-tight">Reports & imports</h1><p className="text-sm text-muted-foreground">Bring brokerage or investment statements into your portfolio without committing unreviewed data.</p></div></div></div>
    <section className="rounded-2xl border bg-card p-5 shadow-sm"><div className="mb-5 flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-primary"/><div><h2 className="font-semibold">Safe import workflow</h2><p className="text-sm text-muted-foreground">Files are parsed and previewed first. Duplicate fingerprints are rejected automatically when transactions are committed.</p></div></div>{accountLabels.length ? <ImportWizard accounts={accountLabels}/> : <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Create an investment account before importing a statement.</p>}</section>
    <section className="rounded-2xl border bg-card shadow-sm"><div className="border-b px-5 py-4"><h2 className="font-semibold">Recent import batches</h2></div><div className="divide-y">{reports.length ? reports.map(r => <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-medium">{r.fileName}</p><p className="text-xs text-muted-foreground">{r.uploadedAt.toLocaleString()} · {r.transactionCount} rows</p></div><div className="text-right text-xs"><p className="font-semibold">{r.importStatus}</p><p className="text-muted-foreground">{r.importedCount} imported · {r.duplicateCount} duplicates · {r.rejectedCount} rejected</p></div></div>) : <p className="p-8 text-center text-sm text-muted-foreground">No imports yet.</p>}</div></section>
  </div>;
}
