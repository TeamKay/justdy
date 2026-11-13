import type {
  FormulaCategory,
  SavedWhiteboardData,
  TeachingLesson,
  TeachingLibraryItem,
  Tool,
  WhiteboardPage,
} from "../types/whiteboard";

export const FORMULA_CATEGORIES: readonly FormulaCategory[] = [
  "algebra",
  "geometry",
  "calculus",
  "trigonometry",
  "statistics",
  "physics",
];

export function isTool(value: unknown): value is Tool {
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

export function isFormulaCategory(value: unknown): value is FormulaCategory {
  return (
    typeof value === "string" &&
    FORMULA_CATEGORIES.includes(value as FormulaCategory)
  );
}

export function parseSavedBoardData(value: unknown): SavedWhiteboardData | null {
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
      candidate.mode === "standalone" ||
      candidate.mode === "appointment" ||
      candidate.mode === "booking"
        ? candidate.mode
        : undefined,
    appointmentId:
      typeof candidate.appointmentId === "string"
        ? candidate.appointmentId
        : undefined,
    bookingId:
      typeof candidate.bookingId === "string" ? candidate.bookingId : undefined,
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
    teachingLibrary: Array.isArray(candidate.teachingLibrary)
      ? (candidate.teachingLibrary as TeachingLibraryItem[])
      : undefined,
    teachingLessons: Array.isArray(candidate.teachingLessons)
      ? (candidate.teachingLessons as TeachingLesson[])
      : undefined,
    activeTeachingLessonId:
      typeof candidate.activeTeachingLessonId === "string"
        ? candidate.activeTeachingLessonId
        : undefined,
    activeTeachingSubtopicId:
      typeof candidate.activeTeachingSubtopicId === "string"
        ? candidate.activeTeachingSubtopicId
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
