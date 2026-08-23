"use client";

import createDOMPurify from "dompurify";

export function RichTextRenderer({ content }: { content: string | null }) {
  if (!content) {
    return null;
  }

  const DOMPurify =
    typeof window !== "undefined" ? createDOMPurify(window) : null;

  const sanitizedHTML = DOMPurify ? DOMPurify.sanitize(content) : content;

  return (
    <div
      className="prose prose-sm dark:prose-invert line-clamp-3 max-w-none"
      dangerouslySetInnerHTML={{
        __html: sanitizedHTML,
      }}
    />
  );
}
