
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createSocialCommentSchema } from "@/lib/social/validation";
import { visibleSocialPostWhere } from "@/lib/social/access";

export async function createSocialComment(input: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Please sign in to comment.",
    };
  }

  const parsed = createSocialCommentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error:
        parsed.error.issues[0]?.message ?? "Please check your comment.",
    };
  }

  const { postId, content } = parsed.data;

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
          error: "Your account cannot comment.",
        };
      }

      const post = await tx.socialPost.findFirst({
        where: {
          id: postId,
          commentsEnabled: true,
          ...visibleSocialPostWhere(user.id),
        },
        select: { id: true },
      });

      if (!post) {
        return {
          success: false as const,
          error: "This post is unavailable for commenting.",
        };
      }

      const comment = await tx.socialComment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content,
          status: "VISIBLE",
        },
        select: {
          id: true,
          authorId: true,
          content: true,
          createdAt: true,
        },
      });

      return {
        success: true as const,
        comment,
      };
    });

    if (result.success) {
      revalidatePath("/home");
    }

    return result;
  } catch (error) {
    console.error("Create social comment error:", error);

    return {
      success: false as const,
      error: "Unable to publish your comment. Please try again.",
    };
  }
}

export async function deleteSocialComment(commentId: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Please sign in to delete a comment.",
    };
  }

  if (
    typeof commentId !== "string" ||
    commentId.length < 1 ||
    commentId.length > 100
  ) {
    return {
      success: false as const,
      error: "Invalid comment.",
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
          error: "Your account cannot delete comments.",
        };
      }

      const comment = await tx.socialComment.findFirst({
        where: {
          id: commentId,
          status: "VISIBLE",
          post: {
            is: visibleSocialPostWhere(user.id),
          },
        },
        select: {
          id: true,
          authorId: true,
          post: {
            select: {
              authorId: true,
            },
          },
        },
      });

      if (
        !comment ||
        (comment.authorId !== user.id &&
          comment.post.authorId !== user.id)
      ) {
        return {
          success: false as const,
          error: "Comment not found or you cannot delete it.",
        };
      }

      await tx.socialComment.delete({
        where: { id: comment.id },
      });

      return {
        success: true as const,
      };
    });

    if (result.success) {
      revalidatePath("/home");
    }

    return result;
  } catch (error) {
    console.error("Delete social comment error:", error);

    return {
      success: false as const,
      error: "Unable to delete your comment. Please try again.",
    };
  }
}
