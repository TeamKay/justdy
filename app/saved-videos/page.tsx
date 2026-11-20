import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft, Bookmark, Video } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { visibleSocialPostWhere } from "@/lib/social/access";
import { ensureSocialProfileForUser } from "@/lib/social/ensure-profile";
import CommunityVideosViewer from "@/app/_components/social/videos/CommunityVideosViewer";

export const metadata = {
  title: "Saved Videos | Justdy",
  description: "Videos you have saved in your Justdy learning community.",
};

export default async function SavedVideosPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fsaved-videos");
  }

  await ensureSocialProfileForUser(session.user.id);

  const profile = await prisma.socialProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      username: true,
      displayName: true,
      status: true,
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
        <section className="w-full max-w-md rounded-2xl border border-[#E5EAE3] bg-white p-8 text-center shadow-sm">
          <Bookmark className="mx-auto h-10 w-10 text-[#87938A]" />
          <h1 className="mt-4 text-xl font-bold text-[#173B2F]">
            Saved videos unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#718075]">
            Your social profile is currently restricted. Your main Justdy
            account remains separate.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-xl bg-[#173B2F] px-5 py-3 text-sm font-semibold text-white"
          >
            Return to dashboard
          </Link>
        </section>
      </main>
    );
  }

  const savedVideoBookmarks = await prisma.socialBookmark.findMany({
    where: {
      userId: session.user.id,
      post: {
        is: {
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
                { content: { contains: "youtube.com", mode: "insensitive" } },
                { content: { contains: "youtu.be", mode: "insensitive" } },
                { content: { contains: "tiktok.com", mode: "insensitive" } },
                { content: { contains: "facebook.com", mode: "insensitive" } },
                { content: { contains: "fb.watch", mode: "insensitive" } },
              ],
            },
          ],
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      post: {
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
            orderBy: { createdAt: "desc" },
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
                where: { status: "VISIBLE" },
              },
            },
          },
          comments: {
            where: { status: "VISIBLE" },
            orderBy: { createdAt: "desc" },
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
            orderBy: { position: "asc" },
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
      },
    },
  });

  const savedPosts = savedVideoBookmarks.map((bookmark) => bookmark.post);
  const savedPostIds = savedPosts.map((post) => post.id);

  if (savedPosts.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B100D] px-5 py-12 text-white">
        <section className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <Bookmark className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">No saved videos yet</h1>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Save videos while watching Community Videos and they will appear
            here for you to revisit.
          </p>
          <Link
            href="/home?view=community-videos"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F58750] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E8753E]"
          >
            <Video className="h-4 w-4" />
            Explore Community Videos
          </Link>
          <Link
            href="/home"
            className="mt-4 flex items-center justify-center gap-2 text-sm text-white/65 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Community
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B100D]">
      <CommunityVideosViewer
        posts={savedPosts}
        currentUserId={session.user.id}
        currentDisplayName={profile.displayName}
        currentUsername={profile.username}
        currentImageUrl={profile.user.imageUrl ?? null}
        initialBookmarkedPostIds={savedPostIds}
      />
    </main>
  );
}
