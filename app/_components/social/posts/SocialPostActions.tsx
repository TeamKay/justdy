
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowRight,
  Brain,
  Check,
  CircleHelp,
  Lightbulb,
  MessageCircle,
  PartyPopper,
  Share2,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import {
  toggleSocialPostReaction,
  type SocialReactionType,
} from "@/app/actions/social-reaction";

type ReactionCounts = Record<SocialReactionType, number>;

type Liker = {
  userId: string;
  imageUrl: string | null;
  displayName: string;
  username: string | null;
};

type SocialPostActionsProps = {
  postId: string;
  showCounts?: boolean;
  initialReaction: SocialReactionType | null;
  initialReactionCounts: ReactionCounts;
  initialCommentCount: number;
  initialLikers: Liker[];
  currentUserId: string;
  currentUserLiker: Liker;
};

const reactionOptions: {
  type: SocialReactionType;
  label: string;
  emoji: string;
}[] = [
  { type: "LIKE", label: "Like", emoji: "👍" },
  { type: "HELPFUL", label: "Helpful", emoji: "🥰" },
  { type: "INSIGHTFUL", label: "Insightful", emoji: "🤔" },
  { type: "CELEBRATE", label: "Celebrate", emoji: "🎉" },
  { type: "CURIOUS", label: "Curious", emoji: "😮" },
];

export default function SocialPostActions({
  postId,
  showCounts = true,
  initialReaction,
  initialReactionCounts,
  initialCommentCount,
  initialLikers,
  currentUserId,
  currentUserLiker,
}: SocialPostActionsProps) {
  const [reaction, setReaction] =
    useState<SocialReactionType | null>(initialReaction);

  const [counts, setCounts] = useState<ReactionCounts>({
    ...initialReactionCounts,
  });

  const [likers, setLikers] = useState(initialLikers);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [likersOpen, setLikersOpen] = useState(false);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const pickerRef = useRef<HTMLDivElement>(null);
  const likersRef = useRef<HTMLDivElement>(null);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  const selectedOption = reactionOptions.find(
    (option) => option.type === reaction,
  );

  const activeEmoji = selectedOption?.emoji ?? "👍";
  const activeReactionCount = reaction
  ? counts[reaction]
  : counts.LIKE;

  useEffect(() => {
  function handleCommentCountChange(event: Event) {
    const customEvent = event as CustomEvent<{
      postId: string;
      delta: number;
    }>;

    if (customEvent.detail?.postId !== postId) return;

    setCommentCount((count) =>
      Math.max(0, count + customEvent.detail.delta),
    );
  }

  window.addEventListener(
    "justdy:comment-count-change",
    handleCommentCountChange,
  );

  return () => {
    window.removeEventListener(
      "justdy:comment-count-change",
      handleCommentCountChange,
    );
  };
}, [postId]);

  useEffect(() => {
  if (!pickerOpen && !likersOpen) return;

  function handleOutsideClick(event: PointerEvent) {
    const target = event.target;

    if (!(target instanceof Node)) return;

    const insidePicker = pickerRef.current?.contains(target);
    const insideLikers = likersRef.current?.contains(target);

    if (!insidePicker && !insideLikers) {
      setPickerOpen(false);
      setLikersOpen(false);
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === "Escape") {
      setPickerOpen(false);
      setLikersOpen(false);
    }
  }

  document.addEventListener("pointerdown", handleOutsideClick);
  document.addEventListener("keydown", handleEscape);

  return () => {
    document.removeEventListener("pointerdown", handleOutsideClick);
    document.removeEventListener("keydown", handleEscape);
  };
}, [pickerOpen, likersOpen]);

  function handleReaction(type: SocialReactionType) {
    if (isPending) return;

    const previousReaction = reaction;
    const previousCounts = { ...counts };
    const previousLikers = [...likers];

    const nextReaction =
      previousReaction === type ? null : type;

    const nextCounts = { ...previousCounts };

    if (previousReaction) {
      nextCounts[previousReaction] = Math.max(
        0,
        nextCounts[previousReaction] - 1,
      );
    }

    if (nextReaction) {
      nextCounts[nextReaction] += 1;
    }

    let nextLikers = [...previousLikers];

      // Remove the current user if their previous reaction was Like.
      if (previousReaction === "LIKE") {
        nextLikers = nextLikers.filter(
          (liker) => liker.userId !== currentUserId,
        );
      }

      // Add the current user immediately if their next reaction is Like.
      if (nextReaction === "LIKE") {
        const alreadyListed = nextLikers.some(
          (liker) => liker.userId === currentUserId,
        );

        if (!alreadyListed) {
          nextLikers = [
            currentUserLiker,
            ...nextLikers,
          ];
        }
      }

    setReaction(nextReaction);
    setCounts(nextCounts);
    setLikers(nextLikers);
    setPickerOpen(false);
    setError("");

    startTransition(async () => {
      const result = await toggleSocialPostReaction(postId, type);

      if (!result.success) {
        setReaction(previousReaction);
        setCounts(previousCounts);
        setLikers(previousLikers);
        setError(result.error);
        return;
      }

      setReaction(result.reaction);
    });
  }

  function handleComment() {
    window.dispatchEvent(
      new CustomEvent("justdy:toggle-comments", {
        detail: { postId },
      }),
    );
  }

  async function handleShare() {
    setShareMessage("");

    const postUrl = `${window.location.origin}/post/${encodeURIComponent(postId)}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Justdy learning community",
          text: "Check out this post on Justdy.",
          url: postUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(postUrl);
      setShareMessage("Post link copied.");
    } catch (shareError) {
      if (
        shareError instanceof Error &&
        shareError.name === "AbortError"
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(postUrl);
        setShareMessage("Post link copied.");
      } catch {
        setShareMessage("Unable to share this post.");
      }
    }
  }

  return (
    <div className="relative mt-0">
    <div className="flex min-h-8 items-center bg-[#FCFDFC] shadow-[0_1px_3px_rgba(23,59,47,0.035)]">

        {/* LEFT: LIKE, COMMENT AND SHARE */}
        <div className="flex min-w-0 items-center">
          <div
            ref={pickerRef}
            className="relative"
            onMouseEnter={() => {
              setPickerOpen(true);
              setLikersOpen(false);
            }}
            onMouseLeave={() => setPickerOpen(false)}
          >
            <button
              type="button"
              onClick={() => {
                const isTouchDevice = window.matchMedia("(hover: none)").matches;

                if (isTouchDevice) {
                  setLikersOpen(false);
                  setPickerOpen((open) => !open);
                  return;
                }

                handleReaction(reaction ?? "LIKE");
              }}
              disabled={isPending}
              aria-label={reaction ? `Remove ${selectedOption?.label}` : "Like post"}
              aria-pressed={Boolean(reaction)}
              className={`flex h-8 items-center gap-2 px-4 text-sm transition-colors duration-200 hover:bg-[#F0F5F0] disabled:opacity-50 ${
                reaction ? "font-semibold text-[#315B43]" : "text-[#68716F]"
              }`}
            >
              {reaction ? (
                <span className="text-xl leading-none">{activeEmoji}</span>
              ) : (
                <ThumbsUp className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              )}

               {showCounts && (
                <span className="text-sm font-normal tabular-nums">
                  {activeReactionCount}
                </span>
              )}
            </button>

            {pickerOpen && (
              <div className="absolute bottom-full left-0 z-40 mb-0 flex items-center gap-1 rounded-lg border border-[#E5E9E5] bg-white px-2 py-2 shadow-[0_5px_22px_rgba(0,0,0,0.16)]">
                {reactionOptions.map((option) => {
                  const selected = reaction === option.type;

                  return (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => handleReaction(option.type)}
                      disabled={isPending}
                      title={option.label}
                      aria-label={option.label}
                      aria-pressed={selected}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:scale-125 hover:-translate-y-1 disabled:opacity-50 ${
                        selected ? "bg-[#EAF1EB] ring-2 ring-[#52745D]" : ""
                      }`}
                    >
                      <span className="text-[34px] leading-none">
                        {option.emoji}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-10 w-px bg-[#E9ECE8]" />

          <button
            type="button"
            onClick={handleComment}
            aria-label={
              showCounts
                ? `Comment on post. ${commentCount} comments`
                : "Open post discussion"
            }
            className="flex h-11 items-center gap-2 px-4 text-[#68716F] transition-colors duration-200 hover:bg-[#F0F5F0] hover:text-[#315B43]"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={1.8} />
            {showCounts && (
              <span className="text-sm font-normal tabular-nums">
                {commentCount}
              </span>
            )}
          </button>

          <div className="h-10 w-px bg-[#E9ECE8]" />

          <button
            type="button"
            onClick={handleShare}
            aria-label="Share post"
            className="flex h-11 items-center gap-2 px-4 text-[#68716F] transition-colors duration-200 hover:bg-[#F0F5F0] hover:text-[#315B43]"
          >
            <Share2 className="h-5 w-5" strokeWidth={1.8} />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>


        {/* RIGHT: PEOPLE WHO LIKED */}

        
        {/* RIGHT: PEOPLE WHO LIKED */}
        {showCounts && (
          <div
            ref={likersRef}
            className="relative ml-auto flex h-10 shrink-0 items-center justify-center px-3"
            onMouseEnter={() => {
              setLikersOpen(true);
              setPickerOpen(false);
            }}
            onMouseLeave={() => setLikersOpen(false)}
          >
            <button
              type="button"
              onClick={() => {
                setPickerOpen(false);
                setLikersOpen((open) => !open);
              }}
              onFocus={() => setLikersOpen(true)}
              aria-label={`Show ${counts.LIKE} ${
                counts.LIKE === 1 ? "person who likes" : "people who like"
              } this post`}
              aria-expanded={likersOpen}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF1EB] text-[#315B43] ring-1 ring-[#DCE8DC] transition-colors duration-200 hover:bg-[#DCEBDD]"
            >
              <ThumbsUp
                className="h-3 w-3"
                fill="currentColor"
                strokeWidth={1.8}
              />
            </button>

            {likersOpen && (
              <div className="absolute right-2 top-full z-[100] w-72 overflow-hidden rounded-lg border border-[#E5E9E5] bg-white shadow-xl">
                <div className="border-b border-[#EEF0EB] px-4 py-3">
                  <p className="text-sm font-semibold text-[#173B2F]">
                    People who liked this
                  </p>
                  <p className="mt-0.5 text-xs text-[#87938A]">
                    {activeReactionCount}{" "}
                    {activeReactionCount === 1 ? "person" : "people"}
                  </p>
                </div>

                <div className="max-h-64 overflow-y-auto p-2">
                  {likers.length > 0 ? (
                    likers.map((liker) => {
                      const initials = liker.displayName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase();

                      const likerContent = (
                        <>
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF1EB] text-xs font-bold text-[#315B43]">
                            {liker.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={liker.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initials || "L"
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate text-sm font-semibold text-[#344D40]">
                                {liker.displayName}
                              </p>

                              {liker.userId === currentUserId && (
                                <span className="shrink-0 rounded-lg bg-[#EAF1EB] px-2 py-0.5 text-[10px] font-semibold text-[#315B43]">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      );

                      return liker.username ? (
                        <Link
                          key={liker.userId}
                          href={`/profile/${encodeURIComponent(liker.username)}`}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-[#F7F9F6]"
                        >
                          {likerContent}
                        </Link>
                      ) : (
                        <div
                          key={liker.userId}
                          className="flex items-center gap-3 rounded-lg px-2 py-2"
                        >
                          {likerContent}
                        </div>
                      );
                    })
                  ) : (
                    <p className="px-3 py-5 text-center text-xs text-[#929D94]">
                      No likes yet. Be the first!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

     
      </div>
      

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {shareMessage && (
        <p role="status" className="mt-2 text-xs text-[#52745D]">
          {shareMessage}
        </p>
      )}
    </div>
    
  );
}
