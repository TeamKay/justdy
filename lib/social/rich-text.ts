
import { parseSocialPostBlockDocument } from "./post-blocks";

type RichTextMark = {
  type?: string;
  attrs?: {
    href?: string;
    [key: string]: unknown;
  };
};

type RichTextNode = {
  type?: string;
  text?: string;
  content?: RichTextNode[];
  marks?: RichTextMark[];
};

type RichTextDocument = {
  type: "doc";
  content: RichTextNode[];
};

function isRichTextDocument(value: unknown): value is RichTextDocument {
  if (!value || typeof value !== "object") return false;

  const document = value as Record<string, unknown>;

  return (
    document.type === "doc" &&
    Array.isArray(document.content)
  );
}

/**
 * Converts legacy stored post content into a TipTap document.
 * Structured block documents are handled separately by the block renderer.
 */
export function parseSocialPostContent(
  value: string | null | undefined,
): RichTextDocument {
  if (!value?.trim()) {
    return {
      type: "doc",
      content: [{ type: "paragraph" }],
    };
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (isRichTextDocument(parsed)) {
      return parsed;
    }
  } catch {
    // Legacy plain-text content is handled below.
  }

  return {
    type: "doc",
    content: value.split("\n").map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    })),
  };
}

/**
 * Extracts readable text from TipTap JSON, structured blocks,
 * or legacy plain text.
 */
export function getSocialPostText(
  value: string | null | undefined,
): string {
  if (!value?.trim()) return "";

  const blockDocument = parseSocialPostBlockDocument(value);

  if (blockDocument) {
    return blockDocument.blocks
      .filter((block) => block.type !== "image")
      .map((block) => {
        if (typeof block.content === "string") {
          return block.content;
        }

        if (!block.content) return "";

        return extractRichTextNode(block.content);
      })
      .filter(Boolean)
      .join("\n");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return value;
  }

  if (!isRichTextDocument(parsed)) {
    return value;
  }

  return extractRichTextNode(parsed);
}

function extractRichTextNode(node: unknown): string {
  if (!node || typeof node !== "object") return "";

  const current = node as {
    type?: string;
    text?: string;
    content?: unknown[];
  };

  if (current.type === "text") {
    return current.text ?? "";
  }

  if (current.type === "hardBreak") {
    return "\n";
  }

  const children = current.content ?? [];
  const childTexts = children.map(extractRichTextNode);

  if (
    ["doc", "bulletList", "orderedList", "listItem", "blockquote"].includes(
      current.type ?? "",
    )
  ) {
    return childTexts.join("\n");
  }

  return childTexts.join("");
}

/**
 * Accepts only valid HTTP and HTTPS URLs.
 * Rejects credentials and unsupported protocols.
 */
function normalizeSocialPostUrl(value: string): string | null {
  const candidate = value.trim().replace(/[.,!?;:]+$/, "");

  if (!candidate) return null;

  try {
    const url = new URL(
      candidate.match(/^https?:\/\//i)
        ? candidate
        : `https://${candidate}`,
    );

    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

const plainUrlPattern =
  /(?:https?:\/\/|www\.)[^\s<>"']+|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s<>"']*)?/gi;

/**
 * Extracts URLs from:
 * - Legacy plain-text posts.
 * - TipTap JSON text and link marks.
 * - Structured post blocks, including text and equation blocks.
 *
 * Returns unique, valid HTTP/HTTPS URLs.
 */
export function extractSocialPostUrls(
  value: string | null | undefined,
): string[] {
  if (!value?.trim()) return [];

  const candidates: string[] = [];

  function collectTextUrls(text: string) {
    const matches = text.match(plainUrlPattern) ?? [];
    candidates.push(...matches);
  }

  function visitRichText(node: unknown) {
    if (!node || typeof node !== "object") return;

    const current = node as {
      type?: string;
      text?: string;
      marks?: RichTextMark[];
      content?: unknown[];
    };

    if (current.type === "text" && current.text) {
      collectTextUrls(current.text);

      for (const mark of current.marks ?? []) {
        if (mark.type === "link" && mark.attrs?.href) {
          candidates.push(mark.attrs.href);
        }
      }
    }

    for (const child of current.content ?? []) {
      visitRichText(child);
    }
  }

  const blockDocument = parseSocialPostBlockDocument(value);

  if (blockDocument) {
    for (const block of blockDocument.blocks) {
      if (block.type === "image" || !block.content) continue;

      if (typeof block.content === "string") {
        collectTextUrls(block.content);
      } else {
        visitRichText(block.content);
      }
    }
  } else {
    const document = parseSocialPostContent(value);

    for (const node of document.content) {
      visitRichText(node);
    }
  }

  const uniqueUrls = new Set<string>();

  for (const candidate of candidates) {
    const normalized = normalizeSocialPostUrl(candidate);

    if (normalized) {
      uniqueUrls.add(normalized);
    }
  }

  return Array.from(uniqueUrls);
}

export function getSocialPostInlineImageMediaIds(
  value: string | null | undefined,
): string[] {
  if (!value?.trim()) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    const ids = new Set<string>();

    function visit(node: unknown): void {
      if (!node || typeof node !== "object") return;

      const current = node as {
        type?: unknown;
        attrs?: { mediaId?: unknown };
        content?: unknown[];
      };

      if (
        current.type === "socialPostImage" &&
        typeof current.attrs?.mediaId === "string" &&
        current.attrs.mediaId
      ) {
        ids.add(current.attrs.mediaId);
      }

      current.content?.forEach(visit);
    }

    visit(parsed);
    return [...ids];
  } catch {
    return [];
  }
}