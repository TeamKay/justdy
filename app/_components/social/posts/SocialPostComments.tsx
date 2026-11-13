
"use client";

import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import {
  AlertTriangle,
  MessageCircle,
  Send,
  Trash2,
  X,
} from "lucide-react";

import {
  createSocialComment,
  deleteSocialComment,
} from "@/app/actions/social-comment";

type CommentItem = {
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
};

type SocialPostCommentsProps = {
  postId: string;
  initialCommentCount: number;
  initialComments: CommentItem[];
  commentsEnabled: boolean;
  currentDisplayName: string;
  currentUsername: string;
  currentUserId: string;
  initialExpanded?: boolean;
  disableAutoScroll?: boolean;
};

export default function SocialPostComments({
  postId,
  initialCommentCount,
  initialComments,
  commentsEnabled,
  currentDisplayName,
  currentUsername,
  currentUserId,
  initialExpanded = false,
  disableAutoScroll = false,
}: SocialPostCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isPending, startTransition] = useTransition();
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  useEffect(() => {
    function handleToggleComments(event: Event) {
      const customEvent = event as CustomEvent<{ postId: string }>;

      if (customEvent.detail?.postId === postId) {
        setIsExpanded((expanded) => !expanded);
      }
    }

    window.addEventListener(
      "justdy:toggle-comments",
      handleToggleComments,
    );

    return () => {
      window.removeEventListener(
        "justdy:toggle-comments",
        handleToggleComments,
      );
    };
  }, [postId]);

  useEffect(() => {
    if (!isExpanded || disableAutoScroll) return;

    document
      .getElementById(`social-comments-${postId}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
  }, [isExpanded, postId, disableAutoScroll]);

  // Close the delete dialog with Escape.
  useEffect(() => {
    if (!commentToDelete) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        setCommentToDelete(null);
        setError("");
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [commentToDelete, isPending]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending || !content.trim()) return;

    const submittedContent = content.trim();
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticComment: CommentItem = {
      id: optimisticId,
      authorId: currentUserId,
      content: submittedContent,
      createdAt: new Date(),
      author: {
        socialProfile: {
          displayName: currentDisplayName,
          username: currentUsername,
        },
      },
    };

    setError("");

    // Show the comment and update the count immediately while the server saves it.
    setComments((current) => [optimisticComment, ...current]);
    setCommentCount((count) => count + 1);
    setContent("");
    window.dispatchEvent(
      new CustomEvent("justdy:comment-count-change", {
        detail: { postId, delta: 1 },
      }),
    );

    startTransition(async () => {
      const result = await createSocialComment({
        postId,
        content: submittedContent,
      });

      if (!result.success) {
        setComments((current) =>
          current.filter((comment) => comment.id !== optimisticId),
        );
        setCommentCount((count) => Math.max(0, count - 1));
        window.dispatchEvent(
          new CustomEvent("justdy:comment-count-change", {
            detail: { postId, delta: -1 },
          }),
        );
        setContent(submittedContent);
        setError(result.error);
        return;
      }

      // Replace the temporary item with the persisted comment without changing its position.
      setComments((current) =>
        current.map((comment) =>
          comment.id === optimisticId
            ? {
                ...result.comment,
                author: {
                  socialProfile: {
                    displayName: currentDisplayName,
                    username: currentUsername,
                  },
                },
              }
            : comment,
        ),
      );
    });
  }

  function handleDelete(commentId: string) {
    if (isPending) return;

    setError("");
    setCommentToDelete(commentId);
  }

  function confirmDelete() {
    if (!commentToDelete || isPending) return;

    const commentId = commentToDelete;
    setError("");

    startTransition(async () => {
      const result = await deleteSocialComment(commentId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setComments((current) =>
        current.filter((comment) => comment.id !== commentId),
      );

      setCommentCount((count) => Math.max(0, count - 1));

      window.dispatchEvent(
        new CustomEvent("justdy:comment-count-change", {
          detail: { postId, delta: -1 },
        }),
      );

      setCommentToDelete(null);
    });
  }

  function getInitials(name: string) {
    return (
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "L"
    );
  }

  function formatCommentDate(date: Date) {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (!isExpanded && !commentToDelete) {
    return null;
  }

  return (
    <>
      <section
        id={`social-comments-${postId}`}
        aria-label="Post comments"
        className="mt-4 border-t border-[#E9EEE8] pt-4"
      >
        {isExpanded && (
          <div className="space-y-5">
            {/* Comments heading */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0F5F0] text-[#315B43] ring-1 ring-[#E3EAE2]">
                  <MessageCircle className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-[15px] font-bold tracking-[-0.01em] text-[#173B2F]">
                    Comments
                  </h3>

                  <p className="text-xs text-[#89958B]">
                    {commentCount}{" "}
                    {commentCount === 1 ? "comment" : "comments"}
                  </p>
                </div>
              </div>
            </div>

            {/* Comment list */}
            {comments.length > 0 ? (
             <div className="space-y-5">
                {comments.map((comment) => {
                  const author = comment.author.socialProfile;
                  const displayName =
                    author?.displayName ?? "Justdy learner";

                  return (
                    <article
                      key={comment.id}
                      className="flex min-w-0 items-start gap-3"
                    >
                      {/* Avatar */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DFE9DF] bg-[#EAF1EB] text-xs font-bold text-[#315B43]">
                        {getInitials(displayName)}
                      </div>

                      {/* Comment content */}
                      <div className="min-w-0 flex-1 rounded-2xl border border-[#E3EAE2] bg-[#F9FBF8] px-4 py-3.5 sm:px-4 sm:py-4">
                        {/* Author information */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="truncate text-sm font-semibold tracking-[-0.01em] text-[#173B2F]">
                                {displayName}
                              </span>

                              {comment.authorId === currentUserId && (
                                <span className="rounded-md bg-[#EAF1EB] px-1.5 py-0.5 text-[9px] font-semibold text-[#52745D]">
                                  You
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                              {author?.username && (
                                <span className="text-[11px] text-[#929D94]">
                                  @{author.username}
                                </span>
                              )}

                              <span className="text-[10px] text-[#A5AEA7]">
                                {formatCommentDate(comment.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Delete action */}
                          {comment.authorId === currentUserId && (
                            <button
                              type="button"
                              onClick={() => handleDelete(comment.id)}
                              disabled={isPending}
                              aria-label="Delete comment"
                              title="Delete comment"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9AA49B] transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Comment text */}
                        <p className="mt-3 whitespace-pre-wrap break-words text-[13px] leading-6 text-[#52665A]">
                          {comment.content}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#DCE6DB] bg-[#F8FAF7] px-4 py-7 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF1EB] text-[#52745D]">
                  <MessageCircle className="h-5 w-5" />
                </div>

                <p className="mt-3 text-sm font-semibold text-[#52665A]">
                  Start the conversation
                </p>

                <p className="mt-1 text-xs text-[#929D94]">
                  Be the first to share your thoughts on this post.
                </p>
              </div>
            )}

            {/* Comment composer */}
            {commentsEnabled ? (
              <form
                onSubmit={handleSubmit}
                className="sticky bottom-0 rounded-2xl border border-[#E3EAE2] bg-white p-3 shadow-[0_2px_8px_rgba(23,59,47,0.08)] sm:p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF1EB] text-[10px] font-bold text-[#315B43]">
                    {getInitials(currentDisplayName)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#344D40]">
                      {currentDisplayName}
                    </p>
                    <p className="text-[10px] text-[#929D94]">
                      Add to the conversation
                    </p>
                  </div>
                </div>

                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write a thoughtful comment..."
                  rows={2}
                  maxLength={1000}
                  disabled={isPending}
                 className="min-h-[88px] max-h-40 w-full resize-y rounded-xl border border-[#E3EAE2] bg-[#F8FAF7] px-4 py-3.5 text-sm leading-6 text-[#344D40] outline-none transition duration-200 placeholder:text-[#A5AEA7] focus:border-[#8CA895] focus:bg-white focus:ring-2 focus:ring-[#EAF1EB] disabled:cursor-not-allowed disabled:opacity-60"/>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[10px] tabular-nums text-[#A0AAA1]">
                    {content.length}/1000
                  </span>

                  <button
                    type="submit"
                    disabled={isPending || !content.trim()}
                   className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#245B3F] px-4 py-2 text-xs font-semibold text-white shadow-sm transition duration-200 hover:bg-[#1D4D34] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8DB99A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#E7EBE8] disabled:text-[#A3ADA6] disabled:shadow-none disabled:active:scale-100"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isPending ? "Sending..." : "Post comment"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-xl border border-[#E9EEE8] bg-[#F8FAF7] px-4 py-3">
                <p className="text-xs text-[#89958B]">
                  Comments are disabled for this post.
                </p>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600"
              >
                {error}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Delete confirmation modal */}
      {commentToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#173B2F]/50 px-4 py-6 backdrop-blur-[3px]"
          onClick={() => {
            if (!isPending) {
              setCommentToDelete(null);
              setError("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-comment-title"
            aria-describedby="delete-comment-description"
            className="w-full max-w-sm rounded-3xl border border-[#E8EDE7] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isPending) {
                    setCommentToDelete(null);
                    setError("");
                  }
                }}
                disabled={isPending}
                aria-label="Close confirmation"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#929D94] transition hover:bg-[#F3F6F2] hover:text-[#344D40] disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3
              id="delete-comment-title"
              className="mt-5 text-lg font-bold text-[#173B2F]"
            >
              Delete this comment?
            </h3>

            <p
              id="delete-comment-description"
              className="mt-2 text-sm leading-6 text-[#718075]"
            >
              This comment will be permanently deleted. You can&apos;t undo
              this action.
            </p>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600"
              >
                {error}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCommentToDelete(null);
                  setError("");
                }}
                disabled={isPending}
                className="rounded-xl border border-[#E5E9E2] px-4 py-3 text-sm font-semibold text-[#526258] transition hover:bg-[#F7F8F5] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={isPending}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Deleting..." : "Delete comment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
