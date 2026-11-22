"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";

type CampaignKind = "BULK" | "INDIVIDUAL";

type Campaign = {
  id: string;
  kind: CampaignKind;
  individualRecipientEmail?: string | null;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  fromName: string | null;
  replyTo: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: { recipients: number };
};

type AudienceBreakdown = {
  notSubscribed: number;
  unsubscribed: number;
  suppressed: number;
  invalidEmail: number;
  missingOrWithdrawnConsent: number;
  accountNotEligible: number;
  individualRecipientIneligible?: number;
};

type Audience = {
  totalContacts: number;
  eligibleCount: number;
  excludedCount: number;
  breakdown: AudienceBreakdown;
  recipient?: {
    id?: string;
    email: string;
    name?: string | null;
    eligible: boolean;
  };
};

type CampaignForm = {
  kind: CampaignKind;
  individualRecipientEmail: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  fromName: string;
  replyTo: string;
};

const emptyForm: CampaignForm = {
  kind: "BULK",
  individualRecipientEmail: "",
  name: "",
  subject: "",
  htmlContent: "",
  textContent: "",
  fromName: "Justdy",
  replyTo: "",
};

const statusStyles: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  QUEUED: "border-blue-200 bg-blue-50 text-blue-700",
  SENDING: "border-amber-200 bg-amber-50 text-amber-700",
  SENT: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PARTIALLY_SENT: "border-orange-200 bg-orange-50 text-orange-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-500",
};

async function readResponse(response: Response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "The request could not be completed.");
  }
  return result;
}

async function fetchCampaigns(): Promise<Campaign[]> {
  const response = await fetch(
    "/api/admin/marketing/campaigns?page=1&pageSize=100",
    { credentials: "include", cache: "no-store" },
  );
  const result = await readResponse(response);
  return result.campaigns ?? [];
}

export default function MarketingCenterClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [pendingSend, setPendingSend] = useState<Campaign | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Campaign | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadCampaigns = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError("");
    try {
      setCampaigns(await fetchCampaigns());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load campaigns.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchCampaigns()
      .then((items) => {
        if (active) setCampaigns(items);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load campaigns.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredCampaigns = useMemo(() => {
    const term = search.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !term ||
        campaign.name.toLowerCase().includes(term) ||
        campaign.subject.toLowerCase().includes(term) ||
        (campaign.individualRecipientEmail ?? "").toLowerCase().includes(term);
      const matchesStatus = statusFilter === "ALL" || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, statusFilter]);

  const selectedCampaign = campaigns.find((item) => item.id === selectedId) ?? null;

  function updateField<K extends keyof CampaignForm>(field: K, value: CampaignForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startNewCampaign() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setSelectedId(null);
    setAudience(null);
    setError("");
    setSuccess("");
  }

  function startEditing(campaign: Campaign) {
    if (campaign.status !== "DRAFT") {
      setError("Only draft campaigns can be edited.");
      return;
    }
    setEditingId(campaign.id);
    setForm({
      kind: campaign.kind,
      individualRecipientEmail: campaign.individualRecipientEmail ?? "",
      name: campaign.name,
      subject: campaign.subject,
      htmlContent: campaign.htmlContent,
      textContent: campaign.textContent ?? "",
      fromName: campaign.fromName ?? "Justdy",
      replyTo: campaign.replyTo ?? "",
    });
    setShowForm(true);
    setSelectedId(null);
    setAudience(null);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      individualRecipientEmail:
        form.kind === "INDIVIDUAL" ? form.individualRecipientEmail.trim() : undefined,
      textContent: form.textContent || null,
      fromName: form.fromName || null,
      replyTo: form.replyTo || null,
    };

    try {
      const response = await fetch(
        editingId ? `/api/admin/marketing/campaigns/${editingId}` : "/api/admin/marketing/campaigns",
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      await readResponse(response);
      closeForm();
      setSuccess(editingId ? "Your draft has been updated." : "Your campaign draft has been created.");
      await loadCampaigns(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the campaign.");
    } finally {
      setSaving(false);
    }
  }

  async function getAudience(campaign: Campaign): Promise<Audience> {
    const response = await fetch(`/api/admin/marketing/campaigns/${campaign.id}/audience`, {
      credentials: "include",
      cache: "no-store",
    });
    const result = await readResponse(response);
    return result.audience as Audience;
  }

  async function previewAudience(campaign: Campaign) {
    setSelectedId(campaign.id);
    setAudience(null);
    setPreviewing(true);
    setError("");
    try {
      setAudience(await getAudience(campaign));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to preview the audience.");
    } finally {
      setPreviewing(false);
    }
  }

  async function beginSend(campaign: Campaign) {
    if (campaign.status !== "DRAFT") return;
    setError("");
    setSuccess("");
    setPreviewing(true);
    try {
      const latestAudience = await getAudience(campaign);
      setAudience(latestAudience);
      setSelectedId(campaign.id);
      if (latestAudience.eligibleCount < 1) {
        setError(
          campaign.kind === "INDIVIDUAL"
            ? "This recipient is not currently eligible. Confirm their subscription and consent before sending."
            : "There are no eligible, consented subscribers in this audience.",
        );
        return;
      }
      setPendingSend(campaign);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify the campaign audience.");
    } finally {
      setPreviewing(false);
    }
  }

  async function confirmSend() {
    if (!pendingSend || sending) return;
    setSending(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/marketing/campaigns/${pendingSend.id}/send`, {
        method: "POST",
        credentials: "include",
      });
      const result = await readResponse(response);
      setPendingSend(null);
      setSuccess(
        result.message
          ? `${result.message} Check campaign status for processing updates.`
          : "The campaign dispatch request was accepted. Emails are queued for processing; this does not confirm delivery.",
      );
      await loadCampaigns(false);
      if (selectedId === pendingSend.id) {
        try {
          setAudience(await getAudience(pendingSend));
        } catch {
          // The audience preview endpoint is draft-only; the campaign may no longer be a draft.
          setAudience(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit this campaign.");
    } finally {
      setSending(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/marketing/campaigns/${pendingDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await readResponse(response);
      if (selectedId === pendingDelete.id) {
        setSelectedId(null);
        setAudience(null);
      }
      setPendingDelete(null);
      setSuccess("Draft campaign deleted.");
      await loadCampaigns(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete the campaign.");
    } finally {
      setDeleting(false);
    }
  }

  const draftCount = campaigns.filter((item) => item.status === "DRAFT").length;
  const queuedCount = campaigns.filter((item) => item.status === "QUEUED" || item.status === "SENDING").length;
  const sentCount = campaigns.filter((item) => item.status === "SENT").length;

  return (
    <main className="min-h-full bg-[#F5F8F5] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-360 space-y-6">
        <header className="relative overflow-hidden rounded-lg px-0 py-0 text-black sm:px-0">
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Manage Bulk Messaging</h1>
            </div>
            <div className="relative flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadCampaigns()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={startNewCampaign}
                className="inline-flex items-center gap-2 rounded-lg bg-[#8c9112] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4" />
                New campaign
              </button>
            </div>
          </div>
        </header>

        {error && <Notice tone="error" onClose={() => setError("")}>{error}</Notice>}
        {success && <Notice tone="success" onClose={() => setSuccess("")}>{success}</Notice>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<FileText className="h-5 w-5" />} label="Total campaigns" value={campaigns.length} note="Campaigns in your workspace" />
          <MetricCard icon={<Pencil className="h-5 w-5" />} label="Drafts" value={draftCount} note="Saved and awaiting review" />
          <MetricCard icon={<Clock3 className="h-5 w-5" />} label="In progress" value={queuedCount} note="Queued or currently processing" />
          <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Completed" value={sentCount} note="Marked as successfully sent" />
        </section>

        {showForm && (
          <section className="overflow-hidden rounded-2xl border border-[#E1E9E2] bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">{editingId ? "Campaign editor" : "New campaign"}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{editingId ? "Edit campaign draft" : "Build an email campaign"}</h2>
                <p className="mt-1 text-sm text-slate-500">Your changes are saved as a draft. Nothing is sent until you review and confirm.</p>
              </div>
              <button type="button" onClick={closeForm} aria-label="Close form" className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={saveCampaign} className="space-y-6 px-5 py-6 sm:px-7">
              <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Campaign name" hint="An internal name to help you identify this campaign.">
                  <input required maxLength={160} value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. December learning newsletter" className="studio-input" />
                </Field>
                <Field label="Campaign type">
                  <select
                    value={form.kind}
                    onChange={(e) => {
                      const kind = e.target.value as CampaignKind;
                      updateField("kind", kind);
                      if (kind === "BULK") updateField("individualRecipientEmail", "");
                    }}
                    className="studio-input"
                  >
                    <option value="BULK">Bulk · eligible subscribers</option>
                    <option value="INDIVIDUAL">Individual · one existing contact</option>
                  </select>
                </Field>
                {form.kind === "INDIVIDUAL" && (
                  <div className="lg:col-span-2">
                    <Field label="Recipient email" hint="Only an existing subscribed contact with valid marketing consent can receive this email. Arbitrary addresses are not accepted.">
                      <input required type="email" maxLength={254} value={form.individualRecipientEmail} onChange={(e) => updateField("individualRecipientEmail", e.target.value)} placeholder="learner@example.com" className="studio-input" />
                    </Field>
                  </div>
                )}
                <Field label="Email subject">
                  <input required maxLength={200} value={form.subject} onChange={(e) => updateField("subject", e.target.value)} placeholder="A useful subject your learners will recognize" className="studio-input" />
                </Field>
                <Field label="Sender name">
                  <input maxLength={120} value={form.fromName} onChange={(e) => updateField("fromName", e.target.value)} placeholder="Justdy" className="studio-input" />
                </Field>
                <Field label="Reply-to email" hint="Optional address for replies.">
                  <input type="email" value={form.replyTo} onChange={(e) => updateField("replyTo", e.target.value)} placeholder="support@yourdomain.com" className="studio-input" />
                </Field>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <Field label="HTML email content" hint="The formatted email content sent to supported email clients.">
                  <textarea required rows={14} maxLength={500000} value={form.htmlContent} onChange={(e) => updateField("htmlContent", e.target.value)} placeholder="<h1>Hello from Justdy</h1>" className="studio-input min-h-[280px] font-mono text-xs leading-5" />
                </Field>
                <Field label="Plain-text email content" hint="Optional text alternative for email clients that do not display HTML.">
                  <textarea rows={14} maxLength={500000} value={form.textContent} onChange={(e) => updateField("textContent", e.target.value)} placeholder="Hello from Justdy..." className="studio-input min-h-[280px] font-mono text-xs leading-5" />
                </Field>
              </div>

              <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                <p className="text-xs leading-5 text-slate-500">Consent and suppression checks are performed again when the campaign is processed.</p>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#245C43] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#194832] disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {saving ? "Saving..." : editingId ? "Save changes" : "Save draft"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-[#E1E9E2] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Campaigns</h2>
              <p className="mt-1 text-sm text-slate-500">Review drafts and track the status of campaigns submitted for processing.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaigns..." className="studio-input !pl-9 sm:w-64" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="studio-input sm:w-44">
                <option value="ALL">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="QUEUED">Queued</option>
                <option value="SENDING">Sending</option>
                <option value="SENT">Sent</option>
                <option value="PARTIALLY_SENT">Partially sent</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" /> Loading campaigns...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Mail className="h-7 w-7" /></div>
              <h3 className="mt-4 font-bold text-slate-900">{campaigns.length ? "No matching campaigns" : "Your campaign workspace is ready"}</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{campaigns.length ? "Try a different search term or status filter." : "Create your first draft to start communicating with your Justdy audience."}</p>
              {!campaigns.length && <button type="button" onClick={startNewCampaign} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#245C43] px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Create campaign</button>}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Campaign</th>
                      <th className="px-4 py-3.5">Audience</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Recipients</th>
                      <th className="px-4 py-3.5">Last updated</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="transition hover:bg-[#F8FBF8]">
                        <td className="max-w-[340px] px-6 py-4">
                          <p className="truncate font-semibold text-slate-900">{campaign.name}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{campaign.subject}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{campaign.kind === "BULK" ? "Bulk audience" : "Individual"}</span>
                          {campaign.kind === "INDIVIDUAL" && campaign.individualRecipientEmail && <p className="mt-1 max-w-[180px] truncate text-xs text-slate-400">{campaign.individualRecipientEmail}</p>}
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={campaign.status} /></td>
                        <td className="px-4 py-4 font-medium tabular-nums text-slate-700">{campaign._count?.recipients ?? 0}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{new Date(campaign.updatedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {campaign.status === "DRAFT" && (
                              <ActionButton label="Review audience" onClick={() => void previewAudience(campaign)}><Eye className="h-4 w-4" /></ActionButton>
                            )}
                            <ActionButton label="Edit draft" disabled={campaign.status !== "DRAFT"} onClick={() => startEditing(campaign)}><Pencil className="h-4 w-4" /></ActionButton>
                            {campaign.status === "DRAFT" && (
                              <ActionButton label="Send campaign" disabled={previewing} onClick={() => void beginSend(campaign)}><Send className="h-4 w-4 text-emerald-700" /></ActionButton>
                            )}
                            <ActionButton label="Delete draft" disabled={campaign.status !== "DRAFT"} onClick={() => setPendingDelete(campaign)}><Trash2 className="h-4 w-4 text-red-600" /></ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {filteredCampaigns.map((campaign) => (
                  <article key={campaign.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900">{campaign.name}</h3>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{campaign.subject}</p>
                      </div>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{campaign.kind === "BULK" ? "Bulk audience" : "Individual"}</span>
                      <span>·</span>
                      <span>{campaign._count?.recipients ?? 0} recipients</span>
                      <span>·</span>
                      <span>{new Date(campaign.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-3">
                      {campaign.status === "DRAFT" && <ActionButton label="Review audience" onClick={() => void previewAudience(campaign)}><Eye className="h-4 w-4" /></ActionButton>}
                      <ActionButton label="Edit draft" disabled={campaign.status !== "DRAFT"} onClick={() => startEditing(campaign)}><Pencil className="h-4 w-4" /></ActionButton>
                      {campaign.status === "DRAFT" && <ActionButton label="Send campaign" disabled={previewing} onClick={() => void beginSend(campaign)}><Send className="h-4 w-4 text-emerald-700" /></ActionButton>}
                      <ActionButton label="Delete draft" disabled={campaign.status !== "DRAFT"} onClick={() => setPendingDelete(campaign)}><Trash2 className="h-4 w-4 text-red-600" /></ActionButton>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500 sm:px-7">
            <span>Showing {filteredCampaigns.length} of {campaigns.length} campaigns</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Admin workspace</span>
          </div>
        </section>

        {selectedId && (
          <section className="overflow-hidden rounded-2xl border border-[#E1E9E2] bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">Audience review</p>
                <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-slate-900"><Users className="h-5 w-5 text-emerald-700" />{selectedCampaign?.name ?? "Selected campaign"}</h2>
                <p className="mt-1 text-sm text-slate-500">A live eligibility preview. No recipients are created and no emails are sent by this preview.</p>
              </div>
              <button type="button" onClick={() => { setSelectedId(null); setAudience(null); }} aria-label="Close audience preview" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            {previewing ? (
              <div className="flex items-center justify-center gap-3 px-6 py-12 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" /> Checking current eligibility...</div>
            ) : audience ? (
              <div className="space-y-5 p-5 sm:p-7">
                {audience.recipient ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Individual recipient</p>
                    <p className="mt-1 font-semibold text-slate-900">{audience.recipient.name || audience.recipient.email}</p>
                    <p className="text-sm text-slate-500">{audience.recipient.email}</p>
                    <p className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${audience.recipient.eligible ? "text-emerald-700" : "text-red-700"}`}>
                      {audience.recipient.eligible ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {audience.recipient.eligible ? "Eligible at preview time" : "Not currently eligible"}
                    </p>
                  </div>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MiniMetric label="Contacts checked" value={audience.totalContacts} />
                  <MiniMetric label="Eligible recipients" value={audience.eligibleCount} tone="green" />
                  <MiniMetric label="Excluded contacts" value={audience.excludedCount} />
                  <MiniMetric label="Suppressed" value={audience.breakdown.suppressed} tone="red" />
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-800">Why contacts may be excluded</h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <BreakdownItem label="Not subscribed" value={audience.breakdown.notSubscribed} />
                    <BreakdownItem label="Unsubscribed" value={audience.breakdown.unsubscribed} />
                    <BreakdownItem label="Invalid email" value={audience.breakdown.invalidEmail} />
                    <BreakdownItem label="Missing or withdrawn consent" value={audience.breakdown.missingOrWithdrawnConsent} />
                    <BreakdownItem label="Account not eligible" value={audience.breakdown.accountNotEligible} />
                    {(audience.breakdown.individualRecipientIneligible ?? 0) > 0 && <BreakdownItem label="Individual recipient ineligible" value={audience.breakdown.individualRecipientIneligible ?? 0} />}
                  </div>
                </div>
                <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-emerald-950">
                    <p className="font-bold">Consent is checked again at send time</p>
                    <p className="mt-1 text-emerald-900/80">This preview is informational. Eligibility may change before processing.</p>
                  </div>
                  {selectedCampaign?.status === "DRAFT" && audience.eligibleCount > 0 && (
                    <button type="button" onClick={() => selectedCampaign && setPendingSend(selectedCampaign)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#245C43] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#194832]"><Send className="h-4 w-4" /> Continue to send</button>
                  )}
                </div>
              </div>
            ) : (
              <p className="px-6 py-12 text-center text-sm text-slate-500">Choose “Review audience” on a draft campaign to calculate eligibility.</p>
            )}
          </section>
        )}

        <footer className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Marketing sends are limited to eligible contacts with valid consent. Unsubscribe and suppression checks remain part of processing.</p>
          <a href="https://resend.com/docs" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950">Resend delivery docs <ArrowUpRight className="h-3 w-3" /></a>
        </footer>
      </div>

      {pendingSend && (
        <Modal title="Confirm campaign send" onClose={() => !sending && setPendingSend(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div><p className="font-bold">You are about to submit this campaign for processing.</p><p className="mt-1">The campaign will be queued. This action does not guarantee immediate delivery.</p></div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{pendingSend.name}</p>
              <p className="mt-1 text-sm text-slate-500">{pendingSend.subject}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-500">Campaign type</span><span className="font-semibold text-slate-800">{pendingSend.kind === "BULK" ? "Bulk campaign" : "Individual campaign"}</span>
              </div>
              {pendingSend.kind === "INDIVIDUAL" && <div className="mt-2 flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Recipient</span><span className="truncate font-semibold text-slate-800">{pendingSend.individualRecipientEmail}</span></div>}
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-500">Currently eligible</span><span className="text-lg font-bold tabular-nums text-emerald-700">{audience?.eligibleCount ?? "—"}</span>
              </div>
            </div>
            <p className="text-xs leading-5 text-slate-500">The worker rechecks each recipient’s subscription, consent, and suppression status before sending. An unsubscribe option is included.</p>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button type="button" disabled={sending} onClick={() => setPendingSend(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="button" disabled={sending} onClick={() => void confirmSend()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#245C43] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#194832] disabled:opacity-60">
                {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Submitting..." : "Confirm and queue"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {pendingDelete && (
        <Modal title="Delete draft campaign?" onClose={() => !deleting && setPendingDelete(null)}>
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">You are about to permanently delete <strong className="text-slate-900">{pendingDelete.name}</strong>. This cannot be undone. Only draft campaigns can be deleted.</p>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button type="button" disabled={deleting} onClick={() => setPendingDelete(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Keep campaign</button>
              <button type="button" disabled={deleting} onClick={() => void confirmDelete()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {deleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? "Deleting..." : "Delete draft"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .studio-input {
          display: block;
          width: 100%;
          min-width: 0;
          border: 1px solid #dbe3dc;
          border-radius: 0.75rem;
          background: #fff;
          padding: 0.72rem 0.85rem;
          color: #17251c;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }
        .studio-input::placeholder { color: #9aa79d; }
        .studio-input:focus {
          border-color: #438260;
          box-shadow: 0 0 0 3px rgb(36 92 67 / 10%);
        }
        .studio-input:disabled { background: #f8faf8; color: #64748b; }
      `}</style>
    </main>
  );
}

function MetricCard({ icon, label, value, note }: { icon: ReactNode; label: string; value: number; note: string }) {
  return (
    <div className="rounded-lg border border-[#E1E9E2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-xs leading-5 text-slate-500">{hint}</span>}
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusStyles[status] ?? statusStyles.DRAFT}`}>{status.replaceAll("_", " ")}</span>;
}

function ActionButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30">{children}</button>;
}

function MiniMetric({ label, value, tone }: { label: string; value: number; tone?: "green" | "red" }) {
  const color = tone === "green" ? "text-emerald-700" : tone === "red" ? "text-red-700" : "text-slate-900";
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold tabular-nums ${color}`}>{value}</p></div>;
}

function BreakdownItem({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"><span className="text-sm text-slate-600">{label}</span><span className="font-bold tabular-nums text-slate-900">{value}</span></div>;
}

function Notice({ tone, onClose, children }: { tone: "error" | "success"; onClose: () => void; children: ReactNode }) {
  const isError = tone === "error";
  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
      <div className="flex items-start gap-2">{isError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}<p>{children}</p></div>
      <button type="button" onClick={onClose} aria-label="Dismiss notification" className="rounded-md p-0.5 opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={title} className="my-8 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-slate-900">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
        {children}
      </section>
    </div>
  );
}
