
"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toggleSocialPostReaction } from "@/app/actions/social-reaction";
import { setSocialPostBookmark } from "@/app/actions/social-bookmark";
import SocialPostComments from "@/app/_components/social/posts/SocialPostComments";
import { extractSocialPostUrls } from "@/lib/social/rich-text";
import { getSocialVideoSource } from "@/lib/social/video-sources";
import { useCommunityVideoWatchTracking } from "./useCommunityVideoWatchTracking";
import Link from "next/link";
import LogoImg from "@/public/images/logo.png";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Volume2,
  VolumeX,
  Video,
  ThumbsUp,
  MessageCircle,
  Share2,
  Brain,
  Lightbulb,
  PartyPopper,
  CircleHelp,
  X,
  LoaderCircle,
  RefreshCw,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
type SocialReactionType =
  | "LIKE"
  | "DISLIKE"
  | "HELPFUL"
  | "INSIGHTFUL"
  | "CELEBRATE"
  | "CURIOUS"
  | "LOVE";

type VideoReactionType =
  | "LIKE"
  | "HELPFUL"
  | "INSIGHTFUL"
  | "CELEBRATE"
  | "CURIOUS";


type CommunityVideoPost = {
  id: string;
  authorId: string;
 content: string | null;
  visibility: string;
  publishedAt: Date | null;
  createdAt: Date;
  author: {
    socialProfile: {
      displayName: string;
      username: string;
    } | null;
    imageUrl: string | null;
  };
  reactions: {
    userId: string;
    type: SocialReactionType;
    user: {
      imageUrl: string | null;
      socialProfile: {
        displayName: string;
        username: string;
      } | null;
    };
  }[];
  commentsEnabled: boolean;
  _count: {
    comments: number;
  };
  comments: {
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
  media: {
    id: string;
    media: {
      id: string;
      url: string;
      fileName: string;
      mimeType: string;
      type: string;
      purpose: string;
      status: string;
    };
  }[];
};

type VideoItem = {
  post: CommunityVideoPost;
  provider: "YOUTUBE" | "TIKTOK" | "FACEBOOK" | "DIRECT";
  videoUrl: string;
  embedUrl: string;
  videoId?: string;
  aspectRatio: "vertical" | "landscape";
};

type Props = {
  posts: CommunityVideoPost[];
  currentUserId: string;
  currentDisplayName: string;
  currentUsername: string;
  currentImageUrl: string | null;
  initialBookmarkedPostIds: string[];
  closeHref?: string;
};

function buildCommunityVideoEmbedUrl(
  item: VideoItem,
  options: { autoplay: boolean; muted: boolean },
): string {
  if (item.provider === "DIRECT") {
    return item.embedUrl;
  }

  const url = new URL(item.embedUrl);

  if (item.provider === "YOUTUBE") {
    url.searchParams.set("autoplay", options.autoplay ? "1" : "0");
    url.searchParams.set("mute", options.muted ? "1" : "0");
    url.searchParams.set("playsinline", "1");
    url.searchParams.set("loop", "1");
    url.searchParams.set("controls", "0");
    url.searchParams.set("rel", "0");
    url.searchParams.set("iv_load_policy", "3");
    url.searchParams.set("enablejsapi", "1");

    if (typeof window !== "undefined") {
      url.searchParams.set("origin", window.location.origin);
    }

    if (item.videoId) {
      url.searchParams.set("playlist", item.videoId);
    }
  }

  if (item.provider === "TIKTOK") {
    url.searchParams.set("autoplay", options.autoplay ? "1" : "0");
    url.searchParams.set("loop", "1");
  }

  if (item.provider === "FACEBOOK") {
    url.searchParams.set("autoplay", options.autoplay ? "true" : "false");
    url.searchParams.set("mute", options.muted ? "true" : "false");
  }

  return url.toString();
}

function getPlainPostText(value: string | null): string {
  if (!value) return "";

  try {
    const parsed: unknown = JSON.parse(value);
    const collectText = (node: unknown): string => {
      if (!node || typeof node !== "object") return "";
      const record = node as { text?: unknown; content?: unknown };
      if (typeof record.text === "string") return record.text;
      if (!Array.isArray(record.content)) return "";
      return record.content.map(collectText).filter(Boolean).join("");
    };
    return collectText(parsed).replace(/\\s+/g, " ").trim();
  } catch {
    return value.trim();
  }
}

export default function CommunityVideosViewer({
  posts,
  currentUserId,
  currentDisplayName,
  currentUsername,
  initialBookmarkedPostIds,
  closeHref = "/home",
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [playbackState, setPlaybackState] = useState<{
    key: string;
    status: "loading" | "buffering" | "ready" | "error";
    message?: string;
  } | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(
    () => new Set(initialBookmarkedPostIds),
  );
  const [bookmarkPendingPostIds, setBookmarkPendingPostIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{
    src: string;
    width: number;
    height: number;
  } | null>(null);
  const touchStartY = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const externalVideoFrameRef = useRef<HTMLIFrameElement | null>(null);
  const mutedRef = useRef(muted);

  // Keep every hook at the top level, before the empty-state return.
  const [reactionOverrides, setReactionOverrides] = useState<
    Record<
      string,
      {
        reaction: VideoReactionType | null;
        counts: {
          LIKE: number;
          HELPFUL: number;
          INSIGHTFUL: number;
          CELEBRATE: number;
          CURIOUS: number;
        };
      }
    >
  >({});
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [isReactionPending, startReactionTransition] = useTransition();

  const items = useMemo<VideoItem[]>(() => {
    const results: VideoItem[] = [];

    for (const post of posts) {
      const uploadedVideo = post.media.find(
        ({ media }) =>
          media.type === "VIDEO" &&
          media.purpose === "SOCIAL_POST" &&
          media.status === "ATTACHED",
      );

      if (uploadedVideo) {
        const secureUrl = `/api/storage/media/${uploadedVideo.media.id}`;

        results.push({
          post,
          provider: "DIRECT",
          videoUrl: secureUrl,
          embedUrl: secureUrl,
          aspectRatio: "vertical",
        });

        continue;
      }

      const urls = extractSocialPostUrls(post.content);

      const source = urls
        .map((url) => getSocialVideoSource(url))
        .find((candidate) => candidate !== null);

     if (source) {
      results.push({
        post,
        provider: source.provider,
        videoUrl: source.originalUrl,
        embedUrl: source.embedUrl,
        videoId: source.videoId,
        aspectRatio: source.aspectRatio,
      });
}
    }

    return results;
  }, [posts]);

  const activeItem = items[activeIndex];
  const nextItem = items[activeIndex + 1];
  const watchTracking = useCommunityVideoWatchTracking(
    activeItem
      ? {
          postId: activeItem.post.id,
          provider: activeItem.provider,
        }
      : null,
  );
  const activePlaybackKey = activeItem
    ? `${activeItem.provider}:${activeItem.videoUrl}:${retryAttempt}`
    : "empty";
  const playbackStatus =
    playbackState?.key === activePlaybackKey
      ? playbackState.status
      : "loading";

  // Keep the latest mute state available to asynchronous player messages
  // without reading or writing refs during render.
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Loading is derived from the active playback key during render, so changing
  // reels never requires a synchronous state update inside an effect.
  // This effect only manages the external timeout subscription.
  useEffect(() => {
    if (!activeItem) return;

    const timeoutMs = activeItem.provider === "DIRECT" ? 25000 : 20000;
    const timeout = window.setTimeout(() => {
      setPlaybackState((current) =>
        current?.key === activePlaybackKey && current.status !== "ready"
          ? {
              key: activePlaybackKey,
              status: "error",
              message: "This video is taking too long to load. Check your connection and try again.",
            }
          : current,
      );
    }, timeoutMs);

    return () => window.clearTimeout(timeout);
  }, [activePlaybackKey, activeItem]);

  const retryActiveVideo = () => {
    // Incrementing the attempt changes the playback key, which derives the
    // loading state immediately and remounts the active player.
    setRetryAttempt((attempt) => attempt + 1);
  };

  const sendExternalMuteCommand = (shouldMute: boolean) => {
    const frame = externalVideoFrameRef.current;

    if (!frame?.contentWindow || !activeItem) return;

    if (activeItem.provider === "YOUTUBE") {
      frame.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: shouldMute ? "mute" : "unMute",
          args: [],
        }),
        "https://www.youtube-nocookie.com",
      );
    }

    if (activeItem.provider === "TIKTOK") {
      frame.contentWindow.postMessage(
        {
          type: shouldMute ? "mute" : "unMute",
          "x-tiktok-player": true,
        },
        "https://www.tiktok.com",
      );
    }
  };

  const goNext = useCallback(() => {
    setActiveIndex((current) => Math.min(current + 1, items.length - 1));
  }, [items.length]);

  const goPrevious = useCallback(() => {
    setActiveIndex((current) => Math.max(current - 1, 0));
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (activeItem?.provider !== "DIRECT" || !video) return;

    void video.play().catch(() => {
      // Browser autoplay restrictions may require user interaction.
    });

    // Pause and reset the previous uploaded video when changing reels or
    // when this viewer unmounts (including when the close link is used).
    return () => {
      video.pause();

      try {
        video.currentTime = 0;
      } catch {
        // The browser may not have initialized the media timeline yet.
      }
    };
  }, [activeIndex, activeItem, retryAttempt]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted, activeIndex]);

  useEffect(() => {
    const frame = externalVideoFrameRef.current;
    const provider = activeItem?.provider;

    // Explicitly ask supported external players to stop when this reel is
    // replaced or the viewer closes. Removing the iframe remains the final
    // cleanup mechanism for providers without a player-control API.
    return () => {
      if (!frame?.contentWindow) return;

      if (provider === "YOUTUBE") {
        frame.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "pauseVideo",
            args: [],
          }),
          "https://www.youtube-nocookie.com",
        );
      }

      if (provider === "TIKTOK") {
        frame.contentWindow.postMessage(
          {
            type: "pause",
            "x-tiktok-player": true,
          },
          "https://www.tiktok.com",
        );
      }
    };
  }, [activeIndex, activeItem?.provider, activeItem?.videoUrl, retryAttempt]);

 
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;

      // Do not hijack arrow keys while the user is interacting with comments,
      // form fields, links, buttons, or other interactive controls.
      if (
        commentsOpen ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (target instanceof Element &&
          (target instanceof HTMLElement && target.isContentEditable ||
            target.closest(
              'aside, input, textarea, select, button, a, [role="button"], [role="textbox"], [contenteditable="true"]',
            )))
      ) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        goNext();
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        goPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commentsOpen, goNext, goPrevious]);

useEffect(() => {
  if (activeItem?.provider !== "TIKTOK") return;

  const handleTikTokMessage = (event: MessageEvent) => {
    let hostname: string;

    try {
      hostname = new URL(event.origin).hostname;
    } catch {
      return;
    }

    if (
      hostname !== "tiktok.com" &&
      !hostname.endsWith(".tiktok.com")
    ) {
      return;
    }

    if (!event.data || typeof event.data !== "object") return;

    const message = event.data as {
      type?: string;
      "x-tiktok-player"?: boolean;
    };

    if (
      message["x-tiktok-player"] !== true ||
      message.type !== "onPlayerReady"
    ) {
      return;
    }

    externalVideoFrameRef.current?.contentWindow?.postMessage(
      {
        type: mutedRef.current ? "mute" : "unMute",
        "x-tiktok-player": true,
      },
      event.origin,
    );
  };

  window.addEventListener("message", handleTikTokMessage);

  return () => {
    window.removeEventListener("message", handleTikTokMessage);
  };
}, [activeItem?.provider, activeItem?.videoUrl]);

  const isTouchTargetInteractive = (target: EventTarget | null) =>
    target instanceof Element &&
    Boolean(
      target.closest(
        'aside, button, a, input, textarea, select, [role="button"], [role="textbox"], [contenteditable="true"]',
      ),
    );

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (commentsOpen || isTouchTargetInteractive(event.target)) {
      touchStartY.current = null;
      return;
    }

    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (
      touchStartY.current === null ||
      commentsOpen ||
      isTouchTargetInteractive(event.target)
    ) {
      touchStartY.current = null;
      return;
    }

    const endY = event.changedTouches[0]?.clientY ?? touchStartY.current;
    const distance = touchStartY.current - endY;

    if (distance > 55) goNext();
    if (distance < -55) goPrevious();

    touchStartY.current = null;
  };


  const reactionTypes = [
    "LIKE",
    "HELPFUL",
    "INSIGHTFUL",
    "CELEBRATE",
    "CURIOUS",
  ] as const;

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#101510] px-6 text-center text-white">
        <Video className="h-12 w-12 text-white/50" />
        <h2 className="mt-5 text-xl font-bold">No community videos yet</h2>
        <p className="mt-2 max-w-sm text-sm text-white/60">
          Videos shared by members will appear here.
        </p>
      </div>
    );
  }

  const post = activeItem.post;

  const measuredAspectRatio =
    activeItem.provider === "DIRECT" &&
    videoDimensions?.src === activeItem.videoUrl &&
    videoDimensions.height > 0
      ? videoDimensions.width / videoDimensions.height
      : null;
  const videoAspectRatio =
    measuredAspectRatio ??
    (activeItem.aspectRatio === "vertical" ? 9 / 16 : 16 / 9);

  // These identity fields must always come from the author of this post.
  // currentDisplayName/currentUsername/currentImageUrl belong to the viewer
  // and are used only by viewer-specific interactions such as commenting.
  const authorName =
    post.author.socialProfile?.displayName?.trim() || "Justdy member";
  const authorUsername =
    post.author.socialProfile?.username?.trim() || "member";
  const authorImageUrl = post.author.imageUrl;

  const currentReaction = post.reactions.find(
    (reaction) => reaction.userId === currentUserId,
  )?.type;

  const initialReaction =
    currentReaction && reactionTypes.includes(
      currentReaction as (typeof reactionTypes)[number],
    )
      ? (currentReaction as VideoReactionType)
      : null;

  const initialReactionCounts = {
    LIKE: post.reactions.filter((r) => r.type === "LIKE").length,
    HELPFUL: post.reactions.filter((r) => r.type === "HELPFUL").length,
    INSIGHTFUL: post.reactions.filter((r) => r.type === "INSIGHTFUL").length,
    CELEBRATE: post.reactions.filter((r) => r.type === "CELEBRATE").length,
    CURIOUS: post.reactions.filter((r) => r.type === "CURIOUS").length,
  };

  const activeReactionState = reactionOverrides[post.id];
  const selectedReaction = activeReactionState
    ? activeReactionState.reaction
    : initialReaction;
  const reactionCounts =
    activeReactionState?.counts ?? initialReactionCounts;

  const reactionChoices = [
    { type: "LIKE", label: "Like", Icon: ThumbsUp },
    { type: "HELPFUL", label: "Helpful", Icon: Lightbulb },
    { type: "INSIGHTFUL", label: "Insightful", Icon: Brain },
    { type: "CELEBRATE", label: "Celebrate", Icon: PartyPopper },
    { type: "CURIOUS", label: "Curious", Icon: CircleHelp },
  ] as const;

  function handleVideoReaction(type: VideoReactionType) {
    if (isReactionPending) return;

    const previousReaction = selectedReaction;
    const previousCounts = { ...reactionCounts };
    const nextReaction = previousReaction === type ? null : type;
    const nextCounts = { ...previousCounts };

    if (previousReaction && previousReaction in nextCounts) {
      nextCounts[previousReaction as keyof typeof nextCounts] = Math.max(
        0,
        nextCounts[previousReaction as keyof typeof nextCounts] - 1,
      );
    }
    if (nextReaction && nextReaction in nextCounts) {
      nextCounts[nextReaction as keyof typeof nextCounts] += 1;
    }

    setReactionOverrides((current) => ({
      ...current,
      [post.id]: { reaction: nextReaction, counts: nextCounts },
    }));
    setReactionPickerOpen(false);

    startReactionTransition(async () => {
      const result = await toggleSocialPostReaction(post.id, type);
      if (!result.success) {
        setReactionOverrides((current) => ({
          ...current,
          [post.id]: {
            reaction: previousReaction,
            counts: previousCounts,
          },
        }));
        return;
      }
      setReactionOverrides((current) => ({
        ...current,
        [post.id]: {
          reaction:
            result.reaction && reactionTypes.includes(
              result.reaction as (typeof reactionTypes)[number],
            )
              ? (result.reaction as VideoReactionType)
              : null,
          counts: nextCounts,
        },
      }));
    });
  }

  async function handleVideoBookmark() {
    if (bookmarkPendingPostIds.has(post.id)) return;

    const wasBookmarked = bookmarkedPostIds.has(post.id);
    const nextBookmarked = !wasBookmarked;

    setBookmarkError(null);
    setBookmarkedPostIds((current) => {
      const next = new Set(current);
      if (nextBookmarked) next.add(post.id);
      else next.delete(post.id);
      return next;
    });
    setBookmarkPendingPostIds((current) => new Set(current).add(post.id));

    try {
      const result = await setSocialPostBookmark(post.id, nextBookmarked);
      if (!result.success) {
        setBookmarkedPostIds((current) => {
          const next = new Set(current);
          if (wasBookmarked) next.add(post.id);
          else next.delete(post.id);
          return next;
        });
        setBookmarkError(result.error || "Unable to update saved video.");
      }
    } catch {
      setBookmarkedPostIds((current) => {
        const next = new Set(current);
        if (wasBookmarked) next.add(post.id);
        else next.delete(post.id);
        return next;
      });
      setBookmarkError("Unable to update saved video. Please try again.");
    } finally {
      setBookmarkPendingPostIds((current) => {
        const next = new Set(current);
        next.delete(post.id);
        return next;
      });
    }
  }

  function handleVideoComment() {
    setCommentsOpen((open) => !open);
  }

  async function handleVideoShare() {
    const postUrl = `${window.location.origin}/post/${encodeURIComponent(post.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Justdy Reels",
          text: "Watch this reel on Justdy.",
          url: postUrl,
        });
      } else {
        await navigator.clipboard.writeText(postUrl);
      }
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(postUrl);
        } catch {
          // Sharing is unavailable in this browser.
        }
      }
    }
  }

  const embedUrl = buildCommunityVideoEmbedUrl(activeItem, {
    autoplay: true,
    muted: true,
  });

  return (
    <div
      className="fixed inset-0 z-[60] overflow-hidden bg-[#101510] text-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Warm the next player in the background to reduce the delay on swipe.
          It is loaded muted and does not autoplay before becoming active. */}
      {nextItem?.provider === "DIRECT" && (
        <video
          key={`preload-${nextItem.videoUrl}`}
          src={nextItem.videoUrl}
          preload="auto"
          muted
          playsInline
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none fixed left-[-10000px] top-0 h-[200px] w-[200px] opacity-0"
        />
      )}

      {nextItem && nextItem.provider !== "DIRECT" && (
        <iframe
          key={`preload-${nextItem.provider}-${nextItem.embedUrl}`}
          src={buildCommunityVideoEmbedUrl(nextItem, {
            autoplay: false,
            muted: true,
          })}
          title="Preloading next community video"
          loading="eager"
          aria-hidden="true"
          tabIndex={-1}
          allow="encrypted-media; picture-in-picture"
          className="pointer-events-none fixed left-[-10000px] top-0 h-[200px] w-[200px] border-0 opacity-0"
        />
      )}

     <div className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex items-center gap-0 sm:left-4">
        <Link
          href={closeHref}
          aria-label="Close Community Videos and return to the previous page"
          className="rounded-full bg-[#f58750] p-2.5 text-white transition hover:bg-black/80"
        >
          <X className="h-4 w-4" />
        </Link>

         <Link
           href="/community-videos/discover"
           aria-label="Discover community videos"
           title="Discover videos"
           className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/70"
         >
           <Video className="h-4 w-4" />
         </Link>

         <Link
           href="/saved-videos"
           aria-label="Open saved videos"
           title="Saved videos"
           className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/70"
         >
           <Bookmark className="h-4 w-4" />
         </Link>

         <Link
             href="/"
             className="group inline-flex flex-row items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#302044]/90 transition hover:bg-[#147D72]/10 hover:text-[#147D72]"
           >
             <Image
               src={LogoImg}
               alt="Justdy logo"
               width={34}
               height={34}
               priority
               className="h-9 w-9 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
             />
           </Link>
      </div>

      <div className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex items-center gap-2 sm:right-4">
        <button
          type="button"
         onClick={() => {
                const nextMuted = !muted;

                setMuted(nextMuted);

                if (
                  activeItem.provider === "YOUTUBE" ||
                  activeItem.provider === "TIKTOK"
                ) {
                  sendExternalMuteCommand(nextMuted);
                }
              }}
          disabled={activeItem.provider === "FACEBOOK"}
          title={
            activeItem.provider === "FACEBOOK"
              ? "Use the Facebook player's own volume controls"
              : muted
                ? "Turn sound on"
                : "Mute video"
          }
          className="rounded-full bg-black/60 p-3 text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={muted ? "Turn sound on" : "Mute video"}
        >
          {muted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="absolute inset-0 flex h-[100dvh] w-full items-center justify-center px-1 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="relative flex h-full w-full max-w-7xl items-center justify-center">
          <div className="relative flex items-center justify-center">
          <div
            className="relative flex h-[calc(100dvh-24px)] w-auto max-w-[calc(100vw-84px)] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#17221b] via-[#080b09] to-[#17221b] sm:max-w-[calc(100vw-120px)]"
            style={{
              aspectRatio: videoAspectRatio,
              width: `min(calc((100dvh - 24px) * ${videoAspectRatio}), calc(100vw - 84px))`,
              height: `min(calc(100dvh - 24px), calc((100vw - 84px) / ${videoAspectRatio}))`,
            }}
          >
            {activeItem.provider === "DIRECT" ? (
              <video
                key={`${activeItem.videoUrl}-${retryAttempt}`}
                ref={videoRef}
                src={activeItem.videoUrl}
                autoPlay
                muted={muted}
                loop
                playsInline
                controls
                onPlay={watchTracking.onPlay}
                onTimeUpdate={watchTracking.onTimeUpdate}
                onPause={watchTracking.onPause}
                onEnded={watchTracking.onEnded}
                onLoadStart={() =>
                  setPlaybackState({ key: activePlaybackKey, status: "loading" })
                }
                onWaiting={() =>
                  setPlaybackState({ key: activePlaybackKey, status: "buffering" })
                }
                onStalled={() =>
                  setPlaybackState({ key: activePlaybackKey, status: "buffering" })
                }
                onPlaying={() =>
                  setPlaybackState({ key: activePlaybackKey, status: "ready" })
                }
                onCanPlay={() =>
                  setPlaybackState({ key: activePlaybackKey, status: "ready" })
                }
                onError={() =>
                  setPlaybackState({
                    key: activePlaybackKey,
                    status: "error",
                    message: "This uploaded video could not be played. It may have been removed or is temporarily unavailable.",
                  })
                }
                onLoadedMetadata={(event) => {
                  const video = event.currentTarget;
                  if (video.videoWidth > 0 && video.videoHeight > 0) {
                    setVideoDimensions({
                      src: activeItem.videoUrl,
                      width: video.videoWidth,
                      height: video.videoHeight,
                    });
                  }
                }}
                className={`h-full w-full object-contain transition-opacity duration-300 ease-out ${playbackStatus === "loading" ? "opacity-60" : "opacity-100"}`}
              />
            ) : (
              <iframe
                key={`${activeItem.provider}-${activeItem.embedUrl}-${retryAttempt}`}
                ref={externalVideoFrameRef}
                src={embedUrl}
                title={`${authorName}'s community video`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                onLoad={() => {
                  setPlaybackState({ key: activePlaybackKey, status: "ready" });
                  if (activeItem.provider === "YOUTUBE") {
                    sendExternalMuteCommand(mutedRef.current);
                  }
                }}
                onError={() =>
                  setPlaybackState({
                    key: activePlaybackKey,
                    status: "error",
                    message: "This external video could not be loaded. The original video may be unavailable or embedding may be restricted.",
                  })
                }
                className={`h-full w-full border-0 transition-opacity duration-300 ease-out ${playbackStatus === "loading" ? "opacity-60" : "opacity-100"}`}
              />
            )}

            {playbackStatus === "loading" && (
              <div
                className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/35 text-center text-white transition-opacity duration-200"
                role="status"
                aria-live="polite"
              >
                <LoaderCircle className="h-9 w-9 animate-spin" />
                <p className="text-sm font-medium">Loading video…</p>
              </div>
            )}

            {playbackStatus === "buffering" && (
              <div
                className="pointer-events-none absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-sm sm:bottom-6"
                role="status"
                aria-live="polite"
              >
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Reconnecting…
              </div>
            )}

            {playbackStatus === "error" && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center text-white">
                <AlertCircle className="h-10 w-10 text-orange-300" />
                <p className="max-w-xs text-sm leading-6">
                  {playbackState?.key === activePlaybackKey
                    ? playbackState.message
                    : "This video could not be loaded."}
                </p>
                <button
                  type="button"
                  onClick={retryActiveVideo}
                  className="inline-flex items-center gap-2 rounded-full bg-[#f58750] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e8753f]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            )}

          <div className="absolute bottom-20 left-3 z-20 w-[min(420px,calc(100%-88px))] sm:bottom-6 sm:left-6 sm:w-[min(420px,calc(100%-104px))]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#315B43] text-sm font-bold ring-1 ring-white/30">
                {authorImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={authorImageUrl}
                    alt={authorName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  authorName.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                <p className="truncate text-sm font-bold text-white">{authorName}</p>
                <p className="truncate text-xs text-white/85">@{authorUsername}</p>
              </div>
            </div>
            {getPlainPostText(post.content) && (
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                {getPlainPostText(post.content)}
              </p>
            )}
          </div>

          </div>

          {/* Vertical Reels action rail */}
          <div className="absolute bottom-8 right-[-40px] z-30 flex flex-col-reverse items-center gap-4 sm:bottom-8 sm:right-[-58px] sm:gap-5">
            <div className="relative flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (window.matchMedia("(hover: none)").matches) {
                    setReactionPickerOpen((open) => !open);
                  } else {
                    handleVideoReaction(selectedReaction ?? "LIKE");
                  }
                }}
                disabled={isReactionPending}
                aria-label={selectedReaction ? "Remove reaction" : "Like reel"}
                aria-pressed={Boolean(selectedReaction)}
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-50 ${selectedReaction ? "text-emerald-300" : ""}`}
              >
                {selectedReaction === "HELPFUL" ? <Lightbulb className="h-6 w-6" /> :
                 selectedReaction === "INSIGHTFUL" ? <Brain className="h-6 w-6" /> :
                 selectedReaction === "CELEBRATE" ? <PartyPopper className="h-6 w-6" /> :
                 selectedReaction === "CURIOUS" ? <CircleHelp className="h-6 w-6" /> :
                 <ThumbsUp className="h-6 w-6" />}
              </button>
              <span className="text-xs font-semibold text-white">{reactionCounts.LIKE + reactionCounts.HELPFUL + reactionCounts.INSIGHTFUL + reactionCounts.CELEBRATE + reactionCounts.CURIOUS}</span>
              {reactionPickerOpen && (
                <div className="absolute bottom-0 right-14 z-50 flex gap-1 rounded-full bg-black/85 p-2 shadow-xl">
                  {reactionChoices.map(({ type, label, Icon }) => (
                    <button key={type} type="button" title={label} aria-label={label}
                      onClick={() => handleVideoReaction(type)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${selectedReaction === type ? "bg-white/25 text-emerald-300" : "text-white hover:bg-white/15"}`}>
                      <Icon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleVideoBookmark}
              disabled={bookmarkPendingPostIds.has(post.id)}
              aria-label={bookmarkedPostIds.has(post.id) ? "Remove saved video" : "Save video"}
              aria-pressed={bookmarkedPostIds.has(post.id)}
              title={bookmarkedPostIds.has(post.id) ? "Remove from saved videos" : "Save video"}
              className={`flex flex-col items-center gap-1 transition disabled:cursor-wait disabled:opacity-60 ${
                bookmarkedPostIds.has(post.id) ? "text-amber-300" : "text-white hover:text-amber-200"
              }`}
            >
              {bookmarkedPostIds.has(post.id) ? (
                <BookmarkCheck className="h-6 w-6" />
              ) : (
                <Bookmark className="h-6 w-6" />
              )}
              <span className="text-xs font-semibold">
                {bookmarkPendingPostIds.has(post.id)
                  ? "Saving"
                  : bookmarkedPostIds.has(post.id)
                    ? "Saved"
                    : "Save"}
              </span>
            </button>
            <button type="button" onClick={handleVideoComment} aria-label="View comments"
              className="flex flex-col items-center gap-1 text-white transition hover:text-emerald-200">
              <MessageCircle className="h-6 w-6" />
              <span className="text-xs font-semibold">{post._count.comments}</span>
            </button>
            <button type="button" onClick={handleVideoShare} aria-label="Share reel"
              className="flex flex-col items-center gap-1 text-white transition hover:text-emerald-200">
              <Share2 className="h-6 w-6" />
              <span className="text-xs font-semibold">Share</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      {bookmarkError && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-black/85 px-4 py-2 text-xs font-medium text-white shadow-lg"
        >
          {bookmarkError}
        </div>
      )}

      {commentsOpen && (
        <aside
          key={post.id}
          className="absolute inset-x-0 bottom-0 top-auto z-40 flex h-[min(78dvh,680px)] w-full flex-col rounded-t-2xl border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] text-[#202124] shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:max-w-[380px] sm:rounded-none sm:border-l sm:border-t-0 sm:pb-0"
          aria-label="Reel comments"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-5 sm:h-16">
            <h2 className="text-base font-bold">Comments</h2>
            <button
              type="button"
              onClick={() => setCommentsOpen(false)}
              aria-label="Close comments"
              className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <SocialPostComments
              postId={post.id}
              initialComments={post.comments}
              initialCommentCount={post._count.comments}
              commentsEnabled={post.commentsEnabled}
              currentDisplayName={currentDisplayName}
              currentUsername={currentUsername}
              currentUserId={currentUserId}
              initialExpanded
            />
          </div>
        </aside>
      )}

      <div className={`absolute top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 sm:flex ${commentsOpen ? "right-[392px]" : "right-3"}`}>
        <button
          type="button"
          onClick={goPrevious}
          disabled={activeIndex === 0}
          aria-label="Previous video"
          className="rounded-full bg-black/60 p-3 text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUp className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={activeIndex === items.length - 1}
          aria-label="Next video"
          className="rounded-full bg-black/60 p-3 text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      </div>

    </div>
  );
}
