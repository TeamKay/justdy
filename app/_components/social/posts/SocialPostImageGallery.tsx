
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Images,
  MessageCircle,
} from "lucide-react";
import SocialPostComments from "./SocialPostComments";

type GalleryMedia = {
  id: string;
  media: {
    id: string;
    fileName: string;
    mimeType: string;
    type?: string;
    purpose?: string;
    status?: string;
  };
};

function getPostText(value: string): string {
  if (!value.trim()) return "";

  try {
    const parsed: unknown = JSON.parse(value);

    const collect = (node: unknown): string => {
      if (!node || typeof node !== "object") return "";

      const record = node as { text?: unknown; content?: unknown };

      if (typeof record.text === "string") return record.text;
      if (!Array.isArray(record.content)) return "";

      return record.content.map(collect).filter(Boolean).join(" ");
    };

    return collect(parsed).replace(/\s+/g, " ").trim();
  } catch {
    return value.trim();
  }
}

type Props = {
  media: GalleryMedia[];
  authorName: string;
  authorImageUrl: string | null;
  publishedLabel: string;
  postContent: string;
  postId: string;
  initialComments: {
    id: string;
    authorId: string;
    content: string;
    createdAt: Date;
    author: {
      socialProfile: {
        displayName: string;
        username: string;
      } | null;
    };
  }[];
  initialCommentCount: number;
  commentsEnabled: boolean;
  currentDisplayName: string;
  currentUsername: string;
  currentUserId: string;
};

export default function SocialPostImageGallery({
  media,
  authorName,
  authorImageUrl,
  publishedLabel,
  postContent,
  postId,
  initialComments,
  initialCommentCount,
  commentsEnabled,
  currentDisplayName,
  currentUsername,
  currentUserId,
}: Props) {
  const [viewerOpen, setViewerOpen] = useState(false);
const [activeIndex, setActiveIndex] = useState(0);
const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const imageItems = useMemo(
    () => media.filter((item) => item.media.mimeType.startsWith("image/")),
    [media],
  );

  const imageUrl = (id: string) =>
    `/api/storage/media/${encodeURIComponent(id)}`;

  const caption = getPostText(postContent);

  const openViewer = (index: number) => {
    setActiveIndex(index);
    setViewerOpen(true);
  };

  const closeViewer = useCallback(() => setViewerOpen(false), []);

  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(index, imageItems.length - 1));
      setActiveIndex(next);

      scrollerRef.current?.children[next]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [imageItems.length],
  );

  useEffect(() => {
    if (!viewerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

  const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    if (mobileCommentsOpen) {
      setMobileCommentsOpen(false);
    } else {
      closeViewer();
    }
    return;
  }

  // Do not navigate images while the comments sheet is open.
  if (mobileCommentsOpen) return;

  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    goTo(activeIndex + 1);
  }

  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    goTo(activeIndex - 1);
  }
};

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
}, [viewerOpen, activeIndex, mobileCommentsOpen, closeViewer, goTo]);

  const onScroll = () => {
    const element = scrollerRef.current;
    if (!element) return;

    const index = Math.round(element.scrollTop / element.clientHeight);
    setActiveIndex(Math.max(0, Math.min(index, imageItems.length - 1)));
  };

  if (!media.length) return null;

  const tile = (
  item: GalleryMedia,
  index: number,
  remaining = 0,
  singleImage = false,
) => {
    const isImage = item.media.mimeType.startsWith("image/");

    const content = isImage ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl(item.media.id)}
        alt={item.media.fileName || `Post image ${index + 1}`}
        loading="lazy"
        className={
  singleImage
    ? "block h-auto max-h-[650px] w-auto max-w-full object-contain"
    : "h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
}
      />
    ) : (
      <video
        controls
        playsInline
        preload="metadata"
        className="h-full w-full bg-black object-contain"
      >
        <source src={imageUrl(item.media.id)} type={item.media.mimeType} />
        Your browser does not support video playback.
      </video>
    );

    const imageIndex = imageItems.findIndex(
      (image) => image.id === item.id,
    );

    return (
      <div
        key={item.id}
        className={`group relative min-w-0 overflow-hidden ${
  singleImage
    ? "w-full bg-black"
    : "h-full min-h-0 bg-[#E9EEE9]"
}`}
      >
        {isImage ? (
          <button
            type="button"
            onClick={() => openViewer(imageIndex)}
            aria-label={`View image ${index + 1}`}
            className={`cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#52745D] ${
  singleImage
    ? "flex w-full justify-center"
    : "block h-full w-full"
}`}
          >
            {content}
          </button>
        ) : (
          content
        )}

        {remaining > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 text-3xl font-bold text-white sm:text-4xl">
            +{remaining}
          </div>
        )}
      </div>
    );
  };

  const visible = media.slice(0, 5);

  return (
    <>
      <div
        aria-label={`${media.length} post attachments`}
        className="mt-0 overflow-hidden rounded-none border border-[#E8EDE7] bg-[#F0F3EF] shadow-[0_2px_10px_rgba(23,59,47,0.045)] sm:mt-0"
      >
        {media.length === 1 ? (
  media[0].media.mimeType.startsWith("image/") ? (
    <div className="w-full bg-black">
      {tile(media[0], 0, 0, true)}
    </div>
  ) : (
    <div className="mx-auto aspect-[4/3] max-h-[650px] w-full">
      {tile(media[0], 0)}
    </div>
  )
) : media.length === 2 ? (
         <div className="grid aspect-[4/3] grid-cols-2 gap-1 bg-[#F0F3EF] sm:aspect-[4/3]">
            {media.map((item, index) => tile(item, index))}
          </div>
        ) : media.length === 3 ? (
         <div className="grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-1 bg-[#F0F3EF] sm:aspect-[4/3]">
            <div className="row-span-2 min-h-0">
              {tile(media[0], 0)}
            </div>
            {media.slice(1, 3).map((item, index) => (
              <div key={item.id} className="min-h-0">
                {tile(item, index + 1)}
              </div>
            ))}
          </div>
        ) : media.length === 4 ? (
         <div className="grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-1 bg-[#F0F3EF] sm:aspect-[4/3]">
            {media.map((item, index) => tile(item, index))}
          </div>
        ) : (
         <div className="grid aspect-[4/3] grid-cols-6 grid-rows-2 gap-1 bg-[#F0F3EF] sm:aspect-[4/3]">
            {visible.slice(0, 2).map((item, index) => (
              <div key={item.id} className="col-span-3 min-h-0">
                {tile(item, index)}
              </div>
            ))}

            {visible.slice(2, 5).map((item, index) => (
              <div key={item.id} className="col-span-2 min-h-0">
                {tile(
                  item,
                  index + 2,
                  index === 2 ? media.length - 5 : 0,
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {viewerOpen &&
        imageItems.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen overflow-hidden bg-black text-white"
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
          >
            <button
              type="button"
              onClick={closeViewer}
              aria-label="Close image viewer"
              title="Close viewer"
              className="absolute left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white shadow-lg backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="relative flex min-w-0 flex-1 items-center justify-center">
              <div
                ref={scrollerRef}
                onScroll={onScroll}
                className="h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none]"
              >
                {imageItems.map((item, index) => (
                  <section
                    key={item.id}
                    className="flex h-full min-h-full snap-start items-center justify-center px-3 py-14 sm:px-10 sm:py-8"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl(item.media.id)}
                      alt={item.media.fileName || `Post image ${index + 1}`}
                      className="max-h-full max-w-full select-none object-contain"
                      draggable={false}
                    />
                  </section>
                ))}
              </div>

              {activeIndex > 0 && (
                <button
                  type="button"
                  onClick={() => goTo(activeIndex - 1)}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/70"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {activeIndex < imageItems.length - 1 && (
                <button
                  type="button"
                  onClick={() => goTo(activeIndex + 1)}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/70"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

              <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                {activeIndex + 1} / {imageItems.length}
              </div>
            </div>

            <aside className="hidden w-[390px] shrink-0 flex-col border-l border-[#E8ECE8] bg-white text-[#17221B] md:flex">
              <div className="flex shrink-0 items-center gap-3 border-b border-[#E8ECE8] px-5 py-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF1EB] text-sm font-bold text-[#315B43]">
                  {authorImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={authorImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    authorName.slice(0, 1).toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{authorName}</p>
                  <p className="mt-0.5 text-xs text-[#87938A]">
                    {publishedLabel}
                  </p>
                </div>
              </div>

              <div className="shrink-0 border-b border-[#E8ECE8] px-5 py-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#87938A]">
                  <Images className="h-4 w-4" />
                  {imageItems.length}{" "}
                  {imageItems.length === 1 ? "photo" : "photos"}
                </div>

                {caption && (
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#344D40]">
                    {caption}
                  </p>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
                <SocialPostComments
                  postId={postId}
                  initialComments={initialComments}
                  initialCommentCount={initialCommentCount}
                  commentsEnabled={commentsEnabled}
                  currentDisplayName={currentDisplayName}
                  currentUsername={currentUsername}
                  currentUserId={currentUserId}
                  initialExpanded
                  disableAutoScroll
                />
              </div>
            </aside>

            {/* Mobile comments button */}
{/* Mobile comments button */}
<button
  type="button"
  onClick={() => setMobileCommentsOpen(true)}
  aria-label={`Open comments, ${initialCommentCount} comments`}
  aria-expanded={mobileCommentsOpen}
  className="absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-4 z-30 flex h-11 min-w-14 items-center justify-center gap-2 px-3 transition-all duration-200 hover:scale-105 hover:text-[#f3f30777] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8EB69A] md:hidden"
>
  <MessageCircle
    className="h-5 w-5 text-[#f7fbf9] hover:text-[#bcf903]"
    strokeWidth={2.2}
  />

  <span className="text-sm font-bold tabular-nums text-[#bcf903]">
    {initialCommentCount}
  </span>
</button>

{/* Mobile comments bottom sheet */}
{mobileCommentsOpen && (
  <>
    <button
      type="button"
      aria-label="Close comments"
      onClick={() => setMobileCommentsOpen(false)}
      className="absolute inset-0 z-40 bg-black/60 md:hidden"
    />

    <section
      aria-label="Post comments"
      className="absolute inset-x-0 bottom-0 z-50 flex max-h-[78dvh] flex-col overflow-hidden rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] text-[#17221B] shadow-2xl md:hidden"
    >
      <div className="relative flex h-14 shrink-0 items-center justify-center border-b border-[#E8ECE8] px-5">
  <div className="h-1.5 w-12 rounded-full bg-[#DCE5DC]" />

  <button
    type="button"
    onClick={() => setMobileCommentsOpen(false)}
    aria-label="Close comments"
    className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F3EF] text-[#315B43] transition hover:bg-[#E3EBE3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8EB69A]"
  >
    <X className="h-5 w-5" />
  </button>
</div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <SocialPostComments
          postId={postId}
          initialComments={initialComments}
          initialCommentCount={initialCommentCount}
          commentsEnabled={commentsEnabled}
          currentDisplayName={currentDisplayName}
          currentUsername={currentUsername}
          currentUserId={currentUserId}
          initialExpanded
          disableAutoScroll
        />
      </div>
    </section>
  </>
)}

            <div className="absolute left-16 top-4 z-30 flex items-center gap-2 md:hidden">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/15 text-sm font-bold">
                {authorImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={authorImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  authorName.slice(0, 1).toUpperCase()
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {authorName}
                </p>
                <p className="text-[11px] text-white/70">
                  {publishedLabel}
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
