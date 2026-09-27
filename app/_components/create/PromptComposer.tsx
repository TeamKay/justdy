"use client";

import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function PromptComposer({
  prompt,
  onPromptChange,
  onGenerate,
  placeholder,
  disabled = false,
  toolbar,
}: {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  placeholder: string;
  disabled?: boolean;
  toolbar?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111214]/90 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <textarea
        autoFocus
        value={prompt}
        disabled={disabled}
        onChange={(event) => onPromptChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onGenerate();
          }
        }}
        placeholder={placeholder}
        rows={5}
        className="block min-h-[150px] w-full resize-none border-0 bg-transparent px-5 py-5 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:text-[15px]"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 flex-wrap gap-2">{toolbar}</div>
        <button
          type="button"
          disabled={disabled || !prompt.trim()}
          onClick={onGenerate}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-semibold text-black shadow-lg transition hover:bg-white/90 disabled:pointer-events-none disabled:opacity-30"
        >
          <Sparkles className="size-3.5" />
          Generate
        </button>
      </div>
    </div>
  );
}
