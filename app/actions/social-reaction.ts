"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { visibleSocialPostWhere } from "@/lib/social/access";

const SOCIAL_REACTION_TYPES = [
  "LIKE",
  "HELPFUL",
  "INSIGHTFUL",
  "CELEBRATE",
  "CURIOUS",
] as const;

export type SocialReactionType =
  (typeof SOCIAL_REACTION_TYPES)[number];

function isSocialReactionType(
  value: unknown,
): value is SocialReactionType {
  return (
    typeof value === "string" &&
    SOCIAL_REACTION_TYPES.includes(value as SocialReactionType)
  );
}

export async function toggleSocialPostReaction(
  postId: string,
  type: SocialReactionType,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Please sign in to react to posts.",
    };
  }

  if (
    typeof postId !== "string" ||
    postId.length < 1 ||
    postId.length > 100 ||
    !isSocialReactionType(type)
  ) {
    return {
      success: false as const,
      error: "Invalid reaction.",
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
          error: "Your account cannot react to posts.",
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

      const existingReaction = await tx.socialReaction.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId: user.id,
          },
        },
        select: {
          id: true,
          type: true,
        },
      });

      // Selecting the current reaction removes it.
      if (existingReaction?.type === type) {
        await tx.socialReaction.delete({
          where: { id: existingReaction.id },
        });

        return {
          success: true as const,
          reaction: null,
        };
      }

      // Change an existing reaction instead of creating another.
      if (existingReaction) {
        await tx.socialReaction.update({
          where: { id: existingReaction.id },
          data: { type },
        });

        return {
          success: true as const,
          reaction: type,
        };
      }

      await tx.socialReaction.create({
        data: {
          postId: post.id,
          userId: user.id,
          type,
        },
      });

      return {
        success: true as const,
        reaction: type,
      };
    });

    if (result.success) {
      revalidatePath("/home");
      revalidatePath(`/post/${postId}`);
    }

    return result;
  } catch (error) {
    console.error("Toggle social post reaction error:", error);

    return {
      success: false as const,
      error: "Unable to update your reaction. Please try again.",
    };
  }
}