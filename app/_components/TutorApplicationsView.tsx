"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  GraduationCap,
  Mail,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

import EducatorVerificationActions from "@/app/_components/EducatorVerificationActions";

type ApplicationStatus = "Pending" | "Verified" | "Rejected";

type TutorApplication = {
  id: string;
  userId: string;
  headline: string | null;
  specialty: string | null;
  experience: number | null;
  credentialUrl: string | null;
  description: string | null;
  verificationStatus: ApplicationStatus;
  hourlyRate: number | null;
  currency: string;
  subjects: string[];
  gradeLevels: string[];
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
    emailVerified: boolean;
    status: string;
    createdAt: Date;
  };
};

type Props = {
  applications: TutorApplication[];
  selectedStatus: ApplicationStatus;
  stats: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "JU"
  );
}

function formatDate(date: Date | null) {
  if (!date) return "Never";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatRelativeDate(date: Date | null) {
  if (!date) return "No date";

  const diff = Math.max(0, Date.now() - new Date(date).getTime());

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 30) return `${days}d ago`;

  return formatDate(date);
}

function formatHourlyRate(amount: number | null, currency: string) {
  if (amount === null || amount === undefined) {
    return "Rate not set";
  }

  const value = amount / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || "USD"} ${value.toFixed(2)}`;
  }
}

function statusClassName(status: ApplicationStatus) {
  if (status === "Verified") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }

  if (status === "Rejected") {
    return "bg-rose-500/10 text-rose-700 dark:text-rose-400";
  }

  return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
}

function statusIcon(status: ApplicationStatus) {
  if (status === "Verified") {
    return <CheckCircle2 className="size-3.5" />;
  }

  if (status === "Rejected") {
    return <XCircle className="size-3.5" />;
  }

  return <Clock3 className="size-3.5" />;
}

export default function TutorApplicationsView({
  applications,
  selectedStatus,
  stats,
}: Props) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<ApplicationStatus>(selectedStatus);

  const filteredApplications = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return applications.filter((application) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        application.user.name.toLowerCase().includes(normalizedQuery) ||
        application.user.email.toLowerCase().includes(normalizedQuery) ||
        (application.headline ?? "").toLowerCase().includes(normalizedQuery) ||
        (application.specialty ?? "").toLowerCase().includes(normalizedQuery) ||
        application.subjects.some((subject) =>
          subject.toLowerCase().includes(normalizedQuery),
        ) ||
        application.gradeLevels.some((grade) =>
          grade.toLowerCase().includes(normalizedQuery),
        )
      );
    });
  }, [applications, query]);

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = event.target.value as ApplicationStatus;

    setStatus(nextStatus);

    window.location.href = `/admin/educators?status=${encodeURIComponent(
      nextStatus,
    )}`;
  };

  return (
    <main className="min-h-full bg-muted/20">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-border/70 pb-6 mt-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Tutor Applications
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Review educators who have applied to become tutors.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
            <GraduationCap className="size-4" />

            <span>{stats.pending.toLocaleString()} awaiting review</span>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm">
          <div className="border-b border-border/70 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Tutor applications
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {filteredApplications.length.toLocaleString()} of{" "}
                  {applications.length.toLocaleString()} applications shown
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 sm:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search applicants..."
                    className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <label className="relative">
                  <span className="sr-only">Filter applications</span>

                  <select
                    value={status}
                    onChange={handleStatusChange}
                    className="h-10 appearance-none rounded-xl border border-border bg-background pl-3 pr-9 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="Pending">Pending applications</option>

                    <option value="Verified">Verified tutors</option>

                    <option value="Rejected">Rejected applications</option>
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </label>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left">
              <thead className="border-b border-border/70 bg-muted/20">
                <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3.5 sm:px-6">Applicant</th>

                  <th className="px-5 py-3.5">Application</th>

                  <th className="px-5 py-3.5">Teaching details</th>

                  <th className="px-5 py-3.5">Rate</th>

                  <th className="px-5 py-3.5">Submitted</th>

                  <th className="px-5 py-3.5">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {filteredApplications.map((application) => (
                  <tr
                    key={application.id}
                    className="align-top transition hover:bg-muted/20"
                  >
                    <td className="px-5 py-5 sm:px-6">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-xs font-semibold text-primary">
                          {application.user.imageUrl ? (
                            <img
                              src={application.user.imageUrl}
                              alt={application.user.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            initials(application.user.name)
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {application.user.name}
                          </p>

                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="size-3.5 shrink-0" />

                            <span className="truncate">
                              {application.user.email}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClassName(
                                application.verificationStatus,
                              )}`}
                            >
                              {statusIcon(application.verificationStatus)}

                              {application.verificationStatus}
                            </span>

                            {application.user.emailVerified ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                                <CheckCircle2 className="size-3" />
                                Email verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                                Email unverified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="max-w-[300px] px-5 py-5">
                      <p className="text-sm font-semibold text-foreground">
                        {application.headline || "No teaching headline"}
                      </p>

                      {application.specialty ? (
                        <p className="mt-1 text-xs font-medium text-primary">
                          {application.specialty}
                        </p>
                      ) : null}

                      {application.description ? (
                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                          {application.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          No teaching description provided.
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-5">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Experience
                          </p>

                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {application.experience !== null
                              ? `${application.experience} ${
                                  application.experience === 1
                                    ? "year"
                                    : "years"
                                }`
                              : "Not provided"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Subjects
                          </p>

                          <div className="mt-1 flex max-w-[260px] flex-wrap gap-1">
                            {application.subjects.length ? (
                              application.subjects
                                .slice(0, 4)
                                .map((subject) => (
                                  <span
                                    key={subject}
                                    className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground"
                                  >
                                    {subject}
                                  </span>
                                ))
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Not provided
                              </span>
                            )}

                            {application.subjects.length > 4 ? (
                              <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                                +{application.subjects.length - 4}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Grade levels
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {application.gradeLevels.length
                              ? application.gradeLevels.join(", ")
                              : "Not provided"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <p className="text-sm font-semibold text-foreground">
                        {formatHourlyRate(
                          application.hourlyRate,
                          application.currency,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Per tutoring hour
                      </p>
                    </td>

                    <td className="px-5 py-5">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(application.createdAt)}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="size-3.5" />

                        {formatRelativeDate(application.createdAt)}
                      </p>

                      {application.credentialUrl ? (
                        <a
                          href={application.credentialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:underline"
                        >
                          View credentials
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : (
                        <span className="mt-3 block text-xs text-muted-foreground">
                          No credential link
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-5">
                      <EducatorVerificationActions
                        educatorId={application.id}
                        status={application.verificationStatus}
                      />
                    </td>
                  </tr>
                ))}

                {!filteredApplications.length ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                          <Search className="size-5" />
                        </div>

                        <h3 className="mt-4 text-sm font-semibold">
                          No tutor applications found
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Try another search term or select a different
                          application status.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
