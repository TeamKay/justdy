import type { TeachingSection, TeachingTemplate } from "../types/whiteboard";

export const DEFAULT_TEACHING_LESSON_ID = "default-teaching-lesson";
export const DEFAULT_TEACHING_SUBTOPIC_ID = "default-teaching-subtopic";

export const TEACHING_SECTIONS: Record<TeachingSection, string> = {
  introduction: "Introduction",
  definitions: "Definitions",
  concepts: "Key Concepts",
  rules: "Rules & Algorithms",
  examples: "Worked Examples",
  practice: "Practice & Review",
};

export function getDefaultTeachingSection(template: TeachingTemplate): TeachingSection {
  if (template === "definition") return "definitions";
  if (template === "key-concept") return "concepts";
  if (template === "important-rule" || template === "algorithm") return "rules";
  if (template === "worked-example") return "examples";
  return "practice";
}

export const TEACHING_TEMPLATES: Record<
  TeachingTemplate,
  { label: string; eyebrow: string; accent: string; tint: string; heading: string; placeholder: string }
> = {
  definition: {
    label: "Definition",
    eyebrow: "LEARN THE MEANING",
    accent: "#2563eb",
    tint: "#eff6ff",
    heading: "Definition",
    placeholder: "Explain the meaning of the term...",
  },
  "key-concept": {
    label: "Key Concept",
    eyebrow: "CORE IDEA",
    accent: "#7c3aed",
    tint: "#f5f3ff",
    heading: "Key Concept",
    placeholder: "Describe the main idea students should understand...",
  },
  "important-rule": {
    label: "Important Rule",
    eyebrow: "REMEMBER THIS RULE",
    accent: "#d97706",
    tint: "#fffbeb",
    heading: "Important Rule",
    placeholder: "Write the rule and explain when it applies...",
  },
  algorithm: {
    label: "Algorithm",
    eyebrow: "FOLLOW THESE STEPS",
    accent: "#0f766e",
    tint: "#f0fdfa",
    heading: "Algorithm",
    placeholder: "List the ordered steps students should follow...",
  },
  "worked-example": {
    label: "Worked Example",
    eyebrow: "STEP-BY-STEP",
    accent: "#059669",
    tint: "#ecfdf5",
    heading: "Worked Example",
    placeholder: "Enter the problem or question students will solve...",
  },
  remember: {
    label: "Remember",
    eyebrow: "QUICK REMINDER",
    accent: "#e11d48",
    tint: "#fff1f2",
    heading: "Remember",
    placeholder: "Write the important point students should not forget...",
  },
  "quick-question": {
    label: "Quick Question",
    eyebrow: "CHECK YOUR UNDERSTANDING",
    accent: "#0891b2",
    tint: "#ecfeff",
    heading: "Quick Question",
    placeholder: "Write a question for students to answer...",
  },
};
