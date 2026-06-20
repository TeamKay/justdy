"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquare,
  Flame,
  Layers,
  ThumbsUp,
  PenIcon,
  Users,
  Radio,
  ShieldCheck,
  Send,
} from "lucide-react";
import Image from "next/image";
import PostMenu from "./PostMenu";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type CommunityContext = {
  id: string;
  name: string;
  slug: string;
  description: string;
  smallDescription?: string;
  category: string;
  fileKey: string;
  price: number;
  memberCount: number;
  onlineCount: number;
  adminCount: number;
  continueLearning: { title: string; progress: number; lesson: string }[];
  upcomingTimeline: { title: string; date: string; type: string }[];
  activities: { text: string; time: string }[];
  categories: { name: string; icon?: string }[];
  onboardingTasks: { title: string }[];
  pinnedPosts: {
    id: string;
    title: string;
    content: string | null;
    user?: {
      id: string;
      name: string;
      avatar?: string;
    };
    likes?: number;
    comments?: number;
    timeAgo?: string;
  }[];
  leaderboard: { rank: number; name: string; points: number }[];
};

type Props = {
  currentUserId: string;

  globalStats: { title: string; value: number; label: string }[];
  communities: CommunityContext[];
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
};

type Post = {
  id: string;
  title?: string;
  userId?: string;
  content: string | null;
  likes?: number;
  comments?: number;
  timeAgo?: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  hasLiked?: boolean;
  loadedComments?: Comment[];
};

export default function LearnerCommunities({
  communities,
  currentUserId,
}: Props) {
  const [activeCommunityId, setActiveCommunityId] = useState<string>(
    communities[0]?.id || "",
  );

  const [newPostText, setNewPostText] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [, setOpenPostMenuId] = useState<string | null>(null);

  // State for tracking actual database posts live

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const activeCommunity =
    communities.find((c) => c.id === activeCommunityId) || communities[0];

  const imageSrc = activeCommunity?.fileKey
    ? `https://utfs.io/f/${activeCommunity.fileKey}`
    : null;

  // Reusable fetching function to hit your database endpoint
  const fetchCommunityData = useCallback(
    async (communityId: string) => {
      if (!communityId) return;

      if (!hasLoadedOnce.current) {
        setIsLoading(true);
      }

      try {
        const res = await fetch(
          `/api/community/posts?communityId=${communityId}&userId=${currentUserId}`,
          {
            cache: "no-store",
          },
        );

        if (res.ok) {
          const newData = await res.json();

          setPosts((prevPosts) => {
            return newData.map((newPost: Post) => {
              const existingPost = prevPosts.find((p) => p.id === newPost.id);

              return {
                ...newPost,
                loadedComments:
                  existingPost?.loadedComments || newPost.loadedComments || [],
              };
            });
          });
        }
      } catch (error) {
        console.error("Failed to fetch community database records:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    const closeMenu = () => setOpenPostMenuId(null);
    document.addEventListener("scroll", closeMenu);
    return () => {
      document.removeEventListener("scroll", closeMenu);
    };
  }, []);

  // CRITICAL FIX: Runs instantly when page loads (mounts) AND when community switches
  useEffect(() => {
    let cancelled = false;

    const loadCommunity = async () => {
      await Promise.resolve();

      if (!cancelled) {
        fetchCommunityData(activeCommunityId);
      }
    };

    loadCommunity();

    const liveSyncInterval = setInterval(() => {
      fetchCommunityData(activeCommunityId);
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(liveSyncInterval);
    };
  }, [activeCommunityId, fetchCommunityData]);

  // =========================
  // 1. CREATE POST WITH TOASTS
  // =========================

  const handleCreatePost = async () => {
    if (!newPostText.trim() || !newPostTitle.trim()) return;

    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostText,
          communityId: activeCommunity.id,
        }),
      });

      const post = await res.json();

      // Instantly inject new record into client state ahead of the polling interval
      setPosts((prev) => [
        {
          id: post.id,
          title: post.title || "",
          content: post.content,
          likes: post.likes || 0,
          comments: post.comments || 0,
          timeAgo: "Just now",
          userId: post.user.id || currentUserId,
          user: {
            id: post.user.id || currentUserId,
            name: post.user.name,
            avatar: post.user.imageUrl || post.user.avatar,
          },
        },
        ...prev,
      ]);

      setNewPostText("");
      setNewPostTitle("");

      toast.success("Post published feed successfully!");
      resetComposer();
    } catch (error) {
      console.error(error);
      toast.error("Post failed to publish. Please try again.");
    }
  };

  // =========================
  // 2. EDIT POST WITH TOASTS
  // =========================

  const handleEditPost = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: editText }),
      });

      if (!res.ok) {
        // 👇 ADD THIS: Read the actual error message body from your response
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update post");
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, title: editTitle, content: editText }
            : post,
        ),
      );

      setEditingPostId(null);
      setEditTitle("");
      setEditText("");
      toast.success("Post updated successfully!");
    } catch (error) {
      console.error(error);
      // 👇 Display the explicit server error message directly inside your toast
      const message =
        error instanceof Error ? error.message : "Please try again.";
      toast.error(`Failed to update post: ${message}`);
    }
  };

  // =========================
  // 3. DELETE POST WITH TOASTS
  // =========================

  const handleDeletePost = async (postId: string) => {
    // 1. Locate the item locally to check structural properties
    const targetPost = posts.find((p) => p.id === postId);

    // 2. Fallback check to make absolutely sure current user owns the object
    if (targetPost?.user?.id !== currentUserId) {
      toast.error("Unauthorized operation assignment.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this community post?",
    );

    if (!confirmed) return;

    try {
      // 3. OPTIMISTIC UI FILTER UPDATE: Drop item from view immediately for high response speed
      setPosts((prev) => prev.filter((post) => post.id !== postId));

      // 4. Dispatch actual database mutation script call
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || "Failed to delete post from database",
        );
      }

      // 5. REFRESH FEED DATA SNAPSHOT LIVE: Pull current backend status securely
      toast.success("Post has been deleted.");
      await fetchCommunityData(activeCommunityId);
    } catch (error) {
      console.error("Deletion Pipeline Failure:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred processing your operation";

      toast.error(errorMessage);

      // Rollback client state
      fetchCommunityData(activeCommunityId);
    }
  };

  // =========================
  // 3. Counting likes
  // =========================

  const handleLike = async (postId: string) => {
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    // Fully type-safe fallback read
    const wasAlreadyLiked = targetPost.hasLiked || false;

    // 1. OPTIMISTIC UPDATE: Update counts immediately with strict types
    setPosts((prev) =>
      prev.map((p): Post => {
        if (p.id === postId) {
          const currentLikes = p.likes || 0;
          return {
            ...p,
            likes: wasAlreadyLiked
              ? Math.max(0, currentLikes - 1)
              : currentLikes + 1,
            hasLiked: !wasAlreadyLiked,
          };
        }
        return p;
      }),
    );

    try {
      // 2. DATABASE SYNC
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (!res.ok) throw new Error("Database rejected sync");

      const data = await res.json();

      // 3. SERVER SYNCHRONIZATION
      if (data.likes !== undefined) {
        setPosts((prev) =>
          prev.map(
            (p): Post =>
              p.id === postId
                ? { ...p, likes: data.likes, hasLiked: data.hasLiked }
                : p,
          ),
        );
      }
    } catch (error) {
      console.error("Engagement failure:", error);
      toast.error("Could not synchronize your like status.");

      // 4. TYPED ROLLBACK STATE
      setPosts((prev) =>
        prev.map((p): Post => {
          if (p.id === postId) {
            const currentLikes = p.likes || 0;
            return {
              ...p,
              likes: wasAlreadyLiked
                ? currentLikes + 1
                : Math.max(0, currentLikes - 1),
              hasLiked: wasAlreadyLiked,
            };
          }
          return p;
        }),
      );
    }
  };

  // =========================
  // 3. handle comment
  // =========================

  // 1. Expand tracking states
  const [expandedCommentPostId, setExpandedCommentPostId] = useState<
    string | null
  >(null);
  const [commentInputText, setCommentInputText] = useState("");
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const { data: session } = useSession();

  // 2. Fetch specific comments on-demand when clicked
  const handleCommentToggle = async (postId: string) => {
    if (expandedCommentPostId === postId) {
      setExpandedCommentPostId(null);
      return;
    }

    setExpandedCommentPostId(postId);
    setIsCommentsLoading(true);

    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, loadedComments: data } : p,
          ),
        );
      }
    } catch (err) {
      console.error("Failed loading comments thread:", err);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  // 3. Submit a new comment record
  const handleSubmitComment = async (postId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const currentUserId = session?.user?.id;
    if (!commentInputText.trim() || !currentUserId) {
      toast.error("You must be logged in to comment.");
      return;
    }

    const currentCommentText = commentInputText;
    setCommentInputText(""); // Clear instantly for smooth input UX

    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentCommentText,
          userId: currentUserId,
        }),
      });

      // --- FIXED TEMPORARY DEBUGGING BLOCK ---
      if (!res.ok) {
        let errorMessage = "Unknown Server Error";

        try {
          // Clone the response so we can safely read it without destroying the stream
          const resClone = res.clone();
          const errorData = await resClone.json();
          errorMessage =
            errorData.error || errorData.details || JSON.stringify(errorData);
        } catch {
          try {
            // If JSON parsing failed, fallback to text reading the original stream
            errorMessage = await res.text();
          } catch {
            errorMessage = "Could not parse server error body.";
          }
        }

        console.error(
          `❌ SERVER REJECTED WITH STATUS ${res.status}:`,
          errorMessage,
        );
        throw new Error(
          `Server rejected comment submission: Status ${res.status}`,
        );
      }
      // ------------------------------------------

      const newCommentRecord = await res.json();

      // Inject comment safely into local layout array data state
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              comments: (p.comments || 0) + 1,
              loadedComments: [...(p.loadedComments || []), newCommentRecord],
            };
          }
          return p;
        }),
      );
      toast.success("Comment added!");
    } catch (err) {
      console.error(err);
      toast.error("Could not upload your comment.");
    }
  };

  // Track which comment is being edited right now
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  // 1. UPDATE COMMENT ACTION
  const handleEditComment = async (postId: string, commentId: string) => {
    const currentUserId = session?.user?.id;
    if (!editCommentText.trim() || !currentUserId) return;

    try {
      const res = await fetch(`/api/community/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editCommentText,
          userId: currentUserId,
        }),
      });

      if (!res.ok) throw new Error("Failed to edit comment");

      // Instantly update local UI state array
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId && p.loadedComments) {
            return {
              ...p,
              loadedComments: p.loadedComments.map((c) =>
                c.id === commentId ? { ...c, content: editCommentText } : c,
              ),
            };
          }
          return p;
        }),
      );

      setEditingCommentId(null);
      setEditCommentText("");
      toast.success("Comment updated!");
    } catch (err) {
      console.error(err);
      toast.error("Could not save comment changes.");
    }
  };

  // 2. DELETE COMMENT ACTION
  const handleDeleteComment = async (postId: string, commentId: string) => {
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;

    const confirmed = window.confirm("Delete this comment permanently?");
    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/community/comments/${commentId}?userId=${currentUserId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) throw new Error("Failed to delete comment");

      // Drop the comment from state and subtract 1 from the counter badge
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              comments: Math.max(0, (p.comments || 1) - 1),
              loadedComments:
                p.loadedComments?.filter((c) => c.id !== commentId) || [],
            };
          }
          return p;
        }),
      );

      toast.success("Comment removed.");
    } catch (err) {
      console.error(err);
      toast.error("Could not remove your comment.");
    }
  };

  const [newPostTitle, setNewPostTitle] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewPostText(e.target.value);

    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

  const resetComposer = () => {
    setNewPostTitle("");
    setNewPostText("");

    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto"; // restore original size
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex font-sans antialiased">
      <main className="flex-1 overflow-y-auto p-4 md:p-0 space-y-6 max-w-6xl mx-auto w-full">
        {activeCommunity && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
            {/* ========================================== */}
            {/* LEFT COLUMN: INTERACTIVE DISCUSSIONS & FEED */}
            {/* ========================================== */}
            <div className="lg:col-span-8 flex flex-col gap-5 w-full min-w-0">
              {/* Creator Rich Post Input */}
              <div className="bg-emerald-900/10 border border-slate-800/60 rounded-md p-4 space-y-3">
                <div className="flex gap-3 items-start">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-md shrink-0 bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                    <PenIcon className="w-5 h-5" />
                  </div>

                  {/* Inputs */}
                  <div className="flex-1 space-y-2">
                    {/* Title */}
                    <input
                      ref={titleRef}
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="Post title..."
                      className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none border-0 font-semibold"
                    />

                    {/* Content */}
                    <textarea
                      ref={textareaRef}
                      value={newPostText}
                      onChange={handleTextChange}
                      placeholder={`Share your thoughts with ${activeCommunity.name}...`}
                      rows={1}
                      className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none resize-none overflow-hidden"
                    />
                  </div>

                  {/* Send button */}
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostTitle.trim() || !newPostText.trim()}
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center justify-center text-white transition shrink-0 mt-1"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Onboarding Tasks */}
              {activeCommunity.onboardingTasks &&
                activeCommunity.onboardingTasks.length > 0 && (
                  <div className="bg-emerald-900/10 border border-slate-800/60 rounded-md p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <h3 className="text-sm font-bold text-white tracking-wider ">
                        {activeCommunity.description
                          ? `${activeCommunity.name} Roadmap`
                          : "Onboarding Checklist"}
                      </h3>
                    </div>
                    <div className="space-y-3 pt-1">
                      {activeCommunity.onboardingTasks.map((task, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 group cursor-pointer"
                        >
                          <div className="w-4 h-4 rounded-md border border-slate-700 group-hover:border-indigo-500 shrink-0 flex items-center justify-center transition-colors">
                            <div className="w-2 h-2 rounded-md bg-transparent group-hover:bg-indigo-500 transition-colors" />
                          </div>
                          <p className="text-slate-300 text-xs group-hover:text-white transition-colors">
                            {task.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Discussion Filters */}
              <div className="flex justify-between items-center gap-4 pt-1">
                <div className="flex gap-2 flex-wrap items-center">
                  <button className="px-3.5 py-1.5 bg-slate-800 text-white rounded-md text-xs font-semibold border border-slate-700">
                    {activeCommunity.slug.toUpperCase()} Feed
                  </button>
                  {activeCommunity.categories &&
                    activeCommunity.categories.map((cat) => (
                      <button
                        key={cat.name}
                        className="px-3.5 py-1.5 bg-slate-900/40 text-slate-300 border border-slate-800/60 hover:border-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all"
                      >
                        <span>{cat.name}</span>
                        {cat.icon && (
                          <span className="text-xs">{cat.icon}</span>
                        )}
                      </button>
                    ))}
                </div>
              </div>

              {/* Posts Feed */}
              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-slate-400 text-xs text-center py-8">
                    Syncing updates live from feed database...
                  </p>
                ) : posts && posts.length > 0 ? (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-emerald-900/10 border border-slate-800/60 rounded-md p-6 space-y-4 hover:border-slate-800 transition duration-200 relative overflow-visible"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                            {post.user?.avatar ? (
                              <Image
                                src={post.user.avatar}
                                alt="avatar"
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-sm text-indigo-400">
                                {post.user?.name?.charAt(0) || "U"}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
                              <span>
                                {post.user?.name || "Anonymous Member"}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {post.timeAgo || "Recent"} •{" "}
                              {activeCommunity.name} Context
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <PostMenu
                            postId={post.id}
                            isOwner={
                              post.userId === currentUserId ||
                              post.user?.id === currentUserId
                            }
                            onEdit={(id) => {
                              setEditingPostId(id);
                              setEditText(post.content || "");
                              setEditTitle(post.title || ""); // 👈 INITIALIZE THE TITLE VALUE HERE
                            }}
                            onDelete={(id) => handleDeletePost(id)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {editingPostId === post.id ? (
                          /* ========================================== */
                          /* EDIT STATE WINDOW: Matched to your Layout   */
                          /* ========================================== */
                          <div className="space-y-3">
                            {/* Title Edit Field */}
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Post Title (Optional)"
                              className="w-full bg-slate-900 border border-slate-700/60 rounded-md p-2 text-sm font-bold text-white focus:outline-hidden focus:border-slate-500"
                            />

                            {/* Content Edit Field */}
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700/60 rounded-md p-2 text-sm text-white focus:outline-hidden focus:border-slate-500"
                              rows={4}
                            />

                            {/* Control Actions Tray */}
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleEditPost(post.id)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md text-xs font-semibold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPostId(null);
                                  setEditText("");
                                  setEditTitle("");
                                }}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ========================================== */
                          /* VIEW STATE WINDOW: Pure Static Text Display */
                          /* ========================================== */
                          <>
                            {post.title && (
                              <h4 className="text-base font-bold text-white tracking-tight leading-snug">
                                {post.title}
                              </h4>
                            )}
                            {post.content && (
                              <p className="text-slate-300 text-xs leading-relaxed">
                                {post.content}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Feed Action Controls */}
                      <div className="pt-3 border-t border-slate-800/40 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-1.5 transition px-2 py-1 rounded bg-slate-900/40 border ${
                              post.hasLiked
                                ? "text-indigo-400 border-indigo-500/50 bg-indigo-500/10"
                                : "border-slate-800/40 hover:text-indigo-400"
                            }`}
                          >
                            <ThumbsUp
                              className={`w-3.5 h-3.5 ${post.hasLiked ? "fill-indigo-400/20" : ""}`}
                            />
                            <span>({post.likes ?? 0})</span>
                          </button>

                          {/* 👇 BIND TOGGLE HERE */}
                          <button
                            onClick={() => handleCommentToggle(post.id)}
                            className={`flex items-center gap-1.5 transition px-2 py-1 rounded bg-slate-900/40 border hover:text-indigo-400 ${
                              expandedCommentPostId === post.id
                                ? "text-indigo-400 border-indigo-500/30 bg-indigo-500/5"
                                : "border-slate-800/40"
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>({post.comments || 0})</span>
                          </button>
                        </div>
                      </div>

                      {/* ========================================== */}
                      {/* PRODUCTION EXPANDABLE COMMENT PANEL MODULE */}
                      {/* ========================================== */}
                      {expandedCommentPostId === post.id && (
                        <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-4 animate-fadeIn">
                          {/* Inner Feed Thread Content */}
                          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {isCommentsLoading ? (
                              <p className="text-[11px] text-slate-500 text-center animate-pulse">
                                Pulling discussion stream...
                              </p>
                            ) : post.loadedComments &&
                              post.loadedComments.length > 0 ? (
                              post.loadedComments.map((comment) => {
                                const isCommentOwner =
                                  comment.user?.id === session?.user?.id;

                                return (
                                  <div
                                    key={comment.id}
                                    className="flex items-start gap-2.5 bg-slate-900/30 border border-slate-800/30 rounded-md p-2.5 group"
                                  >
                                    {/* Avatar column */}
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 text-[10px] font-bold flex items-center justify-center text-indigo-400">
                                      {comment.user?.avatar ? (
                                        <Image
                                          src={comment.user.avatar}
                                          alt="avatar"
                                          width={24}
                                          height={24}
                                          className="object-cover w-full h-full"
                                        />
                                      ) : (
                                        comment.user?.name?.charAt(0) || "U"
                                      )}
                                    </div>

                                    {/* Main Comment Text block */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-baseline justify-between gap-2">
                                        <span className="text-[11px] font-bold text-slate-300 truncate">
                                          {comment.user?.name}
                                        </span>
                                        <span className="text-[9px] text-slate-600 shrink-0">
                                          {comment.createdAt}
                                        </span>
                                      </div>

                                      {editingCommentId === comment.id ? (
                                        /* COMMENT EDIT WINDOW MODE */
                                        <div className="mt-1 space-y-2">
                                          <input
                                            type="text"
                                            value={editCommentText}
                                            onChange={(e) =>
                                              setEditCommentText(e.target.value)
                                            }
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs text-white focus:outline-none"
                                          />
                                          <div className="flex gap-1.5 justify-end">
                                            <button
                                              onClick={() =>
                                                handleEditComment(
                                                  post.id,
                                                  comment.id,
                                                )
                                              }
                                              className="px-2 py-0.5 bg-green-600 text-white text-[10px] rounded font-medium cursor-pointer"
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() =>
                                                setEditingCommentId(null)
                                              }
                                              className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded font-medium cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        /* DEFAULT DISPLAY MODE */
                                        <>
                                          <p className="text-xs text-slate-400 mt-0.5 whitespace-pre-wrap">
                                            {comment.content}
                                          </p>

                                          {/* Inline Action Triggers (Visible to owner on hover) */}
                                          {isCommentOwner && (
                                            <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button
                                                onClick={() => {
                                                  setEditingCommentId(
                                                    comment.id,
                                                  );
                                                  setEditCommentText(
                                                    comment.content,
                                                  );
                                                }}
                                                className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                                              >
                                                Edit
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleDeleteComment(
                                                    post.id,
                                                    comment.id,
                                                  )
                                                }
                                                className="text-[10px] text-red-400 hover:underline cursor-pointer"
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-[11px] text-slate-500 text-center py-2">
                                No comments here yet. Be the first to start the
                                conversation!
                              </p>
                            )}
                          </div>

                          {/* Comment Input Creation Block */}
                          <div className="flex gap-2 items-center bg-slate-900/60 border border-slate-800 rounded-md p-1.5 focus-within:border-slate-700 transition">
                            <input
                              type="text"
                              value={commentInputText}
                              onChange={(e) =>
                                setCommentInputText(e.target.value)
                              }
                              placeholder="Write a supportive comment reply..."
                              className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none px-2"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSubmitComment(post.id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleSubmitComment(post.id)}
                              disabled={!commentInputText.trim()}
                              className="p-1.5 rounded-md bg-indigo-600 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 hover:bg-indigo-500 transition shrink-0"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-xs text-center py-8 bg-slate-900/10 border border-dashed border-slate-800/60 rounded-2xl">
                    No active feeds returned for this environment database.
                  </p>
                )}
              </div>
            </div>

            {/* ======================================================= */}
            {/* RIGHT COLUMN: METRICS, EVENTS, LEADERBOARD */}
            {/* ======================================================= */}

            <div className="lg:col-span-4 flex flex-col w-full bg-emerald-900/10 overflow-hidden sticky top-4 self-start">
              <div className="flex items-center justify-between gap-2 mb-2 relative">
                <Select
                  value={activeCommunityId}
                  onValueChange={setActiveCommunityId}
                >
                  <SelectTrigger className="w-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800">
                    <SelectValue placeholder="Select a community" />
                  </SelectTrigger>

                  <SelectContent className="bg-slate-950 border border-slate-800 text-slate-200">
                    {communities.map((comm) => (
                      <SelectItem
                        key={comm.id}
                        value={comm.id}
                        className="text-xs"
                      >
                        {comm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-slate-900/40 border-b border-slate-800/60 overflow-hidden relative h-44 w-full shrink-0 shadow-lg">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={activeCommunity.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    priority
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-linear-to-br from-slate-900 to-slate-950 text-slate-400 relative">
                    <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-size-[14px_24px]" />
                    <Layers className="w-8 h-8 mb-2 text-slate-600 relative z-10" />
                    <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase text-center max-w-xs truncate relative z-10">
                      {activeCommunity.name}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              </div>

              <div className="p-4 pb-1 space-y-1">
                {activeCommunity.smallDescription && (
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed line-clamp-5">
                    {activeCommunity.smallDescription}
                  </p>
                )}
              </div>

              <div className="p-3 pt-2 flex flex-col gap-6 w-full">
                <div className="grid grid-cols-3 gap-2 p-0 rounded-md text-center">
                  <div className="flex flex-col items-center justify-center p-1 rounded bg-emerald-900/10 ">
                    <Users className="w-3.5 h-3.5 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-200">
                      {activeCommunity.memberCount ?? 0}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                      Members
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-1 rounded bg-emerald-900/10">
                    <div className="relative mb-1">
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="absolute top-0 right-0 block h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-emerald-400">
                      {activeCommunity.onlineCount ?? 0}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                      Online
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-1 rounded bg-emerald-900/10">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 mb-1" />
                    <span className="text-xs font-bold text-indigo-400">
                      {activeCommunity.adminCount ?? 0}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                      Admins
                    </span>
                  </div>
                </div>

                {/* Leaderboard Framework */}
                <div className="bg-emerald-900/10 border border-slate-800/60 rounded-md p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 mb-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Leaderboard standings</span>
                  </div>
                  <div className="space-y-2">
                    {activeCommunity.leaderboard &&
                    activeCommunity.leaderboard.length > 0 ? (
                      activeCommunity.leaderboard.map((member) => (
                        <div
                          key={member.rank}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/40"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${member.rank === 1 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-slate-800 text-slate-400"}`}
                            >
                              {member.rank}
                            </div>
                            <span className="font-medium text-xs text-slate-300">
                              {member.name}
                            </span>
                          </div>
                          <div className="text-[10px] font-bold text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                            {member.points}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-xs text-center py-4">
                        Ranks recalculating...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// "use client";

// import React, { useState, useEffect, useCallback, useRef } from "react";
// import {
//   Calendar,
//   MessageSquare,
//   Flame,
//   Layers,
//   ThumbsUp,
//   ChevronDown,
//   PenIcon,
//   Users,
//   Radio,
//   ShieldCheck,
//   Send,
// } from "lucide-react";
// import Image from "next/image";
// import PostMenu from "./PostMenu";
// import { toast } from "sonner";
// import { useSession } from "@/lib/auth-client";

// type CommunityContext = {
//   id: string;
//   name: string;
//   slug: string;
//   description: string;
//   smallDescription?: string;
//   category: string;
//   fileKey: string;
//   price: number;
//   memberCount: number;
//   onlineCount: number;
//   adminCount: number;
//   continueLearning: { title: string; progress: number; lesson: string }[];
//   upcomingTimeline: { title: string; date: string; type: string }[];
//   activities: { text: string; time: string }[];
//   categories: { name: string; icon?: string }[];
//   onboardingTasks: { title: string }[];
//   pinnedPosts: {
//     id: string;
//     title: string;
//     content: string | null;
//     user?: {
//       id: string;
//       name: string;
//       avatar?: string;
//     };
//     likes?: number;
//     comments?: number;
//     timeAgo?: string;
//   }[];
//   leaderboard: { rank: number; name: string; points: number }[];
// };

// type Props = {
//   currentUserId: string;

//   globalStats: { title: string; value: number; label: string }[];
//   communities: CommunityContext[];
// };

// type Comment = {
//   id: string;
//   content: string;
//   createdAt: string;
//   user: {
//     id: string;
//     name: string;
//     avatar?: string;
//   };
// };

// type Post = {
//   id: string;
//   title?: string;
//   userId?: string;
//   content: string | null;
//   likes?: number;
//   comments?: number;
//   timeAgo?: string;
//   user?: {
//     id: string;
//     name: string;
//     avatar?: string;
//   };
//   hasLiked?: boolean;
//   loadedComments?: Comment[];
// };

// export default function LearnerDashboard({
//   communities,
//   currentUserId,
// }: Props) {
//   const [activeCommunityId, setActiveCommunityId] = useState<string>(
//     communities[0]?.id || "",
//   );
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [newPostText, setNewPostText] = useState("");
//   const [editingPostId, setEditingPostId] = useState<string | null>(null);
//   const [editText, setEditText] = useState("");
//   const [editTitle, setEditTitle] = useState("");
//   const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);

//   // State for tracking actual database posts live

//   const [posts, setPosts] = useState<Post[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   const activeCommunity =
//     communities.find((c) => c.id === activeCommunityId) || communities[0];

//   const imageSrc = activeCommunity?.fileKey
//     ? `https://utfs.io/f/${activeCommunity.fileKey}`
//     : null;

//   // Reusable fetching function to hit your database endpoint
//   const fetchCommunityData = useCallback(
//     async (communityId: string) => {
//       if (!communityId) return;
//       try {
//         const res = await fetch(
//           `/api/community/posts?communityId=${communityId}&userId=${currentUserId}`,
//           {
//             cache: "no-store",
//           },
//         );
//         if (res.ok) {
//           const newData = await res.json();

//           // ✨ FIX: Preserve currently loaded comments when background polling syncs
//           setPosts((prevPosts) => {
//             return newData.map((newPost: Post) => {
//               // Find if this post was already inside our state with active loaded comments
//               const existingPost = prevPosts.find((p) => p.id === newPost.id);
//               return {
//                 ...newPost,
//                 // Keep the loaded comments if they exist locally!
//                 loadedComments:
//                   existingPost?.loadedComments || newPost.loadedComments || [],
//               };
//             });
//           });
//         }
//       } catch (error) {
//         console.error("Failed to fetch community database records:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     },
//     [currentUserId],
//   );

//   useEffect(() => {
//     const closeMenu = () => setOpenPostMenuId(null);
//     document.addEventListener("scroll", closeMenu);
//     return () => {
//       document.removeEventListener("scroll", closeMenu);
//     };
//   }, []);

//   // CRITICAL FIX: Runs instantly when page loads (mounts) AND when community switches
//   useEffect(() => {
//     setIsLoading(true);
//     fetchCommunityData(activeCommunityId);

//     // Continuous Sync: Polls database every 4 seconds so background changes sync automatically
//     const liveSyncInterval = setInterval(() => {
//       fetchCommunityData(activeCommunityId);
//     }, 4000);

//     return () => clearInterval(liveSyncInterval);
//   }, [activeCommunityId, fetchCommunityData]);

//   // =========================
//   // 1. CREATE POST WITH TOASTS
//   // =========================

//   const handleCreatePost = async () => {
//     if (!newPostText.trim() || !newPostTitle.trim()) return;

//     try {
//       const res = await fetch("/api/community/posts", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           title: newPostTitle,
//           content: newPostText,
//           communityId: activeCommunity.id,
//         }),
//       });

//       const post = await res.json();

//       // Instantly inject new record into client state ahead of the polling interval
//       setPosts((prev) => [
//         {
//           id: post.id,
//           title: post.title || "",
//           content: post.content,
//           likes: post.likes || 0,
//           comments: post.comments || 0,
//           timeAgo: "Just now",
//           userId: post.user.id || currentUserId,
//           user: {
//             id: post.user.id || currentUserId,
//             name: post.user.name,
//             avatar: post.user.imageUrl || post.user.avatar,
//           },
//         },
//         ...prev,
//       ]);

//       setNewPostText("");
//       setNewPostTitle("");

//       toast.success("Post published feed successfully!");
//       resetComposer();
//     } catch (error) {
//       console.error(error);
//       toast.error("Post failed to publish. Please try again.");
//     }
//   };

//   // =========================
//   // 2. EDIT POST WITH TOASTS
//   // =========================

//   const handleEditPost = async (postId: string) => {
//     try {
//       const res = await fetch(`/api/community/posts/${postId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ title: editTitle, content: editText }),
//       });

//       if (!res.ok) {
//         // 👇 ADD THIS: Read the actual error message body from your response
//         const errorData = await res.json().catch(() => ({}));
//         throw new Error(errorData.error || "Failed to update post");
//       }

//       setPosts((prev) =>
//         prev.map((post) =>
//           post.id === postId
//             ? { ...post, title: editTitle, content: editText }
//             : post,
//         ),
//       );

//       setEditingPostId(null);
//       setEditTitle("");
//       setEditText("");
//       toast.success("Post updated successfully!");
//     } catch (error) {
//       console.error(error);
//       // 👇 Display the explicit server error message directly inside your toast
//       const message =
//         error instanceof Error ? error.message : "Please try again.";
//       toast.error(`Failed to update post: ${message}`);
//     }
//   };

//   // =========================
//   // 3. DELETE POST WITH TOASTS
//   // =========================

//   const handleDeletePost = async (postId: string) => {
//     // 1. Locate the item locally to check structural properties
//     const targetPost = posts.find((p) => p.id === postId);

//     // 2. Fallback check to make absolutely sure current user owns the object
//     if (targetPost?.user?.id !== currentUserId) {
//       toast.error("Unauthorized operation assignment.");
//       return;
//     }

//     const confirmed = window.confirm(
//       "Are you sure you want to permanently delete this community post?",
//     );

//     if (!confirmed) return;

//     try {
//       // 3. OPTIMISTIC UI FILTER UPDATE: Drop item from view immediately for high response speed
//       setPosts((prev) => prev.filter((post) => post.id !== postId));

//       // 4. Dispatch actual database mutation script call
//       const res = await fetch(`/api/community/posts/${postId}`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(
//           errorData.error || "Failed to delete post from database",
//         );
//       }

//       // 5. REFRESH FEED DATA SNAPSHOT LIVE: Pull current backend status securely
//       toast.success("Post has been deleted.");
//       await fetchCommunityData(activeCommunityId);
//     } catch (error) {
//       console.error("Deletion Pipeline Failure:", error);
//       const errorMessage =
//         error instanceof Error
//           ? error.message
//           : "An unexpected error occurred processing your operation";

//       toast.error(errorMessage);

//       // Rollback client state
//       fetchCommunityData(activeCommunityId);
//     }
//   };

//   // =========================
//   // 3. Counting likes
//   // =========================

//   const handleLike = async (postId: string) => {
//     const targetPost = posts.find((p) => p.id === postId);
//     if (!targetPost) return;

//     // Fully type-safe fallback read
//     const wasAlreadyLiked = targetPost.hasLiked || false;

//     // 1. OPTIMISTIC UPDATE: Update counts immediately with strict types
//     setPosts((prev) =>
//       prev.map((p): Post => {
//         if (p.id === postId) {
//           const currentLikes = p.likes || 0;
//           return {
//             ...p,
//             likes: wasAlreadyLiked
//               ? Math.max(0, currentLikes - 1)
//               : currentLikes + 1,
//             hasLiked: !wasAlreadyLiked,
//           };
//         }
//         return p;
//       }),
//     );

//     try {
//       // 2. DATABASE SYNC
//       const res = await fetch(`/api/community/posts/${postId}/like`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ userId: currentUserId }),
//       });

//       if (!res.ok) throw new Error("Database rejected sync");

//       const data = await res.json();

//       // 3. SERVER SYNCHRONIZATION
//       if (data.likes !== undefined) {
//         setPosts((prev) =>
//           prev.map(
//             (p): Post =>
//               p.id === postId
//                 ? { ...p, likes: data.likes, hasLiked: data.hasLiked }
//                 : p,
//           ),
//         );
//       }
//     } catch (error) {
//       console.error("Engagement failure:", error);
//       toast.error("Could not synchronize your like status.");

//       // 4. TYPED ROLLBACK STATE
//       setPosts((prev) =>
//         prev.map((p): Post => {
//           if (p.id === postId) {
//             const currentLikes = p.likes || 0;
//             return {
//               ...p,
//               likes: wasAlreadyLiked
//                 ? currentLikes + 1
//                 : Math.max(0, currentLikes - 1),
//               hasLiked: wasAlreadyLiked,
//             };
//           }
//           return p;
//         }),
//       );
//     }
//   };

//   // =========================
//   // 3. handle comment
//   // =========================

//   // 1. Expand tracking states
//   const [expandedCommentPostId, setExpandedCommentPostId] = useState<
//     string | null
//   >(null);
//   const [commentInputText, setCommentInputText] = useState("");
//   const [isCommentsLoading, setIsCommentsLoading] = useState(false);
//   const { data: session } = useSession();

//   // 2. Fetch specific comments on-demand when clicked
//   const handleCommentToggle = async (postId: string) => {
//     if (expandedCommentPostId === postId) {
//       setExpandedCommentPostId(null);
//       return;
//     }

//     setExpandedCommentPostId(postId);
//     setIsCommentsLoading(true);

//     try {
//       const res = await fetch(`/api/community/posts/${postId}/comments`);
//       if (res.ok) {
//         const data = await res.json();
//         setPosts((prev) =>
//           prev.map((p) =>
//             p.id === postId ? { ...p, loadedComments: data } : p,
//           ),
//         );
//       }
//     } catch (err) {
//       console.error("Failed loading comments thread:", err);
//     } finally {
//       setIsCommentsLoading(false);
//     }
//   };

//   // 3. Submit a new comment record
//   const handleSubmitComment = async (postId: string, e?: React.FormEvent) => {
//     if (e) e.preventDefault();

//     const currentUserId = session?.user?.id;
//     if (!commentInputText.trim() || !currentUserId) {
//       toast.error("You must be logged in to comment.");
//       return;
//     }

//     const currentCommentText = commentInputText;
//     setCommentInputText(""); // Clear instantly for smooth input UX

//     try {
//       const res = await fetch(`/api/community/posts/${postId}/comments`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           content: currentCommentText,
//           userId: currentUserId,
//         }),
//       });

//       // --- FIXED TEMPORARY DEBUGGING BLOCK ---
//       if (!res.ok) {
//         let errorMessage = "Unknown Server Error";

//         try {
//           // Clone the response so we can safely read it without destroying the stream
//           const resClone = res.clone();
//           const errorData = await resClone.json();
//           errorMessage =
//             errorData.error || errorData.details || JSON.stringify(errorData);
//         } catch (_) {
//           try {
//             // If JSON parsing failed, fallback to text reading the original stream
//             errorMessage = await res.text();
//           } catch (e) {
//             errorMessage = "Could not parse server error body.";
//           }
//         }

//         console.error(
//           `❌ SERVER REJECTED WITH STATUS ${res.status}:`,
//           errorMessage,
//         );
//         throw new Error(
//           `Server rejected comment submission: Status ${res.status}`,
//         );
//       }
//       // ------------------------------------------

//       const newCommentRecord = await res.json();

//       // Inject comment safely into local layout array data state
//       setPosts((prev) =>
//         prev.map((p) => {
//           if (p.id === postId) {
//             return {
//               ...p,
//               comments: (p.comments || 0) + 1,
//               loadedComments: [...(p.loadedComments || []), newCommentRecord],
//             };
//           }
//           return p;
//         }),
//       );
//       toast.success("Comment added!");
//     } catch (err) {
//       console.error(err);
//       toast.error("Could not upload your comment.");
//     }
//   };

//   // Track which comment is being edited right now
//   const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
//   const [editCommentText, setEditCommentText] = useState("");

//   // 1. UPDATE COMMENT ACTION
//   const handleEditComment = async (postId: string, commentId: string) => {
//     const currentUserId = session?.user?.id;
//     if (!editCommentText.trim() || !currentUserId) return;

//     try {
//       const res = await fetch(`/api/community/comments/${commentId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           content: editCommentText,
//           userId: currentUserId,
//         }),
//       });

//       if (!res.ok) throw new Error("Failed to edit comment");

//       // Instantly update local UI state array
//       setPosts((prev) =>
//         prev.map((p) => {
//           if (p.id === postId && p.loadedComments) {
//             return {
//               ...p,
//               loadedComments: p.loadedComments.map((c) =>
//                 c.id === commentId ? { ...c, content: editCommentText } : c,
//               ),
//             };
//           }
//           return p;
//         }),
//       );

//       setEditingCommentId(null);
//       setEditCommentText("");
//       toast.success("Comment updated!");
//     } catch (err) {
//       console.error(err);
//       toast.error("Could not save comment changes.");
//     }
//   };

//   // 2. DELETE COMMENT ACTION
//   const handleDeleteComment = async (postId: string, commentId: string) => {
//     const currentUserId = session?.user?.id;
//     if (!currentUserId) return;

//     const confirmed = window.confirm("Delete this comment permanently?");
//     if (!confirmed) return;

//     try {
//       const res = await fetch(
//         `/api/community/comments/${commentId}?userId=${currentUserId}`,
//         {
//           method: "DELETE",
//         },
//       );

//       if (!res.ok) throw new Error("Failed to delete comment");

//       // Drop the comment from state and subtract 1 from the counter badge
//       setPosts((prev) =>
//         prev.map((p) => {
//           if (p.id === postId) {
//             return {
//               ...p,
//               comments: Math.max(0, (p.comments || 1) - 1),
//               loadedComments:
//                 p.loadedComments?.filter((c) => c.id !== commentId) || [],
//             };
//           }
//           return p;
//         }),
//       );

//       toast.success("Comment removed.");
//     } catch (err) {
//       console.error(err);
//       toast.error("Could not remove your comment.");
//     }
//   };

//   const [newPostTitle, setNewPostTitle] = useState("");
//   const textareaRef = useRef<HTMLTextAreaElement | null>(null);
//   const titleRef = useRef<HTMLInputElement | null>(null);

//   const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     setNewPostText(e.target.value);

//     const el = textareaRef.current;
//     if (el) {
//       el.style.height = "auto";
//       el.style.height = el.scrollHeight + "px";
//     }
//   };

//   const resetComposer = () => {
//     setNewPostTitle("");
//     setNewPostText("");

//     const el = textareaRef.current;
//     if (el) {
//       el.style.height = "auto"; // restore original size
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background text-slate-100 flex font-sans antialiased">
//       <main className="flex-1 overflow-y-auto p-4 md:p-0 space-y-6 max-w-6xl mx-auto w-full">
//         {activeCommunity && (
//           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
//             {/* ========================================== */}
//             {/* LEFT COLUMN: INTERACTIVE DISCUSSIONS & FEED */}
//             {/* ========================================== */}
//             <div className="lg:col-span-8 flex flex-col gap-5 w-full min-w-0">
//               {/* Creator Rich Post Input */}
//               <div className="bg-emerald-900/10 border border-slate-800/60 rounded-md p-4 space-y-3">
//                 <div className="flex gap-3 items-start">
//                   {/* Icon */}
//                   <div className="w-10 h-10 rounded-md shrink-0 bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
//                     <PenIcon className="w-5 h-5" />
//                   </div>

//                   {/* Inputs */}
//                   <div className="flex-1 space-y-2">
//                     {/* Title */}
//                     <input
//                       ref={titleRef}
//                       value={newPostTitle}
//                       onChange={(e) => setNewPostTitle(e.target.value)}
//                       placeholder="Post title..."
//                       className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none border-0 font-semibold"
//                     />

//                     {/* Content */}
//                     <textarea
//                       ref={textareaRef}
//                       value={newPostText}
//                       onChange={handleTextChange}
//                       placeholder={`Share your thoughts with ${activeCommunity.name}...`}
//                       rows={1}
//                       className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none resize-none overflow-hidden"
//                     />
//                   </div>

//                   {/* Send button */}
//                   <button
//                     onClick={handleCreatePost}
//                     disabled={!newPostTitle.trim() || !newPostText.trim()}
//                     className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center justify-center text-white transition shrink-0 mt-1"
//                   >
//                     <Send className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>

//               {/* Onboarding Tasks */}
//               {activeCommunity.onboardingTasks &&
//                 activeCommunity.onboardingTasks.length > 0 && (
//                   <div className="bg-emerald-900/10 border border-slate-800/60 rounded-md p-5 space-y-4">
//                     <div className="flex justify-between items-center border-b border-slate-800 pb-2">
//                       <h3 className="text-sm font-bold text-white tracking-wider ">
//                         {activeCommunity.description
//                           ? `${activeCommunity.name} Roadmap`
//                           : "Onboarding Checklist"}
//                       </h3>
//                     </div>
//                     <div className="space-y-3 pt-1">
//                       {activeCommunity.onboardingTasks.map((task, index) => (
//                         <div
//                           key={index}
//                           className="flex items-center gap-3 group cursor-pointer"
//                         >
//                           <div className="w-4 h-4 rounded-md border border-slate-700 group-hover:border-indigo-500 shrink-0 flex items-center justify-center transition-colors">
//                             <div className="w-2 h-2 rounded-md bg-transparent group-hover:bg-indigo-500 transition-colors" />
//                           </div>
//                           <p className="text-slate-300 text-xs group-hover:text-white transition-colors">
//                             {task.title}
//                           </p>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//               {/* Discussion Filters */}
//               <div className="flex justify-between items-center gap-4 pt-1">
//                 <div className="flex gap-2 flex-wrap items-center">
//                   <button className="px-3.5 py-1.5 bg-slate-800 text-white rounded-md text-xs font-semibold border border-slate-700">
//                     {activeCommunity.slug.toUpperCase()} Feed
//                   </button>
//                   {activeCommunity.categories &&
//                     activeCommunity.categories.map((cat) => (
//                       <button
//                         key={cat.name}
//                         className="px-3.5 py-1.5 bg-slate-900/40 text-slate-300 border border-slate-800/60 hover:border-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all"
//                       >
//                         <span>{cat.name}</span>
//                         {cat.icon && (
//                           <span className="text-xs">{cat.icon}</span>
//                         )}
//                       </button>
//                     ))}
//                 </div>
//               </div>

//               {/* Posts Feed */}
//               <div className="space-y-4">
//                 {isLoading ? (
//                   <p className="text-slate-400 text-xs text-center py-8">
//                     Syncing updates live from feed database...
//                   </p>
//                 ) : posts && posts.length > 0 ? (
//                   posts.map((post) => (
//                     <div
//                       key={post.id}
//                       className="bg-emerald-900/10 border border-slate-800/60 rounded-md p-6 space-y-4 hover:border-slate-800 transition duration-200 relative overflow-visible"
//                     >
//                       <div className="flex justify-between items-start">
//                         <div className="flex items-center gap-3">
//                           <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
//                             {post.user?.avatar ? (
//                               <Image
//                                 src={post.user.avatar}
//                                 alt="avatar"
//                                 width={40}
//                                 height={40}
//                                 className="w-full h-full object-cover"
//                               />
//                             ) : (
//                               <div className="w-full h-full flex items-center justify-center font-bold text-sm text-indigo-400">
//                                 {post.user?.name?.charAt(0) || "U"}
//                               </div>
//                             )}
//                           </div>
//                           <div>
//                             <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
//                               <span>
//                                 {post.user?.name || "Anonymous Member"}
//                               </span>
//                             </div>
//                             <p className="text-[10px] text-slate-500">
//                               {post.timeAgo || "Recent"} •{" "}
//                               {activeCommunity.name} Context
//                             </p>
//                           </div>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <PostMenu
//                             postId={post.id}
//                             isOwner={
//                               post.userId === currentUserId ||
//                               post.user?.id === currentUserId
//                             }
//                             onEdit={(id) => {
//                               setEditingPostId(id);
//                               setEditText(post.content || "");
//                               setEditTitle(post.title || ""); // 👈 INITIALIZE THE TITLE VALUE HERE
//                             }}
//                             onDelete={(id) => handleDeletePost(id)}
//                           />
//                         </div>
//                       </div>

//                       <div className="space-y-2">
//                         {editingPostId === post.id ? (
//                           /* ========================================== */
//                           /* EDIT STATE WINDOW: Matched to your Layout   */
//                           /* ========================================== */
//                           <div className="space-y-3">
//                             {/* Title Edit Field */}
//                             <input
//                               type="text"
//                               value={editTitle}
//                               onChange={(e) => setEditTitle(e.target.value)}
//                               placeholder="Post Title (Optional)"
//                               className="w-full bg-slate-900 border border-slate-700/60 rounded-md p-2 text-sm font-bold text-white focus:outline-hidden focus:border-slate-500"
//                             />

//                             {/* Content Edit Field */}
//                             <textarea
//                               value={editText}
//                               onChange={(e) => setEditText(e.target.value)}
//                               className="w-full bg-slate-900 border border-slate-700/60 rounded-md p-2 text-sm text-white focus:outline-hidden focus:border-slate-500"
//                               rows={4}
//                             />

//                             {/* Control Actions Tray */}
//                             <div className="flex gap-2 justify-end">
//                               <button
//                                 onClick={() => handleEditPost(post.id)}
//                                 className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md text-xs font-semibold cursor-pointer"
//                               >
//                                 Save
//                               </button>
//                               <button
//                                 onClick={() => {
//                                   setEditingPostId(null);
//                                   setEditText("");
//                                   setEditTitle("");
//                                 }}
//                                 className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold cursor-pointer"
//                               >
//                                 Cancel
//                               </button>
//                             </div>
//                           </div>
//                         ) : (
//                           /* ========================================== */
//                           /* VIEW STATE WINDOW: Pure Static Text Display */
//                           /* ========================================== */
//                           <>
//                             {post.title && (
//                               <h4 className="text-base font-bold text-white tracking-tight leading-snug">
//                                 {post.title}
//                               </h4>
//                             )}
//                             {post.content && (
//                               <p className="text-slate-300 text-xs leading-relaxed">
//                                 {post.content}
//                               </p>
//                             )}
//                           </>
//                         )}
//                       </div>

//                       {/* Feed Action Controls */}
//                       <div className="pt-3 border-t border-slate-800/40 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
//                         <div className="flex items-center gap-4">
//                           <button
//                             onClick={() => handleLike(post.id)}
//                             className={`flex items-center gap-1.5 transition px-2 py-1 rounded bg-slate-900/40 border ${
//                               post.hasLiked
//                                 ? "text-indigo-400 border-indigo-500/50 bg-indigo-500/10"
//                                 : "border-slate-800/40 hover:text-indigo-400"
//                             }`}
//                           >
//                             <ThumbsUp
//                               className={`w-3.5 h-3.5 ${post.hasLiked ? "fill-indigo-400/20" : ""}`}
//                             />
//                             <span>({post.likes ?? 0})</span>
//                           </button>

//                           {/* 👇 BIND TOGGLE HERE */}
//                           <button
//                             onClick={() => handleCommentToggle(post.id)}
//                             className={`flex items-center gap-1.5 transition px-2 py-1 rounded bg-slate-900/40 border hover:text-indigo-400 ${
//                               expandedCommentPostId === post.id
//                                 ? "text-indigo-400 border-indigo-500/30 bg-indigo-500/5"
//                                 : "border-slate-800/40"
//                             }`}
//                           >
//                             <MessageSquare className="w-3.5 h-3.5" />
//                             <span>({post.comments || 0})</span>
//                           </button>
//                         </div>
//                       </div>

//                       {/* ========================================== */}
//                       {/* PRODUCTION EXPANDABLE COMMENT PANEL MODULE */}
//                       {/* ========================================== */}
//                       {expandedCommentPostId === post.id && (
//                         <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-4 animate-fadeIn">
//                           {/* Inner Feed Thread Content */}
//                           <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
//                             {isCommentsLoading ? (
//                               <p className="text-[11px] text-slate-500 text-center animate-pulse">
//                                 Pulling discussion stream...
//                               </p>
//                             ) : post.loadedComments &&
//                               post.loadedComments.length > 0 ? (
//                               post.loadedComments.map((comment) => (
//                                 <div
//                                   key={comment.id}
//                                   className="flex items-start gap-2.5 bg-slate-900/30 border border-slate-800/30 rounded-md p-2.5"
//                                 >
//                                   <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 text-[10px] font-bold flex items-center justify-center text-indigo-400">
//                                     {comment.user?.avatar ? (
//                                       <Image
//                                         src={comment.user.avatar}
//                                         alt="avatar"
//                                         width={24}
//                                         height={24}
//                                         className="object-cover w-full h-full"
//                                       />
//                                     ) : (
//                                       comment.user?.name?.charAt(0) || "U"
//                                     )}
//                                   </div>
//                                   <div className="flex-1 min-w-0">
//                                     <div className="flex items-baseline justify-between gap-2">
//                                       <span className="text-[11px] font-bold text-slate-300 truncate">
//                                         {comment.user?.name}
//                                       </span>
//                                       <span className="text-[9px] text-slate-600 shrink-0">
//                                         {comment.createdAt}
//                                       </span>
//                                     </div>
//                                     <p className="text-xs text-slate-400 mt-0.5 whitespace-pre-wrap">
//                                       {comment.content}
//                                     </p>
//                                   </div>
//                                 </div>
//                               ))
//                             ) : (
//                               <p className="text-[11px] text-slate-500 text-center py-2">
//                                 No comments here yet. Be the first to start the
//                                 conversation!
//                               </p>
//                             )}
//                           </div>

//                           {/* Comment Input Creation Block */}
//                           <div className="flex gap-2 items-center bg-slate-900/60 border border-slate-800 rounded-md p-1.5 focus-within:border-slate-700 transition">
//                             <input
//                               type="text"
//                               value={commentInputText}
//                               onChange={(e) =>
//                                 setCommentInputText(e.target.value)
//                               }
//                               placeholder="Write a supportive comment reply..."
//                               className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none px-2"
//                               onKeyDown={(e) => {
//                                 if (e.key === "Enter") {
//                                   e.preventDefault();
//                                   handleSubmitComment(post.id);
//                                 }
//                               }}
//                             />
//                             <button
//                               onClick={() => handleSubmitComment(post.id)}
//                               disabled={!commentInputText.trim()}
//                               className="p-1.5 rounded-md bg-indigo-600 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 hover:bg-indigo-500 transition shrink-0"
//                             >
//                               <Send className="w-3 h-3" />
//                             </button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-slate-500 text-xs text-center py-8 bg-slate-900/10 border border-dashed border-slate-800/60 rounded-2xl">
//                     No active feeds returned for this environment database.
//                   </p>
//                 )}
//               </div>
//             </div>

//             {/* ======================================================= */}
//             {/* RIGHT COLUMN: METRICS, EVENTS, LEADERBOARD */}
//             {/* ======================================================= */}

//             <div className="lg:col-span-4 flex flex-col w-full bg-emerald-900/10 overflow-hidden sticky top-4 self-start">
//               <div className="bg-slate-900/40 border-b border-slate-800/60 overflow-hidden relative h-44 w-full shrink-0 shadow-lg">
//                 {imageSrc ? (
//                   <Image
//                     src={imageSrc}
//                     alt={activeCommunity.name}
//                     fill
//                     sizes="(max-width: 1024px) 100vw, 33vw"
//                     priority
//                     className="object-cover hover:scale-105 transition-transform duration-500"
//                   />
//                 ) : (
//                   <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-linear-to-br from-slate-900 to-slate-950 text-slate-400 relative">
//                     <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-size-[14px_24px]" />
//                     <Layers className="w-8 h-8 mb-2 text-slate-600 relative z-10" />
//                     <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase text-center max-w-xs truncate relative z-10">
//                       {activeCommunity.name}
//                     </div>
//                   </div>
//                 )}
//                 <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
//               </div>

//               <div className="p-4 pb-1 space-y-1">
//                 <div className="flex items-center justify-between gap-2 relative">
//                   <h2 className="text-lg font-black tracking-tight bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent truncate flex-1">
//                     {activeCommunity.name}
//                   </h2>

//                   <div className="relative shrink-0">
//                     <button
//                       onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                       className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-md text-xs transition duration-200 flex items-center justify-center gap-1 shadow-lg"
//                     >
//                       <ChevronDown
//                         className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
//                           isDropdownOpen ? "rotate-180" : ""
//                         }`}
//                       />
//                     </button>

//                     {isDropdownOpen && (
//                       <>
//                         <div
//                           className="fixed inset-0 z-30"
//                           onClick={() => setIsDropdownOpen(false)}
//                         />
//                         <div className="absolute right-0 mt-2 w-56 bg-slate-950 border border-slate-800 rounded-md shadow-2xl overflow-hidden z-40 divide-y divide-slate-800/50">
//                           <div className="p-1.5 max-h-60 overflow-y-auto space-y-0.5">
//                             {communities.map((comm) => {
//                               const isSelected = comm.id === activeCommunityId;
//                               return (
//                                 <button
//                                   key={comm.id}
//                                   onClick={() => {
//                                     setActiveCommunityId(comm.id);
//                                     setIsDropdownOpen(false);
//                                   }}
//                                   className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium transition truncate flex items-center justify-between ${
//                                     isSelected
//                                       ? "bg-indigo-600/20 text-indigo-400 font-semibold"
//                                       : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
//                                   }`}
//                                 >
//                                   <span className="truncate">{comm.name}</span>
//                                   {isSelected && (
//                                     <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
//                                   )}
//                                 </button>
//                               );
//                             })}
//                           </div>
//                         </div>
//                       </>
//                     )}
//                   </div>
//                 </div>

//                 {activeCommunity.smallDescription && (
//                   <p className="text-sm font-medium text-muted-foreground leading-relaxed line-clamp-3">
//                     {activeCommunity.smallDescription}
//                   </p>
//                 )}
//               </div>

//               <div className="p-3 pt-2 flex flex-col gap-6 w-full">
//                 <div className="grid grid-cols-3 gap-2 p-0 rounded-md text-center">
//                   <div className="flex flex-col items-center justify-center p-1 rounded bg-emerald-900/10 ">
//                     <Users className="w-3.5 h-3.5 text-slate-400 mb-1" />
//                     <span className="text-xs font-bold text-slate-200">
//                       {activeCommunity.memberCount ?? 0}
//                     </span>
//                     <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
//                       Members
//                     </span>
//                   </div>

//                   <div className="flex flex-col items-center justify-center p-1 rounded bg-emerald-900/10">
//                     <div className="relative mb-1">
//                       <Radio className="w-3.5 h-3.5 text-emerald-400" />
//                       <span className="absolute top-0 right-0 block h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
//                     </div>
//                     <span className="text-xs font-bold text-emerald-400">
//                       {activeCommunity.onlineCount ?? 0}
//                     </span>
//                     <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
//                       Online
//                     </span>
//                   </div>

//                   <div className="flex flex-col items-center justify-center p-1 rounded bg-emerald-900/10">
//                     <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 mb-1" />
//                     <span className="text-xs font-bold text-indigo-400">
//                       {activeCommunity.adminCount ?? 0}
//                     </span>
//                     <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
//                       Admins
//                     </span>
//                   </div>
//                 </div>

//                 {/* Enrolled Courses */}
//                 <div className="bg-emerald-900/10 rounded-md p-4 space-y-2">
//                   <div className="flex justify-between items-center border-b border-slate-800 pb-2">
//                     <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
//                       Enrolled Courses
//                     </h3>
//                   </div>

//                   <div className="space-y-3">
//                     {activeCommunity.continueLearning &&
//                     activeCommunity.continueLearning.length > 0 ? (
//                       activeCommunity.continueLearning.map((course, idx) => (
//                         <div
//                           key={idx}
//                           className="bg-emerald-900/10 border border-slate-800/60 rounded-lg p-3.5 flex flex-col justify-between"
//                         >
//                           <div className="space-y-1">
//                             <div className="flex items-start justify-between gap-2">
//                               <h4 className="font-semibold text-slate-200 text-xs leading-snug">
//                                 {course.title}
//                               </h4>
//                             </div>
//                             <p className="text-[11px] text-slate-400 truncate">
//                               {course.lesson}
//                             </p>
//                           </div>
//                           <div className="mt-3">
//                             <div className="flex justify-between text-[10px] mb-1 text-slate-400">
//                               <span>Completeness</span>
//                               <span className="text-slate-200 font-medium">
//                                 {course.progress}%
//                               </span>
//                             </div>
//                             <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
//                               <div
//                                 className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full"
//                                 style={{ width: `${course.progress}%` }}
//                               />
//                             </div>
//                           </div>
//                         </div>
//                       ))
//                     ) : (
//                       <p className="text-slate-500 text-xs text-center py-4">
//                         No matching records found.
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 {/* Upcoming Appts */}
//                 <div className="bg-emerald-900/10 border border-slate-800/60 rounded-md p-4 space-y-4">
//                   <div className="flex justify-between items-center border-b border-slate-800 pb-2">
//                     <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
//                       Upcoming Appointments
//                     </h3>
//                   </div>
//                   <div className="space-y-3">
//                     {activeCommunity.upcomingTimeline &&
//                     activeCommunity.upcomingTimeline.length > 0 ? (
//                       activeCommunity.upcomingTimeline.map((item, idx) => (
//                         <div
//                           key={idx}
//                           className="bg-slate-900/80 border border-slate-800/40 rounded-lg p-3.5 space-y-2"
//                         >
//                           <div>
//                             <span className="text-[9px] font-bold tracking-wider uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
//                               {item.type}
//                             </span>
//                           </div>
//                           <h4 className="font-semibold text-slate-200 text-xs">
//                             {item.title}
//                           </h4>
//                           <p className="text-[10px] text-slate-400 flex items-center gap-1">
//                             <Calendar className="w-3 h-3 text-slate-500" />{" "}
//                             {item.date}
//                           </p>
//                         </div>
//                       ))
//                     ) : (
//                       <p className="text-slate-500 text-xs text-center py-4">
//                         No events pending configuration.
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 {/* Leaderboard Framework */}
//                 <div className="bg-emerald-900/10 border border-slate-800/60 rounded-md p-4 space-y-3">
//                   <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 mb-1">
//                     <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
//                     <span>Leaderboard standings</span>
//                   </div>
//                   <div className="space-y-2">
//                     {activeCommunity.leaderboard &&
//                     activeCommunity.leaderboard.length > 0 ? (
//                       activeCommunity.leaderboard.map((member) => (
//                         <div
//                           key={member.rank}
//                           className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/40"
//                         >
//                           <div className="flex items-center gap-2.5">
//                             <div
//                               className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${member.rank === 1 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-slate-800 text-slate-400"}`}
//                             >
//                               {member.rank}
//                             </div>
//                             <span className="font-medium text-xs text-slate-300">
//                               {member.name}
//                             </span>
//                           </div>
//                           <div className="text-[10px] font-bold text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
//                             {member.points}
//                           </div>
//                         </div>
//                       ))
//                     ) : (
//                       <p className="text-slate-500 text-xs text-center py-4">
//                         Ranks recalculating...
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }
