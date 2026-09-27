"use client";

import { Check, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SaveImageResourceButtonProps {
  generationId: string;
  title?: string;
  description?: string;
}

export default function SaveImageResourceButton({
  generationId,
  title,
  description,
}: SaveImageResourceButtonProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (saving || saved) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/resources/image/${encodeURIComponent(generationId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            title,
            description,
          }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
        resource?: { id?: string };
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to save image to your library.",
        );
      }

      setSaved(true);

      window.dispatchEvent(new Event("justdy:library-updated"));

      if (data.resource?.id) {
        window.setTimeout(() => {
          router.push("/library");
        }, 450);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save image to your library.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving || saved}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? "Saving…" : saved ? "Saved to Library" : "Save to Library"}
      </button>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
