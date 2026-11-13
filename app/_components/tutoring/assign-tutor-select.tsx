"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type Tutor = {
  id: string;
  name: string;
  email: string;
  assignmentLabel?: string;
};

export default function AssignTutorSelect({
  requestId,
  initialTutorId,
  tutors,
}: {
  requestId: string;
  initialTutorId: string;
  tutors: Tutor[];
}) {
  const [tutorId, setTutorId] = useState(initialTutorId);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function saveAssignment() {
    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/tutoring-requests/${encodeURIComponent(requestId)}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ tutorId: tutorId || null }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not save tutor assignment.");
      }

      if (tutorId && data.tutorEmailSent === true) {
        toast.success("Tutor assigned and notification email sent.");
      } else if (tutorId && data.tutorEmailSent === false) {
        toast.warning(
          "Tutor assigned, but the notification email failed. Check server logs.",
        );
      } else {
        toast.success(
          tutorId ? "Tutor assignment saved." : "Tutor assignment removed.",
        );
      }

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save tutor assignment.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex w-[21rem] max-w-[calc(100vw-3rem)] flex-col gap-2 sm:flex-row sm:items-center">
      <select
        aria-label="Assign tutor"
        value={tutorId}
        onChange={(event) => setTutorId(event.target.value)}
        disabled={saving}
        className="h-10 w-full min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm"
      >
        <option value="">Unassigned</option>
        {tutors.map((tutor) => (
          <option key={tutor.id} value={tutor.id}>
            {tutor.assignmentLabel ?? `${tutor.name} — ${tutor.email}`}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={saveAssignment}
        disabled={saving || tutorId === initialTutorId}
        aria-label={
          saving ? "Saving tutor assignment" : "Save tutor assignment"
        }
        title={saving ? "Saving assignment…" : "Save assignment"}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-800 bg-emerald-900 text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
