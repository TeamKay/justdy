"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

type ApplicationStatus =
  | "Pending"
  | "Verified"
  | "Rejected";

type Props = {
  educatorId: string;
  status: ApplicationStatus | string;
  onComplete?: () =>
    | void
    | Promise<void>;
};

export default function EducatorVerificationActions({
  educatorId,
  status,
  onComplete,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState<
      "verify" | "reject" | null
    >(null);

  /*
   * Only pending applications require
   * an administrator decision.
   *
   * Verified profiles are already approved.
   * Rejected profiles must be resubmitted by
   * the applicant before they can be reviewed
   * again.
   */
  const isPending =
    status === "Pending";

  if (!isPending) {
    return (
      <span className="text-xs font-medium text-muted-foreground">
        {status === "Verified"
          ? "Approved"
          : status === "Rejected"
            ? "Awaiting resubmission"
            : "No action"}
      </span>
    );
  }

  async function updateVerification(
    action: "verify" | "reject",
  ) {
    if (loading !== null) {
      return;
    }

    setLoading(action);

    try {
      const response =
        await fetch(
          `/api/admin/educators/${educatorId}/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action,
            }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Unable to update educator verification.",
        );
      }

      await onComplete?.();

      /*
       * Refresh the server-rendered
       * application list so the updated
       * status is immediately reflected.
       */
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to update verification.",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <button
        type="button"
        disabled={loading !== null}
        onClick={() =>
          updateVerification("verify")
        }
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading === "verify" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}

        Verify
      </button>

      <button
        type="button"
        disabled={loading !== null}
        onClick={() =>
          updateVerification("reject")
        }
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading === "reject" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}

        Reject
      </button>
    </div>
  );
}