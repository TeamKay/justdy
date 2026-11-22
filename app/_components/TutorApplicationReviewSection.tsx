"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type TutorApplicationStatus = "Pending" | "Approved" | "Rejected";

type TutorApplicationRow = {
  id: string;
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
  status: TutorApplicationStatus;
  createdAt: Date | string;
};

type Props = {
  applications: TutorApplicationRow[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
};

const filters: Array<"All" | TutorApplicationStatus> = [
  "All",
  "Pending",
  "Approved",
  "Rejected",
];

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatHourlyRate(
  hourlyRate: number | null,
  currency: string,
) {
  if (hourlyRate === null) return "Not provided";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(hourlyRate / 100);
}

export default function TutorApplicationReviewSection({
  applications,
  stats,
}: Props) {
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<
    "All" | TutorApplicationStatus
  >("Pending");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingReview, setPendingReview] = useState<{
  id: string;
  name: string;
  action: "approve" | "reject";
} | null>(null);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        activeFilter === "All" || application.status === activeFilter;

      const searchableText = [
        application.name,
        application.email,
        application.headline,
        application.specialty,
        ...application.subjects,
        ...application.gradeLevels,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!term || searchableText.includes(term));
    });
  }, [applications, activeFilter, search]);

  async function reviewApplication(
  applicationId: string,
  action: "approve" | "reject",
) {
  setBusyId(applicationId);

  try {
    const response = await fetch(
      `/api/admin/tutor-applications/${applicationId}/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      },
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.error ||
          result?.message ||
          "Unable to review this application.",
      );
    }

    setPendingReview(null);

    toast.success(
      action === "approve"
        ? "Tutor application approved successfully."
        : "Tutor application rejected successfully.",
    );

    router.refresh();
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : "Something went wrong. Please try again.",
    );
  } finally {
    setBusyId(null);
  }
}

  const statCards = [
    { label: "Total applications", value: stats.total },
    { label: "Pending review", value: stats.pending },
    { label: "Approved", value: stats.approved },
    { label: "Rejected", value: stats.rejected },
  ];

  return (
    <section className="mb-10 space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Tutor onboarding
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
          New tutor applications
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review applications submitted through the public tutor registration
          page. Approval grants tutor access to the platform.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Application inbox
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {filteredApplications.length}{" "}
              {filteredApplications.length === 1 ? "application" : "applications"}
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search applicants..."
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary sm:max-w-xs"
          />
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
          {filters.map((filter) => {
            const count =
              filter === "All"
                ? stats.total
                : stats[filter.toLowerCase() as "pending" | "approved" | "rejected"];

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {filter} ({count})
              </button>
            );
          })}
        </div>


        {filteredApplications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-foreground">
              No applications found
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              There are no applications matching this filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredApplications.map((application) => {
              const isBusy = busyId === application.id;

              return (
                <article key={application.id} className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-foreground">
                          {application.name}
                        </h4>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            application.status === "Pending"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              : application.status === "Approved"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                          }`}
                        >
                          {application.status}
                        </span>
                      </div>

                      <p className="mt-1 break-all text-sm text-muted-foreground">
                        {application.email}
                      </p>

                      {application.phoneNumber ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {application.phoneNumber}
                        </p>
                      ) : null}
                    </div>

                    <p className="shrink-0 text-xs text-muted-foreground">
                      Submitted {formatDate(application.createdAt)}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Teaching headline
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {application.headline || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Specialty
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {application.specialty || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Experience
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {application.experience === null
                          ? "Not provided"
                          : `${application.experience} years`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Hourly rate
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {formatHourlyRate(
                          application.hourlyRate,
                          application.currency,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Subjects
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {application.subjects.length
                          ? application.subjects.join(", ")
                          : "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Grade levels
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {application.gradeLevels.length
                          ? application.gradeLevels.join(", ")
                          : "Not provided"}
                      </p>
                    </div>
                  </div>

                  {application.description ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        About the applicant
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">
                        {application.description}
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    {application.credentialUrl ? (
                      <a
                        href={application.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View credentials ↗
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No credential link provided
                      </span>
                    )}

                    {application.status === "Pending" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                         onClick={() =>
                            setPendingReview({
                                id: application.id,
                                name: application.name,
                                action: "reject",
                            })
                            }
                          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy ? "Please wait..." : "Reject"}
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                         onClick={() =>
                            setPendingReview({
                                id: application.id,
                                name: application.name,
                                action: "approve",
                            })
                            }
                          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy ? "Please wait..." : "Approve tutor"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {pendingReview ? (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (
        event.target === event.currentTarget &&
        busyId !== pendingReview.id
      ) {
        setPendingReview(null);
      }
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutor-review-title"
      aria-describedby="tutor-review-description"
      className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
    >
      <div className="p-6">
        <div
          className={`flex size-12 items-center justify-center rounded-xl ${
            pendingReview.action === "approve"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-rose-500/10 text-rose-600"
          }`}
        >
          {pendingReview.action === "approve" ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-6"
              aria-hidden="true"
            >
              <path
                d="m5 12 4 4L19 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-6"
              aria-hidden="true"
            >
              <path
                d="M18 6 6 18M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        <h3
          id="tutor-review-title"
          className="mt-5 text-lg font-bold text-foreground"
        >
          {pendingReview.action === "approve"
            ? "Approve tutor application?"
            : "Reject tutor application?"}
        </h3>

        <p
          id="tutor-review-description"
          className="mt-2 text-sm leading-6 text-muted-foreground"
        >
          Are you sure you want to{" "}
          {pendingReview.action === "approve" ? "approve" : "reject"} the
          application submitted by{" "}
          <span className="font-semibold text-foreground">
            {pendingReview.name}
          </span>
          ?
        </p>

        {pendingReview.action === "approve" ? (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              What happens next?
            </p>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
              <li>• The applicant receives tutor access.</li>
              <li>• Their tutor profile is created and verified.</li>
              <li>• Guest applicants are sent account setup emails.</li>
            </ul>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
            <p className="text-xs leading-5 text-muted-foreground">
              This application will be marked as rejected. The applicant will
              not receive tutor access through this application.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
        <button
          type="button"
          disabled={busyId === pendingReview.id}
          onClick={() => setPendingReview(null)}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={busyId === pendingReview.id}
          onClick={() =>
            reviewApplication(pendingReview.id, pendingReview.action)
          }
          className={`inline-flex min-w-32 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
            pendingReview.action === "approve"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-rose-600 hover:bg-rose-700"
          }`}
        >
          {busyId === pendingReview.id ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Processing...
            </>
          ) : pendingReview.action === "approve" ? (
            "Yes, approve"
          ) : (
            "Yes, reject"
          )}
        </button>
      </div>
    </div>
  </div>
) : null}
    </section>
  );
}