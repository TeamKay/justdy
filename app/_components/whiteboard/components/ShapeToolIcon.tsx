import type { ShapeType } from "../types/whiteboard";

export default function ShapeToolIcon({ shape }: { shape: ShapeType }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (shape) {
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 19 19 5" />
          <path d="M10 5h9v9" />
        </svg>
      );
    case "line":
      return (
        <svg {...common}>
          <path d="M5 19 19 5" />
        </svg>
      );
    case "ellipse":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="12" rx="8.5" ry="5.5" />
        </svg>
      );
    case "rectangle":
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="12" />
        </svg>
      );
    case "circle":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
    case "triangle":
      return (
        <svg {...common}>
          <path d="m12 4 8 15H4L12 4Z" />
        </svg>
      );
    case "cube":
      return (
        <svg {...common}>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
          <path d="m8 5.25 8 4.5v9" />
        </svg>
      );
    case "cylinder":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="6" rx="7" ry="2.8" />
          <path d="M5 6v12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8V6" />
          <path d="M5 18c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8" />
        </svg>
      );
    case "diamond":
      return (
        <svg {...common}>
          <path d="m12 3 8 9-8 9-8-9 8-9Z" />
        </svg>
      );
    case "pentagon":
      return (
        <svg {...common}>
          <path d="m12 3 8 5.8-3.05 9.2h-9.9L4 8.8 12 3Z" />
        </svg>
      );
    case "hexagon":
      return (
        <svg {...common}>
          <path d="m7 4 10 0 5 8-5 8H7l-5-8 5-8Z" />
        </svg>
      );
    case "heptagon":
      return (
        <svg {...common}>
          <path d="M12 2.8 19.2 6l2 8-5 6.2H7.8l-5-6.2 2-8L12 2.8Z" />
        </svg>
      );
    case "octagon":
      return (
        <svg {...common}>
          <path d="m8 3 8 0 5 5v8l-5 5H8l-5-5V8l5-5Z" />
        </svg>
      );
    case "parallelogram":
      return (
        <svg {...common}>
          <path d="m7 5 14 0-4 14H3L7 5Z" />
        </svg>
      );
    case "sphere":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <ellipse cx="12" cy="12" rx="3.2" ry="8" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M4 12h16M12 4v16" />
          <path d="m19 9-3 3 3 3M9 5l3 3 3-3M5 15l3-3-3-3" />
        </svg>
      );
  }
}
