import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import SocialPostContent from "@/app/_components/social/posts/SocialPostContent";
import SocialPostImageGallery from "./_components/social/posts/SocialPostImageGallery";
import {
  SocialPostComposerTrigger,
} from "./_components/social/posts/SocialPostComposer";
import CommunityInfoCard from "./_components/social/shared/CommunityInfoCard";
import PublicTutoringOnboarding from "@/app/_components/tutoring/PublicTutoringOnboarding";
import PublicSignInTrigger from "@/app/_components/tutoring/PublicSignInTrigger";
import { getYoutubeVideos } from "@/lib/youtube";
import {
  ArrowUpRight,
  LockKeyhole,
  Users,
  WandSparkles,
  House,
  Video,
  Gamepad2,
  UserRoundCheck,
  Heart,
  Globe,
} from "lucide-react";
import {
  extractSocialPostUrls,
} from "@/lib/social/rich-text";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { visibleSocialPostWhere } from "@/lib/social/access";
import { ensureSocialProfileForUser } from "@/lib/social/ensure-profile";
import SocialNavigation from "./_components/social/shared/SocialNavigation";
import SocialLinkPreview from "@/app/_components/social/posts/SocialLinkPreview";
import SocialVideosFeed from "./_components/social/videos/SocialVideosFeed";
import CommunityVideosViewer from "./_components/social/videos/CommunityVideosViewer";
import SocialPostEditor from "./_components/social/posts/SocialPostEditor";
import SocialPostDeleteButton from "@/app/_components/social/posts/SocialPostDeleteButton";
import SocialPostActions from "@/app/_components/social/posts/SocialPostActions";
import SocialPostComments from "./_components/social/posts/SocialPostComments";



export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; profile?: string; q?: string }>;
}) {
  const { view } = await searchParams;

  const title =
  view === "members"
    ? "Members | Justdy"
    : view === "videos"
      ? "Learning Videos | Justdy"
      : view === "community-videos"
        ? "Community Videos | Justdy"
        : "Community | Justdy";

  return {
    title,
    description: "Share ideas, learn together, and grow with Justdy.",
  };
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatPostDate(date: Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

const communityNavigation = [
  {
    label: "Home",
    href: "/home",
    description: "Your learning community",
    icon: House,
  },
  {
    label: "Members",
    href: "/home?view=members",
    description: "All Justdy members",
    icon: Users,
  },
  {
    label: "Videos",
    href: "/home?view=videos",
    description: "Watch and learn",
    icon: Video,
  },
  {
    label: "Games",
    href: "/games",
    description: "Learn through games",
    icon: Gamepad2,
  },
  {
    label: "Requests",
    href: "/requests",
    description: "Manage your requests",
    icon: UserRoundCheck,
  },
 
];

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "J"
  );
}

function VisibilityBadge({ visibility }: { visibility: string }) {
  if (visibility === "PUBLIC") {
    return (
      <span
        className="inline-flex items-center text-[#87938A]"
        title="Public"
        aria-label="Public"
      >
        <Globe className="h-4 w-4" />
      </span>
    );
  }

  const isFollowers = visibility === "FOLLOWERS";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
        isFollowers
          ? "bg-sky-50 text-sky-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {!isFollowers && <LockKeyhole className="h-3 w-3" />}
      {isFollowers ? "Followers" : "Only me"}
    </span>
  );
}

export default async function SocialHomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; profile?: string; q?: string }>;
}) {
 
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // ============================================================
  // PUBLIC GUEST HOMEPAGE
  // ============================================================

  if (!session?.user) {
    const guestPosts = await prisma.socialPost.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        author: {
          is: {
            status: "Active",
            socialProfile: {
              is: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        content: true,
        publishedAt: true,
        createdAt: true,
        author: {
          select: {
            imageUrl: true,
            socialProfile: {
              select: {
                displayName: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return (
      <div className="min-h-screen bg-[#F6F8F5] text-[#173B2F]">
        {/* Public header */}
        <SocialNavigation />

        <main className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-6 px-4 pb-16 pt-23 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-7 lg:px-8">

          {/* Public community feed */}
          <section className="min-w-0">

         <PublicTutoringOnboarding>

            {guestPosts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#D5E0D5] bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-[#EAF1EB] text-[#315B43]">
                  <Users className="h-7 w-7" />
                </div>

                <h2 className="mt-5 text-lg font-bold text-[#173B2F]">
                  You&apos;re missing out on MathFun!
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#87938A]">
                  There are no public posts to display yet. Join Justdy and
                  become part of the learning community.
                </p>

                <PublicSignInTrigger
                      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#312c65] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#312c65]"
                    >
                      Join Now
                      <ArrowUpRight className="h-4 w-4" />
                    </PublicSignInTrigger>
              </div>
            ) : (
              <div className="space-y-5">
                {guestPosts.map((post) => {
                  const authorName =
                    post.author.socialProfile?.displayName ||
                    "Justdy member";

                  const postDate = post.publishedAt ?? post.createdAt;

                  const postUrls = extractSocialPostUrls(post.content);
                 

                  return (
                    <article
                      key={post.id}
                      className="overflow-hidden rounded-lg border border-[#E5EAE3] bg-white shadow-[0_3px_14px_rgba(23,59,47,0.045)]"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF1EB]">
                            {post.author.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={post.author.imageUrl}
                                alt={authorName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-[#315B43]">
                                {getInitials(authorName)}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#173B2F]">
                              {authorName}
                            </p>

                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#929D93]">
                              <span title={dateFormatter.format(postDate)}>
                                {formatPostDate(postDate)}
                              </span>
                              <Globe className="h-3.5 w-3.5" aria-label="Public" />
                            </div>
                          </div>

                          
                        </div>

                        {post.content && (
                          <SocialPostContent
                            content={post.content}
                            preview
                            className="mt-5"
                          />
                        )}

                        {postUrls.length > 0 && (
                          <SocialLinkPreview urls={postUrls} />
                        )}

                        <div className="mt-5 flex items-center justify-between border-t border-[#E9EEE8] pt-4">
                          <p className="text-[11px] text-[#929D93]">
                            Enjoying this conversation?
                          </p>

                         <PublicSignInTrigger
                           className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#312c65] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#312c65]"
                         >
                           Join the conversation
                           <ArrowUpRight className="h-4 w-4" />
                         </PublicSignInTrigger>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            </PublicTutoringOnboarding>
          </section>

          {/* Public visitor information panel */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            {/* Community information */}
            <CommunityInfoCard isLoggedIn={false} />

            <section className="rounded-lg border border-[#E9DFC9] bg-[#FBF5EA] p-5">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-[#9A642F]" />
                <h2 className="text-sm font-bold text-[#694A2D]">
                  Your privacy matters
                </h2>
              </div>

              <p className="mt-3 text-xs leading-6 text-[#876B4D]">
                Only public posts are displayed to visitors. Private and
                followers-only content remains protected.
              </p>
            </section>
          </aside>
        </main>
      </div>
    );
  }


  const {
    view,
    profile: memberUsernameParam,
    q,
  } = await searchParams;
  const searchQuery = q?.trim() ?? "";
 const isMembersView = view === "members";
  const isVideosView = view === "videos";
  const isCommunityVideosView = view === "community-videos";
  const selectedUsername = isMembersView
    ? memberUsernameParam?.trim()
    : undefined;

  // Backfill a social profile for the signed-in active account if needed.
  await ensureSocialProfileForUser(session.user.id);

  const profile = await prisma.socialProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      username: true,
      displayName: true,
      isPrivate: true,
      bio: true,
      status: true,
      ageBand: true,
      ageAssuranceStatus: true,
      user: {
        select: {
          imageUrl: true,
          status: true,
        },
      },
    },
  });

  if (!profile || profile.user.status !== "Active") {
    redirect("/dashboard");
  }

  if (profile.status !== "ACTIVE") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F8F5] px-5">
        <div className="w-full max-w-md rounded-lg border border-[#E5EAE3] bg-white p-9 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF1EB] text-[#315B43]">
            <LockKeyhole className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-xl font-bold text-[#173B2F]">
            Social profile unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#718075]">
            Your social profile is currently restricted. Your main Justdy
            account remains separate.
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#173B2F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24513F]"
          >
            Return to dashboard
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  const initials = getInitials(profile.displayName);

  // ============================================================
  // SELECTED MEMBER PROFILE
  // ============================================================

  const selectedMemberProfile =
    isMembersView && selectedUsername
      ? await prisma.socialProfile.findUnique({
          where: { username: selectedUsername },
          select: {
            id: true,
            userId: true,
            username: true,
            displayName: true,
            bio: true,
            isPrivate: true,
            status: true,
            ageBand: true,
            ageAssuranceStatus: true,
            createdAt: true,
            user: {
              select: {
                imageUrl: true,
                status: true,
                role: true,
                name: true,
              },
            },
          },
        })
      : null;

  const isSelectedProfileOwner =
    selectedMemberProfile?.userId === session.user.id;

  // Preserve the existing profile page's account and age-verification rules.
  const canViewSelectedMemberProfile = Boolean(
    selectedMemberProfile &&
      selectedMemberProfile.status === "ACTIVE" &&
      selectedMemberProfile.user.status === "Active" &&
      (isSelectedProfileOwner ||
        (profile.ageBand === "ADULT" &&
          profile.ageAssuranceStatus === "VERIFIED" &&
          selectedMemberProfile.ageBand === "ADULT" &&
          selectedMemberProfile.ageAssuranceStatus === "VERIFIED")),
  );

  const canSeeSelectedProfileDetails = Boolean(
    isSelectedProfileOwner || !selectedMemberProfile?.isPrivate,
  );

  // ============================================================
  // MEMBERS DIRECTORY
  // ============================================================

  const members = isMembersView
    ? await prisma.user.findMany({
        where: {
          status: "Active",
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          role: true,
          socialProfile: {
            select: {
              username: true,
              displayName: true,
              bio: true,
            },
          },
          _count: {
            select: {
              socialFollowsReceived: {
                where: { status: "ACCEPTED" },
              },
            },
          },
          socialPosts: {
            where: { status: "PUBLISHED" },
            select: {
              _count: {
                select: {
                  reactions: {
                    where: { type: "LIKE" },
                  },
                },
              },
            },
          },
        },
      })
    : [];

  // ============================================================
  // COMMUNITY FEED
  // ============================================================

  const posts =
    isMembersView || isVideosView || isCommunityVideosView
      ? []
      : await prisma.socialPost.findMany({
          where: {
            ...visibleSocialPostWhere(session.user.id),
            ...(searchQuery
              ? {
                  AND: [
                    {
                      OR: [
                        {
                          content: {
                            contains: searchQuery,
                            mode: "insensitive" as const,
                          },
                        },
                        {
                          author: {
                            is: {
                              socialProfile: {
                                is: {
                                  displayName: {
                                    contains: searchQuery,
                                    mode: "insensitive" as const,
                                  },
                                },
                              },
                            },
                          },
                        },
                        {
                          author: {
                            is: {
                              socialProfile: {
                                is: {
                                  username: {
                                    contains: searchQuery,
                                    mode: "insensitive" as const,
                                  },
                                },
                              },
                            },
                          },
                        },
                      ],
                    },
                  ],
                }
              : {}),
          },
          orderBy: {
            publishedAt: "desc",
          },
          take: 30,
          select: {
            id: true,
            authorId: true,
            content: true,
            visibility: true,
            layout: true,
            publishedAt: true,
            createdAt: true,

            author: {
              select: {
                socialProfile: {
                  select: {
                    displayName: true,
                    username: true,
                  },
                },
                imageUrl: true,
              },
            },

            reactions: {
              orderBy: {
                createdAt: "desc",
              },
              select: {
                userId: true,
                type: true,
                user: {
                  select: {
                    imageUrl: true,
                    socialProfile: {
                      select: {
                        displayName: true,
                        username: true,
                      },
                    },
                  },
                },
              },
            },

            commentsEnabled: true,

            _count: {
              select: {
                comments: {
                  where: {
                    status: "VISIBLE",
                  },
                },
              },
            },

            comments: {
              where: {
                status: "VISIBLE",
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 20,
              select: {
                id: true,
                authorId: true,
                content: true,
                createdAt: true,
                author: {
                  select: {
                    socialProfile: {
                      select: {
                        displayName: true,
                        username: true,
                      },
                    },
                  },
                },
              },
            },

            media: {
              orderBy: {
                position: "asc",
              },
              select: {
                id: true,
                media: {
                  select: {
                    id: true,
                    url: true,
                    fileName: true,
                    mimeType: true,
                  },
                },
              },
            },
          },
        });


  // ============================================================
// COMMUNITY VIDEOS
// ============================================================

const communityVideoPosts = isCommunityVideosView
  ? await prisma.socialPost.findMany({
     where: {
        ...visibleSocialPostWhere(session.user.id),

        AND: [
          {
            OR: [
              {
                media: {
                  some: {
                    media: {
                      is: {
                        type: "VIDEO",
                        purpose: "SOCIAL_POST",
                        status: "ATTACHED",
                      },
                    },
                  },
                },
              },
              { content: { contains: "youtube.com" } },
              { content: { contains: "youtu.be" } },
              { content: { contains: "tiktok.com" } },
              { content: { contains: "facebook.com" } },
              { content: { contains: "fb.watch" } },
            ],
          },
        ],
      },

      orderBy: {
        publishedAt: "desc",
      },

      take: 50,

      select: {
        id: true,
        authorId: true,
        content: true,
        visibility: true,
        publishedAt: true,
        createdAt: true,

        author: {
          select: {
            socialProfile: {
              select: {
                displayName: true,
                username: true,
              },
            },
            imageUrl: true,
          },
        },

        reactions: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            userId: true,
            type: true,
            user: {
              select: {
                imageUrl: true,
                socialProfile: {
                  select: {
                    displayName: true,
                    username: true,
                  },
                },
              },
            },
          },
        },

        commentsEnabled: true,

        _count: {
          select: {
            comments: {
              where: {
                status: "VISIBLE",
              },
            },
          },
        },

        comments: {
          where: {
            status: "VISIBLE",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
          select: {
            id: true,
            authorId: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                socialProfile: {
                  select: {
                    displayName: true,
                    username: true,
                  },
                },
              },
            },
          },
        },

        media: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            media: {
              select: {
                id: true,
                url: true,
                fileName: true,
                mimeType: true,
                type: true,
                purpose: true,
                status: true,
              },
            },
          },
        },
      },
    })
  : [];

  // Fetch YouTube videos only when the Videos view is requested.
  const [mathVideos, techVideos] = isVideosView
    ? await Promise.all([
        getYoutubeVideos("math"),
        getYoutubeVideos("tech"),
      ])
    : [[], []];

  return (
    <div className="min-h-screen bg-[#F6F8F5] text-[#173B2F]">
      {/* Full-width header */}
      <SocialNavigation
        username={profile.username}
        displayName={profile.displayName}
        imageUrl={profile.user.imageUrl}
      />

      {/* Page content */}
      <main
        className={
          isCommunityVideosView
            ? "w-full px-0 pb-0 pt-0"
            : "mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-6 px-4 pb-28 pt-23 sm:px-6 sm:pb-10 sm:pt-23 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-7 lg:px-8"
        }
      >
        {/* Main feed, Members directory and Videos */}
        <section className="min-w-0">
          {isCommunityVideosView ? (
            <CommunityVideosViewer
              posts={communityVideoPosts}
              currentUserId={session.user.id}
              currentDisplayName={profile.displayName}
              currentUsername={profile.username}
              currentImageUrl={profile.user?.imageUrl ?? null}
            />
          ) : isVideosView ? (
            <SocialVideosFeed
              mathVideos={mathVideos}
              techVideos={techVideos}
            />
          ) : isMembersView ? (
            selectedUsername ? (
              <div>
                <Link
                  href="/home?view=members"
                  className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#DCE7DC] bg-white px-4 py-2.5 text-xs font-semibold text-[#315B43] shadow-sm transition hover:border-[#315B43] hover:bg-[#F7F9F6]"
                >
                  <span aria-hidden="true">←</span>
                  Back to members
                </Link>

                {selectedMemberProfile && canViewSelectedMemberProfile ? (
                  <article className="overflow-hidden rounded-2xl border border-[#E5EAE3] bg-white shadow-[0_3px_14px_rgba(23,59,47,0.045)]">
                    <div className="h-28 bg-gradient-to-r from-[#173B2F] via-[#315B43] to-[#789477] sm:h-36" />

                    <div className="px-5 pb-6 sm:px-7">
                      <div className="-mt-12 flex flex-wrap items-end justify-between gap-3">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#EAF1EB] text-2xl font-bold text-[#315B43] shadow-sm">
                          {canSeeSelectedProfileDetails &&
                          selectedMemberProfile.user.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={selectedMemberProfile.user.imageUrl}
                              alt={selectedMemberProfile.displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(selectedMemberProfile.displayName)
                          )}
                        </div>

                        {isSelectedProfileOwner && (
                          <Link
                            href={`/profile/${selectedMemberProfile.username}/edit`}
                            className="mb-1 inline-flex items-center gap-2 rounded-xl bg-[#173B2F] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#24513F]"
                          >
                            Edit profile
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-bold tracking-tight text-[#173B2F] sm:text-2xl">
                            {selectedMemberProfile.displayName}
                          </h2>

                          {isSelectedProfileOwner && (
                            <span className="rounded-full bg-[#EAF1EB] px-2.5 py-1 text-[10px] font-semibold text-[#315B43]">
                              You
                            </span>
                          )}

                          {selectedMemberProfile.isPrivate &&
                            !isSelectedProfileOwner && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F1E9] px-2.5 py-1 text-[10px] font-semibold text-[#876B4D]">
                                <LockKeyhole className="h-3 w-3" />
                                Private profile
                              </span>
                            )}
                        </div>

                        <p className="mt-1 text-sm text-[#929D93]">
                          @{selectedMemberProfile.username}
                        </p>

                        <span className="mt-3 inline-flex rounded-full bg-[#EAF1EB] px-3 py-1.5 text-[11px] font-semibold text-[#315B43]">
                          {selectedMemberProfile.user.role === "ADMIN"
                            ? "Administrator"
                            : selectedMemberProfile.user.role === "TUTOR"
                              ? "Tutor"
                              : selectedMemberProfile.user.role === "LEARNER"
                                ? "Learner"
                                : "Member"}
                        </span>

                        {canSeeSelectedProfileDetails &&
                        selectedMemberProfile.bio?.trim() ? (
                          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#64746A]">
                            {selectedMemberProfile.bio}
                          </p>
                        ) : selectedMemberProfile.isPrivate &&
                          !isSelectedProfileOwner ? (
                          <p className="mt-5 rounded-xl bg-[#F8FAF7] p-4 text-sm leading-6 text-[#87938A]">
                            This member keeps their profile details private.
                          </p>
                        ) : (
                          <p className="mt-5 text-sm text-[#929D93]">
                            No bio has been added yet.
                          </p>
                        )}

                        <div className="mt-6 border-t border-[#EEF1EC] pt-4 text-xs text-[#929D93]">
                          Member since{" "}
                          {dateFormatter.format(selectedMemberProfile.createdAt)}
                        </div>
                      </div>
                    </div>
                  </article>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#D5E0D5] bg-white px-6 py-16 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF1EB] text-[#315B43]">
                      <LockKeyhole className="h-7 w-7" />
                    </div>

                    <h2 className="mt-5 text-lg font-bold text-[#173B2F]">
                      Profile unavailable
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#87938A]">
                      This profile may be unavailable, restricted, or not accessible
                      under the community&apos;s privacy and verification settings.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Members heading */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[22px] font-bold tracking-tight text-[#173B2F] sm:text-2xl">
                      Justdy members
                    </h2>

                    <p className="mt-1 text-xs text-[#87938A] sm:text-sm">
                      Discover learners, tutors and everyone growing with Justdy.
                    </p>
                  </div>

                  <span className="rounded-full border border-[#E2E9E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#52665A] shadow-sm">
                    {members.length} {members.length === 1 ? "member" : "members"}
                  </span>
                </div>

                {/* Members grid */}
                {members.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#D5E0D5] bg-white px-6 py-16 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF1EB] text-[#315B43]">
                      <Users className="h-7 w-7" />
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-[#173B2F]">
                      No members found
                    </h3>

                    <p className="mt-2 text-sm text-[#87938A]">
                      There are no active member accounts to display yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {members.map((member) => {
                      const memberName =
                        member.socialProfile?.displayName?.trim() ||
                        member.name?.trim() ||
                        "Justdy member";

                      const memberInitials = getInitials(memberName);

                      const roleLabel =
                        member.role === "ADMIN"
                          ? "Administrator"
                          : member.role === "TUTOR"
                            ? "Tutor"
                            : member.role === "LEARNER"
                              ? "Learner"
                              : "Member";

                      const followersCount = member._count.socialFollowsReceived;
                      const likesCount = member.socialPosts.reduce(
                        (total, post) => total + post._count.reactions,
                        0,
                      );

                      const cardClassName =
                        "group relative isolate flex min-h-[300px] w-full flex-col justify-end overflow-hidden rounded-xl border border-[#E5EAE3] bg-[#E9EFEB] text-left shadow-[0_5px_20px_rgba(23,59,47,0.07)] transition duration-300 hover:-translate-y-1 hover:border-[#D5E1D5] hover:shadow-[0_14px_32px_rgba(23,59,47,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52745D] focus-visible:ring-offset-2";

                      const cardContent = (
                        <>
                          {member.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.imageUrl}
                              alt=""
                              loading="lazy"
                              className="absolute inset-0 -z-20 h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.035]"
                            />
                          ) : (
                            <div className="absolute inset-0 -z-20 flex items-center justify-center bg-gradient-to-br from-[#DCE8DF] via-[#EAF1EB] to-[#C9D8CC]">
                              <span className="text-7xl font-semibold tracking-tight text-[#52745D]/50">
                                {memberInitials}
                              </span>
                            </div>
                          )}

                          <div
                            aria-hidden="true"
                            className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_24%,rgba(255,255,255,0.06)_38%,rgba(255,255,255,0.72)_59%,rgba(255,255,255,0.96)_72%,#ffffff_84%)]"
                          />

                          <div className="relative z-10 px-4 pb-4 pt-32 sm:px-4 sm:pb-4">
                            <div className="min-h-10">
                              <h3 className="line-clamp-1 text-[19px] font-bold leading-tight tracking-[-0.035em] text-[#17231C] transition group-hover:text-[#315B43]">
                                {memberName}
                              </h3>
                              <p className="mt-1 mb-2 truncate text-[12px] leading-[1.65] text-[#46564B]">
                                {member.socialProfile?.bio?.trim() ||
                                  "A member of the Justdy learning community."}
                              </p>
                            </div>

                            <div className="mt-0 flex items-center gap-4 border-t border-[#E8ECE8] pt-2 text-[#46534A]">
                              <span className="inline-flex items-center gap-2 text-[13px] font-semibold tabular-nums">
                                <Users className="h-[17px] w-[17px] text-[#89948C]" />
                                {followersCount.toLocaleString()}
                                <span className="text-[11px] font-medium text-[#87938A]">
                                  followers
                                </span>
                              </span>

                              <span className="inline-flex items-center gap-2 text-[13px] font-semibold tabular-nums">
                                <Heart className="h-[17px] w-[17px] text-[#A66A65]" />
                                {likesCount.toLocaleString()}
                                <span className="text-[11px] font-medium text-[#87938A]">
                                  likes
                                </span>
                              </span>
                            </div>
                          </div>
                        </>
                      );

                      return member.socialProfile?.username ? (
                        <Link
                          key={member.id}
                          href={`/home?view=members&profile=${encodeURIComponent(member.socialProfile.username)}`}
                          aria-label={`View ${memberName}'s profile`}
                          className={cardClassName}
                        >
                          {cardContent}
                        </Link>
                      ) : (
                        <article key={member.id} className={cardClassName}>
                          {cardContent}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          ) : (
            <>
              
              {/* Empty feed */}
              {posts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#D5E0D5] bg-white px-6 py-16 text-center shadow-sm sm:px-10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-[#EAF1EB] text-[#315B43]">
                    <WandSparkles className="h-7 w-7" />
                  </div>

                  <h2 className="mt-5 text-xl font-bold tracking-tight">
                    {searchQuery ? "No matching posts found" : "Your community story starts here"}
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#87938A]">
                    {searchQuery
                      ? "Try a different search term or clear your search to see all community posts."
                      : "There are no posts to show yet. Share a useful idea, a learning milestone, or a question to get the conversation started."}
                  </p>

                 <SocialPostComposerTrigger
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#312c65] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403981] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#312c65] focus-visible:ring-offset-2"
                  >
                    Create your first post
                    <ArrowUpRight className="h-4 w-4" />
                  </SocialPostComposerTrigger>
                </div>
              ) : (
                <div className="space-y-5">
                  {posts.map((post) => {
                    const authorName =
                      post.author.socialProfile?.displayName ?? "Justdy member";

                    const authorUsername =
                      post.author.socialProfile?.username ?? "member";

                    const authorInitials = getInitials(authorName);
                    const postDate = post.publishedAt ?? post.createdAt;
                    const isOwner = post.authorId === session.user.id;

                    // Extract URLs from both plain text and TipTap content.
                    const postUrls = extractSocialPostUrls(post.content);

                    // In the feed, inline images and regular attachments are
                    // combined into one compact gallery. SocialPostContent hides
                    // its inline image nodes in preview mode to avoid duplicates.
                    const galleryMedia = post.media;



                    return (
                      <article
                        key={post.id}
                        className="relative z-0 overflow-visible rounded-lg border border-[#E5EAE3] bg-white shadow-[0_3px_14px_rgba(23,59,47,0.045)] transition duration-200 hover:z-20 hover:border-[#D5E1D5] hover:shadow-[0_8px_24px_rgba(23,59,47,0.075)]"
                      >
                        <div className="p-5 sm:p-6">
                          {/* Author and post metadata */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-3">
                              <Link
                                href={`/profile/${authorUsername}`}
                                className="group flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF1EB] ring-2 ring-white shadow-[0_0_0_1px_#DCE8DC] transition duration-200 hover:scale-[1.04]"
                              >
                                {post.author.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={post.author.imageUrl}
                                    alt={authorName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-base font-bold text-[#315B43]">
                                    {authorInitials}
                                  </span>
                                )}
                              </Link>

                              <div className="min-w-0 flex flex-col gap-0">
                                <Link
                                  href={`/profile/${authorUsername}`}
                                  className="block truncate text-[15px] font-bold leading-tight tracking-[-0.01em] text-[#173B2F] transition hover:text-[#52745D]"
                                >
                                  {authorName}
                                </Link>

                                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium leading-tight text-[#929D93]">
                                  <span title={dateFormatter.format(postDate)}>
                                    {formatPostDate(postDate)}
                                  </span>
                                  {post.visibility === "PUBLIC" && (
                                    <Globe
                                      className="h-3.5 w-3.5 shrink-0"
                                      aria-label="Public"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              {post.visibility !== "PUBLIC" && (
                                <VisibilityBadge visibility={post.visibility} />
                              )}

                              {isOwner && (
                                <div className="flex items-center gap-1">
                                 <SocialPostEditor
                                    postId={post.id}
                                    initialContent={post.content ?? ""}
                                    initialVisibility={post.visibility}
                                    initialLayout={post.layout ?? "TEXT_TOP"}
                                    initialMedia={post.media}
                                    authorName={authorName}
                                    authorImage={post.author.imageUrl}
                                  />
                                  <SocialPostDeleteButton postId={post.id} />
                                </div>
                              )}
                            </div>
                          </div>

            <div className={`post-layout-grid mt-5 grid min-w-0 grid-cols-1 gap-5 ${post.layout === "IMAGE_LEFT" || post.layout === "TEXT_LEFT" ? "md:grid-cols-2 md:items-center" : ""} ${post.layout === "IMAGE_LEFT" ? "[&_.post-layout-media]:md:order-1 [&_.post-layout-text]:md:order-2" : ""} ${post.layout === "TEXT_LEFT" ? "[&_.post-layout-text]:md:order-1 [&_.post-layout-media]:md:order-2" : ""} ${post.layout === "IMAGE_TOP" ? "[&_.post-layout-media]:order-1 [&_.post-layout-text]:order-2" : ""} ${post.layout === "TEXT_TOP" || !post.layout ? "[&_.post-layout-text]:order-1 [&_.post-layout-media]:order-2" : ""}`}>
                          {/* Post text */}
            <div className="post-layout-text min-w-0">
                          {post.content && (
                            <SocialPostContent
                              content={post.content}
                              preview
                              hideInlineImages
                              className="mt-5"
                            />
                          )}

                          {/* Website link previews */}
                          {postUrls.length > 0 && (
                            <SocialLinkPreview urls={postUrls} />
                          )}
            </div>

                          {/* Post media: compact image collage, sized by attachment count */}
            <div className="post-layout-media min-w-0">
                          {galleryMedia.length > 0 && (
                            <SocialPostImageGallery
                              media={galleryMedia}
                              authorName={authorName}
                              authorImageUrl={post.author.imageUrl}
                              publishedLabel={formatPostDate(postDate)}
                              postContent={post.content ?? ""}
                              postId={post.id}
                              initialComments={post.comments}
                              initialCommentCount={post._count.comments}
                              commentsEnabled={post.commentsEnabled}
                              currentDisplayName={profile.displayName}
                              currentUsername={profile.username}
                              currentUserId={session.user.id}
                            />
                          )}
            </div>
            </div>

                          {/* Post interactions */}
                          <div className="mt-5 border-t border-[#E9EEE8] pt-4">
                            <SocialPostActions
                              postId={post.id}
                              currentUserId={session.user.id}
                              currentUserLiker={{
                                userId: session.user.id,
                                imageUrl: profile.user?.imageUrl ?? null,
                                displayName: profile.displayName || "You",
                                username: profile.username ?? null,
                              }}
                              initialReactionCounts={{
                                LIKE: post.reactions.filter(
                                  (r) => r.type === "LIKE",
                                ).length,
                                HELPFUL: post.reactions.filter(
                                  (r) => r.type === "HELPFUL",
                                ).length,
                                INSIGHTFUL: post.reactions.filter(
                                  (r) => r.type === "INSIGHTFUL",
                                ).length,
                                CELEBRATE: post.reactions.filter(
                                  (r) => r.type === "CELEBRATE",
                                ).length,
                                CURIOUS: post.reactions.filter(
                                  (r) => r.type === "CURIOUS",
                                ).length,
                              }}
                              initialReaction={(() => {
                                const current = post.reactions.find(
                                  (r) => r.userId === session.user.id,
                                )?.type;

                                return current === "LIKE" ||
                                  current === "HELPFUL" ||
                                  current === "INSIGHTFUL" ||
                                  current === "CELEBRATE" ||
                                  current === "CURIOUS"
                                  ? current
                                  : null;
                              })()}
                              initialCommentCount={post._count.comments}
                              initialLikers={post.reactions
                                .filter((r) => r.type === "LIKE")
                                .map((r) => ({
                                  userId: r.userId,
                                  imageUrl: r.user.imageUrl,
                                  displayName:
                                    r.user.socialProfile?.displayName ||
                                    "Justdy learner",
                                  username:
                                    r.user.socialProfile?.username ?? null,
                                }))}
                            />

                            <SocialPostComments
                              postId={post.id}
                              initialComments={post.comments}
                              initialCommentCount={post._count.comments}
                              commentsEnabled={post.commentsEnabled}
                              currentDisplayName={profile.displayName}
                              currentUsername={profile.username}
                              currentUserId={session.user.id}
                            />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        {/* Right information panel */}
        {!isCommunityVideosView && (
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* Community information */}
          <CommunityInfoCard isLoggedIn={true} />

          {/* Privacy note */}
          <section className="rounded-lg border border-[#E9DFC9] bg-[#FBF5EA] p-5 shadow-[0_3px_14px_rgba(23,59,47,0.025)]">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-[#9A642F]" />
              <h2 className="text-sm font-bold text-[#694A2D]">
                Your privacy matters
              </h2>
            </div>

            <p className="mt-3 text-xs leading-6 text-[#876B4D]">
              You control who can see each post. Public posts can be viewed by
              eligible community members, Followers posts are limited to
              accepted followers, and Only me posts stay private.
            </p>
          </section>
        </aside>
        )}
      </main>
    </div>
  );
}

