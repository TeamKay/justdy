
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Mail,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Users,
  Send,
  X,
} from "lucide-react";

type Campaign = {
  id: string;
  kind: "BULK" | "INDIVIDUAL";
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

type Audience = {
  totalContacts: number;
  eligibleCount: number;
  excludedCount: number;
  breakdown: {
    notSubscribed: number;
    unsubscribed: number;
    suppressed: number;
    invalidEmail: number;
    missingOrWithdrawnConsent: number;
    accountNotEligible: number;
  };
};

type CampaignForm = {
  kind: "BULK" | "INDIVIDUAL";
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  fromName: string;
  replyTo: string;
};

const emptyForm: CampaignForm = {
  kind: "BULK",
  name: "",
  subject: "",
  htmlContent: "",
  textContent: "",
  fromName: "Justdy",
  replyTo: "",
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  QUEUED: "bg-blue-100 text-blue-700",
  SENDING: "bg-amber-100 text-amber-700",
  SENT: "bg-green-100 text-green-700",
  PARTIALLY_SENT: "bg-orange-100 text-orange-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

/**
 * Fetch campaign data without changing React state.
 * Keeping this separate allows the initial effect to update state
 * only after the asynchronous request has completed.
 */
async function fetchCampaigns(): Promise<Campaign[]> {
  const response = await fetch(
    "/api/admin/marketing/campaigns?page=1&pageSize=100",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Unable to load campaigns.");
  }

  return result.campaigns ?? [];
}

export default function MarketingCenterClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [audience, setAudience] = useState<Audience | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  /**
   * Initial campaign loading.
   *
   * State updates happen inside asynchronous promise callbacks,
   * rather than synchronously inside the effect.
   *
   * The active flag prevents updates after the component unmounts.
   */
  useEffect(() => {
    let active = true;

    fetchCampaigns()
      .then((campaignList) => {
        if (active) {
          setCampaigns(campaignList);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load campaigns.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  /**
   * Manual refresh and post-operation reload.
   */
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const campaignList = await fetchCampaigns();
      setCampaigns(campaignList);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load campaigns.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  function updateField(
    field: keyof CampaignForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startNewCampaign() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setAudience(null);
    setSelectedId(null);
    setError("");
    setSuccess("");
  }

  function startEditing(campaign: Campaign) {
    if (campaign.status !== "DRAFT") {
      setError("Only draft campaigns can be edited.");
      return;
    }

    setEditingId(campaign.id);
    setSelectedId(campaign.id);

    setForm({
      kind: campaign.kind,
      name: campaign.name,
      subject: campaign.subject,
      htmlContent: campaign.htmlContent,
      textContent: campaign.textContent ?? "",
      fromName: campaign.fromName ?? "Justdy",
      replyTo: campaign.replyTo ?? "",
    });

    setShowForm(true);
    setAudience(null);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveCampaign(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      textContent: form.textContent || null,
      fromName: form.fromName || null,
      replyTo: form.replyTo || null,
    };

    try {
      const response = await fetch(
        editingId
          ? `/api/admin/marketing/campaigns/${editingId}`
          : "/api/admin/marketing/campaigns",
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to save the campaign.",
        );
      }

      setSuccess(
        editingId
          ? "Campaign updated successfully."
          : "Campaign created successfully as a draft.",
      );

      closeForm();
      await loadCampaigns();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save campaign.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function previewAudience(campaign: Campaign) {
    setSelectedId(campaign.id);
    setAudience(null);
    setPreviewing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/marketing/campaigns/${campaign.id}/audience`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to preview the audience.",
        );
      }

      setAudience(result.audience);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to preview the audience.",
      );
    } finally {
      setPreviewing(false);
    }
  }

  async function deleteCampaign(campaign: Campaign) {
    if (campaign.status !== "DRAFT") {
      setError("Only draft campaigns can be deleted.");
      return;
    }

    if (
      !window.confirm(
        `Delete the draft campaign "${campaign.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/marketing/campaigns/${campaign.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to delete campaign.",
        );
      }

      if (selectedId === campaign.id) {
        setSelectedId(null);
        setAudience(null);
      }

      setSuccess("Draft campaign deleted.");

      await loadCampaigns();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete campaign.",
      );
    }
  }

  const selectedCampaign = campaigns.find(
    (campaign) => campaign.id === selectedId,
  );

  return (
    <div className="min-h-full bg-[#F8FAF7] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-800">
                <Mail className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-[#20372A]">
                  Email Marketing Center
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Manage campaigns, review subscribers, and monitor campaign activity.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadCampaigns()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={startNewCampaign}
              className="inline-flex items-center gap-2 rounded-lg bg-[#245C43] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#194832]"
            >
              <Plus className="h-4 w-4" />
              Create campaign
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total campaigns"
            value={campaigns.length}
            description="All campaign records"
          />

          <SummaryCard
            label="Draft campaigns"
            value={campaigns.filter((c) => c.status === "DRAFT").length}
            description="Ready for review"
          />

          <SummaryCard
            label="Sent campaigns"
            value={campaigns.filter((c) => c.status === "SENT").length}
            description="Successfully completed"
          />

          <SummaryCard
            label="Eligible subscribers"
            value={audience?.eligibleCount ?? "—"}
            description="From the latest audience preview"
          />
        </div>

        {/* Create/edit campaign form */}
        {showForm && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingId ? "Edit campaign" : "Create a campaign"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Campaigns are saved as drafts. Saving does not send emails.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close campaign form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveCampaign} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Campaign name">
                  <input
                    required
                    maxLength={160}
                    value={form.name}
                    onChange={(e) =>
                      updateField("name", e.target.value)
                    }
                    placeholder="e.g. November Mathematics Newsletter"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Campaign type">
                  <select
                    value={form.kind}
                    onChange={(e) =>
                      updateField("kind", e.target.value)
                    }
                    className="form-input"
                  >
                    <option value="BULK">Bulk campaign</option>
                    <option value="INDIVIDUAL">
                      Individual campaign
                    </option>
                  </select>
                </FormField>

                <FormField label="Email subject">
                  <input
                    required
                    maxLength={200}
                    value={form.subject}
                    onChange={(e) =>
                      updateField("subject", e.target.value)
                    }
                    placeholder="Your email subject"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Sender name">
                  <input
                    maxLength={120}
                    value={form.fromName}
                    onChange={(e) =>
                      updateField("fromName", e.target.value)
                    }
                    placeholder="Justdy"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Reply-to email">
                  <input
                    type="email"
                    value={form.replyTo}
                    onChange={(e) =>
                      updateField("replyTo", e.target.value)
                    }
                    placeholder="support@yourdomain.com"
                    className="form-input"
                  />
                </FormField>
              </div>

              <FormField label="HTML email content">
                <textarea
                  required
                  rows={10}
                  maxLength={500000}
                  value={form.htmlContent}
                  onChange={(e) =>
                    updateField("htmlContent", e.target.value)
                  }
                  placeholder="<h1>Welcome to Justdy!</h1>"
                  className="form-input font-mono text-sm"
                />
              </FormField>

              <FormField label="Plain-text email content">
                <textarea
                  rows={5}
                  maxLength={500000}
                  value={form.textContent}
                  onChange={(e) =>
                    updateField("textContent", e.target.value)
                  }
                  placeholder="A plain-text version of your email"
                  className="form-input"
                />
              </FormField>

              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#245C43] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#194832] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Save draft"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Campaign list */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-2 border-b px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-gray-900">
                Campaigns
              </h2>

              <p className="text-sm text-gray-500">
                Create, edit, preview, and manage your email campaigns.
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {campaigns.length} campaign
              {campaigns.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="mx-auto h-10 w-10 text-gray-300" />

              <h3 className="mt-3 font-semibold text-gray-900">
                No campaigns yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Create your first email campaign to get started.
              </p>

              <button
                type="button"
                onClick={startNewCampaign}
                className="mt-4 rounded-lg bg-[#245C43] px-4 py-2 text-sm font-semibold text-white"
              >
                Create your first campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Campaign</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Recipients</th>
                    <th className="px-5 py-3">Last updated</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {campaign.name}
                        </p>

                        <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                          {campaign.subject}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {campaign.kind}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusStyles[campaign.status] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {campaign.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {campaign._count?.recipients ?? 0}
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {new Date(
                          campaign.updatedAt,
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <ActionButton
                            label="Preview eligible audience"
                            onClick={() =>
                              void previewAudience(campaign)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </ActionButton>

                          <ActionButton
                            label="Edit campaign"
                            disabled={campaign.status !== "DRAFT"}
                            onClick={() =>
                              startEditing(campaign)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </ActionButton>

                          <ActionButton
                            label="Delete draft"
                            disabled={campaign.status !== "DRAFT"}
                            onClick={() =>
                              void deleteCampaign(campaign)
                            }
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Audience preview */}
        {selectedId && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                  <Users className="h-5 w-5 text-emerald-700" />
                  Audience preview
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedCampaign?.name ?? "Selected campaign"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setAudience(null);
                }}
                className="self-start rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close audience preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {previewing ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Calculating eligible subscribers...
              </div>
            ) : audience ? (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard
                    label="Total contacts"
                    value={audience.totalContacts}
                    description="All marketing contacts"
                  />

                  <SummaryCard
                    label="Eligible audience"
                    value={audience.eligibleCount}
                    description="Has valid marketing consent"
                  />

                  <SummaryCard
                    label="Excluded contacts"
                    value={audience.excludedCount}
                    description="Not eligible for this campaign"
                  />

                  <SummaryCard
                    label="Suppressed"
                    value={audience.breakdown.suppressed}
                    description="Cannot receive marketing emails"
                  />
                </div>

                <div className="mt-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">
                    Audience exclusion breakdown
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <BreakdownItem
                      label="Not subscribed"
                      value={audience.breakdown.notSubscribed}
                    />

                    <BreakdownItem
                      label="Unsubscribed"
                      value={audience.breakdown.unsubscribed}
                    />

                    <BreakdownItem
                      label="Invalid email"
                      value={audience.breakdown.invalidEmail}
                    />

                    <BreakdownItem
                      label="Missing or withdrawn consent"
                      value={
                        audience.breakdown.missingOrWithdrawnConsent
                      }
                    />

                    <BreakdownItem
                      label="Account not eligible"
                      value={audience.breakdown.accountNotEligible}
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <strong>Preview only.</strong> This calculation does
                  not create recipients or send emails. The sending
                  workflow has not been enabled.
                </div>
              </>
            ) : (
              <p className="py-8 text-sm text-gray-500">
                Select Preview eligible audience on a campaign to
                calculate its audience.
              </p>
            )}
          </section>
        )}

        {/* Sending status notice */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-3">
            <Send className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Email delivery is not enabled here yet.
              </p>

              <p className="mt-1">
                This interface currently supports campaign drafts,
                editing, deletion, and audience previews. It does not
                send emails. We will add the sending and scheduling
                workflow only after recipient creation, consent checks,
                unsubscribe headers, suppression checks, and delivery
                tracking are verified.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .form-input {
          display: block;
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.625rem;
          background: white;
          padding: 0.7rem 0.8rem;
          color: #111827;
          outline: none;
        }

        .form-input:focus {
          border-color: #245c43;
          box-shadow: 0 0 0 2px rgb(36 92 67 / 12%);
        }
      `}</style>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function ActionButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function BreakdownItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <span className="text-sm text-gray-600">
        {label}
      </span>

      <span className="font-semibold tabular-nums text-gray-900">
        {value}
      </span>
    </div>
  );
}
