import type { CreationType } from "./creation-types";

const RULES: Array<{
  type: CreationType;
  patterns: RegExp[];
}> = [
  {
    type: "COLORING_PAGE",
    patterns: [
      /\bcoloring page\b/i,
      /\bcolouring page\b/i,
      /\bcoloring pages\b/i,
      /\bcolouring pages\b/i,
      /\bcoloring book\b/i,
      /\bcolouring book\b/i,
    ],
  },
  {
    type: "WORKBOOK",
    patterns: [
      /\bworkbook\b/i,
      /\bactivity book\b/i,
      /\blearning book\b/i,
      /\bstudy guide\b/i,
      /\brevision pack\b/i,
      /\bmulti[- ]page book\b/i,
    ],
  },
  {
    type: "WORKSHEET",
    patterns: [
      /\bworksheet\b/i,
      /\bworksheets\b/i,
      /\bpractice sheet\b/i,
      /\bpractice worksheet\b/i,
      /\bactivity sheet\b/i,
    ],
  },
  {
    type: "VIDEO",
    patterns: [
      /\bvideo\b/i,
      /\banimation\b/i,
      /\banimated lesson\b/i,
      /\bexplainer video\b/i,
    ],
  },
  {
    type: "IMAGE",
    patterns: [
      /\bimage\b/i,
      /\billustration\b/i,
      /\bvisual\b/i,
      /\bpicture\b/i,
      /\bposter\b/i,
      /\bdiagram\b/i,
      /\bthumbnail\b/i,
    ],
  },
];

export function detectCreationType(prompt: string): CreationType | null {
  const normalized = prompt.trim();
  if (!normalized) return null;

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.type;
    }
  }

  return null;
}
