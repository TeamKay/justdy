 "use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Play, X, Video, Flame, Clock, Sparkles } from "lucide-react";
import CommunityVideosViewer from "./CommunityVideosViewer";

type ReactionType =
  | "LIKE"
  | "DISLIKE"
  | "HELPFUL"
  | "INSIGHTFUL"
  | "CELEBRATE"
  | "CURIOUS"
  | "LOVE";

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
    type: ReactionType;
    user: {
      imageUrl: string | null;
      socialProfile: {
        displayName: string;
        username: string;
      } | null;
    };
  }[];
  commentsEnabled: boolean;
  _count: { comments: number };
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

type Props = {
  posts: CommunityVideoPost[];
  currentUserId: string;
  currentDisplayName: string;
  currentUsername: string;
  currentImageUrl: string | null;
  initialBookmarkedPostIds: string[];
};

const categories = [
  { id: "ALL", label: "All videos" },
  { id: "MATHEMATICS", label: "Mathematics" },
  { id: "ALGEBRA", label: "Algebra" },
  { id: "GEOMETRY", label: "Geometry" },
  { id: "CALCULUS", label: "Calculus" },
  { id: "STATISTICS", label: "Statistics" },
  { id: "GENERAL", label: "General learning" },
] as const;

type CategoryId = (typeof categories)[number]["id"];

function plainText(value: string | null): string {
  if (!value) return "";
  try {
    const parsed: unknown = JSON.parse(value);
    const collect = (node: unknown): string => {
      if (!node || typeof node !== "object") return "";
      const record = node as { text?: unknown; content?: unknown };
      if (typeof record.text === "string") return record.text;
      if (!Array.isArray(record.content)) return "";
      return record.content.map(collect).join(" ");
    };
    return collect(parsed).replace(/\s+/g, " ").trim();
  } catch {
    return value.replace(/\s+/g, " ").trim();
  }
}

function inferCategory(text: string): Exclude<CategoryId, "ALL"> {
  const value = text.toLowerCase();

  if (/\b(calculus|derivative|derivatives|integral|integration|limits)\b/.test(value)) {
    return "CALCULUS";
  }
  if (/\b(statistics|probability|mean|median|mode|standard deviation|data analysis)\b/.test(value)) {
    return "STATISTICS";
  }
  if (/\b(geometry|triangle|circle|polygon|angle|perimeter|area|volume|pythagoras)\b/.test(value)) {
    return "GEOMETRY";
  }
  if (/\b(algebra|equation|equations|variable|factorisation|factorization|quadratic|polynomial)\b/.test(value)) {
    return "ALGEBRA";
  }
  if (/\b(math|mathematics|arithmetic|number|fractions|multiplication|division|addition|subtraction)\b/.test(value)) {
    return "MATHEMATICS";
  }
  return "GENERAL";
}

export default function CommunityVideosDiscovery({
  posts,
  currentUserId,
  currentDisplayName,
  currentUsername,
  currentImageUrl,
  initialBookmarkedPostIds,
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryId>("ALL");
  const [sortMode, setSortMode] = useState<"LATEST" | "TRENDING" | "FOR_YOU">("LATEST");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const classifiedPosts = useMemo(
    () =>
      posts.map((post) => {
        const caption = plainText(post.content);
        const creator = post.author.socialProfile?.displayName || "Justdy member";
        const username = post.author.socialProfile?.username || "member";
        const categoryId = inferCategory(caption);
        return { post, caption, creator, username, categoryId };
      }),
    [posts],
  );

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return classifiedPosts.filter((item) => {
      const matchesCategory =
        category === "ALL" || item.categoryId === category;
      const searchable = `${item.caption} ${item.creator} ${item.username}`.toLowerCase();
      return matchesCategory && (!query || searchable.includes(query));
    });
  }, [classifiedPosts, search, category]);

  const orderedPosts = useMemo(() => {
    if (sortMode === "LATEST") return filteredPosts;

    const newestTimestamp = Math.max(
      0,
      ...filteredPosts.map((item) =>
        new Date(item.post.publishedAt ?? item.post.createdAt).getTime(),
      ),
    );

    const categoryInterest = new Map<Exclude<CategoryId, "ALL">, number>();
    const creatorInterest = new Map<string, number>();

    if (sortMode === "FOR_YOU") {
      for (const item of classifiedPosts) {
        const myReaction = item.post.reactions.find(
          (reaction) => reaction.userId === currentUserId,
        );

        if (!myReaction) continue;

        // Positive learning signals strengthen interest in a subject or creator.
        const weight =
          myReaction.type === "DISLIKE"
            ? -1
            : myReaction.type === "LIKE" || myReaction.type === "LOVE"
              ? 2
              : 1;

        categoryInterest.set(
          item.categoryId,
          (categoryInterest.get(item.categoryId) ?? 0) + weight,
        );
        creatorInterest.set(
          item.post.authorId,
          (creatorInterest.get(item.post.authorId) ?? 0) + weight,
        );
      }
    }

    const hasPersonalSignals =
      [...categoryInterest.values()].some((value) => value > 0) ||
      [...creatorInterest.values()].some((value) => value > 0);

    return [...filteredPosts].sort((a, b) => {
      const score = (item: (typeof filteredPosts)[number]) => {
        const publishedAt = item.post.publishedAt ?? item.post.createdAt;
        const ageHours = newestTimestamp
          ? Math.max(
              0,
              (newestTimestamp - new Date(publishedAt).getTime()) /
                (1000 * 60 * 60),
            )
          : 0;
        const engagement =
          item.post.reactions.length + item.post._count.comments * 2;
        const freshnessEngagement =
          engagement * Math.pow(0.5, ageHours / 48);

        if (sortMode === "TRENDING") return freshnessEngagement;

        const subjectAffinity = categoryInterest.get(item.categoryId) ?? 0;
        const creatorAffinity = creatorInterest.get(item.post.authorId) ?? 0;
        const personalization =
          subjectAffinity * 3 + creatorAffinity * 2;

        // With no prior reactions, fall back to recent community engagement
        // rather than presenting an arbitrary "personalized" ranking.
        return hasPersonalSignals
          ? personalization * 10 + freshnessEngagement
          : freshnessEngagement;
      };

      const scoreDifference = score(b) - score(a);
      if (scoreDifference !== 0) return scoreDifference;

      const aDate = new Date(a.post.publishedAt ?? a.post.createdAt).getTime();
      const bDate = new Date(b.post.publishedAt ?? b.post.createdAt).getTime();
      return bDate - aDate;
    });
  }, [filteredPosts, sortMode, classifiedPosts, currentUserId]);

  const selectedIndex = orderedPosts.findIndex(
    (item) => item.post.id === selectedPostId,
  );
  const viewerPosts =
    selectedIndex >= 0
      ? [
          ...orderedPosts.slice(selectedIndex).map((item) => item.post),
          ...orderedPosts.slice(0, selectedIndex).map((item) => item.post),
        ]
      : [];

  if (selectedPostId && viewerPosts.length > 0) {
    return (
      <CommunityVideosViewer
        posts={viewerPosts}
        currentUserId={currentUserId}
        currentDisplayName={currentDisplayName}
        currentUsername={currentUsername}
        currentImageUrl={currentImageUrl}
        initialBookmarkedPostIds={initialBookmarkedPostIds}
        closeHref="/community-videos/discover"
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F8F5] px-4 pb-12 pt-5 text-[#173B2F] sm:px-6 sm:pt-7">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <Link
            href="/?view=community-videos"
            className="mb-5 inline-flex items-center rounded-full border border-[#DCE6DC] bg-white px-3 py-2 text-xs font-semibold text-[#526357] transition hover:border-[#9CB39F] hover:bg-[#F4F8F3]"
          >
            Back to Community Videos
          </Link>
          <div className="flex items-center gap-2 text-[#52745D]">
            <Video className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-[0.14em]">
              Justdy Community
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Discover videos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718075]">
            Explore learning videos shared by the Justdy community. Search for
            a topic or creator, or choose a subject to narrow your results.
          </p>
        </header>

        <div className="mb-5 rounded-2xl border border-[#E2E9E1] bg-white p-3 shadow-sm sm:p-4">
          <label htmlFor="community-video-search" className="sr-only">
            Search videos and creators
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-[#DCE6DC] bg-[#FAFCF9] px-3">
            <Search className="h-5 w-5 shrink-0 text-[#87938A]" />
            <input
              id="community-video-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search topics, video captions or creators..."
              className="h-12 min-w-0 flex-1 bg-transparent text-sm text-[#173B2F] outline-none placeholder:text-[#9AA69C]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="rounded-full p-1.5 text-[#718075] hover:bg-[#EAF1EB]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#87938A]" />
            <span className="text-xs font-semibold text-[#718075]">
              Subjects
            </span>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => {
              const active = category === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  aria-pressed={active}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-[#173B2F] text-white"
                      : "border border-[#DCE6DC] bg-white text-[#526357] hover:border-[#9CB39F] hover:bg-[#F4F8F3]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap rounded-xl border border-[#DCE6DC] bg-white p-1">
            <button
              type="button"
              onClick={() => setSortMode("FOR_YOU")}
              aria-pressed={sortMode === "FOR_YOU"}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                sortMode === "FOR_YOU"
                  ? "bg-[#173B2F] text-white"
                  : "text-[#526357] hover:bg-[#F4F8F3]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              For you
            </button>
            <button
              type="button"
              onClick={() => setSortMode("LATEST")}
              aria-pressed={sortMode === "LATEST"}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                sortMode === "LATEST"
                  ? "bg-[#173B2F] text-white"
                  : "text-[#526357] hover:bg-[#F4F8F3]"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Latest
            </button>
            <button
              type="button"
              onClick={() => setSortMode("TRENDING")}
              aria-pressed={sortMode === "TRENDING"}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                sortMode === "TRENDING"
                  ? "bg-[#173B2F] text-white"
                  : "text-[#526357] hover:bg-[#F4F8F3]"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              Trending
            </button>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-[#405447]">
              {filteredPosts.length} {filteredPosts.length === 1 ? "video" : "videos"}
            </p>
          {(search || category !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("ALL");
              }}
              className="text-xs font-semibold text-[#52745D] underline underline-offset-4 hover:text-[#173B2F]"
            >
              Clear filters
            </button>
          )}
          </div>
        </div>
        {sortMode === "FOR_YOU" && (
          <p className="mb-4 text-xs text-[#718075]">
            Recommendations use the subjects and creators you have reacted to,
            combined with recent community engagement. If you have not reacted
            to videos yet, this view uses trending signals until it learns your interests.
          </p>
        )}

        {orderedPosts.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-[#D5E0D5] bg-white px-6 py-16 text-center">
            <Search className="mx-auto h-9 w-9 text-[#A1ADA3]" />
            <h2 className="mt-4 text-lg font-bold">No matching videos</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#718075]">
              Try another search or subject. You can also clear the filters to
              see all available community videos.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("ALL");
              }}
              className="mt-5 rounded-lg bg-[#173B2F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#315B43]"
            >
              Show all videos
            </button>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orderedPosts.map((item) => {
              const initials = item.creator
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("");
              return (
                <button
                  key={item.post.id}
                  type="button"
                  onClick={() => setSelectedPostId(item.post.id)}
                  className="group flex min-h-44 flex-col justify-between rounded-2xl border border-[#E2E9E1] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#B7CBB8] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52745D] focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#EAF1EB] px-3 py-1 text-[11px] font-semibold text-[#315B43]">
                        {categories.find((entry) => entry.id === item.categoryId)?.label}
                      </span>
                      {sortMode === "TRENDING" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1E8] px-2.5 py-1 text-[10px] font-semibold text-[#B75A2B]">
                          <Flame className="h-3 w-3" />
                          Trending
                        </span>
                      )}
                      {sortMode === "FOR_YOU" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F0ECFF] px-2.5 py-1 text-[10px] font-semibold text-[#6650A4]">
                          <Sparkles className="h-3 w-3" />
                          For you
                        </span>
                      )}
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F58750] text-white transition group-hover:scale-105">
                      <Play className="ml-0.5 h-4 w-4 fill-current" />
                    </span>
                  </div>
                  <div className="mt-5">
                    <h2 className="line-clamp-3 text-sm font-semibold leading-6 text-[#24392C]">
                      {item.caption || "Community learning video"}
                    </h2>
                    <div className="mt-3 flex items-center gap-2">
                      {item.post.author.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.post.author.imageUrl}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF1EB] text-[10px] font-bold text-[#315B43]">
                          {initials || "J"}
                        </span>
                      )}
                      <span className="truncate text-xs font-medium text-[#718075]">
                        {item.creator} · @{item.username}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-center text-[11px] leading-5 text-[#87938A]">
          Subject labels are estimated from video captions for now. Creators will
          be able to choose verified subjects in a later update.
        </p>
      </div>
    </main>
  );
}
