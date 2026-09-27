// Presentation Studio integrated with the universal Justdy Resource system.
// Generated from the user's supplied PresentationStudio source.

"use client";

import { useMemo, useState } from "react";
import SavePresentationResourceButton from "@/app/_components/SavePresentationResourceButton";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  MonitorPlay,
  Pencil,
  Presentation,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from "lucide-react";

type PresentationStudioProps = {
  projectId: string | null;
};

type Slide = {
  slideNumber: number;
  title: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  speakerNotes?: string;
};

type GeneratedPresentation = {
  title: string;
  subtitle?: string;
  audience?: string;
  subject?: string;
  topic?: string;
  learningObjectives?: string[];
  slides: Slide[];
};

const DEFAULT_VALUES = {
  subject: "Mathematics",
  gradeLevel: "Grade 4",
  topic: "Fractions",
  slideCount: "10",
  objective:
    "Students will understand equivalent fractions and identify common fraction relationships.",
  style: "Clean & modern",
};

function parsePresentation(text: string): GeneratedPresentation | null {
  try {
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.slides)
    ) {
      return null;
    }

    return {
      title:
        typeof parsed.title === "string"
          ? parsed.title
          : "Untitled Presentation",

      subtitle:
        typeof parsed.subtitle === "string" ? parsed.subtitle : undefined,

      audience:
        typeof parsed.audience === "string" ? parsed.audience : undefined,

      subject: typeof parsed.subject === "string" ? parsed.subject : undefined,

      topic: typeof parsed.topic === "string" ? parsed.topic : undefined,

      learningObjectives: Array.isArray(parsed.learningObjectives)
        ? parsed.learningObjectives.filter(
            (item: unknown): item is string => typeof item === "string",
          )
        : undefined,

      slides: parsed.slides.map((slide: unknown, index: number) => {
        const item =
          slide && typeof slide === "object"
            ? (slide as Record<string, unknown>)
            : {};

        return {
          slideNumber:
            typeof item.slideNumber === "number" ? item.slideNumber : index + 1,

          title:
            typeof item.title === "string" ? item.title : `Slide ${index + 1}`,

          subtitle:
            typeof item.subtitle === "string" ? item.subtitle : undefined,

          bullets: Array.isArray(item.bullets)
            ? item.bullets.filter(
                (bullet: unknown): bullet is string =>
                  typeof bullet === "string",
              )
            : undefined,

          body: typeof item.body === "string" ? item.body : undefined,

          speakerNotes:
            typeof item.speakerNotes === "string"
              ? item.speakerNotes
              : undefined,
        };
      }),
    };
  } catch {
    return null;
  }
}

export default function PresentationStudio({
  projectId,
}: PresentationStudioProps) {
  const [subject, setSubject] = useState(DEFAULT_VALUES.subject);

  const [gradeLevel, setGradeLevel] = useState(DEFAULT_VALUES.gradeLevel);

  const [topic, setTopic] = useState(DEFAULT_VALUES.topic);

  const [slideCount, setSlideCount] = useState(DEFAULT_VALUES.slideCount);

  const [objective, setObjective] = useState(DEFAULT_VALUES.objective);

  const [style, setStyle] = useState(DEFAULT_VALUES.style);

  const [additionalInstructions, setAdditionalInstructions] = useState("");

  const [presentation, setPresentation] =
    useState<GeneratedPresentation | null>(null);

  const [generationId, setGenerationId] = useState<string | null>(null);


  const [activeSlide, setActiveSlide] = useState(0);

  const [isGenerating, setIsGenerating] = useState(false);



  const [error, setError] = useState("");

  const currentSlide = presentation?.slides[activeSlide] ?? null;

  const progress = useMemo(() => {
    if (!presentation?.slides.length) {
      return 0;
    }

    return ((activeSlide + 1) / presentation.slides.length) * 100;
  }, [activeSlide, presentation]);

  async function handleGenerate() {
    setError("");

    if (!subject.trim() || !gradeLevel.trim() || !topic.trim()) {
      setError("Please enter a subject, grade level, and topic.");
      return;
    }

    setIsGenerating(true);
    setPresentation(null);
    setGenerationId(null);
    setActiveSlide(0);

    try {
      const prompt = `
Create a professional educational presentation.

SUBJECT:
${subject}

GRADE / AGE:
${gradeLevel}

TOPIC:
${topic}

NUMBER OF SLIDES:
${slideCount}

PRIMARY LEARNING OBJECTIVE:
${objective.trim() || "Create appropriate learning objectives."}

PRESENTATION STYLE:
${style}

ADDITIONAL INSTRUCTIONS:
${additionalInstructions.trim() || "None provided."}

The presentation must:

- Be appropriate for the specified grade or age group.
- Teach the requested topic accurately.
- Progress logically.
- Include an introduction.
- Include clear learning objectives.
- Explain the concept.
- Include examples.
- Include learner practice or application where appropriate.
- Include a recap or conclusion.
- Use concise slide content.
- Avoid unnecessary paragraphs.
- Use age-appropriate vocabulary.
- Include useful speaker notes.
- Suggest visual ideas inside speaker notes when appropriate.

Return ONLY valid JSON.

Use exactly:

{
  "title": "Presentation title",
  "subtitle": "Short subtitle",
  "audience": "${gradeLevel}",
  "subject": "${subject}",
  "topic": "${topic}",
  "learningObjectives": [
    "Objective 1",
    "Objective 2"
  ],
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide title",
      "subtitle": "Optional subtitle",
      "bullets": [
        "Short point",
        "Short point"
      ],
      "body": "Optional short explanatory text",
      "speakerNotes": "Useful presenter notes"
    }
  ]
}

Rules:

- Generate exactly ${slideCount} slides.
- slideNumber starts at 1.
- Increment slideNumber by 1.
- Do not use markdown.
- Do not use code fences.
- Do not add commentary outside the JSON.
- Keep slide content concise.
`;

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "PRESENTATION",
          prompt,
          projectId,
          inputData: {
            source: "AI_LAUNCHPAD",
            subject,
            gradeLevel,
            topic,
            slideCount: Number(slideCount),
            objective,
            style,
            additionalInstructions,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Unable to generate the presentation.",
        );
      }

      const generation = data?.generation;

      const text = typeof generation?.text === "string" ? generation.text : "";

      if (typeof generation?.generationId !== "string") {
        throw new Error("The AI generation did not return a generation ID.");
      }

      if (!text) {
        throw new Error("The AI returned an empty presentation.");
      }

      const parsed = parsePresentation(text);

      if (!parsed) {
        throw new Error(
          "The presentation was generated, but its structure could not be read.",
        );
      }

      setGenerationId(generation.generationId);
      setPresentation(parsed);
      setActiveSlide(0);
    } catch (err) {
      console.error("Presentation generation error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the presentation.",
      );
    } finally {
      setIsGenerating(false);
    }
  }


  function updateCurrentSlide(
    field: "title" | "subtitle" | "body" | "speakerNotes",
    value: string,
  ) {
    setPresentation((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,

        slides: current.slides.map((slide, index) =>
          index === activeSlide
            ? {
                ...slide,
                [field]: value,
              }
            : slide,
        ),
      };
    });

  }

  function updateBullet(index: number, value: string) {
    setPresentation((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,

        slides: current.slides.map((slide, slideIndex) => {
          if (slideIndex !== activeSlide) {
            return slide;
          }

          const bullets = [...(slide.bullets ?? [])];

          bullets[index] = value;

          return {
            ...slide,
            bullets,
          };
        }),
      };
    });

  }

  function addBullet() {
    setPresentation((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,

        slides: current.slides.map((slide, index) =>
          index === activeSlide
            ? {
                ...slide,
                bullets: [...(slide.bullets ?? []), "New point"],
              }
            : slide,
        ),
      };
    });

  }

  function removeBullet(index: number) {
    setPresentation((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,

        slides: current.slides.map((slide, slideIndex) => {
          if (slideIndex !== activeSlide) {
            return slide;
          }

          return {
            ...slide,
            bullets: (slide.bullets ?? []).filter(
              (_, bulletIndex) => bulletIndex !== index,
            ),
          };
        }),
      };
    });

  }

  function moveSlide(direction: "next" | "previous") {
    if (!presentation?.slides.length) {
      return;
    }

    setActiveSlide((current) => {
      if (direction === "next") {
        return Math.min(current + 1, presentation.slides.length - 1);
      }

      return Math.max(current - 1, 0);
    });
  }

  function startOver() {
    setPresentation(null);
    setGenerationId(null);
    setError("");
    setActiveSlide(0);
  }

  if (!presentation) {
    return (
      <main className="min-h-full bg-slate-50">
        <div className="mx-auto w-full max-w-5xl px-5 py-6 lg:px-8 lg:py-8">
          <Header showBack showAskAI />

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <MonitorPlay className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    Presentation details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Give Justdy the context it needs to build your presentation.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Subject"
                  value={subject}
                  onChange={setSubject}
                  placeholder="e.g. Mathematics"
                />

                <Field
                  label="Grade / age level"
                  value={gradeLevel}
                  onChange={setGradeLevel}
                  placeholder="e.g. Grade 4"
                />
              </div>

              <Field
                label="Topic"
                value={topic}
                onChange={setTopic}
                placeholder="e.g. Equivalent fractions"
              />

              <div className="grid gap-5 md:grid-cols-3">
                <SelectField
                  label="Number of slides"
                  value={slideCount}
                  onChange={setSlideCount}
                  options={["6", "8", "10", "12", "15", "20"]}
                  suffix="slides"
                />

                <SelectField
                  label="Presentation style"
                  value={style}
                  onChange={setStyle}
                  options={[
                    "Clean & modern",
                    "Playful & engaging",
                    "Minimal & professional",
                    "Visual & colorful",
                    "Teacher presentation",
                  ]}
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    AI generation
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-600" />

                    <span className="text-sm font-semibold text-slate-900">
                      8 credits
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Generated through the existing Justdy AI system.
                  </p>
                </div>
              </div>

              <TextAreaField
                label="Learning objective"
                value={objective}
                onChange={setObjective}
                placeholder="What should learners understand or be able to do?"
                rows={3}
              />

              <TextAreaField
                label="Additional instructions"
                value={additionalInstructions}
                onChange={setAdditionalInstructions}
                placeholder="Optional: standards, examples, teaching approach, visual ideas, assessment requirements, etc."
                rows={4}
              />

              {error ? <ErrorMessage message={error} /> : null}

              <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Describe → Generate → Review → Edit → Save
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    You retain control over the final presentation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating presentation…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate presentation
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-6 lg:px-8 lg:py-8">
        <Header
          showBack
          showAskAI={false}
          title={presentation.title}
          subtitle={presentation.subtitle ?? "Presentation Creator"}
        />

        <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_340px]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between px-2 pb-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">Slides</p>

                <p className="text-xs text-slate-400">
                  {presentation.slides.length} slides
                </p>
              </div>

              <button
                type="button"
                onClick={startOver}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="Start over"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-220px)] space-y-2 overflow-y-auto pr-1">
              {presentation.slides.map((slide, index) => (
                <button
                  key={`${slide.slideNumber}-${index}`}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    activeSlide === index
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Slide {index + 1}
                  </div>

                  <div
                    className={`line-clamp-2 text-xs font-semibold leading-5 ${
                      activeSlide === index ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {slide.title}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Presentation className="h-4 w-4 text-violet-600" />

                    <h2 className="truncate text-sm font-semibold text-slate-950">
                      {presentation.title}
                    </h2>
                  </div>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {presentation.subject ?? "Educational presentation"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {generationId ? (
                    <SavePresentationResourceButton
                      generationId={generationId}
                      title={presentation.title}
                   description={presentation.subtitle ?? undefined}
                      content={{
                        title: presentation.title,
                       description: presentation.subtitle ?? undefined,
                        slides: presentation.slides.map((slide) => ({
                          id: `slide-${slide.slideNumber}`,
                          title: slide.title,
                          subtitle: slide.subtitle ?? null,
                          content: slide.body ?? null,
                          bullets: slide.bullets ?? [],
                          notes: slide.speakerNotes ?? null,
                        })),
                        prompt: topic,
                      }}
                    />
                  ) : null}

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="bg-slate-100 p-4 sm:p-8">
                <div className="mx-auto aspect-video w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  {currentSlide ? (
                    <div className="flex h-full flex-col p-7 sm:p-10 lg:p-14">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">
                          {presentation.subject ?? "JUSTDY"}
                        </span>

                        <span className="text-xs text-slate-400">
                          {String(activeSlide + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="my-auto max-w-4xl">
                        {currentSlide.subtitle ? (
                          <p className="mb-3 text-sm font-medium text-violet-600">
                            {currentSlide.subtitle}
                          </p>
                        ) : null}

                        <h3 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                          {currentSlide.title}
                        </h3>

                        {currentSlide.body ? (
                          <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                            {currentSlide.body}
                          </p>
                        ) : null}

                        {currentSlide.bullets?.length ? (
                          <ul className="mt-7 space-y-3">
                            {currentSlide.bullets.map((bullet, index) => (
                              <li
                                key={`${index}-${bullet}`}
                                className="flex gap-3 text-sm leading-6 text-slate-700 sm:text-base"
                              >
                                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-500" />

                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[10px] text-slate-400">
                        <span>Justdy AI</span>

                        <span>{presentation.topic ?? ""}</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mx-auto mt-5 max-w-5xl">
                  <div className="mb-2 h-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-950 transition-all"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => moveSlide("previous")}
                      disabled={activeSlide === 0}
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>

                    <span className="text-xs font-medium text-slate-500">
                      {activeSlide + 1} / {presentation.slides.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => moveSlide("next")}
                      disabled={activeSlide === presentation.slides.length - 1}
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-4">
                <ErrorMessage message={error} />
              </div>
            ) : null}
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Pencil className="h-4 w-4 text-slate-500" />

              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  Edit slide
                </h2>

                <p className="text-xs text-slate-400">
                  Refine the generated content.
                </p>
              </div>
            </div>

            {currentSlide ? (
              <div className="space-y-5">
                <EditableField
                  label="Title"
                  value={currentSlide.title}
                  onChange={(value) => updateCurrentSlide("title", value)}
                />

                <EditableField
                  label="Subtitle"
                  value={currentSlide.subtitle ?? ""}
                  onChange={(value) => updateCurrentSlide("subtitle", value)}
                />

                <EditableField
                  label="Body"
                  value={currentSlide.body ?? ""}
                  onChange={(value) => updateCurrentSlide("body", value)}
                  textarea
                />

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Bullet points
                    </label>

                    <button
                      type="button"
                      onClick={addBullet}
                      className="text-xs font-medium text-slate-700 hover:text-slate-950"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(currentSlide.bullets ?? []).map((bullet, index) => (
                      <div key={`${index}-${bullet}`} className="flex gap-2">
                        <textarea
                          value={bullet}
                          onChange={(event) =>
                            updateBullet(index, event.target.value)
                          }
                          rows={2}
                          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        />

                        <button
                          type="button"
                          onClick={() => removeBullet(index)}
                          className="self-start rounded-lg px-2 py-2 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          title="Remove bullet"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <EditableField
                  label="Speaker notes"
                  value={currentSlide.speakerNotes ?? ""}
                  onChange={(value) =>
                    updateCurrentSlide("speakerNotes", value)
                  }
                  textarea
                />

                <div className="border-t border-slate-100 pt-5">
                  {generationId ? (
                    <SavePresentationResourceButton
                      generationId={generationId}
                      title={presentation.title}
                     description={presentation.subtitle ?? undefined}
                      content={{
                        title: presentation.title,
                       description: presentation.subtitle ?? undefined,
                        slides: presentation.slides.map((slide) => ({
                          id: `slide-${slide.slideNumber}`,
                          title: slide.title,
                          subtitle: slide.subtitle ?? null,
                          content: slide.body ?? null,
                          bullets: slide.bullets ?? [],
                          notes: slide.speakerNotes ?? null,
                        })),
                        prompt: topic,
                      }}
                    />
                  ) : null}

                  <Link
                    href="/library"
                    className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                  >
                    <FileText className="h-4 w-4" />
                    Open My Library
                  </Link>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Header({
  showBack,
  showAskAI,
  title,
  subtitle,
}: {
  showBack: boolean;
  showAskAI: boolean;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        {showBack ? (
          <Link
            href="/create"
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Back to AI Launchpad"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        ) : null}

        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Presentation className="h-4 w-4" />
            AI Launchpad
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            {title ?? "Presentation Creator"}
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            {subtitle ??
              "Create a structured, classroom-ready presentation with Justdy AI."}
          </p>
        </div>
      </div>

      {showAskAI ? (
        <Link
          href="/chat"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          <WandSparkles className="h-4 w-4" />
          Ask Justdy AI
        </Link>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-800">{label}</label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows: number;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-800">{label}</label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-800">{label}</label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
            {suffix ? ` ${suffix}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </label>

      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
        />
      )}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
      {message}
    </div>
  );
}
