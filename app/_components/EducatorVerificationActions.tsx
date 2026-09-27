"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  educatorId: string;
  status: string;
  onComplete?: () => void | Promise<void>;
};

export default function EducatorVerificationActions({
  educatorId,
  status,
  onComplete,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"verify" | "reject" | null>(null);

  async function updateVerification(action: "verify" | "reject") {
    setLoading(action);

    try {
      const response = await fetch(
        `/api/admin/educators/${educatorId}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to update educator verification.",
        );
      }

      await onComplete?.();
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
      {status !== "Verified" ? (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => updateVerification("verify")}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading === "verify" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Verify
        </button>
      ) : null}

      {status !== "Rejected" ? (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => updateVerification("reject")}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading === "reject" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Reject
        </button>
      ) : null}
    </div>
  );
}
