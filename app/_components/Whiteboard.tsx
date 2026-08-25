"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Circle,
  Copy,
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
  Grid2X2,
  Layers3,
  Plus,
  Ruler,
  BookOpen,
  X,
  PanelRight,
  Crosshair,
  Trash2,
  FunctionSquare,
  Settings2,
} from "lucide-react";
import MyLogo from "@/app/_components/Logo";

type Tool =
  | "select"
  | "pen"
  | "eraser"
  | "line"
  | "rectangle"
  | "circle"
  | "triangle"
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

type ShapeType = "line" | "rectangle" | "circle" | "triangle" | "axes";

type ShapeElement = {
  id: string;
  type: ShapeType;
  start: Point;
  end: Point;
  color: string;
  width: number;
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
};

type WhiteboardElement = StrokeElement | ShapeElement | TextElement;

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

type WhiteboardMode = "standalone" | "appointment";

type WhiteboardProps = {
  mode: WhiteboardMode;
  appointmentId?: string;
};

type SavedWhiteboardData = {
  version?: number;
  whiteboardId?: string;
  mode?: WhiteboardMode;
  appointmentId?: string;
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
    value === "pen" ||
    value === "eraser" ||
    value === "line" ||
    value === "rectangle" ||
    value === "circle" ||
    value === "triangle" ||
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
      candidate.mode === "standalone" || candidate.mode === "appointment"
        ? candidate.mode
        : undefined,
    appointmentId:
      typeof candidate.appointmentId === "string"
        ? candidate.appointmentId
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

const DEFAULT_BACKGROUND_IMAGE = "/images/chalkboard.png";

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

  return {
    width: Math.max(
      fontSize * 0.8,
      plainWidth + fractionCount * fontSize * 0.25 + sqrtCount * fontSize * 0.1,
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

  const mathMetrics =
    element.type === "equation"
      ? estimateMathMetrics(element.text, element.fontSize, ctx)
      : null;
  const measuredWidth = mathMetrics
    ? mathMetrics.width
    : ctx
      ? ctx.measureText(element.text).width
      : element.text.length * element.fontSize * 0.62;
  const measuredHeight = mathMetrics?.height ?? element.fontSize + 6;

  return {
    left: element.x - 4,
    top: element.y - 4,
    right: element.x + Math.max(measuredWidth, element.fontSize * 0.6) + 4,
    bottom: element.y + measuredHeight + 4,
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

export default function Whiteboard({ mode, appointmentId }: WhiteboardProps) {
  const [databaseWhiteboardId, setDatabaseWhiteboardId] = useState<
    string | null
  >(null);
  const [whiteboardReady, setWhiteboardReady] = useState(false);

  const rootRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const hasLoadedBoardRef = useRef(false);

  const storageKey = useMemo(() => {
    if (mode === "standalone") {
      return "justdy-lab-whiteboard:standalone";
    }

    return `justdy-lab-whiteboard:appointment:${appointmentId ?? "unknown"}`;
  }, [mode, appointmentId]);

  const [pages, setPages] = useState<WhiteboardPage[]>([createPage("Page 1")]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#2563eb");
  const [width, setWidth] = useState(4);
  const [fontSize] = useState(24);

  const [showGrid, setShowGrid] = useState(true);
  const [gridSize] = useState(32);
  const [backgroundColor, setBackgroundColor] = useState("#18181b");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(
    DEFAULT_BACKGROUND_IMAGE,
  );
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const [backgroundImageVersion, setBackgroundImageVersion] = useState(0);
  const [gridColor, setGridColor] = useState("#e5e7eb");

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

  const [axisColor] = useState("#475569");
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showMinorGrid] = useState(true);
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [showGraphSettings, setShowGraphSettings] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState("");
  const [calculatorResult, setCalculatorResult] = useState("");
  const [formulaCategory, setFormulaCategory] =
    useState<FormulaCategory>("algebra");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTeacherControls, setShowTeacherControls] = useState(false);

  const [renamePageState, setRenamePageState] = useState<{
    open: boolean;
    index: number | null;
    name: string;
  }>({
    open: false,
    index: null,
    name: "",
  });
  const [isSaved, setIsSaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [selectedEquation, setSelectedEquation] = useState("");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );

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
  const [activeTextPanel, setActiveTextPanel] = useState<
    "symbols" | "templates" | "formatting" | null
  >(null);

  const drawingRef = useRef(false);
  const startPointRef = useRef<Point | null>(null);
  const currentStrokeRef = useRef<StrokeElement | null>(null);
  const previewElementRef = useRef<ShapeElement | null>(null);

  const transformRef = useRef<{
    mode: "move" | "resize";
    element: WhiteboardElement;
    originalElement: WhiteboardElement;
    startPoint: Point;
    anchor: Point;
    handle: "nw" | "ne" | "se" | "sw" | null;
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
    (event: PointerEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }
      return { x, y };
    },
    [gridSize, snapToGrid],
  );

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvasWidth: number,
      canvasHeight: number,
    ) => {
      if (!showGrid) return;
      ctx.save();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;

      for (let x = 0; x <= canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }

      if (showMinorGrid) {
        ctx.strokeStyle = gridColor;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 0.5;
        const minor = Math.max(4, gridSize / 4);
        for (let x = 0; x <= canvasWidth; x += minor) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvasHeight);
          ctx.stroke();
        }
        for (let y = 0; y <= canvasHeight; y += minor) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvasWidth, y);
          ctx.stroke();
        }
      }
      ctx.restore();
    },
    [gridColor, gridSize, showGrid, showMinorGrid],
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

      ctx.beginPath();
      if (element.type === "line") {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
      } else if (element.type === "rectangle") {
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (element.type === "circle") {
        const radius = Math.hypot(end.x - start.x, end.y - start.y) / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      } else if (element.type === "triangle") {
        ctx.moveTo(centerX, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineTo(start.x, end.y);
        ctx.closePath();
      } else if (element.type === "axes") {
        ctx.moveTo(start.x, centerY);
        ctx.lineTo(end.x, centerY);
        ctx.moveTo(centerX, start.y);
        ctx.lineTo(centerX, end.y);
      }
      ctx.stroke();
      ctx.restore();
    },
    [axisColor],
  );

  const drawText = useCallback(
    (ctx: CanvasRenderingContext2D, element: TextElement) => {
      if (element.type === "equation") {
        drawMathEquation(
          ctx,
          element.text,
          element.x,
          element.y,
          element.fontSize,
          element.color,
        );
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
        { x: bounds.left, y: bounds.top },
        { x: bounds.right, y: bounds.top },
        { x: bounds.right, y: bounds.bottom },
        { x: bounds.left, y: bounds.bottom },
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

      // Delete control: red circular node at the top-right.
      const deleteX = bounds.right + 14;
      const deleteY = bounds.top - 14;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(deleteX, deleteY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(deleteX - 3, deleteY - 3);
      ctx.lineTo(deleteX + 3, deleteY + 3);
      ctx.moveTo(deleteX + 3, deleteY - 3);
      ctx.lineTo(deleteX - 3, deleteY + 3);
      ctx.stroke();
      ctx.restore();
    },
    [],
  );

  const getSelectionHandle = useCallback(
    (element: WhiteboardElement, point: Point) => {
      const bounds = getElementBounds(element, contextRef.current);
      const tolerance = 12;
      const handles = [
        { name: "nw" as const, x: bounds.left, y: bounds.top },
        { name: "ne" as const, x: bounds.right, y: bounds.top },
        { name: "se" as const, x: bounds.right, y: bounds.bottom },
        { name: "sw" as const, x: bounds.left, y: bounds.bottom },
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

  const isDeleteHandle = useCallback(
    (element: WhiteboardElement, point: Point) => {
      const bounds = getElementBounds(element, contextRef.current);
      const x = bounds.right + 14;
      const y = bounds.top - 14;
      return Math.hypot(point.x - x, point.y - y) <= 14;
    },
    [],
  );

  const resizeElement = useCallback(
    (
      original: WhiteboardElement,
      handle: "nw" | "ne" | "se" | "sw",
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

      if ("start" in original && "end" in original) {
        return {
          ...original,
          start: { x: left, y: top },
          end: { x: right, y: bottom },
        };
      }

      if (original.type === "text" || original.type === "equation") {
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

    // During move/resize, draw the live transformed element instead of waiting
    // for React state to update on pointer-up. This makes resizing feel
    // continuous and keeps the selection handles attached to the live object.
    const liveTransform = transformRef.current;
    const liveElement = liveTransform?.element ?? null;

    for (const element of elements) {
      const elementToDraw =
        liveElement && element.id === liveElement.id ? liveElement : element;

      if (elementToDraw.type === "stroke") drawStroke(ctx, elementToDraw);
      else if (
        ["line", "rectangle", "circle", "triangle", "axes"].includes(
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

    const selected = liveElement ?? getSelectedElement();
    if (selected) drawSelection(ctx, selected);
  }, [
    backgroundColor,
    backgroundImage,
    backgroundImageVersion,
    drawGrid,
    drawShape,
    drawStroke,
    drawText,
    drawSelection,
    elements,
    getSelectedElement,
    resizeCanvas,
  ]);

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
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const popupWidth = 520;
      const popupHeight = 500;
      const margin = 16;

      let left = point.x + rect.left + 18;
      let top = point.y + rect.top + 18;

      if (left + popupWidth > window.innerWidth - margin) {
        left = Math.max(margin, point.x + rect.left - popupWidth - 18);
      }
      if (top + popupHeight > window.innerHeight - margin) {
        top = Math.max(margin, point.y + rect.top - popupHeight - 18);
      }

      setActiveTextPanel(null);
      setTextEditor({
        open: true,
        type,
        x: left,
        y: top,
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

  const closeTextEditor = useCallback(() => {
    setTextEditor((previous) => ({
      ...previous,
      open: false,
      editingElementId: null,
    }));
    setActiveTextPanel(null);
  }, []);

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

  const addTextElement = useCallback(() => {
    const value = textEditor.text.trim();
    if (!value) {
      textInputRef.current?.focus();
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
            type: textEditor.type,
            text: value,
            color: textEditor.color,
            fontSize:
              textEditor.type === "equation"
                ? Math.max(textEditor.fontSize, 24)
                : textEditor.fontSize,
            bold: textEditor.type === "text" ? textEditor.bold : false,
            italic: textEditor.type === "text" ? textEditor.italic : false,
            underline:
              textEditor.type === "text" ? textEditor.underline : false,
          };
        }),
      }));

      setSelectedElementId(textEditor.editingElementId);
      setTextEditor((previous) => ({
        ...previous,
        open: false,
        text: "",
        editingElementId: null,
      }));
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
    setTextEditor((previous) => ({
      ...previous,
      open: false,
      text: "",
      editingElementId: null,
    }));
  }, [pushHistory, textEditor, updateCurrentPage]);

  const duplicateSelectedText = useCallback(() => {
    if (!selectedElementId) return;

    const selected = elements.find(
      (element: WhiteboardElement) => element.id === selectedElementId,
    );
    if (
      !selected ||
      (selected.type !== "text" && selected.type !== "equation")
    ) {
      return;
    }

    pushHistory();

    const duplicate: TextElement = {
      ...structuredClone(selected),
      id: createId(),
      x: selected.x + 24,
      y: selected.y + 24,
    };

    updateCurrentPage((page) => ({
      ...page,
      elements: [...page.elements, duplicate],
    }));

    setSelectedElementId(duplicate.id);
  }, [elements, pushHistory, selectedElementId, updateCurrentPage]);

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

      openTextEditor(
        point,
        hit.type,
        hit.text,
        hit.id,
        hit.fontSize,
        hit.color,
        hit.bold ?? false,
        hit.italic ?? false,
        hit.underline ?? false,
      );
    },
    [elements, gridSize, openTextEditor, snapToGrid, tool],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    const point = getPoint(event.nativeEvent);
    startPointRef.current = point;

    if (tool === "select") {
      const selected = getSelectedElement();

      if (selected && isDeleteHandle(selected, point)) {
        pushHistory();
        updateCurrentPage((page) => ({
          ...page,
          elements: page.elements.filter(
            (el: WhiteboardElement) => el.id !== selected.id,
          ),
        }));
        setSelectedElementId(null);
        setShowColorPopup(false);
        setColorPopupTarget(null);
        return;
      }

      if (selected) {
        const handle = getSelectionHandle(selected, point);
        if (handle) {
          pushHistory();
          setSelectedElementId(selected.id);
          drawingRef.current = true;
          transformRef.current = {
            mode: "resize",
            element: structuredClone(selected),
            originalElement: structuredClone(selected),
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
        .find((el: WhiteboardElement) =>
          hitTestElement(el, point, contextRef.current),
        );
      if (hit) {
        setSelectedElementId(hit.id);
        pushHistory();
        drawingRef.current = true;
        transformRef.current = {
          mode: "move",
          element: structuredClone(hit),
          originalElement: structuredClone(hit),
          startPoint: point,
          anchor: point,
          handle: null,
          moved: false,
        };
      } else {
        setSelectedElementId(null);
        renderCanvas();
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
        width: tool === "eraser" ? Math.max(width * 4, 24) : width,
        pressureSensitive: true,
      };
      return;
    }

    if (
      ["line", "rectangle", "circle", "triangle", "axes", "ruler"].includes(
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

    if (tool === "text" || tool === "equation") {
      openTextEditor(point, tool, tool === "equation" ? selectedEquation : "");
      setSelectedEquation("");
      return;
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const point = getPoint(event.nativeEvent);

    if (transformRef.current) {
      const tr = transformRef.current;
      if (tr.mode === "resize" && tr.handle) {
        tr.element = resizeElement(tr.originalElement, tr.handle, point);
      } else {
        tr.element = translateElement(
          tr.element,
          point.x - tr.startPoint.x,
          point.y - tr.startPoint.y,
        );
        tr.startPoint = point;
      }
      tr.moved = true;
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
      if (transformRef.current.moved) {
        const final = transformRef.current.element;
        updateCurrentPage((p) => ({
          ...p,
          elements: p.elements.map((el: WhiteboardElement) =>
            el.id === final.id ? final : el,
          ),
        }));
      }
      transformRef.current = null;
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

  const duplicatePage = (index: number) => {
    const sourcePage = pages[index];
    if (!sourcePage) return;

    pushHistory();

    // Deep-clone the page and regenerate every ID so the duplicated page
    // is completely independent of the original page.
    const duplicatedPage: WhiteboardPage = {
      ...structuredClone(sourcePage),
      id: createId(),
      name: `${sourcePage.name} (Copy)`,
      elements: sourcePage.elements.map((element: WhiteboardElement) => ({
        ...structuredClone(element),
        id: createId(),
      })),
    };

    const insertIndex = index + 1;

    setPages((previous) => [
      ...previous.slice(0, insertIndex),
      duplicatedPage,
      ...previous.slice(insertIndex),
    ]);
    setCurrentPageIndex(insertIndex);
    setSelectedElementId(null);
  };

  const deletePage = (index: number) => {
    if (pages.length === 1) {
      clearPage();
      return;
    }
    pushHistory();
    setPages((p) => p.filter((_, idx) => idx !== index));
    setCurrentPageIndex((c) => Math.max(0, Math.min(c, pages.length - 2)));
  };

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

      const response = await fetch("/api/whiteboards/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          appointmentId: mode === "appointment" ? appointmentId : undefined,
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
  }, [mode, appointmentId]);

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

    if (typeof boardData.showGrid === "boolean")
      setShowGrid(boardData.showGrid);
    if (typeof boardData.backgroundColor === "string")
      setBackgroundColor(boardData.backgroundColor);
    if (typeof boardData.backgroundImage === "string")
      setBackgroundImage(boardData.backgroundImage);
    else if (boardData.backgroundImage === null) setBackgroundImage(null);
    if (typeof boardData.gridColor === "string")
      setGridColor(boardData.gridColor);
    if (typeof boardData.snapToGrid === "boolean")
      setSnapToGrid(boardData.snapToGrid);
    if (typeof boardData.color === "string") setColor(boardData.color);
    if (typeof boardData.width === "number") setWidth(boardData.width);
    if (boardData.tool) setTool(boardData.tool);
    if (boardData.formulaCategory)
      setFormulaCategory(boardData.formulaCategory);

    setSelectedElementId(null);
  }, []);

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

        localStorage.setItem(storageKey, JSON.stringify(boardData));

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
      storageKey,
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
        localStorage.setItem(storageKey, JSON.stringify(boardData));
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
  }, [databaseWhiteboardId, storageKey, applyBoardData]);

  // Resolve the route context into the actual Prisma Whiteboard ID.
  useEffect(() => {
    if (mode === "appointment" && !appointmentId) return;

    let cancelled = false;

    const initializeWhiteboard = async () => {
      hasLoadedBoardRef.current = false;
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
            localStorage.setItem(storageKey, JSON.stringify(boardData));
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
  }, [mode, appointmentId, resolveWhiteboard, applyBoardData, storageKey]);

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
    setShowTeacherControls((current) => {
      const next = !current;

      if (!next) {
        setShowGraphSettings(false);
        setShowCalculator(false);
        setShowToolsPanel(false);
        setShowColorPopup(false);
        setColorPopupTarget(null);
      }

      return next;
    });
  };

  const runCalculator = useCallback(() => {
    if (!calculatorValue.trim()) return;
    try {
      if (!/^[0-9+\-*/().%\s^√π]+$/.test(calculatorValue)) {
        setCalculatorResult("Invalid expression");
        return;
      }
      const norm = calculatorValue
        .replace(/\^/g, "**")
        .replace(/π/g, "Math.PI")
        .replace(/√/g, "Math.sqrt");
      const res = Function(`"use strict"; return (${norm})`)();
      setCalculatorResult(Number.isFinite(res) ? String(res) : "Error");
    } catch {
      setCalculatorResult("Error");
    }
  }, [calculatorValue]);

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
        type="button"
        onClick={() => setTool(name)}
        title={shortcut ? `${label} (${shortcut})` : label}
        aria-label={label}
        className={`group relative flex size-9 shrink-0 items-center justify-center rounded-lg transition-all ${
          active
            ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        {icon}

        {shortcut && (
          <span className="pointer-events-none absolute -right-1.5 -top-1 hidden rounded bg-slate-900 px-1 py-0.5 text-[7px] font-bold text-white shadow-sm 2xl:block">
            {shortcut}
          </span>
        )}

        <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block">
          {label}
        </span>
      </button>
    );
  };

  useEffect(() => {
    const handleFocusModeKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (
        !isTypingTarget &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        event.key.toLowerCase() === "f"
      ) {
        event.preventDefault();
        toggleTeacherControls();
      }
    };

    window.addEventListener("keydown", handleFocusModeKeyDown);
    return () => window.removeEventListener("keydown", handleFocusModeKeyDown);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (tool !== "select" || !selectedElementId) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        const selected = elements.find(
          (element: WhiteboardElement) => element.id === selectedElementId,
        );
        if (
          selected &&
          (selected.type === "text" || selected.type === "equation")
        ) {
          event.preventDefault();
          duplicateSelectedText();
          return;
        }
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        pushHistory();
        updateCurrentPage((page) => ({
          ...page,
          elements: page.elements.filter(
            (el: WhiteboardElement) => el.id !== selectedElementId,
          ),
        }));
        setSelectedElementId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    duplicateSelectedText,
    elements,
    pushHistory,
    selectedElementId,
    tool,
    updateCurrentPage,
  ]);

  const selectedElement = getSelectedElement();

  return (
    <main
      ref={rootRef}
      className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-50 text-slate-900 antialiased"
    >
      {/* Floating top command bar — teacher only */}
      {showTeacherControls && (
        <header className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-start justify-between px-4 pt-3">
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
            <div className="flex size-8 items-center justify-center overflow-hidden rounded-xl bg-white">
              <MyLogo showText={false} />
            </div>

            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-xs font-extrabold tracking-tight text-slate-900">
                  Justdy Teaching Lab
                </h1>
                <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] font-bold text-blue-600">
                  WHITEBOARD
                </span>
              </div>
              <p className="text-[9px] text-slate-400">
                {currentPage?.name} · {elements.length}{" "}
                {elements.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-0.5 rounded-2xl border border-slate-200/80 bg-white/95 p-1 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
            <button
              type="button"
              onClick={undo}
              title="Undo"
              aria-label="Undo"
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Undo2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              title="Redo"
              aria-label="Redo"
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Redo2 className="size-4" />
            </button>
            {(() => {
              const selected = elements.find(
                (el: WhiteboardElement) => el.id === selectedElementId,
              );
              if (
                !selected ||
                (selected.type !== "text" && selected.type !== "equation")
              )
                return null;
              return (
                <button
                  type="button"
                  onClick={duplicateSelectedText}
                  title="Duplicate selected text"
                  aria-label="Duplicate selected text"
                  className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <Copy className="size-4" />
                </button>
              );
            })()}

            <div className="mx-1 h-5 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              {saveStatus !== "idle" && (
                <span
                  className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    saveStatus === "saving"
                      ? "bg-blue-50 text-blue-600"
                      : saveStatus === "saved"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {saveStatus === "saving" && "Saving..."}
                  {saveStatus === "saved" && "Saved"}
                  {saveStatus === "error" && "Save failed"}
                </span>
              )}

              <button
                type="button"
                onClick={() => saveBoard(true)}
                title="Save workspace"
                aria-label="Save workspace"
                className={`flex size-8 items-center justify-center rounded-lg transition ${
                  saveStatus === "saved"
                    ? "bg-emerald-50 text-emerald-600"
                    : saveStatus === "saving"
                      ? "bg-blue-50 text-blue-600"
                      : saveStatus === "error"
                        ? "bg-red-50 text-red-600"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Save
                  className={`size-4 ${
                    saveStatus === "saving" ? "animate-pulse" : ""
                  }`}
                />
              </button>
            </div>
            <button
              type="button"
              onClick={restoreBoard}
              title="Restore workspace"
              aria-label="Restore workspace"
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <FolderOpen className="size-4" />
            </button>
            <button
              type="button"
              onClick={exportPNG}
              title="Export PNG"
              aria-label="Export PNG"
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Download className="size-4" />
            </button>

            <div className="mx-1 h-5 w-px bg-slate-200" />

            <button
              type="button"
              onClick={() => setShowGraphSettings((v) => !v)}
              title="Canvas & Grid"
              aria-label="Canvas & Grid"
              className={`flex size-8 items-center justify-center rounded-lg transition ${showGraphSettings ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              <Grid2X2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowCalculator((v) => !v)}
              title="Calculator"
              aria-label="Calculator"
              className={`flex size-8 items-center justify-center rounded-lg transition ${showCalculator ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              <Calculator className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowToolsPanel((v) => !v)}
              title="Math Toolkit"
              aria-label="Math Toolkit"
              className={`flex size-8 items-center justify-center rounded-lg transition ${showToolsPanel ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              <PanelRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={clearPage}
              title="Clear page"
              aria-label="Clear page"
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              className="ml-1 flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-800"
            >
              {isFullscreen ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
            </button>
          </div>
        </header>
      )}

      {showTeacherControls && showGraphSettings && (
        <div className="absolute right-4 top-16 z-50 w-80 rounded-md border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
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
        <div className="absolute right-4 top-16 z-50 w-72 rounded-md border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Advanced Calculator
            </h3>
            <button
              onClick={() => setShowCalculator(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="size-4" />
            </button>
          </div>
          <input
            value={calculatorValue}
            onChange={(e) => setCalculatorValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runCalculator()}
            placeholder="e.g. √(16) + 5 * π"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono outline-none"
          />
          <button
            onClick={runCalculator}
            className="mt-2 w-full rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
          >
            Calculate
          </button>
          {calculatorResult && (
            <div className="mt-3 rounded-xl bg-blue-50 p-3 text-right text-lg font-bold text-blue-700">
              {calculatorResult}
            </div>
          )}
        </div>
      )}

      {textEditor.open && (
        <div
          className="fixed z-100 w-130 max-w-[calc(100vw-24px)] overflow-visible rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
          style={{
            left: textEditor.x,
            top: textEditor.y,
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/95 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                {textEditor.type === "equation" ? (
                  <Sigma className="size-4" />
                ) : (
                  <Type className="size-4" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {textEditor.editingElementId
                    ? textEditor.type === "equation"
                      ? "Edit Equation"
                      : "Edit Text"
                    : textEditor.type === "equation"
                      ? "LaTeX Equation"
                      : "Add Text"}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {textEditor.editingElementId
                    ? "Edit the selected item on your board"
                    : textEditor.type === "equation"
                      ? "Type LaTeX directly and preview the result"
                      : "Add a label or note to your board"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeTextEditor}
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
              aria-label="Close text editor"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="p-4">
            <div className="mb-3 flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTextPanel(null);
                  setTextEditor((previous) => ({ ...previous, type: "text" }));
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  textEditor.type === "text"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Type className="size-3.5" /> Text
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setTextEditor((previous) => ({
                    ...previous,
                    type: "equation",
                    fontSize: Math.max(previous.fontSize, 24),
                  }))
                }
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  textEditor.type === "equation"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Sigma className="size-3.5" /> Math / LaTeX
                </span>
              </button>
            </div>

            <div className="mb-3 flex items-center gap-2">
              {textEditor.type === "equation" && (
                <>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTextPanel((v) =>
                          v === "symbols" ? null : "symbols",
                        )
                      }
                      className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition-colors ${
                        activeTextPanel === "symbols"
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Sigma className="size-3.5" /> Symbols
                    </button>
                    {activeTextPanel === "symbols" && (
                      <div className="absolute left-0 top-11 z-120 w-85 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          Insert LaTeX symbols
                        </div>
                        <div className="grid grid-cols-7 gap-1.5">
                          {[
                            ["α", "\\alpha "],
                            ["β", "\\beta "],
                            ["γ", "\\gamma "],
                            ["θ", "\\theta "],
                            ["π", "\\pi "],
                            ["λ", "\\lambda "],
                            ["μ", "\\mu "],
                            ["Σ", "\\Sigma "],
                            ["∑", "\\sum "],
                            ["∏", "\\prod "],
                            ["∫", "\\int "],
                            ["∞", "\\infty "],
                            ["±", "\\pm "],
                            ["×", "\\times "],
                            ["≤", "\\le "],
                            ["≥", "\\ge "],
                            ["≠", "\\neq "],
                            ["≈", "\\approx "],
                            ["→", "\\rightarrow "],
                            ["∂", "\\partial "],
                            ["∇", "\\nabla "],
                          ].map(([label, value]) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => insertLatexAtCursor(value)}
                              className="flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                              title={`Insert ${value.trim()}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTextPanel((v) =>
                          v === "templates" ? null : "templates",
                        )
                      }
                      className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition-colors ${
                        activeTextPanel === "templates"
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <FunctionSquare className="size-3.5" /> Templates
                    </button>
                    {activeTextPanel === "templates" && (
                      <div className="absolute left-0 top-11 z-120 w-90 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          Common LaTeX structures
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            ["Fraction", "\\frac{a}{b}"],
                            ["Square root", "\\sqrt{x}"],
                            ["Power", "x^{2}"],
                            ["Subscript", "x_{i}"],
                            ["Sum", "\\sum_{i=1}^{n} x_i"],
                            ["Integral", "\\int_{a}^{b} f(x)\\,dx"],
                            ["Limit", "\\lim_{x\\to0} f(x)"],
                            ["Text", "\\text{word}"],
                            ["Parentheses", "\\left( x \\right)"],
                            ["Absolute value", "\\left| x \\right|"],
                          ].map(([label, value]) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => insertLatexAtCursor(value)}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left hover:border-blue-300 hover:bg-blue-50"
                            >
                              <div className="text-[10px] font-bold text-slate-700">
                                {label}
                              </div>
                              <div className="mt-0.5 truncate font-mono text-[10px] text-blue-600">
                                {value}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="ml-auto flex items-center gap-2">
                <span className="hidden text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:inline">
                  Format
                </span>

                <button
                  type="button"
                  disabled={textEditor.type === "equation"}
                  onClick={() =>
                    setTextEditor((p) => ({ ...p, bold: !p.bold }))
                  }
                  className={`flex size-9 items-center justify-center rounded-lg border text-sm font-bold transition-colors ${
                    textEditor.type === "equation"
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                      : textEditor.bold
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  title="Bold"
                  aria-label="Bold"
                >
                  B
                </button>

                <button
                  type="button"
                  disabled={textEditor.type === "equation"}
                  onClick={() =>
                    setTextEditor((p) => ({ ...p, italic: !p.italic }))
                  }
                  className={`flex size-9 items-center justify-center rounded-lg border text-sm italic transition-colors ${
                    textEditor.type === "equation"
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                      : textEditor.italic
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  title="Italic"
                  aria-label="Italic"
                >
                  I
                </button>

                <button
                  type="button"
                  disabled={textEditor.type === "equation"}
                  onClick={() =>
                    setTextEditor((p) => ({
                      ...p,
                      underline: !p.underline,
                    }))
                  }
                  className={`flex size-9 items-center justify-center rounded-lg border text-sm font-semibold underline transition-colors ${
                    textEditor.type === "equation"
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                      : textEditor.underline
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  title="Underline"
                  aria-label="Underline"
                >
                  U
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTextEditor((p) => ({
                      ...p,
                      fontSize: Math.max(12, p.fontSize - 2),
                    }))
                  }
                  className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-50"
                  title="Decrease font size"
                  aria-label="Decrease font size"
                >
                  −
                </button>

                <input
                  type="number"
                  min={12}
                  max={96}
                  value={textEditor.fontSize}
                  onChange={(event) =>
                    setTextEditor((p) => ({
                      ...p,
                      fontSize: Math.min(
                        96,
                        Math.max(12, Number(event.target.value) || 12),
                      ),
                    }))
                  }
                  className="h-9 w-16 rounded-lg border border-slate-200 bg-white text-center text-xs font-semibold"
                  title="Font size"
                  aria-label="Font size"
                />

                <button
                  type="button"
                  onClick={() =>
                    setTextEditor((p) => ({
                      ...p,
                      fontSize: Math.min(96, p.fontSize + 2),
                    }))
                  }
                  className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-50"
                  title="Increase font size"
                  aria-label="Increase font size"
                >
                  +
                </button>

                <div className="relative">
                  <button
                    type="button"
                    disabled={textEditor.type === "equation"}
                    onClick={() =>
                      setActiveTextPanel((v) =>
                        v === "formatting" ? null : "formatting",
                      )
                    }
                    className={`flex size-9 items-center justify-center rounded-lg border transition-colors ${
                      textEditor.type === "equation"
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                        : activeTextPanel === "formatting"
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    title="Text color"
                    aria-label="Text color"
                  >
                    <span
                      className="size-4 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-300"
                      style={{ backgroundColor: textEditor.color }}
                    />
                  </button>

                  {activeTextPanel === "formatting" &&
                    textEditor.type === "text" && (
                      <div className="absolute right-0 top-11 z-120 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          Text Color
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setTextEditor((p) => ({ ...p, color: c }));
                                setActiveTextPanel(null);
                              }}
                              className={`flex size-8 items-center justify-center rounded-full ${
                                textEditor.color === c
                                  ? "ring-2 ring-blue-500 ring-offset-2"
                                  : ""
                              }`}
                              title={`Text color ${c}`}
                              aria-label={`Text color ${c}`}
                            >
                              <span
                                className="size-6 rounded-full border border-slate-200"
                                style={{ backgroundColor: c }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div>
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
                placeholder={
                  textEditor.type === "equation"
                    ? "Type LaTeX here… e.g. \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
                    : "Type your text..."
                }
                rows={textEditor.type === "equation" ? 4 : 3}
                spellCheck={textEditor.type !== "equation"}
                className={`w-full resize-none rounded-xl border px-3.5 py-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${
                  textEditor.type === "equation"
                    ? "min-h-29 bg-slate-950 font-mono leading-6 text-emerald-300 placeholder:text-slate-500"
                    : "bg-slate-50 placeholder:text-slate-400"
                }`}
              />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  {textEditor.type === "equation"
                    ? "LaTeX source • Ctrl/Cmd + Enter to add"
                    : "Ctrl/Cmd + Enter to add"}
                </span>
                <span>{textEditor.text.length}/1000</span>
              </div>
            </div>

            {textEditor.text.trim() && (
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Live Preview
                  </span>
                  {textEditor.type === "equation" && (
                    <span className="font-mono text-[9px] text-slate-400">
                      LaTeX → Math
                    </span>
                  )}
                </div>
                <div
                  className="max-h-16 overflow-hidden wrap-break-word whitespace-pre-wrap"
                  style={{
                    color: textEditor.color,
                    fontSize: Math.min(textEditor.fontSize, 30),
                    fontWeight: textEditor.bold ? 700 : 400,
                    fontStyle: textEditor.italic ? "italic" : "normal",
                    textDecoration: textEditor.underline ? "underline" : "none",
                    fontFamily:
                      textEditor.type === "equation"
                        ? "Cambria Math, STIX Two Math, Times New Roman, serif"
                        : "Inter, ui-sans-serif, system-ui, sans-serif",
                  }}
                >
                  {textEditor.type === "equation"
                    ? latexToReadable(textEditor.text)
                    : textEditor.text}
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <span className="text-[10px] text-slate-400">
                {textEditor.editingElementId
                  ? "Changes will update the selected item."
                  : textEditor.type === "equation"
                    ? "Use the popups for quick LaTeX structures."
                    : "Add text directly to the board."}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeTextEditor}
                  className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addTextElement}
                  disabled={!textEditor.text.trim()}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {textEditor.type === "equation" ? (
                    <Sigma className="size-3.5" />
                  ) : (
                    <Type className="size-3.5" />
                  )}
                  {textEditor.editingElementId
                    ? textEditor.type === "equation"
                      ? "Update Equation"
                      : "Update Text"
                    : textEditor.type === "equation"
                      ? "Add Equation"
                      : "Add to Board"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen drawing workspace */}
      <div className="absolute inset-0">
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
            />
          </div>
        </section>

        {/* Floating left toolbox — teacher only */}
        {showTeacherControls && (
          <aside className="absolute left-4 top-1/2 z-40 -translate-y-1/2">
            <div className="flex max-h-[calc(100vh-170px)] w-12 flex-col items-center gap-1 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 px-1.5 py-2 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
              {toolButton(
                "select",
                "Select / Move",
                <MousePointer2 className="size-4" />,
                "V",
              )}
              {toolButton("pen", "Pen", <PenLine className="size-4" />, "P")}
              {toolButton(
                "eraser",
                "Eraser",
                <Eraser className="size-4" />,
                "E",
              )}

              <div className="my-1 h-px w-6 shrink-0 bg-slate-200" />

              {toolButton("line", "Line", <Minus className="size-4" />, "L")}
              {toolButton(
                "rectangle",
                "Rectangle",
                <Square className="size-4" />,
                "R",
              )}
              {toolButton(
                "circle",
                "Circle",
                <Circle className="size-4" />,
                "C",
              )}
              {toolButton(
                "triangle",
                "Triangle",
                <Triangle className="size-4" />,
              )}
              {toolButton("ruler", "Ruler", <Ruler className="size-4" />, "U")}

              <div className="my-1 h-px w-6 shrink-0 bg-slate-200" />

              {toolButton(
                "axes",
                "Coordinate Axes",
                <Crosshair className="size-4" />,
                "A",
              )}
              {toolButton(
                "equation",
                "Equation",
                <Sigma className="size-4" />,
                "Q",
              )}
              {toolButton("text", "Text", <Type className="size-4" />, "T")}

              <div className="my-1 h-px w-6 shrink-0 bg-slate-200" />

              <button
                ref={colorButtonRef}
                type="button"
                onClick={() => {
                  if (showColorPopup && colorPopupTarget === "pen") {
                    setShowColorPopup(false);
                    return;
                  }
                  positionColorPopup("pen");
                }}
                title="Pen color"
                aria-label="Pen color"
                className="group relative flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <span
                  className="size-5 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-300"
                  style={{ backgroundColor: color }}
                />
                <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block">
                  Pen Color
                </span>
              </button>

              {selectedElement && (
                <>
                  <button
                    ref={objectColorButtonRef}
                    type="button"
                    onClick={() => {
                      if (showColorPopup && colorPopupTarget === "object") {
                        setShowColorPopup(false);
                        setColorPopupTarget(null);
                        return;
                      }
                      positionColorPopup("object");
                    }}
                    title="Selected object color"
                    aria-label="Selected object color"
                    className={`group relative flex size-9 shrink-0 items-center justify-center rounded-lg border transition ${
                      colorPopupTarget === "object" && showColorPopup
                        ? "border-blue-300 bg-blue-50"
                        : "border-transparent hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className="size-5 rounded-md border-2 border-white shadow-sm ring-1 ring-slate-300"
                      style={{ backgroundColor: selectedElement.color }}
                    />

                    <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block">
                      Object Color
                    </span>
                  </button>
                </>
              )}

              <div className="mt-1 flex w-9 flex-col items-center rounded-lg bg-slate-50 py-1">
                <span className="mb-0.5 text-[7px] font-bold text-slate-400">
                  {width}px
                </span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  title="Stroke width"
                  aria-label="Stroke width"
                  className="h-12 w-1 cursor-pointer [writing-mode:vertical-lr]"
                />
              </div>
            </div>
          </aside>
        )}

        {/* Floating color palette — teacher only */}
        {showTeacherControls && showColorPopup && (
          <div
            className="fixed z-120 w-55 rounded-2xl border border-slate-200/90 bg-white/98 p-3 shadow-2xl shadow-slate-900/15 backdrop-blur-xl"
            style={{
              top: colorPopupPosition.top,
              left: colorPopupPosition.left,
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
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
                    ? selectedElement?.color
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
                  style={{ backgroundColor: selectedElement.color }}
                />
              </div>
            )}
          </div>
        )}

        {/* Floating Math Toolkit — teacher only */}
        {showTeacherControls && showToolsPanel && (
          <aside className="absolute right-4 top-20 bottom-16 z-40 flex w-72 max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2.5">
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

        {/* Floating bottom page dock — teacher only */}
        {showTeacherControls && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center px-4">
            <div className="pointer-events-auto flex max-w-[calc(100vw-32px)] items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
              <button
                type="button"
                onClick={addPage}
                title="Add page"
                aria-label="Add page"
                className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus className="size-4" />
              </button>

              <div className="mx-1 h-5 w-px bg-slate-200" />

              <div className="max-w-[min(70vw,900px)] overflow-x-auto scrollbar-thin">
                <div className="flex min-w-max items-center gap-1">
                  {pages.map((page, index) => {
                    const isActive = currentPageIndex === index;
                    return (
                      <div
                        key={page.id}
                        className={`group flex h-8 shrink-0 items-center rounded-lg border transition-all ${isActive ? "border-blue-200 bg-blue-50" : "border-transparent hover:border-slate-200 hover:bg-slate-50"}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPageIndex(index);
                            setSelectedElementId(null);
                          }}
                          title={`Open ${page.name}`}
                          className="flex h-full items-center gap-1.5 px-2.5"
                        >
                          <span
                            className={`text-[10px] font-extrabold ${isActive ? "text-blue-600" : "text-slate-400"}`}
                          >
                            {index + 1}
                          </span>
                          <span
                            className={`max-w-28 truncate text-[10px] font-semibold ${isActive ? "text-blue-800" : "text-slate-600"}`}
                          >
                            {page.name}
                          </span>
                          <span
                            className={`whitespace-nowrap text-[9px] ${isActive ? "text-blue-500" : "text-slate-400"}`}
                          >
                            · {page.elements.length}{" "}
                            {page.elements.length === 1 ? "item" : "items"}
                          </span>
                        </button>

                        <div
                          className={`flex items-center border-l px-0.5 ${isActive ? "border-blue-200 opacity-100" : "border-slate-200 opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}
                        >
                          <button
                            type="button"
                            onClick={() => duplicatePage(index)}
                            title="Duplicate page"
                            aria-label={`Duplicate ${page.name}`}
                            className="flex size-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-blue-600"
                          >
                            <Copy className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => renamePage(index)}
                            title="Rename page"
                            aria-label={`Rename ${page.name}`}
                            className="flex size-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-slate-700"
                          >
                            <Settings2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePage(index)}
                            title="Delete page"
                            aria-label={`Delete ${page.name}`}
                            className="flex size-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating undo / redo controls — teacher only */}
        {showTeacherControls && (
          <div className="absolute bottom-3 left-4 z-40 flex items-center gap-0.5 rounded-xl border border-slate-200/80 bg-white/95 p-1 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
            <button
              type="button"
              onClick={undo}
              title="Undo"
              aria-label="Undo"
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Undo2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              title="Redo"
              aria-label="Redo"
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Redo2 className="size-4" />
            </button>
            <div className="mx-1 h-5 w-px bg-slate-200" />
            <button
              type="button"
              onClick={clearPage}
              title="Clear page"
              aria-label="Clear page"
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}

        {/* Floating workspace status — teacher only */}
        {showTeacherControls && (
          <div className="absolute bottom-3 right-4 z-40 hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-1.5 text-[9px] font-semibold text-slate-500 shadow-lg shadow-slate-900/5 backdrop-blur-xl md:flex">
            <span
              className={`size-1.5 rounded-full ${tool === "pen" ? "bg-blue-500" : "bg-slate-400"}`}
            />
            {tool === "pen"
              ? `Pen · ${width}px`
              : tool.charAt(0).toUpperCase() + tool.slice(1)}
          </div>
        )}
      </div>

      {/* Teacher controls toggle — intentionally always visible */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-300">
        <button
          type="button"
          onClick={toggleTeacherControls}
          title={
            showTeacherControls
              ? "Hide teacher controls"
              : "Open teacher controls"
          }
          aria-label={
            showTeacherControls
              ? "Hide teacher controls"
              : "Open teacher controls"
          }
          className={`pointer-events-auto group flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-bold shadow-xl backdrop-blur-xl transition-all duration-200 ${
            showTeacherControls
              ? "border-slate-300 bg-white/95 text-slate-700 shadow-slate-900/10 hover:bg-white"
              : "border-slate-700/40 bg-slate-900/90 text-white shadow-slate-950/25 hover:bg-slate-800"
          }`}
        >
          <Settings2
            className={`size-4 transition-transform duration-300 ${
              showTeacherControls ? "rotate-90" : ""
            }`}
          />
          <span className="hidden sm:inline">
            {showTeacherControls ? "Hide Controls" : "Teacher Controls"}
          </span>
        </button>
      </div>

      {/* Professional page rename dialog */}
      {renamePageState.open && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-page-title"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) closeRenamePage();
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/90 px-5 py-4">
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
