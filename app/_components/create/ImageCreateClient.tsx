"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";

import { StudioShell } from "@/app/_components/create/StudioShell";

type GeneratedImage = {
  url: string;
  generationId: string | null;
  assetId: string | null;
};

type DesignPreset = {
  id: string;
  label: string;
  prompt: string;
};

const PRESETS: DesignPreset[] = [
  {
    id: "professional",
    label: "Professional",
    prompt:
      "Redesign this image with a polished, professional visual system. Improve composition, hierarchy, lighting, typography if present, spacing, and overall finish while preserving the important subject and meaning.",
  },
  {
    id: "educational",
    label: "Educational",
    prompt:
      "Transform this into a clear, engaging educational visual suitable for students. Keep the important concepts recognizable, improve visual hierarchy, add helpful visual structure, and make it polished and easy to understand.",
  },
  {
    id: "modern",
    label: "Modern",
    prompt:
      "Give this image a modern premium redesign with cleaner composition, contemporary styling, refined lighting, stronger contrast, and professional visual details while preserving the core subject.",
  },
  {
    id: "creative",
    label: "Creative",
    prompt:
      "Reimagine this image creatively with an impressive, original art direction, richer visual storytelling, refined composition, and high-end details while preserving the core idea.",
  },
  {
    id: "clean",
    label: "Clean up",
    prompt:
      "Clean up and enhance this image. Remove distracting visual elements, improve clarity, lighting, composition, edges, and polish while keeping the original subject and intent recognizable.",
  },
];

export default function ImageCreateClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const sourcePreviewUrlRef = React.useRef<string | null>(null);

  const [prompt, setPrompt] = React.useState(searchParams.get("prompt") ?? "");
  const [generating, setGenerating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [sourceFile, setSourceFile] = React.useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = React.useState<string | null>(
    null,
  );
  const [dragging, setDragging] = React.useState(false);

  const [image, setImage] = React.useState<GeneratedImage | null>(null);
  const [savedResourceId, setSavedResourceId] = React.useState<string | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [presetId, setPresetId] = React.useState("professional");

  const projectId = searchParams.get("projectId") ?? undefined;
  const isRedesign = Boolean(sourceFile);

  React.useEffect(() => {
    return () => {
      if (sourcePreviewUrlRef.current) {
        URL.revokeObjectURL(sourcePreviewUrlRef.current);
        sourcePreviewUrlRef.current = null;
      }
    };
  }, []);

  function acceptImage(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a PNG, JPEG, WEBP, or another supported image.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("Please choose an image smaller than 20 MB.");
      return;
    }

    setError(null);

    if (sourcePreviewUrlRef.current) {
      URL.revokeObjectURL(sourcePreviewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    sourcePreviewUrlRef.current = previewUrl;
    setSourcePreviewUrl(previewUrl);
    setSourceFile(file);
    setImage(null);
    setSavedResourceId(null);
  }

  function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    acceptImage(event.target.files?.[0]);
    event.target.value = "";
  }

  function removeSourceImage() {
    if (sourcePreviewUrlRef.current) {
      URL.revokeObjectURL(sourcePreviewUrlRef.current);
      sourcePreviewUrlRef.current = null;
    }

    setSourcePreviewUrl(null);
    setSourceFile(null);
    setImage(null);
    setSavedResourceId(null);
    setError(null);
  }

  function applyPreset(preset: DesignPreset) {
    setPresetId(preset.id);
    setPrompt((current) => {
      const trimmed = current.trim();
      if (!trimmed) return preset.prompt;
      return `${trimmed}\n\nDesign direction: ${preset.prompt}`;
    });
  }

  async function generate() {
    const trimmed = prompt.trim();

    if (!trimmed || generating || saving) return;

    setGenerating(true);
    setError(null);
    setImage(null);
    setSavedResourceId(null);

    try {
      let response: Response;

      if (sourceFile) {
        const formData = new FormData();
        formData.append("image", sourceFile);
        formData.append("prompt", trimmed);
        formData.append("model", "gpt-image-2");
        formData.append("size", "1024x1024");
        formData.append("quality", "medium");
        formData.append("outputFormat", "png");
        if (projectId) formData.append("projectId", projectId);

        response = await fetch("/api/ai/image/edit", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
      } else {
        response = await fetch("/api/ai/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            prompt: trimmed,
            model: "gpt-image-2",
            size: "1024x1024",
            quality: "medium",
            outputFormat: "png",
            background: "auto",
            projectId,
          }),
        });
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const code =
          typeof data?.code === "string" ? data.code : "";
        const providerRequestId =
          typeof data?.requestId === "string" ? data.requestId : "";

        if (code === "IMAGE_SAFETY_REJECTED") {
          const suffix = providerRequestId
            ? ` Support request ID: ${providerRequestId}.`
            : "";

          throw new Error(
            `OpenAI's safety system rejected this image request. Try a different prompt${sourceFile ? " or a different source image" : ""}.${suffix}`,
          );
        }

        throw new Error(data?.error || "Unable to create the image.");
      }

      const url =
        data.image?.url ??
        data.generation?.url ??
        data.generation?.imageUrl ??
        data.url ??
        data.imageUrl ??
        null;

      if (!url) {
        throw new Error(
          "The image was created, but no image URL was returned.",
        );
      }

      const generationId =
        typeof data.image?.generationId === "string"
          ? data.image.generationId
          : typeof data.generation?.generationId === "string"
            ? data.generation.generationId
            : typeof data.generation?.id === "string"
              ? data.generation.id
              : typeof data.generationId === "string"
                ? data.generationId
                : null;

      const assetId =
        typeof data.image?.assetId === "string"
          ? data.image.assetId
          : typeof data.assetId === "string"
            ? data.assetId
            : null;

      if (!generationId) {
        throw new Error(
          "The image was created, but the generation ID was not returned by the server.",
        );
      }

      setImage({ url, generationId, assetId });
      setPreviewOpen(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create the image.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function saveToLibrary() {
    if (!image?.generationId || saving) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/resources/image/${encodeURIComponent(image.generationId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: prompt.trim().slice(0, 120) || "AI-generated image",
            description: `AI-generated image based on: ${prompt.trim()}`,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to save the image.");
      }

      const resourceId =
        typeof data.resource?.id === "string"
          ? data.resource.id
          : typeof data.resourceId === "string"
            ? data.resourceId
            : null;

      if (!resourceId) {
        throw new Error("The image was saved, but no resource ID was returned.");
      }

      setSavedResourceId(resourceId);

      window.dispatchEvent(
        new CustomEvent("justdy:resource-created", {
          detail: {
            resourceId,
            type: "IMAGE",
          },
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save the image.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <StudioShell
      title="Image Studio"
      icon={<ImageIcon className="size-3.5" />}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-7">
          <button
            type="button"
            onClick={() => router.push("/dashboard/create")}
            className="mb-5 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to Create
          </button>

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              
              <div>
                <h1 className="text-xl font-semibold text-white sm:text-2xl">
                  Create from an idea, or redesign an image with AI.
                </h1>
               
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-none border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div
              className={[
                "relative overflow-hidden rounded-2xl border border-dashed p-4 transition",
                dragging
                  ? "border-white/40 bg-white/[0.08]"
                  : "border-white/10 bg-black/20 hover:border-white/20",
              ].join(" ")}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                acceptImage(event.dataTransfer.files?.[0]);
              }}
            >
              {sourcePreviewUrl ? (
                <div className="flex items-center gap-4">
                  <div className="size-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <img
                      src={sourcePreviewUrl}
                      alt="Uploaded source"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <ImagePlus className="size-4 text-white/70" />
                      <p className="truncate text-sm font-medium text-white">
                        {sourceFile?.name}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-white/40">
                      This image will be redesigned using your prompt.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.06]"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={removeSourceImage}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.06] hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-4 text-left"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                    <Upload className="size-5 text-white/65" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Upload an image to redesign
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      Drag and drop or browse. PNG, JPEG, WEBP · up to 20 MB.
                    </p>
                  </div>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                  Design direction
                </p>
                {isRedesign ? (
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] text-white/50">
                    AI redesign
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={[
                      "rounded-xl border px-3 py-2 text-xs transition",
                      presetId === preset.id
                        ? "border-white/25 bg-white/[0.10] text-white"
                        : "border-white/10 text-white/55 hover:bg-white/[0.06] hover:text-white",
                    ].join(" ")}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              isRedesign
                ? "Describe exactly how you want to redesign this image — style, colors, composition, background, objects to add/remove, educational improvements, branding..."
                : "Create an educational illustration showing the water cycle for Grade 5 students..."
            }
            rows={6}
            disabled={generating || saving}
            className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm leading-7 text-white outline-none placeholder:text-white/25 focus:border-white/20 disabled:opacity-50"
          />

          {error ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              <X className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-white/35">
              {isRedesign
                ? "Your uploaded image becomes the visual reference for the redesign."
                : "Tip: be specific about subject, style, colors, composition, and audience."}
            </div>

            <button
              type="button"
              onClick={() => void generate()}
              disabled={!prompt.trim() || generating || saving}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {isRedesign ? "Redesigning..." : "Creating..."}
                </>
              ) : (
                <>
                  {isRedesign ? (
                    <WandSparkles className="size-4" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {isRedesign ? "Redesign Image" : "Create Image"}
                </>
              )}
            </button>
          </div>
        </div>

        {image ? (
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <ImageIcon className="size-4 shrink-0 text-white/50" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {savedResourceId ? "Image saved to My Library" : "Image ready"}
                </p>
                <p className="mt-1 truncate text-xs text-white/40">
                  {savedResourceId
                    ? "Your image is now available from My Library."
                    : "Open the preview to review or save your result."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="shrink-0 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.09]"
            >
              Preview
            </button>
          </div>
        ) : null}

        {previewOpen && image ? (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label="Generated image preview"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setPreviewOpen(false);
              }
            }}
          >
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {savedResourceId ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-300/80" />
                    ) : null}
                    <h2 className="truncate text-sm font-semibold text-white">
                      {isRedesign ? "Redesigned Image" : "Generated Image"}
                    </h2>
                  </div>
                  <p className="mt-1 truncate text-xs text-white/40">
                    {savedResourceId
                      ? "Saved to My Library."
                      : "Review your result before saving it."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Close image preview"
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-lg text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-auto bg-black/30 p-4 sm:p-8">
                <div className="flex min-h-[45vh] items-center justify-center">
                  <img
                    src={image.url}
                    alt={prompt || "Generated image"}
                    className="max-h-[62vh] max-w-full rounded-2xl object-contain"
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/10 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewOpen(false);
                    setImage(null);
                    setSavedResourceId(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-white/65 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <RefreshCw className="size-3.5" />
                  Start another
                </button>

                <a
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <Download className="size-3.5" />
                  Open full image
                </a>

                <button
                  type="button"
                  onClick={() => void saveToLibrary()}
                  disabled={
                    saving || Boolean(savedResourceId) || !image.generationId
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  {savedResourceId
                    ? "Saved to My Library"
                    : "Save to My Library"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </StudioShell>
  );
}
