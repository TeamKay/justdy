
export type PostBlockRichTextContent = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{
    type: string;
    attrs?: Record<string, unknown>;
  }>;
  content?: PostBlockRichTextContent[];
};

export type SocialPostBlockType =
  | "heading"
  | "text"
  | "image"
  | "question"
  | "answer"
  | "equation";

export type SocialPostBlock = {
  id: string;
  type: SocialPostBlockType;
content?: string | PostBlockRichTextContent;
  mediaId?: string;
  alignment?: "left" | "center" | "right";
  width?: "small" | "medium" | "full";
};

export type SocialPostBlockDocument = {
  type: "justdy-post";
  version: 1;
  blocks: SocialPostBlock[];
};

const BLOCK_TYPES: SocialPostBlockType[] = [
  "heading",
  "text",
  "image",
  "question",
  "answer",
  "equation",
];

export function isSocialPostBlockDocument(
  value: unknown,
): value is SocialPostBlockDocument {
  if (!value || typeof value !== "object") return false;

  const document = value as Record<string, unknown>;

  if (
    document.type !== "justdy-post" ||
    document.version !== 1 ||
    !Array.isArray(document.blocks)
  ) {
    return false;
  }

  return document.blocks.every((item) => {
    if (!item || typeof item !== "object") return false;

    const block = item as Record<string, unknown>;

    return (
      typeof block.id === "string" &&
      block.id.length > 0 &&
      typeof block.type === "string" &&
      BLOCK_TYPES.includes(block.type as SocialPostBlockType)
    );
  });
}

export function parseSocialPostBlockDocument(
  value: string | null | undefined,
): SocialPostBlockDocument | null {
  if (!value?.trim()) return null;

  try {
    const parsed: unknown = JSON.parse(value);

    return isSocialPostBlockDocument(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function createSocialPostBlockDocument(
  blocks: SocialPostBlock[],
): SocialPostBlockDocument {
  return {
    type: "justdy-post",
    version: 1,
    blocks,
  };
}

function extractBlockText(content: unknown): string {
  if (typeof content === "string") return content;

  if (!content || typeof content !== "object") return "";

  const node = content as {
    type?: string;
    text?: string;
    content?: unknown[];
  };

  if (node.type === "text") return node.text ?? "";

  if (!Array.isArray(node.content)) return "";

  return node.content
    .map(extractBlockText)
    .filter(Boolean)
    .join(" ");
}

export function getSocialPostBlockText(
  document: SocialPostBlockDocument,
): string {
  return document.blocks
    .filter((block) => block.type !== "image")
    .map((block) => extractBlockText(block.content))
    .filter(Boolean)
    .join("\n");
}
