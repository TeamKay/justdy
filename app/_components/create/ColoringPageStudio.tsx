"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  LibraryBig,
  Loader2,
  Palette,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";

import { StudioShell } from "./StudioShell";

type GeneratedPage = {
  url?: string;
  imageUrl?: string;
  id?: string;
  generationId?: string;
  assetId?: string;
};

type GenerationResult = {
  images?: GeneratedPage[];
  imagesGenerated?: number;
};

const AGE_GROUPS = [
  "Ages 3–5",
  "Ages 6–8",
  "Ages 9–12",
  "Teens",
  "Adults",
];

const STYLES = [
  "Simple black-and-white line art",
  "Cute cartoon",
  "Detailed educational illustration",
  "Bold printable outlines",
  "Storybook style",
];

export default function ColoringPageStudio() {
  const searchParams = useSearchParams();

  const initialPrompt = searchParams.get("prompt") ?? "";
  const projectId = searchParams.get("projectId") ?? "";

  const [prompt, setPrompt] = React.useState(initialPrompt);
  const [title, setTitle] = React.useState("");
  const [ageGroup, setAgeGroup] = React.useState("Ages 6–8");
  const [style, setStyle] = React.useState(STYLES[0]);
  const [pages, setPages] = React.useState(3);

  const [generating, setGenerating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<GenerationResult | null>(null);
  const [savedResourceId, setSavedResourceId] = React.useState<string | null>(
    null,
  );
  const [modalOpen, setModalOpen] = React.useState(false);
  const [generationProgress, setGenerationProgress] = React.useState(0);
  const [activeGenerationPage, setActiveGenerationPage] = React.useState(0);

  async function generate() {
    const trimmed = prompt.trim();

    if (!trimmed || generating || saving) return;

    setGenerating(true);
    setError("");
    setResult(null);
    setSavedResourceId(null);
    setModalOpen(true);
    setGenerationProgress(0);
    setActiveGenerationPage(0);

    try {
      const generatedImages: GeneratedPage[] = [];

      for (let index = 0; index < pages; index += 1) {
        setActiveGenerationPage(index + 1);
        const pagePrompt = [
          "Create a printable coloring page.",
          `Subject: ${trimmed}.`,
          `Audience: ${ageGroup}.`,
          `Style: ${style}.`,
          `This is page ${index + 1} of ${pages}.`,
          "Use clean black line art on a white background.",
          "No color fills, no gradients, no text, no watermark.",
          "Make the artwork suitable for printing and coloring.",
        ].join(" ");

        const response = await fetch("/api/ai/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            prompt: pagePrompt,
            model: "gpt-image-2",
            size: "1024x1024",
            quality: "medium",
            outputFormat: "png",
            background: "opaque",
            ...(projectId ? { projectId } : {}),
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.error ??
              data?.message ??
              `Unable to generate coloring page ${index + 1}.`,
          );
        }

        const imageUrl =
          data?.image?.url ??
          data?.generation?.url ??
          data?.generation?.imageUrl ??
          data?.url ??
          data?.imageUrl;

        if (!imageUrl) {
          throw new Error(
            `Coloring page ${index + 1} was generated without an image URL.`,
          );
        }

        generatedImages.push({
          url: imageUrl,
          imageUrl,
          id: data?.generation?.id ?? data?.generationId,
          generationId: data?.generation?.id ?? data?.generationId,
          assetId: data?.image?.assetId ?? data?.generation?.assetId,
        });

        setGenerationProgress(
          Math.round(((index + 1) / pages) * 100),
        );
      }

      setResult({
        images: generatedImages,
        imagesGenerated: generatedImages.length,
      });
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate the coloring pages.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!result?.images?.length || saving) return;

    setSaving(true);
    setError("");

    try {
      const images = result.images
        .map((image, index) => {
          const url = image.url ?? image.imageUrl;

          if (!url) return null;

          return {
            index: index + 1,
            url,
            ...(image.generationId ? { generationId: image.generationId } : {}),
            ...(image.assetId ? { assetId: image.assetId } : {}),
            mimeType: "image/png",
          };
        })
        .filter(
          (
            image,
          ): image is {
            index: number;
            url: string;
            generationId?: string;
            assetId?: string;
            mimeType: string;
          } => Boolean(image),
        );

      if (!images.length) {
        throw new Error("There are no generated coloring pages to save.");
      }

      const response = await fetch("/api/resources/coloring-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim() || prompt.trim().slice(0, 80),
          description: `Coloring pages about ${prompt.trim()}.`,
          prompt: prompt.trim(),
          ageGroup,
          style,
          pages: images.length,
          ...(projectId ? { projectId } : {}),
          images,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ??
            data?.message ??
            "Unable to save the coloring pages.",
        );
      }

      const resourceId =
        typeof data.resource?.id === "string"
          ? data.resource.id
          : typeof data.resourceId === "string"
            ? data.resourceId
            : null;

      if (!resourceId) {
        throw new Error(
          "The coloring pages were saved, but no resource ID was returned.",
        );
      }

      setSavedResourceId(resourceId);

      window.dispatchEvent(
        new CustomEvent("justdy:resource-created", {
          detail: {
            resourceId,
            type: "COLORING_PAGE",
          },
        }),
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the coloring pages.",
      );
    } finally {
      setSaving(false);
    }
  }

  const images = result?.images ?? [];

  return (
    <StudioShell
      title="Coloring Page Studio"
      icon={<Palette className="size-4" />}
    >
      <div
        className="min-h-[calc(100vh-64px)] w-full"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
          <div className="mb-12 flex items-center justify-between">
            <a
              href="/dashboard/create"
              className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back to Create
            </a>

            <a
              href="/dashboard/library"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-4 py-2 text-xs font-semibold text-[#57506d] shadow-sm transition hover:bg-white/90"
            >
              <LibraryBig className="size-3.5 text-violet-500" />
              My Library
            </a>
          </div>

          <div className="mx-auto max-w-4xl text-center">
           

            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
              Create a coloring page
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/45 sm:text-base">
              Describe the artwork, scene, or activity you want Justdy to turn
              into printable coloring pages.
            </p>
          </div>

          <div className="mx-auto mt-9 w-full max-w-4xl">
            <div className="overflow-hidden rounded-lg border border-black/10 bg-white text-slate-900 ">
              

              <div className="bg-white">
                <textarea
                  id="coloring-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  disabled={generating || saving}
                  rows={7}
                  placeholder="Example: African wildlife in a bright savanna with a lion, elephant, giraffe, and simple clouds..."
                  className="block min-h-55 w-full resize-none border-0 bg-white px-6 py-5 text-[15px] leading-7 text-slate-700 outline-none placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400 sm:min-h-[250px] sm:px-7 sm:py-6"
                />
              </div>

              <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap gap-2">
                    <select
                      id="coloring-age"
                      value={ageGroup}
                      onChange={(event) => setAgeGroup(event.target.value)}
                      disabled={generating || saving}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {AGE_GROUPS.map((option) => (
                        <option key={option} value={option}>
                          Audience {option.replace("Ages ", "")}
                        </option>
                      ))}
                    </select>

                    <select
                      id="coloring-style"
                      value={style}
                      onChange={(event) => setStyle(event.target.value)}
                      disabled={generating || saving}
                      className="h-10 max-w-[190px] rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {STYLES.map((option) => (
                        <option key={option} value={option}>
                          Style {option}
                        </option>
                      ))}
                    </select>

                    <select
                      id="coloring-pages"
                      value={pages}
                      onChange={(event) => setPages(Number(event.target.value))}
                      disabled={generating || saving}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {[1, 2, 3, 4, 5].map((count) => (
                        <option key={count} value={count}>
                          Pages {count}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => void generate()}
                    disabled={!prompt.trim() || generating || saving}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-violet-500 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-40 sm:ml-auto"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3.5" />
                        Generate
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    {ageGroup} · {style} · {pages} {pages === 1 ? "page" : "pages"}
                  </span>
                  <span>{prompt.length}/4000</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="mr-1 text-white/35">Try:</span>

              {[
                "Animals in a rainforest",
                "Solar system for kids",
                "A friendly dinosaur",
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  disabled={generating || saving}
                  onClick={() => setPrompt(example)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>

            <p className="mt-5 text-center text-[11px] text-white/30">
              Describe the subject, setting, audience, and illustration style
              when those details matter.
            </p>

            {error ? (
              <div className="mx-auto mt-5 max-w-4xl rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs leading-5 text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Coloring page generation and preview"
        >
          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl shadow-black/50">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="text-sm font-semibold text-white">
                  {generating ? "Creating coloring pages" : "Coloring page preview"}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {generating
                    ? `Creating page ${activeGenerationPage || 1} of ${pages}`
                    : savedResourceId
                      ? "Saved to My Library."
                      : `${images.length} generated ${images.length === 1 ? "page" : "pages"}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!generating && !saving) setModalOpen(false);
                }}
                disabled={generating || saving}
                aria-label="Close preview"
                className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lg text-white/55 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                ×
              </button>
            </div>

            {generating ? (
              <div className="flex min-h-[520px] flex-1 items-center justify-center overflow-auto p-6 sm:p-10">
                <div className="w-full max-w-md text-center">
                  <div className="mx-auto flex size-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04]">
                    <Loader2 className="size-8 animate-spin text-white/75" />
                  </div>

                  <h2 className="mt-6 text-base font-semibold text-white">
                    Generating your coloring pages
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    The artwork is being created one page at a time. You can
                    review everything when generation finishes.
                  </p>

                  <div className="mt-7">
                    <div className="mb-2 flex items-center justify-between text-[11px] text-white/35">
                      <span>Progress</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-violet-400 transition-all duration-500"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 text-xs text-white/30">
                    Page {activeGenerationPage || 1} of {pages}
                  </div>
                </div>
              </div>
            ) : images.length ? (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-white/40">
                      Printable black-and-white artwork
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void generate()}
                      disabled={generating || saving}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                    >
                      <RefreshCw className="size-3.5" />
                      Regenerate
                    </button>

                    <button
                      type="button"
                      onClick={() => void save()}
                      disabled={saving || Boolean(savedResourceId)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
                    >
                      {saving ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      {savedResourceId ? "Saved" : "Save to My Library"}
                    </button>

                    {savedResourceId ? (
                      <a
                        href="/dashboard/library"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        Open My Library
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((image, index) => {
                    const url = image.url ?? image.imageUrl;

                    if (!url) return null;

                    return (
                      <div
                        key={image.id ?? `${url}-${index}`}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-black/25"
                      >
                        <div className="aspect-square bg-white p-3">
                          <img
                            src={url}
                            alt={`${title || prompt} coloring page ${index + 1}`}
                            className="size-full object-contain"
                          />
                        </div>

                        <div className="flex items-center justify-between px-3 py-3">
                          <span className="text-xs text-white/45">
                            Page {index + 1}
                          </span>

                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-white/60 transition hover:text-white"
                          >
                            <Download className="size-3.5" />
                            Open
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex min-h-105 items-center justify-center p-6">
                <div className="text-center text-sm text-white/40">
                  No preview is available.
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </StudioShell>
  );
}
