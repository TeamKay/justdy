
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Node, type Editor } from "@tiptap/core";
import Paragraph from "@tiptap/extension-paragraph";
import {
  useEditor,
  EditorContent,
  useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  Strikethrough,
  X,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Smile,
  ImagePlus,
  Video,
} from "lucide-react";

export type SocialPostContentType =
  | "text"
  | "heading"
  | "question"
  | "answer"
  | "equation";

type SocialRichTextEditorProps = {
  value: string;
  onChange: (value: string, characterCount: number) => void;
  disabled?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  showPlaceholder?: boolean;
  children?: React.ReactNode;
  onEditorReady?: (editor: Editor | null) => void;
  onContentTypeChange?: (type: SocialPostContentType) => void;
  onInlineImageUpload?: (file: File) => Promise<{ id: string; src: string }>;
  onVideoSelect?: (file: File) => void;
};

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
        active
          ? "bg-[#EAF1EB] text-[#173B2F]"
          : "text-[#64746A] hover:bg-[#F1F5F0] hover:text-[#173B2F]"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

type EditorJSONNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: EditorJSONNode[];
  [key: string]: unknown;
};

type EditorJSONDocument = {
  type: "doc";
  content: EditorJSONNode[];
};

function isEditorJSONDocument(value: unknown): value is EditorJSONDocument {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return candidate.type === "doc" && Array.isArray(candidate.content);
}

function restoreInlineImageUrls(node: EditorJSONNode): EditorJSONNode {
  const next: EditorJSONNode = { ...node };

  if (
    next.type === "socialPostImage" &&
    typeof next.attrs?.mediaId === "string"
  ) {
    next.attrs = {
      ...next.attrs,
      src: `/api/storage/media/${encodeURIComponent(next.attrs.mediaId)}`,
    };
  }

  if (Array.isArray(next.content)) {
    next.content = next.content.map(restoreInlineImageUrls);
  }

  return next;
}

function parseEditorContent(value: string): EditorJSONDocument {
  if (!value.trim()) {
    return {
      type: "doc",
      content: [{ type: "paragraph" }],
    };
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (isEditorJSONDocument(parsed)) {
      // Rebuild protected delivery URLs from media IDs when editing saved posts.
      return {
        type: "doc",
        content: parsed.content.map(restoreInlineImageUrls),
      };
    }
  } catch {
    // Existing plain-text posts are converted into paragraphs below.
  }

  return {
    type: "doc",
    content: value.split("\n").map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    })),
  };
}

const POST_EMOJIS = [
  "😀", "😂", "🥰", "😍", "😊", "😉",
  "🤔", "😎", "😭", "🔥", "❤️", "💯",
  "👏", "🙌", "🎉", "🥳", "✨", "💡",
  "📚", "✍️", "🧠", "🚀", "🌟", "💪",
  "🙏", "👍", "👎", "💚", "🌍", "🎯",
];


const SocialPostParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      contentType: {
        default: "text",
        parseHTML: (element) =>
          element.getAttribute("data-content-type") || "text",
        renderHTML: (attributes) => {
          if (
            !attributes.contentType ||
            attributes.contentType === "text"
          ) {
            return {};
          }

          return {
            "data-content-type": attributes.contentType,
          };
        },
      },
    };
  },
});
function createSocialPostImageNodeView({ node, editor, getPos }: {
  node: { attrs: Record<string, unknown>; nodeSize: number; type: { name: string } };
  editor: Editor;
  getPos: () => number | undefined;
}) {
  const figure = document.createElement("figure");
  figure.contentEditable = "false";
  figure.className =
    "group relative my-4 flex w-full justify-center rounded-xl";

  const image = document.createElement("img");
  image.draggable = false;
  image.className =
    "block h-auto max-h-[520px] max-w-full rounded-xl object-contain";
  image.alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";

  const emptyPreview = document.createElement("div");
  emptyPreview.className =
    "rounded-lg bg-[#F1F5F0] px-4 py-6 text-sm text-[#64746A]";
  emptyPreview.textContent = "Image preview unavailable";

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.contentEditable = "false";
  removeButton.setAttribute("aria-label", "Remove image from post");
  removeButton.title = "Remove image";
  removeButton.className =
    "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#1C2420]/85 text-white opacity-100 shadow-md transition hover:bg-[#B42332] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100";
  removeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  const updateImage = (currentNode: typeof node) => {
    const src = typeof currentNode.attrs.src === "string"
      ? currentNode.attrs.src
      : "";
    image.alt = typeof currentNode.attrs.alt === "string"
      ? currentNode.attrs.alt
      : "";

    if (src) {
      image.src = src;
      if (emptyPreview.parentNode === figure) figure.removeChild(emptyPreview);
      if (image.parentNode !== figure) figure.insertBefore(image, removeButton);
    } else {
      image.removeAttribute("src");
      image.remove();
      if (emptyPreview.parentNode !== figure) {
        figure.insertBefore(emptyPreview, removeButton);
      }
    }
  };

  const handleMouseDown = (event: MouseEvent) => event.preventDefault();
  const handleRemove = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const position = getPos();
    if (typeof position !== "number") return;
    editor.view.dispatch(
      editor.state.tr.delete(position, position + node.nodeSize),
    );
  };

  removeButton.addEventListener("mousedown", handleMouseDown);
  removeButton.addEventListener("click", handleRemove);
  figure.append(removeButton);
  updateImage(node);

  return {
    dom: figure,
    update(updatedNode: typeof node) {
      if (updatedNode.type.name !== node.type.name) return false;
      updateImage(updatedNode);
      return true;
    },
    selectNode() {
      figure.classList.add("ring-2", "ring-[#52745D]", "ring-offset-2");
    },
    deselectNode() {
      figure.classList.remove("ring-2", "ring-[#52745D]", "ring-offset-2");
    },
    stopEvent(event: Event) {
      return event.target instanceof globalThis.Node && removeButton.contains(event.target);
    },
    ignoreMutation() {
      return true;
    },
    destroy() {
      removeButton.removeEventListener("mousedown", handleMouseDown);
      removeButton.removeEventListener("click", handleRemove);
    },
  };
}

const SocialPostImage = Node.create({
  name: "socialPostImage",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      src: { default: null },
      mediaId: { default: null },
      alt: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "img[data-social-post-image]" }];
  },
  addNodeView() {
    return createSocialPostImageNodeView;
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      {
        ...HTMLAttributes,
        "data-social-post-image": "true",
        class: "social-post-inline-image",
      },
    ];
  },
});

export function applySocialPostContentType(
  editor: Editor,
  contentType: SocialPostContentType,
) {
  const chain = editor.chain().focus();

  if (contentType === "heading") {
    chain.setNode("heading", { level: 2 }).run();
    return;
  }

  chain
    .setNode("paragraph", { contentType })
    .run();
}

export default function SocialRichTextEditor({
  value,
  onChange,
  disabled = false,
  maxLength = 3000,
  autoFocus = false,
  showPlaceholder = true,
  children,
  onEditorReady,
  onContentTypeChange,
  onInlineImageUpload,
  onVideoSelect,
}: SocialRichTextEditorProps) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiButtonRef = useRef<HTMLDivElement>(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<number | null>(null);
  const [isInsertingImage, setIsInsertingImage] = useState(false);



  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: {
          levels: [2, 3],
        },
      }),
      SocialPostParagraph,
      SocialPostImage,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: parseEditorContent(value),
    editorProps: {
      attributes: {
        class:
          "social-rich-editor min-h-[112px] sm:min-h-[128px] px-4 py-4 text-[15px] leading-7 text-[#344D40] outline-none [&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:text-[#173B2F] [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-[#244B39] [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:my-4 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#A9C3AA] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#68796D] [&_[data-content-type=question]]:my-4 [&_[data-content-type=question]]:rounded-xl [&_[data-content-type=question]]:border [&_[data-content-type=question]]:border-[#DCE8F1] [&_[data-content-type=question]]:bg-[#F2F7FC] [&_[data-content-type=question]]:px-4 [&_[data-content-type=question]]:py-3 [&_[data-content-type=question]]:font-semibold [&_[data-content-type=question]]:text-[#294B68] [&_[data-content-type=answer]]:my-4 [&_[data-content-type=answer]]:rounded-xl [&_[data-content-type=answer]]:border [&_[data-content-type=answer]]:border-[#D9E8DC] [&_[data-content-type=answer]]:bg-[#F2F8F2] [&_[data-content-type=answer]]:px-4 [&_[data-content-type=answer]]:py-3 [&_[data-content-type=answer]]:text-[#294333] [&_[data-content-type=equation]]:my-4 [&_[data-content-type=equation]]:overflow-x-auto [&_[data-content-type=equation]]:rounded-xl [&_[data-content-type=equation]]:border [&_[data-content-type=equation]]:border-[#E3E6EA] [&_[data-content-type=equation]]:bg-[#F7F8FA] [&_[data-content-type=equation]]:px-4 [&_[data-content-type=equation]]:py-3 [&_[data-content-type=equation]]:font-mono [&_[data-content-type=equation]]:text-[#244B39] [&_.social-post-inline-image]:my-4 [&_.social-post-inline-image]:block [&_.social-post-inline-image]:h-auto [&_.social-post-inline-image]:max-h-[520px] [&_.social-post-inline-image]:max-w-full [&_.social-post-inline-image]:rounded-xl [&_.social-post-inline-image]:object-contain",
        "aria-label": "Post content",
      },

      handleTextInput(view, from, to, text) {
        const currentLength = view.state.doc.textBetween(
          0,
          view.state.doc.content.size,
          "\n",
        ).length;

        const selectedLength = view.state.doc.textBetween(
          from,
          to,
          "\n",
        ).length;

        if (currentLength - selectedLength + text.length > maxLength) {
          return true;
        }

        return false;
      },

      handlePaste(view, event, slice) {
        const pastedText = slice.content.textBetween(
          0,
          slice.content.size,
          "\n",
        );

        const currentLength = view.state.doc.textBetween(
          0,
          view.state.doc.content.size,
          "\n",
        ).length;

        const { from, to } = view.state.selection;

        const selectedLength = view.state.doc.textBetween(
          from,
          to,
          "\n",
        ).length;

        if (
          currentLength - selectedLength + pastedText.length >
          maxLength
        ) {
          event.preventDefault();
          return true;
        }

        return false;
      },
    },

    onUpdate: ({ editor }) => {
      setIsEditorEmpty(editor.isEmpty);

      onChange(
        JSON.stringify(editor.getJSON()),
        editor.getText().length,
      );
    },

    onSelectionUpdate: ({ editor }) => {
      const selectedNode = editor.state.selection.$from.parent;

      let contentType: SocialPostContentType = "text";

      if (selectedNode.type.name === "heading") {
        contentType = "heading";
      } else if (selectedNode.type.name === "paragraph") {
        const savedType = selectedNode.attrs.contentType;

        if (
          savedType === "question" ||
          savedType === "answer" ||
          savedType === "equation"
        ) {
          contentType = savedType;
        }
      }

      onContentTypeChange?.(contentType);
    },
  });

  useEffect(() => {
    if (!editor || !autoFocus) return;

    const frame = requestAnimationFrame(() => {
      editor.commands.focus("end");
    });

    return () => cancelAnimationFrame(frame);
  }, [editor, autoFocus]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;

    onEditorReady?.(editor);

    return () => {
      onEditorReady?.(null);
    };
  }, [editor, onEditorReady]);

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isEmpty: editor?.isEmpty ?? true,
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      strike: editor?.isActive("strike") ?? false,
      heading2: editor?.isActive("heading", { level: 2 }) ?? false,
      heading3: editor?.isActive("heading", { level: 3 }) ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
      blockquote: editor?.isActive("blockquote") ?? false,
      alignLeft: editor?.isActive({ textAlign: "left" }) ?? false,
      alignCenter: editor?.isActive({ textAlign: "center" }) ?? false,
      alignRight: editor?.isActive({ textAlign: "right" }) ?? false,
      canUndo: editor?.can().undo() ?? false,
      canRedo: editor?.can().redo() ?? false,
    }),
  });

  const toolbar = toolbarState ?? {
    isEmpty: true,
    bold: false,
    italic: false,
    strike: false,
    heading2: false,
    heading3: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
    canUndo: false,
    canRedo: false,
  };

  if (!editor) {
    return (
      <div className="min-h-30 animate-pulse rounded-lg bg-[#F7F9F6]" />
    );
  }

  return (
    <div
      className={`overflow-visible rounded-lg bg-white transition-colors focus-within:border-[#B9CEBB] ${
        disabled ? "opacity-60" : ""
      }`}
    >
      {/* Single-row horizontally scrollable formatting toolbar */}
      <div className="relative z-30 w-full overflow-x-auto overflow-y-hidden border-b border-[#E3ECE4] bg-[#F1F7F1] px-2 py-2 sm:px-3">
        <div className="flex w-max min-w-full flex-nowrap items-center gap-1 sm:gap-1.5">
          <ToolbarButton
            label="Bold"
            active={toolbar.bold}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={17} />
          </ToolbarButton>

          <ToolbarButton
            label="Italic"
            active={toolbar.italic}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={17} />
          </ToolbarButton>

          <ToolbarButton
            label="Strikethrough"
            active={toolbar.strike}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough size={17} />
          </ToolbarButton>

          <ToolbarButton
            label="Insert image between paragraphs"
            disabled={disabled || isInsertingImage || !onInlineImageUpload}
            onClick={() => {
              savedSelectionRef.current = editor.state.selection.from;
              imageInputRef.current?.click();
            }}
          >
            {isInsertingImage ? (
              <span className="text-[10px] font-semibold">...</span>
            ) : (
              <ImagePlus size={18} />
            )}
          </ToolbarButton>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled || isInsertingImage || !onInlineImageUpload}
            onChange={async (event: React.ChangeEvent<HTMLInputElement>) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file || !onInlineImageUpload) return;
              if (!file.type.startsWith("image/")) return;
              if (file.size > 4 * 1024 * 1024) {
                window.alert("Inline images must be 4MB or smaller.");
                return;
              }

              setIsInsertingImage(true);
              try {
                const uploaded = await onInlineImageUpload(file);
                const position = savedSelectionRef.current;
                const insertAt =
                  position === null
                    ? editor.state.selection.from
                    : Math.min(position, editor.state.doc.content.size);
                editor
                  .chain()
                  .focus()
                  .insertContentAt(insertAt, {
                    type: "socialPostImage",
                    attrs: {
                      src: uploaded.src,
                      mediaId: uploaded.id,
                      alt: file.name,
                    },
                  })
                  .run();
              } catch (uploadError) {
                console.error("Inline image upload failed:", uploadError);
                window.alert("Unable to upload this image. Please try again.");
              } finally {
                savedSelectionRef.current = null;
                setIsInsertingImage(false);
              }
            }}
          />

          <ToolbarButton
            label="Attach video"
            disabled={disabled || !onVideoSelect}
            onClick={() => {
              savedSelectionRef.current = editor.state.selection.from;
              videoInputRef.current?.click();
            }}
          >
            <Video size={18} />
          </ToolbarButton>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={disabled || !onVideoSelect}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              savedSelectionRef.current = null;
              if (!file || !onVideoSelect) return;
              onVideoSelect(file);
            }}
          />

          <div ref={emojiButtonRef} className="relative shrink-0">
            <ToolbarButton
              label="Insert emoji"
              active={emojiPickerOpen}
              disabled={disabled}
              onClick={() => {
                if (emojiPickerOpen) {
                  setEmojiPickerOpen(false);
                  return;
                }

                const rect = emojiButtonRef.current?.getBoundingClientRect();

                if (rect) {
                  const pickerWidth = Math.min(256, window.innerWidth - 32);
                  const pickerHeight = 260;
                  const placeAbove =
                    window.innerHeight - rect.bottom < pickerHeight &&
                    rect.top > pickerHeight;

                  setEmojiPickerPosition({
                    top: placeAbove
                      ? rect.top - pickerHeight - 8
                      : rect.bottom + 8,
                    left: Math.max(
                      16,
                      Math.min(
                        rect.left,
                        window.innerWidth - pickerWidth - 16,
                      ),
                    ),
                  });

                  setEmojiPickerOpen(true);
                }
              }}
            >
              <Smile size={18} />
            </ToolbarButton>

            {emojiPickerOpen &&
              typeof document !== "undefined" &&
              createPortal(
              <div
                style={{
                  position: "fixed",
                  top: emojiPickerPosition.top,
                  left: emojiPickerPosition.left,
                  width: "min(16rem, calc(100vw - 2rem))",
                  zIndex: 200,
                }}
                className="rounded-lg border border-[#E5EAE3] bg-white p-3 shadow-xl"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#173B2F]">
                    Choose an emoji
                  </p>

                  <button
                    type="button"
                    onClick={() => setEmojiPickerOpen(false)}
                    aria-label="Close emoji picker"
                    className="rounded-md p-1 text-[#87938A] transition hover:bg-[#F1F5F0]"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1">
                  {POST_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        const { from, to } = editor.state.selection;
                        const currentLength = editor.getText().length;

                        const selectedLength = editor.state.doc.textBetween(
                          from,
                          to,
                          "\n",
                        ).length;

                        if (
                          currentLength - selectedLength + emoji.length <=
                          maxLength
                        ) {
                          editor.chain().focus().insertContent(emoji).run();
                        }

                        setEmojiPickerOpen(false);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-[#EAF1EB] disabled:opacity-40"
                      aria-label={`Insert ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>,
              document.body,
            )}
          </div>

          <span
            aria-hidden="true"
            className="mx-1 h-6 w-px shrink-0 bg-[#E5EAE3]"
          />

          <ToolbarButton
            label="Heading 2"
            active={toolbar.heading2}
            disabled={disabled}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 size={18} />
          </ToolbarButton>

          <ToolbarButton
            label="Heading 3"
            active={toolbar.heading3}
            disabled={disabled}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 size={18} />
          </ToolbarButton>

          <span
            aria-hidden="true"
            className="mx-1 h-6 w-px shrink-0 bg-[#E5EAE3]"
          />

          <ToolbarButton
            label="Bulleted list"
            active={toolbar.bulletList}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={18} />
          </ToolbarButton>

          <ToolbarButton
            label="Numbered list"
            active={toolbar.orderedList}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={18} />
          </ToolbarButton>

          <ToolbarButton
            label="Quote"
            active={toolbar.blockquote}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={17} />
          </ToolbarButton>

          <span
            aria-hidden="true"
            className="mx-1 h-6 w-px shrink-0 bg-[#E5EAE3]"
          />

          <ToolbarButton
            label="Align left"
            active={toolbar.alignLeft}
            disabled={disabled}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft size={17} />
          </ToolbarButton>

          <ToolbarButton
            label="Align center"
            active={toolbar.alignCenter}
            disabled={disabled}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter size={17} />
          </ToolbarButton>

          <ToolbarButton
            label="Align right"
            active={toolbar.alignRight}
            disabled={disabled}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight size={17} />
          </ToolbarButton>

          <span
            aria-hidden="true"
            className="mx-1 h-6 w-px shrink-0 bg-[#E5EAE3]"
          />

          <ToolbarButton
            label="Undo"
            disabled={disabled || !toolbar.canUndo}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 size={17} />
          </ToolbarButton>

          <ToolbarButton
            label="Redo"
            disabled={disabled || !toolbar.canRedo}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 size={17} />
          </ToolbarButton>
        </div>
      </div>

      {/* Text and uploaded media share one canvas */}
      <div className="relative z-0 min-w-0 overflow-x-hidden bg-white">
        {showPlaceholder && isEditorEmpty && !disabled && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-4 z-10 max-w-[90%] text-[15px] leading-7 text-[#A0AAA1]"
          >
            Share an idea, ask a question, or start a conversation...
          </div>
        )}

        <EditorContent editor={editor} />

        {children && (
          <div className="px-4 pb-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
