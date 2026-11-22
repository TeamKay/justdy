
"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Eye,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Slash,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type EducatorStatus = "Pending" | "Approved" | "Rejected" | "Suspended";

type ApplicationDetails = {
  id: string;
  status: "Pending" | "Approved" | "Rejected";
  name: string;
  email: string;
  phoneNumber: string | null;
  headline: string | null;
  specialty: string | null;
  experience: number | null;
  credentialUrl: string | null;
  description: string | null;
  hourlyRate: number | null;
  currency: string;
  subjects: string[];
  gradeLevels: string[];
  createdAt: string;
};

type ProfileDetails = {
  id: string;
  userId: string;
  headline: string | null;
  specialty: string | null;
  experience: number | null;
  credentialUrl: string | null;
  description: string | null;
  hourlyRate: number | null;
  currency: string;
  subjects: string[];
  gradeLevels: string[];
  verificationStatus: "Pending" | "Verified" | "Rejected";
};

export type EducatorManagementRow = {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  accountStatus: "Active" | "Suspended" | "Pending" | "Deleted" | null;
  joinedAt: string | null;
  status: EducatorStatus;
  application: ApplicationDetails | null;
  profile: ProfileDetails | null;
};

type Props = {
  educators: EducatorManagementRow[];
};

type Filter = "All" | EducatorStatus;

const filters: Filter[] = [
  "All",
  "Pending",
  "Approved",
  "Rejected",
  "Suspended",
];

function formatRate(rate: number | null, currency: string) {
  if (rate === null || !Number.isFinite(rate)) return "Not set";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(rate / 100) + "/hr";
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getTeachingDetails(educator: EducatorManagementRow) {
  if (
    (educator.status === "Pending" || educator.status === "Rejected") &&
    educator.application
  ) {
    return educator.application;
  }

  return educator.profile ?? educator.application;
}

function StatusBadge({ status }: { status: EducatorStatus }) {
  const styles: Record<EducatorStatus, string> = {
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
    Suspended: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  const icons = {
    Pending: <Clock3 className="h-3.5 w-3.5" />,
    Approved: <CheckCircle2 className="h-3.5 w-3.5" />,
    Rejected: <XCircle className="h-3.5 w-3.5" />,
    Suspended: <Slash className="h-3.5 w-3.5" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {icons[status]}
      {status}
    </span>
  );
}

function Modal({
  title,
  description,
  onClose,
  children,
  size = "max-w-2xl",
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[90vh] w-full ${size} flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </section>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-medium text-foreground">
        {value || "—"}
      </div>
    </div>
  );
}

export default function EducatorManagementView({ educators }: Props) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [selectedEducator, setSelectedEducator] =
    useState<EducatorManagementRow | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    educator: EducatorManagementRow;
    action: "suspend" | "reactivate";
  } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      total: educators.length,
      pending: educators.filter((item) => item.status === "Pending").length,
      approved: educators.filter((item) => item.status === "Approved").length,
      suspended: educators.filter((item) => item.status === "Suspended").length,
    }),
    [educators],
  );

  const filteredEducators = useMemo(() => {
    const query = search.trim().toLowerCase();

    return educators
      .filter((educator) =>
        activeFilter === "All" ? true : educator.status === activeFilter,
      )
      .filter((educator) => {
        if (!query) return true;

        const teaching = getTeachingDetails(educator);
        return [
          educator.name,
          educator.email,
          teaching?.headline,
          teaching?.specialty,
          ...(teaching?.subjects ?? []),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      });
  }, [educators, search, activeFilter]);

  async function reviewApplication(
    educator: EducatorManagementRow,
    action: "approve" | "reject",
  ) {
    const applicationId = educator.application?.id;

    if (!applicationId) {
      toast.error("This educator does not have an application to review.");
      return;
    }

    const key = `review-${applicationId}`;
    setBusyKey(key);

    try {
      const response = await fetch(
        `/api/admin/tutor-applications/${applicationId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || result?.message || "Unable to update application.",
        );
      }

      toast.success(
        action === "approve"
          ? "Educator application approved."
          : "Educator application rejected.",
      );
      setSelectedEducator(null);
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function reviewLegacyProfile(
    educator: EducatorManagementRow,
    action: "verify" | "reject",
  ) {
    if (!educator.profile?.id) {
      toast.error("Teaching profile not found.");
      return;
    }

    const key = `legacy-${educator.profile.id}`;
    setBusyKey(key);

    try {
      const response = await fetch(
        `/api/admin/educators/${educator.profile.id}/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || result?.message || "Unable to update profile.",
        );
      }

      toast.success(
        action === "verify"
          ? "Educator profile verified."
          : "Educator profile rejected.",
      );
      setSelectedEducator(null);
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function updateAccountStatus() {
    if (!confirmAction) return;

    const { educator, action } = confirmAction;

    if (!educator.profile?.userId) {
      toast.error("The educator account could not be identified.");
      return;
    }

    const key = `${action}-${educator.profile.userId}`;
    setBusyKey(key);

    try {
      const response = await fetch(
        `/api/admin/educators/${educator.profile.userId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || result?.message || "Unable to update account.",
        );
      }

      toast.success(
        action === "suspend"
          ? "Educator account suspended."
          : "Educator account reactivated.",
      );
      setConfirmAction(null);
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  const selectedTeaching = selectedEducator
    ? getTeachingDetails(selectedEducator)
    : null;

  const selectedReviewKey = selectedEducator?.application
    ? `review-${selectedEducator.application.id}`
    : selectedEducator?.profile
      ? `legacy-${selectedEducator.profile.id}`
      : null;

  return (
    <main className="min-h-full bg-muted/20">
      <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              Administration
              <span>/</span>
              Educators
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Educator Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review applications and manage educator accounts.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {educators.length} {educators.length === 1 ? "educator" : "educators"}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total educators",
              value: counts.total,
              icon: <GraduationCap className="h-4 w-4" />,
              color: "text-slate-600 bg-slate-100",
            },
            {
              label: "Pending applications",
              value: counts.pending,
              icon: <Clock3 className="h-4 w-4" />,
              color: "text-amber-700 bg-amber-50",
            },
            {
              label: "Approved educators",
              value: counts.approved,
              icon: <ShieldCheck className="h-4 w-4" />,
              color: "text-emerald-700 bg-emerald-50",
            },
            {
              label: "Suspended educators",
              value: counts.suspended,
              icon: <Slash className="h-4 w-4" />,
              color: "text-rose-700 bg-rose-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-background p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <span className={`rounded-lg p-2 ${stat.color}`}>
                  {stat.icon}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  All educators
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Applications and existing teaching profiles in one place.
                </p>
              </div>
              <div className="relative w-full lg:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, subject..."
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {filters.map((filter) => {
                const count =
                  filter === "All"
                    ? counts.total
                    : educators.filter((item) => item.status === filter).length;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                      activeFilter === filter
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {filter}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] tabular-nums ${
                        activeFilter === filter
                          ? "bg-background/15 text-background"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Educator",
                    "Teaching details",
                    "Experience",
                    "Hourly rate",
                    "Date added",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground first:pl-5 last:pr-5"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEducators.map((educator) => {
                  const teaching = getTeachingDetails(educator);

                  return (
                    <tr
                      key={educator.id}
                      className="transition hover:bg-muted/20"
                    >
                      <td className="px-4 py-4 pl-5">
                        <div className="flex min-w-[210px] items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                            {educator.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={educator.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              educator.name
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {educator.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {educator.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-[220px]">
                          <p className="truncate text-sm font-medium text-foreground">
                            {teaching?.headline || "No headline provided"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {teaching?.specialty ||
                              teaching?.subjects?.slice(0, 2).join(", ") ||
                              "No specialty provided"}
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-muted-foreground">
                        {teaching?.experience != null
                          ? `${teaching.experience} ${
                              teaching.experience === 1 ? "year" : "years"
                            }`
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-foreground">
                        {formatRate(
                          teaching?.hourlyRate ?? null,
                          teaching?.currency ?? "USD",
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-muted-foreground">
                        {formatDate(
                          educator.application?.createdAt ??
                            educator.joinedAt,
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={educator.status} />
                      </td>
                      <td className="px-4 py-4 pr-5">
                        <div className="flex items-center gap-2">
                          {educator.status === "Pending" ? (
                            <button
                              type="button"
                              onClick={() => setSelectedEducator(educator)}
                              className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-foreground px-3 text-xs font-medium text-background transition hover:opacity-90"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Review application
                            </button>
                          ) : educator.status === "Rejected" ? (
                            <button
                              type="button"
                              onClick={() => setSelectedEducator(educator)}
                              className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 text-xs font-medium text-foreground transition hover:bg-muted"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View details
                            </button>
                          ) : educator.status === "Approved" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedEducator(educator)}
                                className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 text-xs font-medium text-foreground transition hover:bg-muted"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View profile
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmAction({
                                    educator,
                                    action: "suspend",
                                  })
                                }
                                className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-rose-200 px-3 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                              >
                                <Slash className="h-3.5 w-3.5" />
                                Suspend
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedEducator(educator)}
                                className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 text-xs font-medium text-foreground transition hover:bg-muted"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View profile
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmAction({
                                    educator,
                                    action: "reactivate",
                                  })
                                }
                                className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-200 px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Reactivate
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredEducators.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Search className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-foreground">
                        No educators found
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Try another search or select a different status.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {filteredEducators.length} of {educators.length} educators
            </span>
            <span>Educator records are updated from applications and profiles.</span>
          </div>
        </section>
      </div>

      {selectedEducator && (
        <Modal
          title={
            selectedEducator.status === "Pending"
              ? "Review educator application"
              : selectedEducator.status === "Rejected"
                ? "Application details"
                : "Educator profile"
          }
          description={`${selectedEducator.name} · ${selectedEducator.email}`}
          onClose={() => setSelectedEducator(null)}
        >
          <div className="space-y-6">
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-sm font-semibold text-foreground ring-1 ring-border">
                  {selectedEducator.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedEducator.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Added {formatDate(
                      selectedEducator.application?.createdAt ??
                        selectedEducator.joinedAt,
                    )}
                  </p>
                </div>
              </div>
              <StatusBadge status={selectedEducator.status} />
            </div>

            <DetailSection title="Contact information">
              <Detail
                label="Email address"
                value={
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedEducator.email}
                  </span>
                }
              />
              <Detail
                label="Phone number"
                value={
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedEducator.application?.phoneNumber || "Not provided"}
                  </span>
                }
              />
            </DetailSection>

            <div className="border-t border-border" />

            <DetailSection title="Teaching information">
              <Detail label="Professional headline" value={selectedTeaching?.headline} />
              <Detail label="Specialty" value={selectedTeaching?.specialty} />
              <Detail
                label="Experience"
                value={
                  selectedTeaching?.experience != null
                    ? `${selectedTeaching.experience} years`
                    : "Not provided"
                }
              />
              <Detail
                label="Hourly rate"
                value={formatRate(
                  selectedTeaching?.hourlyRate ?? null,
                  selectedTeaching?.currency ?? "USD",
                )}
              />
              <Detail
                label="Subjects"
                value={
                  selectedTeaching?.subjects?.length
                    ? selectedTeaching.subjects.join(", ")
                    : "Not provided"
                }
              />
              <Detail
                label="Grade levels"
                value={
                  selectedTeaching?.gradeLevels?.length
                    ? selectedTeaching.gradeLevels.join(", ")
                    : "Not provided"
                }
              />
            </DetailSection>

            {selectedTeaching?.description && (
              <>
                <div className="border-t border-border" />
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    About the educator
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {selectedTeaching.description}
                  </p>
                </div>
              </>
            )}

            {selectedTeaching?.credentialUrl && (
              <a
                href={selectedTeaching.credentialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                View submitted credentials
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )}

            {selectedEducator.status === "Pending" && (
              <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={Boolean(busyKey)}
                  onClick={() =>
                    selectedEducator.application
                      ? reviewApplication(selectedEducator, "reject")
                      : reviewLegacyProfile(selectedEducator, "reject")
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  {busyKey === selectedReviewKey ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject
                </button>
                <button
                  type="button"
                  disabled={Boolean(busyKey)}
                  onClick={() =>
                    selectedEducator.application
                      ? reviewApplication(selectedEducator, "approve")
                      : reviewLegacyProfile(selectedEducator, "verify")
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
                >
                  {busyKey === selectedReviewKey ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve educator
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {confirmAction && (
        <Modal
          title={
            confirmAction.action === "suspend"
              ? "Suspend educator?"
              : "Reactivate educator?"
          }
          description={
            confirmAction.action === "suspend"
              ? "This educator will no longer be able to appear as an active tutor or accept new tutoring work."
              : "This educator account will become active and can resume tutoring, subject to the existing verification status."
          }
          onClose={() => setConfirmAction(null)}
          size="max-w-md"
        >
          <div className="space-y-5">
            <div className="flex gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {confirmAction.educator.name}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {confirmAction.action === "suspend"
                    ? "The educator's profile and tutoring history will be preserved. Only the account status will change."
                    : "The educator's existing profile and tutoring history will remain unchanged."}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={Boolean(busyKey)}
                onClick={() => setConfirmAction(null)}
                className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(busyKey)}
                onClick={updateAccountStatus}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition disabled:opacity-50 ${
                  confirmAction.action === "suspend"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {busyKey ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : confirmAction.action === "suspend" ? (
                  <Slash className="h-4 w-4" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {confirmAction.action === "suspend"
                  ? "Suspend educator"
                  : "Reactivate educator"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
