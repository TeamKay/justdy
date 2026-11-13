
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  LockKeyhole,
  UserRound,
  CalendarDays,
  Pencil,
  GraduationCap,
  BadgeCheck,
  BookOpen,
  Clock3,
} from "lucide-react";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { visibleSocialPostWhere } from "@/lib/social/access";

import SocialNavigation from "../../../_components/social/shared/SocialNavigation";
import SocialFollowButton from "../../../_components/social/members/SocialFollowButton";

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

function getStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function formatCurrency(amountInCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amountInCents / 100);
  } catch {
    return `${currency} ${(amountInCents / 100).toFixed(2)}`;
  }
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

function formatPostVisibility(visibility: string) {
  switch (visibility) {
    case "PUBLIC":
      return "Public";
    case "FOLLOWERS":
      return "Followers";
    case "ONLY_ME":
      return "Only me";
    default:
      return "Post";
  }
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params;

  return {
    title: `@${username} | Justdy`,
    description: "Justdy learning profile.",
  };
}

export default async function SocialProfilePage({
  params,
}: ProfilePageProps) {
  const { username } = await params;

  // Authenticate the viewer.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth?mode=signin");
  }

  // Retrieve the requested social profile and educator information.
  const profile = await prisma.socialProfile.findUnique({
    where: {
      username: username.toLowerCase(),
    },
    select: {
      id: true,
      userId: true,
      username: true,
      displayName: true,
      bio: true,
      isPrivate: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          imageUrl: true,
          status: true,
          teachingProfile: {
            select: {
              headline: true,
              specialty: true,
              experience: true,
              description: true,
              verificationStatus: true,
              hourlyRate: true,
              currency: true,
              subjects: true,
              gradeLevels: true,
            },
          },
        },
      },
    },
  });

  if (!profile || profile.status !== "ACTIVE") {
    notFound();
  }

  const isOwner = profile.userId === session.user.id;

  // Validate that both the viewer and target account are active.
  if (!isOwner) {
    const viewer = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        status: true,
        socialProfile: {
          select: {
            status: true,
          },
        },
      },
    });

    if (
      !viewer ||
      viewer.status !== "Active" ||
      !viewer.socialProfile ||
      viewer.socialProfile.status !== "ACTIVE" ||
      profile.user.status !== "Active"
    ) {
      notFound();
    }
  }

  // Prevent profile access when either account has blocked the other.
  const block = !isOwner
    ? await prisma.socialBlock.findFirst({
        where: {
          OR: [
            {
              blockerId: session.user.id,
              blockedId: profile.userId,
            },
            {
              blockerId: profile.userId,
              blockedId: session.user.id,
            },
          ],
        },
        select: {
          id: true,
        },
      })
    : null;

  if (block) {
    notFound();
  }

  // Retrieve the viewer's existing follow relationship.
  const existingFollow = !isOwner
    ? await prisma.socialFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: profile.userId,
          },
        },
        select: {
          status: true,
        },
      })
    : null;

  const isFollowing = existingFollow?.status === "ACCEPTED";

  // Private profile details are visible only to the owner,
  // public-profile visitors, or accepted followers.
  const canViewPrivateDetails =
    isOwner || !profile.isPrivate || isFollowing;

  // Retrieve only posts this viewer is permitted to see.
  // Post visibility is independent of profile privacy.
  const posts = await prisma.socialPost.findMany({
    where: {
      authorId: profile.userId,
      ...visibleSocialPostWhere(session.user.id),
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 30,
    select: {
      id: true,
      content: true,
      visibility: true,
      publishedAt: true,
      createdAt: true,
      reactions: {
        where: {
          type: "LIKE",
        },
        select: {
          userId: true,
        },
      },
      _count: {
        select: {
          comments: {
            where: {
              status: "VISIBLE",
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
              fileName: true,
              mimeType: true,
            },
          },
        },
      },
    },
  });

  const educatorProfile = profile.user.teachingProfile;

  const subjects = getStringList(educatorProfile?.subjects);
  const gradeLevels = getStringList(educatorProfile?.gradeLevels);

  const initial =
    profile.displayName.trim().charAt(0).toUpperCase() || "J";

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#173B2F]">
      <SocialNavigation username={profile.username} />

      <div className="min-h-screen">
        <header className="border-b border-[#E8E9E2] bg-white">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#64746A] transition hover:text-[#173B2F]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-0 sm:px-8 sm:py-12">
          {/* Social profile header */}
          <section className="overflow-hidden rounded-lg border border-[#E8E9E2] bg-white shadow-sm">
            <div className="h-32 bg-linear-to-r from-[#173B2F] via-[#52745D] to-[#DCE9DF] sm:h-44" />

            <div className="px-5 pb-7 sm:px-9 sm:pb-9">
              <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                {/* Shared profile avatar */}
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#EAF1EB] text-3xl font-semibold text-[#173B2F] shadow-sm sm:h-28 sm:w-28">
                  {profile.user.imageUrl && canViewPrivateDetails ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.user.imageUrl}
                      alt={profile.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </div>

                {/* Owner controls or follow button */}
                {isOwner ? (
                  <Link
                    href={`/profile/${profile.username}/edit`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#312c65] px-5 text-sm font-semibold text-white transition hover: bg-[#423d75]"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit profile
                  </Link>
                ) : (
                  <SocialFollowButton
                    username={profile.username}
                    isPrivate={profile.isPrivate}
                    initialStatus={existingFollow?.status ?? null}
                  />
                )}
              </div>

              {/* Social identity */}
              <div className="mt-5">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {profile.displayName}
                </h1>

                <p className="mt-1 text-sm text-[#87938A]">
                  @{profile.username}
                </p>

                {profile.bio && canViewPrivateDetails && (
                  <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-[#52665A]">
                    {profile.bio}
                  </p>
                )}

                {/* Profile metadata */}
                <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[#87938A]">
                  <span className="inline-flex items-center gap-1.5">
                    {profile.isPrivate ? (
                      <>
                        <LockKeyhole className="h-4 w-4" />
                        Private profile
                      </>
                    ) : (
                      <>
                        <UserRound className="h-4 w-4" />
                        Public profile
                      </>
                    )}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    Joined{" "}
                    {profile.createdAt.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Private profile notice */}
                {!canViewPrivateDetails && (
                  <div className="mt-6 rounded-lg bg-[#F6F8F5] px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#173B2F]">
                      <LockKeyhole className="h-4 w-4" />
                      This profile is private
                    </div>

                    <p className="mt-1 text-sm leading-6 text-[#87938A]">
                      Follow this account to see its private profile
                      details and educator information once your
                      request is accepted. Public posts remain visible
                      according to their individual sharing settings.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Educator profile */}
          {educatorProfile && canViewPrivateDetails && (
            <section className="mt-7 overflow-hidden rounded-lg border border-[#E8E9E2] bg-white shadow-sm">
              <div className="border-b border-[#EEF0EA] px-5 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF1EB] text-[#52745D]">
                    <GraduationCap className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">
                      Educator profile
                    </h2>
                    <p className="mt-0.5 text-xs text-[#87938A]">
                      Teaching experience and professional information
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 px-5 py-6 sm:px-7">
                {/* Headline and specialty */}
                <div>
                  {educatorProfile.headline && (
                    <h3 className="text-xl font-semibold tracking-tight">
                      {educatorProfile.headline}
                    </h3>
                  )}

                  {educatorProfile.specialty && (
                    <p className="mt-1 text-sm text-[#64746A]">
                      {educatorProfile.specialty}
                    </p>
                  )}
                </div>

                {/* Educator details */}
                <div className="flex flex-wrap gap-3">
                  {educatorProfile.experience !== null && (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-[#F6F8F5] px-3 py-2 text-sm text-[#52665A]">
                      <Clock3 className="h-4 w-4 text-[#52745D]" />
                      {educatorProfile.experience}{" "}
                      {educatorProfile.experience === 1
                        ? "year"
                        : "years"}{" "}
                      experience
                    </div>
                  )}

                  {educatorProfile.hourlyRate !== null && (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-[#F6F8F5] px-3 py-2 text-sm text-[#52665A]">
                      <span className="font-semibold text-[#52745D]">
                        {formatCurrency(
                          educatorProfile.hourlyRate,
                          educatorProfile.currency,
                        )}
                      </span>
                      per hour
                    </div>
                  )}
                </div>

                {/* Description */}
                {educatorProfile.description && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      About my teaching
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-[#64746A]">
                      {educatorProfile.description}
                    </p>
                  </div>
                )}

                {/* Subjects */}
                {subjects.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <BookOpen className="h-4 w-4 text-[#52745D]" />
                      Subjects
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {subjects.map((subject) => (
                        <span
                          key={subject}
                          className="rounded-full bg-[#EAF1EB] px-3 py-1.5 text-xs font-medium text-[#41634B]"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grade levels */}
                {gradeLevels.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">
                      Grade levels
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {gradeLevels.map((level) => (
                        <span
                          key={level}
                          className="rounded-full border border-[#E8E9E2] px-3 py-1.5 text-xs font-medium text-[#64746A]"
                        >
                          {level}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification status */}
                <div className="border-t border-[#EEF0EA] pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-[#52745D]" />
                    <span className="text-xs font-medium text-[#64746A]">
                      Educator verification:
                    </span>
                    <span className="rounded-full bg-[#F6F8F5] px-2.5 py-1 text-xs font-semibold text-[#52665A]">
                      {formatStatus(
                        String(educatorProfile.verificationStatus),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Social posts */}
          <section className="mt-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Posts
                </h2>
                <p className="mt-1 text-sm text-[#87938A]">
                  Shared thoughts, updates and contributions
                </p>
              </div>

              <span className="rounded-full bg-[#EAF1EB] px-3 py-1.5 text-xs font-semibold text-[#41634B]">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </span>
            </div>

            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D9E1D8] bg-white px-5 py-12 text-center sm:px-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1EB] text-[#52745D]">
                  <UserRound className="h-7 w-7" />
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  No posts yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#87938A]">
                  {isOwner
                    ? "You haven't shared anything yet. Your published posts will appear here."
                    : "There are no posts available to you yet."}
                </p>

                {isOwner && (
                  <Link
                    href="/home"
                    className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#173B2F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24513F]"
                  >
                    Go to community feed
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-2xl border border-[#E8E9E2] bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-[#87938A]">
                          {new Date(
                            post.publishedAt ?? post.createdAt,
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>

                        <span className="rounded-full bg-[#F6F8F5] px-3 py-1 text-xs font-medium text-[#52665A]">
                          {formatPostVisibility(post.visibility)}
                        </span>
                      </div>

                      {post.content && (
                        <Link
                          href={`/post/${post.id}`}
                          className="mt-4 block whitespace-pre-wrap text-sm leading-7 text-[#354D40] transition hover:text-[#173B2F]"
                        >
                          {post.content}
                        </Link>
                      )}

                      {post.media.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2 overflow-hidden rounded-xl">
                          {post.media.map((attachment) => {
                            const media = attachment.media;
                            const isImage =
                              media.mimeType.startsWith("image/");
                            const isVideo =
                              media.mimeType.startsWith("video/");

                            return (
                              <div
                                key={attachment.id}
                                className="relative flex min-h-32 items-center justify-center overflow-hidden rounded-lg bg-[#F1F4F0]"
                              >
                                {isImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={`/api/storage/media/${media.id}`}
                                    alt={media.fileName}
                                    className="h-48 w-full object-cover"
                                  />
                                ) : isVideo ? (
                                  <video
                                    src={`/api/storage/media/${media.id}`}
                                    controls
                                    preload="metadata"
                                    className="max-h-64 w-full object-contain"
                                  />
                                ) : (
                                  <span className="p-4 text-xs text-[#64746A]">
                                    Media attachment
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between border-t border-[#EEF0EA] pt-4">
                        <div className="flex items-center gap-5 text-xs text-[#87938A]">
                          <span>
                            ♥ {post.reactions.length}{" "}
                            {post.reactions.length === 1
                              ? "like"
                              : "likes"}
                          </span>

                          <span>
                            {post._count.comments}{" "}
                            {post._count.comments === 1
                              ? "comment"
                              : "comments"}
                          </span>
                        </div>

                        <Link
                          href={`/post/${post.id}`}
                          className="text-xs font-semibold text-[#52745D] transition hover:text-[#173B2F]"
                        >
                          View post →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
