"use client";

import * as React from "react";
import {
  BookOpen,
  FileText,
  ImageIcon,
  Palette,
  Sparkles,
  Video,
} from "lucide-react";

type ResourceType =
  | "coloring"
  | "worksheet"
  | "workbook"
  | "image"
  | "video";

const RESOURCE_TYPES = [
  {
    id: "coloring",
    label: "Coloring Page",
    icon: Palette,
    description: "Printable coloring artwork",
  },
  {
    id: "worksheet",
    label: "Worksheet",
    icon: FileText,
    description: "Practice and activities",
  },
  {
    id: "workbook",
    label: "Workbook",
    icon: BookOpen,
    description: "Multi-page learning resource",
  },
  {
    id: "image",
    label: "Image",
    icon: ImageIcon,
    description: "Educational visual",
  },
  {
    id: "video",
    label: "Video",
    icon: Video,
    description: "Educational video",
  },
] as const;

function detectResource(prompt: string): ResourceType | null {
  const value = prompt.toLowerCase();

  if (
    value.includes("coloring") ||
    value.includes("colouring") ||
    value.includes("coloring page")
  ) {
    return "coloring";
  }

  if (
    value.includes("workbook") ||
    value.includes("activity book")
  ) {
    return "workbook";
  }

  if (
    value.includes("worksheet") ||
    value.includes("practice sheet")
  ) {
    return "worksheet";
  }

  if (
    value.includes("video") ||
    value.includes("animation")
  ) {
    return "video";
  }

  if (
    value.includes("image") ||
    value.includes("illustration") ||
    value.includes("picture")
  ) {
    return "image";
  }

  return null;
}

export default function PromptStudio() {
  const [prompt, setPrompt] = React.useState("");
  const [resourceType, setResourceType] =
    React.useState<ResourceType>("worksheet");
  const [generating, setGenerating] = React.useState(false);

  const detectedType = React.useMemo(
    () => detectResource(prompt),
    [prompt],
  );

  const activeType = detectedType ?? resourceType;

  function selectType(type: ResourceType) {
    setResourceType(type);
  }

  async function createResource() {
    const trimmed = prompt.trim();

    if (!trimmed || generating) return;

    setGenerating(true);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          prompt: trimmed,
          resourceType: activeType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create your resource.",
        );
      }

      // Phase 3 result handling will be connected here.
      console.log("Generation started:", data);
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
            <Sparkles className="h-6 w-6" />
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
            Create with Justdy
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-neutral-500 sm:text-lg">
            Describe what you want to create and Justdy will turn
            your idea into a finished learning resource.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Create a 10-page coloring workbook about African wildlife for children ages 6–8..."
            className="min-h-[230px] w-full resize-none border-0 bg-transparent px-7 py-7 text-lg leading-8 text-neutral-900 outline-none placeholder:text-neutral-300"
          />

          <div className="border-t border-neutral-100 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {RESOURCE_TYPES.map((resource) => {
                const Icon = resource.icon;
                const active = activeType === resource.id;

                return (
                  <button
                    key={resource.id}
                    type="button"
                    onClick={() => selectType(resource.id)}
                    className={[
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                      active
                        ? "bg-black text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    {resource.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="text-sm text-neutral-500">
                {prompt.trim()
                  ? `Creating ${RESOURCE_TYPES.find(
                      (item) => item.id === activeType,
                    )?.label}`
                  : "Choose a resource or describe it naturally."}
              </div>

              <button
                type="button"
                disabled={!prompt.trim() || generating}
                onClick={() => void createResource()}
                className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {generating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <p className="mb-4 text-sm font-medium text-neutral-500">
            Try creating
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["🎨", "Coloring Page"],
              ["📄", "Worksheet"],
              ["📚", "Workbook"],
              ["🖼️", "Image"],
              ["🎬", "Video"],
            ].map(([emoji, label]) => (
              <button
                key={label}
                type="button"
                className="rounded-2xl border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-400 hover:shadow-sm"
                onClick={() =>
                  setPrompt(
                    label === "Coloring Page"
                      ? "Create a printable coloring page about..."
                      : label === "Worksheet"
                        ? "Create a worksheet about..."
                        : label === "Workbook"
                          ? "Create a multi-page workbook about..."
                          : label === "Image"
                            ? "Create an educational image showing..."
                            : "Create an educational video explaining...",
                  )
                }
              >
                <div className="text-xl">{emoji}</div>
                <div className="mt-2 text-sm font-medium text-neutral-900">
                  {label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}