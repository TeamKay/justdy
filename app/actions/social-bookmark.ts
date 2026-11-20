"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { visibleSocialPostWhere } from "@/lib/social/access";

/**
 * Sets the signed-in user's bookmark state for a visible social post.
 * This is intentionally idempotent: repeated save/remove requests produce
 * the same result instead of accidentally toggling the state twice.
 */
export async function setSocialPostBookmark(
  postId: string,
  bookmarked: boolean,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Please sign in to save posts.",
    };
  }

  if (
    typeof postId !== "string" ||
    postId.trim().length < 1 ||
    postId.length > 100 ||
    typeof bookmarked !== "boolean"
  ) {
    return {
      success: false as const,
      error: "Invalid bookmark request.",
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          status: true,
          socialProfile: {
            select: { status: true },
          },
        },
      });

      if (
        !user ||
        user.status !== "Active" ||
        user.socialProfile?.status !== "ACTIVE"
      ) {
        return {
          success: false as const,
          error: "Your account cannot save posts.",
        };
      }

      const post = await tx.socialPost.findFirst({
        where: {
          id: postId,
          ...visibleSocialPostWhere(user.id),
        },
        select: { id: true },
      });

      if (!post) {
        return {
          success: false as const,
          error: "Post not found or unavailable.",
        };
      }

      if (bookmarked) {
        await tx.socialBookmark.upsert({
          where: {
            postId_userId: {
              postId: post.id,
              userId: user.id,
            },
          },
          create: {
            postId: post.id,
            userId: user.id,
          },
          update: {},
        });
      } else {
        await tx.socialBookmark.deleteMany({
          where: {
            postId: post.id,
            userId: user.id,
          },
        });
      }

      return {
        success: true as const,
        bookmarked,
      };
    });

    if (result.success) {
      revalidatePath("/home");
      revalidatePath("/home?view=community-videos");
      revalidatePath("/home?view=saved");
      revalidatePath("/saved-videos");
      revalidatePath(`/post/${postId}`);
    }

    return result;
  } catch (error) {
    console.error("Set social post bookmark error:", error);

    return {
      success: false as const,
      error: "Unable to update your saved videos. Please try again.",
    };
  }
}
