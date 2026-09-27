"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { GetWorksheet } from "@/app/actions/ai/get-worksheet";
import { CreateWorksheet } from "@/app/actions/ai/create-worksheet";
import { SaveWorksheet } from "@/app/actions/ai/save-worksheet";


import {
  DEFAULT_WORKSHEET_DESIGN,
  type WorksheetDesign,
} from "@/lib/ai/worksheet/worksheet-design";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  FileText,
  Loader2,
  Save,
  Settings2,
  Sparkles,
  WandSparkles,
  Palette as PaletteIcon,
  PenLine,
} from "lucide-react";

import { renderClassicWorksheet } from "@/lib/ai/worksheet/templates/classic";

import type { WorksheetQuestionType } from "@/lib/ai/worksheet/types";
import type { WorksheetDocument } from "@/lib/ai/worksheet/schema";
import WorksheetEditor from "../ai/worksheet/WorksheetEditor";
import WorksheetDesignPanel from "../ai/worksheet/WorksheetDesignPanel";

interface WorksheetStudioProps {
  subjects: {
    id: string;
    name: string;
  }[];
  mode?: CreationMode;
}

const LETTER_WIDTH_PX = 816;
const LETTER_HEIGHT_PX = 1056;

type CreationMode = "worksheet" | "workbook";

const QUESTION_TYPE_OPTIONS: {
  value: WorksheetQuestionType;
  label: string;
  description: string;
}[] = [
  {
    value: "multiple_choice",
    label: "Multiple Choice",
    description: "Select one correct answer.",
  },
  {
    value: "short_answer",
    label: "Short Answer",
    description: "Write a concise answer.",
  },
  {
    value: "true_false",
    label: "True / False",
    description: "Decide whether the statement is true or false.",
  },
  {
    value: "fill_in_blank",
    label: "Fill in the Blank",
    description: "Complete the missing word or value.",
  },
  {
    value: "matching",
    label: "Matching",
    description: "Match related items together.",
  },
  {
    value: "open_response",
    label: "Open Response",
    description: "Explain your thinking in your own words.",
  },
];


function FieldLabel({
  label,
  optional = false,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold">
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground">(optional)</span>
        )}
      </label>
      {children}
    </div>
  );
}

export default function WorksheetStudio({ subjects, mode: forcedMode }: WorksheetStudioProps) {
  /*
   * ============================================================
   * ROUTING
   * ============================================================
   */

  const searchParams = useSearchParams();
  const router = useRouter();

  const requestedProjectId = searchParams.get("projectId")?.trim() || null;

  const requestedMode: CreationMode =
    forcedMode ?? (searchParams.get("mode") === "workbook" ? "workbook" : "worksheet");

  /*
   * ============================================================
   * FORM STATE
   * ============================================================
   */

  const [prompt, setPrompt] = useState("");

  const [selectedMode, setSelectedMode] = useState<CreationMode | null>(null);
  const mode = selectedMode ?? requestedMode;

  const [customizeOpen, setCustomizeOpen] = useState(false);

  const [gradeLevel, setGradeLevel] = useState("");

  const [subject, setSubject] = useState("");

  const [topic, setTopic] = useState("");

  const [title, setTitle] = useState("");

  const [learningObjective, setLearningObjective] = useState("");

  const [questionCount, setQuestionCount] = useState(10);

  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | "mixed"
  >("medium");

  /*
   * ============================================================
   * QUESTION TYPES
   * ============================================================
   */

  const [questionTypes, setQuestionTypes] = useState<WorksheetQuestionType[]>([
    "multiple_choice",
    "short_answer",
  ]);

  const [customQuestionTypes, setCustomQuestionTypes] = useState(false);

  /*
   * ============================================================
   * WORKSHEET STATE
   * ============================================================
   */

  const [worksheet, setWorksheet] = useState<WorksheetDocument | null>(null);

  const [projectId, setProjectId] = useState<string | null>(null);

  const [generationId, setGenerationId] = useState<string | null>(null);

  /*
   * ============================================================
   * GENERATION
   * ============================================================
   */

  const [generating, setGenerating] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);

  /*
   * ============================================================
   * SAVED WORKSHEET LOADING
   * ============================================================
   */

  const [loadingWorksheet, setLoadingWorksheet] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  /*
   * ============================================================
   * GENERAL ERRORS
   * ============================================================
   */

  const [error, setError] = useState<string | null>(null);

  /*
   * ============================================================
   * EDITING / SAVING
   * ============================================================
   */

  const [editing, setEditing] = useState(false);

  const [design, setDesign] = useState<WorksheetDesign>(DEFAULT_WORKSHEET_DESIGN);
  const [designOpen, setDesignOpen] = useState(false);

  const [isDirty, setIsDirty] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);

  /*
   * ============================================================
   * DOWNLOADING
   * ============================================================
   */

  const [downloading, setDownloading] = useState<
    "worksheet" | "answer-key" | "both" | null
  >(null);

  /*
   * ============================================================
   * PREVIEW
   * ============================================================
   */

  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  const [previewScale, setPreviewScale] = useState(1);
  const [manualZoom, setManualZoom] = useState<number | null>(null);

  /*
   * ============================================================
   * REQUEST TRACKING
   * ============================================================
   */

  const loadingProjectRef = useRef<string | null>(null);

  /*
   * ============================================================
   * TOGGLE QUESTION TYPE
   * ============================================================
   */

  function toggleQuestionType(type: WorksheetQuestionType) {
    setQuestionTypes((current) => {
      if (current.includes(type)) {
        if (current.length === 1) {
          return current;
        }

        return current.filter((item) => item !== type);
      }

      return [...current, type];
    });
  }

  /*
   * ============================================================
   * WORKSHEET CHANGE
   * ============================================================
   */

  function handleWorksheetChange(nextWorksheet: WorksheetDocument) {
    setWorksheet(nextWorksheet);

    setIsDirty(true);

    setSaveError(null);
  }

  /*
   * ============================================================
   * LOAD SAVED WORKSHEET
   * ============================================================
   */

  useEffect(() => {
    /*
     * If there is no projectId, this is the normal
     * "create new worksheet" mode.
     *
     * IMPORTANT:
     *
     * Do NOT call setState() synchronously here.
     * React 19 flags that as a cascading render.
     */

    if (!requestedProjectId) {
      loadingProjectRef.current = null;

      return;
    }

    const currentProjectId = requestedProjectId;

    loadingProjectRef.current = currentProjectId;

    let cancelled = false;

    async function loadWorksheet() {
      /*
       * State updates happen inside the asynchronous
       * operation rather than synchronously at the
       * beginning of the effect.
       */

      setLoadingWorksheet(true);

      setLoadError(null);

      setError(null);

      console.log("[WorksheetStudio] Loading project:", currentProjectId);

      try {
        /*
         * ======================================================
         * LOAD FROM SERVER
         * ======================================================
         */

        const result = await GetWorksheet(currentProjectId);

        console.log("[WorksheetStudio] GetWorksheet result:", result);

        if (cancelled) {
          return;
        }

        /*
         * Make sure this response still belongs
         * to the current project.
         */

        if (loadingProjectRef.current !== currentProjectId) {
          console.log(
            "[WorksheetStudio] Ignoring stale response:",
            currentProjectId,
          );

          return;
        }

        /*
         * ======================================================
         * ERROR
         * ======================================================
         */

        if (!result.success) {
          console.error(
            "[WorksheetStudio] Unable to load worksheet:",
            result.error,
          );

          setLoadError(result.error || "Unable to load worksheet.");

          return;
        }

        /*
         * ======================================================
         * RESTORE WORKSHEET
         * ======================================================
         */

        setWorksheet(result.worksheet);

        setProjectId(result.projectId);

        setGenerationId(result.generationId);

        /*
         * ======================================================
         * RESTORE FORM SETTINGS
         * ======================================================
         */

        setGradeLevel(result.worksheet.gradeLevel);

        setSubject(result.worksheet.subject);

        setTopic(result.worksheet.topic);

        setTitle(result.worksheet.title);

        setLearningObjective(result.worksheet.learningObjective);

        setQuestionCount(result.worksheet.questions.length);

        /*
         * ======================================================
         * RESTORE QUESTION TYPES
         * ======================================================
         */

        const loadedQuestionTypes = Array.from(
          new Set(result.worksheet.questions.map((question) => question.type)),
        );

        if (loadedQuestionTypes.length > 0) {
          setQuestionTypes(loadedQuestionTypes);
        }

        /*
         * ======================================================
         * RESTORE SAVE STATE
         * ======================================================
         */

        setIsDirty(false);

        setSavedAt(new Date(result.savedAt));

        setSaveError(null);

        setError(null);

        setEditing(false);

        console.log(
          "[WorksheetStudio] Worksheet loaded successfully:",
          result.worksheet.title,
        );
      } catch (loadErrorValue) {
        if (cancelled) {
          return;
        }

        if (loadingProjectRef.current !== currentProjectId) {
          return;
        }

        console.error(
          "[WorksheetStudio] Load worksheet error:",
          loadErrorValue,
        );

        setLoadError(
          loadErrorValue instanceof Error
            ? loadErrorValue.message
            : "Unable to load worksheet.",
        );
      } finally {
        if (!cancelled && loadingProjectRef.current === currentProjectId) {
          setLoadingWorksheet(false);
        }
      }
    }

    loadWorksheet();

    return () => {
      cancelled = true;
    };
  }, [requestedProjectId]);

  /*
   * ============================================================
   * SAVE WORKSHEET
   * ============================================================
   */

  async function handleSaveWorksheet() {
    if (!worksheet || !isDirty) {
      return;
    }

    setIsSaving(true);

    setSaveError(null);

    try {
      const result = await SaveWorksheet({
        worksheet,

        projectId,

        generationId,
      });

      if (!result.success) {
        setSaveError(result.error);

        return;
      }

      setProjectId(result.projectId);

      setGenerationId(result.generationId);

      setIsDirty(false);

      setSavedAt(new Date(result.savedAt));
    } catch (err) {
      console.error("Save worksheet error:", err);

      setSaveError(
        err instanceof Error ? err.message : "Unable to save worksheet.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  /*
   * ============================================================
   * GENERATE WORKSHEET
   * ============================================================
   */

  async function handleGenerate() {
    setError(null);
    setLoadError(null);

    if (!prompt.trim()) {
      setError(`Please describe the ${mode} you want to create.`);
      return;
    }

    if (customQuestionTypes && questionTypes.length === 0) {
      setError(
        "Please select at least one question type, or turn off custom question types.",
      );
      return;
    }

    setGenerating(true);
    setPreviewOpen(false);
    setWorksheet(null);
    setProjectId(null);
    setGenerationId(null);
    setSavedAt(null);
    setSaveError(null);

    let succeeded = false;

    try {
      const promptQuestionMatch = prompt.trim().match(/\b(\d{1,2})\s+(?:questions?|items?)\b/i);
        const requestedQuestionCount = promptQuestionMatch
          ? Math.max(1, Math.min(30, Number(promptQuestionMatch[1])))
          : questionCount;

        const result = await Promise.race([
          CreateWorksheet({
            gradeLevel:
              gradeLevel ||
              "AI should determine the appropriate grade level from the user's request.",
            subject:
              subject ||
              "AI should determine the appropriate subject from the user's request.",
            topic: [
              prompt.trim(),
              customizeOpen && topic.trim()
                ? `Topic override: ${topic.trim()}`
                : null,
            ]
              .filter(Boolean)
              .join("\n\n"),
            title: customizeOpen && title.trim() ? title.trim() : undefined,
            learningObjective:
              customizeOpen && learningObjective.trim()
                ? learningObjective.trim()
                : undefined,
            questionCount: requestedQuestionCount,
            difficulty,
            questionTypes: customQuestionTypes
              ? questionTypes
              : QUESTION_TYPE_OPTIONS.map((option) => option.value),
            instructions: [
              `Create a ${mode} based on the user's request.`,
              "The user's natural-language request is the primary and authoritative instruction.",
              "Infer grade level, subject, topic, question count, difficulty, question types, title, learning objective, and other educational details from the request whenever they are explicitly or reasonably implied.",
              customQuestionTypes
                ? `The user explicitly selected these question types: ${questionTypes.join(", ")}. Use those types.`
                : "The user did not explicitly select question types. Choose the most pedagogically appropriate question types for the request.",
              customizeOpen && gradeLevel
                ? `The user explicitly selected grade level: ${gradeLevel}.`
                : "Do not assume Grade 5 unless the user's request indicates it.",
              customizeOpen && subject
                ? `The user explicitly selected subject: ${subject}.`
                : "Infer the subject from the user's request.",
              customizeOpen
                ? "Optional structured preferences are active. Treat explicitly selected structured options as overrides when they do not conflict with the user's request."
                : "No structured creation options were explicitly selected; do not treat the application's default values as user requirements.",
              "Solve each question carefully and show your work where appropriate.",
            ].join(" "),
          }),
          new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(
                new Error(
                  "Worksheet generation is taking too long. Please try again.",
                ),
              );
            }, 300000);
          }),
        ]);

        if (!result.success) {
          setError(result.error);
          setPreviewOpen(false);
          return;
        }

        setWorksheet(result.worksheet);
        setProjectId(null);
        setGenerationId(null);
        setIsDirty(true);
        setSavedAt(null);
        setSaveError(null);
        setLoadError(null);
        setPreviewOpen(true);
        succeeded = true;

        if (requestedProjectId) {
          router.replace("/create/worksheet");
        }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPreviewOpen(false);
    } finally {
      if (succeeded) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      setGenerating(false);
    }
  }

  /*
   * ============================================================
   * DOWNLOAD PDF
   * ============================================================
   */

  async function downloadPdf(type: "worksheet" | "answer-key" | "both") {
    if (!worksheet) {
      return;
    }

    setError(null);

    setDownloading(type);

    try {
      const response = await fetch("/api/ai/worksheet/pdf", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          worksheet,
          type,
          design,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.error || "Unable to generate PDF.");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = url;

      const filename =
        type === "answer-key"
          ? "answer-key.pdf"
          : type === "both"
            ? "worksheet-and-answer-key.pdf"
            : "worksheet.pdf";

      anchor.download = filename;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to download PDF.",
      );
    } finally {
      setDownloading(null);
    }
  }

  /*
   * ============================================================
   * PREVIEW HTML
   * ============================================================
   */

  const previewHtml = useMemo(() => {
    if (!worksheet) {
      return "";
    }

    return renderClassicWorksheet(worksheet, {
      template: design.template,
      design,

      showAnswerKey: false,

      showBranding: true,

      showNameField: true,

      showDateField: true,

      showScoreField: true,

      showPageNumbers: true,
    });
  }, [worksheet, design]);

  /*
   * ============================================================
   * PREVIEW SCALE
   * ============================================================
   */

  useEffect(() => {
    if (!worksheet) {
      return;
    }

    const container = previewContainerRef.current;

    if (!container) {
      return;
    }

    function updateScale() {
      const element = previewContainerRef.current;

      if (!element) {
        return;
      }

      const width = element.clientWidth;

      const height = element.clientHeight;

      if (!width || !height) {
        return;
      }

      const horizontalPadding = 32;

      const verticalPadding = 32;

      const availableWidth = Math.max(0, width - horizontalPadding);

      const availableHeight = Math.max(0, height - verticalPadding);

      const widthScale = availableWidth / LETTER_WIDTH_PX;

      const heightScale = availableHeight / LETTER_HEIGHT_PX;

      const scale = Math.min(widthScale, heightScale, 1);

      setPreviewScale(Math.max(scale, 0.1));
    }

    updateScale();

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    observer.observe(container);

    window.addEventListener("resize", updateScale);

    return () => {
      observer.disconnect();

      window.removeEventListener("resize", updateScale);
    };
  }, [worksheet, manualZoom]);

  /*
   * ============================================================
   * BEFORE UNLOAD
   * ============================================================
   */

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();

      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  /*
   * ============================================================
   * LOADING SCREEN
   * ============================================================
   */

  if (loadingWorksheet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />

          <h2 className="mt-4 text-lg font-semibold">Loading worksheet...</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Restoring your saved worksheet.
          </p>

          {requestedProjectId && (
            <p className="mt-3 max-w-sm break-all text-[11px] text-muted-foreground/70">
              Project: {requestedProjectId}
            </p>
          )}
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * LOAD ERROR
   * ============================================================
   */

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
        <div className="w-full max-w-md rounded-xl border bg-background p-6 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-destructive" />

          <h2 className="mt-4 text-lg font-semibold">
            Unable to load worksheet
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>

          {requestedProjectId && (
            <div className="mt-4 rounded-lg bg-muted p-3 text-left">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Project ID
              </div>

              <div className="mt-1 break-all font-mono text-xs">
                {requestedProjectId}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={() => router.push("/manage/ai/worksheet")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              My Worksheets
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * MAIN UI
   * ============================================================
   */

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
        <header className="flex shrink-0 items-center justify-between py-1.5">
          <button
            type="button"
            onClick={() => router.push("/create")}
            className="inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Create</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/manage/ai/worksheet")}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition hover:bg-muted"
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
            My Worksheets
          </button>
        </header>

        <section className="flex min-h-0 flex-1 items-center justify-center overflow-hidden py-5 sm:py-8">
          <div className="flex w-full max-w-4xl flex-col">
            <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-7">
              <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-card text-primary shadow-sm">
                <WandSparkles className="h-4.5 w-4.5" />
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                Create a worksheet
              </h1>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Describe what your learners need. Justdy turns your idea into
                a polished, classroom-ready {mode}.
              </p>
            </div>

            <div className="mx-auto w-full max-w-3xl">
              <div className="relative z-20 overflow-visible rounded-[24px] border border-border/80 bg-card shadow-xl shadow-black/[0.04] dark:shadow-black/30">
                <div className="border-b border-border/60 px-4 pt-4 sm:px-5 sm:pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Create a resource
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Choose what you want Justdy to create.
                      </p>
                    </div>

                    <div className="inline-flex rounded-xl border border-border/70 bg-muted/30 p-1">
                      <button
                        type="button"
                        disabled={generating}
                        onClick={() => setSelectedMode("worksheet")}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                          mode === "worksheet"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Worksheet
                      </button>
                      <button
                        type="button"
                        disabled={generating}
                        onClick={() => setSelectedMode("workbook")}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                          mode === "workbook"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Workbook
                      </button>
                    </div>
                  </div>
                </div>

                <textarea
                  autoFocus
                  value={prompt}
                  disabled={generating}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                      event.preventDefault();
                      void handleGenerate();
                    }
                  }}
                  placeholder={`Describe the ${mode} you want to create...`}
                  rows={4}
                  className="block min-h-[128px] w-full resize-none border-0 bg-transparent px-5 py-4 text-sm leading-6 outline-none placeholder:text-muted-foreground/55 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[150px] sm:px-6 sm:py-5 sm:text-[15px]"
                />

                <div className="relative z-30 rounded-b-[24px] border-t border-border/70 bg-muted/20 px-3 py-3 sm:px-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <StudioSelect
                        label="Grade"
                        value={gradeLevel || "AI decides"}
                        options={[
                          "AI decides",
                          ...Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`),
                        ]}
                        onChange={(value) =>
                          setGradeLevel(value === "AI decides" ? "" : value)
                        }
                        disabled={generating}
                      />

                      <StudioSelect
                        label="Subject"
                        value={subject || "AI decides"}
                        options={[
                          "AI decides",
                          ...subjects.map((item) => item.name),
                        ]}
                        onChange={(value) =>
                          setSubject(value === "AI decides" ? "" : value)
                        }
                        disabled={generating}
                      />

                      <StudioSelect
                        label="Questions"
                        value={String(questionCount)}
                        options={["5", "10", "15", "20", "25", "30"]}
                        onChange={(value) => setQuestionCount(Number(value))}
                        disabled={generating}
                      />

                      <StudioSelect
                        label="Difficulty"
                        value={difficulty}
                        options={["easy", "medium", "hard", "mixed"]}
                        onChange={(value) =>
                          setDifficulty(value as "easy" | "medium" | "hard" | "mixed")
                        }
                        disabled={generating}
                      />

                      <button
                        type="button"
                        disabled={generating}
                        onClick={() => setCustomizeOpen((current) => !current)}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition ${
                          customizeOpen
                            ? "border-primary/30 bg-primary/5 text-primary"
                            : "border-border/70 bg-background text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        More options
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${
                            customizeOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleGenerate()}
                      disabled={
                        generating ||
                        !prompt.trim() ||
                        (customQuestionTypes && questionTypes.length === 0)
                      }
                      className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate
                    </button>
                  </div>

                  {customizeOpen && (
                    <div className="mt-3 grid gap-3 border-t border-border/60 pt-3 sm:grid-cols-2 lg:grid-cols-4">
                      <FieldLabel label="Topic" optional>
                        <input
                          value={topic}
                          onChange={(event) => setTopic(event.target.value)}
                          placeholder="Override the prompt topic"
                          className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                      </FieldLabel>

                      <FieldLabel label="Worksheet Title" optional>
                        <input
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          placeholder="Let AI create it"
                          className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                      </FieldLabel>

                      <FieldLabel label="Learning Objective" optional>
                        <input
                          value={learningObjective}
                          onChange={(event) => setLearningObjective(event.target.value)}
                          placeholder="Let AI infer it"
                          className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                      </FieldLabel>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-semibold">Question Types</span>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomQuestionTypes((current) => !current)
                            }
                            className={`rounded-full border px-2 py-1 text-[10px] font-semibold transition ${
                              customQuestionTypes
                                ? "border-primary bg-primary/10 text-primary"
                                : "bg-background text-muted-foreground"
                            }`}
                          >
                            {customQuestionTypes ? "Custom" : "AI decides"}
                          </button>
                        </div>
                        {customQuestionTypes ? (
                          <div className="flex flex-wrap gap-1.5">
                            {QUESTION_TYPE_OPTIONS.map((option) => {
                              const selected = questionTypes.includes(option.value);
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => toggleQuestionType(option.value)}
                                  className={`rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition ${
                                    selected
                                      ? "border-primary bg-primary/5 text-primary"
                                      : "bg-background text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {selected ? "✓ " : ""}
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] leading-5 text-muted-foreground">
                            Justdy selects the most appropriate mix.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="mr-1">Try:</span>
                {[
                  "Grade 5 fractions practice",
                  "Grade 8 transformations",
                  "Reading comprehension with an answer key",
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setPrompt(example)}
                    disabled={generating}
                    className="rounded-full border border-border/70 bg-card px-3 py-1.5 shadow-sm transition hover:border-primary/30 hover:text-foreground disabled:opacity-50"
                  >
                    {example}
                  </button>
                ))}
              </div>

              {(error || saveError) && (
                <div className="mx-auto mt-4 max-w-3xl rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                  {error || saveError}
                </div>
              )}

              <p className="mt-5 text-center text-[11px] text-muted-foreground">
                AI can infer missing details from your prompt. You can fine-tune
                them with More options.
              </p>
            </div>
          </div>
        </section>
      </div>

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 p-3 backdrop-blur-md sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Worksheet generation preview"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !generating) {
              setPreviewOpen(false);
            }
          }}
        >
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-border bg-card shadow-2xl sm:max-h-[calc(100vh-3rem)]">
            <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {generating ? `Creating your ${mode}` : worksheet?.title || `Your ${mode}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {generating
                      ? `Justdy is writing, checking, and formatting your ${mode}.`
                      : worksheet
                        ? `${worksheet.questions.length} questions ready`
                        : `${mode === "workbook" ? "Workbook" : "Worksheet"} preview`}
                  </p>
                </div>
              </div>

              {!generating && (
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Close preview"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              )}
            </div>

            {generating ? (
              <div className="flex min-h-[440px] flex-1 items-center justify-center p-6 sm:min-h-[560px]">
                <div className="w-full max-w-sm text-center">
                  <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-[32px] border border-border/70 bg-background shadow-sm">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
                      <PenLine className="h-12 w-12 -rotate-12 animate-bounce text-primary" aria-hidden="true" />
                      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5" aria-hidden="true">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/50" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/70 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>

                  <p className="mt-6 text-sm font-semibold">
                    Justdy AI is writing your {mode}
                  </p>

                  <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                    Creating content, checking answers, and laying out your {mode}.
                  </p>

                  <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    Working on it...
                  </div>
                </div>
              </div>

            ) : worksheet ? (
              <>
                <div
                  ref={previewContainerRef}
                  className="min-h-0 flex-1 overflow-auto bg-muted/50 p-3 dark:bg-background/80 sm:p-6"
                >
                  <div className="flex min-h-full w-full items-start justify-center">
                    <iframe
                      key={`${projectId ?? "new"}-${generationId ?? "preview"}-${JSON.stringify(design)}`}
                      srcDoc={previewHtml}
                      title={`${mode === "workbook" ? "Workbook" : "Worksheet"} Preview`}
                      scrolling="no"
                      className="h-[760px] w-[588px] shrink-0 rounded-xl border-0 bg-white shadow-lg sm:h-[900px] sm:w-[695px]"
                    />
                  </div>
                </div>

                {error && (
                  <div className="shrink-0 border-t border-destructive/15 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
                    {error}
                  </div>
                )}

                <div className="flex shrink-0 flex-col gap-2 border-t border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div className="text-xs text-muted-foreground">
                    {savedAt
                      ? `Saved ${savedAt.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}`
                      : `${worksheet.questions.length} questions • Ready to edit`}
                  </div>

                  <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold transition hover:bg-muted sm:flex-none"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => setDesignOpen(true)}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold transition hover:bg-muted sm:flex-none"
                    >
                      <PaletteIcon className="h-3.5 w-3.5" />
                      Design
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleSaveWorksheet()}
                      disabled={!isDirty || isSaving}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 sm:flex-none"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      {isSaving ? "Saving..." : "Save"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void downloadPdf("both")}
                      disabled={downloading !== null}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold transition hover:bg-muted disabled:opacity-50 sm:flex-none"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export
                    </button>
                  </div>
                </div>

                {savedAt && (
                  <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5" />
                      Saved to My Worksheets
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push("/manage/ai/worksheet")}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Open My Worksheets →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-[440px] flex-1 items-center justify-center p-6 text-center">
                <div>
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-medium">No {mode} preview yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {designOpen && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Close design panel"
            onClick={() => setDesignOpen(false)}
            className="absolute inset-0 bg-foreground/35 backdrop-blur-[2px]"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l bg-background shadow-2xl">
            <WorksheetDesignPanel
              value={design}
              onChange={(next) => {
                setDesign(next);
                setIsDirty(true);
              }}
              onReset={() => {
                setDesign(DEFAULT_WORKSHEET_DESIGN);
                setIsDirty(true);
              }}
            />
            <div className="border-t p-4">
              <button
                type="button"
                onClick={() => setDesignOpen(false)}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
              >
                Done
              </button>
            </div>
          </aside>
        </div>
      )}

      {worksheet && editing && (
        <WorksheetEditor
          worksheet={worksheet}
          design={design}
          onChange={handleWorksheetChange}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function StudioSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-lg border border-border/70 bg-background px-2.5 text-[11px] font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="text-muted-foreground/60">{label}</span>
        <span className="max-w-[105px] truncate text-foreground">{value}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
      </button>

      {open && !disabled && (
        <div className="absolute bottom-[calc(100%+0.5rem)] left-0 z-[100] min-w-[170px] max-w-[240px] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-2xl">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-muted ${
                value === option ? "bg-primary/5 text-primary" : ""
              }`}
            >
              {option}
              {value === option && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}