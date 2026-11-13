
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { r2Storage } from "@/lib/storage/r2";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createSocialPostSchema,
  updateSocialPostSchema,
} from "@/lib/social/validation";

export async function createSocialPost(input: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Please sign in before publishing.",
    };
  }

  const parsed = createSocialPostSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error:
        parsed.error.issues[0]?.message ?? "Please check your post.",
    };
  }

  const { content, mediaIds, visibility, layout } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      status: true,
      socialProfile: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!user || user.status !== "Active") {
    return {
      success: false as const,
      error: "Your account cannot publish posts.",
    };
  }

  if (!user.socialProfile || user.socialProfile.status !== "ACTIVE") {
    return {
      success: false as const,
      error: "You need an active social profile to publish.",
    };
  }

  try {
    const post = await prisma.$transaction(async (tx) => {
      if (mediaIds.length > 0) {
        const media = await tx.uploadedMedia.findMany({
          where: {
            id: { in: mediaIds },
            uploaderId: user.id,
            purpose: "SOCIAL_POST",
            type: { in: ["IMAGE", "VIDEO"] },
            status: "UPLOADED",
          },
          select: {
            id: true,
            type: true,
          },
        });

        if (media.length !== mediaIds.length) {
          throw new Error(
            "One or more media files are invalid, already attached, or do not belong to you.",
          );
        }

        if (media.filter((item) => item.type === "VIDEO").length > 1) {
          throw new Error("You can attach only one video to a post.");
        }
      }

      const createdPost = await tx.socialPost.create({
        data: {
          authorId: user.id,
          content: content || null,
          visibility,
          layout,
          status: "PUBLISHED",
          publishedAt: new Date(),
          ...(mediaIds.length > 0 && {
            media: {
              create: mediaIds.map((mediaId, index) => ({
                mediaId,
                position: index,
              })),
            },
          }),
        },
        select: {
          id: true,
          content: true,
          visibility: true,
          status: true,
          publishedAt: true,
          createdAt: true,
        },
      });

      if (mediaIds.length > 0) {
        const updated = await tx.uploadedMedia.updateMany({
         where: {
                id: { in: mediaIds },
                uploaderId: user.id,
                purpose: "SOCIAL_POST",
               type: { in: ["IMAGE", "VIDEO"] },
                status: "UPLOADED",
                },
          data: {
            status: "ATTACHED",
          },
        });

        if (updated.count !== mediaIds.length) {
          throw new Error(
            "An image could not be attached. Please upload it again.",
          );
        }
      }

      return createdPost;
    });

    revalidatePath("/home");

    return {
      success: true as const,
      post,
    };
  } catch (error) {
    console.error("Create social post error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Unable to publish your post.",
    };
  }
}

export async function deleteSocialPost(postId: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Please sign in before deleting a post.",
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
    const result = await prisma.$transaction(async (tx) => {
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
        throw new Error("Your account cannot delete posts.");
      }

      const deleted = await tx.socialPost.updateMany({
        where: {
          id: postId,
          authorId: session.user.id,
          status: "PUBLISHED",
         
        },
        data: {
          status: "REMOVED",
        },
      });

      if (deleted.count !== 1) {
        throw new Error(
          "This post could not be found or you are not allowed to delete it.",
        );
      }

      return true;
    });

    revalidatePath("/home");

    return {
      success: result,
    };
  } catch (error) {
    console.error("Delete social post error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Unable to delete this post.",
    };
  }
}

export async function updateSocialPost(input: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Please sign in before editing a post.",
    };
  }

  const parsed = updateSocialPostSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error:
        parsed.error.issues[0]?.message ?? "Please check your post.",
    };
  }

const { postId, content, mediaIds, visibility, layout } = parsed.data;

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
        throw new Error("Your account cannot edit posts.");
      }

      const post = await tx.socialPost.findFirst({
        where: {
          id: postId,
          authorId: session.user.id,
          status: "PUBLISHED",
        },
        select: {
          id: true,
          media: {
            select: {
              mediaId: true,
            },
          },
        },
      });

      if (!post) {
        throw new Error(
          "This post could not be found or you are not allowed to edit it.",
        );
      }

      const existingMediaIds = new Set(
        post.media.map((attachment) => attachment.mediaId),
      );

      const retainedMediaIds = mediaIds.filter((id) =>
        existingMediaIds.has(id),
      );

      const newMediaIds = mediaIds.filter(
        (id) => !existingMediaIds.has(id),
      );

     // Verify that retained media are still valid attachments
// belonging to this user.
let retainedVideoCount = 0;

if (retainedMediaIds.length > 0) {
  const retainedMedia = await tx.socialPostMedia.findMany({
    where: {
      postId: post.id,
      mediaId: { in: retainedMediaIds },
      media: {
        uploaderId: session.user.id,
        purpose: "SOCIAL_POST",
        type: { in: ["IMAGE", "VIDEO"] },
        status: "ATTACHED",
      },
    },
    select: {
      mediaId: true,
      media: {
        select: {
          type: true,
        },
      },
    },
  });

  if (retainedMedia.length !== retainedMediaIds.length) {
    throw new Error("One or more existing media files are invalid.");
  }

  retainedVideoCount = retainedMedia.filter(
    (item) => item.media.type === "VIDEO",
  ).length;
}

        // Verify that newly uploaded media belong to this user
        // and have not already been attached elsewhere.
        let newVideoCount = 0;

        if (newMediaIds.length > 0) {
          const newMedia = await tx.uploadedMedia.findMany({
            where: {
              id: { in: newMediaIds },
              uploaderId: session.user.id,
              purpose: "SOCIAL_POST",
              type: { in: ["IMAGE", "VIDEO"] },
              status: "UPLOADED",
            },
            select: {
              id: true,
              type: true,
            },
          });

          if (newMedia.length !== newMediaIds.length) {
            throw new Error(
              "One or more new media files are invalid or already attached.",
            );
          }

          newVideoCount = newMedia.filter(
            (item) => item.type === "VIDEO",
          ).length;
        }

        if (retainedVideoCount + newVideoCount > 1) {
          throw new Error("You can attach only one video to a post.");
        }


      const removedMediaIds = post.media
        .map((attachment) => attachment.mediaId)
        .filter((id) => !mediaIds.includes(id));

      // Remove old attachment records before recreating the ordered list.
      await tx.socialPostMedia.deleteMany({
        where: {
          postId: post.id,
        },
      });

      if (removedMediaIds.length > 0) {
        await tx.uploadedMedia.updateMany({
          where: {
            id: { in: removedMediaIds },
            uploaderId: session.user.id,
            purpose: "SOCIAL_POST",
            type: { in: ["IMAGE", "VIDEO"] },
            status: "ATTACHED",
          },
          data: {
            status: "UPLOADED",
          },
        });
      }

      // Attach the requested images in their new order.
      if (mediaIds.length > 0) {
        await tx.socialPostMedia.createMany({
          data: mediaIds.map((mediaId, index) => ({
            postId: post.id,
            mediaId,
            position: index,
          })),
        });
      }

      // Mark newly attached uploads as attached.
      if (newMediaIds.length > 0) {
        const updated = await tx.uploadedMedia.updateMany({
          where: {
            id: { in: newMediaIds },
            uploaderId: session.user.id,
            purpose: "SOCIAL_POST",
            type: { in: ["IMAGE", "VIDEO"] },
            status: "UPLOADED",
          },
          data: {
            status: "ATTACHED",
          },
        });

        if (updated.count !== newMediaIds.length) {
          throw new Error(
            "An image could not be attached. Please try again.",
          );
        }
      }

      await tx.socialPost.update({
        where: {
          id: post.id,
        },
       data: {
          content: content || null,
          visibility,
          layout,
        },
      });
    });

    revalidatePath("/home");

    return {
      success: true as const,
    };
  } catch (error) {
    console.error("Update social post error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Unable to update your post.",
    };
  }
}

export async function cleanupUnattachedSocialPostMedia(
  mediaIds: unknown,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false as const,
      error: "Please sign in before cleaning up uploads.",
    };
  }

  if (
    !Array.isArray(mediaIds) ||
    mediaIds.length === 0 ||
    mediaIds.length > 6 ||
    !mediaIds.every(
      (id) => typeof id === "string" && id.length > 0,
    ) ||
    new Set(mediaIds).size !== mediaIds.length
  ) {
    return {
      success: false as const,
      error: "Invalid media cleanup request.",
    };
  }

  try {
    const reservedMedia = await prisma.$transaction(async (tx) => {
      const eligibleMedia = await tx.uploadedMedia.findMany({
        where: {
          id: { in: mediaIds },
          uploaderId: session.user.id,
          purpose: "SOCIAL_POST",
          type: { in: ["IMAGE", "VIDEO"] },
          status: "UPLOADED",
          posts: { none: {} },
        },
       select: {
          id: true,
          storageKey: true,
        },
      });

      if (eligibleMedia.length !== mediaIds.length) {
        throw new Error(
          "Some files are no longer eligible for cleanup.",
        );
      }

      const reserved = await tx.uploadedMedia.updateMany({
        where: {
          id: { in: mediaIds },
          uploaderId: session.user.id,
          purpose: "SOCIAL_POST",
          type: { in: ["IMAGE", "VIDEO"] },
          status: "UPLOADED",
          posts: { none: {} },
        },
        data: {
          status: "DELETING",
        },
      });

      if (reserved.count !== mediaIds.length) {
        throw new Error(
          "Some files could not be reserved for cleanup.",
        );
      }

      return eligibleMedia;
    });

    
    const deletionResults = await Promise.allSettled(
      reservedMedia.map((media) =>
       r2Storage.delete(media.storageKey),
      ),
    );

    const failedDeletions = deletionResults
      .map((result, index) => ({
        result,
        mediaId: reservedMedia[index].id,
       key: reservedMedia[index].storageKey,
      }))
      .filter(
        (item) => item.result.status === "rejected",
      );

    if (failedDeletions.length > 0) {
      console.error("R2 media deletion incomplete.", {
        expected: reservedMedia.length,
        failed: failedDeletions.map((item) => ({
          mediaId: item.mediaId,
          error:
            item.result.status === "rejected"
              ? String(item.result.reason)
              : undefined,
        })),
      });

      throw new Error(
        "R2 could not confirm deletion of every file. Files remain reserved for scheduled reconciliation.",
      );
    }


const removed = await prisma.uploadedMedia.deleteMany({
  where: {
    id: { in: reservedMedia.map((media) => media.id) },
    uploaderId: session.user.id,
    purpose: "SOCIAL_POST",
    status: "DELETING",
    posts: { none: {} },
  },
});

if (removed.count !== reservedMedia.length) {
  console.error(
    "Some media files were deleted from storage but their database records remain.",
    {
      expected: reservedMedia.length,
      removed: removed.count,
    },
  );

  return {
    success: false as const,
    error:
      "Storage deletion succeeded, but database cleanup was incomplete. Please contact support.",
  };
}

return {
  success: true as const,
  deletedCount: removed.count,
};
  } catch (error) {
    console.error("Social media cleanup reservation error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Unable to prepare media cleanup.",
    };
  }
}