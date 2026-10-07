export const CREATION_TYPES = [
  "COLORING_PAGE",
  "WORKSHEET",
  "WORKBOOK",
  "IMAGE",
  "VIDEO",
] as const;

export type CreationType = (typeof CREATION_TYPES)[number];

export const CREATION_TYPE_CONFIG: Record<
  CreationType,
  {
    label: string;
    description: string;
    credits: number;
  }
> = {
  COLORING_PAGE: {
    label: "Coloring Page",
    description: "Printable coloring artwork and themed page sets.",
    credits: 5,
  },
  WORKSHEET: {
    label: "Worksheet",
    description: "Structured classroom-ready practice material.",
    credits: 5,
  },
  WORKBOOK: {
    label: "Workbook",
    description: "A structured multi-page learning resource.",
    credits: 8,
  },
  IMAGE: {
    label: "Image",
    description: "Educational illustrations and visual assets.",
    credits: 5,
  },
  VIDEO: {
    label: "Video",
    description: "Educational videos and visual stories.",
    credits: 20,
  },
};

export function isCreationType(value: unknown): value is CreationType {
  return (
    typeof value === "string" &&
    (CREATION_TYPES as readonly string[]).includes(value)
  );
}
