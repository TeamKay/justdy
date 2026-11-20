import type { ReactNode } from "react";
import { parseSocialPostContent } from "@/lib/social/rich-text";
import { parseSocialPostBlockDocument } from "@/lib/social/post-blocks";

type RichNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{
    type?: string;
    attrs?: Record<string, unknown>;
  }>;
  content?: RichNode[];
};

function safeLink(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (
      (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username &&
      !url.password
    ) {
      return url.href;
    }

    if (url.protocol === "mailto:") {
      return url.href;
    }
  } catch {
    return null;
  }

  return null;
}

function renderMarks(
  content: ReactNode,
  marks: RichNode["marks"],
  key: string,
): ReactNode {
  let result = content;

  for (const mark of marks ?? []) {
    switch (mark.type) {
      case "bold":
        result = <strong key={`${key}-bold`}>{result}</strong>;
        break;

      case "italic":
        result = <em key={`${key}-italic`}>{result}</em>;
        break;

      case "strike":
        result = <s key={`${key}-strike`}>{result}</s>;
        break;

      case "code":
        result = (
          <code
            key={`${key}-code`}
            className="rounded bg-[#EAF1EB] px-1 py-0.5 text-[0.9em]"
          >
            {result}
          </code>
        );
        break;

      case "link": {
        const href = safeLink(mark.attrs?.href);

        if (href) {
          const isEmailLink = href.startsWith("mailto:");

          result = (
            <a
              key={`${key}-link`}
              href={href}
              target={isEmailLink ? undefined : "_blank"}
              rel={isEmailLink ? undefined : "noopener noreferrer"}
              className="inline break-all font-semibold text-[#315B8A] underline decoration-[#A8BDD0] decoration-1 underline-offset-4 transition-colors hover:text-[#173B2F] hover:decoration-[#173B2F] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#52745D]"
            >
              {result}
            </a>
          );
        }

        break;
      }
    }
  }

  return result;
}

function renderNode(
  node: RichNode,
  key: string,
  preview = false,
  hideInlineImages = false,
): ReactNode {
  if (node.type === "text") {
    return renderMarks(node.text ?? "", node.marks, key);
  }

  if (node.type === "hardBreak") {
    return <br key={key} />;
  }

  const children = (node.content ?? []).map((child, index) =>
    renderNode(child, `${key}-${index}`, preview, hideInlineImages),
  );

  switch (node.type) {
    case "socialPostImage": {
      // Feed previews render all post images together in the compact gallery.
      // The full post page leaves this disabled so inline images retain their
      // original position between text blocks.
      if (hideInlineImages) return null;

      const mediaId = node.attrs?.mediaId;
      const storedSrc = node.attrs?.src;
      const src =
        typeof mediaId === "string" && mediaId
          ? `/api/storage/media/${encodeURIComponent(mediaId)}`
          : typeof storedSrc === "string" && storedSrc.startsWith("https://")
            ? storedSrc
            : null;

      if (!src) return null;

      return (
        <figure key={key} className={`flex w-full justify-center ${preview ? "my-2 max-h-45 overflow-hidden rounded-lg bg-[#F4F7F3]" : "my-5"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={typeof node.attrs?.alt === "string" ? node.attrs.alt : ""}
            loading="lazy"
            className={`h-auto max-w-full rounded-lg object-contain ${preview ? "max-h-42.5" : "max-h-140"}`}
          />
        </figure>
      );
    }

    case "doc":
      return <div key={key}>{children}</div>;

    case "paragraph": {
      const contentType = node.attrs?.contentType;
      const alignment = getTextAlignment(node);

      if (contentType === "question") {
        return (
          <div
            key={key}
            className="my-4 rounded-lg border border-[#DCE8F1] bg-[#F2F7FC] px-4 py-3.5 first:mt-0 last:mb-0"
            style={{ textAlign: alignment }}
          >
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#52789C]">
              Question
            </p>
            <div className={`font-semibold leading-relaxed text-[#294B68] ${preview ? "line-clamp-3" : ""}`}>
              {children}
            </div>
          </div>
        );
      }

      if (contentType === "answer") {
        return (
          <div
            key={key}
            className="my-4 rounded-lg border border-[#D9E8DC] bg-[#F2F8F2] px-4 py-3.5 first:mt-0 last:mb-0"
            style={{ textAlign: alignment }}
          >
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#52745D]">
              Answer
            </p>
            <div className={`leading-relaxed text-[#294333] ${preview ? "line-clamp-3" : ""}`}>{children}</div>
          </div>
        );
      }

      if (contentType === "equation") {
        return (
          <div
            key={key}
            className="my-4 overflow-x-auto rounded-lg border border-[#E3E6EA] bg-[#F7F8FA] px-4 py-3.5 first:mt-0 last:mb-0"
            style={{ textAlign: alignment }}
          >
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#87938A]">
              Mathematical expression
            </p>
            <div className={`whitespace-pre-wrap break-words font-mono text-[14px] font-semibold leading-relaxed text-[#244B39] sm:text-[15px] ${preview ? "line-clamp-3" : ""}`}>
              {children}
            </div>
          </div>
        );
      }

      return (
  <p
    key={key}
   className={`my-0 leading-normal first:mt-0 last:mb-0 sm:leading-[1.55] ${preview ? "line-clamp-4" : ""}`}
    style={{ textAlign: alignment }}
  >
    {children}
  </p>
);
    }

    case "heading": {
      const level = node.attrs?.level;

      if (level === 2) {
        return (
          <h2
            key={key}
            className={`mb-4 mt-6 text-xl font-bold leading-tight tracking-tight text-[#173B2F] first:mt-0 sm:text-2xl ${preview ? "line-clamp-2" : ""}`}
            style={{ textAlign: getTextAlignment(node) }}
          >
            {children}
          </h2>
        );
      }

      return (
        <h3
          key={key}
          className={`mb-3 mt-5 text-lg font-semibold leading-snug text-[#244B39] first:mt-0 sm:text-xl ${preview ? "line-clamp-2" : ""}`}
          style={{ textAlign: getTextAlignment(node) }}
        >
          {children}
        </h3>
      );
    }

    case "bulletList":
      return (
        <ul
          key={key}
          className="my-4 list-disc space-y-2 pl-6 marker:text-[#52745D]"
        >
          {children}
        </ul>
      );

    case "orderedList":
      return (
        <ol
          key={key}
          className="my-4 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-[#52745D]"
        >
          {children}
        </ol>
      );

    case "listItem":
      return <li key={key}>{children}</li>;

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="my-5 rounded-r-xl border-l-4 border-[#52745D] bg-[#F3F7F2] px-4 py-3 italic leading-relaxed text-[#52675A] sm:px-5"
        >
          {children}
        </blockquote>
      );

    case "horizontalRule":
      return <hr key={key} className="my-4 border-[#E5EAE3]" />;

    default:
      return <span key={key}>{children}</span>;
  }
}

function getTextAlignment(
  node: RichNode,
): "left" | "center" | "right" | "justify" | undefined {
  const alignment = node.attrs?.textAlign;

  if (
    alignment === "left" ||
    alignment === "center" ||
    alignment === "right" ||
    alignment === "justify"
  ) {
    return alignment;
  }

  return undefined;
}

function renderBlockContent(content: unknown, key: string, preview: boolean): ReactNode {
  if (typeof content === "string") {
    return content;
  }

  if (!content || typeof content !== "object") {
    return null;
  }

  return renderNode(content as RichNode, key, preview);
}

function StructuredPostContent({ content, preview }: { content: string; preview: boolean }) {
  const document = parseSocialPostBlockDocument(content);

  if (!document) return null;

  return (
    <div className="space-y-3">
      {document.blocks.map((block) => {
        if (block.type === "image") {
          return null;
        }

        const alignment = block.alignment ?? "left";

        const widthClass =
          block.width === "small"
            ? "max-w-[260px]"
            : block.width === "medium"
              ? "max-w-[440px]"
              : "max-w-full";

        const alignmentClass =
          alignment === "center"
            ? "mx-auto"
            : alignment === "right"
              ? "ml-auto"
              : "";

        const content = renderBlockContent(
          block.content,
          `structured-block-${block.id}`,
          preview,
        );

        const alignmentStyle = { textAlign: alignment } as const;

        switch (block.type) {
          case "heading":
            return (
              <h2
                key={block.id}
                className={`${widthClass} ${alignmentClass} text-xl font-bold leading-tight tracking-tight text-[#173B2F] sm:text-2xl ${preview ? "line-clamp-2" : ""}`}
                style={alignmentStyle}
              >
                {content}
              </h2>
            );

          case "question":
            return (
              <div
                key={block.id}
                className={`${widthClass} ${alignmentClass} rounded-xl border border-[#DCE8F1] bg-[#F2F7FC] p-4 ${preview ? "max-h-[150px] overflow-hidden" : ""}`}
                style={alignmentStyle}
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#52789C]">
                  Question
                </p>
                <div className={`font-semibold leading-relaxed text-[#294B68] ${preview ? "line-clamp-3" : ""}`}>
                  {content}
                </div>
              </div>
            );

          case "answer":
            return (
              <div
                key={block.id}
                className={`${widthClass} ${alignmentClass} rounded-xl border border-[#D9E8DC] bg-[#F2F8F2] p-4 ${preview ? "max-h-[150px] overflow-hidden" : ""}`}
                style={alignmentStyle}
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#52745D]">
                  Answer
                </p>
                <div className={`leading-relaxed text-[#294333] ${preview ? "line-clamp-3" : ""}`}>
                  {content}
                </div>
              </div>
            );

          case "equation":
            return (
              <div
                key={block.id}
                className={`${widthClass} ${alignmentClass} overflow-x-auto rounded-xl border border-[#E3E6EA] bg-[#F7F8FA] p-4 ${preview ? "max-h-[150px] overflow-hidden" : ""}`}
                style={alignmentStyle}
              >
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#87938A]">
                  Mathematical expression
                </div>
                <div className={`whitespace-pre-wrap break-words font-mono text-base font-semibold leading-relaxed text-[#244B39] ${preview ? "line-clamp-3" : ""}`}>
                  {content}
                </div>
              </div>
            );

          case "text":
            return (
              <div
                key={block.id}
                className={`${widthClass} ${alignmentClass} whitespace-pre-wrap break-words leading-[1.85] text-[#344D40] sm:leading-[1.9] ${preview ? "line-clamp-4" : ""}`}
                style={alignmentStyle}
              >
                {content}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

export default function SocialPostContent({
  content,
  className = "",
  preview = false,
  hideInlineImages = false,
}: {
  content: string;
  className?: string;
  preview?: boolean;
  hideInlineImages?: boolean;
}) {
  const blockDocument = parseSocialPostBlockDocument(content);

  return (
    <div
      className={`relative min-w-0 max-w-full wrap-break-word text-[14px] leading-[1.85] text-[#344D40] sm:text-[15px] sm:leading-[1.9] ${preview ? "max-h-[340px] overflow-hidden" : ""} ${className}`}
    >
      {blockDocument ? (
        <StructuredPostContent content={content} preview={preview} />
      ) : (
        renderNode(
          parseSocialPostContent(content),
          "post-content",
          preview,
          hideInlineImages,
        )
      )}
    </div>
  );
}
