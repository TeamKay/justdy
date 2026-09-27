"use client";

import { Check, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SavePresentationResourceButtonProps {
  generationId: string;
  title?: string;
  description?: string;
  content?: unknown;
}

export default function SavePresentationResourceButton({
  generationId,
  title,
  description,
  content,
}: SavePresentationResourceButtonProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!generationId || saving || saved) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/resources/presentation/${encodeURIComponent(generationId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            content,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to save presentation to Library.",
        );
      }

      setSaved(true);

      window.setTimeout(() => {
        router.push("/library");
        router.refresh();
      }, 500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save presentation to Library.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || saved || !generationId}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <Check className="h-4 w-4" />
            Saved to Library
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save to Library
          </>
        )}
      </button>

      {error ? (
        <p className="max-w-xs text-right text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
