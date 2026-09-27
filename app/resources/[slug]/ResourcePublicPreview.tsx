"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Eye } from "lucide-react";

type PreviewQuestion = {
  id?: string;
  number?: number;
  type?: string;
  question?: string;
  options?: { id?: string; text?: string }[] | null;
  points?: number;
};

type PreviewContent = {
  instructions?: string;
  questions?: PreviewQuestion[];
  sections?: { title?: string; description?: string }[];
  pages?: unknown[];
};

interface ResourcePublicPreviewProps {
  type: string;
  content: unknown;
}

function normalizeContent(value: unknown): PreviewContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as PreviewContent;
}

function questionTypeLabel(type?: string) {
  return (type ?? "question")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ResourcePublicPreview({
  type,
  content: rawContent,
}: ResourcePublicPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const content = normalizeContent(rawContent);
  const questions = Array.isArray(content.questions) ? content.questions : [];
  const visibleQuestions = expanded ? questions.slice(0, 12) : questions.slice(0, 3);
  const hasMore = questions.length > 3;

  if (questions.length === 0 && !content.instructions && !content.sections?.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Eye className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Resource preview</h2>
            <p className="text-sm text-slate-500">Open the resource to view the complete content.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Preview</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              {type === "WORKSHEET" ? "Worksheet preview" : "Resource preview"}
            </h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Answers hidden
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {content.instructions && (
          <div className="mb-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Instructions</div>
            {content.instructions}
          </div>
        )}

        {visibleQuestions.length > 0 && (
          <div className="space-y-4">
            {visibleQuestions.map((item, index) => (
              <article key={item.id ?? `${item.number ?? index + 1}`} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                <div className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">
                    {item.number ?? index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {item.type && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                          {questionTypeLabel(item.type)}
                        </span>
                      )}
                      {typeof item.points === "number" && (
                        <span className="text-[11px] font-medium text-slate-400">
                          {item.points} {item.points === 1 ? "point" : "points"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium leading-6 text-slate-900 sm:text-[15px]">
                      {item.question || "Question"}
                    </p>

                    {Array.isArray(item.options) && item.options.length > 0 && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {item.options.map((option, optionIndex) => (
                          <div key={option.id ?? optionIndex} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600">
                            <span className="mr-2 font-semibold text-slate-400">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            {option.text || "Option"}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {content.sections && content.sections.length > 0 && questions.length === 0 && (
          <div className="space-y-3">
            {content.sections.slice(0, 6).map((section, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">{section.title || `Section ${index + 1}`}</h3>
                {section.description && <p className="mt-1 text-sm leading-6 text-slate-500">{section.description}</p>}
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {expanded ? "Show less" : `Preview more (${Math.min(questions.length, 12) - 3} more)`}
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        )}

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Answer keys and creator-only information are intentionally hidden from the public preview.
        </p>
      </div>
    </section>
  );
}
