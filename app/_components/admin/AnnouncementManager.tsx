
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Send,
  Save,
  X,
  ExternalLink,
  Loader2,
  Radio,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type Announcement = {
  id: string;
  message: string;
  linkLabel: string | null;
  linkUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AnnouncementForm = {
  message: string;
  linkLabel: string;
  linkUrl: string;
  isPublished: boolean;
};

const emptyForm: AnnouncementForm = {
  message: "",
  linkLabel: "",
  linkUrl: "",
  isPublished: false,
};

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const published = announcements.find((item) => item.isPublished);
  const drafts = announcements.filter((item) => !item.isPublished);

 const loadAnnouncements = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    const response = await fetch("/api/admin/announcements", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load announcements.");
    }

    setAnnouncements(data.announcements ?? []);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to load announcements.",
    );
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  let active = true;

  async function fetchAnnouncements() {
    try {
      const response = await fetch("/api/admin/announcements", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load announcements.");
      }

      if (active) {
        setAnnouncements(data.announcements ?? []);
      }
    } catch (err) {
      if (active) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load announcements.",
        );
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  void fetchAnnouncements();

  return () => {
    active = false;
  };
}, []);



  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  }

  function openEditForm(announcement: Announcement) {
    setEditingId(announcement.id);
    setForm({
      message: announcement.message,
      linkLabel: announcement.linkLabel ?? "",
      linkUrl: announcement.linkUrl ?? "",
      isPublished: announcement.isPublished,
    });
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveAnnouncement(publish?: boolean) {
    setError("");
    setSuccess("");

    const message = form.message.trim();
    const linkLabel = form.linkLabel.trim();
    const linkUrl = form.linkUrl.trim();

    if (!message) {
      setError("Please enter an announcement message.");
      return;
    }

    if (message.length > 300) {
      setError("Your message cannot exceed 300 characters.");
      return;
    }

    if (Boolean(linkLabel) !== Boolean(linkUrl)) {
      setError("Please provide both the button label and destination URL.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        message,
        linkLabel,
        linkUrl,
        isPublished: publish ?? form.isPublished,
      };

      const response = await fetch(
        editingId
          ? `/api/admin/announcements/${editingId}`
          : "/api/admin/announcements",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save announcement.");
      }

      closeForm();
      await loadAnnouncements();
      setSuccess(
        payload.isPublished
          ? "Announcement published successfully."
          : "Announcement saved as a draft.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save announcement.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(announcement: Announcement) {
    setActionId(announcement.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/announcements/${announcement.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isPublished: !announcement.isPublished,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update announcement.");
      }

      await loadAnnouncements();
      setSuccess(
        announcement.isPublished
          ? "Announcement unpublished."
          : "Announcement published successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update announcement.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function deleteAnnouncement(id: string) {
    setActionId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete announcement.");
      }

      setDeletingId(null);
      await loadAnnouncements();
      setSuccess("Announcement deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete announcement.",
      );
    } finally {
      setActionId(null);
    }
  }

  function formatDate(value: string | null) {
    if (!value) return "Not published";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  }

  return (
    <div className="min-h-full bg-[#F8FAF7] px-4 py-7 text-[#20372A] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#71866F]">
              <Megaphone className="h-4 w-4" />
              Website management
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Announcements
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#718071]">
              Create and manage announcements displayed on the Justdy
              homepage.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#376421] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#294C18]"
          >
            <Plus className="h-4 w-4" />
            Create announcement
          </button>
        </div>

        {/* Feedback */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E3EADF] bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#718071]">
                Total announcements
              </span>
              <FileText className="h-5 w-5 text-[#71866F]" />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {announcements.length}
            </p>
            <p className="mt-1 text-xs text-[#899789]">
              All saved announcements
            </p>
          </div>

          <div className="rounded-xl border border-[#E3EADF] bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#718071]">
                Published
              </span>
              <Radio className="h-5 w-5 text-[#376421]" />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {published ? 1 : 0}
            </p>
            <p className="mt-1 text-xs text-[#899789]">
              Currently visible on the homepage
            </p>
          </div>

          <div className="rounded-xl border border-[#E3EADF] bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#718071]">
                Drafts
              </span>
              <FileText className="h-5 w-5 text-[#C18B3D]" />
            </div>
            <p className="mt-3 text-3xl font-bold">{drafts.length}</p>
            <p className="mt-1 text-xs text-[#899789]">
              Saved but not visible
            </p>
          </div>
        </div>

        {/* Published preview */}
        <section className="overflow-hidden rounded-xl border border-[#E3EADF] bg-white">
          <div className="flex flex-col gap-2 border-b border-[#E9EEE7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Live announcement preview</h2>
              <p className="mt-1 text-xs text-[#899789]">
                This is the announcement currently displayed on your website.
              </p>
            </div>

            {published ? (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                <span className="h-2 w-2 rounded-full bg-green-600" />
                Published
              </span>
            ) : (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                No active announcement
              </span>
            )}
          </div>

          <div className="p-5 sm:p-7">
            {published ? (
              <div className="flex min-h-20 flex-wrap items-center justify-center gap-3 rounded-lg border border-[#DCE9DD] bg-[#1c0a4a] px-4 py-4 text-white shadow-sm">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b7ff36] opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-[#d7ff4a] shadow-[0_0_10px_3px_rgba(215,255,74,0.5)]" />
                </span>

                <span className="text-center text-sm font-semibold">
                  {published.message}
                </span>

                {published.linkLabel && published.linkUrl && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#d7f60b]">
                    {published.linkLabel}
                    <ExternalLink className="h-3 w-3" />
                  </span>
                )}
              </div>
            ) : (
              <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-[#D9E3D5] bg-[#F8FAF7] px-5 text-center text-sm text-[#899789]">
                Your homepage announcement will appear here after you publish one.
              </div>
            )}

            {published && (
              <p className="mt-3 text-center text-xs text-[#899789]">
                Published {formatDate(published.publishedAt)}
              </p>
            )}
          </div>
        </section>

        {/* Announcement list */}
        <section className="overflow-hidden rounded-xl border border-[#E3EADF] bg-white">
          <div className="flex items-center justify-between border-b border-[#E9EEE7] px-5 py-4">
            <div>
              <h2 className="font-semibold">All announcements</h2>
              <p className="mt-1 text-xs text-[#899789]">
                Manage your published announcements and saved drafts.
              </p>
            </div>
            <span className="text-sm font-medium text-[#718071]">
              {announcements.length} total
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-[#718071]">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF4EC] text-[#376421]">
                <Megaphone className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">No announcements yet</h3>
              <p className="mt-1 max-w-sm text-sm text-[#899789]">
                Create your first announcement to share news, promotions,
                and important updates with website visitors.
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#376421] hover:underline"
              >
                <Plus className="h-4 w-4" />
                Create your first announcement
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E9EEE7]">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex flex-col gap-4 px-5 py-5 transition hover:bg-[#FBFCFA] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {announcement.isPublished ? (
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-800">
                          Published
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                          Draft
                        </span>
                      )}

                      <span className="text-xs text-[#899789]">
                        Created {formatDate(announcement.createdAt)}
                      </span>
                    </div>

                    <p className="break-words text-sm font-semibold leading-6 text-[#263D2C]">
                      {announcement.message}
                    </p>

                    {announcement.linkLabel && announcement.linkUrl && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-[#718071]">
                        <ExternalLink className="h-3 w-3" />
                        {announcement.linkLabel} · {announcement.linkUrl}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditForm(announcement)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#DCE5D8] px-3 text-xs font-semibold text-[#36543A] transition hover:bg-[#EFF4EC]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={actionId === announcement.id}
                      onClick={() => void togglePublished(announcement)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#DCE5D8] px-3 text-xs font-semibold text-[#36543A] transition hover:bg-[#EFF4EC] disabled:opacity-50"
                    >
                      {actionId === announcement.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : announcement.isPublished ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      {announcement.isPublished ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingId(announcement.id)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-100 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>

                  {deletingId === announcement.id && (
                    <div className="flex w-full flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-red-800">
                        Delete this announcement permanently?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={actionId === announcement.id}
                          onClick={() => void deleteAnnouncement(announcement.id)}
                          className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {actionId === announcement.id ? "Deleting..." : "Confirm delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Create / Edit form */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px]">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="announcement-form-title"
              className="my-auto w-full max-w-2xl overflow-hidden rounded-xl border border-[#E3EADF] bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#E9EEE7] px-5 py-4">
                <div>
                  <h2
                    id="announcement-form-title"
                    className="text-lg font-bold"
                  >
                    {editingId ? "Edit announcement" : "Create announcement"}
                  </h2>
                  <p className="mt-1 text-xs text-[#899789]">
                    Configure the message displayed on your homepage.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Close form"
                  className="rounded-lg p-2 text-[#718071] transition hover:bg-[#EFF4EC]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <label
                    htmlFor="announcement-message"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Announcement message
                  </label>
                  <textarea
                    id="announcement-message"
                    value={form.message}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    maxLength={300}
                    rows={3}
                    placeholder="e.g. New math tutoring offers are available!"
                    className="w-full resize-none rounded-lg border border-[#DCE5D8] bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-[#A0AA9D] focus:border-[#648D4C] focus:ring-2 focus:ring-[#648D4C]/15"
                  />
                  <div className="mt-1 text-right text-xs text-[#899789]">
                    {form.message.length}/300
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="announcement-link-label"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Button label
                      <span className="ml-1 font-normal text-[#899789]">
                        (optional)
                      </span>
                    </label>
                    <input
                      id="announcement-link-label"
                      value={form.linkLabel}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          linkLabel: event.target.value,
                        }))
                      }
                      maxLength={60}
                      placeholder="e.g. Book Now!"
                      className="h-11 w-full rounded-lg border border-[#DCE5D8] px-3 text-sm outline-none focus:border-[#648D4C] focus:ring-2 focus:ring-[#648D4C]/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="announcement-link-url"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Button destination
                      <span className="ml-1 font-normal text-[#899789]">
                        (optional)
                      </span>
                    </label>
                    <input
                      id="announcement-link-url"
                      value={form.linkUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          linkUrl: event.target.value,
                        }))
                      }
                      maxLength={500}
                      placeholder="/tutoring"
                      className="h-11 w-full rounded-lg border border-[#DCE5D8] px-3 text-sm outline-none focus:border-[#648D4C] focus:ring-2 focus:ring-[#648D4C]/15"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Live preview</p>
                  <div className="flex min-h-16 flex-wrap items-center justify-center gap-3 rounded-lg border border-[#DCE9DD] bg-[#1c0a4a] px-4 py-3 text-white">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b7ff36] opacity-75" />
                      <span className="relative h-2 w-2 rounded-full bg-[#d7ff4a]" />
                    </span>
                    <span className="text-center text-xs font-semibold sm:text-sm">
                      {form.message.trim() || "Your announcement message will appear here"}
                    </span>
                    {form.linkLabel.trim() && (
                      <span className="text-xs font-bold text-[#d7f60b]">
                        {form.linkLabel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-[#E5EBE1] bg-[#F8FAF7] p-3.5">
                  <input
                    id="announcement-publish"
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isPublished: event.target.checked,
                      }))
                    }
                    className="mt-0.5 h-4 w-4 accent-[#376421]"
                  />
                  <label
                    htmlFor="announcement-publish"
                    className="cursor-pointer"
                  >
                    <span className="block text-sm font-semibold">
                      Publish immediately
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#718071]">
                      This announcement will become visible on the homepage.
                      Any previously published announcement will be unpublished.
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[#E9EEE7] bg-[#FBFCFA] px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="h-10 rounded-lg border border-[#DCE5D8] px-5 text-sm font-semibold text-[#536653] transition hover:bg-[#EFF4EC] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void saveAnnouncement(false)}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#376421] px-5 text-sm font-semibold text-[#376421] transition hover:bg-[#EFF4EC] disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save draft
                </button>

                <button
                  type="button"
                  onClick={() => void saveAnnouncement(true)}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#376421] px-5 text-sm font-semibold text-white transition hover:bg-[#294C18] disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Publish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
