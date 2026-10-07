"use client";

import { useState } from "react";
import { DesignWorksheet } from "@/app/actions/ai/design-worksheet";
import { Palette, RotateCcw, Sparkles, WandSparkles } from "lucide-react";

import type { WorksheetDesign } from "@/lib/ai/worksheet/worksheet-design";


interface AssessmentDesignPanelProps {
  value: WorksheetDesign;
  resourceLabel?: string;
  onChange: (value: WorksheetDesign) => void;
  onReset: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b pb-5 last:border-b-0 last:pb-0">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border bg-background px-2.5 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function AssessmentDesignPanel({
  value,
  resourceLabel = "assessment",
  onChange,
  onReset,
}: AssessmentDesignPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function handleAiDesign(request = prompt) {
    const text = request.trim();
    if (!text || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await DesignWorksheet({ current: value, prompt: text });
      if (!result.success || !result.design) throw new Error(result.error || "Unable to generate the design.");
      onChange(result.design);
      setPrompt("");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to generate the design.");
    } finally {
      setAiLoading(false);
    }
  }

  function update<K extends keyof WorksheetDesign>(key: K, next: WorksheetDesign[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Palette className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold">Design {resourceLabel}</h2>
            <p className="text-[11px] text-muted-foreground">
              Style the page without changing your assessment questions or content.
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="space-y-6">
          <Section title="Template">
            <SelectField
              label="Visual style"
              value={value.template}
              onChange={(next) => update("template", next as WorksheetDesign["template"])}
              options={[
                { value: "classic", label: "Classic — clean classroom" },
                { value: "modern", label: "Modern — polished SaaS" },
                { value: "playful", label: "Playful — younger learners" },
                { value: "assessment", label: "Assessment — test-ready" },
              ]}
            />
          </Section>

          <Section title="Layout">
            <SelectField
              label="Question density"
              value={value.density}
              onChange={(next) => update("density", next as WorksheetDesign["density"])}
              options={[
                { value: "compact", label: "Compact" },
                { value: "comfortable", label: "Comfortable" },
                { value: "spacious", label: "Spacious" },
              ]}
            />
            <SelectField
              label="Question layout"
              value={value.questionLayout}
              onChange={(next) => update("questionLayout", next as WorksheetDesign["questionLayout"])}
              options={[
                { value: "single", label: "Single column" },
                { value: "two-column", label: "Two columns" },
              ]}
            />
            <SelectField
              label="Answer space"
              value={value.answerSpace}
              onChange={(next) => update("answerSpace", next as WorksheetDesign["answerSpace"])}
              options={[
                { value: "small", label: "Small" },
                { value: "medium", label: "Medium" },
                { value: "large", label: "Large" },
              ]}
            />
          </Section>

          <Section title="Header">
            <SelectField
              label="Title treatment"
              value={value.titleStyle}
              onChange={(next) => update("titleStyle", next as WorksheetDesign["titleStyle"])}
              options={[
                { value: "boxed", label: "Designed box" },
                { value: "underline", label: "Underline" },
                { value: "plain", label: "Simple" },
              ]}
            />
            <SelectField
              label="Student fields"
              value={value.headerFields}
              onChange={(next) => update("headerFields", next as WorksheetDesign["headerFields"])}
              options={[
                { value: "all", label: "Name + Date + Score" },
                { value: "name-date", label: "Name + Date" },
                { value: "name-date-score", label: "Name + Date + Score" },
              ]}
            />
          </Section>

          <Section title="Colors">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold">Accent</span>
                <div className="flex h-9 items-center gap-2 rounded-lg border bg-background px-2">
                  <input
                    type="color"
                    value={value.accentColor}
                    onChange={(event) => update("accentColor", event.target.value)}
                    className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {value.accentColor}
                  </span>
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold">Border</span>
                <div className="flex h-9 items-center gap-2 rounded-lg border bg-background px-2">
                  <input
                    type="color"
                    value={value.borderColor}
                    onChange={(event) => update("borderColor", event.target.value)}
                    className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {value.borderColor}
                  </span>
                </div>
              </label>
            </div>
          </Section>

          <Section title="Decorations">
            <SelectField
              label="Page decoration"
              value={value.decorations}
              onChange={(next) => update("decorations", next as WorksheetDesign["decorations"])}
              options={[
                { value: "none", label: "None — printer friendly" },
                { value: "minimal", label: "Minimal" },
                { value: "playful", label: "Playful" },
              ]}
            />
          </Section>

          <Section title="AI Design Assistant">
            <div className="rounded-xl border bg-primary/[0.04] p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">Describe the look you want</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    Justdy AI changes the design settings without touching your assessment questions.
                  </p>
                </div>
              </div>
              <textarea
                value={prompt}
                onChange={(event) => { setPrompt(event.target.value); setAiError(null); }}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    void handleAiDesign();
                  }
                }}
                placeholder="e.g. Make it fun for kindergarten"
                maxLength={500}
                rows={3}
                className="mt-3 w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">⌘/Ctrl + Enter</span>
                <button
                  type="button"
                  onClick={() => void handleAiDesign()}
                  disabled={!prompt.trim() || aiLoading}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11px] font-semibold text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {aiLoading ? <RotateCcw className="h-3 w-3 animate-spin" /> : <WandSparkles className="h-3 w-3" />}
                  {aiLoading ? "Designing..." : "Apply with AI"}
                </button>
              </div>
              {aiError && <p className="mt-2 text-[11px] leading-4 text-destructive">{aiError}</p>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                ["Kindergarten", "Make it fun and colorful for kindergarten"],
                ["Professional test", "Make it look like a professional standardized test"],
                ["Minimal", "Make it clean, minimal, and printer friendly"],
                ["Playful", "Make it playful and engaging for young learners"],
              ].map(([label, request]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => void handleAiDesign(request)}
                  disabled={aiLoading}
                  className="rounded-full border bg-background px-2.5 py-1.5 text-[10px] font-semibold transition hover:bg-muted disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
            </div>
          </Section>
        </div>
      </div>

      <div className="border-t bg-muted/20 p-4">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border bg-background text-xs font-semibold transition hover:bg-muted"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset design
        </button>
      </div>
    </div>
  );
}
