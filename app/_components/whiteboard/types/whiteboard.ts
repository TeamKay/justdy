export type Tool =
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

export type Point = {
  x: number;
  y: number;
};

export type StrokeElement = {
  id: string;
  type: "stroke";
  points: Point[];
  color: string;
  width: number;
  pressureSensitive: boolean;
};

export type ShapeType =
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
  | "axes";

export type ShapeElement = {
  id: string;
  type: ShapeType;
  start: Point;
  end: Point;
  color: string;
  width: number;
};

export type ImageElement = {
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

export type TeachingTemplate =
  | "definition"
  | "key-concept"
  | "important-rule"
  | "algorithm"
  | "worked-example"
  | "remember"
  | "quick-question";

export type TeachingSection = "introduction" | "definitions" | "concepts" | "rules" | "examples" | "practice";

export type TeachingSubtopic = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type TeachingLesson = {
  id: string;
  name: string;
  subtopics: TeachingSubtopic[];
  createdAt: string;
  updatedAt: string;
};

export type TeachingLibraryItem = {
  id: string;
  template: TeachingTemplate;
  heading: string;
  body: string;
  /** Preferred body font size when this material is placed on the board. */
  fontSize?: number;
  /** Optional ordered solution steps for worked examples. */
  steps?: string[];
  lessonId?: string;
  subtopicId?: string;
  section?: TeachingSection;
  order?: number;
  createdAt: string;
  updatedAt: string;
};

export type TextElement = {
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
  teachingTemplate?: TeachingTemplate;
  heading?: string;
  body?: string;
  cardEyebrow?: string;
  cardWidth?: number;
  cardHeight?: number;
  // Equations can be stretched independently in X/Y while selected.
  scaleX?: number;
  scaleY?: number;
};

export type WhiteboardElement =
  StrokeElement | ShapeElement | TextElement | ImageElement;

export type WhiteboardPage = {
  id: string;
  name: string;
  elements: WhiteboardElement[];
};

export type FormulaCategory =
  | "algebra"
  | "geometry"
  | "calculus"
  | "trigonometry"
  | "statistics"
  | "physics";

export type WhiteboardMode = "standalone" | "appointment" | "booking";

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
  teachingLibrary?: TeachingLibraryItem[];
  teachingLessons?: TeachingLesson[];
  activeTeachingLessonId?: string;
  activeTeachingSubtopicId?: string;
  savedAt?: string;
  /** Runtime-only realtime ordering metadata. */
  realtimeOriginId?: string;
  realtimeRevision?: number;
};

export type WhiteboardProps = {
  mode: WhiteboardMode;
  appointmentId?: string;
  bookingId?: string;
  /** Width reserved on the left for an optional participant rail. */
  leftInset?: number;
  /** Height reserved at the top for the Zoom-style participant filmstrip. */
  topInset?: number;
  onClose?: () => void;
  onRealtimeChange?: (data: WhiteboardRealtimeData) => void;
  onReady?: (data: WhiteboardRealtimeData) => void;
  remoteData?: WhiteboardRealtimeData | null;
};

export type SavedWhiteboardData = {
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
  teachingLibrary?: TeachingLibraryItem[];
  teachingLessons?: TeachingLesson[];
  activeTeachingLessonId?: string;
  activeTeachingSubtopicId?: string;
  savedAt?: string;
  realtimeOriginId?: string;
  realtimeRevision?: number;
};
