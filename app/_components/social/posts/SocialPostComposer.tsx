
"use client";

import { useRouter } from "next/navigation";
import type { Editor } from "@tiptap/core";
import { createPortal } from "react-dom";
import SocialRichTextEditor, {
  applySocialPostContentType,
  type SocialPostContentType,
} from "@/app/_components/social/posts/SocialRichTextEditor";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { extractSocialPostUrls } from "@/lib/social/rich-text";
import {
  Send,
  X,
  Users,
  Globe,
  LockKeyhole,
  LoaderCircle,
  Blocks,
  LayoutGrid,
} from "lucide-react";

import { uploadFileToStorage } from "@/lib/storage/client-upload";
import {
  cleanupUnattachedSocialPostMedia,
  createSocialPost,
} from "@/app/actions/social-post";
import SocialLinkPreview from "@/app/_components/social/posts/SocialLinkPreview";

const MAX_MEDIA = 6;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const MAX_VIDEO_SIZE = 256 * 1024 * 1024;

function getInlineImageMediaIds(value: string): string[] {
  if (!value.trim()) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    const ids = new Set<string>();

    const visit = (node: unknown) => {
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
    };

    visit(parsed);
    return [...ids];
  } catch {
    return [];
  }
}

type PostVisibility = "PUBLIC" | "FOLLOWERS" | "ONLY_ME";
type PostLayout = "IMAGE_LEFT" | "TEXT_LEFT" | "IMAGE_TOP" | "TEXT_TOP";

const CONTENT_TYPE_LABELS: Record<SocialPostContentType, string> = {
  text: "Normal text",
  heading: "Heading",
  question: "Question",
  answer: "Answer",
  equation: "Equation",
};

const POST_LAYOUT_LABELS: Record<PostLayout, string> = {
  TEXT_TOP: "Text above media",
  IMAGE_TOP: "Media above text",
  IMAGE_LEFT: "Media left",
  TEXT_LEFT: "Text left",
};





function MediaPreview({
  file,
  index,
  onRemove,
  disabled,
  single = false,
}: {
  file: File;
  index: number;
  onRemove: () => void;
  disabled: boolean;
  single?: boolean;
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
    <div
      className={`group relative flex w-full min-w-0 items-center justify-center overflow-hidden bg-[#F1F4F0] ${
        single
          ? "min-h-[180px] max-h-[min(42dvh,420px)] sm:min-h-[220px] sm:max-h-[min(62dvh,680px)]"
          : "h-full min-h-0"
      }`}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          controls
          muted
          playsInline
          preload="metadata"
          aria-label={`Selected video ${index + 1}`}
          className={`bg-black object-contain ${
            single
              ? "h-auto max-h-[min(42dvh,420px)] w-full sm:max-h-[min(62dvh,680px)]"
              : "h-full w-full"
          }`}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imageRef}
          alt={`Selected image ${index + 1}`}
          className={
            single
              ? "block h-auto max-h-[min(42dvh,420px)] w-auto max-w-full object-contain sm:max-h-[min(62dvh,680px)]"
              : "block h-full w-full object-contain"
          }
        />
      )}

      {isVideo && (
        <span className="absolute bottom-2 left-2 z-10 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          Video
        </span>
      )}

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${isVideo ? "video" : "photo"} ${index + 1}: ${file.name}`}
        className="absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-black/70 text-white shadow-md transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}




export default function SocialPostComposer({
  displayName,
  imageUrl,
  showInlineTrigger = true,
}: {
  displayName: string;
  imageUrl: string | null;
  showInlineTrigger?: boolean;
}) {
  const router = useRouter();

  const [content, setContent] = useState("");
  const [contentLength, setContentLength] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [inlineImageMediaIds, setInlineImageMediaIds] = useState<string[]>([]);
  const inlinePreviewUrlsRef = useRef<string[]>([]);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [dismissedPreviewUrls, setDismissedPreviewUrls] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
  const [layout, setLayout] = useState<PostLayout>("TEXT_TOP");
  const [contentType, setContentType] =
    useState<SocialPostContentType>("text");
  const editorRef = useRef<Editor | null>(null);
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);
  const [visibilityMenuPosition, setVisibilityMenuPosition] = useState({
  top: 0,
  left: 0,
});

const visibilityButtonRef = useRef<HTMLButtonElement>(null);

  const handleEditorReady = useCallback((editor: Editor | null) => {
    editorRef.current = editor;
  }, []);

  useEffect(() => {
    return () => {
      inlinePreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      inlinePreviewUrlsRef.current = [];
    };
  }, []);

  const handleInlineImageUpload = useCallback(async (file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("Inline images must be 4MB or smaller.");
    }

    setIsUploading(true);
    try {
      const uploadedFile = await uploadFileToStorage({
        file,
        purpose: "SOCIAL_POST",
      });
      setInlineImageMediaIds((current) =>
        current.includes(uploadedFile.id) ? current : [...current, uploadedFile.id],
      );
      // The media endpoint intentionally serves only media attached to a
      // visible post. Use a local object URL for the pre-publish editor preview;
      // the saved node also carries mediaId, which is used after publishing.
      const previewUrl = URL.createObjectURL(file);
      inlinePreviewUrlsRef.current.push(previewUrl);

      return {
        id: uploadedFile.id,
        src: previewUrl,
      };
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleContentTypeChange = useCallback(
    (nextType: SocialPostContentType) => {
      setContentType(nextType);
      if (editorRef.current) {
        applySocialPostContentType(editorRef.current, nextType);
      }
    },
    [],
  );

  const postUrls = useMemo(
    () => extractSocialPostUrls(content),
    [content],
  );

  const visiblePreviewUrls = useMemo(
    () => postUrls.filter((url) => !dismissedPreviewUrls.includes(url)),
    [postUrls, dismissedPreviewUrls],
  );

  function removePreview(url: string) {
    setDismissedPreviewUrls((current) =>
      current.includes(url) ? current : [...current, url],
    );
  }

  const isBusy = isPending || isUploading;
  const remaining = 3000 - contentLength;

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

  useEffect(() => {
  function handleOpenComposer() {
    openComposer();
  }

  window.addEventListener(
    "justdy:open-social-post-composer",
    handleOpenComposer,
  );

  return () => {
    window.removeEventListener(
      "justdy:open-social-post-composer",
      handleOpenComposer,
    );
  };
}, []);

  const VisibilityIcon =
    visibility === "PUBLIC"
      ? Globe
      : visibility === "FOLLOWERS"
        ? Users
        : LockKeyhole;

  const visibilityLabel =
    visibility === "PUBLIC"
      ? ""
      : visibility === "FOLLOWERS"
        ? ""
        : "";

  function openComposer() {
    setError("");
    setDismissedPreviewUrls([]);
    setIsOpen(true);
  }

  function closeComposer() {
    if (isBusy) return;
    setIsOpen(false);
  }

  function handleVideoSelection(file: File) {
    setError("");

    if (!file.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setError("Videos must be 256MB or smaller.");
      return;
    }

    if (selectedMedia.length >= MAX_MEDIA) {
      setError(`You can attach up to ${MAX_MEDIA} media files.`);
      return;
    }

    if (selectedMedia.some((item) => item.type.startsWith("video/"))) {
      setError("You can attach only one video to a post.");
      return;
    }

    setSelectedMedia((current) => [...current, file]);
  }

  function removeMedia(index: number) {
    setSelectedMedia((current) =>
      current.filter((_, mediaIndex) => mediaIndex !== index),
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const inlineImageIdsInContent = getInlineImageMediaIds(content);

    if (
      contentLength === 0 &&
      inlineImageIdsInContent.length === 0 &&
      selectedMedia.length === 0
    ) {
      setError("Write something or attach at least one photo or video.");
      return;
    }

    startTransition(async () => {
      const uploadedMediaIds: string[] = [...inlineImageMediaIds];

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
        const mediaIds: string[] = [...inlineImageIdsInContent];

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
            mediaIds.push(uploadedFile.id);
          }
        }

        const result = await createSocialPost({
          content: contentLength > 0 ? content : "",
          mediaIds,
          visibility,
          layout,
        });

        if (!result.success) {
          await cleanupUploadedMedia();
          setError(result.error);
          return;
        }

        const removedInlineImageIds = inlineImageMediaIds.filter(
          (id) => !inlineImageIdsInContent.includes(id),
        );
        if (removedInlineImageIds.length > 0) {
          const cleanup = await cleanupUnattachedSocialPostMedia(
            removedInlineImageIds,
          );
          if (!cleanup.success) {
            console.error("Removed inline image cleanup failed:", cleanup.error);
          }
        }

        setContent("");
        setContentLength(0);
        setSelectedMedia([]);
        setInlineImageMediaIds([]);
        inlinePreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        inlinePreviewUrlsRef.current = [];
        setDismissedPreviewUrls([]);
        setVisibility("PUBLIC");
        setLayout("TEXT_TOP");
        setUploadProgress(0);
        setError("");
        setIsOpen(false);

        router.refresh();
      } catch (uploadError) {
        console.error("Social post submission error:", uploadError);

        await cleanupUploadedMedia();

        setError("Unable to publish your post. Please try again.");
      } finally {
        setIsUploading(false);
      }
    });
  }

  return (
    <>
      {/* Optional inline composer trigger for the community feed */}
      {showInlineTrigger ? (
        <button
          type="button"
          onClick={openComposer}
          className="w-full rounded-2xl border border-[#E5EAE3] bg-white p-4 text-left shadow-[0_4px_18px_rgba(23,59,47,0.045)] transition hover:border-[#C8D8C9] hover:shadow-md sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#EAF1EB] ring-2 ring-white shadow-sm">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-semibold text-[#173B2F]">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex min-h-11 flex-1 items-center rounded-full bg-[#F3F6F2] px-5 text-sm text-[#87938A] transition hover:bg-[#EDF2EC]">
              What&apos;s on your mind?
            </div>
          </div>
        </button>
      ) : null}

      {/* Create post modal */}
      {isOpen && (
        <div
       className="fixed inset-0 z-[150] flex items-stretch justify-center overflow-hidden bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:overflow-y-auto sm:px-5 sm:py-5"
          onClick={closeComposer}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-post-title"
            className="flex h-dvh max-h-dvh w-full max-w-none flex-col overflow-hidden bg-white shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:my-auto sm:h-auto sm:max-h-[min(84dvh,760px)] sm:max-w-130 sm:rounded-xl sm:border sm:border-[#E4E6EB]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal heading */}
            <div className="relative flex min-h-14.5 items-center justify-center border-b border-[#E4E6EB] bg-white px-5">
              <h2
                id="create-post-title"
                className="text-[17px] font-bold text-[#1C1E21]"
              >
                Create post
              </h2>

              <button
                type="button"
                onClick={closeComposer}
                disabled={isBusy}
                aria-label="Close create post"
                className="absolute right-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#E4E6EB] text-[#606770] transition hover:bg-[#D8DADF] disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

           <form
  onSubmit={handleSubmit}
  className="flex min-h-0 flex-1 flex-col overflow-hidden"
>
  {/* Independently scrollable composer content */}
  <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 pb-6 pt-4 sm:px-5 sm:pb-6">
              {/* Profile and audience */}
            
<div className="mb-4 flex items-center justify-between gap-3">
  {/* Profile and post information — unchanged */}
  <div className="flex min-w-0 items-center gap-3">
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#EAF1EB] ring-2 ring-white">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={displayName}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[17px] font-bold text-[#173B2F]">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
    </div>

    <div className="min-w-0">
      <p className="truncate text-[14px] font-bold leading-5 text-[#1C1E21]">
        {displayName}
      </p>

      <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#65676B]">
        <span>What are you sharing today?</span>
      </div>
    </div>
  </div>

  {/* Three controls aligned to the right */}
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

          const rect =
            visibilityButtonRef.current?.getBoundingClientRect();

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
                      isSelected
                        ? "bg-[#F0F5F0]"
                        : "hover:bg-[#F5F6F7]"
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
                      <span className="text-xs font-bold text-[#315C43]">
                        ✓
                      </span>
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
        title={`Post layout: ${POST_LAYOUT_LABELS[layout]}`}
        aria-label={`Post layout: ${POST_LAYOUT_LABELS[layout]}`}
        disabled={isBusy}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#DCE6DC] bg-[#F8FAF7] text-[#345342] transition hover:bg-[#EDF3EC] disabled:opacity-50"
      >
        <LayoutGrid className="h-5 w-5" />
      </button>

      <select
        id="social-post-layout"
        aria-label="Post layout"
        value={layout}
        onChange={(event) =>
          setLayout(event.target.value as PostLayout)
        }
        disabled={isBusy}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {Object.entries(POST_LAYOUT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>

    {/* Block / content type */}
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
      <button
        type="button"
        title={`Block type: ${CONTENT_TYPE_LABELS[contentType]}`}
        aria-label={`Block type: ${CONTENT_TYPE_LABELS[contentType]}`}
        disabled={isBusy}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#DCE6DC] bg-[#F8FAF7] text-[#345342] transition hover:bg-[#EDF3EC] disabled:opacity-50"
      >
        <Blocks className="h-5 w-5" />
      </button>

      <select
        id="social-post-content-type"
        aria-label="Content type for the selected paragraph"
        value={contentType}
        onChange={(event) =>
          handleContentTypeChange(
            event.target.value as SocialPostContentType,
          )
        }
        disabled={isBusy}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>

  </div>
</div>



            

            {/* Structured post block editor */}
            <div className="min-w-0 flex-1">
             <SocialRichTextEditor
                value={content}
                onEditorReady={handleEditorReady}
                onContentTypeChange={setContentType}
                onInlineImageUpload={handleInlineImageUpload}
                onVideoSelect={handleVideoSelection}
                onChange={(value, characterCount) => {
                  setContent(value);
                  setContentLength(characterCount);
                }}
                disabled={isBusy}
                maxLength={3000}
                showPlaceholder
              />

 {/* Selected media previews - Responsive collage */}

      {/* Responsive attachment collage */}
      {selectedMedia.length === 1 ? (
        <div className="flex w-full min-w-0 items-center justify-center overflow-hidden rounded-xl border border-[#D5E2D5] bg-[#F1F4F0]">
          <MediaPreview
            file={selectedMedia[0]}
            index={0}
            onRemove={() => removeMedia(0)}
            disabled={isBusy}
            single
          />
        </div>
      ) : (
        <div
          className={`grid w-full min-w-0 gap-2 ${
            selectedMedia.length === 2
              ? "grid-cols-2"
              : selectedMedia.length === 3
                ? "grid-cols-2"
                : selectedMedia.length === 5
                  ? "grid-cols-4"
                  : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {selectedMedia.map((file, index) => {
            const count = selectedMedia.length;

            let tileClass =
              "relative min-w-0 overflow-hidden rounded-xl border border-[#E1E9E0] bg-[#F1F4F0]";

            if (count === 2) {
              // Two portrait-friendly tiles; no forced landscape layout.
              tileClass += " aspect-[3/4]";
            } else if (count === 3) {
              // Give portrait photos enough room on phones; use a wide feature tile on desktop.
              tileClass +=
                index === 0
                  ? " col-span-2 aspect-[4/5] sm:aspect-[16/9]"
                  : " aspect-[4/3]";
            } else if (count === 4) {
              // Balanced two-by-two collage.
              tileClass += " aspect-[4/3]";
            } else if (count === 5) {
              // Portrait-friendly featured image on phones; wide feature tile on desktop.
              tileClass +=
                index === 0
                  ? " col-span-4 aspect-[4/5] sm:aspect-[16/9]"
                  : " col-span-2 aspect-[4/3]";
            } else {
              // Six attachments: two columns on mobile, three on larger screens.
              tileClass += " aspect-[4/3]";
            }

            return (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className={tileClass}
              >
                <MediaPreview
                  file={file}
                  index={index}
                  onRemove={() => removeMedia(index)}
                  disabled={isBusy}
                />
              </div>
            );
          })}
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

              {/* Live website link previews */}
              {visiblePreviewUrls.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-[#606770]">
                    Website previews
                  </p>
                  <SocialLinkPreview
                    urls={visiblePreviewUrls}
                    onRemove={removePreview}
                  />
                </div>
              )}

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
              </div>

              {/* Fixed action footer */}
            <div className="relative z-20 mt-0 shrink-0 border-t border-[#E4E6EB] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-4">
                <p className="mx-auto mb-2 max-w-[34rem] text-center text-[11px] leading-5 text-[#718078]">
                  Up to 6 attachments, including 1 video. Images: max 4MB each.
                  Videos: max 256MB.
                </p>
                <button
                  type="submit"
                  disabled={
                    isBusy ||
                    (contentLength === 0 &&
                      getInlineImageMediaIds(content).length === 0 &&
                      selectedMedia.length === 0)
                  }
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#245B3F] px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm transition duration-200 hover:bg-[#1D4D34] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB99A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#E7EBE8] disabled:text-[#A3ADA6] disabled:shadow-none disabled:active:scale-100"
                >
                  {isBusy ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      {isUploading ? "Uploading..." : "Publishing..."}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Post
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

export function SocialPostComposerTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.dispatchEvent(
          new Event("justdy:open-social-post-composer"),
        );
      }}
    >
      {children}
    </button>
  );
}