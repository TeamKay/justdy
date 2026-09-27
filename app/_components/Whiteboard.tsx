"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  useId,
} from "react";
import {
  Circle,
  CircleHelp,
  Copy,
  Hand,
  Home,
  MousePointer2,
  Download,
  Eraser,
  FolderOpen,
  Maximize2,
  Minimize2,
  Minus,
  PenLine,
  Redo2,
  Save,
  Sigma,
  Square,
  Triangle,
  Type,
  Undo2,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Grid2X2,
  Layers3,
  Plus,
  Ruler,
  BookOpen,
  X,
  PanelRight,
  Shapes,
  Crosshair,
  Crop,
  Trash2,
  FunctionSquare,
  Settings2,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import MyLogo from "@/app/_components/Logo";

type DesmosGraphState = Record<string, unknown>;

type DesmosGraphingCalculator = {
  screenshot: (options?: { width?: number; height?: number }) => string;
  asyncScreenshot?: (
    options: { width?: number; height?: number },
    callback: (dataUri: string) => void,
  ) => void;
  getState?: () => DesmosGraphState;
  setState?: (state: DesmosGraphState) => void;
  destroy: () => void;
  resize?: () => void;
};

type DesmosNamespace = {
  GraphingCalculator: (
    element: HTMLElement,
    options?: Record<string, unknown>,
  ) => DesmosGraphingCalculator;
};

declare global {
  interface Window {
    Desmos?: DesmosNamespace;
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (source: { data: Uint8Array }) => {
        promise: Promise<{
          numPages: number;
          getPage: (pageNumber: number) => Promise<{
            getViewport: (options: { scale: number }) => { width: number; height: number };
            render: (options: {
              canvasContext: CanvasRenderingContext2D;
              viewport: { width: number; height: number };
            }) => { promise: Promise<void> };
          }>;
        }>;
      };
    };
  }
}

const DESMOS_API_SCRIPT_ID = "justdy-desmos-graphing-api";
const DESMOS_API_KEY =
  process.env.NEXT_PUBLIC_DESMOS_API_KEY ??
  "dcb31709b452b1cf9dc26972add0fda6";

function loadDesmosApi(): Promise<DesmosNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Desmos is only available in the browser."));
  }

  if (window.Desmos) return Promise.resolve(window.Desmos);

  const existing = document.getElementById(
    DESMOS_API_SCRIPT_ID,
  ) as HTMLScriptElement | null;

  if (existing) {
    return new Promise((resolve, reject) => {
      const handleLoad = () => {
        if (window.Desmos) resolve(window.Desmos);
        else reject(new Error("Desmos loaded without exposing its API."));
      };
      const handleError = () =>
        reject(new Error("Unable to load the Desmos Graphing Calculator."));

      existing.addEventListener("load", handleLoad, { once: true });
      existing.addEventListener("error", handleError, { once: true });

      if (window.Desmos) handleLoad();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = DESMOS_API_SCRIPT_ID;
    script.src =
      `https://www.desmos.com/api/v1.13/calculator.js?apiKey=${encodeURIComponent(DESMOS_API_KEY)}`;
    script.async = true;
    script.onload = () => {
      if (window.Desmos) resolve(window.Desmos);
      else reject(new Error("Desmos loaded without exposing its API."));
    };
    script.onerror = () =>
      reject(new Error("Unable to load the Desmos Graphing Calculator."));
    document.head.appendChild(script);
  });
}

type Tool =
  | "select"
  | "hand"
  | "pen"
  | "eraser"
  | "arrow"
  | "line"
  | "ellipse"
  | "rectangle"
  | "circle"
  | "triangle"
  | "cube"
  | "cylinder"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "heptagon"
  | "octagon"
  | "parallelogram"
  | "sphere"
  | "text"
  | "equation"
  | "axes"
  | "ruler";

type Point = {
  x: number;
  y: number;
};

type StrokeElement = {
  id: string;
  type: "stroke";
  points: Point[];
  color: string;
  width: number;
  pressureSensitive: boolean;
};

type ShapeType =
  | "arrow" | "line" | "ellipse" | "rectangle" | "circle" | "triangle"
  | "cube" | "cylinder" | "diamond" | "pentagon" | "hexagon"
  | "heptagon" | "octagon" | "parallelogram" | "sphere" | "axes";

type ShapeElement = {
  id: string;
  type: ShapeType;
  start: Point;
  end: Point;
  color: string;
  width: number;
};

type ImageElement = {
  id: string;
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  name?: string;
  graphState?: string;
  sourceType?: "image" | "pdf";
};

type TextElement = {
  id: string;
  type: "text" | "equation";
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  // Equations can be stretched independently in X/Y while selected.
  scaleX?: number;
  scaleY?: number;
};

type WhiteboardElement =
  | StrokeElement
  | ShapeElement
  | TextElement
  | ImageElement;

type WhiteboardPage = {
  id: string;
  name: string;
  elements: WhiteboardElement[];
};

type FormulaCategory =
  | "algebra"
  | "geometry"
  | "calculus"
  | "trigonometry"
  | "statistics"
  | "physics";

type WhiteboardMode = "standalone" | "appointment" | "booking";

export type WhiteboardRealtimeData = {
  version: number;
  whiteboardId?: string;
  mode?: WhiteboardMode;
  appointmentId?: string;
  bookingId?: string;
  pages: WhiteboardPage[];
  currentPageIndex: number;
  showGrid: boolean;
  backgroundColor: string;
  backgroundImage: string | null;
  gridColor: string;
  snapToGrid: boolean;
  color: string;
  width: number;
  tool: Tool;
  formulaCategory: FormulaCategory;
  savedAt?: string;
  /** Runtime-only realtime ordering metadata. */
  realtimeOriginId?: string;
  realtimeRevision?: number;
};

type WhiteboardProps = {
  mode: WhiteboardMode;
  appointmentId?: string;
  bookingId?: string;
  /** Width reserved on the right for the tutoring participant sidebar. */
  rightInset?: number;
  onClose?: () => void;
  onRealtimeChange?: (data: WhiteboardRealtimeData) => void;
  onReady?: (data: WhiteboardRealtimeData) => void;
  remoteData?: WhiteboardRealtimeData | null;
};

type SavedWhiteboardData = {
  version?: number;
  whiteboardId?: string;
  mode?: WhiteboardMode;
  appointmentId?: string;
  bookingId?: string;
  pages?: WhiteboardPage[];
  currentPageIndex?: number;
  showGrid?: boolean;
  backgroundColor?: string;
  backgroundImage?: string | null;
  gridColor?: string;
  snapToGrid?: boolean;
  color?: string;
  width?: number;
  tool?: Tool;
  formulaCategory?: FormulaCategory;
  savedAt?: string;
  realtimeOriginId?: string;
  realtimeRevision?: number;
};

const FORMULA_CATEGORIES: readonly FormulaCategory[] = [
  "algebra",
  "geometry",
  "calculus",
  "trigonometry",
  "statistics",
  "physics",
];

function isTool(value: unknown): value is Tool {
  return (
    value === "select" ||
    value === "hand" ||
    value === "pen" ||
    value === "eraser" ||
    value === "arrow" ||
    value === "line" ||
    value === "ellipse" ||
    value === "rectangle" ||
    value === "circle" ||
    value === "triangle" ||
    value === "cube" ||
    value === "cylinder" ||
    value === "diamond" ||
    value === "pentagon" ||
    value === "hexagon" ||
    value === "heptagon" ||
    value === "octagon" ||
    value === "parallelogram" ||
    value === "sphere" ||
    value === "text" ||
    value === "equation" ||
    value === "axes" ||
    value === "ruler"
  );
}

function isFormulaCategory(value: unknown): value is FormulaCategory {
  return (
    typeof value === "string" &&
    FORMULA_CATEGORIES.includes(value as FormulaCategory)
  );
}

function parseSavedBoardData(value: unknown): SavedWhiteboardData | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;

  return {
    version:
      typeof candidate.version === "number" ? candidate.version : undefined,
    whiteboardId:
      typeof candidate.whiteboardId === "string"
        ? candidate.whiteboardId
        : undefined,
    mode:
      candidate.mode === "standalone" || candidate.mode === "appointment" || candidate.mode === "booking"
        ? candidate.mode
        : undefined,
    appointmentId:
      typeof candidate.appointmentId === "string"
        ? candidate.appointmentId
        : undefined,
    bookingId:
      typeof candidate.bookingId === "string"
        ? candidate.bookingId
        : undefined,
    pages: Array.isArray(candidate.pages)
      ? (candidate.pages as WhiteboardPage[])
      : undefined,
    currentPageIndex:
      typeof candidate.currentPageIndex === "number"
        ? candidate.currentPageIndex
        : undefined,
    showGrid:
      typeof candidate.showGrid === "boolean" ? candidate.showGrid : undefined,
    backgroundColor:
      typeof candidate.backgroundColor === "string"
        ? candidate.backgroundColor
        : undefined,
    backgroundImage:
      typeof candidate.backgroundImage === "string"
        ? candidate.backgroundImage
        : candidate.backgroundImage === null
          ? null
          : undefined,
    gridColor:
      typeof candidate.gridColor === "string" ? candidate.gridColor : undefined,
    snapToGrid:
      typeof candidate.snapToGrid === "boolean"
        ? candidate.snapToGrid
        : undefined,
    color: typeof candidate.color === "string" ? candidate.color : undefined,
    width: typeof candidate.width === "number" ? candidate.width : undefined,
    tool: isTool(candidate.tool) ? candidate.tool : undefined,
    formulaCategory: isFormulaCategory(candidate.formulaCategory)
      ? candidate.formulaCategory
      : undefined,
    savedAt:
      typeof candidate.savedAt === "string" ? candidate.savedAt : undefined,
    realtimeOriginId:
      typeof candidate.realtimeOriginId === "string"
        ? candidate.realtimeOriginId
        : undefined,
    realtimeRevision:
      typeof candidate.realtimeRevision === "number"
        ? candidate.realtimeRevision
        : undefined,
  };
}

const COLORS = [
  "#0f172a",
  "#ffffff",
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#f59e0b",
  "#64748b",
  "#db2777",
  "#4f46e5",
];

const PEN_POPUP_COLORS = [
  "#000000",
  "#ffffff",
  "#ff3b30",
  "#0a84ff",
  "#6fba45",
  "#9c27b0",
  "#ffd54f",
];

const PEN_SIZE_OPTIONS = [
  { value: 1, width: 2 },
  { value: 2, width: 3 },
  { value: 4, width: 5 },
  { value: 6, width: 7 },
  { value: 8, width: 9 },
  { value: 10, width: 11 },
];

const LATEX_SYMBOLS = [
  ["α", "\\alpha "], ["β", "\\beta "], ["γ", "\\gamma "], ["δ", "\\delta "], ["ε", "\\epsilon "],
  ["ζ", "\\zeta "], ["η", "\\eta "], ["ι", "\\iota "], ["κ", "\\kappa "], ["λ", "\\lambda "],
  ["μ", "\\mu "], ["ν", "\\nu "], ["ξ", "\\xi "], ["ο", "o "], ["π", "\\pi "],
  ["ρ", "\\rho "], ["ς", "\\varsigma "], ["σ", "\\sigma "], ["τ", "\\tau "], ["υ", "\\upsilon "],
  ["φ", "\\phi "], ["ϕ", "\\varphi "], ["χ", "\\chi "], ["ψ", "\\psi "], ["ω", "\\omega "],
  ["÷", "\\div "], ["Σ", "\\Sigma "], ["√", "\\sqrt{}"], ["∫", "\\int "], ["×", "\\times "],
  ["∩", "\\cap "], ["∪", "\\cup "], ["≠", "\\neq "], ["≤", "\\le "], ["≥", "\\ge "],
  ["∈", "\\in "], ["±", "\\pm "], ["∓", "\\mp "], ["∞", "\\infty "], ["≈", "\\approx "],
  ["∼", "\\sim "], ["∧", "\\land "], ["∨", "\\lor "], ["⊕", "\\oplus "], ["⊗", "\\otimes "],
  ["=", "= "], ["≡", "\\equiv "], ["∀", "\\forall "], ["∃", "\\exists "], ["∂", "\\partial "],
  ["∇", "\\nabla "], ["↔", "\\leftrightarrow "], ["←", "\\leftarrow "], ["⇐", "\\Leftarrow "], ["→", "\\rightarrow "],
  ["⇒", "\\Rightarrow "], ["↕", "\\updownarrow "], ["⇔", "\\Leftrightarrow "],
] as const;

const LATEX_LETTER_LABELS = new Set([
  "α", "β", "γ", "δ", "ε", "ζ", "η", "ι", "κ", "λ",
  "μ", "ν", "ξ", "ο", "π", "ρ", "ς", "σ", "τ", "υ",
  "φ", "ϕ", "χ", "ψ", "ω",
]);

const LATEX_ARROW_LABELS = new Set([
  "↔", "←", "⇐", "→", "⇒", "↕", "⇔",
]);

const LATEX_EDITOR_COLORS = [
  "#000000",
  "#ffffff",
  "#ff3b30",
  "#0a84ff",
  "#6fba45",
  "#9c27b0",
  "#ffd54f",
] as const;

const DEFAULT_BACKGROUND_IMAGE = "/images/chalkboard.png";

function ShapeToolIcon({ shape }: { shape: ShapeType }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (shape) {
    case "arrow": return <svg {...common}><path d="M5 19 19 5" /><path d="M10 5h9v9" /></svg>;
    case "line": return <svg {...common}><path d="M5 19 19 5" /></svg>;
    case "ellipse": return <svg {...common}><ellipse cx="12" cy="12" rx="8.5" ry="5.5" /></svg>;
    case "rectangle": return <svg {...common}><rect x="4" y="6" width="16" height="12" /></svg>;
    case "circle": return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
    case "triangle": return <svg {...common}><path d="m12 4 8 15H4L12 4Z" /></svg>;
    case "cube": return <svg {...common}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /><path d="m8 5.25 8 4.5v9" /></svg>;
    case "cylinder": return <svg {...common}><ellipse cx="12" cy="6" rx="7" ry="2.8" /><path d="M5 6v12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8V6" /><path d="M5 18c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8" /></svg>;
    case "diamond": return <svg {...common}><path d="m12 3 8 9-8 9-8-9 8-9Z" /></svg>;
    case "pentagon": return <svg {...common}><path d="m12 3 8 5.8-3.05 9.2h-9.9L4 8.8 12 3Z" /></svg>;
    case "hexagon": return <svg {...common}><path d="m7 4 10 0 5 8-5 8H7l-5-8 5-8Z" /></svg>;
    case "heptagon": return <svg {...common}><path d="M12 2.8 19.2 6l2 8-5 6.2H7.8l-5-6.2 2-8L12 2.8Z" /></svg>;
    case "octagon": return <svg {...common}><path d="m8 3 8 0 5 5v8l-5 5H8l-5-5V8l5-5Z" /></svg>;
    case "parallelogram": return <svg {...common}><path d="m7 5 14 0-4 14H3L7 5Z" /></svg>;
    case "sphere": return <svg {...common}><circle cx="12" cy="12" r="8" /><ellipse cx="12" cy="12" rx="3.2" ry="8" /></svg>;
    default: return <svg {...common}><path d="M4 12h16M12 4v16" /><path d="m19 9-3 3 3 3M9 5l3 3 3-3M5 15l3-3-3-3" /></svg>;
  }
}


const BACKGROUND_IMAGE_OPTIONS = [
  { label: "Chalkboard", value: DEFAULT_BACKGROUND_IMAGE },
];

const BACKGROUND_OPTIONS = [
  { label: "Pure White", value: "#ffffff" },
  { label: "Modern Slate", value: "#f8fafc" },
  { label: "Cool Gray", value: "#f1f5f9" },
  { label: "Classic Blueprint", value: "#0f172a" },
  { label: "Midnight Navy", value: "#090d16" },
  { label: "Graphite Dark", value: "#18181b" },
  { label: "Sepia Warm", value: "#fefce8" },
  { label: "Soft Cream", value: "#fffbeb" },
  { label: "Pastel Mint", value: "#ecfdf5" },
  { label: "Sky Blue", value: "#f0f9ff" },
  { label: "Soft Lavender", value: "#f5f3ff" },
  { label: "Rose Tint", value: "#fff1f2" },
];

const GRID_COLOR_OPTIONS = [
  { label: "Subtle Gray", value: "#e5e7eb" },
  { label: "Slate Grid", value: "#cbd5e1" },
  { label: "Vivid Blue", value: "#3b82f6" },
  { label: "Soft Blue Tint", value: "#dbeafe" },
  { label: "Dark Mode Grid", value: "#1e293b" },
  { label: "Midnight Glow", value: "#334155" },
  { label: "Emerald Trace", value: "#a7f3d0" },
  { label: "Amber Accent", value: "#fde68a" },
];

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createPage(name: string): WhiteboardPage {
  return {
    id: createId(),
    name,
    elements: [],
  };
}

const MATH_SYMBOLS: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  Delta: "Δ",
  theta: "θ",
  lambda: "λ",
  mu: "μ",
  sigma: "σ",
  Sigma: "Σ",
  phi: "φ",
  varphi: "ϕ",
  omega: "ω",
  Omega: "Ω",
  pi: "π",
  rho: "ρ",
  tau: "τ",
  infinity: "∞",
  pm: "±",
  mp: "∓",
  times: "×",
  cdot: "·",
  div: "÷",
  le: "≤",
  ge: "≥",
  neq: "≠",
  approx: "≈",
  propto: "∝",
  degree: "°",
  sum: "∑",
  prod: "∏",
  int: "∫",
  partial: "∂",
  nabla: "∇",
  rightarrow: "→",
  leftarrow: "←",
  Rightarrow: "⇒",
  Leftarrow: "⇐",
  infty: "∞",
};

function latexToReadable(text: string): string {
  const convert = (source: string): string => {
    let value = source;

    const readBalancedGroup = (
      input: string,
      openIndex: number,
    ): { content: string; end: number } | null => {
      if (input[openIndex] !== "{") return null;

      let depth = 0;
      for (let index = openIndex; index < input.length; index++) {
        if (input[index] === "{") depth++;
        if (input[index] === "}") {
          depth--;
          if (depth === 0) {
            return {
              content: input.slice(openIndex + 1, index),
              end: index + 1,
            };
          }
        }
      }

      return null;
    };

    // Resolve fractions from the inside out so nested fractions work too.
    let fractionIndex = value.indexOf("\\frac");
    while (fractionIndex !== -1) {
      const numeratorStart = fractionIndex + 5;

      // Skip optional whitespace between \frac and its arguments.
      let numeratorIndex = numeratorStart;
      while (/\s/.test(value[numeratorIndex] ?? "")) numeratorIndex++;

      const numerator = readBalancedGroup(value, numeratorIndex);

      if (!numerator) {
        fractionIndex = value.indexOf("\\frac", fractionIndex + 5);
        continue;
      }

      let denominatorIndex = numerator.end;
      while (/\s/.test(value[denominatorIndex] ?? "")) denominatorIndex++;

      const denominator = readBalancedGroup(value, denominatorIndex);

      if (!denominator) {
        fractionIndex = value.indexOf("\\frac", fractionIndex + 5);
        continue;
      }

      const numeratorText = convert(numerator.content);
      const denominatorText = convert(denominator.content);

      value =
        value.slice(0, fractionIndex) +
        `${numeratorText}/${denominatorText}` +
        value.slice(denominator.end);

      fractionIndex = value.indexOf("\\frac");
    }

    // Common LaTeX symbols.
    Object.entries(MATH_SYMBOLS).forEach(([name, symbol]) => {
      value = value.replace(new RegExp(`\\\\${name}\\b`, "g"), symbol);
    });

    value = value.replace(/\\text\{([^{}]*)\}/g, "$1");
    value = value.replace(/\\left|\\right/g, "");
    value = value.replace(/\\,|\\;|\\!|\\quad/g, " ");
    value = value.replace(/\\sqrt\{([^{}]*)\}/g, "√($1)");
    value = value.replace(/\\sqrt\s*([A-Za-z0-9])/g, "√$1");
    value = value.replace(/\^\{([^{}]*)\}/g, "^$1");
    value = value.replace(/_\{([^{}]*)\}/g, "_$1");

    // Remove only grouping braces that are left after the supported
    // structures have been converted.
    value = value.replace(/[{}]/g, "");

    return value;
  };

  return convert(text);
}

function renderLatexPreview(text: string, color: string) {
  const value = text.trim();
  const fraction = value.match(/^\\frac\{([^{}]*)\}\{([^{}]*)\}$/);
  if (fraction) {
    return (
      <span
        className="inline-flex flex-col items-center justify-center leading-none"
        style={{ color }}
      >
        <span className="border-b-2 border-current px-2 pb-1">{latexToReadable(fraction[1])}</span>
        <span className="px-2 pt-1">{latexToReadable(fraction[2])}</span>
      </span>
    );
  }

  const sqrt = value.match(/^\\sqrt\{([^{}]*)\}$/);
  if (sqrt) {
    return (
      <span style={{ color }}>
        √<span className="border-t-2 border-current px-1">{latexToReadable(sqrt[1])}</span>
      </span>
    );
  }

  return <span style={{ color }}>{latexToReadable(value)}</span>;
}

function estimateMathMetrics(
  text: string,
  fontSize: number,
  ctx?: CanvasRenderingContext2D | null,
) {
  const readable = latexToReadable(text);
  const plainWidth = ctx
    ? ctx.measureText(readable).width
    : readable.length * fontSize * 0.62;
  const fractionCount = (text.match(/\\frac/g) || []).length;
  const sqrtCount = (text.match(/\\sqrt/g) || []).length;
  const superscriptCount = (text.match(/\^/g) || []).length;
  const subscriptCount = (text.match(/_/g) || []).length;

  const commandCount = (text.match(/\\[A-Za-z]+/g) || []).length;
  const groupCount = (text.match(/[{}]/g) || []).length / 2;
  return {
    width: Math.max(
      fontSize * 0.8,
      plainWidth * 1.08 +
        fractionCount * fontSize * 0.25 +
        sqrtCount * fontSize * 0.14 +
        commandCount * fontSize * 0.08 +
        groupCount * fontSize * 0.025,
    ),
    height:
      fontSize *
      (1.25 +
        Math.min(1.2, fractionCount * 0.55) +
        Math.min(0.45, (superscriptCount + subscriptCount) * 0.08)),
  };
}

function drawMathEquation(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
) {
  // Lightweight LaTeX-style renderer for the canvas. It supports common
  // classroom notation without requiring an external math-rendering package.
  const render = (
    source: string,
    size: number,
    originX: number,
    originY: number,
  ) => {
    let cursorX = originX;
    let i = 0;
    const baseFont = `${size}px Cambria Math, STIX Two Math, Times New Roman, serif`;
    ctx.font = baseFont;
    ctx.textBaseline = "alphabetic";

    const readGroup = () => {
      if (source[i] === "{") {
        let depth = 0;
        const start = ++i;
        while (i < source.length) {
          if (source[i] === "{") depth++;
          else if (source[i] === "}") {
            if (depth === 0) break;
            depth--;
          }
          i++;
        }
        const group = source.slice(start, i);
        if (source[i] === "}") i++;
        return group;
      }
      if (source[i] === "\\") {
        const start = i;
        i++;
        while (i < source.length && /[A-Za-z]/.test(source[i])) i++;
        return source.slice(start, i);
      }
      return source[i++] || "";
    };

    const readCommand = () => {
      i++;
      const start = i;
      while (i < source.length && /[A-Za-z]/.test(source[i])) i++;
      return source.slice(start, i);
    };

    while (i < source.length) {
      if (/\s/.test(source[i])) {
        cursorX += size * 0.22;
        i++;
        continue;
      }

      if (source[i] === "\\") {
        const command = readCommand();
        if (command === "frac") {
          const numerator = readGroup();
          const denominator = readGroup();
          const fracSize = size * 0.86;
          const numMetrics = estimateMathMetrics(numerator, fracSize, ctx);
          const denMetrics = estimateMathMetrics(denominator, fracSize, ctx);
          const width =
            Math.max(numMetrics.width, denMetrics.width) + size * 0.35;
          const center = cursorX + width / 2;
          render(
            numerator,
            fracSize,
            center - numMetrics.width / 2,
            originY - size * 0.28,
          );
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(1, size * 0.055);
          ctx.beginPath();
          ctx.moveTo(cursorX + size * 0.08, originY - size * 0.02);
          ctx.lineTo(cursorX + width - size * 0.08, originY - size * 0.02);
          ctx.stroke();
          render(
            denominator,
            fracSize,
            center - denMetrics.width / 2,
            originY + size * 0.72,
          );
          cursorX += width;
          continue;
        }
        if (command === "sqrt") {
          const radicand = readGroup();
          const metrics = estimateMathMetrics(radicand, size * 0.9, ctx);
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(1, size * 0.07);
          ctx.beginPath();
          ctx.moveTo(cursorX, originY - size * 0.28);
          ctx.lineTo(cursorX + size * 0.18, originY + size * 0.05);
          ctx.lineTo(cursorX + size * 0.34, originY - size * 0.62);
          ctx.lineTo(
            cursorX + size * 0.34 + metrics.width,
            originY - size * 0.62,
          );
          ctx.stroke();
          render(radicand, size * 0.9, cursorX + size * 0.36, originY);
          cursorX += size * 0.36 + metrics.width + size * 0.08;
          continue;
        }
        if (command === "text") {
          const content = readGroup();
          ctx.font = `${size}px Inter, sans-serif`;
          ctx.fillText(content, cursorX, originY);
          cursorX += ctx.measureText(content).width;
          continue;
        }

        const symbol = MATH_SYMBOLS[command] ?? command;
        ctx.font = baseFont;
        ctx.fillText(symbol, cursorX, originY);
        cursorX += ctx.measureText(symbol).width;
        continue;
      }

      if (source[i] === "^" || source[i] === "_") {
        const isSup = source[i] === "^";
        i++;
        const group = readGroup();
        const subSize = size * 0.62;
        const offsetY = isSup ? -size * 0.48 : size * 0.34;
        render(group, subSize, cursorX, originY + offsetY);
        continue;
      }

      if (source[i] === "{") {
        const group = readGroup();
        render(group, size, cursorX, originY);
        cursorX += estimateMathMetrics(group, size, ctx).width;
        continue;
      }

      const ch = source[i++];
      ctx.font = baseFont;
      ctx.fillText(ch, cursorX, originY);
      cursorX += ctx.measureText(ch).width;
    }
    return cursorX - originX;
  };

  ctx.save();
  ctx.fillStyle = color;
  render(text, fontSize, x, y + fontSize);
  ctx.restore();
}

function measureMathRenderWidth(
  text: string,
  fontSize: number,
  ctx?: CanvasRenderingContext2D | null,
): number {
  const measure = (source: string, size: number): number => {
    let cursorX = 0;
    let i = 0;
    const baseFont = `${size}px Cambria Math, STIX Two Math, Times New Roman, serif`;

    const readGroup = (): string => {
      if (source[i] === "{") {
        let depth = 0;
        const start = ++i;
        while (i < source.length) {
          if (source[i] === "{") depth++;
          else if (source[i] === "}") {
            if (depth === 0) break;
            depth--;
          }
          i++;
        }
        const group = source.slice(start, i);
        if (source[i] === "}") i++;
        return group;
      }
      if (source[i] === "\\") {
        const start = i++;
        while (i < source.length && /[A-Za-z]/.test(source[i])) i++;
        return source.slice(start, i);
      }
      return source[i++] || "";
    };

    while (i < source.length) {
      if (/\s/.test(source[i])) {
        cursorX += size * 0.22;
        i++;
        continue;
      }

      if (source[i] === "\\") {
        i++;
        const start = i;
        while (i < source.length && /[A-Za-z]/.test(source[i])) i++;
        const command = source.slice(start, i);

        if (command === "frac") {
          const numerator = readGroup();
          const denominator = readGroup();
          const fracSize = size * 0.86;
          const width = Math.max(
            measure(numerator, fracSize),
            measure(denominator, fracSize),
          ) + size * 0.35;
          cursorX += width;
          continue;
        }

        if (command === "sqrt") {
          const radicand = readGroup();
          cursorX += size * 0.36 + measure(radicand, size * 0.9) + size * 0.08;
          continue;
        }

        if (command === "text") {
          const content = readGroup();
          if (ctx) {
            ctx.save();
            ctx.font = `${size}px Inter, sans-serif`;
            cursorX += ctx.measureText(content).width;
            ctx.restore();
          } else {
            cursorX += content.length * size * 0.56;
          }
          continue;
        }

        const symbol = MATH_SYMBOLS[command] ?? command;
        if (ctx) {
          ctx.save();
          ctx.font = baseFont;
          cursorX += ctx.measureText(symbol).width;
          ctx.restore();
        } else {
          cursorX += symbol.length * size * 0.62;
        }
        continue;
      }

      if (source[i] === "^" || source[i] === "_") {
        i++;
        readGroup();
        // Superscripts/subscripts are drawn at cursorX and do not advance it.
        continue;
      }

      if (source[i] === "{") {
        const group = readGroup();
        cursorX += measure(group, size);
        continue;
      }

      const ch = source[i++];
      if (ctx) {
        ctx.save();
        ctx.font = baseFont;
        cursorX += ctx.measureText(ch).width;
        ctx.restore();
      } else {
        cursorX += size * 0.62;
      }
    }

    return cursorX;
  };

  return Math.max(fontSize * 0.8, measure(text, fontSize));
}

function getElementBounds(
  element: WhiteboardElement,
  ctx?: CanvasRenderingContext2D | null,
): { left: number; top: number; right: number; bottom: number } {
  if (element.type === "stroke") {
    const xs = element.points.map((point) => point.x);
    const ys = element.points.map((point) => point.y);
    if (xs.length === 0) return { left: 0, top: 0, right: 0, bottom: 0 };
    const padding = Math.max(element.width, 8) + 4;
    return {
      left: Math.min(...xs) - padding,
      top: Math.min(...ys) - padding,
      right: Math.max(...xs) + padding,
      bottom: Math.max(...ys) + padding,
    };
  }

  if ("start" in element && "end" in element) {
    const padding = Math.max(element.width, 8) + 4;
    return {
      left: Math.min(element.start.x, element.end.x) - padding,
      top: Math.min(element.start.y, element.end.y) - padding,
      right: Math.max(element.start.x, element.end.x) + padding,
      bottom: Math.max(element.start.y, element.end.y) + padding,
    };
  }

  if (element.type === "image") {
    return {
      left: element.x,
      top: element.y,
      right: element.x + element.width,
      bottom: element.y + element.height,
    };
  }

  const mathMetrics =
    element.type === "equation"
      ? estimateMathMetrics(element.text, element.fontSize, ctx)
      : null;

  let measuredWidth: number;
  let measuredHeight: number;

  if (mathMetrics) {
    const scaleX = element.type === "equation" ? Math.max(0.2, element.scaleX ?? 1) : 1;
    const scaleY = element.type === "equation" ? Math.max(0.2, element.scaleY ?? 1) : 1;
    // Use the same cursor/command rules as drawMathEquation so the dotted
    // selection frame encloses the complete rendered formula, including
    // fractions, square roots, commands, and text groups.
    const renderedWidth = measureMathRenderWidth(element.text, element.fontSize, ctx);
    measuredWidth = renderedWidth * scaleX;
    measuredHeight = mathMetrics.height * scaleY;
  } else if (ctx) {
    // Text selection bounds must use the exact same font metrics as the
    // renderer. Previously the canvas context could still contain the font
    // from another element, which made the blue selection frame stop halfway
    // across longer/bold/italic text.
    ctx.save();
    ctx.font = `${element.italic ? "italic " : ""}${element.bold ? "700 " : "400 "}${element.fontSize}px Inter, sans-serif`;
    measuredWidth = ctx.measureText(element.text).width;
    const metrics = ctx.measureText(element.text);
    measuredHeight = Math.max(
      element.fontSize + 6,
      (metrics.actualBoundingBoxAscent || element.fontSize * 0.8) +
        (metrics.actualBoundingBoxDescent || element.fontSize * 0.2) +
        6,
    );
    ctx.restore();
  } else {
    measuredWidth = element.text.length * element.fontSize * 0.62;
    measuredHeight = element.fontSize + 6;
  }

  const padding = Math.max(7, element.fontSize * 0.14) * (element.type === "equation" ? Math.max(1, Math.min(element.scaleX ?? 1, element.scaleY ?? 1)) : 1);

  return {
    left: element.x - padding,
    top: element.y - padding,
    right: element.x + Math.max(measuredWidth, element.fontSize * 0.6) + padding,
    bottom: element.y + measuredHeight + padding,
  };
}

function pointInsideBounds(
  point: Point,
  bounds: { left: number; top: number; right: number; bottom: number },
  tolerance = 0,
): boolean {
  return (
    point.x >= bounds.left - tolerance &&
    point.x <= bounds.right + tolerance &&
    point.y >= bounds.top - tolerance &&
    point.y <= bounds.bottom + tolerance
  );
}

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared),
  );
  const projection = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.hypot(point.x - projection.x, point.y - projection.y);
}

function hitTestElement(
  element: WhiteboardElement,
  point: Point,
  ctx: CanvasRenderingContext2D | null,
): boolean {
  const bounds = getElementBounds(element, ctx);
  if (!pointInsideBounds(point, bounds, 12)) return false;

  if (element.type === "stroke") {
    const tolerance = Math.max(element.width, 12);
    for (let index = 1; index < element.points.length; index++) {
      if (
        distanceToSegment(
          point,
          element.points[index - 1],
          element.points[index],
        ) <= tolerance
      ) {
        return true;
      }
    }
    return (
      element.points.length === 1 &&
      Math.hypot(
        point.x - element.points[0].x,
        point.y - element.points[0].y,
      ) <= tolerance
    );
  }
  return true;
}

function translateElement(
  element: WhiteboardElement,
  dx: number,
  dy: number,
): WhiteboardElement {
  if (element.type === "stroke") {
    return {
      ...element,
      points: element.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
    };
  }
  if ("start" in element && "end" in element) {
    return {
      ...element,
      start: { x: element.start.x + dx, y: element.start.y + dy },
      end: { x: element.end.x + dx, y: element.end.y + dy },
    };
  }
  return { ...element, x: element.x + dx, y: element.y + dy };
}

let pdfJsLoadPromise: Promise<NonNullable<Window["pdfjsLib"]>> | null = null;

function loadPdfJs(): Promise<NonNullable<Window["pdfjsLib"]>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PDF rendering is only available in the browser."));
  }
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfJsLoadPromise) return pdfJsLoadPromise;

  pdfJsLoadPromise = new Promise<NonNullable<Window["pdfjsLib"]>>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-justdy-pdfjs="true"]',
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.pdfjsLib) resolve(window.pdfjsLib);
        else reject(new Error("PDF.js loaded without a usable API."));
      });
      existing.addEventListener("error", () =>
        reject(new Error("Unable to load the PDF renderer.")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.dataset.justdyPdfjs = "true";
    script.onload = () => {
      if (!window.pdfjsLib) {
        reject(new Error("PDF.js loaded without a usable API."));
        return;
      }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error("Unable to load the PDF renderer."));
    document.head.appendChild(script);
  });

  return pdfJsLoadPromise;
}

export default function Whiteboard({
  mode,
  appointmentId,
  bookingId,
  rightInset = 0,
  onClose,
  onRealtimeChange,
  onReady,
  remoteData,
}: WhiteboardProps) {
  const [databaseWhiteboardId, setDatabaseWhiteboardId] = useState<
    string | null
  >(null);
  const [whiteboardReady, setWhiteboardReady] = useState(false);

  const rootRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const hasLoadedBoardRef = useRef(false);
  const realtimeReadyReportedRef = useRef(false);
  const realtimeOriginId = useId();
  const realtimeOriginIdRef = useRef<string>(realtimeOriginId);
  const realtimeRevisionRef = useRef(0);
  const lastAppliedRemoteSignatureRef = useRef<string | null>(null);
  const lastRemoteRevisionByOriginRef = useRef<Map<string, number>>(new Map());

  const storageKey = useMemo(() => {
    if (mode === "standalone") {
      return "justdy-lab-whiteboard:standalone";
    }

    if (mode === "booking") {
      return `justdy-lab-whiteboard:booking:${bookingId ?? "unknown"}`;
    }

    return `justdy-lab-whiteboard:appointment:${appointmentId ?? "unknown"}`;
  }, [mode, appointmentId, bookingId]);

  const [pages, setPages] = useState<WhiteboardPage[]>([createPage("Page 1")]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [tool, setTool] = useState<Tool>("pen");
  const textPlacementArmedRef = useRef(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [color, setColor] = useState("#2563eb");
  const [width, setWidth] = useState(4);
  const [eraserWidth, setEraserWidth] = useState(32);
  const [showEraserPopup, setShowEraserPopup] = useState(false);
  const [eraserPopupPosition, setEraserPopupPosition] = useState({
    top: 0,
    left: 0,
  });
  const eraserButtonRef = useRef<HTMLButtonElement | null>(null);
  const eraserPopupRef = useRef<HTMLDivElement | null>(null);
  const [fontSize] = useState(24);

  const [showGrid, setShowGrid] = useState(true);
  const [gridSize] = useState(32);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const [backgroundImageVersion, setBackgroundImageVersion] = useState(0);
  const [gridColor, setGridColor] = useState("#e2e8f0");

  const [showColorPopup, setShowColorPopup] = useState(false);
  const [colorPopupTarget, setColorPopupTarget] = useState<
    "pen" | "object" | null
  >("pen");
  const colorButtonRef = useRef<HTMLButtonElement | null>(null);
  const objectColorButtonRef = useRef<HTMLButtonElement | null>(null);
  const [colorPopupPosition, setColorPopupPosition] = useState({
    top: 0,
    left: 0,
  });

  const [showPenPopup, setShowPenPopup] = useState(false);
  const [penStyle, setPenStyle] = useState<"pen" | "marker">("pen");
  const penButtonRef = useRef<HTMLButtonElement | null>(null);
  const penPopupRef = useRef<HTMLDivElement | null>(null);
  const [penPopupPosition, setPenPopupPosition] = useState({
    top: 0,
    left: 0,
  });

  const [axisColor] = useState("#475569");
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [showShapeToolsPopup, setShowShapeToolsPopup] = useState(false);
  const shapeToolsButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showFormulaMenu, setShowFormulaMenu] = useState(false);
  const formulaToolsButtonRef = useRef<HTMLButtonElement | null>(null);
  const [formulaMenuPosition, setFormulaMenuPosition] = useState({ top: 0, left: 0 });
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const uploadButtonRef = useRef<HTMLButtonElement | null>(null);
  const [uploadMenuPosition, setUploadMenuPosition] = useState({ top: 0, left: 0 });
  const [cropEditor, setCropEditor] = useState<{
    open: boolean;
    elementId: string | null;
    left: number;
    top: number;
    right: number;
    bottom: number;
  }>({
    open: false,
    elementId: null,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
  const [showPagesPanel, setShowPagesPanel] = useState(false);
  const pageThumbnailRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [showGraphSettings, setShowGraphSettings] = useState(false);
  const [showGraphEditor, setShowGraphEditor] = useState(false);
  const [graphLoadError, setGraphLoadError] = useState<string | null>(null);
  const graphContainerRef = useRef<HTMLDivElement | null>(null);
  const graphCalculatorRef = useRef<DesmosGraphingCalculator | null>(null);
  const graphEditingElementIdRef = useRef<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState("");
  const [calculatorResult, setCalculatorResult] = useState("");
  const [calculatorAngleMode, setCalculatorAngleMode] = useState<"DEG" | "RAD">(
    "DEG",
  );
  const [calculatorMemory, setCalculatorMemory] = useState(0);
  const [calculatorHistory, setCalculatorHistory] = useState<
    Array<{ expression: string; result: string }>
  >([]);
  const [calculatorPosition, setCalculatorPosition] = useState({ x: 0, y: 0 });
  const [popupPositions, setPopupPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const popupDragRef = useRef<{
    key: string;
    dx: number;
    dy: number;
    element: HTMLElement;
    captureTarget: HTMLElement;
  } | null>(null);

  const getPopupPosition = useCallback(
    (key: string, fallback: { x: number; y: number }) =>
      popupPositions[key] ?? fallback,
    [popupPositions],
  );

  useEffect(() => {
    if (!showGraphEditor) return;

    let cancelled = false;

    loadDesmosApi()
      .then((Desmos) => {
        if (cancelled || !graphContainerRef.current || graphCalculatorRef.current) {
          return;
        }

        setGraphLoadError(null);
        graphCalculatorRef.current = Desmos.GraphingCalculator(
          graphContainerRef.current,
          {
            graphpaper: true,
            expressions: true,
            expressionsCollapsed: true,
            expressionsTopbar: true,
            settingsMenu: true,
            zoomButtons: true,
            keypad: true,
            keypadActivated: false,
            autosize: true,
            border: true,
            pointsOfInterest: true,
            trace: true,
          },
        );

        const editingId = graphEditingElementIdRef.current;
        if (editingId && graphCalculatorRef.current.setState) {
          const editingElement = pages
            .flatMap((page) => page.elements)
            .find(
              (element): element is ImageElement =>
                element.id === editingId &&
                element.type === "image" &&
                element.name === "Desmos Graph" &&
                Boolean(element.graphState),
            );

          if (editingElement?.graphState) {
            try {
              graphCalculatorRef.current.setState(
                JSON.parse(editingElement.graphState) as DesmosGraphState,
              );
            } catch {
              // Keep the default calculator state if an older graph has no
              // valid serialized Desmos state.
            }
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setGraphLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load the Desmos Graphing Calculator.",
          );
        }
      });

    return () => {
      cancelled = true;
      graphCalculatorRef.current?.destroy();
      graphCalculatorRef.current = null;
    };
  }, [showGraphEditor, pages]);

  const startPopupDrag = useCallback(
    (key: string, event: React.PointerEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest("button, input, select, textarea, [data-no-drag]"))
        return;

      // Store the actual popup element. The popup's parent is often the
      // full-screen whiteboard wrapper, which was causing small popups to
      // clamp to the left edge.
      // Always resolve the actual popup dialog itself. When the drag starts
      // from a popup header, event.currentTarget is the header; when it starts
      // from the popup container, its parent is the full-screen board wrapper.
      // Using closest(dialog) fixes the left-edge clamping for every popup.
      const popup = event.currentTarget.closest(
        '[role="dialog"], aside',
      ) as HTMLElement | null;
      if (!popup) return;

      const rect = popup.getBoundingClientRect();

      popupDragRef.current = {
        key,
        dx: event.clientX - rect.left,
        dy: event.clientY - rect.top,
        element: popup,
        captureTarget: event.currentTarget,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [],
  );

  const movePopupDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const drag = popupDragRef.current;
      if (!drag) return;

      const root = rootRef.current?.getBoundingClientRect();
      if (!root) return;

      // Always measure the popup itself, never event.currentTarget.parentElement.
      const popupRect = drag.element.getBoundingClientRect();
      const width = popupRect.width;
      const height = popupRect.height;

      const maxX = Math.max(8, root.width - width - 8);
      const maxY = Math.max(8, root.height - height - 8);

      const x = Math.max(
        8,
        Math.min(event.clientX - root.left - drag.dx, maxX),
      );
      const y = Math.max(8, Math.min(event.clientY - root.top - drag.dy, maxY));

      setPopupPositions((previous) => ({
        ...previous,
        [drag.key]: { x, y },
      }));
    },
    [],
  );

  const endPopupDrag = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const drag = popupDragRef.current;
    popupDragRef.current = null;

    if (!drag) return;

    try {
      drag.captureTarget.releasePointerCapture(event.pointerId);
    } catch {}
  }, []);
  const calculatorDraggingRef = useRef(false);
  const calculatorDragOffsetRef = useRef({ x: 0, y: 0 });
  const [formulaCategory, setFormulaCategory] =
    useState<FormulaCategory>("algebra");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTeacherControls] = useState(true);
  const [toolbarHovered, setToolbarHovered] = useState(false);
  const [teacherControlDragging, setTeacherControlDragging] = useState(false);

  // Draggable teacher-control launcher position.
  // The default position is the bottom-right corner, but the teacher can
  // drag the logo anywhere on the whiteboard.
  const [teacherControlPosition, setTeacherControlPosition] = useState({
    left: 0,
    top: 0,
  });
  const teacherControlInitializedRef = useRef(false);
  const teacherControlDraggingRef = useRef(false);
  const teacherControlDidDragRef = useRef(false);
  const teacherControlDragOffsetRef = useRef({
    x: 0,
    y: 0,
  });

  const [renamePageState, setRenamePageState] = useState<{
    open: boolean;
    index: number | null;
    name: string;
  }>({
    open: false,
    index: null,
    name: "",
  });
  const [, setIsSaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [selectedEquation, setSelectedEquation] = useState("");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [textObjectDragging, setTextObjectDragging] = useState(false);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [, setImageVersion] = useState(0);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const [textEditor, setTextEditor] = useState<{
    open: boolean;
    type: "text" | "equation";
    x: number;
    y: number;
    text: string;
    fontSize: number;
    color: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    editingElementId: string | null;
  }>({
    open: false,
    type: "text",
    x: 0,
    y: 0,
    text: "",
    fontSize: 24,
    color: "#2563eb",
    bold: false,
    italic: false,
    underline: false,
    editingElementId: null,
  });

  const textInputRef = useRef<HTMLTextAreaElement | null>(null);
  const latexInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [latexEditor, setLatexEditor] = useState<{
    open: boolean;
    text: string;
    color: string;
    editingElementId: string | null;
    x: number;
    y: number;
  }>({
    open: false,
    text: "",
    color: "#0f172a",
    editingElementId: null,
    x: 0,
    y: 0,
  });
  const [latexTab, setLatexTab] = useState<"All" | "Math" | "Arrow" | "Letter">("All");
  const [activeTextPanel, setActiveTextPanel] = useState<
    "symbols" | "templates" | "formatting" | null
  >(null);
  const [showTextFormattingColors, setShowTextFormattingColors] =
    useState(false);

  const drawingRef = useRef(false);
  const startPointRef = useRef<Point | null>(null);
  const currentStrokeRef = useRef<StrokeElement | null>(null);
  const previewElementRef = useRef<ShapeElement | null>(null);

  const transformRef = useRef<{
    mode: "move" | "resize";
    ids: string[];
    elements: WhiteboardElement[];
    originalElements: WhiteboardElement[];
    startPoint: Point;
    anchor: Point;
    handle: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | null;
    moved: boolean;
  } | null>(null);

  const marqueeRef = useRef<{
    start: Point;
    current: Point;
    moved: boolean;
  } | null>(null);

  const historyRef = useRef<WhiteboardPage[][]>([[createPage("Page 1")]]);
  const redoRef = useRef<WhiteboardPage[][]>([]);

  const currentPage = pages[currentPageIndex] ?? pages[0];
  const elements = useMemo(() => currentPage?.elements ?? [], [currentPage]);
  const positionColorPopup = useCallback((target: "pen" | "object") => {
    const button =
      target === "object"
        ? objectColorButtonRef.current
        : colorButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const popupWidth = 220;
    const popupHeight = 190;
    const gap = 10;

    let left = rect.right + gap;
    if (left + popupWidth > window.innerWidth - 12) {
      left = Math.max(12, rect.left - popupWidth - gap);
    }

    let top = rect.top;
    if (top + popupHeight > window.innerHeight - 12) {
      top = Math.max(12, window.innerHeight - popupHeight - 12);
    }

    setColorPopupPosition({ top, left });
    setColorPopupTarget(target);
    setShowColorPopup(true);
  }, []);

  const positionPenPopup = useCallback(() => {
    const button = penButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const popupWidth = 344;
    const popupHeight = 230;
    const gap = 10;

    let left = rect.left + rect.width / 2 - popupWidth / 2;
    let top = rect.bottom + gap;

    left = Math.max(12, Math.min(left, window.innerWidth - popupWidth - 12));

    if (top + popupHeight > window.innerHeight - 12) {
      top = Math.max(12, rect.top - popupHeight - gap);
    }

    setPenPopupPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!showEraserPopup) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        (eraserPopupRef.current?.contains(target) ||
          eraserButtonRef.current?.contains(target))
      ) {
        return;
      }
      setShowEraserPopup(false);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () =>
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [showEraserPopup]);

  useEffect(() => {
    if (!showPenPopup) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (
        target &&
        (penPopupRef.current?.contains(target) ||
          penButtonRef.current?.contains(target))
      ) {
        return;
      }

      setShowPenPopup(false);
    };

    document.addEventListener(
      "pointerdown",
      handleOutsidePointerDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsidePointerDown,
      );
    };
  }, [showPenPopup]);

  const pushHistory = useCallback(() => {
    historyRef.current.push(JSON.parse(JSON.stringify(pages)));

    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    }

    redoRef.current = [];
  }, [pages]);

  const updateCurrentPage = useCallback(
    (updater: (page: WhiteboardPage) => WhiteboardPage) => {
      setPages((previous) =>
        previous.map((page, index) =>
          index === currentPageIndex ? updater(page) : page,
        ),
      );

      setIsSaved(false);
    },
    [currentPageIndex],
  );

  const applySelectedElementColor = useCallback(
    (nextColor: string) => {
      if (!selectedElementId) return;

      const selected = elements.find(
        (element: WhiteboardElement) => element.id === selectedElementId,
      );
      if (!selected) return;

      if (!("color" in selected)) {
        setShowColorPopup(false);
        setColorPopupTarget(null);
        return;
      }

      if (selected.color === nextColor) {
        setShowColorPopup(false);
        return;
      }

      pushHistory();
      updateCurrentPage((page) => ({
        ...page,
        elements: page.elements.map((element: WhiteboardElement) =>
          element.id === selectedElementId
            ? { ...element, color: nextColor }
            : element,
        ),
      }));

      setShowColorPopup(false);
      setColorPopupTarget(null);
    },
    [elements, pushHistory, selectedElementId, updateCurrentPage],
  );

  const getPoint = useCallback(
    (event: Pick<MouseEvent, "clientX" | "clientY">): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      let x = event.clientX - rect.left - panOffset.x;
      let y = event.clientY - rect.top - panOffset.y;
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }
      return { x, y };
    },
    [gridSize, panOffset.x, panOffset.y, snapToGrid],
  );

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvasWidth: number,
      canvasHeight: number,
    ) => {
      if (!showGrid) return;

      // LiveBoard-style reference background: a clean white canvas with
      // very light, evenly spaced dots instead of horizontal/vertical grid lines.
      ctx.save();
      ctx.fillStyle = gridColor;
      ctx.globalAlpha = 0.42;

      const radius = 1.05;
      for (let x = 0; x <= canvasWidth; x += gridSize) {
        for (let y = 0; y <= canvasHeight; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    },
    [gridColor, gridSize, showGrid],
  );

  const drawStroke = useCallback(
    (ctx: CanvasRenderingContext2D, element: StrokeElement) => {
      if (element.points.length === 0) return;
      ctx.save();
      ctx.strokeStyle = element.color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const first = element.points[0];
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < element.points.length; i++) {
        const point = element.points[i];
        const previous = element.points[i - 1];
        const midpointX = (previous.x + point.x) / 2;
        const midpointY = (previous.y + point.y) / 2;
        ctx.lineWidth = element.width;
        ctx.quadraticCurveTo(previous.x, previous.y, midpointX, midpointY);
      }
      const last = element.points[element.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.restore();
    },
    [],
  );

  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, element: ShapeElement) => {
      const { start, end } = element;
      ctx.save();
      ctx.strokeStyle = element.color || axisColor;
      ctx.lineWidth = element.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const centerX = (start.x + end.x) / 2;
      const centerY = (start.y + end.y) / 2;
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      const drawRegularPolygon = (sides: number, radius: number) => {
        const points = Array.from({ length: sides }, (_, index) => {
          const angle = -Math.PI / 2 + (index * Math.PI * 2) / sides;
          return { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
        });
        ctx.moveTo(points[0].x, points[0].y);
        for (let index = 1; index < points.length; index++) ctx.lineTo(points[index].x, points[index].y);
        ctx.closePath();
      };

      ctx.beginPath();
      if (element.type === "arrow") {
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const arrowSize = Math.max(10, Math.min(20, Math.hypot(end.x - start.x, end.y - start.y) * 0.12));
        ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
        ctx.moveTo(end.x, end.y); ctx.lineTo(end.x - arrowSize * Math.cos(angle - Math.PI / 6), end.y - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(end.x, end.y); ctx.lineTo(end.x - arrowSize * Math.cos(angle + Math.PI / 6), end.y - arrowSize * Math.sin(angle + Math.PI / 6));
      } else if (element.type === "line") {
        ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
      } else if (element.type === "ellipse") {
        ctx.ellipse(centerX, centerY, Math.max(1, width / 2), Math.max(1, height / 2), 0, 0, Math.PI * 2);
      } else if (element.type === "rectangle") {
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (element.type === "circle") {
        ctx.arc(centerX, centerY, Math.max(1, Math.min(width, height) / 2), 0, Math.PI * 2);
      } else if (element.type === "triangle") {
        ctx.moveTo(centerX, start.y); ctx.lineTo(end.x, end.y); ctx.lineTo(start.x, end.y); ctx.closePath();
      } else if (element.type === "cube") {
        const offsetX = Math.max(10, width * 0.22); const offsetY = Math.max(8, height * 0.18);
        const backLeft = start.x + offsetX; const backTop = start.y - offsetY; const backRight = end.x + offsetX; const backBottom = end.y - offsetY;
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
        ctx.moveTo(backLeft, backTop); ctx.lineTo(backRight, backTop); ctx.lineTo(backRight, backBottom); ctx.lineTo(backLeft, backBottom); ctx.closePath();
        ctx.moveTo(start.x, start.y); ctx.lineTo(backLeft, backTop); ctx.moveTo(end.x, start.y); ctx.lineTo(backRight, backTop); ctx.moveTo(end.x, end.y); ctx.lineTo(backRight, backBottom); ctx.moveTo(start.x, end.y); ctx.lineTo(backLeft, backBottom);
      } else if (element.type === "cylinder") {
        const radiusX = Math.max(1, width / 2); const radiusY = Math.max(3, Math.min(14, height * 0.16));
        ctx.ellipse(centerX, start.y, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.moveTo(start.x, start.y); ctx.lineTo(start.x, end.y); ctx.moveTo(end.x, start.y); ctx.lineTo(end.x, end.y);
        ctx.ellipse(centerX, end.y, radiusX, radiusY, 0, 0, Math.PI);
      } else if (element.type === "diamond") {
        ctx.moveTo(centerX, start.y); ctx.lineTo(end.x, centerY); ctx.lineTo(centerX, end.y); ctx.lineTo(start.x, centerY); ctx.closePath();
      } else if (element.type === "pentagon") { drawRegularPolygon(5, Math.max(1, Math.min(width, height) / 2));
      } else if (element.type === "hexagon") { drawRegularPolygon(6, Math.max(1, Math.min(width, height) / 2));
      } else if (element.type === "heptagon") { drawRegularPolygon(7, Math.max(1, Math.min(width, height) / 2));
      } else if (element.type === "octagon") { drawRegularPolygon(8, Math.max(1, Math.min(width, height) / 2));
      } else if (element.type === "parallelogram") {
        const skew = Math.max(8, width * 0.2);
        ctx.moveTo(start.x + skew, start.y); ctx.lineTo(end.x, start.y); ctx.lineTo(end.x - skew, end.y); ctx.lineTo(start.x, end.y); ctx.closePath();
      } else if (element.type === "sphere") {
        const radius = Math.max(1, Math.min(width, height) / 2);
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.moveTo(centerX, centerY - radius); ctx.ellipse(centerX, centerY, radius * 0.42, radius, 0, 0, Math.PI * 2);
      } else if (element.type === "axes") {
        ctx.moveTo(start.x, centerY); ctx.lineTo(end.x, centerY); ctx.moveTo(centerX, start.y); ctx.lineTo(centerX, end.y);
      }
      ctx.stroke();
      ctx.restore();
    },
    [axisColor],
  );

  const drawText = useCallback(
    (ctx: CanvasRenderingContext2D, element: TextElement) => {
      if (element.type === "equation") {
        const scaleX = Math.max(0.2, element.scaleX ?? 1);
        const scaleY = Math.max(0.2, element.scaleY ?? 1);
        ctx.save();
        ctx.translate(element.x, element.y);
        ctx.scale(scaleX, scaleY);
        drawMathEquation(
          ctx,
          element.text,
          0,
          0,
          element.fontSize,
          element.color,
        );
        ctx.restore();
        return;
      }

      ctx.save();
      ctx.fillStyle = element.color;
      ctx.font = `${element.italic ? "italic " : ""}${element.bold ? "700 " : "400 "}${element.fontSize}px Inter, sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(element.text, element.x, element.y);

      if (element.underline) {
        const textWidth = ctx.measureText(element.text).width;
        ctx.strokeStyle = element.color;
        ctx.lineWidth = Math.max(1, element.fontSize / 14);
        ctx.beginPath();
        ctx.moveTo(element.x, element.y + element.fontSize + 2);
        ctx.lineTo(element.x + textWidth, element.y + element.fontSize + 2);
        ctx.stroke();
      }

      ctx.restore();
    },
    [],
  );

  const drawSelection = useCallback(
    (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
      const bounds = getElementBounds(element, ctx);
      const handleSize = 9;
      const half = handleSize / 2;
      const handles = [
        { name: "nw", x: bounds.left, y: bounds.top },
        { name: "n", x: (bounds.left + bounds.right) / 2, y: bounds.top },
        { name: "ne", x: bounds.right, y: bounds.top },
        { name: "e", x: bounds.right, y: (bounds.top + bounds.bottom) / 2 },
        { name: "se", x: bounds.right, y: bounds.bottom },
        { name: "s", x: (bounds.left + bounds.right) / 2, y: bounds.bottom },
        { name: "sw", x: bounds.left, y: bounds.bottom },
        { name: "w", x: bounds.left, y: (bounds.top + bounds.bottom) / 2 },
      ];

      ctx.save();
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(
        bounds.left,
        bounds.top,
        bounds.right - bounds.left,
        bounds.bottom - bounds.top,
      );
      ctx.setLineDash([]);

      handles.forEach(({ x, y }) => {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x - half, y - half, handleSize, handleSize, 2);
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();
    },
    [],
  );

  const getUnionBounds = useCallback((items: WhiteboardElement[]) => {
    if (!items.length) return null;
    return items.reduce(
      (acc, item) => {
        const b = getElementBounds(item, contextRef.current);
        return {
          left: Math.min(acc.left, b.left),
          top: Math.min(acc.top, b.top),
          right: Math.max(acc.right, b.right),
          bottom: Math.max(acc.bottom, b.bottom),
        };
      },
      getElementBounds(items[0], contextRef.current),
    );
  }, []);

  const drawSelectionGroup = useCallback(
    (ctx: CanvasRenderingContext2D, items: WhiteboardElement[]) => {
      const bounds = getUnionBounds(items);
      if (!bounds) return;

      const handleSize = 9;
      const half = handleSize / 2;
      const handles = [
        { name: "nw", x: bounds.left, y: bounds.top },
        { name: "n", x: (bounds.left + bounds.right) / 2, y: bounds.top },
        { name: "ne", x: bounds.right, y: bounds.top },
        { name: "e", x: bounds.right, y: (bounds.top + bounds.bottom) / 2 },
        { name: "se", x: bounds.right, y: bounds.bottom },
        { name: "s", x: (bounds.left + bounds.right) / 2, y: bounds.bottom },
        { name: "sw", x: bounds.left, y: bounds.bottom },
        { name: "w", x: bounds.left, y: (bounds.top + bounds.bottom) / 2 },
      ];

      ctx.save();
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(
        bounds.left,
        bounds.top,
        bounds.right - bounds.left,
        bounds.bottom - bounds.top,
      );
      ctx.setLineDash([]);
      handles.forEach(({ x, y }) => {
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#2563eb";
        ctx.beginPath();
        ctx.roundRect(x - half, y - half, handleSize, handleSize, 2);
        ctx.fill();
        ctx.stroke();
      });

      if (items.length > 1) {
        ctx.fillStyle = "#2563eb";
        ctx.font = "700 10px Inter, sans-serif";
        ctx.textBaseline = "bottom";
        ctx.fillText(
          `${items.length} objects selected`,
          bounds.left,
          Math.max(12, bounds.top - 8),
        );
      }
      ctx.restore();
    },
    [getUnionBounds],
  );

  const getSelectionHandle = useCallback(
    (element: WhiteboardElement, point: Point) => {
      const bounds = getElementBounds(element, contextRef.current);
      const tolerance = 12;
      const handles = [
        { name: "nw" as const, x: bounds.left, y: bounds.top },
        { name: "n" as const, x: (bounds.left + bounds.right) / 2, y: bounds.top },
        { name: "ne" as const, x: bounds.right, y: bounds.top },
        { name: "e" as const, x: bounds.right, y: (bounds.top + bounds.bottom) / 2 },
        { name: "se" as const, x: bounds.right, y: bounds.bottom },
        { name: "s" as const, x: (bounds.left + bounds.right) / 2, y: bounds.bottom },
        { name: "sw" as const, x: bounds.left, y: bounds.bottom },
        { name: "w" as const, x: bounds.left, y: (bounds.top + bounds.bottom) / 2 },
      ];
      return (
        handles.find(
          (handle) =>
            Math.abs(point.x - handle.x) <= tolerance &&
            Math.abs(point.y - handle.y) <= tolerance,
        )?.name ?? null
      );
    },
    [],
  );

  const resizeElement = useCallback(
    (
      original: WhiteboardElement,
      handle: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w",
      point: Point,
    ) => {
      const bounds = getElementBounds(original, contextRef.current);
      const minSize = 12;
      let left = bounds.left;
      let right = bounds.right;
      let top = bounds.top;
      let bottom = bounds.bottom;

      if (handle.includes("w")) left = Math.min(point.x, right - minSize);
      if (handle.includes("e")) right = Math.max(point.x, left + minSize);
      if (handle.includes("n")) top = Math.min(point.y, bottom - minSize);
      if (handle.includes("s")) bottom = Math.max(point.y, top + minSize);

      const oldWidth = Math.max(bounds.right - bounds.left, minSize);
      const oldHeight = Math.max(bounds.bottom - bounds.top, minSize);
      const newWidth = Math.max(right - left, minSize);
      const newHeight = Math.max(bottom - top, minSize);
      const sx = newWidth / oldWidth;
      const sy = newHeight / oldHeight;

      if (original.type === "stroke") {
        return {
          ...original,
          width: Math.max(1, original.width * Math.sqrt(Math.abs(sx * sy))),
          points: original.points.map((p) => ({
            x: left + (p.x - bounds.left) * sx,
            y: top + (p.y - bounds.top) * sy,
          })),
        };
      }

      if (original.type === "image") {
        return {
          ...original,
          x: left,
          y: top,
          width: Math.max(minSize, right - left),
          height: Math.max(minSize, bottom - top),
        };
      }

      if ("start" in original && "end" in original) {
        return {
          ...original,
          start: { x: left, y: top },
          end: { x: right, y: bottom },
        };
      }

      if (original.type === "equation") {
        const metrics = estimateMathMetrics(original.text, original.fontSize, contextRef.current);
        const padding = Math.max(7, original.fontSize * 0.14);
        const baseWidth = Math.max(metrics.width, original.fontSize * 0.8);
        const baseHeight = Math.max(metrics.height, original.fontSize);
        const targetWidth = Math.max(minSize, newWidth - padding * 2);
        const targetHeight = Math.max(minSize, newHeight - padding * 2);
        return {
          ...original,
          x: left + padding,
          y: top + padding,
          scaleX: Math.max(0.2, targetWidth / baseWidth),
          scaleY: Math.max(0.2, targetHeight / baseHeight),
        };
      }

      if (original.type === "text") {
        return {
          ...original,
          x: left + 4,
          y: top + 4,
          fontSize: Math.max(8, original.fontSize * Math.max(sx, sy)),
        };
      }

      return original;
    },
    [],
  );

  const getSelectedElement = useCallback(() => {
    if (!selectedElementId) return null;
    return (
      elements.find((el: WhiteboardElement) => el.id === selectedElementId) ??
      null
    );
  }, [elements, selectedElementId]);

  const getSelectedElements = useCallback(() => {
    const ids = selectedElementIds.length
      ? selectedElementIds
      : selectedElementId
        ? [selectedElementId]
        : [];
    return elements.filter((el) => ids.includes(el.id));
  }, [elements, selectedElementId, selectedElementIds]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    contextRef.current = ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    // Clear the previously loaded image immediately when the selected
    // background changes. The image is loaded asynchronously below.
    backgroundImageRef.current = null;

    if (!backgroundImage) return;

    const image = new Image();
    const requestedBackground = backgroundImage;

    image.onload = () => {
      // Ignore a late response from an image that is no longer selected.
      if (backgroundImage !== requestedBackground) return;

      backgroundImageRef.current = image;
      // This state update happens from the external image-load callback,
      // rather than synchronously inside the effect body.
      setBackgroundImageVersion((value) => value + 1);
    };

    image.onerror = () => {
      if (backgroundImage !== requestedBackground) return;

      console.error(
        `Failed to load whiteboard background image: ${requestedBackground}`,
      );
      backgroundImageRef.current = null;
      setBackgroundImageVersion((value) => value + 1);
    };

    image.src = requestedBackground;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [backgroundImage]);

  // Load imported board images once and redraw when they become available.
  useEffect(() => {
    const imageElements = elements.filter(
      (element): element is ImageElement => element.type === "image",
    );
    imageElements.forEach((element) => {
      if (imageCacheRef.current.has(element.src)) return;
      const image = new Image();
      image.onload = () => {
        imageCacheRef.current.set(element.src, image);
        setImageVersion((value) => value + 1);
      };
      image.onerror = () => {
        imageCacheRef.current.delete(element.src);
      };
      image.src = element.src;
    });
  }, [elements]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    resizeCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = container.getBoundingClientRect();

    if (backgroundImage && backgroundImageRef.current) {
      const image = backgroundImageRef.current;

      const scale = Math.max(
        rect.width / image.naturalWidth,
        rect.height / image.naturalHeight,
      );

      const imageWidth = image.naturalWidth * scale;
      const imageHeight = image.naturalHeight * scale;
      const imageX = (rect.width - imageWidth) / 2;
      const imageY = (rect.height - imageHeight) / 2;

      ctx.drawImage(image, imageX, imageY, imageWidth, imageHeight);
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    drawGrid(ctx, rect.width, rect.height);

    // Hand/pan mode moves the board content without moving the toolbar or grid.
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);

    // During move/resize, draw the live transformed element instead of waiting
    // for React state to update on pointer-up. This makes resizing feel
    // continuous and keeps the selection handles attached to the live object.
    const liveTransform = transformRef.current;
    const liveElementsById = new Map(
      (liveTransform?.elements ?? []).map((element) => [element.id, element]),
    );

    for (const element of elements) {
      // While editing an existing text element, the live textarea is the
      // source of truth. Hide the underlying canvas text so it does not
      // appear duplicated underneath the editor.
      if (
        textEditor.open &&
        textEditor.type === "text" &&
        textEditor.editingElementId === element.id
      ) {
        continue;
      }

      const elementToDraw = liveElementsById.get(element.id) ?? element;

      if (elementToDraw.type === "stroke") drawStroke(ctx, elementToDraw);
      else if (elementToDraw.type === "image") {
        const image = imageCacheRef.current.get(elementToDraw.src);
        if (image) {
          ctx.drawImage(
            image,
            elementToDraw.x,
            elementToDraw.y,
            elementToDraw.width,
            elementToDraw.height,
          );
        } else {
          ctx.save();
          ctx.fillStyle = "#e2e8f0";
          ctx.fillRect(
            elementToDraw.x,
            elementToDraw.y,
            elementToDraw.width,
            elementToDraw.height,
          );
          ctx.strokeStyle = "#94a3b8";
          ctx.strokeRect(
            elementToDraw.x,
            elementToDraw.y,
            elementToDraw.width,
            elementToDraw.height,
          );
          ctx.fillStyle = "#64748b";
          ctx.font = "12px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            "Loading image…",
            elementToDraw.x + elementToDraw.width / 2,
            elementToDraw.y + elementToDraw.height / 2,
          );
          ctx.restore();
        }
      } else if (
        ["arrow", "line", "ellipse", "rectangle", "circle", "triangle", "cube", "cylinder", "diamond", "pentagon", "hexagon", "heptagon", "octagon", "parallelogram", "sphere", "axes"].includes(
          elementToDraw.type,
        )
      )
        drawShape(ctx, elementToDraw as ShapeElement);
      else if (
        elementToDraw.type === "text" ||
        elementToDraw.type === "equation"
      )
        drawText(ctx, elementToDraw as TextElement);
    }

    if (currentStrokeRef.current) drawStroke(ctx, currentStrokeRef.current);
    if (previewElementRef.current) drawShape(ctx, previewElementRef.current);

    const selectedItems = liveTransform
      ? liveTransform.elements
      : getSelectedElements();

    // While a text object is being edited, the live textarea below is the
    // source of truth for its size. Do not draw the stale canvas selection
    // underneath it; the textarea itself renders the live blue dotted frame.
    if (!textEditor.open) {
      if (selectedItems.length === 1) {
        drawSelection(ctx, selectedItems[0]);
      } else if (selectedItems.length > 1) {
        drawSelectionGroup(ctx, selectedItems);
      }
    }

    const marquee = marqueeRef.current;
    if (marquee?.moved) {
      const left = Math.min(marquee.start.x, marquee.current.x);
      const top = Math.min(marquee.start.y, marquee.current.y);
      const width = Math.abs(marquee.current.x - marquee.start.x);
      const height = Math.abs(marquee.current.y - marquee.start.y);
      ctx.save();
      ctx.fillStyle = "rgba(37, 99, 235, 0.08)";
      ctx.fillRect(left, top, width, height);
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(left, top, width, height);
      ctx.restore();
    }

    ctx.restore();
  }, [
    backgroundColor,
    backgroundImage,
    drawGrid,
    drawShape,
    drawStroke,
    drawText,
    drawSelection,
    drawSelectionGroup,
    elements,
    getSelectedElements,
    panOffset.x,
    panOffset.y,
    resizeCanvas,
  ]);

  // backgroundImageVersion is intentionally a render trigger. The image is
  // loaded outside React, so redraw the canvas when that external image load
  // completes without making it an unnecessary renderCanvas dependency.
  useEffect(() => {
    if (backgroundImageVersion >= 0) {
      renderCanvas();
    }
  }, [backgroundImageVersion, renderCanvas]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeFrame = 0;

    const syncCanvasSize = () => {
      cancelAnimationFrame(resizeFrame);

      resizeFrame = requestAnimationFrame(() => {
        resizeCanvas();
        renderCanvas();

        // Run one more frame after browser layout settles.
        requestAnimationFrame(() => {
          resizeCanvas();
          renderCanvas();
        });
      });
    };

    // Initial render
    syncCanvasSize();

    // Detect normal browser/window resizing AND flex/container resizing.
    const resizeObserver = new ResizeObserver(() => {
      syncCanvasSize();
    });

    resizeObserver.observe(container);

    const handleResize = () => {
      syncCanvasSize();
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));

      // Fullscreen changes can happen across multiple layout frames.
      syncCanvasSize();

      requestAnimationFrame(() => {
        syncCanvasSize();
      });

      setTimeout(() => {
        syncCanvasSize();
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [resizeCanvas, renderCanvas]);

  const openLatexEditor = useCallback(
    (
      initialText = "",
      editingElementId: string | null = null,
      existingColor?: string,
    ) => {
      setTextEditor((previous) => ({ ...previous, open: false }));
      setActiveTextPanel(null);
      setLatexTab("All");
      setLatexEditor({
        open: true,
        text: initialText,
        color: existingColor ?? color,
        editingElementId,
        x: Math.max(12, window.innerWidth / 2 - 390),
        y: Math.max(12, window.innerHeight / 2 - 300),
      });
      requestAnimationFrame(() => {
        latexInputRef.current?.focus();
        latexInputRef.current?.select();
      });
    },
    [color],
  );

  const openTextEditor = useCallback(
    (
      point: Point,
      type: "text" | "equation",
      initialText = "",
      editingElementId: string | null = null,
      existingFontSize?: number,
      existingColor?: string,
      existingBold?: boolean,
      existingItalic?: boolean,
      existingUnderline?: boolean,
    ) => {
      setActiveTextPanel(null);
      setTextEditor({
        open: true,
        type,
        x: point.x,
        y: point.y,
        text: initialText,
        fontSize:
          existingFontSize ??
          (type === "equation" ? Math.max(fontSize, 24) : fontSize),
        color: existingColor ?? color,
        bold: existingBold ?? false,
        italic: existingItalic ?? false,
        underline: existingUnderline ?? false,
        editingElementId,
      });

      requestAnimationFrame(() => {
        textInputRef.current?.focus();
        textInputRef.current?.select();
      });
    },
    [color, fontSize],
  );

  const handleTextEditorDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest("button, input, select, textarea, [data-no-drag]"))
        return;
      const rect = event.currentTarget.parentElement?.getBoundingClientRect();
      if (!rect) return;
      popupDragRef.current = {
        key: "textEditor",
        dx: event.clientX - rect.left,
        dy: event.clientY - rect.top,
        element: event.currentTarget.parentElement as HTMLElement,
        captureTarget: event.currentTarget,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [],
  );

  const handleTextEditorDragMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = popupDragRef.current;
      if (!drag || drag.key !== "textEditor") return;
      const root = rootRef.current?.getBoundingClientRect();
      if (!root) return;

      const popup = drag.element;
      const width = popup.offsetWidth;
      const height = popup.offsetHeight;
      const maxX = Math.max(8, root.width - width - 8);
      const maxY = Math.max(8, root.height - height - 8);

      const x = Math.max(
        8,
        Math.min(event.clientX - root.left - drag.dx, maxX),
      );
      const y = Math.max(8, Math.min(event.clientY - root.top - drag.dy, maxY));

      setTextEditor((previous) => ({ ...previous, x, y }));
    },
    [],
  );

  const handleTextEditorDragEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = popupDragRef.current;
      popupDragRef.current = null;

      if (drag) {
        try {
          drag.captureTarget.releasePointerCapture(event.pointerId);
        } catch {}
      }
    },
    [],
  );

  const closeTextEditor = useCallback(() => {
    const editingId = textEditor.editingElementId;

    if (editingId && !textEditor.text.trim()) {
      updateCurrentPage((page) => ({
        ...page,
        elements: page.elements.filter(
          (element: WhiteboardElement) => element.id !== editingId,
        ),
      }));
      setSelectedElementId(null);
      setSelectedElementIds([]);
    }

    setTextEditor((previous) => ({
      ...previous,
      open: false,
      text: "",
      editingElementId: null,
    }));
    setActiveTextPanel(null);
    setShowTextFormattingColors(false);
    setTool("select");
  }, [textEditor.editingElementId, textEditor.text, updateCurrentPage]);

  const insertLatexAtCursor = useCallback(
    (value: string) => {
      const input = textInputRef.current;
      if (!input) {
        setTextEditor((previous) => ({
          ...previous,
          text: `${previous.text}${value}`,
        }));
        return;
      }

      const start = input.selectionStart ?? textEditor.text.length;
      const end = input.selectionEnd ?? start;
      const nextText =
        textEditor.text.slice(0, start) + value + textEditor.text.slice(end);
      const nextCursor = start + value.length;

      setTextEditor((previous) => ({ ...previous, text: nextText }));
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(nextCursor, nextCursor);
      });
    },
    [textEditor.text],
  );

  const insertLatexModalAtCursor = useCallback((value: string) => {
    const input = latexInputRef.current;
    if (!input) {
      setLatexEditor((previous) => ({ ...previous, text: previous.text + value }));
      return;
    }

    const start = input.selectionStart ?? latexEditor.text.length;
    const end = input.selectionEnd ?? start;
    const nextText =
      latexEditor.text.slice(0, start) + value + latexEditor.text.slice(end);
    const nextCursor = start + value.length;

    setLatexEditor((previous) => ({ ...previous, text: nextText }));
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
    });
  }, [latexEditor.text]);

  const addLatexElement = useCallback(() => {
    const value = latexEditor.text.trim();
    if (!value) {
      latexInputRef.current?.focus();
      return;
    }

    pushHistory();

    if (latexEditor.editingElementId) {
      updateCurrentPage((page) => ({
        ...page,
        elements: page.elements.map((element: WhiteboardElement) =>
          element.id === latexEditor.editingElementId &&
          element.type === "equation"
            ? {
                ...element,
                text: value,
                color: latexEditor.color,
                fontSize: Math.max(element.fontSize, 24),
              }
            : element,
        ),
      }));
      setSelectedElementId(latexEditor.editingElementId);
      setSelectedElementIds([latexEditor.editingElementId]);
    } else {
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      const x = rect ? Math.max(0, rect.width / 2 - 18) : 120;
      const y = rect ? Math.max(0, rect.height / 2 - 60) : 120;
      const el: TextElement = {
        id: createId(),
        type: "equation",
        x,
        y,
        text: value,
        color: latexEditor.color,
        fontSize: Math.max(fontSize, 24),
        bold: false,
        italic: false,
        underline: false,
      };
      updateCurrentPage((page) => ({
        ...page,
        elements: [...page.elements, el],
      }));
      setSelectedElementId(el.id);
      setSelectedElementIds([el.id]);
    }

    // Formula insertion is a one-shot action. Once the formula is committed,
    // leave the equation tool and return to normal object-selection mode.
    // This prevents the next click on the newly inserted equation from
    // starting the equation insertion flow again.
    setLatexEditor((previous) => ({
      ...previous,
      open: false,
      text: "",
      editingElementId: null,
    }));
    setSelectedEquation("");
    setActiveTextPanel(null);
    setShowTextFormattingColors(false);
    textPlacementArmedRef.current = false;
    setTool("select");
  }, [fontSize, latexEditor, pushHistory, updateCurrentPage]);

  const addTextElement = useCallback(() => {
    const value = textEditor.text.trim();

    if (!value) {
      if (textEditor.editingElementId) {
        updateCurrentPage((page) => ({
          ...page,
          elements: page.elements.filter(
            (element: WhiteboardElement) =>
              element.id !== textEditor.editingElementId,
          ),
        }));
        setSelectedElementId(null);
        setSelectedElementIds([]);
      }

      setTextEditor((previous) => ({
        ...previous,
        open: false,
        text: "",
        editingElementId: null,
      }));
      setActiveTextPanel(null);
      textPlacementArmedRef.current = false;
      setTool("select");
      return;
    }

    pushHistory();

    if (textEditor.editingElementId) {
      updateCurrentPage((page) => ({
        ...page,
        elements: page.elements.map((element: WhiteboardElement) => {
          if (element.id !== textEditor.editingElementId) return element;
          if (element.type !== "text" && element.type !== "equation")
            return element;

          return {
            ...element,
            type: "text",
            text: value,
            color: textEditor.color,
            fontSize: textEditor.fontSize,
            bold: textEditor.bold,
            italic: textEditor.italic,
            underline: textEditor.underline,
          };
        }),
      }));

      setSelectedElementId(textEditor.editingElementId);
      setSelectedElementIds([textEditor.editingElementId]);
      setTextEditor((previous) => ({
        ...previous,
        open: false,
        text: "",
        editingElementId: null,
      }));
      setActiveTextPanel(null);
      textPlacementArmedRef.current = false;
      setTool("select");
      return;
    }

    const el: TextElement = {
      id: createId(),
      type: textEditor.type,
      x: textEditor.x,
      y: textEditor.y,
      text: value,
      color: textEditor.color,
      fontSize:
        textEditor.type === "equation"
          ? Math.max(textEditor.fontSize, 24)
          : textEditor.fontSize,
      bold: textEditor.type === "text" ? textEditor.bold : false,
      italic: textEditor.type === "text" ? textEditor.italic : false,
      underline: textEditor.type === "text" ? textEditor.underline : false,
    };

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      el.x = Math.max(0, textEditor.x - rect.left - 18);
      el.y = Math.max(0, textEditor.y - rect.top - 18);
    }

    updateCurrentPage((page) => ({
      ...page,
      elements: [...page.elements, el],
    }));

    setSelectedElementId(el.id);
    setSelectedElementIds([el.id]);
    setTextEditor((previous) => ({
      ...previous,
      open: false,
      text: "",
      editingElementId: null,
    }));
    setActiveTextPanel(null);
    textPlacementArmedRef.current = false;
    setTool("select");
  }, [pushHistory, textEditor, updateCurrentPage]);

  useEffect(() => {
    if (!textEditor.open || textEditor.type !== "text") return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-text-editor-ui]")) return;
      addTextElement();
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
    };
  }, [addTextElement, textEditor.open, textEditor.type]);

  // Duplicate the currently selected object using the latest React state.
  // This avoids stale `elements` when the board is updating at the same time.
  const duplicateSelectedElement = useCallback(() => {
    if (!selectedElementId) return;

    pushHistory();

    let duplicatedId: string | null = null;

    setPages((previous) =>
      previous.map((page, index) => {
        if (index !== currentPageIndex) return page;

        const selected = page.elements.find(
          (element: WhiteboardElement) => element.id === selectedElementId,
        );
        if (!selected) return page;

        const duplicate = structuredClone(selected) as WhiteboardElement;
        duplicate.id = createId();
        duplicatedId = duplicate.id;

        const offset = 24;

        if (duplicate.type === "stroke") {
          duplicate.points = duplicate.points.map((point) => ({
            x: point.x + offset,
            y: point.y + offset,
          }));
        } else if ("start" in duplicate && "end" in duplicate) {
          duplicate.start = {
            x: duplicate.start.x + offset,
            y: duplicate.start.y + offset,
          };
          duplicate.end = {
            x: duplicate.end.x + offset,
            y: duplicate.end.y + offset,
          };
        } else {
          duplicate.x += offset;
          duplicate.y += offset;
        }

        return {
          ...page,
          elements: [...page.elements, duplicate],
        };
      }),
    );

    if (duplicatedId) {
      setSelectedElementId(duplicatedId);
      setSelectedElementIds([duplicatedId]);
      setIsSaved(false);
    }
  }, [currentPageIndex, pushHistory, selectedElementId]);

  const handleTextEditorKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeTextEditor();
      return;
    }

    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      addTextElement();
    }
  };

  const insertGraphFromDesmos = useCallback(() => {
    const calculator = graphCalculatorRef.current;
    const canvas = canvasRef.current;
    if (!calculator || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = Math.min(640, Math.max(320, rect.width * 0.52));
    const height = Math.min(480, Math.max(240, width * 0.68));

    const addGraphImage = (src: string) => {
      const graphState = calculator.getState
        ? JSON.stringify(calculator.getState())
        : undefined;
      const editingId = graphEditingElementIdRef.current;
      const existingGraph = editingId
        ? elements.find(
            (element): element is ImageElement =>
              element.id === editingId &&
              element.type === "image" &&
              element.name === "Desmos Graph",
          )
        : null;

      const element: ImageElement = existingGraph
        ? {
            ...existingGraph,
            src,
            graphState,
          }
        : {
            id: createId(),
            type: "image",
            x: Math.max(12, (rect.width - width) / 2),
            y: Math.max(72, (rect.height - height) / 2),
            width,
            height,
            src,
            name: "Desmos Graph",
            graphState,
          };

      const image = new Image();
      image.onload = () => {
        imageCacheRef.current.set(src, image);
        setImageVersion((value) => value + 1);
      };
      image.src = src;

      pushHistory();
      updateCurrentPage((page) => ({
        ...page,
        elements: existingGraph
          ? page.elements.map((item) =>
              item.id === existingGraph.id ? element : item,
            )
          : [...page.elements, element],
      }));
      setTool("select");
      setSelectedElementId(element.id);
      setSelectedElementIds([element.id]);
      setShowGraphEditor(false);
      graphEditingElementIdRef.current = null;
    };

    if (calculator.asyncScreenshot) {
      calculator.asyncScreenshot(
        { width: Math.round(width), height: Math.round(height) },
        addGraphImage,
      );
    } else {
      addGraphImage(
        calculator.screenshot({
          width: Math.round(width),
          height: Math.round(height),
        }),
      );
    }
  }, [pushHistory, updateCurrentPage]);

  const addImportedImage = useCallback(
    (src: string, width: number, height: number, name: string, sourceType: "image" | "pdf" = "image") => {
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      if (!rect) return;

      const maxWidth = Math.min(520, rect.width * 0.48);
      const maxHeight = Math.min(420, rect.height * 0.48);
      const scale = Math.min(1, maxWidth / width, maxHeight / height);
      const finalWidth = Math.max(80, width * scale);
      const finalHeight = Math.max(80, height * scale);
      const element: ImageElement = {
        id: createId(),
        type: "image",
        x: Math.max(12, (rect.width - finalWidth) / 2),
        y: Math.max(12, (rect.height - finalHeight) / 2),
        width: finalWidth,
        height: finalHeight,
        src,
        name,
        sourceType,
      };

      pushHistory();
      updateCurrentPage((page) => ({
        ...page,
        elements: [...page.elements, element],
      }));
      const image = new Image();
      image.onload = () => {
        imageCacheRef.current.set(src, image);
        setImageVersion((value) => value + 1);
      };
      image.src = src;
      setTool("select");
      setSelectedElementId(element.id);
      setSelectedElementIds([element.id]);
    },
    [pushHistory, updateCurrentPage],
  );

  const importImage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        const image = new Image();
        image.onload = () => {
          addImportedImage(image.src, image.naturalWidth, image.naturalHeight, file.name, "image");
        };
        image.src = src;
      };
      reader.readAsDataURL(file);
    },
    [addImportedImage],
  );

  const importPdf = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || file.type !== "application/pdf") return;

      try {
        const pdfjs = await loadPdfJs();
        const data = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjs.getDocument({ data }).promise;
        const pageCount = Math.min(pdf.numPages, 20);
        const canvas = canvasRef.current;
        const rect = canvas?.getBoundingClientRect();
        if (!rect) return;

        pushHistory();
        const newElements: ImageElement[] = [];
        let y = Math.max(24, (rect.height - Math.min(720, rect.height * 0.8)) / 2);

        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1.25 });
          const maxWidth = Math.min(620, rect.width * 0.58);
          const scale = Math.min(1, maxWidth / baseViewport.width);
          const viewport = page.getViewport({ scale: 1.25 * scale });
          const renderCanvas = document.createElement("canvas");
          renderCanvas.width = Math.ceil(viewport.width);
          renderCanvas.height = Math.ceil(viewport.height);
          const renderContext = renderCanvas.getContext("2d");
          if (!renderContext) continue;

          await page.render({
            canvasContext: renderContext,
            viewport,
          }).promise;

          const src = renderCanvas.toDataURL("image/png");
          const element: ImageElement = {
            id: createId(),
            type: "image",
            x: Math.max(12, (rect.width - viewport.width) / 2),
            y,
            width: viewport.width,
            height: viewport.height,
            src,
            name: `${file.name} — Page ${pageNumber}`,
            sourceType: "pdf",
          };
          newElements.push(element);
          const pdfImage = new Image();
          pdfImage.onload = () => {
            imageCacheRef.current.set(src, pdfImage);
            setImageVersion((value) => value + 1);
          };
          pdfImage.src = src;
          y += viewport.height + 24;
        }

        if (newElements.length === 0) return;
        updateCurrentPage((page) => ({
          ...page,
          elements: [...page.elements, ...newElements],
        }));
        setImageVersion((value) => value + 1);
        const first = newElements[0];
        setTool("select");
        setSelectedElementId(first.id);
        setSelectedElementIds([first.id]);
      } catch (error) {
        console.error("Failed to import PDF", error);
        window.alert("Unable to import this PDF. Please try again.");
      }
    },
    [pushHistory, updateCurrentPage],
  );

  const cropSelectedImage = useCallback(async () => {
    const target = elements.find(
      (element): element is ImageElement =>
        element.id === cropEditor.elementId && element.type === "image",
    );
    if (!target) return;

    const image = imageCacheRef.current.get(target.src);
    if (!image) return;

    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    const left = Math.max(0, Math.min(100, cropEditor.left));
    const top = Math.max(0, Math.min(100, cropEditor.top));
    const right = Math.max(left + 1, Math.min(100, cropEditor.right));
    const bottom = Math.max(top + 1, Math.min(100, cropEditor.bottom));
    const sx = Math.round((left / 100) * naturalWidth);
    const sy = Math.round((top / 100) * naturalHeight);
    const sw = Math.max(1, Math.round(((right - left) / 100) * naturalWidth));
    const sh = Math.max(1, Math.round(((bottom - top) / 100) * naturalHeight));
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = sw;
    cropCanvas.height = sh;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
    const src = cropCanvas.toDataURL("image/png");
    const nextWidth = target.width * ((right - left) / 100);
    const nextHeight = target.height * ((bottom - top) / 100);

    pushHistory();
    updateCurrentPage((page) => ({
      ...page,
      elements: page.elements.map((element) =>
        element.id === target.id
          ? {
              ...element,
              src,
              width: Math.max(40, nextWidth),
              height: Math.max(40, nextHeight),
            }
          : element,
      ),
    }));
    const croppedImage = new Image();
    croppedImage.onload = () => {
      imageCacheRef.current.set(src, croppedImage);
      setImageVersion((value) => value + 1);
    };
    croppedImage.src = src;
    setCropEditor((previous) => ({ ...previous, open: false, elementId: null }));
  }, [cropEditor, elements, pushHistory, updateCurrentPage]);

  const handleCanvasContextMenu = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (tool !== "select" || !selectedElementId) return;

      const point = getPoint(event.nativeEvent);
      const selected = elements.find(
        (element: WhiteboardElement) => element.id === selectedElementId,
      );

      if (selected && hitTestElement(selected, point, contextRef.current)) {
        event.preventDefault();
        duplicateSelectedElement();
      }
    },
    [duplicateSelectedElement, elements, getPoint, selectedElementId, tool],
  );

  const handleCanvasDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (tool !== "select") return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;

      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }

      const point: Point = { x, y };

      const hit = [...elements]
        .reverse()
        .find((element: WhiteboardElement) =>
          hitTestElement(element, point, contextRef.current),
        );

      if (!hit || (hit.type !== "text" && hit.type !== "equation")) {
        return;
      }

      setSelectedElementId(hit.id);
      setSelectedElementIds([hit.id]);

      if (hit.type === "equation") {
        openLatexEditor(hit.text, hit.id, hit.color);
      } else {
        setShowTextFormattingColors(false);
        openTextEditor(
          { x: hit.x, y: hit.y },
          "text",
          hit.text,
          hit.id,
          hit.fontSize,
          hit.color,
          hit.bold ?? false,
          hit.italic ?? false,
          hit.underline ?? false,
        );
      }
    },
    [elements, gridSize, openLatexEditor, openTextEditor, snapToGrid, tool],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    // Clicking the whiteboard outside the live text editor commits the text
    // and exits editing mode before the board handles the new pointer action.
    if (textEditor.open && textEditor.type === "text") {
      addTextElement();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);

    const point = getPoint(event.nativeEvent);
    startPointRef.current = point;

    if (tool === "hand") {
      drawingRef.current = true;
      panRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: panOffset.x,
        originY: panOffset.y,
      };
      return;
    }

    if (tool === "select") {
      const selected = getSelectedElement();
      const isMulti = selectedElementIds.length > 1;

      if (selected && !isMulti) {
        const handle = getSelectionHandle(selected, point);
        if (handle) {
          pushHistory();
          drawingRef.current = true;
          transformRef.current = {
            mode: "resize",
            ids: [selected.id],
            elements: [structuredClone(selected)],
            originalElements: [structuredClone(selected)],
            startPoint: point,
            anchor: point,
            handle,
            moved: false,
          };
          return;
        }
      }

      const hit = [...elements]
        .reverse()
        .find((el) => hitTestElement(el, point, contextRef.current));

      if (hit) {
        const alreadySelected = selectedElementIds.includes(hit.id);
        let nextIds = selectedElementIds;

        if (event.shiftKey) {
          nextIds = alreadySelected
            ? selectedElementIds.filter((id) => id !== hit.id)
            : [...selectedElementIds, hit.id];
          setSelectedElementIds(nextIds);
          setSelectedElementId(nextIds[0] ?? null);

          if (!nextIds.length) {
            drawingRef.current = false;
            return;
          }
        } else if (!alreadySelected || !selectedElementIds.length) {
          nextIds = [hit.id];
          setSelectedElementIds(nextIds);
          setSelectedElementId(hit.id);
        }

        // A single click in Select mode only selects/moves the object.
        // Text enters editing mode exclusively through the double-click
        // handler below. While the text object is being dragged, keep the
        // editing toolbar hidden; it reappears when the drag is released.
        if (hit.type === "text" || hit.type === "equation") {
          setActiveTextPanel(null);
          setShowTextFormattingColors(false);
          if (hit.type === "text") {
            setTextObjectDragging(true);
          }
        }

        const movingElements = elements.filter((el) => nextIds.includes(el.id));
        pushHistory();
        drawingRef.current = true;
        transformRef.current = {
          mode: "move",
          ids: nextIds,
          elements: structuredClone(movingElements),
          originalElements: structuredClone(movingElements),
          startPoint: point,
          anchor: point,
          handle: null,
          moved: false,
        };
      } else {
        setSelectedElementId(null);
        if (!event.shiftKey) setSelectedElementIds([]);
        marqueeRef.current = {
          start: point,
          current: point,
          moved: false,
        };
        drawingRef.current = true;
      }
      return;
    }

    if (tool === "pen" || tool === "eraser") {
      pushHistory();
      drawingRef.current = true;
      currentStrokeRef.current = {
        id: createId(),
        type: "stroke",
        points: [point],
        color: tool === "eraser" ? backgroundColor : color,
        width: tool === "eraser" ? eraserWidth : width,
        pressureSensitive: true,
      };
      return;
    }

    if (
      ["arrow", "line", "ellipse", "rectangle", "circle", "triangle", "cube", "cylinder", "diamond", "pentagon", "hexagon", "heptagon", "octagon", "parallelogram", "sphere", "axes", "ruler"].includes(
        tool,
      )
    ) {
      pushHistory();
      drawingRef.current = true;
      const shapeType: ShapeType =
        tool === "ruler" ? "line" : (tool as ShapeType);
      previewElementRef.current = {
        id: createId(),
        type: shapeType,
        start: point,
        end: point,
        color,
        width,
      };
      renderCanvas();
      return;
    }

    if (tool === "text") {
      if (!textPlacementArmedRef.current) {
        return;
      }

      textPlacementArmedRef.current = false;
      const id = createId();
      const starter: TextElement = {
        id,
        type: "text",
        x: point.x,
        y: point.y,
        text: "",
        color,
        fontSize,
        bold: false,
        italic: false,
        underline: false,
      };

      updateCurrentPage((page) => ({
        ...page,
        elements: [...page.elements, starter],
      }));

      setSelectedElementId(id);
      setSelectedElementIds([id]);
      setShowTextFormattingColors(false);

      openTextEditor(
        point,
        "text",
        "",
        id,
        fontSize,
        color,
        false,
        false,
        false,
      );
      return;
    }

    if (tool === "equation") {
      openLatexEditor(selectedEquation);
      setSelectedEquation("");
      return;
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const point = getPoint(event.nativeEvent);

    if (tool === "hand" && panRef.current) {
      const pan = panRef.current;
      if (pan.pointerId !== event.pointerId) return;
      setPanOffset({
        x: pan.originX + event.clientX - pan.startX,
        y: pan.originY + event.clientY - pan.startY,
      });
      renderCanvas();
      return;
    }

    if (panRef.current?.pointerId === event.pointerId) {
      panRef.current = null;
      startPointRef.current = null;
      renderCanvas();
      return;
    }

    if (transformRef.current) {
      const tr = transformRef.current;

      if (
        tr.mode === "resize" &&
        tr.handle &&
        tr.originalElements.length === 1
      ) {
        tr.elements = [resizeElement(tr.originalElements[0], tr.handle, point)];
      } else {
        const dx = point.x - tr.startPoint.x;
        const dy = point.y - tr.startPoint.y;
        tr.elements = tr.originalElements.map((element) =>
          translateElement(element, dx, dy),
        );
      }

      tr.moved = true;
      renderCanvas();
      return;
    }

    if (marqueeRef.current) {
      marqueeRef.current.current = point;
      marqueeRef.current.moved =
        Math.abs(point.x - marqueeRef.current.start.x) > 4 ||
        Math.abs(point.y - marqueeRef.current.start.y) > 4;
      renderCanvas();
      return;
    }

    if (currentStrokeRef.current) {
      currentStrokeRef.current.points.push(point);
      renderCanvas();
      return;
    }

    if (previewElementRef.current) {
      previewElementRef.current.end = point;
      renderCanvas();
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {}
    }

    if (transformRef.current) {
      const tr = transformRef.current;
      if (tr.moved) {
        const finalElements = tr.elements;
        updateCurrentPage((page) => ({
          ...page,
          elements: page.elements.map((el) => {
            const final = finalElements.find((item) => item.id === el.id);
            return final ?? el;
          }),
        }));
      }
      const wasTextDrag = tr.ids.some((id) =>
        elements.some((element) => element.id === id && element.type === "text"),
      );
      transformRef.current = null;
      if (wasTextDrag) {
        setTextObjectDragging(false);
      }
      renderCanvas();
      return;
    }

    if (marqueeRef.current) {
      const marquee = marqueeRef.current;
      const left = Math.min(marquee.start.x, marquee.current.x);
      const right = Math.max(marquee.start.x, marquee.current.x);
      const top = Math.min(marquee.start.y, marquee.current.y);
      const bottom = Math.max(marquee.start.y, marquee.current.y);

      if (marquee.moved) {
        const ids = elements
          .filter((element) => {
            const b = getElementBounds(element, contextRef.current);
            return (
              b.left >= left &&
              b.right <= right &&
              b.top >= top &&
              b.bottom <= bottom
            );
          })
          .map((element) => element.id);

        const nextIds = event.shiftKey
          ? Array.from(new Set([...selectedElementIds, ...ids]))
          : ids;

        setSelectedElementIds(nextIds);
        setSelectedElementId(nextIds[0] ?? null);
      } else if (!event.shiftKey) {
        setSelectedElementIds([]);
        setSelectedElementId(null);
      }

      marqueeRef.current = null;
      renderCanvas();
      return;
    }

    if (currentStrokeRef.current) {
      const stroke = currentStrokeRef.current;
      if (stroke.points.length > 0) {
        updateCurrentPage((p) => ({
          ...p,
          elements: [...p.elements, stroke],
        }));
      }
      currentStrokeRef.current = null;
    }

    if (previewElementRef.current) {
      const el = previewElementRef.current;
      updateCurrentPage((p) => ({
        ...p,
        elements: [...p.elements, el],
      }));
      previewElementRef.current = null;
      renderCanvas();
    }
  };

  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    redoRef.current.push(JSON.parse(JSON.stringify(pages)));
    setPages(prev);
    setCurrentPageIndex((i) => Math.min(i, prev.length - 1));
  };

  const redo = () => {
    const next = redoRef.current.pop();
    if (!next) return;
    historyRef.current.push(JSON.parse(JSON.stringify(pages)));
    setPages(next);
    setCurrentPageIndex((i) => Math.min(i, next.length - 1));
  };

  const clearPage = () => {
    if (!currentPage || currentPage.elements.length === 0) return;
    pushHistory();
    updateCurrentPage((p) => ({ ...p, elements: [] }));
  };

  const addPage = () => {
    pushHistory();
    const newPage = createPage(`Page ${pages.length + 1}`);
    setPages((p) => [...p, newPage]);
    setCurrentPageIndex(pages.length);
  };

  const duplicatePage = useCallback(
    (index: number) => {
      pushHistory();

      let duplicatedIndex = index;

      setPages((previous) => {
        const sourcePage = previous[index];
        if (!sourcePage) return previous;

        const duplicatedPage: WhiteboardPage = {
          ...structuredClone(sourcePage),
          id: createId(),
          name: `${sourcePage.name} (Copy)`,
          elements: sourcePage.elements.map((element: WhiteboardElement) => ({
            ...structuredClone(element),
            id: createId(),
          })),
        };

        duplicatedIndex = index + 1;

        return [
          ...previous.slice(0, duplicatedIndex),
          duplicatedPage,
          ...previous.slice(duplicatedIndex),
        ];
      });

      setCurrentPageIndex(duplicatedIndex);
      setSelectedElementId(null);
      setSelectedElementIds([]);
      setIsSaved(false);
    },
    [pushHistory],
  );

  const duplicateCurrentPage = useCallback(() => {
    duplicatePage(currentPageIndex);
  }, [currentPageIndex, duplicatePage]);

  const deletePage = (index: number) => {
    if (pages.length === 1) {
      clearPage();
      return;
    }
    pushHistory();
    setPages((p) => p.filter((_, idx) => idx !== index));
    setCurrentPageIndex((c) => Math.max(0, Math.min(c, pages.length - 2)));
  };

  const goToPreviousPage = useCallback(() => {
    setCurrentPageIndex((current) => {
      const next = Math.max(0, current - 1);
      if (next !== current) {
        setSelectedElementId(null);
        setSelectedElementIds([]);
      }
      return next;
    });
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPageIndex((current) => {
      const next = Math.min(pages.length - 1, current + 1);
      if (next !== current) {
        setSelectedElementId(null);
        setSelectedElementIds([]);
      }
      return next;
    });
  }, [pages.length]);

  const renamePage = (index: number) => {
    const page = pages[index];
    if (!page) return;

    setRenamePageState({
      open: true,
      index,
      name: page.name,
    });
  };

  const closeRenamePage = () => {
    setRenamePageState({
      open: false,
      index: null,
      name: "",
    });
  };

  const saveRenamedPage = () => {
    const index = renamePageState.index;
    const name = renamePageState.name.trim();

    if (index === null || !name) return;

    const page = pages[index];
    if (!page || page.name === name) {
      closeRenamePage();
      return;
    }

    pushHistory();
    setPages((previous) =>
      previous.map((item, idx) => (idx === index ? { ...item, name } : item)),
    );
    closeRenamePage();
  };

  const resolveWhiteboard = useCallback(async () => {
    try {
      setWhiteboardReady(false);

      if (mode === "appointment" && !appointmentId) {
        throw new Error("Appointment ID is required");
      }

      if (mode === "booking" && !bookingId) {
        throw new Error("Booking ID is required");
      }

      const response = await fetch("/api/whiteboards/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          appointmentId: mode === "appointment" ? appointmentId : undefined,
          bookingId: mode === "booking" ? bookingId : undefined,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to resolve whiteboard");
      }

      const id = result?.whiteboard?.id;
      if (!id) throw new Error("Whiteboard ID was not returned");

      setDatabaseWhiteboardId(id);
      return id as string;
    } catch (error) {
      console.error("Failed to resolve whiteboard:", error);
      setSaveStatus("error");
      setWhiteboardReady(false);
      return null;
    }
  }, [mode, appointmentId, bookingId]);

  const applyBoardData = useCallback((input: unknown) => {
    const boardData = parseSavedBoardData(input);
    if (!boardData) return;

    if (Array.isArray(boardData.pages) && boardData.pages.length > 0) {
      setPages(boardData.pages);
      const nextPageIndex = Math.min(
        Math.max(boardData.currentPageIndex ?? 0, 0),
        boardData.pages.length - 1,
      );
      setCurrentPageIndex(nextPageIndex);
      historyRef.current = [structuredClone(boardData.pages)];
      redoRef.current = [];
    }

    // Keep the tutoring whiteboard on the clean reference canvas. Older
    // saved sessions may contain the previous chalkboard/line-grid settings,
    // so migrate those legacy visual settings without touching board content.
    if (mode === "booking") {
      setShowGrid(true);
      setBackgroundColor("#ffffff");
      setBackgroundImage(null);
      setGridColor("#e2e8f0");
    } else {
      if (typeof boardData.showGrid === "boolean")
        setShowGrid(boardData.showGrid);
      if (typeof boardData.backgroundColor === "string")
        setBackgroundColor(boardData.backgroundColor);
      if (typeof boardData.backgroundImage === "string")
        setBackgroundImage(boardData.backgroundImage);
      else if (boardData.backgroundImage === null) setBackgroundImage(null);
      if (typeof boardData.gridColor === "string")
        setGridColor(boardData.gridColor);
    }
    if (typeof boardData.snapToGrid === "boolean")
      setSnapToGrid(boardData.snapToGrid);
    if (typeof boardData.color === "string") setColor(boardData.color);
    if (typeof boardData.width === "number") setWidth(boardData.width);
    if (boardData.tool) setTool(boardData.tool);
    if (boardData.formulaCategory)
      setFormulaCategory(boardData.formulaCategory);

    setSelectedElementId(null);
    setSelectedElementIds([]);
  }, []);

  // localStorage is only a convenience cache. Uploaded PDFs/images can contain
  // large base64 payloads that exceed the browser's storage quota even though
  // the database save succeeds. Never let that optional cache failure break
  // whiteboard saving.
  const saveLocalBoardCache = useCallback(
    (data: unknown) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        if (error instanceof DOMException && error.name === "QuotaExceededError") {
          try {
            localStorage.removeItem(storageKey);
          } catch {
            // Ignore cache cleanup failures; the database remains authoritative.
          }
          return;
        }
        console.warn("Unable to update the whiteboard local cache:", error);
      }
    },
    [storageKey],
  );

  const saveBoard = useCallback(
    async (showFeedback = true) => {
      if (!databaseWhiteboardId || !whiteboardReady) return;

      if (showFeedback) {
        setSaveStatus("saving");
        setIsSaved(false);
      }

      const boardData = {
        version: 1,
        whiteboardId: databaseWhiteboardId,
        mode,
        appointmentId,
        bookingId,
        pages,
        currentPageIndex,
        showGrid,
        backgroundColor,
        backgroundImage,
        gridColor,
        snapToGrid,
        color,
        width,
        tool,
        formulaCategory,
        savedAt: new Date().toISOString(),
      };

      try {
        const response = await fetch(
          `/api/whiteboards/${databaseWhiteboardId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: currentPage?.name ?? "Untitled Whiteboard",
              data: boardData,
            }),
          },
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(result?.error || "Failed to save whiteboard");
        }

        saveLocalBoardCache(boardData);

        if (showFeedback) {
          setSaveStatus("saved");
          setIsSaved(true);
          window.setTimeout(() => {
            setIsSaved(false);
            setSaveStatus("idle");
          }, 2500);
        }
      } catch (error) {
        console.error("Failed to save whiteboard:", error);
        if (showFeedback) {
          setSaveStatus("error");
          setIsSaved(false);
        }
      }
    },
    [
      databaseWhiteboardId,
      whiteboardReady,
      mode,
      appointmentId,
      bookingId,
      storageKey,
      saveLocalBoardCache,
      pages,
      currentPageIndex,
      showGrid,
      backgroundColor,
      backgroundImage,
      gridColor,
      snapToGrid,
      color,
      width,
      tool,
      formulaCategory,
      currentPage,
    ],
  );

  const restoreBoard = useCallback(async () => {
    if (!databaseWhiteboardId) return;

    try {
      const response = await fetch(`/api/whiteboards/${databaseWhiteboardId}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to retrieve whiteboard");
      }

      const boardData = result?.whiteboard?.data;
      if (boardData) {
        applyBoardData(boardData);
        saveLocalBoardCache(boardData);
      }
    } catch (error) {
      console.error("Failed to restore whiteboard from database:", error);

      // Local cache is only a fallback when the database cannot be reached.
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          applyBoardData(parsed);
        }
      } catch (localError) {
        console.error("Failed to restore local whiteboard cache:", localError);
      }
    }
  }, [databaseWhiteboardId, storageKey, applyBoardData, saveLocalBoardCache]);

  // Resolve the route context into the actual Prisma Whiteboard ID.
  useEffect(() => {
    if (mode === "appointment" && !appointmentId) return;

    let cancelled = false;

    const initializeWhiteboard = async () => {
      hasLoadedBoardRef.current = false;
      realtimeReadyReportedRef.current = false;
      setWhiteboardReady(false);

      const id = await resolveWhiteboard();
      if (!id || cancelled) return;

      try {
        const response = await fetch(`/api/whiteboards/${id}`, {
          method: "GET",
          cache: "no-store",
        });
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(result?.error || "Failed to load whiteboard");
        }

        if (!cancelled) {
          const boardData = result?.whiteboard?.data;

          if (boardData) {
            applyBoardData(boardData);
            saveLocalBoardCache(boardData);
          }

          hasLoadedBoardRef.current = true;
          setWhiteboardReady(true);
        }
      } catch (error) {
        console.error("Failed to initialize whiteboard:", error);

        if (!cancelled) {
          try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              const parsed: unknown = JSON.parse(stored);
              applyBoardData(parsed);
            }
          } catch (localError) {
            console.error(
              "Failed to restore local whiteboard cache:",
              localError,
            );
          }

          hasLoadedBoardRef.current = true;
          setWhiteboardReady(true);
        }
      }
    };

    initializeWhiteboard();

    return () => {
      cancelled = true;
    };
  }, [mode, appointmentId, bookingId, resolveWhiteboard, applyBoardData, storageKey, saveLocalBoardCache]);

  const buildRealtimeData = useCallback(
    (revision = realtimeRevisionRef.current): WhiteboardRealtimeData => ({
      version: 1,
      whiteboardId: databaseWhiteboardId ?? undefined,
      mode,
      appointmentId,
      bookingId,
      pages,
      currentPageIndex,
      showGrid,
      backgroundColor,
      backgroundImage,
      gridColor,
      snapToGrid,
      color,
      width,
      tool,
      formulaCategory,
      savedAt: new Date().toISOString(),
      realtimeOriginId: realtimeOriginIdRef.current,
      realtimeRevision: revision,
    }),
    [
      databaseWhiteboardId,
      mode,
      appointmentId,
      bookingId,
      pages,
      currentPageIndex,
      showGrid,
      backgroundColor,
      backgroundImage,
      gridColor,
      snapToGrid,
      color,
      width,
      tool,
      formulaCategory,
    ],
  );

  const getRealtimeSignature = useCallback((data: WhiteboardRealtimeData) => {
    return JSON.stringify({
      whiteboardId: data.whiteboardId,
      mode: data.mode,
      appointmentId: data.appointmentId,
      bookingId: data.bookingId,
      pages: data.pages,
      currentPageIndex: data.currentPageIndex,
      showGrid: data.showGrid,
      backgroundColor: data.backgroundColor,
      backgroundImage: data.backgroundImage,
      gridColor: data.gridColor,
      snapToGrid: data.snapToGrid,
      color: data.color,
      width: data.width,
      tool: data.tool,
      formulaCategory: data.formulaCategory,
    });
  }, []);

  useEffect(() => {
    if (!remoteData || !whiteboardReady || !hasLoadedBoardRef.current) return;

    if (remoteData.realtimeOriginId === realtimeOriginIdRef.current) return;

    const remoteOrigin = remoteData.realtimeOriginId;
    const remoteRevision = remoteData.realtimeRevision;

    if (remoteOrigin && typeof remoteRevision === "number") {
      const lastRevision =
        lastRemoteRevisionByOriginRef.current.get(remoteOrigin);
      if (typeof lastRevision === "number" && remoteRevision <= lastRevision) {
        return;
      }
      lastRemoteRevisionByOriginRef.current.set(remoteOrigin, remoteRevision);
    }

    const signature = getRealtimeSignature(remoteData);
    if (signature === lastAppliedRemoteSignatureRef.current) return;

    lastAppliedRemoteSignatureRef.current = signature;
    applyBoardData(remoteData);
  }, [remoteData, whiteboardReady, applyBoardData, getRealtimeSignature]);

  useEffect(() => {
    if (!databaseWhiteboardId || !whiteboardReady || !hasLoadedBoardRef.current)
      return;

    const realtimeData = buildRealtimeData(realtimeRevisionRef.current);
    const signature = getRealtimeSignature(realtimeData);

    if (signature === lastAppliedRemoteSignatureRef.current) {
      lastAppliedRemoteSignatureRef.current = null;
      return;
    }

    realtimeRevisionRef.current += 1;
    onRealtimeChange?.(buildRealtimeData(realtimeRevisionRef.current));
  }, [
    databaseWhiteboardId,
    whiteboardReady,
    pages,
    currentPageIndex,
    showGrid,
    backgroundColor,
    backgroundImage,
    gridColor,
    snapToGrid,
    color,
    width,
    tool,
    formulaCategory,
    buildRealtimeData,
    getRealtimeSignature,
    onRealtimeChange,
  ]);

  useEffect(() => {
    if (
      !databaseWhiteboardId ||
      !whiteboardReady ||
      !hasLoadedBoardRef.current ||
      realtimeReadyReportedRef.current
    ) {
      return;
    }

    realtimeReadyReportedRef.current = true;
    onReady?.(buildRealtimeData());
  }, [databaseWhiteboardId, whiteboardReady, buildRealtimeData, onReady]);

  useEffect(() => {
    if (!databaseWhiteboardId || !whiteboardReady || !hasLoadedBoardRef.current)
      return;

    const timeout = window.setTimeout(() => {
      saveBoard(false);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [
    databaseWhiteboardId,
    whiteboardReady,
    pages,
    currentPageIndex,
    showGrid,
    backgroundColor,
    backgroundImage,
    gridColor,
    snapToGrid,
    color,
    width,
    tool,
    formulaCategory,
    saveBoard,
  ]);

  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${currentPage?.name || "math-workspace"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && rootRef.current) {
        await rootRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTeacherControls = () => {
    setShowGraphSettings(false);
    setShowCalculator(false);
    setShowToolsPanel(false);
    setShowPagesPanel(false);
    setShowColorPopup(false);
    setColorPopupTarget(null);
    setShowShapeToolsPopup(false);
    setShowFormulaMenu(false);
    setShowUploadMenu(false);
  };

  const clampTeacherControlPosition = useCallback(
    (left: number, top: number) => {
      if (typeof window === "undefined") {
        return { left, top };
      }

      const size = 52;
      const margin = 12;

      return {
        left: Math.min(
          Math.max(margin, left),
          Math.max(margin, (window.innerWidth - rightInset) - size - margin),
        ),
        top: Math.min(
          Math.max(margin, top),
          Math.max(margin, window.innerHeight - size - margin),
        ),
      };
    },
    [rightInset],
  );

  // Put the launcher in the bottom-right corner on first mount.
  useEffect(() => {
    if (teacherControlInitializedRef.current || typeof window === "undefined") {
      return;
    }

    teacherControlInitializedRef.current = true;

    const size = 52;
    const margin = 20;

    setTeacherControlPosition({
      left: Math.max(margin, (window.innerWidth - rightInset) - size - margin),
      top: Math.max(margin, window.innerHeight - size - margin),
    });
  }, []);

  // Keep a dragged launcher inside the visible board when the viewport changes.
  useEffect(() => {
    const handleResize = () => {
      setTeacherControlPosition((current) =>
        clampTeacherControlPosition(current.left, current.top),
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampTeacherControlPosition]);

  const handleTeacherControlPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();

    teacherControlDraggingRef.current = true;
    setTeacherControlDragging(true);
    teacherControlDidDragRef.current = false;
    teacherControlDragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleTeacherControlPointerMove = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (!teacherControlDraggingRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    const offset = teacherControlDragOffsetRef.current;
    const next = clampTeacherControlPosition(
      event.clientX - offset.x,
      event.clientY - offset.y,
    );

    if (
      Math.abs(next.left - teacherControlPosition.left) > 2 ||
      Math.abs(next.top - teacherControlPosition.top) > 2
    ) {
      teacherControlDidDragRef.current = true;
    }

    setTeacherControlPosition(next);
  };

  const handleTeacherControlPointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (!teacherControlDraggingRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    teacherControlDraggingRef.current = false;
    setTeacherControlDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleTeacherControlClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    // A drag should reposition the launcher without also opening/closing it.
    if (teacherControlDidDragRef.current) {
      teacherControlDidDragRef.current = false;
      return;
    }

    toggleTeacherControls();
  };

  const appendCalculator = useCallback((value: string) => {
    setCalculatorValue((current) => `${current}${value}`);
  }, []);

  const factorial = useCallback((n: number) => {
    if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n || n > 170)
      throw new Error("Invalid factorial");
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }, []);

  const runCalculator = useCallback(
    (expression = calculatorValue) => {
      if (!expression.trim()) return;
      try {
        let norm = expression
          .replace(/π/g, "Math.PI")
          .replace(/e/g, "Math.E")
          .replace(/×/g, "*")
          .replace(/÷/g, "/")
          .replace(/−/g, "-")
          .replace(/√/g, "sqrt")
          .replace(/\^/g, "**")
          .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");

        // Scientific functions. Angle mode applies to trigonometry.
        const angle = calculatorAngleMode === "DEG" ? "Math.PI/180" : "1";
        norm = norm
          .replace(/asin\(/g, `Math.asin(`)
          .replace(/acos\(/g, `Math.acos(`)
          .replace(/atan\(/g, `Math.atan(`)
          .replace(/sin\(/g, `Math.sin(`)
          .replace(/cos\(/g, `Math.cos(`)
          .replace(/tan\(/g, `Math.tan(`)
          .replace(/sqrt\(/g, `Math.sqrt(`)
          .replace(/ln\(/g, `Math.log(`)
          .replace(/log\(/g, `Math.log10(`)
          .replace(/abs\(/g, `Math.abs(`)
          .replace(/floor\(/g, `Math.floor(`)
          .replace(/ceil\(/g, `Math.ceil(`)
          .replace(/round\(/g, `Math.round(`);

        // Apply DEG/RAD conversion to trig arguments and inverse-trig results.
        if (calculatorAngleMode === "DEG") {
          norm = norm.replace(/Math\.(sin|cos|tan)\(/g, `Math.$1((`);
          norm = norm.replace(
            /Math\.(sin|cos|tan)\(\(([^()]*)\)/g,
            `Math.$1(($2)*${angle})`,
          );
          norm = norm.replace(
            /Math\.(asin|acos|atan)\(([^()]*)\)/g,
            `(Math.$1($2)/${angle})`,
          );
        }

        if (
          !/^[0-9A-Za-z_+\-*/().,%\s*]+$/.test(norm) ||
          /(constructor|prototype|window|document|globalThis|Function|eval)/i.test(
            norm,
          )
        ) {
          throw new Error("Invalid expression");
        }

        // Factorials are evaluated before the final expression.
        while (/([0-9.]+)!/.test(norm))
          norm = norm.replace(/([0-9.]+)!/g, (_, n) => `factorial(${n})`);

        const res = Function(
          "factorial",
          `"use strict"; return (${norm})`,
        )(factorial);
        const formatted =
          typeof res === "number" && Number.isFinite(res)
            ? String(Number(res.toPrecision(12)))
            : "Error";
        setCalculatorResult(formatted);
        setCalculatorHistory((history) =>
          [{ expression, result: formatted }, ...history].slice(0, 12),
        );
      } catch {
        setCalculatorResult("Error");
      }
    },
    [calculatorAngleMode, calculatorValue, factorial],
  );

  const clearCalculator = useCallback(() => {
    setCalculatorValue("");
    setCalculatorResult("");
  }, []);

  const handleCalculatorPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest("button, input, select, textarea")) return;
      const rect = event.currentTarget.getBoundingClientRect();
      calculatorDraggingRef.current = true;
      calculatorDragOffsetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const handleCalculatorPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!calculatorDraggingRef.current) return;
      const parent = event.currentTarget.parentElement?.getBoundingClientRect();
      if (!parent) return;
      const width = event.currentTarget.offsetWidth;
      const height = event.currentTarget.offsetHeight;
      const x = Math.max(
        8,
        Math.min(
          event.clientX - parent.left - calculatorDragOffsetRef.current.x,
          parent.width - width - 8,
        ),
      );
      const y = Math.max(
        8,
        Math.min(
          event.clientY - parent.top - calculatorDragOffsetRef.current.y,
          parent.height - height - 8,
        ),
      );
      setCalculatorPosition({ x, y });
    },
    [],
  );

  const handleCalculatorPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      calculatorDraggingRef.current = false;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {}
    },
    [],
  );

  const insertFormula = useCallback((val: string) => {
    setTool("equation");
    setSelectedEquation(val);
  }, []);

  const formulaSets = {
    algebra: [
      ["Quadratic formula", "x = (-b ± √(b² - 4ac)) / 2a"],
      ["Slope formula", "m = (y₂ - y₁) / (x₂ - x₁)"],
      ["Distance formula", "d = √((x₂ - x₁)² + (y₂ - y₁)²)"],
      ["Midpoint formula", "M = ((x₁ + x₂)/2, (y₁ + y₂)/2)"],
      ["Exponential growth", "A = P(1 + r)^t"],
      ["Logarithm power rule", "log(a^b) = b · log(a)"],
    ],
    geometry: [
      ["Circle area", "A = πr²"],
      ["Circumference", "C = 2πr"],
      ["Triangle area", "A = ½bh"],
      ["Pythagorean theorem", "a² + b² = c²"],
      ["Sphere volume", "V = 4/3 πr³"],
      ["Cylinder volume", "V = πr²h"],
    ],
    calculus: [
      ["Derivative definition", "f'(x) = lim(h→0) [f(x+h) - f(x)] / h"],
      ["Power rule", "d/dx [x^n] = n · x^(n-1)"],
      ["Product rule", "(fg)' = f'g + fg'"],
      ["Integration by parts", "∫ u dv = uv - ∫ v du"],
      ["Fundamental theorem", "∫_a^b f(x)dx = F(b) - F(a)"],
    ],
    trigonometry: [
      ["Sine definition", "sin(θ) = Opposite / Hypotenuse"],
      ["Cosine definition", "cos(θ) = Adjacent / Hypotenuse"],
      ["Tangent definition", "tan(θ) = Sin(θ) / Cos(θ)"],
      ["Pythagorean identity", "sin²(θ) + cos²(θ) = 1"],
      ["Law of sines", "a / sin(A) = b / sin(B) = c / sin(C)"],
      ["Law of cosines", "c² = a² + b² - 2ab cos(C)"],
    ],
    statistics: [
      ["Arithmetic mean", "μ = Σx / N"],
      ["Sample variance", "s² = Σ(x - x̄)² / (n - 1)"],
      ["Standard deviation", "σ = √(Σ(x - μ)² / N)"],
      ["Binomial probability", "P(X = k) = C(n,k) p^k (1-p)^(n-k)"],
      ["Z-score", "z = (x - μ) / σ"],
    ],
    physics: [
      ["Newton's second law", "F = ma"],
      ["Kinematic equation", "d = v₀t + ½at²"],
      ["Work energy theorem", "W = ΔKE = Fd cos(θ)"],
      ["Universal gravitation", "F = G (m₁m₂)/r²"],
      ["Ohm's Law", "V = IR"],
    ],
  };

  const toolButton = (
    name: Tool,
    label: string,
    icon: React.ReactNode,
    shortcut?: string,
  ) => {
    const active = tool === name;

    return (
      <button
        key={name}
        ref={name === "pen" ? penButtonRef : undefined}
        type="button"
        onClick={() => {
          setTool(name);
          setShowShapeToolsPopup(false);
          setShowEraserPopup(false);

          if (name === "pen") {
            if (showPenPopup) {
              setShowPenPopup(false);
            } else {
              positionPenPopup();
              setShowPenPopup(true);
            }
          } else {
            setShowPenPopup(false);
          }
        }}
        title={shortcut ? `${label} (${shortcut})` : label}
        aria-label={label}
        className={`group relative flex size-10 shrink-0 items-center justify-center rounded-xl transition-all ${
          active
            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
        }`}
      >
        {icon}

        {shortcut && (
          <span className="pointer-events-none absolute -right-1.5 -top-1 hidden rounded bg-slate-900 px-1 py-0.5 text-[7px] font-bold text-white shadow-sm 2xl:block">
            {shortcut}
          </span>
        )}

        <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-950/90 px-2 py-1 text-[9px] font-semibold text-white shadow-xl backdrop-blur-xl opacity-0 transition-opacity group-hover:opacity-100 lg:block">
          {label}
        </span>
      </button>
    );
  };

  const openToolbarTextEditor = useCallback(
    (type: "text" | "equation") => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      if (type === "equation") {
        setTool("equation");
        openLatexEditor(selectedEquation);
        setSelectedEquation("");
        return;
      }

      setTool("text");
      textPlacementArmedRef.current = true;
      openTextEditor({
        x: rect.width / 2,
        y: Math.max(120, rect.height / 2 - 120),
      }, "text", "");
    },
    [openLatexEditor, openTextEditor, selectedEquation],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (tool !== "select" || !selectedElementIds.length) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "d" &&
        selectedElementIds.length === 1
      ) {
        event.preventDefault();
        duplicateSelectedElement();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        pushHistory();
        updateCurrentPage((page) => ({
          ...page,
          elements: page.elements.filter(
            (el: WhiteboardElement) => !selectedElementIds.includes(el.id),
          ),
        }));
        setSelectedElementId(null);
        setSelectedElementIds([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    duplicateSelectedElement,
    elements,
    pushHistory,
    selectedElementId,
    selectedElementIds,
    tool,
    updateCurrentPage,
  ]);

  // Render lightweight previews for the Pages sidebar. The previews are kept
  // separate from the main canvas so opening the page manager never changes
  // the whiteboard drawing surface itself.
  useEffect(() => {
    if (!showPagesPanel) return;

    const thumbnailWidth = 254;
    const thumbnailHeight = 142;
    const boardWidth = 1200;
    const boardHeight = 800;
    const dpr = window.devicePixelRatio || 1;

    pages.forEach((page) => {
      const canvas = pageThumbnailRefs.current[page.id];
      if (!canvas) return;

      canvas.width = Math.round(thumbnailWidth * dpr);
      canvas.height = Math.round(thumbnailHeight * dpr);
      canvas.style.width = `${thumbnailWidth}px`;
      canvas.style.height = `${thumbnailHeight}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, thumbnailWidth, thumbnailHeight);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

      if (showGrid) {
        ctx.save();
        ctx.fillStyle = gridColor;
        ctx.globalAlpha = 0.35;
        const scale = Math.min(thumbnailWidth / boardWidth, thumbnailHeight / boardHeight);
        const scaledGrid = Math.max(4, gridSize * scale);
        for (let x = 0; x <= thumbnailWidth; x += scaledGrid) {
          for (let y = 0; y <= thumbnailHeight; y += scaledGrid) {
            ctx.beginPath();
            ctx.arc(x, y, 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      const scale = Math.min(thumbnailWidth / boardWidth, thumbnailHeight / boardHeight);
      const offsetX = (thumbnailWidth - boardWidth * scale) / 2;
      const offsetY = (thumbnailHeight - boardHeight * scale) / 2;

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      for (const element of page.elements) {
        if (element.type === "stroke") {
          drawStroke(ctx, element);
        } else if (element.type === "image") {
          const image = imageCacheRef.current.get(element.src);
          if (image) {
            ctx.drawImage(image, element.x, element.y, element.width, element.height);
          } else {
            ctx.save();
            ctx.fillStyle = "#e2e8f0";
            ctx.fillRect(element.x, element.y, element.width, element.height);
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 2;
            ctx.strokeRect(element.x, element.y, element.width, element.height);
            ctx.restore();
          }
        } else if (
          [
            "arrow", "line", "ellipse", "rectangle", "circle", "triangle",
            "cube", "cylinder", "diamond", "pentagon", "hexagon", "heptagon",
            "octagon", "parallelogram", "sphere", "axes",
          ].includes(element.type)
        ) {
          drawShape(ctx, element as ShapeElement);
        } else if (element.type === "text" || element.type === "equation") {
          drawText(ctx, element as TextElement);
        }
      }

      ctx.restore();
    });
  }, [
    drawShape,
    drawStroke,
    drawText,
    gridColor,
    gridSize,
    pages,
    showGrid,
    showPagesPanel,
  ]);

  const selectedElement = getSelectedElement();
  const selectedTextElement =
    selectedElement?.type === "text" ? selectedElement : null;
  const selectedEquationElement =
    selectedElement?.type === "equation" ? selectedElement : null;
  const selectedGraphElement =
    selectedElement?.type === "image" && selectedElement.name === "Desmos Graph"
      ? selectedElement
      : null;
  const selectedMediaElement =
    selectedElement?.type === "image" && selectedElement.name !== "Desmos Graph"
      ? selectedElement
      : null;
  const selectedMediaBounds = selectedMediaElement
    ? {
        left: selectedMediaElement.x,
        top: selectedMediaElement.y,
        right: selectedMediaElement.x + selectedMediaElement.width,
        bottom: selectedMediaElement.y + selectedMediaElement.height,
      }
    : null;
  const selectedGraphBounds = selectedGraphElement
    ? {
        left: selectedGraphElement.x,
        top: selectedGraphElement.y,
        right: selectedGraphElement.x + selectedGraphElement.width,
        bottom: selectedGraphElement.y + selectedGraphElement.height,
      }
    : null;

  // Equation bounds are derived directly from the selected element. This keeps
  // render pure: getElementBounds has a context-free equation-metrics fallback,
  // so we do not need to read contextRef.current or set state from an effect.
  const selectedEquationBounds = selectedEquationElement
    ? getElementBounds(selectedEquationElement)
    : null;

  return (
    <main
      ref={rootRef}
      className="fixed inset-y-0 left-0 z-[700] flex flex-col overflow-hidden bg-slate-50 text-slate-900 antialiased"
      style={{
        right: `${Math.max(0, rightInset)}px`,
      }}
    >
      {showTeacherControls && cropEditor.open && (
        <div
          className="fixed inset-0 z-[1050] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crop-image-title"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setCropEditor((previous) => ({ ...previous, open: false, elementId: null }));
            }
          }}
        >
          <div
            className="w-[min(720px,calc(100vw-32px))] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="crop-image-title" className="text-base font-bold text-slate-900">
                Crop image
              </h2>
              <button
                type="button"
                onClick={() =>
                  setCropEditor((previous) => ({ ...previous, open: false, elementId: null }))
                }
                className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close crop editor"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
              {cropEditor.elementId && (() => {
                const target = elements.find(
                  (element): element is ImageElement =>
                    element.id === cropEditor.elementId && element.type === "image",
                );
                return target ? (
                  <img
                    src={target.src}
                    alt={target.name ?? "Image to crop"}
                    className="mx-auto max-h-[420px] max-w-full object-contain"
                  />
                ) : null;
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              {[
                ["Left", "left"],
                ["Top", "top"],
                ["Right", "right"],
                ["Bottom", "bottom"],
              ].map(([label, key]) => (
                <label key={key} className="flex flex-col gap-2">
                  <span>{label}: {cropEditor[key as "left" | "top" | "right" | "bottom"]}%</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={cropEditor[key as "left" | "top" | "right" | "bottom"]}
                    onChange={(event) =>
                      setCropEditor((previous) => ({
                        ...previous,
                        [key]: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setCropEditor((previous) => ({ ...previous, open: false, elementId: null }))
                }
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={cropSelectedImage}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Apply crop
              </button>
            </div>
          </div>
        </div>
      )}

      {showTeacherControls && showGraphEditor && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-graph-title"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowGraphEditor(false);
              graphEditingElementIdRef.current = null;
            }
          }}
        >
          <div
            className="flex h-[min(784px,calc(100vh-32px))] w-[min(775px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 px-5">
              <h2
                id="create-graph-title"
                className="text-[18px] font-bold tracking-tight text-slate-800"
              >
                Create Graph
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowGraphEditor(false);
                  graphEditingElementIdRef.current = null;
                }}
                title="Close"
                aria-label="Close graph editor"
                className="flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 px-6 py-9">
              {graphLoadError ? (
                <div className="flex h-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-6 text-center text-sm font-semibold text-red-700">
                  {graphLoadError}
                </div>
              ) : (
                <div
                  ref={graphContainerRef}
                  className="h-full w-full overflow-hidden bg-white"
                />
              )}
            </div>

            <div className="flex h-[66px] shrink-0 items-center justify-end gap-3 border-t border-slate-200 px-6">
              <button
                type="button"
                onClick={() => {
                  setShowGraphEditor(false);
                  graphEditingElementIdRef.current = null;
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Close
              </button>
              <button
                type="button"
                onClick={insertGraphFromDesmos}
                className="rounded-xl bg-[#3f8062] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#356f55]"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {showTeacherControls && showGraphSettings && (
        <div
          className="absolute z-[290] w-80 max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xl shadow-slate-950/15 backdrop-blur-2xl"
          style={{
            left: getPopupPosition("graph", {
              x: Math.max(12, (window.innerWidth - rightInset) - 420),
              y: Math.max(80, window.innerHeight / 2 - 220),
            }).x,
            top: getPopupPosition("graph", {
              x: 0,
              y: Math.max(80, window.innerHeight / 2 - 220),
            }).y,
          }}
          onPointerMove={movePopupDrag}
          onPointerUp={endPopupDrag}
        >
          <div
            className="mb-3 flex cursor-move items-center justify-between select-none"
            onPointerDown={(event) => startPopupDrag("graph", event)}
          >
            <h3 className="text-sm font-bold text-slate-900">
              Background & Grid Settings
            </h3>
            <button
              onClick={() => setShowGraphSettings(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
              Enable Grid Lines
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="size-4 accent-blue-600"
              />
            </label>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Background Color
              </label>
              <select
                value={backgroundColor}
                onChange={(e) => {
                  setBackgroundColor(e.target.value);
                  setBackgroundImage(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
              >
                {BACKGROUND_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="mt-2 grid grid-cols-6 gap-1.5">
                {BACKGROUND_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setBackgroundColor(opt.value);
                      setBackgroundImage(null);
                    }}
                    className={`h-6 w-full rounded-md border ${backgroundColor === opt.value && !backgroundImage ? "border-blue-600 ring-2 ring-blue-500/20" : "border-slate-200"}`}
                    style={{ backgroundColor: opt.value }}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Background Image
              </label>
              <select
                value={backgroundImage ?? ""}
                onChange={(e) => {
                  setBackgroundImage(e.target.value || null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
              >
                <option value="">No Image — Use Background Color</option>
                {BACKGROUND_IMAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="mt-2 grid grid-cols-2 gap-2">
                {BACKGROUND_IMAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBackgroundImage(opt.value)}
                    className={`group relative h-16 overflow-hidden rounded-lg border transition ${
                      backgroundImage === opt.value
                        ? "border-blue-600 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-400"
                    }`}
                    title={opt.label}
                    aria-label={`Use ${opt.label} background`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={opt.value}
                      alt={opt.label}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[9px] font-bold text-white">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Grid Line Color
              </label>
              <select
                value={gridColor}
                onChange={(e) => setGridColor(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold"
              >
                {GRID_COLOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {GRID_COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGridColor(opt.value)}
                    className={`h-6 w-full rounded-md border ${gridColor === opt.value ? "border-blue-600 ring-2 ring-blue-500/20" : "border-slate-200"}`}
                    style={{ backgroundColor: opt.value }}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
              Snap to Grid
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                className="size-4 accent-blue-600"
              />
            </label>
          </div>
        </div>
      )}

      {showTeacherControls && showCalculator && (
        <div className="absolute inset-0 z-[500] pointer-events-none">
          <div
            className="pointer-events-auto absolute w-[min(430px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-slate-200/80 bg-white/98 shadow-2xl shadow-slate-950/25 backdrop-blur-2xl"
            style={{
              left: calculatorPosition.x || undefined,
              top: calculatorPosition.y || undefined,
              right: calculatorPosition.x ? undefined : "360px",
              bottom: calculatorPosition.y ? undefined : "96px",
            }}
            onPointerDown={handleCalculatorPointerDown}
            onPointerMove={handleCalculatorPointerMove}
            onPointerUp={handleCalculatorPointerUp}
          >
            <div className="flex cursor-move items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-3 select-none">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Scientific Calculator
                </h3>
                <p className="text-[10px] text-slate-500">
                  Drag the header to move • {calculatorAngleMode} mode
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setCalculatorAngleMode((m) => (m === "DEG" ? "RAD" : "DEG"))
                  }
                  className="rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-300"
                >
                  {calculatorAngleMode}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCalculator(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="p-3">
              <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-950 px-3 py-3 text-right">
                <input
                  value={calculatorValue}
                  onChange={(e) => setCalculatorValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runCalculator();
                    if (e.key === "Escape") clearCalculator();
                  }}
                  placeholder="0"
                  className="w-full bg-transparent text-right font-mono text-lg text-white outline-none placeholder:text-slate-500"
                />
                <div className="min-h-7 pt-1 font-mono text-2xl font-bold text-blue-300">
                  {calculatorResult || "0"}
                </div>
              </div>

              <div className="mb-2 grid grid-cols-4 gap-1.5">
                {[
                  {
                    label: "MC",
                    action: () => setCalculatorMemory(0),
                  },
                  {
                    label: "MR",
                    action: () =>
                      setCalculatorValue(
                        (value) => `${value}${calculatorMemory}`,
                      ),
                  },
                  {
                    label: "M+",
                    action: () =>
                      setCalculatorMemory(
                        (memory) => memory + (Number(calculatorResult) || 0),
                      ),
                  },
                  {
                    label: "M−",
                    action: () =>
                      setCalculatorMemory(
                        (memory) => memory - (Number(calculatorResult) || 0),
                      ),
                  },
                ].map((button) => (
                  <button
                    key={button.label}
                    type="button"
                    onClick={button.action}
                    className="rounded-xl bg-slate-100 px-2 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
                  >
                    {button.label}
                  </button>
                ))}
              </div>

              <div className="mb-2 grid grid-cols-4 gap-1.5">
                {[
                  ["sin", "sin("],
                  ["cos", "cos("],
                  ["tan", "tan("],
                  ["√", "√("],
                  ["sin⁻¹", "asin("],
                  ["cos⁻¹", "acos("],
                  ["tan⁻¹", "atan("],
                  ["x²", "^2"],
                  ["ln", "ln("],
                  ["log", "log("],
                  ["π", "π"],
                  ["e", "e"],
                ].map(([label, value]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => appendCalculator(value)}
                    className="rounded-xl bg-blue-50 px-2 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  ["7", "7"],
                  ["8", "8"],
                  ["9", "9"],
                  ["÷", "/"],
                  ["4", "4"],
                  ["5", "5"],
                  ["6", "6"],
                  ["×", "*"],
                  ["1", "1"],
                  ["2", "2"],
                  ["3", "3"],
                  ["−", "-"],
                  ["0", "0"],
                  [".", "."],
                  ["(", "("],
                  ["+", "+"],
                  ["%", "%"],
                  ["xʸ", "^"],
                  ["!", "!"],
                  ["⌫", "BACK"],
                ].map(([label, value]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      value === "BACK"
                        ? setCalculatorValue((v) => v.slice(0, -1))
                        : appendCalculator(value)
                    }
                    className="rounded-xl bg-slate-100 px-2 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-200"
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearCalculator}
                  className="rounded-xl bg-rose-50 px-2 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-100"
                >
                  AC
                </button>
                <button
                  type="button"
                  onClick={() => runCalculator()}
                  className="col-span-2 rounded-xl bg-blue-600 px-2 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                >
                  =
                </button>
              </div>

              {calculatorHistory.length > 0 && (
                <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50">
                  <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-slate-600">
                    History ({calculatorHistory.length})
                  </summary>
                  <div className="max-h-32 overflow-auto border-t border-slate-200">
                    {calculatorHistory.map((item, index) => (
                      <button
                        key={`${item.expression}-${index}`}
                        type="button"
                        onClick={() => setCalculatorValue(item.expression)}
                        className="block w-full border-b border-slate-100 px-3 py-2 text-left hover:bg-white"
                      >
                        <div className="truncate font-mono text-[10px] text-slate-500">
                          {item.expression}
                        </div>
                        <div className="font-mono text-xs font-bold text-slate-800">
                          = {item.result}
                        </div>
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {latexEditor.open && (
        <div
          className="absolute inset-0 z-[700] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="latex-editor-title"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setLatexEditor((previous) => ({
                ...previous,
                open: false,
                text: "",
                editingElementId: null,
              }));
              setSelectedEquation("");
              setActiveTextPanel(null);
              setShowTextFormattingColors(false);
              textPlacementArmedRef.current = false;
              setTool("select");
            }
          }}
        >
          <div
            data-latex-editor
            className="w-[min(780px,calc(100vw-32px))] overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-2xl"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5">
              <h2 id="latex-editor-title" className="text-xl font-extrabold tracking-[-0.02em] text-slate-900">
                LaTeX formula editor
              </h2>
              <button
                type="button"
                onClick={() => {
                  setLatexEditor((previous) => ({
                    ...previous,
                    open: false,
                    text: "",
                    editingElementId: null,
                  }));
                  setSelectedEquation("");
                  setActiveTextPanel(null);
                  setShowTextFormattingColors(false);
                  textPlacementArmedRef.current = false;
                  setTool("select");
                }}
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close LaTeX formula editor"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <textarea
                  ref={latexInputRef}
                  value={latexEditor.text}
                  onChange={(event) =>
                    setLatexEditor((previous) => ({ ...previous, text: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                      event.preventDefault();
                      addLatexElement();
                    }
                  }}
                  placeholder="Type LaTeX code here, e.g. \delta"
                  className="h-[150px] resize-none rounded-[12px] border border-slate-200 bg-[#e8edf5] px-5 py-4 font-mono text-lg leading-6 text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300"
                />
                <div className="h-[150px] rounded-[12px] border border-slate-300 bg-white p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                  <div className="text-sm text-slate-400">Preview</div>
                  <div className="flex h-[105px] items-center justify-center overflow-hidden text-center text-4xl text-slate-950">
                    {latexEditor.text.trim()
                      ? renderLatexPreview(latexEditor.text, latexEditor.color)
                      : null}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <span>Get familiar</span>
                <button
                  type="button"
                  onClick={() => setLatexTab("All")}
                  className="font-semibold text-emerald-600 underline underline-offset-2"
                >
                  with the commands.
                </button>
                <span className="ml-2">Check popular</span>
                <button
                  type="button"
                  onClick={() => {
                    setLatexEditor((previous) => ({
                      ...previous,
                      text: "\\frac{1}{3}",
                    }));
                    setLatexTab("All");
                    requestAnimationFrame(() => latexInputRef.current?.focus());
                  }}
                  className="font-semibold text-emerald-600 underline underline-offset-2"
                >
                  equation examples
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                {LATEX_EDITOR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setLatexEditor((previous) => ({ ...previous, color: c }))}
                    className={`flex size-8 items-center justify-center rounded-full ${latexEditor.color === c ? "ring-2 ring-slate-500 ring-offset-2" : ""}`}
                    aria-label={`Formula color ${c}`}
                  >
                    <span className="size-7 rounded-full border border-slate-200" style={{ backgroundColor: c }} />
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2">
                {(["All", "Math", "Arrow", "Letter"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setLatexTab(tab)}
                    className={`rounded-[12px] border px-4 py-2 text-sm font-semibold transition ${latexTab === tab ? "border-transparent bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid max-h-[270px] grid-cols-10 gap-2 overflow-y-auto pr-1">
                {LATEX_SYMBOLS
                  .filter(([label]) => {
                    if (latexTab === "Letter") return LATEX_LETTER_LABELS.has(label);
                    if (latexTab === "Arrow") return LATEX_ARROW_LABELS.has(label);
                    if (latexTab === "Math") {
                      return !LATEX_LETTER_LABELS.has(label) && !LATEX_ARROW_LABELS.has(label);
                    }
                    return true;
                  })
                  .map(([label, value]) => (
                    <button
                      key={`${label}-${value}`}
                      type="button"
                      onClick={() => insertLatexModalAtCursor(value)}
                      className="flex h-9 items-center justify-center rounded-[6px] border border-slate-200 bg-white text-base text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                      title={`Insert ${value.trim()}`}
                    >
                      {label}
                    </button>
                  ))}
              </div>

              <div className="mt-4 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                  setLatexEditor((previous) => ({
                    ...previous,
                    open: false,
                    text: "",
                    editingElementId: null,
                  }));
                  setSelectedEquation("");
                  setActiveTextPanel(null);
                  setShowTextFormattingColors(false);
                  textPlacementArmedRef.current = false;
                  setTool("select");
                }}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addLatexElement}
                  disabled={!latexEditor.text.trim()}
                  className="rounded-[12px] bg-emerald-600 px-7 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {textEditor.open && textEditor.type === "text" && (
        <textarea
          ref={textInputRef}
          value={textEditor.text}
          onChange={(event) =>
            setTextEditor((previous) => ({
              ...previous,
              text: event.target.value,
            }))
          }
          onKeyDown={handleTextEditorKeyDown}
          onBlur={addTextElement}
          onPointerDown={(event) => event.stopPropagation()}
          autoFocus
          rows={1}
          spellCheck
          aria-label="Text on whiteboard"
          placeholder=""
          data-text-editor-ui
          className="absolute z-[360] min-h-[28px] min-w-[24px] resize-none overflow-hidden border border-dashed border-blue-500 bg-white/5 p-0 text-left outline-none ring-0 placeholder:text-transparent"
          style={{
            left: textEditor.x + panOffset.x,
            top: textEditor.y + panOffset.y,
            width: Math.max(
              40,
              Math.min(2000, 32 + textEditor.text.length * textEditor.fontSize * 0.55),
            ),
            minHeight: Math.max(28, textEditor.fontSize + 8),
            fontSize: textEditor.fontSize,
            lineHeight: 1.2,
            color: textEditor.color,
            fontWeight: textEditor.bold ? 700 : 400,
            fontStyle: textEditor.italic ? "italic" : "normal",
            textDecoration: textEditor.underline ? "underline" : "none",
          }}
        />
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={importImage}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={importPdf}
      />

      {/* Full-screen drawing workspace */}
      <div className="absolute inset-x-0 bottom-0 top-0">
        <section
          ref={containerRef}
          className="absolute inset-0 overflow-hidden"
        >
          <div
            className="relative h-full w-full overflow-hidden"
            style={{ backgroundColor }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full touch-none select-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onDoubleClick={handleCanvasDoubleClick}
              onContextMenu={handleCanvasContextMenu}
              style={{
                cursor:
                  tool === "hand"
                    ? "grab"
                    : tool === "select"
                      ? "default"
                      : "crosshair",
              }}
            />
          </div>
        </section>

        {/* LiveBoard-style top toolbar */}
        <header className="pointer-events-auto absolute inset-x-0 top-0 z-[450] flex h-14 items-center border-b border-slate-200 bg-white/95 px-2 shadow-sm backdrop-blur-xl">
          <div className="flex min-w-0 shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => onClose?.()}
              title="Close whiteboard"
              aria-label="Close whiteboard and return to the tutoring session"
              className="flex size-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <Home className="size-5" />
            </button>

            <button
              type="button"
              title="Whiteboard help"
              aria-label="Whiteboard help"
              onClick={() =>
                window.alert(
                  "Whiteboard shortcuts: V select, P pen, E eraser, L line, R rectangle, C circle, T text, Q equation. Use the toolbar to add pages and tools.",
                )
              }
              className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <CircleHelp className="size-5" />
            </button>

            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={currentPageIndex === 0}
              title="Previous page"
              aria-label="Previous page"
              className="flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowPagesPanel((value) => !value)}
              title="Pages"
              aria-label="Open pages"
              className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-2.5 text-xs font-semibold transition ${
                showPagesPanel
                  ? "bg-slate-100 text-slate-950"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>Pages</span>
              <span className="font-bold">
                {currentPageIndex + 1}/{pages.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentPageIndex < pages.length - 1) {
                  setCurrentPageIndex((index) => index + 1);
                  setSelectedElementId(null);
                  setSelectedElementIds([]);
                  return;
                }

                addPage();
              }}
              title={
                currentPageIndex < pages.length - 1
                  ? "Next page"
                  : "Add another whiteboard"
              }
              aria-label={
                currentPageIndex < pages.length - 1
                  ? "Next page"
                  : "Add another whiteboard page"
              }
              className="flex size-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {currentPageIndex < pages.length - 1 ? (
                <ChevronRight className="size-5" />
              ) : (
                <Plus className="size-5" />
              )}
            </button>
          </div>

          <div className="mx-auto flex min-w-0 items-center justify-center gap-0.5 overflow-x-auto px-2 scrollbar-none">
            {toolButton(
              "select",
              "Select / move",
              <MousePointer2 className="size-4" />,
              "V",
            )}

            <button
              type="button"
              onClick={() => setTool("hand")}
              title="Hand / pan (H)"
              aria-label="Hand / pan"
              className={`group relative flex size-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                tool === "hand"
                  ? "bg-slate-100 text-slate-950"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Hand className="size-4" />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-[9px] font-semibold text-white shadow-xl lg:block">
                Hand / pan
              </span>
            </button>

            {toolButton(
              "pen",
              "Pen / marker",
              <PenLine className="size-4" />,
              "P",
            )}

            <button
              ref={shapeToolsButtonRef}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowUploadMenu(false);
                setShowFormulaMenu(false);
                setShowShapeToolsPopup((value) => !value);
              }}
              title="Shapes"
              aria-label="Shapes"
              aria-expanded={showShapeToolsPopup}
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
                showShapeToolsPopup
                  ? "bg-slate-100 text-slate-950"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Shapes className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowShapeToolsPopup(false);
                setShowFormulaMenu(false);
                setShowUploadMenu(false);
                setTool("text");
                textPlacementArmedRef.current = true;
                setActiveTextPanel(null);
              }}
              title="Text"
              aria-label="Add text"
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
                tool === "text"
                  ? "bg-slate-100 text-slate-950"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Type className="size-4" />
            </button>

            <button
              ref={formulaToolsButtonRef}
              type="button"
              onClick={() => {
                setShowShapeToolsPopup(false);
                setShowUploadMenu(false);

                const button = formulaToolsButtonRef.current;
                if (button) {
                  const rect = button.getBoundingClientRect();
                  setFormulaMenuPosition({
                    top: rect.bottom + 8,
                    left: rect.left + rect.width / 2,
                  });
                }

                setShowFormulaMenu((value) => !value);
              }}
              title="Formula"
              aria-label="Formula"
              aria-expanded={showFormulaMenu}
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
                showFormulaMenu || tool === "equation"
                  ? "bg-slate-100 text-slate-950"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Sigma className="size-4" />
            </button>

            <div className="relative shrink-0">
              <button
                ref={eraserButtonRef}
                type="button"
                onClick={() => {
                  setShowShapeToolsPopup(false);
                  setShowFormulaMenu(false);
                  setShowUploadMenu(false);
                  setShowPenPopup(false);
                  setTool("eraser");

                  const button = eraserButtonRef.current;
                  if (button) {
                    const rect = button.getBoundingClientRect();
                    const popupWidth = 252;
                    const popupHeight = 156;
                    const gap = 8;
                    let left = rect.left + rect.width / 2 - popupWidth / 2;
                    let top = rect.bottom + gap;

                    left = Math.max(12, Math.min(left, window.innerWidth - popupWidth - 12));

                    if (top + popupHeight > window.innerHeight - 12) {
                      top = Math.max(12, rect.top - popupHeight - gap);
                    }

                    setEraserPopupPosition({ top, left });
                  }

                  setShowEraserPopup((value) => !value);
                }}
                title="Eraser (E)"
                aria-label="Eraser"
                aria-expanded={showEraserPopup}
                className={`group relative flex size-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                  tool === "eraser" || showEraserPopup
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Eraser className="size-4" />
                <span className="pointer-events-none absolute -right-1.5 -top-1 hidden rounded bg-slate-900 px-1 py-0.5 text-[7px] font-bold text-white shadow-sm 2xl:block">
                  E
                </span>
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-950/90 px-2 py-1 text-[9px] font-semibold text-white shadow-xl backdrop-blur-xl opacity-0 transition-opacity group-hover:opacity-100 lg:block">
                  Eraser
                </span>
              </button>

              {showEraserPopup && (
                <div
                  ref={eraserPopupRef}
                  className="fixed z-[700] w-[252px] rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-2xl shadow-slate-900/15"
                  style={{
                    top: eraserPopupPosition.top,
                    left: eraserPopupPosition.left,
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  role="dialog"
                  aria-label="Eraser settings"
                >
                  <div className="flex items-center justify-center gap-4">
                    {[
                      { value: 8, visual: 2 },
                      { value: 16, visual: 3 },
                      { value: 24, visual: 5 },
                      { value: 32, visual: 7 },
                      { value: 40, visual: 9 },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setEraserWidth(option.value);
                          setTool("eraser");
                        }}
                        title={`Eraser size ${option.value}px`}
                        aria-label={`Eraser size ${option.value}px`}
                        className={`flex h-10 w-9 items-center justify-center rounded-full transition ${
                          eraserWidth === option.value
                            ? "bg-slate-100 ring-1 ring-slate-300"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className="block w-6 rounded-full bg-slate-700"
                          style={{ height: `${option.visual}px` }}
                        />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      pushHistory();
                      updateCurrentPage((page) => ({
                        ...page,
                        elements: page.elements.filter(
                          (element) => element.type !== "stroke",
                        ),
                      }));
                      setSelectedElementId((currentId) => {
                        const selected = currentPage?.elements.find(
                          (element) => element.id === currentId,
                        );
                        return selected?.type === "stroke" ? null : currentId;
                      });
                      setSelectedElementIds((currentIds) =>
                        currentIds.filter((id) => {
                          const selected = currentPage?.elements.find(
                            (element) => element.id === id,
                          );
                          return selected?.type !== "stroke";
                        }),
                      );
                      setShowEraserPopup(false);
                    }}
                    className="mx-auto mt-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50"
                  >
                    <Trash2 className="size-4" />
                    Erase all
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                ref={uploadButtonRef}
                type="button"
                onClick={() => {
                  setShowShapeToolsPopup(false);
                  setShowFormulaMenu(false);
                  setShowEraserPopup(false);

                  const button = uploadButtonRef.current;
                  if (button) {
                    const rect = button.getBoundingClientRect();
                    const popupWidth = 176;
                    const popupHeight = 94;
                    const gap = 8;
                    let left = rect.left + rect.width / 2 - popupWidth / 2;
                    let top = rect.bottom + gap;

                    left = Math.max(12, Math.min(left, window.innerWidth - popupWidth - 12));
                    if (top + popupHeight > window.innerHeight - 12) {
                      top = Math.max(12, rect.top - popupHeight - gap);
                    }

                    setUploadMenuPosition({ top, left });
                  }

                  setShowUploadMenu((value) => !value);
                }}
                title="Upload files"
                aria-label="Upload files"
                aria-expanded={showUploadMenu}
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
                  showUploadMenu
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Upload className="size-4" />
              </button>

              {showUploadMenu && (
                <div
                  className="fixed z-[700] w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-2xl shadow-slate-900/15"
                  style={{
                    top: uploadMenuPosition.top,
                    left: uploadMenuPosition.left,
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  role="menu"
                  aria-label="Upload files"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadMenu(false);
                      imageInputRef.current?.click();
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ImageIcon className="size-4 text-slate-500" />
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadMenu(false);
                      pdfInputRef.current?.click();
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Upload className="size-4 text-slate-500" />
                    PDF
                  </button>
                </div>
              )}
            </div>

            <div className="mx-1 h-7 w-px shrink-0 bg-slate-200" />

            <button
              type="button"
              onClick={undo}
              title="Undo"
              aria-label="Undo"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Undo2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              title="Redo"
              aria-label="Redo"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Redo2 className="size-4" />
            </button>
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-1">
            <div className="hidden max-w-44 truncate px-2 text-sm font-semibold text-slate-800 lg:block">
              {currentPage?.name ?? "Untitled board"}
            </div>
            <button
              type="button"
              onClick={() => setShowGraphSettings((value) => !value)}
              title="Settings"
              aria-label="Whiteboard settings"
              className={`flex size-10 items-center justify-center rounded-xl transition ${
                showGraphSettings
                  ? "bg-slate-100 text-slate-950"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Settings2 className="size-4" />
            </button>
          </div>
        </header>

        {showFormulaMenu && (
          <div
            data-formula-menu
            className="fixed z-[900] w-40 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-2xl"
            style={{
              top: formulaMenuPosition.top,
              left: formulaMenuPosition.left,
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setShowFormulaMenu(false);
                setTool("equation");
                openLatexEditor("");
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Sigma className="size-4 text-slate-500" />
              LaTeX
            </button>
            <button
              type="button"
              onClick={() => {
                setShowFormulaMenu(false);
                setShowGraphSettings(false);
                setGraphLoadError(null);
                setShowGraphEditor(true);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FunctionSquare className="size-4 text-slate-500" />
              Graph Editor
            </button>
          </div>
        )}

        {/* Shapes & math tools popup */}
        {showShapeToolsPopup && (
          <div
            className="absolute z-[520] w-[min(390px,calc(100vw-20px))] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
            style={{
              left: "50%",
              top: "64px",
              transform: "translateX(-50%)",
            }}
            onPointerDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="Shapes and math tools"
          >
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-xs font-extrabold text-slate-900">
                  Shapes & Math Tools
                </div>
                <div className="text-[9px] text-slate-500">
                  Select a tool to use on the board
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShapeToolsPopup(false)}
                className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close shapes and math tools"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {([
                ["arrow", "Arrow"], ["line", "Line"], ["ellipse", "Ellipse"], ["circle", "Circle"], ["rectangle", "Rectangle"],
                ["triangle", "Triangle"], ["cube", "Cube"], ["cylinder", "Cylinder"], ["diamond", "Diamond"], ["pentagon", "Pentagon"],
                ["hexagon", "Hexagon"], ["heptagon", "Heptagon"], ["octagon", "Octagon"], ["parallelogram", "Parallelogram"], ["sphere", "Sphere"],
              ] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => { setTool(value); setShowShapeToolsPopup(false); }} title={label} aria-label={label} className={`flex h-10 items-center justify-center rounded-xl transition ${tool === value ? "bg-slate-100 text-slate-950" : "text-slate-600 hover:bg-slate-50"}`}>
                  <ShapeToolIcon shape={value} />
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1.5 border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTool("eraser");
                  setShowShapeToolsPopup(false);
                  setShowEraserPopup(true);
                }}
                title="Eraser"
                aria-label="Eraser"
                className="flex h-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-50"
              >
                <Eraser className="size-4" />
              </button>
              {toolButton("ruler", "Ruler", <Ruler className="size-4" />, "U")}
              {toolButton("axes", "Coordinate Axes", <Crosshair className="size-4" />, "A")}
              {toolButton("equation", "Equation", <Sigma className="size-4" />, "Q")}
              {toolButton("text", "Text", <Type className="size-4" />, "T")}
            </div>
          </div>
        )}

        {/* Full page thumbnail sidebar */}
        {showTeacherControls && showPagesPanel && (
          <aside
            className="absolute inset-y-0 left-0 z-[560] w-[324px] border-r border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
            aria-label="Whiteboard pages"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={addPage}
                  title="Add page"
                  aria-label="Add page"
                  className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Plus className="size-5" />
                </button>
                <div className="text-sm font-bold text-slate-700">
                  Pages({pages.length})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPagesPanel(false)}
                title="Close pages"
                aria-label="Close pages"
                className="flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="h-[calc(100%-56px)] overflow-y-auto bg-slate-50 px-4 py-5">
              <div className="flex flex-col gap-3">
                {pages.map((page, index) => {
                  const isActive = currentPageIndex === index;
                  return (
                    <div key={page.id} className="flex items-center gap-2">
                      <div className="flex w-4 shrink-0 items-center justify-center text-slate-500">
                        <span className="text-lg leading-none">=</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPageIndex(index);
                          setSelectedElementId(null);
                          setSelectedElementIds([]);
                        }}
                        title={`Open ${page.name}`}
                        className={`relative block h-[143px] w-[254px] shrink-0 overflow-hidden rounded-[4px] border bg-white shadow-sm transition ${
                          isActive
                            ? "border-emerald-600 ring-1 ring-emerald-600/20"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <canvas
                          ref={(node) => {
                            pageThumbnailRefs.current[page.id] = node;
                          }}
                          className="block h-[142px] w-[254px]"
                          aria-label={`${page.name} thumbnail`}
                        />
                        <span className="absolute right-1.5 top-1.5 flex min-w-6 items-center justify-center rounded-md bg-slate-200/90 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          {index + 1}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* Floating pen palette — teacher only */}
        {showTeacherControls && showPenPopup && (
          <div
            ref={penPopupRef}
            className="absolute z-[320] w-[344px] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl shadow-slate-900/15"
            style={{
              top: penPopupPosition.top,
              left: penPopupPosition.left,
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setPenStyle("pen")}
                aria-label="Pen"
                title="Pen"
                className={`flex size-10 items-center justify-center rounded-xl transition ${
                  penStyle === "pen"
                    ? "bg-slate-100 text-slate-800"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <PenLine className="size-5" style={{ strokeWidth: 2 }} />
              </button>

              <button
                type="button"
                onClick={() => setPenStyle("marker")}
                aria-label="Marker"
                title="Marker"
                className={`flex size-10 items-center justify-center rounded-xl transition ${
                  penStyle === "marker"
                    ? "bg-slate-100 text-slate-800"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <PenLine className="size-5" style={{ strokeWidth: 4 }} />
              </button>
            </div>

            <div className="my-4 h-px bg-slate-200" />

            <div className="flex items-center justify-center gap-4">
              {PEN_POPUP_COLORS.map((penColor) => (
                <button
                  key={penColor}
                  type="button"
                  onClick={() => setColor(penColor)}
                  title={`Pen color ${penColor}`}
                  aria-label={`Pen color ${penColor}`}
                  className={`flex size-9 items-center justify-center rounded-full transition ${
                    color === penColor
                      ? "ring-2 ring-slate-400 ring-offset-2"
                      : ""
                  }`}
                >
                  <span
                    className="size-7 rounded-full border border-slate-200"
                    style={{ backgroundColor: penColor }}
                  />
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-center gap-5">
              {PEN_SIZE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setWidth(option.value)}
                  title={`Pen size ${option.value}px`}
                  aria-label={`Pen size ${option.value}px`}
                  className={`flex size-9 items-center justify-center rounded-full transition ${
                    width === option.value
                      ? "bg-slate-100 ring-1 ring-slate-300"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className="block rounded-full bg-slate-700"
                    style={{
                      width: `${Math.min(option.width + 8, 22)}px`,
                      height: `${option.width}px`,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {showTeacherControls &&
          tool === "select" &&
          selectedMediaElement &&
          selectedMediaBounds && (
            <div
              data-media-selection-toolbar
              className="absolute z-[430] flex items-center gap-1 rounded-xl border border-slate-200 bg-white/98 p-1.5 shadow-xl shadow-slate-900/15 backdrop-blur-xl"
              style={{
                left: Math.max(12, Math.min(
                  selectedMediaBounds.left,
                  window.innerWidth - rightInset - 190,
                )),
                top: Math.max(60, selectedMediaBounds.top - 58),
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <button
                type="button"
                onClick={duplicateSelectedElement}
                className="flex size-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
                title="Copy"
                aria-label="Copy"
              >
                <Copy className="size-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCropEditor({
                    open: true,
                    elementId: selectedMediaElement.id,
                    left: 5,
                    top: 5,
                    right: 95,
                    bottom: 95,
                  })
                }
                className="flex size-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
                title="Crop"
                aria-label="Crop"
              >
                <Crop className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  pushHistory();
                  updateCurrentPage((page) => ({
                    ...page,
                    elements: page.elements.filter(
                      (element) => element.id !== selectedMediaElement.id,
                    ),
                  }));
                  setSelectedElementId(null);
                  setSelectedElementIds([]);
                }}
                className="flex size-9 items-center justify-center rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-600"
                title="Delete"
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}

        {showTeacherControls &&
          tool === "select" &&
          selectedGraphElement &&
          selectedGraphBounds && (
            <div
              data-graph-selection-toolbar
              className="absolute z-[430] flex items-center gap-1 rounded-xl border border-slate-200 bg-white/98 p-1.5 shadow-xl shadow-slate-900/15 backdrop-blur-xl"
              style={{
                left: Math.max(12, Math.min(
                  selectedGraphBounds.left,
                  window.innerWidth - rightInset - 130,
                )),
                top: Math.max(60, selectedGraphBounds.top - 58),
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <button
                type="button"
                onClick={() => {
                  graphEditingElementIdRef.current = selectedGraphElement.id;
                  setGraphLoadError(null);
                  setShowGraphEditor(true);
                }}
                className="flex size-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
                title="Edit graph"
                aria-label="Edit graph"
              >
                <PenLine className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  pushHistory();
                  updateCurrentPage((page) => ({
                    ...page,
                    elements: page.elements.filter(
                      (element) => element.id !== selectedGraphElement.id,
                    ),
                  }));
                  setSelectedElementId(null);
                  setSelectedElementIds([]);
                }}
                className="flex size-9 items-center justify-center rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-600"
                title="Delete graph"
                aria-label="Delete graph"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}

        {showTeacherControls &&
          tool === "select" &&
          selectedEquationElement &&
          selectedEquationBounds &&
          !latexEditor.open && (
            <div
              data-equation-selection-toolbar
              className="absolute z-[430] flex items-center gap-1 rounded-xl border border-slate-200 bg-white/98 p-1.5 shadow-xl shadow-slate-900/15 backdrop-blur-xl"
              style={{
                left: Math.max(12, Math.min(selectedEquationBounds.left, window.innerWidth - rightInset - 190)),
                top: Math.max(60, selectedEquationBounds.top - 58),
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <button
                type="button"
                onClick={() =>
                  openLatexEditor(
                    selectedEquationElement.text,
                    selectedEquationElement.id,
                    selectedEquationElement.color,
                  )
                }
                className="flex size-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
                title="Edit formula"
                aria-label="Edit formula"
              >
                <PenLine className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => duplicateSelectedElement()}
                className="flex size-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
                title="Copy formula"
                aria-label="Copy formula"
              >
                <Copy className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  pushHistory();
                  updateCurrentPage((page) => ({
                    ...page,
                    elements: page.elements.filter((element) => element.id !== selectedEquationElement.id),
                  }));
                  setSelectedElementId(null);
                  setSelectedElementIds([]);
                }}
                className="flex size-9 items-center justify-center rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-600"
                title="Delete formula"
                aria-label="Delete formula"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}

        {showTeacherControls &&
          !textObjectDragging &&
          textEditor.open &&
          textEditor.type === "text" && (
            <div
              data-text-editor-ui
              className="absolute z-[340] w-[250px] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15"
              style={{
                left: Math.max(12, (textEditor.open && textEditor.type === "text" ? textEditor.x : selectedTextElement?.x ?? 12) - 18),
                top: Math.max(12, (textEditor.open && textEditor.type === "text" ? textEditor.y : selectedTextElement?.y ?? 12) - 58),
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              {showTextFormattingColors && (
                <div className="absolute bottom-full left-0 mb-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15">
                  {PEN_POPUP_COLORS.map((textColor) => (
                  <button
                    key={textColor}
                    type="button"
                    onClick={() => {
                      if (textEditor.open && textEditor.type === "text") {
                        setTextEditor((previous) => ({ ...previous, color: textColor }));
                        if (textEditor.editingElementId) {
                          updateCurrentPage((page) => ({
                            ...page,
                            elements: page.elements.map((element) =>
                              element.id === textEditor.editingElementId && element.type === "text"
                                ? { ...element, color: textColor }
                                : element,
                            ),
                          }));
                        }
                      } else {
                        applySelectedElementColor(textColor);
                      }
                    }}
                    className={`flex size-8 items-center justify-center rounded-full ${
                      (textEditor.open && textEditor.type === "text"
                        ? textEditor.color
                        : selectedTextElement?.color) === textColor
                        ? "ring-2 ring-slate-400 ring-offset-1"
                        : ""
                    }`}
                    title={`Text color ${textColor}`}
                    aria-label={`Text color ${textColor}`}
                  >
                    <span
                      className="size-6 rounded-full border border-slate-200"
                      style={{ backgroundColor: textColor }}
                    />
                  </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (textEditor.open && textEditor.type === "text") {
                      const nextFontSize = Math.max(8, textEditor.fontSize - 2);
                      setTextEditor((previous) => ({ ...previous, fontSize: nextFontSize }));
                      if (textEditor.editingElementId) {
                        updateCurrentPage((page) => ({
                          ...page,
                          elements: page.elements.map((element) =>
                            element.id === textEditor.editingElementId && element.type === "text"
                              ? { ...element, fontSize: nextFontSize }
                              : element,
                          ),
                        }));
                      }
                    } else if (selectedElement) {
                      updateCurrentPage((page) => ({
                        ...page,
                        elements: page.elements.map((element) =>
                          element.id === selectedElement.id && element.type === "text"
                            ? { ...element, fontSize: Math.max(8, element.fontSize - 2) }
                            : element,
                        ),
                      }));
                    }
                  }}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                  title="Decrease font size"
                  aria-label="Decrease font size"
                >
                  <ChevronDown className="size-4" />
                </button>
                <span className="min-w-8 text-center text-xs font-bold text-slate-700">
                  {textEditor.open && textEditor.type === "text"
                    ? textEditor.fontSize
                    : selectedTextElement?.fontSize}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (textEditor.open && textEditor.type === "text") {
                      const nextFontSize = Math.min(96, textEditor.fontSize + 2);
                      setTextEditor((previous) => ({ ...previous, fontSize: nextFontSize }));
                      if (textEditor.editingElementId) {
                        updateCurrentPage((page) => ({
                          ...page,
                          elements: page.elements.map((element) =>
                            element.id === textEditor.editingElementId && element.type === "text"
                              ? { ...element, fontSize: nextFontSize }
                              : element,
                          ),
                        }));
                      }
                    } else if (selectedElement) {
                      updateCurrentPage((page) => ({
                        ...page,
                        elements: page.elements.map((element) =>
                          element.id === selectedElement.id && element.type === "text"
                            ? { ...element, fontSize: Math.min(96, element.fontSize + 2) }
                            : element,
                        ),
                      }));
                    }
                  }}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                  title="Increase font size"
                  aria-label="Increase font size"
                >
                  <ChevronUp className="size-4" />
                </button>
                <div className="mx-1 h-6 w-px bg-slate-200" />
                <button
                  type="button"
                  onClick={() => {
                    setTool("text");

                    if (textEditor.open && textEditor.type === "text") {
                      setShowTextFormattingColors((previous) => !previous);
                      requestAnimationFrame(() => {
                        textInputRef.current?.focus();
                        const length = textEditor.text.length;
                        textInputRef.current?.setSelectionRange(length, length);
                      });
                    } else if (selectedTextElement) {
                      openTextEditor(
                        { x: selectedTextElement.x, y: selectedTextElement.y },
                        "text",
                        selectedTextElement.text,
                        selectedTextElement.id,
                        selectedTextElement.fontSize,
                        selectedTextElement.color,
                        selectedTextElement.bold,
                        selectedTextElement.italic,
                        selectedTextElement.underline,
                      );
                      setShowTextFormattingColors(true);
                    }
                  }}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                  title="Edit text"
                  aria-label="Edit text"
                >
                  <span className="text-sm font-bold underline decoration-2 decoration-emerald-500 underline-offset-2">A</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idToDelete =
                      textEditor.open && textEditor.type === "text"
                        ? textEditor.editingElementId
                        : selectedElement?.id;
                    if (!idToDelete) return;
                    pushHistory();
                    updateCurrentPage((page) => ({
                      ...page,
                      elements: page.elements.filter((element) => element.id !== idToDelete),
                    }));
                    setSelectedElementId(null);
                    setSelectedElementIds([]);
                    if (textEditor.open && textEditor.type === "text") {
                      setTextEditor((previous) => ({
                        ...previous,
                        open: false,
                        text: "",
                        editingElementId: null,
                      }));
                      setTool("select");
                    }
                  }}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600"
                  title="Delete text"
                  aria-label="Delete text"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          )}

        {/* Floating color palette — teacher only */}
        {showTeacherControls && showColorPopup && (
          <div
            className="absolute z-[310] w-55 max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200/90 bg-white/98 p-3 shadow-2xl shadow-slate-900/15 backdrop-blur-xl"
            style={{
              top: getPopupPosition("color", {
                x: colorPopupPosition.left,
                y: colorPopupPosition.top,
              }).y,
              left: getPopupPosition("color", {
                x: colorPopupPosition.left,
                y: colorPopupPosition.top,
              }).x,
            }}
            onPointerMove={movePopupDrag}
            onPointerUp={endPopupDrag}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div
              className="mb-3 flex cursor-move touch-none items-center justify-between select-none"
              onPointerDown={(event) => startPopupDrag("color", event)}
            >
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  {colorPopupTarget === "object" ? "Object Color" : "Pen Color"}
                </p>
                <p className="mt-0.5 text-[9px] text-slate-400">
                  Choose a color
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowColorPopup(false);
                  setColorPopupTarget(null);
                }}
                aria-label="Close color palette"
                className="flex size-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((c) => {
                const activeColor =
                  colorPopupTarget === "object"
                    ? selectedElement && "color" in selectedElement
                      ? selectedElement.color
                      : undefined
                    : color;

                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      if (colorPopupTarget === "object") {
                        applySelectedElementColor(c);
                      } else {
                        setColor(c);
                        setShowColorPopup(false);
                        setColorPopupTarget(null);
                      }
                    }}
                    title={c}
                    aria-label={`Choose color ${c}`}
                    className={`flex size-7 items-center justify-center rounded-lg transition ${
                      activeColor === c
                        ? "bg-blue-50 ring-2 ring-blue-500 ring-offset-1"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className="size-5 rounded-full border border-slate-200 shadow-sm"
                      style={{ backgroundColor: c }}
                    />
                  </button>
                );
              })}
            </div>

            {colorPopupTarget === "object" && selectedElement && (
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <span className="text-[9px] font-semibold text-slate-400">
                  Selected object
                </span>
                <span
                  className="size-4 rounded-full border border-slate-200 shadow-sm"
                  style={{
                    backgroundColor:
                      "color" in selectedElement
                        ? selectedElement.color
                        : "#94a3b8",
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Floating Math Toolkit — teacher only */}
        {showTeacherControls && showToolsPanel && (
          <aside
            className="absolute z-[290] flex max-h-[calc(100vh-32px)] w-72 max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-950/15 backdrop-blur-2xl"
            style={{
              left: getPopupPosition("toolkit", {
                x: Math.max(12, (window.innerWidth - rightInset) - 420),
                y: Math.max(80, window.innerHeight / 2 - 260),
              }).x,
              top: getPopupPosition("toolkit", {
                x: 0,
                y: Math.max(80, window.innerHeight / 2 - 260),
              }).y,
            }}
            onPointerMove={movePopupDrag}
            onPointerUp={endPopupDrag}
          >
            <div
              className="flex shrink-0 cursor-move touch-none items-center justify-between border-b border-slate-100 px-3 py-2.5 select-none"
              onPointerDown={(event) => startPopupDrag("toolkit", event)}
            >
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Layers3 className="size-3.5" />
                </div>
                <div>
                  <h2 className="text-[11px] font-extrabold text-slate-900">
                    Math Toolkit
                  </h2>
                  <p className="text-[8px] text-slate-400">
                    STEM tools & formulas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowToolsPanel(false)}
                title="Close toolkit"
                aria-label="Close toolkit"
                className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTool("axes")}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <Crosshair className="size-3.5 text-blue-600" />
                  <span className="text-[10px] font-semibold text-slate-700">
                    Grid Axes
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTool("ruler")}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <Ruler className="size-3.5 text-blue-600" />
                  <span className="text-[10px] font-semibold text-slate-700">
                    Ruler
                  </span>
                </button>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-900">
                    Formula Library
                  </span>
                  <BookOpen className="size-3.5 text-slate-400" />
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                  {(
                    [
                      "algebra",
                      "geometry",
                      "calculus",
                      "trigonometry",
                      "statistics",
                      "physics",
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormulaCategory(cat)}
                      className={`rounded-md px-1 py-1.5 text-[9px] font-bold capitalize transition ${formulaCategory === cat ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                {formulaSets[formulaCategory].map(([label, val]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => insertFormula(val)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <div className="text-[10px] font-bold text-slate-800">
                      {label}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[9px] text-blue-600">
                      {val}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Professional page rename dialog */}
      {renamePageState.open && (
        <div
          className="absolute inset-0 z-200 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-page-title"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) closeRenamePage();
          }}
        >
          <div
            className="absolute w-[min(420px,calc(100vw-24px))] max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
            style={{
              left: getPopupPosition("rename", {
                x: Math.max(12, (window.innerWidth - rightInset) / 2 - 210),
                y: Math.max(70, window.innerHeight / 2 - 180),
              }).x,
              top: getPopupPosition("rename", {
                x: 0,
                y: Math.max(70, window.innerHeight / 2 - 180),
              }).y,
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerMove={movePopupDrag}
            onPointerUp={endPopupDrag}
          >
            <div
              className="flex cursor-move touch-none items-start justify-between border-b border-slate-100 bg-slate-50/90 px-5 py-4 select-none"
              onPointerDown={(event) => startPopupDrag("rename", event)}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <PenLine className="size-4" />
                </div>
                <div>
                  <h2
                    id="rename-page-title"
                    className="text-sm font-extrabold text-slate-900"
                  >
                    Rename page
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Give this page a clear, memorable name.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRenamePage}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                aria-label="Close rename dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5">
              <label
                htmlFor="page-name-input"
                className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-500"
              >
                Page name
              </label>
              <input
                id="page-name-input"
                autoFocus
                value={renamePageState.name}
                onChange={(event) =>
                  setRenamePageState((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    saveRenamedPage();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    closeRenamePage();
                  }
                }}
                maxLength={80}
                placeholder="e.g. Fractions & Percents"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>Press Enter to save • Esc to cancel</span>
                <span>{renamePageState.name.length}/80</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
              <button
                type="button"
                onClick={closeRenamePage}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveRenamedPage}
                disabled={!renamePageState.name.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save name
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
