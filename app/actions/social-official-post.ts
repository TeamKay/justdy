"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSocialPostText } from "@/lib/social/rich-text";
import { notifyUsers } from "@/lib/notifications";

const officialPostSchema = z
  .object({
    postType: z.enum(["WELCOME", "CHALLENGE"]),
    content: z
      .string()
      .trim()
      .min(1, "Write the official post before publishing.")
      .max(100_000, "The post content is too large.")
      .refine(
        (content) => getSocialPostText(content).trim().length > 0,
        "The post must contain readable text.",
      )
      .refine(
        (content) => getSocialPostText(content).length <= 3000,
        "The post cannot exceed 3,000 characters.",
      ),
    opensAt: z.string().datetime({ offset: true }).optional(),
    closesAt: z.string().datetime({ offset: true }).optional(),
    maxScore: z.number().int().min(1).max(10000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.postType !== "CHALLENGE") return;

    if (!data.opensAt) {
      ctx.addIssue({
        code: "custom",
        path: ["opensAt"],
        message: "Choose when the challenge opens.",
      });
    }

    if (!data.closesAt) {
      ctx.addIssue({
        code: "custom",
        path: ["closesAt"],
        message: "Choose when the challenge closes.",
      });
    }

    if (!data.maxScore) {
      ctx.addIssue({
        code: "custom",
        path: ["maxScore"],
        message: "Enter the maximum challenge score.",
      });
    }

    if (
      data.opensAt &&
      data.closesAt &&
      new Date(data.closesAt) <= new Date(data.opensAt)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["closesAt"],
        message: "The closing date must be later than the opening date.",
      });
    }
  });

export async function publishOfficialSocialPost(input: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Please sign in before publishing.",
    };
  }

  const parsed = officialPostSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Please check your post.",
    };
  }

  try {
    const post = await prisma.$transaction(async (tx) => {
      // Verify administrator privileges against the database.
      const administrator = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          role: true,
          status: true,
        },
      });

      if (
        !administrator ||
        administrator.role !== "ADMIN" ||
        administrator.status !== "Active"
      ) {
        throw new Error("Administrator access is required to publish official posts.");
      }

      // The official account, not the administrator, is the post author.
      const officialProfile = await tx.socialProfile.findUnique({
        where: { username: "justdy_official" },
        select: {
          userId: true,
          status: true,
          user: {
            select: { status: true },
          },
        },
      });

      if (
        !officialProfile ||
        officialProfile.status !== "ACTIVE" ||
        officialProfile.user.status !== "Active"
      ) {
        throw new Error("The Justdy Official account is unavailable.");
      }

      // A new welcome announcement replaces the previous published one.
      if (parsed.data.postType === "WELCOME") {
        await tx.socialPost.updateMany({
          where: {
            postType: "WELCOME",
            status: "PUBLISHED",
          },
          data: {
            status: "HIDDEN",
          },
        });
      }

           const createdPost = await tx.socialPost.create({
        data: {
          authorId: officialProfile.userId,
          content: parsed.data.content,
          visibility: "PUBLIC",
          layout: "TEXT_TOP",
          status: "PUBLISHED",
          postType: parsed.data.postType,
          feedPriority: parsed.data.postType === "WELCOME" ? 1000 : 100,
          commentsEnabled: true,
          publishedAt: new Date(),
        },
        select: {
          id: true,
          content: true,
          postType: true,
          status: true,
          publishedAt: true,
        },
      });

      if (parsed.data.postType === "CHALLENGE") {
        await tx.socialChallenge.create({
          data: {
            postId: createdPost.id,
            createdById: administrator.id,
            opensAt: new Date(parsed.data.opensAt!),
            closesAt: new Date(parsed.data.closesAt!),
            maxScore: parsed.data.maxScore!,
            status: "OPEN",
          },
        });
      }

      return createdPost;
    });

    // Notify every active platform account when a mathematics challenge is published.
    if (post.postType === "CHALLENGE") {
      try {
        const recipients = await prisma.user.findMany({
          where: { status: "Active" },
          select: { id: true },
        });

        await notifyUsers(
          recipients.map((recipient) => recipient.id),
          {
            eventKey: `social-challenge:${post.id}`,
            type: "MATHEMATICS_CHALLENGE",
            title: "A new mathematics challenge is here!",
            message:
              "Justdy Official has published a new mathematics challenge. Visit the community feed, solve the problem, and share your reasoning.",
           href: "/#math-challenge",
          },
        );
      } catch (notificationError) {
        // Publishing must remain successful even if notification delivery fails.
        console.error(
          "Mathematics challenge notification delivery failed:",
          notificationError,
        );
      }
    }

    revalidatePath("/home");
    revalidatePath("/");

    return {
      success: true as const,
      post,
    };
  } catch (error) {
    console.error("Publish official social post error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Unable to publish the official post.",
    };
  }
}

export async function dismissWelcomePost(postId: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Please sign in before dismissing this post.",
    };
  }

  if (
    typeof postId !== "string" ||
    postId.trim().length === 0 ||
    postId.length > 100
  ) {
    return {
      success: false as const,
      error: "Invalid post.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
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
        throw new Error("Your account cannot dismiss this post.");
      }

      const welcomePost = await tx.socialPost.findFirst({
        where: {
          id: postId,
          postType: "WELCOME",
          status: "PUBLISHED",
          visibility: "PUBLIC",
        },
        select: { id: true },
      });

      if (!welcomePost) {
        throw new Error("This welcome post is no longer available.");
      }

      await tx.socialPostDismissal.upsert({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: welcomePost.id,
          },
        },
        create: {
          userId: session.user.id,
          postId: welcomePost.id,
        },
        update: {},
      });
    });

    revalidatePath("/home");
    revalidatePath("/");

    return {
      success: true as const,
    };
  } catch (error) {
    console.error("Dismiss welcome post error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Unable to dismiss this welcome post.",
    };
  }
}
