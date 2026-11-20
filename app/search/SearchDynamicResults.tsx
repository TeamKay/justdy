
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileQuestion,
  GraduationCap,
  Play,
  Video,
} from "lucide-react";

import type { Video as LearningVideo } from "@/lib/youtube";

type Tutor = {
  id: string;
  name: string;
  imageUrl: string | null;
  teachingProfile: {
    headline: string | null;
    specialty: string | null;
    experience: number | null;
    description: string | null;
    hourlyRate: number | null;
    currency: string;
    subjects: string[];
    gradeLevels: string[];
  };
};

type CommunityPost = {
  id: string;
  content: string | null;
  postType: "GENERAL" | "WELCOME" | "CHALLENGE";
  publishedAt: string | null;
  createdAt: string;
  author: {
    name: string;
    imageUrl: string | null;
    username: string | null;
    displayName: string | null;
  };
  challenge: {
    id: string;
    opensAt: string;
    closesAt: string;
    status: "OPEN" | "CLOSED" | "CANCELLED";
    maxScore: number;
  } | null;
};

type Props = {
  query: string;
  videos: LearningVideo[];
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesQuery(query: string, ...values: string[]) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) return false;

  const searchableText = normalize(values.join(" "));

  return normalizedQuery
    .split(" ")
    .every((word) => searchableText.includes(word));
}

export default function SearchDynamicResults({
  query,
  videos,
}: Props) {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [tutorError, setTutorError] = useState(false);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
const [loadingCommunity, setLoadingCommunity] = useState(false);
const [communityError, setCommunityError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTutors() {
      try {
        const response = await fetch("/api/public/tutors", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load tutors.");
        }

        const data = await response.json();

        if (active) {
          setTutors(Array.isArray(data?.tutors) ? data.tutors : []);
        }
      } catch {
        if (active) setTutorError(true);
      } finally {
        if (active) setLoadingTutors(false);
      }
    }

    void loadTutors();

    return () => {
      active = false;
    };
  }, []);

useEffect(() => {
  const normalizedQuery = query.trim();

  // Do not make a request for queries shorter than two characters.
  // The UI handles this state separately.
  if (normalizedQuery.length < 2) {
    return;
  }

  const controller = new AbortController();

  async function loadCommunityPosts() {
    try {
      setLoadingCommunity(true);
      setCommunityError("");

      const response = await fetch(
        `/api/social/search?q=${encodeURIComponent(normalizedQuery)}`,
        {
          cache: "no-store",
          signal: controller.signal,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Sign in to search community posts and challenges."
            : data?.error || "Unable to search community posts.",
        );
      }

      setCommunityPosts(
        Array.isArray(data?.posts) ? data.posts : [],
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setCommunityError(
        error instanceof Error
          ? error.message
          : "Unable to search community posts.",
      );

      setCommunityPosts([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoadingCommunity(false);
      }
    }
  }

  void loadCommunityPosts();

  return () => {
    controller.abort();
  };
}, [query]);

  const matchingVideos = useMemo(() => {
    const uniqueVideos = new Map<string, LearningVideo>();

    videos.forEach((video) => {
      if (!uniqueVideos.has(video.id)) {
        uniqueVideos.set(video.id, video);
      }
    });

    return Array.from(uniqueVideos.values()).filter((video) =>
      matchesQuery(query, video.title, video.description ?? ""),
    );
  }, [videos, query]);

  const matchingTutors = useMemo(() => {
    return tutors.filter((tutor) => {
      const profile = tutor.teachingProfile;

      return matchesQuery(
        query,
        tutor.name,
        profile.headline ?? "",
        profile.specialty ?? "",
        profile.description ?? "",
        ...profile.subjects,
        ...profile.gradeLevels,
      );
    });
  }, [tutors, query]);

  return (
    <div className="mt-10 space-y-10">
      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#47834B]">
              Watch and learn
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#263D2D]">
              Educational videos
            </h2>
          </div>
          <Link
            href="/videos"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#47834B] hover:underline"
          >
            All videos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {matchingVideos.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matchingVideos.map((video) => (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="group overflow-hidden rounded-2xl border border-[#E4EBE2] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-video overflow-hidden bg-[#EAF4E6]">
                  {video.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#47834B]">
                      <Video className="h-10 w-10" />
                    </div>
                  )}
                  <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#47834B] shadow-md">
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  </span>
                </div>

                <div className="p-5">
                  <span className="text-xs font-semibold text-[#47834B]">
                    Video lesson
                  </span>
                  <h3 className="mt-2 line-clamp-2 font-bold text-[#263D2D]">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#829087]">
                      {video.description}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#47834B]">
                    Watch lesson
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[#E4EBE2] bg-white p-5 text-sm text-[#829087]">
            No matching videos were found for this search.
          </p>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#47834B]">
              Learn with guidance
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#263D2D]">
              Verified tutors
            </h2>
          </div>
          <Link
            href="/tutors"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#47834B] hover:underline"
          >
            All tutors <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loadingTutors ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-2xl border border-[#E4EBE2] bg-white"
              />
            ))}
          </div>
        ) : tutorError ? (
          <p className="rounded-xl border border-dashed border-[#E4EBE2] bg-white p-5 text-sm text-[#829087]">
            Tutor results are temporarily unavailable. You can still explore
            the tutor directory.
          </p>
        ) : matchingTutors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matchingTutors.map((tutor) => (
              <article
                key={tutor.id}
                className="rounded-2xl border border-[#E4EBE2] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EAF4E6] text-[#47834B]">
                    {tutor.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tutor.imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <GraduationCap className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#263D2D]">
                      {tutor.name}
                    </h3>
                    <p className="mt-1 text-sm text-[#47834B]">
                      {tutor.teachingProfile.specialty ||
                        tutor.teachingProfile.headline ||
                        "Verified educator"}
                    </p>
                  </div>
                </div>

                {tutor.teachingProfile.description && (
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#829087]">
                    {tutor.teachingProfile.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {tutor.teachingProfile.subjects.slice(0, 3).map((subject) => (
                    <span
                      key={subject}
                      className="rounded-full bg-[#F2F6EF] px-3 py-1 text-xs font-medium text-[#718A70]"
                    >
                      {subject}
                    </span>
                  ))}
                  {tutor.teachingProfile.gradeLevels.slice(0, 2).map((grade) => (
                    <span
                      key={grade}
                      className="rounded-full bg-[#F2F6EF] px-3 py-1 text-xs font-medium text-[#718A70]"
                    >
                      {grade}
                    </span>
                  ))}
                </div>

                <Link
                  href="/tutoring"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#153F35] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#24523F]"
                >
                  Explore tutoring
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[#E4EBE2] bg-white p-5 text-sm text-[#829087]">
            No matching verified tutors were found for this search.
          </p>
        )}
      </section>

      <section>
  <div className="mb-5 flex items-center justify-between gap-3">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#47834B]">
        Learn from the community
      </p>
      <h2 className="mt-1 text-xl font-bold text-[#263D2D]">
        Community Posts & Challenges
      </h2>
      <p className="mt-1 text-sm text-[#829087]">
        Discover public learning discussions and official mathematics challenges.
      </p>
    </div>
  </div>

 {query.trim().length < 2 ? (
  <p className="rounded-xl border border-dashed border-[#E4EBE2] bg-white p-5 text-sm text-[#829087]">
    Enter at least two characters to search community posts and challenges.
  </p>
) : loadingCommunity ? (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-44 animate-pulse rounded-2xl border border-[#E4EBE2] bg-white"
        />
      ))}
    </div>
  ) : communityError ? (
    <div className="rounded-xl border border-dashed border-[#E4EBE2] bg-white p-5 text-sm text-[#829087]">
      <p>{communityError}</p>
      {communityError.includes("Sign in") && (
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-2 font-semibold text-[#47834B] hover:underline"
        >
          Sign in to Justdy
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  ) : communityPosts.length > 0 ? (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {communityPosts.map((post) => {
        const isChallenge = post.postType === "CHALLENGE";

        return (
          <article
            key={post.id}
            className="flex flex-col rounded-2xl border border-[#E4EBE2] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  isChallenge
                    ? "bg-[#FFF2DF] text-[#98632D]"
                    : "bg-[#EAF4E6] text-[#47834B]"
                }`}
              >
                {isChallenge ? (
                  <FileQuestion className="h-3.5 w-3.5" />
                ) : (
                  <GraduationCap className="h-3.5 w-3.5" />
                )}
                {isChallenge ? "Official challenge" : "Community post"}
              </span>

              {isChallenge && post.challenge && (
                <span className="text-xs font-semibold text-[#47834B]">
                  {post.challenge.status === "OPEN"
                    ? "Open"
                    : post.challenge.status === "CLOSED"
                      ? "Closed"
                      : "Cancelled"}
                </span>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-[#829087]">
                {post.author.displayName || post.author.name}
                {post.author.username
                  ? ` · @${post.author.username}`
                  : ""}
              </p>

              <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-[#405247]">
                {post.content || "View this community post."}
              </p>
            </div>

            {isChallenge && post.challenge && (
              <div className="mt-4 rounded-xl bg-[#F7F9F6] p-3 text-xs leading-5 text-[#718075]">
                <p>
                  Maximum score: {post.challenge.maxScore} points
                </p>
                <p>
                  Closes:{" "}
                  {new Date(post.challenge.closesAt).toLocaleDateString()}
                </p>
              </div>
            )}

            <Link
              href={`/post/${post.id}`}
              className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-[#47834B] hover:underline"
            >
              {isChallenge ? "View challenge" : "View post"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        );
      })}
    </div>
  ) : (
    <p className="rounded-xl border border-dashed border-[#E4EBE2] bg-white p-5 text-sm text-[#829087]">
      No matching public community posts or challenges were found.
    </p>
  )}
</section>
    </div>
  );
}
