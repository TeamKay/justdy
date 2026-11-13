
"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Heading,
  HelpCircle,
  Plus,
  Sigma,
  Trash2,
  Type,
} from "lucide-react";

import {
  createSocialPostBlockDocument,
  parseSocialPostBlockDocument,
  type SocialPostBlock,
  type SocialPostBlockType,
} from "@/lib/social/post-blocks";

type Props = {
  value: string;
  onChange: (value: string, characterCount: number) => void;
  disabled?: boolean;
  maxLength?: number;
};

const BLOCK_OPTIONS: {
  type: Exclude<SocialPostBlockType, "image">;
  label: string;
  icon: typeof Type;
  description: string;
}[] = [
  {
    type: "heading",
    label: "Heading",
    icon: Heading,
    description: "Add a section title",
  },
  {
    type: "text",
    label: "Text block",
    icon: Type,
    description: "Add another text section",
  },
  {
    type: "question",
    label: "Question",
    icon: HelpCircle,
    description: "Highlight a question",
  },
  {
    type: "answer",
    label: "Answer",
    icon: Check,
    description: "Show a solution or explanation",
  },
  {
    type: "equation",
    label: "Equation",
    icon: Sigma,
    description: "Add a mathematical expression",
  },
];

const DEFAULT_PLACEHOLDERS: Record<SocialPostBlockType, string> = {
  heading: "Enter a heading...",
  text: "Write your text...",
  question: "Write your question...",
  answer: "Write your answer or solution...",
  equation: "Enter an expression, e.g. 2x + 5 = 15",
  image: "",
};

function getBlockText(block: SocialPostBlock): string {
  if (typeof block.content === "string") {
    return block.content;
  }

  function extract(value: unknown): string {
    if (!value || typeof value !== "object") return "";

    const node = value as {
      type?: string;
      text?: string;
      content?: unknown[];
    };

    if (node.type === "text") return node.text ?? "";
    if (!Array.isArray(node.content)) return "";

    return node.content.map(extract).join("");
  }

  return extract(block.content);
}

function getCharacterCount(blocks: SocialPostBlock[]): number {
  return blocks
    .filter((block) => block.type !== "image")
    .reduce((total, block) => total + getBlockText(block).length, 0);
}

function makeBlock(type: SocialPostBlockType): SocialPostBlock {
  return {
    id: crypto.randomUUID(),
    type,
    content: "",
    alignment: "left",
    width: "full",
  };
}

export default function SocialPostBlockEditor({
  value,
  onChange,
  disabled = false,
  maxLength = 3000,
}: Props) {
  const document = parseSocialPostBlockDocument(value);
  const blocks = document?.blocks ?? [];
  const characterCount = getCharacterCount(blocks);
  const remaining = Math.max(0, maxLength - characterCount);

  function publishBlocks(nextBlocks: SocialPostBlock[]) {
    const nextDocument = createSocialPostBlockDocument(nextBlocks);

    onChange(
      JSON.stringify(nextDocument),
      getCharacterCount(nextBlocks),
    );
  }

  function addBlock(type: SocialPostBlockType) {
  const nextBlocks = [...blocks];

  if (nextBlocks.length === 0) {
    nextBlocks.push(makeBlock("text"));
  }

  nextBlocks.push(makeBlock(type));
  publishBlocks(nextBlocks);
}

  function updateBlock(
    blockId: string,
    changes: Partial<SocialPostBlock>,
  ) {
    const nextBlocks = blocks.map((block) =>
      block.id === blockId ? { ...block, ...changes } : block,
    );

    publishBlocks(nextBlocks);
  }

  function removeBlock(blockId: string) {
    publishBlocks(blocks.filter((block) => block.id !== blockId));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const nextBlocks = [...blocks];

    [nextBlocks[index], nextBlocks[targetIndex]] = [
      nextBlocks[targetIndex],
      nextBlocks[index],
    ];

    publishBlocks(nextBlocks);
  }

  function updateDefaultText(text: string) {
    publishBlocks([
      {
        id: "default-text",
        type: "text",
        content: text,
        alignment: "left",
        width: "full",
      },
    ]);
  }

  function getAvailableLength(block: SocialPostBlock) {
    const otherCharacters = blocks
      .filter((item) => item.id !== block.id && item.type !== "image")
      .reduce((total, item) => total + getBlockText(item).length, 0);

    return Math.max(0, maxLength - otherCharacters);
  }

  return (
    <div className="space-y-3">
      {/* Normal post writing area */}
      {blocks.length === 0 ? (
        <textarea
          value=""
          onChange={(event) => updateDefaultText(event.target.value)}
          disabled={disabled}
          maxLength={maxLength}
          rows={5}
          placeholder="What's on your mind? Share an idea, explanation, or learning experience..."
          aria-label="Write your post"
          className="w-full resize-y border-0 bg-transparent px-1 py-3 text-[15px] leading-7 text-[#243B2E] outline-none placeholder:text-[#A0AAA2] focus:ring-0 disabled:opacity-50"
        />
      ) : (
        <div className="space-y-2">
          {blocks.map((block, index) => {
            const option = BLOCK_OPTIONS.find(
              (item) => item.type === block.type,
            );

            const Icon = option?.icon ?? Type;
            const blockText = getBlockText(block);

            return (
              <section
                key={block.id}
                className="overflow-hidden rounded-xl border border-[#E5EAE3] bg-white"
              >
                {/* Compact block toolbar */}
                <div className="flex items-center justify-between gap-2 border-b border-[#EDF0EB] bg-[#FAFBF9] px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-[#52745D]" />
                    <span className="text-xs font-semibold text-[#345342]">
                      {option?.label ?? block.type}
                    </span>
                    <span className="text-[11px] text-[#9AA49B]">
                      {index + 1}/{blocks.length}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      title="Move block up"
                      aria-label={`Move block ${index + 1} up`}
                      disabled={disabled || index === 0}
                      onClick={() => moveBlock(index, -1)}
                      className="rounded-md p-1.5 text-[#718078] hover:bg-[#EAF1EB] disabled:opacity-25"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      title="Move block down"
                      aria-label={`Move block ${index + 1} down`}
                      disabled={disabled || index === blocks.length - 1}
                      onClick={() => moveBlock(index, 1)}
                      className="rounded-md p-1.5 text-[#718078] hover:bg-[#EAF1EB] disabled:opacity-25"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      title="Remove block"
                      aria-label={`Remove block ${index + 1}`}
                      disabled={disabled}
                      onClick={() => removeBlock(block.id)}
                      className="rounded-md p-1.5 text-[#C44B55] hover:bg-red-50 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Block writing area */}
                <div className="p-3">
                  <textarea
                    value={blockText}
                    onChange={(event) =>
                      updateBlock(block.id, {
                        content: event.target.value,
                      })
                    }
                    disabled={disabled}
                    maxLength={getAvailableLength(block)}
                    rows={block.type === "heading" ? 2 : 3}
                    placeholder={DEFAULT_PLACEHOLDERS[block.type]}
                    aria-label={`${option?.label ?? block.type} content`}
                    className={`w-full resize-y rounded-lg border border-[#E8ECE7] bg-white p-3 text-sm leading-6 text-[#243B2E] outline-none transition placeholder:text-[#A0AAA2] focus:border-[#8EAD91] focus:ring-2 focus:ring-[#8EAD91]/15 disabled:bg-[#F5F7F5] ${
                      block.type === "heading"
                        ? "text-lg font-bold"
                        : block.type === "equation"
                          ? "font-mono"
                          : ""
                    }`}
                  />

                  {/* Optional advanced controls */}
                  <details className="group mt-2">
                    <summary className="flex cursor-pointer list-none items-center gap-1.5 py-1 text-[11px] font-medium text-[#819087] hover:text-[#345342]">
                      <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                      Advanced settings
                    </summary>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#F8FAF7] p-2.5">
                      <div className="flex items-center gap-1">
                        <span className="mr-1 text-[11px] text-[#87938A]">
                          Align
                        </span>

                        {(
                          [
                            ["left", AlignLeft],
                            ["center", AlignCenter],
                            ["right", AlignRight],
                          ] as const
                        ).map(([alignment, AlignmentIcon]) => (
                          <button
                            key={alignment}
                            type="button"
                            disabled={disabled}
                            title={`Align ${alignment}`}
                            aria-label={`Align ${alignment}`}
                            aria-pressed={
                              (block.alignment ?? "left") === alignment
                            }
                            onClick={() =>
                              updateBlock(block.id, { alignment })
                            }
                            className={`rounded-md p-1.5 ${
                              (block.alignment ?? "left") === alignment
                                ? "bg-[#E3EEE4] text-[#245B3F]"
                                : "text-[#87938A] hover:bg-[#EDF2EC]"
                            } disabled:opacity-40`}
                          >
                            <AlignmentIcon className="h-4 w-4" />
                          </button>
                        ))}
                      </div>

                      <label className="flex items-center gap-2 text-[11px] text-[#87938A]">
                        Width
                        <select
                          value={block.width ?? "full"}
                          disabled={disabled}
                          onChange={(event) =>
                            updateBlock(block.id, {
                              width: event.target.value as
                                | "small"
                                | "medium"
                                | "full",
                            })
                          }
                          className="rounded-md border border-[#DCE6DC] bg-white px-2 py-1.5 text-xs text-[#345342] outline-none focus:border-[#8EAD91]"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="full">Full width</option>
                        </select>
                      </label>
                    </div>
                  </details>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Optional content dropdown */}
      <details className="group relative">
        <summary
          className={`flex cursor-pointer list-none items-center justify-between rounded-lg border border-[#E3EAE3] bg-[#F8FAF7] px-3 py-2.5 transition hover:border-[#C8D8C9] ${
            disabled ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-[#345342]">
            <Plus className="h-4 w-4" />
            Add special content
          </span>

          <ChevronDown className="h-4 w-4 text-[#718078] transition group-open:rotate-180" />
        </summary>

        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-[#E5EAE3] bg-white p-2 shadow-sm sm:grid-cols-3">
          {BLOCK_OPTIONS.map(({ type, label, icon: Icon, description }) => (
            <button
              key={type}
              type="button"
              disabled={disabled || remaining === 0}
              onClick={() => addBlock(type)}
              className="flex min-w-0 items-center gap-2 rounded-lg border border-transparent p-2 text-left transition hover:border-[#DCE6DC] hover:bg-[#F5F8F4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon className="h-4 w-4 shrink-0 text-[#52745D]" />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-[#345342]">
                  {label}
                </span>
                <span className="block truncate text-[10px] text-[#87938A]">
                  {description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </details>

      {/* Character count */}
      <div className="flex justify-end text-[11px] text-[#87938A]">
        {characterCount}/{maxLength}
      </div>
    </div>
  );
}
