"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import EducatorVerificationActions from "@/app/_components/EducatorVerificationActions";

type TeachingApplication = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
  role: string | null;
  accountStatus: string;
  headline: string | null;
  specialty: string | null;
  experience: number | null;
  description: string | null;
  hourlyRate: number | null;
  currency: string;
  verificationStatus: string;
  subjects: unknown;
  gradeLevels: unknown;
  canTeach: boolean;
  canTutor: boolean;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  initialCount?: number;
};

function formatMoney(amount: number | null, currency: string) {
  if (amount == null) return "Rate not set";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function getListValues(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
}

export default function PendingTeachingApplications({
  initialCount = 0,
}: Props) {
  const [applications, setApplications] = useState<TeachingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/educators", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load teaching applications.",
        );
      }

      return {
        applications: (data.applications ?? []) as TeachingApplication[],
        error: null as string | null,
      };
    } catch (err) {
      return {
        applications: [] as TeachingApplication[],
        error:
          err instanceof Error
            ? err.message
            : "Unable to load teaching applications.",
      };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/educators", {
      method: "GET",
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to load teaching applications.",
          );
        }

        if (!cancelled) {
          setApplications(data.applications ?? []);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load teaching applications.",
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshAfterAction() {
    const result = await loadApplications();

    setApplications(result.applications);
    setError(result.error);
  }

  const pendingCount = applications.length || initialCount;

  return (
    <section className="rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              Teaching applications
            </h2>

            {pendingCount > 0 ? (
              <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                {pendingCount}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Review teaching profiles before enabling teaching and tutoring.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          Admin verification
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="flex min-h-32 items-center justify-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading teaching applications…
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Unable to load applications</p>
                <p className="mt-1">{error}</p>
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    const result = await loadApplications();
                    setApplications(result.applications);
                    setError(result.error);
                    setLoading(false);
                  }}
                  className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border px-5 py-8 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="mt-3 font-semibold">No pending applications</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              There are currently no teaching profiles waiting for admin
              verification.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const subjects = getListValues(application.subjects);
              const gradeLevels = getListValues(application.gradeLevels);

              return (
                <article
                  key={application.id}
                  className="rounded-2xl border border-border/70 bg-background p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      {application.imageUrl ? (
                        <Image
                          src={application.imageUrl}
                          alt={application.name ?? "Teaching applicant"}
                          width={52}
                          height={52}
                          className="h-13 w-13 shrink-0 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                          <UserRound className="h-6 w-6" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold">
                            {application.name || "Unnamed applicant"}
                          </h3>

                          {application.role?.toUpperCase() === "ADMIN" ? (
                            <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                              Admin
                            </span>
                          ) : null}

                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            <Clock3 className="h-3 w-3" />
                            Pending
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {application.email}
                        </p>

                        <p className="mt-3 text-sm font-medium">
                          {application.headline ||
                            application.specialty ||
                            "Teaching profile"}
                        </p>

                        {application.description ? (
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                            {application.description}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <EducatorVerificationActions
                        educatorId={application.userId}
                        status={application.verificationStatus}
                        onComplete={refreshAfterAction}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-border/60 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Specialty
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {application.specialty || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Experience
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {application.experience != null
                          ? `${application.experience} years`
                          : "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Hourly rate
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatMoney(
                          application.hourlyRate,
                          application.currency,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Account
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {application.accountStatus}
                      </p>
                    </div>
                  </div>

                  {(subjects.length > 0 || gradeLevels.length > 0) && (
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                      {subjects.length > 0 ? (
                        <div>
                          <span className="font-semibold">Subjects:</span>{" "}
                          <span className="text-muted-foreground">
                            {subjects.join(", ")}
                          </span>
                        </div>
                      ) : null}

                      {gradeLevels.length > 0 ? (
                        <div>
                          <span className="font-semibold">Grade levels:</span>{" "}
                          <span className="text-muted-foreground">
                            {gradeLevels.join(", ")}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
