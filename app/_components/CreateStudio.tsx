"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Layers3,
  Palette,
  Sparkles,
  Video,
} from "lucide-react";

type Product =
  | "video"
  | "image"
  | "coloring"
  | "worksheet"
  | "workbook";

type Subject = {
  id: string;
  name: string;
};

const PRODUCTS: {
  value: Product;
  label: string;
  icon: typeof Video;
}[] = [
  { value: "video", label: "Video", icon: Video },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "coloring", label: "Coloring Book", icon: Palette },
  { value: "worksheet", label: "Worksheet", icon: FileText },
  { value: "workbook", label: "Workbook", icon: Layers3 },
];

const VIDEO_OPTIONS = {
  provider: ["Auto", "Veo", "Sora"],
  frame: ["9:16", "16:9", "1:1"],
  size: ["480p", "720p", "1080p"],
  duration: ["4s", "8s", "12s"],
};

const IMAGE_OPTIONS = {
  ratio: ["1:1", "16:9", "9:16", "4:3", "3:4"],
  quality: ["Low", "Medium", "High"],
  format: ["PNG", "JPEG"],
};

const COLORING_OPTIONS = {
  age: ["Preschool", "Kindergarten", "Grade 1–2", "Grade 3–5", "Grade 6+"],
  style: ["Simple & Bold", "Cute & Playful", "Educational", "Detailed"],
  pages: ["1", "3", "5"],
  color: ["Black & White", "Full Color"],
};

const WORKSHEET_OPTIONS = {
  grade: ["AI decides", ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)],
  questions: ["5", "10", "15", "20", "25", "30"],
  difficulty: ["easy", "medium", "hard", "mixed"],
};

export default function CreateStudio({
  subjects,
}: {
  subjects: Subject[];
}) {
  const [product, setProduct] = useState<Product>("video");
  const [prompt, setPrompt] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [video, setVideo] = useState({
    provider: "Auto",
    frame: "9:16",
    size: "480p",
    duration: "4s",
    audio: false,
    referenceImage: false,
  });

  const [image, setImage] = useState({
    ratio: "1:1",
    quality: "Medium",
    format: "PNG",
  });

  const [coloring, setColoring] = useState({
    age: "Kindergarten",
    style: "Simple & Bold",
    pages: "1",
    color: "Black & White",
  });

  const [worksheet, setWorksheet] = useState({
    grade: "AI decides",
    subject: "AI decides",
    questions: "10",
    difficulty: "medium",
    moreOptions: false,
  });

  const selected = useMemo(
    () => PRODUCTS.find((item) => item.value === product)!,
    [product],
  );

  function changeProduct(next: Product) {
    setProduct(next);
    setPrompt("");
    setPreviewOpen(false);
    setGenerating(false);
  }

  function generate() {
    if (!prompt.trim() || generating) return;

    /*
     * IMPORTANT:
     * This is the single entry point for /create.
     *
     * Move the existing generation function from each individual studio
     * into the corresponding branch below. Do NOT create a second API
     * implementation.
     *
     * The existing studios already contain the required generation and
     * preview behavior:
     *
     * video     -> VideoStudio generation/preview
     * image     -> ImageStudio generation/lightbox
     * coloring  -> ColoringPages generation/multi-page preview
     * worksheet -> WorksheetStudio generation/document preview
     * workbook  -> WorksheetStudio generation/document preview (workbook mode)
     */
    setGenerating(true);
    setPreviewOpen(true);

    // Replace this timeout with the existing product-specific generator.
    window.setTimeout(() => {
      setGenerating(false);
    }, 700);
  }

  function renderControls() {
    if (product === "video") {
      return (
        <>
          <ToolbarSelect
            label="Provider"
            value={video.provider}
            options={VIDEO_OPTIONS.provider}
            onChange={(value) =>
              setVideo((v) => ({ ...v, provider: value }))
            }
          />
          <ToolbarSelect
            label="Frame"
            value={video.frame}
            options={VIDEO_OPTIONS.frame}
            onChange={(value) => setVideo((v) => ({ ...v, frame: value }))}
          />
          <ToolbarSelect
            label="Size"
            value={video.size}
            options={VIDEO_OPTIONS.size}
            onChange={(value) => setVideo((v) => ({ ...v, size: value }))}
          />
          <ToolbarSelect
            label="Duration"
            value={video.duration}
            options={VIDEO_OPTIONS.duration}
            onChange={(value) =>
              setVideo((v) => ({ ...v, duration: value }))
            }
          />
          <ToolbarButton
            active={video.referenceImage}
            onClick={() =>
              setVideo((v) => ({ ...v, referenceImage: !v.referenceImage }))
            }
          >
            <ImageIcon className="size-3.5" />
            Image
          </ToolbarButton>
          <ToolbarButton
            active={video.audio}
            onClick={() => setVideo((v) => ({ ...v, audio: !v.audio }))}
          >
            {video.audio ? "Audio" : "No Audio"}
          </ToolbarButton>
        </>
      );
    }

    if (product === "image") {
      return (
        <>
          <ToolbarSelect
            label="Ratio"
            value={image.ratio}
            options={IMAGE_OPTIONS.ratio}
            onChange={(value) => setImage((v) => ({ ...v, ratio: value }))}
          />
          <ToolbarSelect
            label="Quality"
            value={image.quality}
            options={IMAGE_OPTIONS.quality}
            onChange={(value) => setImage((v) => ({ ...v, quality: value }))}
          />
          <ToolbarSelect
            label="Format"
            value={image.format}
            options={IMAGE_OPTIONS.format}
            onChange={(value) => setImage((v) => ({ ...v, format: value }))}
          />
        </>
      );
    }

    if (product === "coloring") {
      return (
        <>
          <ToolbarSelect
            label="Age"
            value={coloring.age}
            options={COLORING_OPTIONS.age}
            onChange={(value) => setColoring((v) => ({ ...v, age: value }))}
          />
          <ToolbarSelect
            label="Style"
            value={coloring.style}
            options={COLORING_OPTIONS.style}
            onChange={(value) => setColoring((v) => ({ ...v, style: value }))}
          />
          <ToolbarSelect
            label="Pages"
            value={coloring.pages}
            options={COLORING_OPTIONS.pages}
            onChange={(value) => setColoring((v) => ({ ...v, pages: value }))}
          />
          <ToolbarSelect
            label="Color"
            value={coloring.color}
            options={COLORING_OPTIONS.color}
            onChange={(value) => setColoring((v) => ({ ...v, color: value }))}
          />
        </>
      );
    }

    return (
      <>
        <ToolbarSelect
          label="Grade"
          value={worksheet.grade}
          options={WORKSHEET_OPTIONS.grade}
          onChange={(value) => setWorksheet((v) => ({ ...v, grade: value }))}
        />
        <ToolbarSelect
          label="Subject"
          value={worksheet.subject}
          options={["AI decides", ...subjects.map((s) => s.name)]}
          onChange={(value) =>
            setWorksheet((v) => ({ ...v, subject: value }))
          }
        />
        <ToolbarSelect
          label="Questions"
          value={worksheet.questions}
          options={WORKSHEET_OPTIONS.questions}
          onChange={(value) =>
            setWorksheet((v) => ({ ...v, questions: value }))
          }
        />
        <ToolbarSelect
          label="Difficulty"
          value={worksheet.difficulty}
          options={WORKSHEET_OPTIONS.difficulty}
          onChange={(value) =>
            setWorksheet((v) => ({ ...v, difficulty: value }))
          }
        />
        <ToolbarButton
          active={worksheet.moreOptions}
          onClick={() =>
            setWorksheet((v) => ({
              ...v,
              moreOptions: !v.moreOptions,
            }))
          }
        >
          More options
        </ToolbarButton>
      </>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#090a0c] text-white">
      <div
        className="relative flex min-h-screen items-center justify-center px-4 py-16 sm:px-8"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,80,255,0.06),transparent_38%)]" />

        <section className="relative z-10 w-full max-w-[900px]">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <Sparkles className="size-5 text-white/80" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              What would you like to create?
            </h1>

            <p className="mt-2 text-sm text-white/35">
              Describe your idea and Justdy will create it for you.
            </p>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#151619]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  generate();
                }
              }}
              placeholder={`Describe your ${selected.label.toLowerCase()}...`}
              rows={8}
              disabled={generating}
              className="block min-h-[290px] w-full resize-none border-0 bg-transparent px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/35 disabled:opacity-50 sm:px-5 sm:py-5"
            />

            <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-3 py-3 sm:px-4">
              <ProductSelect
                value={product}
                onChange={changeProduct}
              />

              {renderControls()}

              <div className="ml-auto flex items-center gap-2">
                <span className="hidden text-[11px] text-white/25 lg:inline">
                  {selected.label}
                </span>

                <button
                  type="button"
                  disabled={!prompt.trim() || generating}
                  onClick={generate}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-semibold text-black shadow-lg transition hover:bg-white/90 disabled:pointer-events-none disabled:opacity-30"
                >
                  <Sparkles className="size-3.5" />
                  <span className="hidden sm:inline">
                    {generating ? "Creating..." : "Generate"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-[10px] text-white/25">
            Press ⌘ Enter to generate
          </p>
        </section>
      </div>

      {previewOpen && (
        <ProductPreview
          product={product}
          generating={generating}
          onClose={() => {
            if (!generating) setPreviewOpen(false);
          }}
        />
      )}
    </main>
  );
}

function ProductSelect({
  value,
  onChange,
}: {
  value: Product;
  onChange: (value: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = PRODUCTS.find((item) => item.value === value)!;
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white transition hover:bg-white/[0.08]"
      >
        <Icon className="size-3.5" />
        <span>Create:</span>
        <span className="text-white">{current.label}</span>
        <ChevronDown className="size-3.5 text-white/40" />
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#18191c] p-1 shadow-2xl">
          {PRODUCTS.map((item) => {
            const ItemIcon = item.icon;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition hover:bg-white/[0.07] ${
                  value === item.value
                    ? "bg-white/[0.08] text-white"
                    : "text-white/55"
                }`}
              >
                <ItemIcon className="size-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ToolbarSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] px-2.5 text-[11px] text-white/45 transition hover:bg-white/[0.07] hover:text-white"
      >
        <span>{label}</span>
        <span className="text-white/75">{value}</span>
        <ChevronDown className="size-3 opacity-40" />
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 min-w-36 overflow-hidden rounded-xl border border-white/10 bg-[#18191c] p-1 shadow-2xl">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-xs transition hover:bg-white/[0.07] ${
                value === option ? "text-white" : "text-white/50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[11px] font-medium transition ${
        active
          ? "border-white/20 bg-white/[0.10] text-white"
          : "border-white/10 bg-white/[0.035] text-white/45 hover:bg-white/[0.07] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function ProductPreview({
  product,
  generating,
  onClose,
}: {
  product: Product;
  generating: boolean;
  onClose: () => void;
}) {
  const title =
    product === "coloring"
      ? "Coloring Book"
      : product === "worksheet"
        ? "Worksheet"
        : product === "workbook"
          ? "Workbook"
          : product === "image"
            ? "Image"
            : "Video";

  const Icon =
    product === "coloring"
      ? Palette
      : product === "worksheet"
        ? FileText
        : product === "workbook"
          ? BookOpen
          : product === "image"
            ? ImageIcon
            : Video;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !generating) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111214] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/[0.06]">
              <Icon className="size-4 text-white/70" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {generating ? `Creating your ${title.toLowerCase()}` : `${title} Preview`}
              </p>
              <p className="text-xs text-white/30">
                {generating
                  ? `Justdy is creating your ${title.toLowerCase()}.`
                  : "Your generated result appears here."}
              </p>
            </div>
          </div>

          {!generating && (
            <button
              type="button"
              onClick={onClose}
              className="size-9 rounded-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              aria-label="Close preview"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex min-h-[480px] flex-1 items-center justify-center p-6">
          {generating ? (
            <div className="text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Sparkles className="size-6 animate-pulse text-white/60" />
              </div>
              <p className="mt-5 text-sm font-semibold text-white">
                Creating {title.toLowerCase()}...
              </p>
              <p className="mt-1 text-xs text-white/30">
                Please keep this window open.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <Icon className="mx-auto size-10 text-white/15" />
              <p className="mt-4 text-sm text-white/45">
                {title} preview
              </p>
              <p className="mt-1 text-xs text-white/20">
                Connect the existing {title} studio preview state here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
