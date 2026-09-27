"use client";

import {
  Archive,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  DollarSign,
  Edit3,
  Eye,
  GraduationCap,
  Layers3,
  Loader2,
  Plus,
  Save,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ServiceStatus = "Draft" | "Published" | "Archived";

type Service = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  durationMinutes: number | null;
  price: number | null;
  currency: string;
  status: ServiceStatus;
  subject: string | null;
  gradeLevels: unknown;
  createdAt: string;
  updatedAt: string;
};

type Profile = {
  id: string;
  verificationStatus: string;
  headline: string | null;
  specialty: string | null;
  subjects: unknown;
  gradeLevels: unknown;
};

type Props = {
  profile: Profile;
  initialServices: Service[];
};

type FormState = {
  title: string;
  description: string;
  subject: string;
  gradeLevels: string;
  durationMinutes: string;
  price: string;
  currency: "USD" | "GHS";
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  subject: "",
  gradeLevels: "",
  durationMinutes: "60",
  price: "",
  currency: "USD",
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function formatMoney(amount: number | null, currency: string): string {
  if (amount === null || amount === undefined) {
    return "Set price";
  }

  const value = amount / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(status: ServiceStatus) {
  switch (status) {
    case "Published":
      return "Published";
    case "Archived":
      return "Archived";
    default:
      return "Draft";
  }
}

function statusClasses(status: ServiceStatus) {
  switch (status) {
    case "Published":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Archived":
      return "bg-slate-100 text-slate-500 ring-slate-200";
    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
}

export default function EducatorServicesStudio({
  profile,
  initialServices,
}: Props) {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>(initialServices);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);


  const subjects = useMemo(
    () => toStringArray(profile.subjects),
    [profile.subjects],
  );

  const gradeLevels = useMemo(
    () => toStringArray(profile.gradeLevels),
    [profile.gradeLevels],
  );

  const publishedCount = services.filter(
    (service) => service.status === "Published",
  ).length;

  const draftCount = services.filter(
    (service) => service.status === "Draft",
  ).length;

  const archivedCount = services.filter(
    (service) => service.status === "Archived",
  ).length;

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  function openCreateForm() {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
      subject: subjects[0] ?? "",
      gradeLevels: gradeLevels.join(", "),
    });

    setShowForm(true);
  }

  function openEditForm(service: Service) {

    setEditingId(service.id);

    setForm({
      title: service.title,
      description: service.description ?? "",
      subject: service.subject ?? "",
      gradeLevels: toStringArray(service.gradeLevels).join(", "),
      durationMinutes: service.durationMinutes?.toString() ?? "60",
      price: service.price !== null ? (service.price / 100).toString() : "",
      currency: service.currency === "GHS" ? "GHS" : "USD",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);

    try {
      const title = form.title.trim();

      if (!title) {
        throw new Error("Service title is required.");
      }

      const duration =
        form.durationMinutes.trim() === ""
          ? null
          : Number(form.durationMinutes);

      const price = form.price.trim() === "" ? null : Number(form.price);

      if (duration !== null && (!Number.isFinite(duration) || duration <= 0)) {
        throw new Error("Duration must be greater than zero.");
      }

      if (price !== null && (!Number.isFinite(price) || price < 0)) {
        throw new Error("Price must be a valid amount.");
      }

      const subjectList = form.subject
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const gradeLevelList = form.gradeLevels
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        title,
        description: form.description.trim(),
        subject: subjectList[0] ?? "",
        gradeLevels: gradeLevelList,
        durationMinutes: duration,
        price,
        currency: form.currency,
      };

      const response = await fetch("/api/educator/services", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingId
            ? {
                id: editingId,
                ...payload,
              }
            : payload,
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save teaching service.");
      }

      const savedService = data.service as Service;

      if (editingId) {
        setServices((current) =>
          current.map((service) =>
            service.id === editingId ? savedService : service,
          ),
        );

        toast.success("Teaching service updated successfully.");
      } else {
        setServices((current) => [savedService, ...current]);

        toast.success("Teaching service saved as a draft.");
      }

      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(service: Service, status: ServiceStatus) {
    setActionId(service.id);

    try {
      const response = await fetch("/api/educator/services", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: service.id,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update service status.");
      }

      const updatedService = data.service as Service;

      setServices((current) =>
        current.map((item) => (item.id === service.id ? updatedService : item)),
      );

      if (status === "Published") {
        toast.success("Service published. Learners can now discover this offering when your educator profile is publicly eligible.");
      } else if (status === "Archived") {
        toast.success("Service archived.");
      } else {
        toast.success("Service moved back to draft.");
      }

      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionId(null);
    }
  }

  async function archiveService(service: Service) {
    if (
      !window.confirm(
        `Archive "${service.title}"? You can no longer offer it as an active service.`,
      )
    ) {
      return;
    }

    setActionId(service.id);

    try {
      const response = await fetch("/api/educator/services", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: service.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to archive service.");
      }

      setServices((current) =>
        current.map((item) =>
          item.id === service.id
            ? {
                ...item,
                status: "Archived",
              }
            : item,
        ),
      );

      toast.success("Service archived.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-0 lg:px-4 lg:py-5">
      {/* Service creation/edit form */}
      {showForm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
        >
          <section className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-none bg-emerald-950 shadow-2xl">
            <div className="shrink-0 border-b border-emerald-900 bg-emerald-950 px-5 py-4 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-emerald-900 text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 id="service-modal-title" className="truncate text-base font-semibold text-white sm:text-lg">
                      {editingId ? "Edit teaching service" : "Create Tutoring Package or Service"}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                      Define the service learners will see and book.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-white transition hover:text-amber-300"
                  aria-label="Close form"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto bg-emerald-950 px-5 py-5 sm:px-7 sm:py-6"
            >
              <div className="space-y-5">
                <section className=" bg-emerald-950 shadow-sm">
                  <div className="space-y-5 p-0">
                    <div className="min-w-0">
                      <label
                        htmlFor="hourlyRate"
                        className="mb-1.5 block text-xs font-semibold text-white"
                      >
                        Service Title
                      </label>

                      <div className="relative">
                        <input
                       
                          type="text"
                          min="0"
                          step="0.01"
                          value={form.title}
                          onChange={(event) => updateField("title", event.target.value)}
                          placeholder="e.g. Grade 5 Mathematics Support"
                          maxLength={120}
                          className="h-11 w-full rounded-none border border-emerald-900 bg-card px-3.5 text-sm text-white outline-none transition placeholder:text-muted-foreground hover:border-emerald-950 focus:border-emerald-950 focus:ring-emerald-950"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                    <label
                      htmlFor="description"
                      className="mb-1.5 block text-xs font-semibold text-white"
                    >
                      Describe the service
                    </label>

                    <textarea
                      value={form.description}
                        onChange={(event) => updateField("description", event.target.value)}
                        placeholder="Describe your teaching approach, what the learner will work on, and what makes this service useful..."
                      rows={5}
                      maxLength={2000}
                      className="h-30 w-full resize-none rounded-none border border-emerald-900 bg-card px-3.5 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-muted-foreground hover:border-emerald-950 focus:border-emerald-950 focus:ring-emerald-950"
                    />
                  </div>


                    <div className="min-w-0">
                      <label
                        htmlFor="hourlyRate"
                        className="mb-1.5 block text-xs font-semibold text-white"
                      >
                        Subjects
                      </label>

                      <div className="relative">
                        <input
                       
                          type="text"
                          min="0"
                          step="0.01"
                          value={form.subject}
                         onChange={(event) => updateField("subject", event.target.value)}
                          placeholder="Mathematics"
                          maxLength={120}
                          className="h-11 w-full rounded-none border border-emerald-900 bg-card px-3.5 text-sm text-white outline-none transition placeholder:text-muted-foreground hover:border-emerald-950 focus:border-emerald-950 focus:ring-emerald-950"
                        />
                        {subjects.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {subjects.slice(0, 6).map((subject) => (
                              <button
                                key={subject}
                                type="button"
                                onClick={() => updateField("subject", subject)}
                                className="rounded-none border border-emerald-900 bg-emerald-950 px-2.5 py-1.5 text-xs font-medium text-white transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                              >
                                {subject}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                      <div className="min-w-0">
                      <label
                        htmlFor="hourlyRate"
                        className="mb-1.5 block text-xs font-semibold text-white"
                      >
                        Geade Levels
                      </label>

                      <div className="relative">
                        <input
                       
                          type="text"
                          min="0"
                          step="0.01"
                         value={form.gradeLevels}
                          onChange={(event) => updateField("gradeLevels", event.target.value)}
                          placeholder="Grade 4, Grade 5"
                          maxLength={120}
                          className="h-11 w-full rounded-none border border-emerald-900 bg-card px-3.5 text-sm text-white outline-none transition placeholder:text-muted-foreground hover:border-emerald-950 focus:border-emerald-950 focus:ring-emerald-950"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className=" bg-emerald-950 shadow-sm">
                 
                  <div className="grid gap-4 sm:grid-cols-3">
              {/* Duration */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold tracking-tight text-white">
                  Duration
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={form.durationMinutes}
                    onChange={(event) =>
                      updateField("durationMinutes", event.target.value)
                    }
                    placeholder="60"
                    className="form-input w-full px-2 py-1 bg-emerald-950 pr-16 border border-emerald-900 text-white placeholder:text-muted-foreground"
                  />

                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center border-l border-emerald-900 px-3 py-2 text-sm font-medium text-white">
                    min
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold tracking-tight text-white">
                  Price
                </label>

                <div className="relative">
                  <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      updateField("price", event.target.value)
                    }
                    placeholder="35.00"
                    className="form-input w-full px-2 py-1 bg-emerald-950 pl-9 border border-emerald-900 pr-3 text-white placeholder:text-white"
                  />
                </div>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold tracking-tight text-white">
                  Currency
                </label>

                <select
                  value={form.currency}
                  onChange={(event) =>
                    updateField(
                      "currency",
                      event.target.value as "USD" | "GHS"
                    )
                  }
                  className="form-input w-full bg-emerald-950 text-white px-2 py-1 border border-emerald-900"
                >
                  <option value="USD">USD — US Dollar</option>
                  <option value="GHS">GHS — Ghana Cedi</option>
                </select>
              </div>
            </div>
                </section>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-3 border-t border-emerald-900 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="rounded-none bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:border-slate-300 hover:bg-emerald-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-none bg-card px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingId ? "Save changes" : "Save as draft"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {/* Services */}
      <section className="mt-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[26px] font-semibold tracking-[-0.035em] text-white sm:text-[30px]">
                My Tutoring services
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Create and manage the tutoring services students
                can book with you.
              </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{publishedCount} published</span>
              <span>•</span>
              <span>{draftCount} drafts</span>
              <span>•</span>
              <span>{archivedCount} archived</span>
            </div>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-none bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              New service
            </button>
          </div>
        </div>

        {services.length === 0 ? (
          <EmptyServicesState onCreate={openCreateForm} />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                actionId={actionId}
                onEdit={openEditForm}
                onPublish={(item) => updateStatus(item, "Published")}
                onDraft={(item) => updateStatus(item, "Draft")}
                onArchive={archiveService}
              />
            ))}
          </div>
        )}
      </section>

    
    </div>
  );
}


function ServiceCard({
  service,
  actionId,
  onEdit,
  onPublish,
  onDraft,
  onArchive,
}: {
  service: Service;
  actionId: string | null;
  onEdit: (service: Service) => void;
  onPublish: (service: Service) => void;
  onDraft: (service: Service) => void;
  onArchive: (service: Service) => void;
}) {
  const grades = toStringArray(service.gradeLevels);

  const busy = actionId === service.id;

  return (
    <article className="group overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <BookOpen className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClasses(
                    service.status,
                  )}`}
                >
                  {statusLabel(service.status)}
                </span>

                <span className="text-[11px] font-medium text-slate-400">
                  Created {formatDate(service.createdAt)}
                </span>
              </div>

              <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-slate-950">
                {service.title}
              </h3>
            </div>
          </div>
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
          {service.description || "No service description has been added yet."}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {service.subject ? (
            <InfoPill
              icon={<BookOpen className="h-3.5 w-3.5" />}
              label={service.subject}
            />
          ) : null}

          {grades.slice(0, 3).map((grade) => (
            <InfoPill
              key={grade}
              icon={<GraduationCap className="h-3.5 w-3.5" />}
              label={grade}
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock3 className="h-3.5 w-3.5" />
              Duration
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              {service.durationMinutes
                ? `${service.durationMinutes} min`
                : "Flexible"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <DollarSign className="h-3.5 w-3.5" />
              Price
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              {formatMoney(service.price, service.currency)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onEdit(service)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition hover:text-violet-700 disabled:opacity-50"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {service.status === "Draft" ? (
              <button
                type="button"
                onClick={() => onPublish(service)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Publish
              </button>
            ) : null}

            {service.status === "Published" ? (
              <button
                type="button"
                onClick={() => onDraft(service)}
                disabled={busy}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Move to draft
              </button>
            ) : null}

            {service.status !== "Archived" ? (
              <button
                type="button"
                onClick={() => onArchive(service)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Archive className="h-3.5 w-3.5" />
                )}
                Archive
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400">
                <Archive className="h-3.5 w-3.5" />
                Archived
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

function EmptyServicesState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-none  bg-emerald-950 px-6 py-14 text-center shadow-sm sm:px-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-none bg-emerald-900 text-white">
        <GraduationCap className="h-7 w-7" />
      </div>

      <h3 className="mt-5 text-xl font-semibold text-white">
        Your teaching business starts here.
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Create your first teaching service so learners can understand what you
        offer. You can start with a draft and publish it when it is ready.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-none bg-emerald-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" />
        Create your first service
      </button>
    </div>
  );
}




// "use client";

// import {
//   Archive,
//   ArrowRight,
//   BookOpen,
//   CheckCircle2,
//   Clock3,
//   DollarSign,
//   Edit3,
//   Eye,
//   GraduationCap,
//   Layers3,
//   Loader2,
//   Plus,
//   Save,
//   Sparkles,
//   X,
//   Zap,
// } from "lucide-react";
// import { FormEvent, useMemo, useState } from "react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";

// type ServiceStatus = "Draft" | "Published" | "Archived";

// type Service = {
//   id: string;
//   title: string;
//   description: string | null;
//   type: string;
//   durationMinutes: number | null;
//   price: number | null;
//   currency: string;
//   status: ServiceStatus;
//   subject: string | null;
//   gradeLevels: unknown;
//   createdAt: string;
//   updatedAt: string;
// };

// type Profile = {
//   id: string;
//   verificationStatus: string;
//   headline: string | null;
//   specialty: string | null;
//   subjects: unknown;
//   gradeLevels: unknown;
// };

// type Props = {
//   profile: Profile;
//   initialServices: Service[];
// };

// type FormState = {
//   title: string;
//   description: string;
//   subject: string;
//   gradeLevels: string;
//   durationMinutes: string;
//   price: string;
//   currency: "USD" | "GHS";
// };

// const EMPTY_FORM: FormState = {
//   title: "",
//   description: "",
//   subject: "",
//   gradeLevels: "",
//   durationMinutes: "60",
//   price: "",
//   currency: "USD",
// };

// function toStringArray(value: unknown): string[] {
//   if (!Array.isArray(value)) {
//     return [];
//   }

//   return value.filter(
//     (item): item is string =>
//       typeof item === "string" && item.trim().length > 0,
//   );
// }

// function formatMoney(amount: number | null, currency: string): string {
//   if (amount === null || amount === undefined) {
//     return "Set price";
//   }

//   const value = amount / 100;

//   try {
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency,
//       maximumFractionDigits: 2,
//     }).format(value);
//   } catch {
//     return `${currency} ${value.toFixed(2)}`;
//   }
// }

// function formatDate(value: string) {
//   return new Intl.DateTimeFormat("en-US", {
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   }).format(new Date(value));
// }

// function statusLabel(status: ServiceStatus) {
//   switch (status) {
//     case "Published":
//       return "Published";
//     case "Archived":
//       return "Archived";
//     default:
//       return "Draft";
//   }
// }

// function statusClasses(status: ServiceStatus) {
//   switch (status) {
//     case "Published":
//       return "bg-emerald-50 text-emerald-700 ring-emerald-200";
//     case "Archived":
//       return "bg-slate-100 text-slate-500 ring-slate-200";
//     default:
//       return "bg-amber-50 text-amber-700 ring-amber-200";
//   }
// }

// export default function EducatorServicesStudio({
//   profile,
//   initialServices,
// }: Props) {
//   const router = useRouter();

//   const [services, setServices] = useState<Service[]>(initialServices);
//   const [form, setForm] = useState<FormState>(EMPTY_FORM);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   const [showForm, setShowForm] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [actionId, setActionId] = useState<string | null>(null);


//   const subjects = useMemo(
//     () => toStringArray(profile.subjects),
//     [profile.subjects],
//   );

//   const gradeLevels = useMemo(
//     () => toStringArray(profile.gradeLevels),
//     [profile.gradeLevels],
//   );

//   const publishedCount = services.filter(
//     (service) => service.status === "Published",
//   ).length;

//   const draftCount = services.filter(
//     (service) => service.status === "Draft",
//   ).length;

//   const archivedCount = services.filter(
//     (service) => service.status === "Archived",
//   ).length;

//   function resetForm() {
//     setForm(EMPTY_FORM);
//     setEditingId(null);
//     setShowForm(false);
//   }

//   function openCreateForm() {
//     setEditingId(null);

//     setForm({
//       ...EMPTY_FORM,
//       subject: subjects[0] ?? "",
//       gradeLevels: gradeLevels.join(", "),
//     });

//     setShowForm(true);
//   }

//   function openEditForm(service: Service) {

//     setEditingId(service.id);

//     setForm({
//       title: service.title,
//       description: service.description ?? "",
//       subject: service.subject ?? "",
//       gradeLevels: toStringArray(service.gradeLevels).join(", "),
//       durationMinutes: service.durationMinutes?.toString() ?? "60",
//       price: service.price !== null ? (service.price / 100).toString() : "",
//       currency: service.currency === "GHS" ? "GHS" : "USD",
//     });

//     setShowForm(true);

//     window.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     });
//   }

//   function updateField<K extends keyof FormState>(
//     field: K,
//     value: FormState[K],
//   ) {
//     setForm((current) => ({
//       ...current,
//       [field]: value,
//     }));
//   }

//   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     setLoading(true);

//     try {
//       const title = form.title.trim();

//       if (!title) {
//         throw new Error("Service title is required.");
//       }

//       const duration =
//         form.durationMinutes.trim() === ""
//           ? null
//           : Number(form.durationMinutes);

//       const price = form.price.trim() === "" ? null : Number(form.price);

//       if (duration !== null && (!Number.isFinite(duration) || duration <= 0)) {
//         throw new Error("Duration must be greater than zero.");
//       }

//       if (price !== null && (!Number.isFinite(price) || price < 0)) {
//         throw new Error("Price must be a valid amount.");
//       }

//       const subjectList = form.subject
//         .split(",")
//         .map((item) => item.trim())
//         .filter(Boolean);

//       const gradeLevelList = form.gradeLevels
//         .split(",")
//         .map((item) => item.trim())
//         .filter(Boolean);

//       const payload = {
//         title,
//         description: form.description.trim(),
//         subject: subjectList[0] ?? "",
//         gradeLevels: gradeLevelList,
//         durationMinutes: duration,
//         price,
//         currency: form.currency,
//       };

//       const response = await fetch("/api/educator/services", {
//         method: editingId ? "PATCH" : "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(
//           editingId
//             ? {
//                 id: editingId,
//                 ...payload,
//               }
//             : payload,
//         ),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data?.error || "Unable to save teaching service.");
//       }

//       const savedService = data.service as Service;

//       if (editingId) {
//         setServices((current) =>
//           current.map((service) =>
//             service.id === editingId ? savedService : service,
//           ),
//         );

//         toast.success("Teaching service updated successfully.");
//       } else {
//         setServices((current) => [savedService, ...current]);

//         toast.success("Teaching service saved as a draft.");
//       }

//       resetForm();
//       router.refresh();
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : "Something went wrong.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function updateStatus(service: Service, status: ServiceStatus) {
//     setActionId(service.id);

//     try {
//       const response = await fetch("/api/educator/services", {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           id: service.id,
//           status,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data?.error || "Unable to update service status.");
//       }

//       const updatedService = data.service as Service;

//       setServices((current) =>
//         current.map((item) => (item.id === service.id ? updatedService : item)),
//       );

//       if (status === "Published") {
//         toast.success("Service published. Learners can now discover this offering when your educator profile is publicly eligible.");
//       } else if (status === "Archived") {
//         toast.success("Service archived.");
//       } else {
//         toast.success("Service moved back to draft.");
//       }

//       router.refresh();
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : "Something went wrong.");
//     } finally {
//       setActionId(null);
//     }
//   }

//   async function archiveService(service: Service) {
//     if (
//       !window.confirm(
//         `Archive "${service.title}"? You can no longer offer it as an active service.`,
//       )
//     ) {
//       return;
//     }

//     setActionId(service.id);

//     try {
//       const response = await fetch("/api/educator/services", {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           id: service.id,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data?.error || "Unable to archive service.");
//       }

//       setServices((current) =>
//         current.map((item) =>
//           item.id === service.id
//             ? {
//                 ...item,
//                 status: "Archived",
//               }
//             : item,
//         ),
//       );

//       toast.success("Service archived.");
//       router.refresh();
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : "Something went wrong.");
//     } finally {
//       setActionId(null);
//     }
//   }

//   return (
//     <div className="mx-auto w-full max-w-7xl px-5 py-0 lg:px-4 lg:py-5">
//       {/* Service creation/edit form */}
//       {showForm ? (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6"
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="service-modal-title"
//         >
//           <section className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-none bg-emerald-950 shadow-2xl">
//           <div className="shrink-0 border-b border-emerald-900 bg-emerald-950 px-6 py-5 sm:px-8">
//             <div className="flex items-start justify-between gap-4">
//               <div>
//                 <div className="flex items-center gap-2">
//                   <div className="flex h-9 w-9 items-center justify-center rounded-none bg-violet-50 text-violet-600">
//                     <Sparkles className="h-4 w-4" />
//                   </div>

//                   <div>
//                     <h2 id="service-modal-title" className="text-lg font-semibold text-white">
//                       {editingId
//                         ? "Edit teaching service"
//                         : "Create teaching service"}
//                     </h2>

//                     <p className="text-sm text-muted-foreground">
//                       Describe the learning experience you provide.
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <button
//                 type="button"
//                 onClick={resetForm}
//                 className="rounded-lg p-2 text-white transition hover:text-amber-300"
//                 aria-label="Close form"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//             </div>
//           </div>

//           <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto bg-emerald-950 px-6 py-6 sm:px-8"
//             >
//             <div className="grid gap-6 lg:grid-cols-1">
//               <div className="space-y-6">
//                 <FormField
//                   label="Service title"
//                   required
//                   hint="Make it clear what the learner will receive."
//                 >
//                   <input
//                     value={form.title}
//                     onChange={(event) =>
//                       updateField("title", event.target.value)
//                     }
//                     placeholder="e.g. Grade 5 Mathematics Support"
//                     className="form-input py-2 px-3 w-full bg-background text-white placeholder:text-muted-foreground"
//                     maxLength={120}
//                   />
//                 </FormField>

//                 <FormField
//                   label="Description"
//                   hint="Explain what you teach, who it is for, and what learners can expect."
//                 >
//                   <textarea
//                     value={form.description}
//                     onChange={(event) =>
//                       updateField("description", event.target.value)
//                     }
//                     placeholder="Describe your teaching approach, what the learner will work on, and what makes this service useful..."
//                     className="form-input min-h-20 w-full px-3 py-3 resize-y bg-background text-white placeholder:text-muted-foreground"
//                     maxLength={2000}
//                   />
//                 </FormField>

//                 <div className="grid gap-5 sm:grid-cols-2">
//                   <FormField
//                     label="Subject"
//                     hint="Example: Mathematics"
//                   >
//                     <input
//                       value={form.subject}
//                       onChange={(event) =>
//                         updateField("subject", event.target.value)
//                       }
//                       placeholder="Mathematics"
//                       className="form-input w-full px-3 py-2 bg-background text-white placeholder:text-slate-400"
//                     />

//                     {subjects.length > 0 ? (
//                       <div className="mt-2 flex flex-wrap gap-2">
//                         {subjects.slice(0, 6).map((subject) => (
//                           <button
//                             key={subject}
//                             type="button"
//                             onClick={() =>
//                               updateField("subject", subject)
//                             }
//                             className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
//                           >
//                             {subject}
//                           </button>
//                         ))}
//                       </div>
//                     ) : null}
//                   </FormField>

//                   <FormField
//                     label="Grade levels"
//                     hint="Separate multiple levels with commas."
//                   >
//                     <input
//                       value={form.gradeLevels}
//                       onChange={(event) =>
//                         updateField("gradeLevels", event.target.value)
//                       }
//                       placeholder="Grade 4, Grade 5"
//                       className="form-input w-full bg-white text-slate-900 placeholder:text-slate-400"
//                     />
//                   </FormField>
//                 </div>

//                 <div className="grid gap-5 sm:grid-cols-3">
//                   <FormField
//                     label="Duration"
//                     hint="Minutes"
//                   >
//                     <input
//                       type="number"
//                       min="15"
//                       step="15"
//                       value={form.durationMinutes}
//                       onChange={(event) =>
//                         updateField(
//                           "durationMinutes",
//                           event.target.value,
//                         )
//                       }
//                       className="form-input w-full bg-white text-slate-900"
//                     />
//                   </FormField>

//                   <FormField
//                     label="Price"
//                     hint="Leave empty for flexible pricing."
//                   >
//                     <div className="relative">
//                       <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

//                       <input
//                         type="number"
//                         min="0"
//                         step="0.01"
//                         value={form.price}
//                         onChange={(event) =>
//                           updateField("price", event.target.value)
//                         }
//                         placeholder="35"
//                         className="form-input w-full bg-white pl-9 text-slate-900 placeholder:text-slate-400"
//                       />
//                     </div>
//                   </FormField>

//                   <FormField
//                     label="Currency"
//                     hint="Supported currencies"
//                   >
//                     <select
//                       value={form.currency}
//                       onChange={(event) =>
//                         updateField(
//                           "currency",
//                           event.target.value as "USD" | "GHS",
//                         )
//                       }
//                       className="form-input w-full bg-white text-slate-900"
//                     >
//                       <option value="USD">
//                         USD — US Dollar
//                       </option>

//                       <option value="GHS">
//                         GHS — Ghana Cedi
//                       </option>
//                     </select>
//                   </FormField>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
//               <button
//                 type="button"
//                 onClick={resetForm}
//                 disabled={loading}
//                 className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
//               >
//                 Cancel
//               </button>

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 {loading ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   <Save className="h-4 w-4" />
//                 )}

//                 {editingId ? "Save changes" : "Save as draft"}
//               </button>
//             </div>
//           </form>
//           </section>
//         </div>
//       ) : null}

//       {/* Services */}
//       <section className="mt-8">
//         <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
//           <div>
//             <h1 className="text-[26px] font-semibold tracking-[-0.035em] text-white sm:text-[30px]">
//                 My Tutoring services
//               </h1>

//               <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
//                 Create and manage the tutoring services students
//                 can book with you.
//               </p>
//           </div>

//           <div className="flex flex-wrap items-center gap-3">
//             <div className="flex items-center gap-2 text-xs text-slate-400">
//               <span>{publishedCount} published</span>
//               <span>•</span>
//               <span>{draftCount} drafts</span>
//               <span>•</span>
//               <span>{archivedCount} archived</span>
//             </div>
//             <button
//               type="button"
//               onClick={openCreateForm}
//               className="inline-flex items-center gap-2 rounded-none bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
//             >
//               <Plus className="h-4 w-4" />
//               New service
//             </button>
//           </div>
//         </div>

//         {services.length === 0 ? (
//           <EmptyServicesState onCreate={openCreateForm} />
//         ) : (
//           <div className="grid gap-5 lg:grid-cols-2">
//             {services.map((service) => (
//               <ServiceCard
//                 key={service.id}
//                 service={service}
//                 actionId={actionId}
//                 onEdit={openEditForm}
//                 onPublish={(item) => updateStatus(item, "Published")}
//                 onDraft={(item) => updateStatus(item, "Draft")}
//                 onArchive={archiveService}
//               />
//             ))}
//           </div>
//         )}
//       </section>

    
//     </div>
//   );
// }



// function FormField({
//   label,
//   required,
//   hint,
//   children,
// }: {
//   label: string;
//   required?: boolean;
//   hint?: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div>
//       <label className="mb-2 block text-sm font-semibold text-white">
//         {label}
//         {required ? <span className="ml-1 text-amber-300">*</span> : null}
//       </label>

//       {children}

//       {hint ? (
//         <p className="mt-1.5 text-xs leading-4 text-muted-foreground">{hint}</p>
//       ) : null}
//     </div>
//   );
// }

// function PreviewRow({ icon, label }: { icon: React.ReactNode; label: string }) {
//   return (
//     <div className="flex items-start gap-2 text-xs text-slate-500">
//       <span className="mt-0.5 text-slate-400">{icon}</span>

//       <span className="line-clamp-2">{label}</span>
//     </div>
//   );
// }

// function ServiceCard({
//   service,
//   actionId,
//   onEdit,
//   onPublish,
//   onDraft,
//   onArchive,
// }: {
//   service: Service;
//   actionId: string | null;
//   onEdit: (service: Service) => void;
//   onPublish: (service: Service) => void;
//   onDraft: (service: Service) => void;
//   onArchive: (service: Service) => void;
// }) {
//   const grades = toStringArray(service.gradeLevels);

//   const busy = actionId === service.id;

//   return (
//     <article className="group overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
//       <div className="p-6">
//         <div className="flex items-start justify-between gap-4">
//           <div className="flex min-w-0 items-start gap-3">
//             <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
//               <BookOpen className="h-5 w-5" />
//             </div>

//             <div className="min-w-0">
//               <div className="flex flex-wrap items-center gap-2">
//                 <span
//                   className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClasses(
//                     service.status,
//                   )}`}
//                 >
//                   {statusLabel(service.status)}
//                 </span>

//                 <span className="text-[11px] font-medium text-slate-400">
//                   Created {formatDate(service.createdAt)}
//                 </span>
//               </div>

//               <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-slate-950">
//                 {service.title}
//               </h3>
//             </div>
//           </div>
//         </div>

//         <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
//           {service.description || "No service description has been added yet."}
//         </p>

//         <div className="mt-5 flex flex-wrap gap-2">
//           {service.subject ? (
//             <InfoPill
//               icon={<BookOpen className="h-3.5 w-3.5" />}
//               label={service.subject}
//             />
//           ) : null}

//           {grades.slice(0, 3).map((grade) => (
//             <InfoPill
//               key={grade}
//               icon={<GraduationCap className="h-3.5 w-3.5" />}
//               label={grade}
//             />
//           ))}
//         </div>

//         <div className="mt-6 grid grid-cols-2 gap-3">
//           <div className="rounded-xl bg-slate-50 p-3">
//             <div className="flex items-center gap-2 text-xs text-slate-400">
//               <Clock3 className="h-3.5 w-3.5" />
//               Duration
//             </div>

//             <p className="mt-1 text-sm font-semibold text-slate-800">
//               {service.durationMinutes
//                 ? `${service.durationMinutes} min`
//                 : "Flexible"}
//             </p>
//           </div>

//           <div className="rounded-xl bg-slate-50 p-3">
//             <div className="flex items-center gap-2 text-xs text-slate-400">
//               <DollarSign className="h-3.5 w-3.5" />
//               Price
//             </div>

//             <p className="mt-1 text-sm font-semibold text-slate-800">
//               {formatMoney(service.price, service.currency)}
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
//         <div className="flex flex-wrap items-center justify-between gap-3">
//           <button
//             type="button"
//             onClick={() => onEdit(service)}
//             disabled={busy}
//             className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition hover:text-violet-700 disabled:opacity-50"
//           >
//             <Edit3 className="h-4 w-4" />
//             Edit
//           </button>

//           <div className="flex flex-wrap items-center gap-2">
//             {service.status === "Draft" ? (
//               <button
//                 type="button"
//                 onClick={() => onPublish(service)}
//                 disabled={busy}
//                 className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
//               >
//                 {busy ? (
//                   <Loader2 className="h-3.5 w-3.5 animate-spin" />
//                 ) : (
//                   <CheckCircle2 className="h-3.5 w-3.5" />
//                 )}
//                 Publish
//               </button>
//             ) : null}

//             {service.status === "Published" ? (
//               <button
//                 type="button"
//                 onClick={() => onDraft(service)}
//                 disabled={busy}
//                 className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
//               >
//                 Move to draft
//               </button>
//             ) : null}

//             {service.status !== "Archived" ? (
//               <button
//                 type="button"
//                 onClick={() => onArchive(service)}
//                 disabled={busy}
//                 className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
//               >
//                 {busy ? (
//                   <Loader2 className="h-3.5 w-3.5 animate-spin" />
//                 ) : (
//                   <Archive className="h-3.5 w-3.5" />
//                 )}
//                 Archive
//               </button>
//             ) : (
//               <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400">
//                 <Archive className="h-3.5 w-3.5" />
//                 Archived
//               </span>
//             )}
//           </div>
//         </div>
//       </div>
//     </article>
//   );
// }

// function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
//   return (
//     <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">
//       {icon}
//       <span className="truncate">{label}</span>
//     </span>
//   );
// }

// function EmptyServicesState({ onCreate }: { onCreate: () => void }) {
//   return (
//     <div className="rounded-none  bg-emerald-950 px-6 py-14 text-center shadow-sm sm:px-10">
//       <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-none bg-emerald-900 text-white">
//         <GraduationCap className="h-7 w-7" />
//       </div>

//       <h3 className="mt-5 text-xl font-semibold text-white">
//         Your teaching business starts here.
//       </h3>

//       <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
//         Create your first teaching service so learners can understand what you
//         offer. You can start with a draft and publish it when it is ready.
//       </p>

//       <button
//         type="button"
//         onClick={onCreate}
//         className="mt-6 inline-flex items-center gap-2 rounded-none bg-emerald-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
//       >
//         <Plus className="h-4 w-4" />
//         Create your first service
//       </button>
//     </div>
//   );
// }

// function RoadmapPill({
//   label,
//   active = false,
// }: {
//   label: string;
//   active?: boolean;
// }) {
//   return (
//     <span
//       className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
//         active
//           ? "border-violet-400/30 bg-violet-400/15 text-violet-200"
//           : "border-white/10 bg-white/5 text-slate-400"
//       }`}
//     >
//       {label}
//     </span>
//   );
// }
