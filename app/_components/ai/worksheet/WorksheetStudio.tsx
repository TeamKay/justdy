"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { GetWorksheet } from "@/app/actions/ai/get-worksheet";
import { CreateWorksheet } from "@/app/actions/ai/create-worksheet";
import { SaveWorksheet } from "@/app/actions/ai/save-worksheet";

import WorksheetEditor from "./WorksheetEditor";
import WorksheetDesignPanel from "./WorksheetDesignPanel";
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
  Share2,
} from "lucide-react";

import { renderClassicWorksheet } from "@/lib/ai/worksheet/templates/classic";

import type { WorksheetQuestionType } from "@/lib/ai/worksheet/types";
import type { WorksheetDocument } from "@/lib/ai/worksheet/schema";

interface WorksheetStudioProps {
  subjects: {
    id: string;
    name: string;
  }[];
}

const LETTER_WIDTH_PX = 816;
const LETTER_HEIGHT_PX = 1056;

function sanitizeDownloadName(value: string, fallback: string) {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return normalized || fallback;
}

type CreationMode = "worksheet" | "workbook";

const PROMPT_DRAFT_KEY = "justdy.worksheetStudio.promptDraft";
const PROMPT_HISTORY_KEY = "justdy.worksheetStudio.promptHistory";
const RECENT_WORKSHEETS_KEY = "justdy.worksheetStudio.recentWorksheets";

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

function getWorksheetQualitySummary(worksheet: WorksheetDocument | null) {
  if (!worksheet) return null;

  const questions = Array.isArray(worksheet.questions) ? worksheet.questions : [];
  const serialized = questions.map((question) => JSON.stringify(question));
  const duplicateCount = serialized.length - new Set(serialized).size;
  const emptyCount = questions.filter((question) => {
    const value = question as unknown as Record<string, unknown>;
    const candidates = [value.prompt, value.question, value.text, value.stem];
    return candidates.every(
      (candidate) => typeof candidate !== "string" || !candidate.trim(),
    );
  }).length;

  const issueCount = duplicateCount + emptyCount;
  return {
    questionCount: questions.length,
    duplicateCount,
    emptyCount,
    issueCount,
    status: issueCount === 0 ? "ready" : "review",
  } as const;
}

function getWorksheetPreviewHtml(
  worksheet: WorksheetDocument | null,
  design: WorksheetDesign,
  showAnswerKey: boolean,
) {
  if (!worksheet) return "";

  return renderClassicWorksheet(worksheet, {
    template: design.template,
    design,
    showAnswerKey,
    showBranding: true,
    showNameField: !showAnswerKey,
    showDateField: !showAnswerKey,
    showScoreField: !showAnswerKey,
    showPageNumbers: true,
  });
}

/**
 * React Compiler note: worksheet preview markup is intentionally derived through a
 * pure module-level renderer instead of component-local memoization. This keeps the
 * existing renderer authoritative while avoiding manual memoization boundaries that
 * the compiler cannot preserve.
 */

function WorksheetPreviewFrame({
  worksheet,
  design,
  previewTab,
  projectId,
  generationId,
  previewScale,
  manualZoom,
}: {
  worksheet: WorksheetDocument;
  design: WorksheetDesign;
  previewTab: "worksheet" | "answer-key";
  projectId: string | null;
  generationId: string | null;
  previewScale: number;
  manualZoom: number | null;
}) {
  const zoom = manualZoom ?? previewScale;

  const pageWidth = LETTER_WIDTH_PX * zoom;
  const pageHeight = LETTER_HEIGHT_PX * zoom;

  return (
    <div className="flex min-h-full w-full items-start justify-center">
      <div
        className="relative shrink-0 transition-[width,height] duration-150"
        style={{ width: pageWidth, height: pageHeight }}
      >
        <iframe
          key={`${projectId ?? "new"}-${generationId ?? "preview"}-${previewTab}-${JSON.stringify(design)}`}
          srcDoc={getWorksheetPreviewHtml(worksheet, design, previewTab === "answer-key")}
          title={previewTab === "answer-key" ? "Answer Key Preview" : "Worksheet Preview"}
          sandbox="allow-same-origin"
          referrerPolicy="no-referrer"
          scrolling="no"
          className="absolute left-0 top-0 h-[1056px] w-[816px] origin-top-left rounded-xl border-0 bg-white shadow-[0_20px_70px_rgba(0,0,0,0.55)]"
          style={{ transform: `scale(${zoom})` }}
        />
      </div>
    </div>
  );
}

export default function WorksheetStudio({ subjects }: WorksheetStudioProps) {
  /*
   * ============================================================
   * ROUTING
   * ============================================================
   */

  const searchParams = useSearchParams();
  const router = useRouter();

  const requestedProjectId = searchParams.get("projectId")?.trim() || null;

  const mode: CreationMode =
    searchParams.get("mode") === "workbook" ? "workbook" : "worksheet";

  /*
   * ============================================================
   * FORM STATE
   * ============================================================
   */

  const [prompt, setPrompt] = useState("");

  function handleModeChange(nextMode: CreationMode) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextMode === "workbook") {
      params.set("mode", "workbook");
    } else {
      params.set("mode", "worksheet");
    }

    router.replace(`/create/worksheet?${params.toString()}`);
  }


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

  const [exportOpen, setExportOpen] = useState(false);

  const [draftSaved, setDraftSaved] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [recentWorksheets, setRecentWorksheets] = useState<
    { projectId: string; title: string; savedAt: string }[]
  >([]);
  const [recentWorksheetsOpen, setRecentWorksheetsOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

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
  const [previewTab, setPreviewTab] = useState<"worksheet" | "answer-key">("worksheet");
  const worksheetTabRef = useRef<HTMLButtonElement | null>(null);
  const answerKeyTabRef = useRef<HTMLButtonElement | null>(null);

  function focusPreviewTab(tab: "worksheet" | "answer-key") {
    setPreviewTab(tab);
    window.requestAnimationFrame(() => {
      if (tab === "worksheet") {
        worksheetTabRef.current?.focus();
      } else {
        answerKeyTabRef.current?.focus();
      }
    });
  }
  const [manualZoom, setManualZoom] = useState<number | null>(null);

  /*
   * ============================================================
   * REQUEST TRACKING
   * ============================================================
   */

  const loadingProjectRef = useRef<string | null>(null);
  const localStorageHydratedRef = useRef(false);

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
   * DRAFT + PROMPT HISTORY
   * ============================================================
   */


  useEffect(() => {
    // Defer client-only localStorage hydration until after the initial render.
    // This avoids React 19's setState-in-effect cascading-render warning while
    // also keeping the server and first client render hydration-safe.
    const timer = window.setTimeout(() => {
      try {
        const draft = window.localStorage.getItem(PROMPT_DRAFT_KEY);
        if (draft) setPrompt(draft);

        const history = window.localStorage.getItem(PROMPT_HISTORY_KEY);
        if (history) {
          const parsed: unknown = JSON.parse(history);
          if (Array.isArray(parsed)) {
            setPromptHistory(
              parsed
                .filter((item): item is string => typeof item === "string")
                .slice(0, 8),
            );
          }
        }

        const recent = window.localStorage.getItem(RECENT_WORKSHEETS_KEY);
        if (recent) {
          const parsed: unknown = JSON.parse(recent);
          if (Array.isArray(parsed)) {
            setRecentWorksheets(
              parsed
                .filter(
                  (item): item is { projectId: string; title: string; savedAt: string } =>
                    !!item &&
                    typeof item === "object" &&
                    typeof (item as { projectId?: unknown }).projectId === "string" &&
                    typeof (item as { title?: unknown }).title === "string" &&
                    typeof (item as { savedAt?: unknown }).savedAt === "string",
                )
                .slice(0, 6),
            );
          }
        }
        localStorageHydratedRef.current = true;
      } catch (storageError) {
        console.warn("[WorksheetStudio] Unable to restore local draft/history:", storageError);
        localStorageHydratedRef.current = true;
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const value = prompt;
    const timer = window.setTimeout(() => {
      try {
        if (value.trim()) {
          window.localStorage.setItem(PROMPT_DRAFT_KEY, value);
        } else {
          window.localStorage.removeItem(PROMPT_DRAFT_KEY);
        }
        setDraftSaved(Boolean(value.trim()));
      } catch (storageError) {
        console.warn("[WorksheetStudio] Unable to save local draft:", storageError);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [prompt]);

  function rememberPrompt(value: string) {
    const normalized = value.trim();
    if (!normalized) return;

    // Keep the state updater pure. React may invoke updater functions more
    // than once in development, so persistence belongs in the effect below.
    setPromptHistory((current) =>
      [normalized, ...current.filter((item) => item !== normalized)].slice(0, 8),
    );
  }

  function clearPromptDraft() {
    setPrompt("");
    setDraftSaved(false);
    try {
      window.localStorage.removeItem(PROMPT_DRAFT_KEY);
    } catch (storageError) {
      console.warn("[WorksheetStudio] Unable to clear local draft:", storageError);
    }
  }

  function rememberRecentWorksheet(next: { projectId: string; title: string; savedAt: string }) {
    // Keep the state updater pure; persistence is handled by the effect below.
    setRecentWorksheets((current) =>
      [next, ...current.filter((item) => item.projectId !== next.projectId)].slice(0, 6),
    );
  }

  useEffect(() => {
    if (!localStorageHydratedRef.current) return;

    try {
      window.localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(promptHistory));
    } catch (storageError) {
      console.warn("[WorksheetStudio] Unable to save prompt history:", storageError);
    }
  }, [promptHistory]);

  useEffect(() => {
    if (!localStorageHydratedRef.current) return;

    try {
      window.localStorage.setItem(RECENT_WORKSHEETS_KEY, JSON.stringify(recentWorksheets));
    } catch (storageError) {
      console.warn("[WorksheetStudio] Unable to save recent worksheets:", storageError);
    }
  }, [recentWorksheets]);

  function openRecentWorksheet(recent: { projectId: string }) {
    setRecentWorksheetsOpen(false);
    setHistoryOpen(false);
    router.push(`/create/worksheet?projectId=${encodeURIComponent(recent.projectId)}`);
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
       * Yield before the first state transition. React's
       * set-state-in-effect lint rule treats an async function
       * invoked directly by an effect as synchronous until its
       * first await. The yield keeps the effect free of a
       * synchronous cascading render while preserving the
       * existing loading behavior.
       */
      await Promise.resolve();

      if (cancelled || loadingProjectRef.current !== currentProjectId) {
        return;
      }

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

  async function handleShareWorksheet() {
    if (!projectId) {
      setShareStatus("Save the worksheet first to create a shareable link.");
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("projectId", projectId);
    url.searchParams.set("mode", mode);

    try {
      if (navigator.share) {
        await navigator.share({
          title: worksheet?.title || "Justdy worksheet",
          text: "Open this worksheet in Justdy.",
          url: url.toString(),
        });
        setShareStatus("Share sheet opened.");
      } else {
        await navigator.clipboard.writeText(url.toString());
        setShareStatus("Share link copied.");
      }
    } catch (err) {
      // A dismissed native share sheet is not an application error.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setShareStatus("Unable to create the share link.");
    }
  }

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
      rememberRecentWorksheet({
        projectId: result.projectId,
        title: worksheet.title || "Untitled worksheet",
        savedAt: result.savedAt,
      });
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

    rememberPrompt(prompt);
    setGenerating(true);
    setPreviewOpen(true);
    setWorksheet(null);
    setProjectId(null);
    setGenerationId(null);
    setSavedAt(null);
    setSaveError(null);

    let succeeded = false;
    let generationTimeout: ReturnType<typeof setTimeout> | null = null;

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
            generationTimeout = setTimeout(() => {
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
        setPreviewTab("worksheet");
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
      if (generationTimeout) {
        clearTimeout(generationTimeout);
        generationTimeout = null;
      }

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

  function handlePrint(type: "worksheet" | "answer-key") {
    const html = getWorksheetPreviewHtml(worksheet, design, type === "answer-key");

    if (!html) {
      setError("Generate a worksheet before printing.");
      return;
    }

    try {
      // Keep a usable Window reference for the print flow, then explicitly
      // sever the opener relationship for security. Some browsers return
      // null for window.open when noopener is supplied as a feature flag.
      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        setError("Your browser blocked the print window. Allow pop-ups for Justdy and try again.");
        return;
      }

      printWindow.opener = null;
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      let printed = false;
      const printWhenReady = () => {
        if (printed) return;
        printed = true;
        printWindow.focus();
        printWindow.print();
      };

      if (printWindow.document.readyState === "complete") {
        window.setTimeout(printWhenReady, 50);
      } else {
        printWindow.addEventListener("load", printWhenReady, { once: true });
      }
    } catch (printError) {
      console.error("[WorksheetStudio] Print error:", printError);
      setError("Unable to open the print preview.");
    }
  }

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

      const baseName = sanitizeDownloadName(worksheet.title, "worksheet");
      const filename =
        type === "answer-key"
          ? `${baseName}-answer-key.pdf`
          : type === "both"
            ? `${baseName}-worksheet-and-answer-key.pdf`
            : `${baseName}.pdf`;

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

  const qualitySummary = getWorksheetQualitySummary(worksheet);


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

    // Defer the initial measurement until after the effect commits.
    // ResizeObserver/resize callbacks are already asynchronous, so they can
    // update React state without triggering the setState-in-effect warning.
    const frame = window.requestAnimationFrame(updateScale);

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    observer.observe(container);

    window.addEventListener("resize", updateScale);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [worksheet]);

  /*
   * ============================================================
   * KEYBOARD SHORTCUTS
   * ============================================================
   */

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !generating) {
        event.preventDefault();
        void handleGenerate();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s" && worksheet && !isSaving) {
        event.preventDefault();
        void handleSaveWorksheet();
        return;
      }

      if (event.key === "Escape" && previewOpen && !generating) {
        if (exportOpen) {
          setExportOpen(false);
          return;
        }
        if (recentWorksheetsOpen) {
          setRecentWorksheetsOpen(false);
          return;
        }
        if (!isTyping) {
          setPreviewOpen(false);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [exportOpen, generating, handleGenerate, handleSaveWorksheet, isSaving, previewOpen, recentWorksheetsOpen, worksheet]);

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
   * MAIN UI — VIDEO-STUDIO-STYLE WORKSHEET EXPERIENCE
   * ============================================================
   */

  return (
    <main className="min-h-screen overflow-hidden bg-[#090a0c] text-foreground">
      <header className="absolute inset-x-0 top-0 z-20 flex h-16 items-center justify-between px-5 sm:px-7">
        <button
          type="button"
          onClick={() => router.push("/create")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          Back to Create
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          {recentWorksheets.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setRecentWorksheetsOpen((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white"
              >
                <FileText className="size-3.5" />
                Recent
                <ChevronDown className="size-3" />
              </button>
              {recentWorksheetsOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#17181b] p-1.5 shadow-2xl">
                  {recentWorksheets.map((item) => (
                    <button
                      key={item.projectId}
                      type="button"
                      onClick={() => openRecentWorksheet(item)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.07]"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                        <FileText className="size-3.5 text-white/50" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium text-white/75">{item.title}</span>
                        <span className="mt-0.5 block text-[9px] text-white/30">
                          Saved {new Date(item.savedAt).toLocaleDateString()}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => router.push("/manage/ai/worksheet")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white"
          >
            <FileText className="size-3.5" />
            My Worksheets
          </button>
        </div>
      </header>

      <div
        className="relative flex min-h-screen items-center justify-center px-4 pb-8 pt-20 sm:px-8"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,80,255,0.06),transparent_38%)]" />

        <section className="relative z-10 w-full max-w-3xl">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/80 shadow-2xl backdrop-blur-xl">
              <FileText className="size-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Create a worksheet
            </h1>
            <p className="mt-1 text-xs text-white/40">
              Describe the learning activity you need, then tune the worksheet settings below.
            </p>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#151619]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2 sm:px-4">
              <div className="text-[10px] text-white/25">
                {draftSaved ? "Draft saved" : "Start with a prompt"}
              </div>
              <div className="flex items-center gap-1.5">
                {promptHistory.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => setHistoryOpen((value) => !value)}
                      className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-[10px] text-white/40 transition hover:bg-white/[0.07] hover:text-white/70"
                    >
                      Recent <ChevronDown className="size-3" />
                    </button>
                    {historyOpen && (
                      <div className="absolute right-0 top-[calc(100%+0.4rem)] z-40 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#17181b] p-1 shadow-2xl">
                        {promptHistory.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => { setPrompt(item); setHistoryOpen(false); }}
                            className="block w-full truncate rounded-lg px-3 py-2 text-left text-[10px] text-white/55 transition hover:bg-white/[0.07] hover:text-white"
                            title={item}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {prompt.trim() && (
                  <button
                    type="button"
                    disabled={generating}
                    onClick={clearPromptDraft}
                    className="inline-flex h-7 items-center rounded-lg px-2 text-[10px] text-white/25 transition hover:bg-white/[0.05] hover:text-white/60"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <textarea
              autoFocus
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              disabled={generating}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void handleGenerate();
                }
              }}
              placeholder="Describe the worksheet you want to create..."
              rows={8}
              className="block min-h-[290px] w-full resize-none border-0 bg-transparent px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-5"
            />

            {customizeOpen && (
              <div className="mx-3 mb-3 grid gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 sm:mx-4 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
                <DarkField label="Topic" optional>
                  <input
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    disabled={generating}
                    placeholder="Optional topic override"
                    className="h-9 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-[11px] text-white outline-none placeholder:text-white/25 focus:border-white/25"
                  />
                </DarkField>
                <DarkField label="Title" optional>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={generating}
                    placeholder="Let AI create it"
                    className="h-9 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-[11px] text-white outline-none placeholder:text-white/25 focus:border-white/25"
                  />
                </DarkField>
                <DarkField label="Learning objective" optional>
                  <input
                    value={learningObjective}
                    onChange={(event) => setLearningObjective(event.target.value)}
                    disabled={generating}
                    placeholder="Let AI infer it"
                    className="h-9 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-[11px] text-white outline-none placeholder:text-white/25 focus:border-white/25"
                  />
                </DarkField>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-white/75">Question types</span>
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => setCustomQuestionTypes((value) => !value)}
                      className={`rounded-full border px-2 py-1 text-[9px] font-semibold transition ${
                        customQuestionTypes
                          ? "border-white/20 bg-white/10 text-white"
                          : "border-white/10 bg-black/20 text-white/40"
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
                            disabled={generating}
                            onClick={() => toggleQuestionType(option.value)}
                            title={option.description}
                            className={`rounded-lg border px-2 py-1.5 text-[9px] font-semibold transition ${
                              selected
                                ? "border-white/20 bg-white/10 text-white"
                                : "border-white/10 bg-black/20 text-white/40 hover:text-white/70"
                            }`}
                          >
                            {selected ? "✓ " : ""}{option.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] leading-4 text-white/30">Justdy chooses a pedagogically appropriate mix.</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-3 py-3 sm:px-4">
              <DarkToolbarSelect
                label="Grade"
                value={gradeLevel || "AI decides"}
                options={["AI decides", ...Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`)]}
                onChange={(value) => setGradeLevel(value === "AI decides" ? "" : value)}
                disabled={generating}
              />
              <DarkToolbarSelect
                label="Subject"
                value={subject || "AI decides"}
                options={["AI decides", ...subjects.map((item) => item.name)]}
                onChange={(value) => setSubject(value === "AI decides" ? "" : value)}
                disabled={generating}
              />
              <DarkToolbarSelect
                label="Questions"
                value={String(questionCount)}
                options={["5", "10", "15", "20", "25", "30"]}
                onChange={(value) => setQuestionCount(Number(value))}
                disabled={generating}
              />
              <DarkToolbarSelect
                label="Difficulty"
                value={difficulty}
                options={["easy", "medium", "hard", "mixed"]}
                onChange={(value) => setDifficulty(value as "easy" | "medium" | "hard" | "mixed")}
                disabled={generating}
              />

              <button
                type="button"
                disabled={generating}
                onClick={() => setCustomizeOpen((value) => !value)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12px] font-medium transition ${
                  customizeOpen
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/45 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <Settings2 className="size-3.5" />
                <span className="hidden sm:inline">More options</span>
                <ChevronDown className={`size-3 transition-transform ${customizeOpen ? "rotate-180" : ""}`} />
              </button>

              <div className="ml-auto flex items-center gap-2">
                <span className="hidden text-[10px] text-white/25 lg:inline">
                  {gradeLevel || "AI"} · {subject || "AI"} · {questionCount} · {difficulty}
                </span>
                <button
                  type="button"
                  disabled={
                    generating ||
                    !prompt.trim() ||
                    (customQuestionTypes && questionTypes.length === 0)
                  }
                  onClick={() => void handleGenerate()}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-semibold text-black shadow-lg transition hover:bg-white/90 disabled:pointer-events-none disabled:opacity-30"
                >
                  {generating ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">{generating ? "Creating..." : "Generate"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] text-white/30">
            <span className="mr-1">Try:</span>
            {[
              "Grade 5 fractions practice",
              "Grade 8 transformations",
              "Reading comprehension with an answer key",
            ].map((example) => (
              <button
                key={example}
                type="button"
                disabled={generating}
                onClick={() => setPrompt(example)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-40"
              >
                {example}
              </button>
            ))}
          </div>

          {(error || saveError) && (
            <div className="mx-auto mt-3 max-w-3xl rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2.5 text-xs text-red-300">
              {error || saveError}
            </div>
          )}

          <p className="mt-4 text-center text-[10px] text-white/20">
            Justdy can infer missing educational details from your request. Use More options when you want explicit control.
          </p>
        </section>
      </div>

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-md sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-label="Worksheet generation preview"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !generating) {
              setExportOpen(false);
              setPreviewOpen(false);
            }
          }}
        >
          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111214]/95 shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/70">
                  <FileText className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    {generating ? "Creating your worksheet" : worksheet?.title || "Worksheet preview"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/35">
                    {generating
                      ? "Writing questions, checking answers, and formatting the page."
                      : worksheet
                        ? `${worksheet.questions.length} questions · ready to edit and export`
                        : "Worksheet preview"}
                  </p>
                  {!generating && qualitySummary && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold ${
                        qualitySummary.status === "ready"
                          ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300/80"
                          : "border-amber-400/20 bg-amber-400/5 text-amber-200/80"
                      }`}>
                        <Check className="size-2.5" />
                        {qualitySummary.status === "ready" ? "Basic quality check passed" : "Review suggested"}
                      </span>
                      {qualitySummary.issueCount > 0 && (
                        <span className="text-[9px] text-white/30">
                          {qualitySummary.duplicateCount > 0 ? `${qualitySummary.duplicateCount} duplicate${qualitySummary.duplicateCount === 1 ? "" : "s"}` : ""}
                          {qualitySummary.duplicateCount > 0 && qualitySummary.emptyCount > 0 ? " · " : ""}
                          {qualitySummary.emptyCount > 0 ? `${qualitySummary.emptyCount} empty` : ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                disabled={generating}
                className="inline-flex size-8 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-30"
                aria-label="Close preview"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            {generating ? (
              <div className="flex min-h-[520px] flex-1 items-center justify-center p-6">
                <div className="w-full max-w-sm text-center">
                  <div className="mx-auto flex size-32 items-center justify-center rounded-[30px] border border-white/10 bg-white/[0.035] shadow-2xl">
                    <div className="relative flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <PenLine className="size-10 -rotate-12 animate-bounce text-white/75" />
                      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                        <span className="size-1.5 animate-pulse rounded-full bg-white/30" />
                        <span className="size-1.5 animate-pulse rounded-full bg-white/50 [animation-delay:150ms]" />
                        <span className="size-1.5 animate-pulse rounded-full bg-white/80 [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                  <p className="mt-6 text-sm font-semibold text-white/85">Justdy AI is writing your worksheet</p>
                  <p className="mx-auto mt-1.5 max-w-xs text-xs leading-5 text-white/35">
                    Creating content, checking answer logic, and preparing a classroom-ready layout.
                  </p>
                  <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium text-white/35">
                    <span className="size-1.5 animate-pulse rounded-full bg-white/70" />
                    Working on it...
                  </div>
                </div>
              </div>
            ) : worksheet ? (
              <>
                <div role="tablist" aria-label="Worksheet preview" className="flex shrink-0 items-center gap-1 border-b border-white/[0.07] bg-[#111214] px-3 py-2 sm:px-5">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewTab === "worksheet"}
                    aria-controls="worksheet-preview-panel"
                    tabIndex={previewTab === "worksheet" ? 0 : -1}
                    ref={worksheetTabRef}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                        event.preventDefault();
                        focusPreviewTab("answer-key");
                      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                        event.preventDefault();
                        focusPreviewTab("answer-key");
                      }
                    }}
                    onClick={() => setPreviewTab("worksheet")}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition ${
                      previewTab === "worksheet"
                        ? "bg-white text-black"
                        : "text-white/45 hover:bg-white/[0.05] hover:text-white/75"
                    }`}
                  >
                    Worksheet
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewTab === "answer-key"}
                    aria-controls="worksheet-preview-panel"
                    tabIndex={previewTab === "answer-key" ? 0 : -1}
                    ref={answerKeyTabRef}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                        event.preventDefault();
                        focusPreviewTab("worksheet");
                      } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                        event.preventDefault();
                        focusPreviewTab("worksheet");
                      }
                    }}
                    onClick={() => setPreviewTab("answer-key")}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition ${
                      previewTab === "answer-key"
                        ? "bg-white text-black"
                        : "text-white/45 hover:bg-white/[0.05] hover:text-white/75"
                    }`}
                  >
                    Answer Key
                  </button>
                </div>

                <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#111214] px-3 py-2 sm:px-5">
                  <span className="text-[10px] text-white/30">Preview</span>
                  <div className="flex items-center gap-1" role="group" aria-label="Preview zoom controls">
                    <button
                      type="button"
                      onClick={() => setManualZoom((current) => Math.max(0.75, Number(((current ?? previewScale) - 0.1).toFixed(2))))}
                      className="inline-flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-sm text-white/55 transition hover:bg-white/[0.07] hover:text-white"
                      aria-label="Zoom out"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualZoom(null)}
                      className="min-w-14 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[10px] font-semibold text-white/55 transition hover:bg-white/[0.07] hover:text-white"
                      aria-label="Reset preview zoom"
                    >
                      {Math.round((manualZoom ?? previewScale) * 100)}%
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualZoom((current) => Math.min(1.25, Number(((current ?? previewScale) + 0.1).toFixed(2))))}
                      className="inline-flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-sm text-white/55 transition hover:bg-white/[0.07] hover:text-white"
                      aria-label="Zoom in"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div
                  id="worksheet-preview-panel"
                  role="tabpanel"
                  aria-label={previewTab === "answer-key" ? "Answer key preview" : "Worksheet preview"}
                  tabIndex={0}
                  className="min-h-0 flex-1 overflow-auto bg-[#0b0c0f] p-3 sm:p-6"
                >
                  <WorksheetPreviewFrame
                    worksheet={worksheet}
                    design={design}
                    previewTab={previewTab}
                    projectId={projectId}
                    generationId={generationId}
                    previewScale={previewScale}
                    manualZoom={manualZoom}
                  />
                </div>

                <div className="flex shrink-0 flex-col gap-2 border-t border-white/[0.07] bg-[#111214] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div className="text-[10px] text-white/30">
                    {savedAt
                      ? `Saved ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                      : `${worksheet.questions.length} questions · ready to edit`}
                    {qualitySummary?.issueCount ? " · Review suggested" : " · Basic checks passed"}
                  </div>
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewOpen(false);
                        setError(null);
                        window.setTimeout(() => void handleGenerate(), 0);
                      }}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white sm:flex-none"
                    >
                      <WandSparkles className="size-3.5" /> Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white sm:flex-none"
                    >
                      <Settings2 className="size-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesignOpen(true)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white sm:flex-none"
                    >
                      <PaletteIcon className="size-3.5" /> Design
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveWorksheet()}
                      disabled={!isDirty || isSaving}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 text-[11px] font-semibold text-black transition hover:bg-white/90 disabled:opacity-30 sm:flex-none"
                    >
                      {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <div className="relative flex-1 sm:flex-none">
                      <button
                        type="button"
                        onClick={() => setExportOpen((current) => !current)}
                        disabled={downloading !== null}
                        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-40 sm:w-auto"
                      >
                        <Download className="size-3.5" /> Export
                        <ChevronDown className="size-3" />
                      </button>
                      {exportOpen && (
                        <div className="absolute bottom-[calc(100%+0.5rem)] right-0 z-30 min-w-[190px] overflow-hidden rounded-xl border border-white/10 bg-[#17181b] p-1 shadow-2xl">
                          <button
                            type="button"
                            onClick={() => {
                              setExportOpen(false);
                              handlePrint("worksheet");
                            }}
                            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-[11px] font-medium text-white/65 transition hover:bg-white/[0.07] hover:text-white"
                          >
                            Print Worksheet
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setExportOpen(false);
                              handlePrint("answer-key");
                            }}
                            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-[11px] font-medium text-white/65 transition hover:bg-white/[0.07] hover:text-white"
                          >
                            Print Answer Key
                          </button>
                          {[
                            ["worksheet", "Worksheet PDF"],
                            ["answer-key", "Answer key PDF"],
                            ["both", "Worksheet + answer key"],
                          ].map(([type, label]) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setExportOpen(false);
                                void downloadPdf(type as "worksheet" | "answer-key" | "both");
                              }}
                              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-[11px] font-medium text-white/65 transition hover:bg-white/[0.07] hover:text-white"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {savedAt && (
                  <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-300/80">
                      <Check className="size-3.5" /> Saved to My Worksheets
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push("/manage/ai/worksheet")}
                      className="text-[10px] font-semibold text-white/45 hover:text-white"
                    >
                      Open My Worksheets →
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {designOpen && (
        <div
          className="fixed inset-0 z-[80]"
          role="dialog"
          aria-modal="true"
          aria-label="Design worksheet"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setDesignOpen(false);
            }
          }}
        >
          <button
            type="button"
            aria-label="Close design panel"
            onClick={() => setDesignOpen(false)}
            className="absolute inset-0 bg-foreground/45"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-white/10 bg-background/95 shadow-2xl backdrop-blur-xl">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
            </div>
            <div className="border-t border-white/10 bg-background/95 p-4 backdrop-blur-xl">
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
    </main>
  );
}

function DarkField({
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
      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-white/65">
        {label}
        {optional && <span className="font-normal text-white/25">(optional)</span>}
      </div>
      {children}
    </div>
  );
}

function DarkToolbarSelect({
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
  return (
    <label className="group relative inline-flex">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-9 max-w-[150px] appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-3 pr-7 text-[11px] font-medium text-white/70 outline-none transition hover:bg-white/[0.08] focus:border-white/20 focus:ring-2 focus:ring-white/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#151619] text-white">
            {option === value ? `${label}: ${option}` : option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-white/30" />
    </label>
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