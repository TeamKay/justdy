"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";

type Mapping = Record<string, string | undefined>;
type Preview = { headers: string[]; suggestedMapping: Mapping; previewRows: Record<string,string>[]; rowCount: number; fileName: string };

const fields = [
  ["date", "Date *"], ["type", "Transaction type *"], ["symbol", "Symbol"], ["name", "Security name"], ["quantity", "Quantity"],
  ["price", "Price"], ["grossAmount", "Gross amount"], ["fees", "Fees"], ["taxes", "Taxes"], ["netAmount", "Net amount"], ["currency", "Currency"], ["notes", "Notes"],
];

export default function ImportWizard({ accounts }: { accounts: { id: string; label: string }[] }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canImport = useMemo(() => Boolean(file && accountId && mapping.date && mapping.type), [file, accountId, mapping]);

  async function previewFile() {
    if (!file || !accountId) return;
    setLoading(true); setError(null); setMessage(null);
    const form = new FormData(); form.append("file", file); form.append("accountId", accountId);
    const response = await fetch("/api/admin/investments/import/preview", { method: "POST", body: form });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "Unable to preview file.");
    setPreview(data); setMapping(data.suggestedMapping ?? {});
  }

  async function commit() {
    if (!file || !accountId || !mapping.date || !mapping.type) return;
    setLoading(true); setError(null); setMessage(null);
    const form = new FormData(); form.append("file", file); form.append("accountId", accountId); form.append("mapping", JSON.stringify(mapping));
    const response = await fetch("/api/admin/investments/import/commit", { method: "POST", body: form });
    const data = await response.json(); setLoading(false);
    if (!response.ok) return setError(data.error ?? "Import failed.");
    setMessage(`Imported ${data.importedCount} transactions. ${data.duplicateCount} duplicates and ${data.rejectedCount} rejected.`);
    setPreview(null); setFile(null);
  }

  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
      <label className="space-y-2 text-sm font-medium">Account<select value={accountId} onChange={e => setAccountId(e.target.value)} className="mt-1 h-11 w-full rounded-xl border bg-background px-3">{accounts.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</select></label>
      <label className="space-y-2 text-sm font-medium">Statement file<div className="mt-1 flex h-11 items-center gap-2 rounded-xl border px-3"><FileSpreadsheet className="h-4 w-4"/><input type="file" accept=".csv,.xlsx,.xls" onChange={e => setFile(e.target.files?.[0] ?? null)} className="min-w-0 text-sm"/></div></label>
      <button disabled={!file || loading} onClick={previewFile} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <UploadCloud className="h-4 w-4"/>} Preview</button>
    </div>

    {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
    {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700">{message}</div>}

    {preview && <>
      <div className="flex items-center justify-between border-b pb-4"><div><h3 className="font-semibold">Map your columns</h3><p className="text-sm text-muted-foreground">{preview.fileName} · {preview.rowCount.toLocaleString()} rows detected</p></div><button disabled={!canImport || loading} onClick={commit} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="h-4 w-4"/>} Import transactions</button></div>
      <div className="grid gap-3 md:grid-cols-3">
        {fields.map(([key,label]) => <label key={key} className="text-sm font-medium">{label}<select value={mapping[key] ?? ""} onChange={e => setMapping(m => ({...m, [key]: e.target.value || undefined}))} className="mt-1 h-10 w-full rounded-lg border bg-background px-2 text-sm"><option value="">Not mapped</option>{preview.headers.map(h => <option key={h} value={h}>{h}</option>)}</select></label>)}
      </div>
      <div className="overflow-auto rounded-xl border"><table className="w-full text-left text-xs"><thead className="bg-muted/50"><tr>{preview.headers.map(h => <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">{h}</th>)}</tr></thead><tbody>{preview.previewRows.map((row,i) => <tr key={i} className="border-t">{preview.headers.map(h => <td key={h} className="max-w-48 truncate whitespace-nowrap px-3 py-2">{row[h]}</td>)}</tr>)}</tbody></table></div>
    </>}
  </div>;
}
