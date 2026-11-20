import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { visibleSocialPostWhere } from "@/lib/social/access";
import { ensureSocialProfileForUser } from "@/lib/social/ensure-profile";
import CommunityVideosDiscovery from "@/app/_components/social/videos/CommunityVideosDiscovery";

export const metadata = {
  title: "Discover Community Videos | Justdy",
  description: "Search and explore learning videos shared by the Justdy community.",
};

export default async function CommunityVideosDiscoverPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fcommunity-videos%2Fdiscover");
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

  if (!profile || profile.user.status !== "Active" || profile.status !== "ACTIVE") {
    redirect("/dashboard");
  }

  const posts = await prisma.socialPost.findMany({
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
            { content: { contains: "youtube.com", mode: "insensitive" } },
            { content: { contains: "youtu.be", mode: "insensitive" } },
            { content: { contains: "tiktok.com", mode: "insensitive" } },
            { content: { contains: "facebook.com", mode: "insensitive" } },
            { content: { contains: "fb.watch", mode: "insensitive" } },
          ],
        },
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: 100,
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
  });

  const bookmarkedPosts = await prisma.socialBookmark.findMany({
    where: {
      userId: session.user.id,
      postId: { in: posts.map((post) => post.id) },
    },
    select: { postId: true },
  });

  return (
    <CommunityVideosDiscovery
      posts={posts}
      currentUserId={session.user.id}
      currentDisplayName={profile.displayName}
      currentUsername={profile.username}
      currentImageUrl={profile.user.imageUrl ?? null}
      initialBookmarkedPostIds={bookmarkedPosts.map((bookmark) => bookmark.postId)}
    />
  );
}
