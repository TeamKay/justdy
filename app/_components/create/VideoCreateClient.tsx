"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Film,
  Loader2,
  Monitor,
  Save,
  Smartphone,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";

import { StudioShell } from "@/app/_components/create/StudioShell";

type VideoDuration = 2 | 4 | 5 | 6 | 8 | 10;
type VideoAspectRatio = "16:9" | "9:16";
type VideoModel = "sora-2" | "sora-2-pro";

type Generation = {
  id: string;
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: number;
  aspectRatio: string;
  model: string | null;
  creditsUsed: number;
  errorMessage: string | null;
};

const CREDIT_COSTS: Record<VideoModel, Record<VideoDuration, number>> = {
  // Runway Gen-4.5 is billed at 12 credits per second.
  "sora-2": { 2: 24, 4: 48, 5: 60, 6: 72, 8: 96, 10: 120 },
  "sora-2-pro": { 2: 24, 4: 48, 5: 60, 6: 72, 8: 96, 10: 120 },
};

const DURATIONS: VideoDuration[] = [2, 4, 5, 6, 8, 10];

const MODELS: Array<{
  value: VideoModel;
  label: string;
  description: string;
}> = [
  {
    value: "sora-2",
    label: "Standard",
    description: "Fast generation for everyday educational videos.",
  },
  {
    value: "sora-2-pro",
    label: "Pro",
    description: "Higher-end generation for more demanding visuals.",
  },
];


function FramePreview({ ratio }: { ratio: string }) {
  const [width, height] = ratio.split(":").map(Number);
  const aspect = width / height;
  const previewWidth = aspect >= 1 ? 34 : Math.max(18, 34 * aspect);
  const previewHeight = aspect >= 1 ? Math.max(18, 34 / aspect) : 34;

  return (
    <span
      aria-hidden="true"
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-white/20 bg-white/[0.06]"
      style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
    >
      <span className="absolute inset-[3px] rounded-[2px] border border-white/10 bg-gradient-to-br from-white/[0.16] via-white/[0.04] to-transparent" />
      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/35" />
    </span>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
  disabled,
  visual = false,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  visual?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const frameOptions = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"];

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-lg border border-border/70 bg-background px-2.5 text-[11px] font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {visual ? <FramePreview ratio={value} /> : null}
        <span className="text-muted-foreground/60">{label}</span>
        <span className="max-w-[110px] truncate text-foreground">{value}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
      </button>

      {open && !disabled ? (
        <div className="absolute bottom-[calc(100%+0.5rem)] left-0 z-[100] min-w-[230px] overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-2xl">
          {options.map((option) => {
            const showFrame = visual && frameOptions.includes(option);
            const supported = !showFrame || option === "16:9" || option === "9:16";

            return (
              <button
                key={option}
                type="button"
                disabled={!supported}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                  value === option ? "bg-primary/5 text-primary" : "hover:bg-muted"
                } ${!supported ? "cursor-not-allowed opacity-40" : ""}`}
              >
                {showFrame ? <FramePreview ratio={option} /> : null}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{option}</span>
                  {showFrame ? (
                    <span className="block text-[10px] text-muted-foreground">
                      {option === "16:9"
                        ? "Landscape · text-to-video"
                        : option === "9:16"
                          ? "Portrait · text-to-video"
                          : "Available with image-to-video"}
                    </span>
                  ) : null}
                </span>
                {value === option ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function VideoCreateClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [prompt, setPrompt] = React.useState(
    searchParams.get("prompt") ?? "",
  );
  const [duration, setDuration] = React.useState<VideoDuration>(8);
  const [aspectRatio, setAspectRatio] =
    React.useState<VideoAspectRatio>("16:9");
  const [model, setModel] = React.useState<VideoModel>("sora-2");

  const [generating, setGenerating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [generationId, setGenerationId] = React.useState<string | null>(null);
  const [generation, setGeneration] = React.useState<Generation | null>(null);
  const [savedResourceId, setSavedResourceId] = React.useState<string | null>(
    null,
  );
  const [modalOpen, setModalOpen] = React.useState(false);
  const [generationAspectRatio, setGenerationAspectRatio] =
    React.useState<VideoAspectRatio>("16:9");
  const [error, setError] = React.useState<string | null>(null);

  const projectId = searchParams.get("projectId") ?? undefined;
  const estimatedCredits = CREDIT_COSTS[model][duration];

  const isProcessing =
    generating ||
    generation?.status === "PENDING" ||
    generation?.status === "PROCESSING";

  const pollGeneration = React.useCallback((id: string) => {
    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/ai/video/${encodeURIComponent(id)}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Unable to check video generation.");
        }

        const nextGeneration = data.generation as Generation;
        setGeneration(nextGeneration);

        if (nextGeneration.status === "COMPLETED") {
          setGenerating(false);
          setModalOpen(true);
          return;
        }

        if (
          nextGeneration.status === "FAILED" ||
          nextGeneration.status === "CANCELLED"
        ) {
          setGenerating(false);
          setModalOpen(false);
          setError(
            nextGeneration.errorMessage ||
              "The video generation did not complete.",
          );
          return;
        }

        window.setTimeout(() => {
          void poll();
        }, 5000);
      } catch (err) {
        setGenerating(false);
        setModalOpen(false);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to check video generation.",
        );
      }
    };

    void poll();
  }, []);

  async function generate() {
    const trimmed = prompt.trim();

    if (!trimmed || isProcessing || saving) return;

    setGenerating(true);
    setGenerationAspectRatio(aspectRatio);
    setModalOpen(true);
    setError(null);
    setGeneration(null);
    setGenerationId(null);
    setSavedResourceId(null);

    try {
      const response = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          prompt: trimmed,
          duration,
          aspectRatio,
          model,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error(
            data.error ||
              `Insufficient AI credits. You need ${
                data.required ?? estimatedCredits
              } credits.`,
          );
        }

        throw new Error(data.error || "Unable to start video generation.");
      }

      const id = data.generation?.id;

      if (!id) {
        throw new Error(
          "Video generation started, but no generation ID was returned.",
        );
      }

      setGenerationId(id);
      setGeneration({
        id,
        status: data.generation.status ?? "PENDING",
        videoUrl: null,
        thumbnailUrl: null,
        duration: data.generation.duration ?? duration,
        aspectRatio: data.generation.aspectRatio ?? aspectRatio,
        model: data.generation.model ?? model,
        creditsUsed: data.generation.creditsUsed ?? estimatedCredits,
        errorMessage: null,
      });

      window.setTimeout(() => {
        void pollGeneration(id);
      }, 3000);
    } catch (err) {
      setGenerating(false);
      setModalOpen(false);
      setError(
        err instanceof Error ? err.message : "Unable to generate the video.",
      );
    }
  }

  async function saveToLibrary() {
    if (!generationId || generation?.status !== "COMPLETED" || saving) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/resources/video/${encodeURIComponent(generationId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            projectId,
            title: prompt.trim().slice(0, 120) || "AI Video",
            description: `AI-generated video based on: ${prompt.trim()}`,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to save the video to My Library.");
      }

      const resourceId =
        typeof data.resource?.id === "string"
          ? data.resource.id
          : typeof data.resourceId === "string"
            ? data.resourceId
            : null;

      if (!resourceId) {
        throw new Error("The video was saved, but no resource ID was returned.");
      }

      setSavedResourceId(resourceId);

      window.dispatchEvent(
        new CustomEvent("justdy:resource-created", {
          detail: { resourceId, type: "VIDEO" },
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save the video.",
      );
    } finally {
      setSaving(false);
    }
  }

  function closePreview() {
    if (isProcessing) return;
    setModalOpen(false);
  }

  const videoSrc =
    generation?.status === "COMPLETED" && generationId
      ? `/api/ai/video/${encodeURIComponent(generationId)}/content`
      : null;

  const previewAspectRatio =
    generationAspectRatio || aspectRatio;

  const previewFrameClass =
    previewAspectRatio === "9:16"
      ? "aspect-[9/16] w-full max-w-[420px]"
      : "aspect-[16/9] w-full max-w-[1000px]";

  return (
    <StudioShell title="Video Studio" icon={<Film className="size-3.5" />}>
      <div
        className="relative min-h-full overflow-hidden bg-white text-foreground"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="pointer-events-none absolute inset-0" />
        <div className="relative z-10 mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-3 sm:px-6 lg:px-8">
          <section className="flex min-h-0 flex-1 items-center justify-center py-6 sm:py-10">
            <div className="flex w-full max-w-4xl flex-col">
              <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-7">
                <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl lg:text-4xl">
                  Create a video
                </h1>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Describe the lesson visual, scene, animation, or story you
                  want Justdy to create.
                </p>
              </div>

              <div className="mx-auto w-full max-w-3xl">
                <div className="relative overflow-visible rounded-lg border border-border/80 bg-card shadow-xl shadow-black/4 dark:shadow-black/30">
                  <textarea
                    autoFocus
                    id="video-prompt"
                    value={prompt}
                    disabled={isProcessing || saving}
                    onChange={(event) => setPrompt(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                        event.preventDefault();
                        void generate();
                      }
                    }}
                    maxLength={4000}
                    rows={5}
                    placeholder="Example: A friendly teacher explains the water cycle in a bright classroom while simple animated diagrams appear beside her..."
                    className="block min-h-[150px] w-full resize-none rounded-none border-0 bg-transparent px-5 py-4 text-sm leading-6 outline-none placeholder:text-muted-foreground/55 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[175px] sm:px-6 sm:py-5 sm:text-[15px]"
                  />

                  <div className="relative z-30 rounded-b-[24px] border-t border-border/70 bg-muted/20 px-3 py-3 sm:px-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <FieldSelect
                          label="Duration"
                          value={`${duration}s`}
                          options={DURATIONS.map((value) => `${value}s`)}
                          onChange={(value) =>
                            setDuration(Number(value.replace("s", "")) as VideoDuration)
                          }
                          disabled={isProcessing || saving}
                        />

                        <FieldSelect
                          label="Format"
                          value={aspectRatio}
                          options={["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"]}
                          onChange={(value) =>
                            setAspectRatio(value as VideoAspectRatio)
                          }
                          disabled={isProcessing || saving}
                          visual
                        />

                        <FieldSelect
                          label="Quality"
                          value={model === "sora-2" ? "Standard" : "Pro"}
                          options={MODELS.map((option) => option.label)}
                          onChange={(value) =>
                            setModel(value === "Pro" ? "sora-2-pro" : "sora-2")
                          }
                          disabled={isProcessing || saving}
                        />

                        <div className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-2.5 text-[11px] font-medium">
                          <WalletCards className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Cost</span>
                          <span className="text-foreground">{estimatedCredits}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void generate()}
                        disabled={!prompt.trim() || isProcessing || saving}
                        className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[10px] text-muted-foreground">
                      <span>
                        {aspectRatio === "16:9" ? "Landscape" : "Portrait"} · {duration}s · {model === "sora-2" ? "Standard" : "Pro"}
                      </span>
                      <span>{prompt.length}/4000</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="mr-1">Try:</span>
                  {[
                    "A teacher explains photosynthesis",
                    "An animated solar system lesson",
                    "A cinematic rainforest ecosystem",
                  ].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setPrompt(example)}
                      disabled={isProcessing || saving}
                      className="rounded-full border border-border/70 bg-card px-3 py-1.5 shadow-sm transition hover:border-primary/30 hover:text-foreground disabled:opacity-50"
                    >
                      {example}
                    </button>
                  ))}
                </div>

                {error ? (
                  <div className="mx-auto mt-4 max-w-3xl rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                    {error}
                  </div>
                ) : null}

                <p className="mt-5 text-center text-[11px] text-muted-foreground">
                  Describe the subject, action, setting, style, and camera movement when those details matter.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 backdrop-blur-md sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={
            generation?.status === "COMPLETED"
              ? "Generated video preview"
              : "Video generation progress"
          }
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isProcessing) {
              closePreview();
            }
          }}
        >
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-border bg-card shadow-2xl sm:max-h-[calc(100vh-3rem)]">
            <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Film className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {generation?.status === "COMPLETED"
                      ? "Your video is ready"
                      : "Creating your video"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {generation?.status === "COMPLETED"
                      ? "Review the result before saving it to My Library."
                      : "Justdy is generating your video. This may take a little while."}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/70">
                    <span>{previewAspectRatio}</span>
                    <span>•</span>
                    <span>{generation?.duration ?? duration}s</span>
                  </div>
                </div>
              </div>

              {!isProcessing ? (
                <button
                  type="button"
                  onClick={closePreview}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Close video preview"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {isProcessing ? (
              <div className="min-h-0 flex-1 overflow-auto bg-muted/50 p-3 dark:bg-background/80 sm:p-6">
                <div className="flex min-h-full items-center justify-center">
                  <div className={`${previewFrameClass} relative overflow-hidden rounded-2xl border border-border/70 bg-black shadow-lg`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full max-w-sm px-6 text-center">
                  <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-border/70 bg-background shadow-sm">
                    <div className="relative flex h-24 w-24 items-center justify-center">
                      <div
                        className="absolute inset-0 rounded-full border-[5px] border-muted"
                        aria-hidden="true"
                      />
                      <div
                        className="absolute inset-0 animate-spin rounded-full border-[5px] border-transparent border-t-primary border-r-primary"
                        aria-hidden="true"
                      />
                      <Film className="h-9 w-9 text-primary" aria-hidden="true" />
                    </div>
                  </div>

                  <p className="mt-6 text-sm font-semibold">
                    Justdy AI is creating your video
                  </p>

                  <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                    Rendering the scene, motion, composition, and visual details from your prompt.
                  </p>

                  <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    Working on it...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            ) : generation?.status === "COMPLETED" && videoSrc ? (
              <>
                <div className="min-h-0 flex-1 overflow-auto bg-muted/50 p-3 dark:bg-background/80 sm:p-6">
                  <div className="flex min-h-full items-center justify-center">
                    <div className={`${previewFrameClass} relative overflow-hidden rounded-2xl border border-border/70 bg-black shadow-lg`}>
                      <video
                        key={`${videoSrc}-${previewAspectRatio}`}
                        src={videoSrc}
                        controls
                        autoPlay
                        playsInline
                        className="absolute inset-0 size-full object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 border-t border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div className="text-xs text-muted-foreground">
                    {generation.duration}s · {generation.aspectRatio} · {generation.creditsUsed} credits
                  </div>

                  <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                    <a
                      href={videoSrc}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold transition hover:bg-muted sm:flex-none"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Open
                    </a>

                    <button
                      type="button"
                      onClick={() => void saveToLibrary()}
                      disabled={saving || Boolean(savedResourceId)}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    >
                      {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : savedResourceId ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      {savedResourceId ? "Saved to My Library" : saving ? "Saving..." : "Save to My Library"}
                    </button>
                  </div>
                </div>

                {savedResourceId ? (
                  <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Saved to My Library
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/library")}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Open My Library →
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex min-h-[440px] flex-1 items-center justify-center p-6 text-center">
                <div>
                  <Film className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-medium">No video preview yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </StudioShell>
  );
}
