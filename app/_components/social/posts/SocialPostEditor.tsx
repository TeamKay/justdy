
"use client";

import { useState, useTransition, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Video,
  Pencil,
  X,
  Save,
  Users,
  Globe,
  LockKeyhole,
  LoaderCircle,
  LayoutGrid,
  Blocks,
} from "lucide-react";

import type { Editor } from "@tiptap/core";
import SocialRichTextEditor, {
  applySocialPostContentType,
  type SocialPostContentType,
} from "@/app/_components/social/posts/SocialRichTextEditor";
import {
  createSocialPostBlockDocument,
  parseSocialPostBlockDocument,
  type SocialPostBlock,
} from "@/lib/social/post-blocks";

import {
  extractSocialPostUrls,
  getSocialPostText,
  parseSocialPostContent,
} from "@/lib/social/rich-text";

import {
  cleanupUnattachedSocialPostMedia,
  updateSocialPost,
} from "@/app/actions/social-post";

import { uploadFileToStorage } from "@/lib/storage/client-upload";
import SocialLinkPreview from "@/app/_components/social/posts/SocialLinkPreview";

const MAX_MEDIA = 6;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const MAX_VIDEO_SIZE = 256 * 1024 * 1024;

type PostVisibility = "PUBLIC" | "FOLLOWERS" | "ONLY_ME";
type PostLayout = "IMAGE_LEFT" | "TEXT_LEFT" | "IMAGE_TOP" | "TEXT_TOP";

type ExistingMedia = {
  id: string;
  media: {
    id: string;
    url: string;
    fileName: string;
    mimeType: string;
  };
};

function NewMediaPreview({
  file,
  index,
  onRemove,
  disabled,
}: {
  file: File;
  index: number;
  onRemove: () => void;
  disabled: boolean;
}) {
  const isVideo = file.type.startsWith("video/");
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const previewUrl = URL.createObjectURL(file);

    if (isVideo && videoRef.current) {
      videoRef.current.src = previewUrl;
    } else if (!isVideo && imageRef.current) {
      imageRef.current.src = previewUrl;
    }

    return () => URL.revokeObjectURL(previewUrl);
  }, [file, isVideo]);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-[#E8E9E2] bg-[#FAFBF9]">
      {isVideo ? (
        <video
          ref={videoRef}
          controls
          muted
          playsInline
          preload="metadata"
          aria-label={`Selected video ${index + 1}`}
          className="h-full w-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imageRef}
          alt={`Selected image ${index + 1}`}
          className="h-full w-full object-cover"
        />
      )}

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove media ${index + 1}`}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black disabled:opacity-50"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

type StoredRichNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  content?: StoredRichNode[];
};

function convertPostToBlocks(value: string): string {
  const blockDocument = parseSocialPostBlockDocument(value);

  if (blockDocument) {
    const content: Array<Record<string, unknown>> = [];

    for (const block of blockDocument.blocks) {
      if (block.type === "image") {
        if (!block.mediaId) continue;
        content.push({
          type: "socialPostImage",
          attrs: {
            mediaId: block.mediaId,
            src: `/api/storage/media/${encodeURIComponent(block.mediaId)}`,
            alt: "Post image",
          },
        });
        continue;
      }

      const richContent = block.content;
      let inlineContent: Array<Record<string, unknown>> = [];

      if (typeof richContent === "string") {
        inlineContent = richContent
          .split("\n")
          .flatMap((line, index, lines) => {
            const nodes: Array<Record<string, unknown>> = line
              ? [{ type: "text", text: line }]
              : [];
            if (index < lines.length - 1) nodes.push({ type: "hardBreak" });
            return nodes;
          });
      } else if (richContent && typeof richContent === "object") {
        const root = richContent as StoredRichNode;
        const sourceNodes = root.type === "doc" || root.type === "paragraph" || root.type === "heading"
          ? root.content ?? []
          : [root];
        inlineContent = sourceNodes
          .filter((node) => node && ["text", "hardBreak"].includes(node.type ?? ""))
          .map((node) => ({
            type: node.type,
            ...(node.type === "text" ? { text: node.text ?? "" } : {}),
            ...(node.marks?.length ? { marks: node.marks } : {}),
          }));
      }

      const alignment = block.alignment ?? "left";
      if (block.type === "heading") {
        content.push({
          type: "heading",
          attrs: { level: 2, textAlign: alignment },
          ...(inlineContent.length ? { content: inlineContent } : {}),
        });
      } else {
        content.push({
          type: "paragraph",
          attrs: {
            contentType: block.type === "text" ? "text" : block.type,
            textAlign: alignment,
          },
          ...(inlineContent.length ? { content: inlineContent } : {}),
        });
      }
    }

    return JSON.stringify({
      type: "doc",
      content: content.length ? content : [{ type: "paragraph" }],
    });
  }

  // Legacy TipTap documents and plain-text posts are already understood by
  // SocialRichTextEditor, so preserve their structure and formatting.
  return JSON.stringify(parseSocialPostContent(value));
}

const CONTENT_TYPE_OPTIONS: {
  value: SocialPostContentType;
  label: string;
}[] = [
  { value: "text", label: "Normal text" },
  { value: "heading", label: "Heading" },
  { value: "question", label: "Question" },
  { value: "answer", label: "Answer" },
  { value: "equation", label: "Equation" },
];

export default function SocialPostEditor({
  postId,
  initialContent,
  initialMedia,
  initialVisibility,
  initialLayout = "TEXT_TOP",
  authorName = "Justdy member",
  authorImage,
}: {
  postId: string;
  initialContent: string;
  initialMedia: ExistingMedia[];
  initialVisibility: PostVisibility;
  initialLayout?: PostLayout;
  authorName?: string;
  authorImage?: string | null;
}) {
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [contentType, setContentType] =
    useState<SocialPostContentType>("text");
  const [content, setContent] = useState(initialContent);
  const [contentLength, setContentLength] = useState(
    getSocialPostText(initialContent).length,
  );

  const [existingMedia, setExistingMedia] = useState(initialMedia);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);

  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isPending, startTransition] = useTransition();
  const [visibility, setVisibility] =
    useState<PostVisibility>(initialVisibility);
  const [layout, setLayout] = useState<PostLayout>(initialLayout);
  const [isUploading, setIsUploading] = useState(false);
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);
  const [visibilityMenuPosition, setVisibilityMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const visibilityButtonRef = useRef<HTMLButtonElement>(null);

  const [dismissedPreviewUrls, setDismissedPreviewUrls] = useState<string[]>(
    [],
  );

  const isBusy = isPending || isUploading;
  const totalMedia = existingMedia.length + selectedMedia.length;
  const remaining = 3000 - contentLength;

  const postUrls = useMemo(
    () => extractSocialPostUrls(content),
    [content],
  );

  const visiblePreviewUrls = useMemo(
    () => postUrls.filter((url) => !dismissedPreviewUrls.includes(url)),
    [postUrls, dismissedPreviewUrls],
  );

  const handleEditorReady = useCallback((editor: Editor | null) => {
    editorRef.current = editor;
  }, []);

  const handleContentTypeChange = useCallback(
    (type: SocialPostContentType) => {
      setContentType(type);
    },
    [],
  );

  function handleApplyContentType(type: SocialPostContentType) {
    setContentType(type);

    if (editorRef.current) {
      applySocialPostContentType(editorRef.current, type);
    }
  }

  const VisibilityIcon =
    visibility === "PUBLIC"
      ? Globe
      : visibility === "FOLLOWERS"
        ? Users
        : LockKeyhole;

  const visibilityLabel =
    visibility === "PUBLIC"
      ? "Public"
      : visibility === "FOLLOWERS"
        ? "Followers"
        : "Only me";

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isBusy]);

  function dismissPreview(url: string) {
    setDismissedPreviewUrls((current) =>
      current.includes(url) ? current : [...current, url],
    );
  }

  function openEditor() {
   const editableContent = convertPostToBlocks(initialContent);
    setContent(editableContent);
    setContentLength(getSocialPostText(editableContent).length);
    setExistingMedia(initialMedia);
    setSelectedMedia([]);
    setError("");
    setVisibility(initialVisibility);
    setLayout(initialLayout);
    setUploadProgress(0);
    setDismissedPreviewUrls([]);
    setContentType("text");
    setIsOpen(true);
  }

  function closeEditor() {
    if (isBusy) return;
    setIsOpen(false);
  }

  function handleMediaSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setError("");

    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (totalMedia + files.length > MAX_MEDIA) {
      setError(`You can attach up to ${MAX_MEDIA} media files.`);
      return;
    }

    const existingVideoCount = existingMedia.filter((item) =>
      item.media.mimeType.startsWith("video/"),
    ).length;

    const selectedVideoCount = selectedMedia.filter((file) =>
      file.type.startsWith("video/"),
    ).length;

    const addedVideoCount = files.filter((file) =>
      file.type.startsWith("video/"),
    ).length;

    if (
      existingVideoCount + selectedVideoCount + addedVideoCount > 1
    ) {
      setError("You can attach only one video to a post.");
      return;
    }

    const invalidFile = files.find((file) => {
      if (file.type.startsWith("image/")) {
        return file.size > MAX_IMAGE_SIZE;
      }

      if (file.type.startsWith("video/")) {
        return file.size > MAX_VIDEO_SIZE;
      }

      return true;
    });

    if (invalidFile) {
      setError(
        "Images must be 4MB or smaller. Videos must be 256MB or smaller. Only images and videos are supported.",
      );
      return;
    }

    setSelectedMedia((current) => [...current, ...files]);
  }

  function removeExistingMedia(mediaId: string) {
    setExistingMedia((current) =>
      current.filter((item) => item.media.id !== mediaId),
    );
  }

  function removeNewMedia(index: number) {
    setSelectedMedia((current) =>
      current.filter((_, mediaIndex) => mediaIndex !== index),
    );
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) return;

    setError("");

    if (contentLength === 0 && totalMedia === 0) {
      setError("Write something or attach at least one photo or video.");
      return;
    }

    startTransition(async () => {
      const uploadedMediaIds: string[] = [];

      async function cleanupUploadedMedia() {
        if (uploadedMediaIds.length === 0) return;

        try {
          const cleanup = await cleanupUnattachedSocialPostMedia(
            uploadedMediaIds,
          );

          if (!cleanup.success) {
            console.error(
              "Uploaded media cleanup failed:",
              cleanup.error,
            );
          }
        } catch (cleanupError) {
          console.error(
            "Uploaded media cleanup error:",
            cleanupError,
          );
        }
      }

      try {
        const newMediaIds: string[] = [];

        if (selectedMedia.length > 0) {
          setIsUploading(true);
          setUploadProgress(0);

          for (
            let index = 0;
            index < selectedMedia.length;
            index++
          ) {
            const file = selectedMedia[index];

            const uploadedFile = await uploadFileToStorage({
              file,
              purpose: "SOCIAL_POST",
              onProgress: (progress) => {
                const overallProgress =
                  ((index + progress / 100) / selectedMedia.length) * 100;

                setUploadProgress(Math.round(overallProgress));
              },
            });

            uploadedMediaIds.push(uploadedFile.id);
            newMediaIds.push(uploadedFile.id);
          }
        }

        const mediaIds = [
          ...existingMedia.map((item) => item.media.id),
          ...newMediaIds,
        ];

        const result = await updateSocialPost({
          postId,
          content: contentLength > 0 ? content : "",
          mediaIds,
          visibility,
          layout,
        });

        if (!result.success) {
          await cleanupUploadedMedia();

          setError(
            result.error ?? "Unable to update your post. Please try again.",
          );

          return;
        }

        setIsOpen(false);
        setSelectedMedia([]);
        setUploadProgress(0);
        setDismissedPreviewUrls([]);

        router.refresh();
      } catch (saveError) {
        console.error("Social post update error:", saveError);

        await cleanupUploadedMedia();

        setError("Unable to update your post. Please try again.");
      } finally {
        setIsUploading(false);
      }
    });
  }

  return (
    <>
      {/* Edit post button */}
      <button
        type="button"
        onClick={openEditor}
        aria-label="Edit post"
        title="Edit post"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#87938A] transition hover:bg-[#EAF1EB] hover:text-[#315C43]"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {/* Edit post modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-black/45 px-3 py-5 backdrop-blur-[2px] sm:px-5"
          onClick={closeEditor}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-post-title"
            className="my-auto flex max-h-[min(84dvh,760px)] w-full max-w-[520px] flex-col overflow-hidden rounded-xl border border-[#E4E6EB] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal heading */}
            <div className="relative flex min-h-[58px] items-center justify-center border-b border-[#E4E6EB] bg-white px-5">
              <h2
                id="edit-post-title"
                className="text-[17px] font-bold text-[#1C1E21]"
              >
                Edit post
              </h2>

              <button
                type="button"
                onClick={closeEditor}
                disabled={isBusy}
                aria-label="Close editor"
                className="absolute right-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#E4E6EB] text-[#606770] transition hover:bg-[#D8DADF] disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-4 sm:px-5"
            >
              {/* Profile and editor controls */}
              <div className="mb-4 flex items-center justify-between gap-3">
                {/* Existing editor profile information — unchanged */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF1EB] text-sm font-bold text-[#315B43] ring-2 ring-[#EAF1EB]">
                    {authorImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={authorImage}
                        alt={authorName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      authorName
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() ?? "")
                        .join("") || "J"
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold leading-5 text-[#1C1E21]">
                      {authorName}
                    </p>
                    <p className="text-xs text-[#87938A]">Editing your post</p>
                  </div>
                </div>

                {/* Three centered icon controls aligned to the right */}
                <div className="flex shrink-0 items-center justify-end gap-2">
                  {/* Visibility */}
                  <div className="inline-flex shrink-0">
                    <button
                      ref={visibilityButtonRef}
                      type="button"
                      title={`Post audience: ${visibilityLabel}`}
                      aria-label={`Post audience: ${visibilityLabel}`}
                      aria-haspopup="menu"
                      aria-expanded={isVisibilityMenuOpen}
                      onClick={() => {
                        if (isVisibilityMenuOpen) {
                          setIsVisibilityMenuOpen(false);
                          return;
                        }

                        const rect = visibilityButtonRef.current?.getBoundingClientRect();
                        if (!rect) return;

                        const menuWidth = 192;
                        const menuHeight = 160;

                        setVisibilityMenuPosition({
                          top:
                            rect.bottom + menuHeight + 8 > window.innerHeight
                              ? Math.max(8, rect.top - menuHeight - 8)
                              : rect.bottom + 8,
                          left: Math.min(
                            rect.left,
                            window.innerWidth - menuWidth - 8,
                          ),
                        });
                        setIsVisibilityMenuOpen(true);
                      }}
                      disabled={isBusy}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        visibility === "PUBLIC"
                          ? "border-[#DADDE1] bg-[#F0F2F5] text-[#3A3B3C] hover:bg-[#E4E6EB]"
                          : visibility === "FOLLOWERS"
                            ? "border-[#D5E8FA] bg-[#E7F3FF] text-[#1877F2] hover:bg-[#DCEEFF]"
                            : "border-[#F2E1C3] bg-[#FFF4E5] text-[#9A6700] hover:bg-[#FFEDCF]"
                      }`}
                    >
                      <VisibilityIcon className="h-5 w-5" />
                    </button>

                    {isVisibilityMenuOpen &&
                      createPortal(
                        <>
                          <button
                            type="button"
                            aria-label="Close audience menu"
                            className="fixed inset-0 z-[200] cursor-default"
                            onClick={() => setIsVisibilityMenuOpen(false)}
                          />

                          <div
                            role="menu"
                            aria-label="Post audience"
                            style={{
                              position: "fixed",
                              top: visibilityMenuPosition.top,
                              left: visibilityMenuPosition.left,
                            }}
                            className="z-[201] w-48 overflow-hidden rounded-xl border border-[#E4E6EB] bg-white p-1.5 shadow-xl"
                          >
                            {[
                              {
                                value: "PUBLIC",
                                label: "Public",
                                description: "Anyone can see this post",
                                Icon: Globe,
                              },
                              {
                                value: "FOLLOWERS",
                                label: "Followers",
                                description: "Your followers can see this",
                                Icon: Users,
                              },
                              {
                                value: "ONLY_ME",
                                label: "Only me",
                                description: "Only you can see this",
                                Icon: LockKeyhole,
                              },
                            ].map((option) => {
                              const OptionIcon = option.Icon;
                              const isSelected = visibility === option.value;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  role="menuitemradio"
                                  aria-checked={isSelected}
                                  onClick={() => {
                                    setVisibility(option.value as PostVisibility);
                                    setIsVisibilityMenuOpen(false);
                                  }}
                                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                                    isSelected ? "bg-[#F0F5F0]" : "hover:bg-[#F5F6F7]"
                                  }`}
                                >
                                  <OptionIcon className="h-4 w-4 shrink-0 text-[#315C43]" />
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-[13px] font-semibold text-[#1C1E21]">
                                      {option.label}
                                    </span>
                                    <span className="block text-[10px] text-[#8A8D91]">
                                      {option.description}
                                    </span>
                                  </span>
                                  {isSelected && (
                                    <span className="text-xs font-bold text-[#315C43]">✓</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>,
                        document.body,
                      )}
                  </div>

                  {/* Post layout */}
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                    <button
                      type="button"
                      title={`Post layout: ${layout.replaceAll("_", " ").toLowerCase()}`}
                      aria-label="Post layout"
                      disabled={isBusy}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#DCE6DC] bg-[#F8FAF7] text-[#345342] transition hover:bg-[#EDF3EC] disabled:opacity-50"
                    >
                      <LayoutGrid className="h-5 w-5" />
                    </button>
                    <select
                      id={`social-post-layout-${postId}`}
                      aria-label="Post layout"
                      value={layout}
                      onChange={(event) => setLayout(event.target.value as PostLayout)}
                      disabled={isBusy}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    >
                      <option value="TEXT_TOP">Text above image</option>
                      <option value="IMAGE_TOP">Image above text</option>
                      <option value="IMAGE_LEFT">Image left, text right</option>
                      <option value="TEXT_LEFT">Text left, image right</option>
                    </select>
                  </div>

                  {/* Block / content type */}
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                    <button
                      type="button"
                      title={`Block type: ${CONTENT_TYPE_OPTIONS.find((option) => option.value === contentType)?.label ?? "Normal text"}`}
                      aria-label="Block type"
                      disabled={isBusy}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#DCE6DC] bg-[#F8FAF7] text-[#345342] transition hover:bg-[#EDF3EC] disabled:opacity-50"
                    >
                      <Blocks className="h-5 w-5" />
                    </button>
                    <select
                      id={`social-post-content-type-${postId}`}
                      aria-label="Content type for selected paragraph"
                      value={contentType}
                      onChange={(event) =>
                        handleApplyContentType(event.target.value as SocialPostContentType)
                      }
                      disabled={isBusy}
                      title="Change the type of the paragraph at the cursor"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    >
                      {CONTENT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Rich-text editor with existing and new media inside its canvas */}
             {/* Structured block editor */}
              <div className="min-w-0 flex-1">
               <SocialRichTextEditor
                    key={`${postId}-${isOpen}`}
                    value={content}
                    onChange={(value, characterCount) => {
                      setContent(value);
                      setContentLength(characterCount);
                    }}
                    disabled={isBusy}
                    maxLength={3000}
                    showPlaceholder
                    onEditorReady={handleEditorReady}
                    onContentTypeChange={handleContentTypeChange}
                  />

                {/* Existing and newly selected media */}
                {totalMedia > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {existingMedia.map((item, index) => {
                      const isVideo = item.media.mimeType.startsWith("video/");

                      return (
                        <div
                          key={item.media.id}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-[#E8E9E2] bg-[#FAFBF9]"
                        >
                          {isVideo ? (
                            <video
                              src={`/api/storage/media/${item.media.id}`}
                              controls
                              playsInline
                              preload="metadata"
                              aria-label={`Existing video ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/api/storage/media/${item.media.id}`}
                              alt={item.media.fileName || `Existing image ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => removeExistingMedia(item.media.id)}
                            disabled={isBusy}
                            aria-label={`Remove existing media ${index + 1}`}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}

                    {selectedMedia.map((file, index) => (
                      <NewMediaPreview
                        key={`${file.name}-${file.size}-${index}`}
                        file={file}
                        index={index}
                        onRemove={() => removeNewMedia(index)}
                        disabled={isBusy}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-2 flex justify-end">
                  <span
                    className={`text-[11px] ${
                      remaining < 100 ? "text-[#B97832]" : "text-[#8A8D91]"
                    }`}
                  >
                    {contentLength}/3000
                  </span>
                </div>
              </div>
              {/* Website link previews */}
              {visiblePreviewUrls.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-[#606770]">
                    Website previews
                  </p>
                  <SocialLinkPreview
                    urls={visiblePreviewUrls}
                    onRemove={dismissPreview}
                  />
                </div>
              )}

              {/* Add to your post toolbar */}
                          <div className="mt-4 rounded-lg border border-[#CED0D4] px-3 py-3">
                            
            
                            <div className="mt-0 flex items-center justify-between gap-2">
                              <span className="text-[14px] font-semibold text-[#1C1E21]">
                                Attachment:
                              </span>
                            <div className="flex items-center gap-2">
                                {selectedMedia.length < MAX_MEDIA && (
                                <>
                                  <label
                                    title="Add images"
                                    aria-label="Add images"
                                    className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#45BD62] transition hover:bg-[#F0F2F5] ${
                                      isBusy ? "pointer-events-none opacity-50" : ""
                                    }`}
                                  >
                                    <ImagePlus className="h-6 w-6" />
                                    <span className="sr-only">Add images</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      disabled={isBusy}
                                      onChange={handleMediaSelection}
                                      className="sr-only"
                                    />
                                  </label>
            
                                  <label
                                    title="Add video"
                                    aria-label="Add video"
                                    className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#F3425F] transition hover:bg-[#F0F2F5] ${
                                      isBusy ? "pointer-events-none opacity-50" : ""
                                    }`}
                                  >
                                    <Video className="h-6 w-6" />
                                    <span className="sr-only">Add video</span>
                                    <input
                                      type="file"
                                      accept="video/*"
                                      disabled={isBusy}
                                      onChange={handleMediaSelection}
                                      className="sr-only"
                                    />
                                  </label>
                                </>
                              )}
                            </div>
                            </div>
                          </div>
              {/* Upload progress */}
              {isUploading && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-[#87938A]">
                    <span>Uploading media...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#EAF1EB]">
                    <div
                      className="h-full rounded-full bg-[#52745D] transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <p
                  role="alert"
                  className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              {/* Fixed action footer */}
              <div className="sticky bottom-0 z-20 -mx-4 mt-4 border-t border-[#E4E6EB] bg-white px-4 pb-4 pt-3 sm:-mx-5 sm:px-5">
                <p className="mb-2 text-center text-[10px] leading-4 text-[#8A8D91]">
                  Up to 6 attachments, including 1 video. Images: max 4MB each.
                  Videos: max 256MB.
                </p>
                <button
                  type="submit"
                  disabled={
                    isBusy ||
                    (contentLength === 0 && totalMedia === 0)
                  }
                  className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-[#166FE5] disabled:cursor-not-allowed disabled:bg-[#E4E6EB] disabled:text-[#BCC0C4]"
                >
                  {isBusy ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      {isUploading ? "Uploading..." : "Saving changes..."}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
