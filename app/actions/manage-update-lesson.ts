"use server";

import prisma from "@/lib/prisma";

import { ApiResponse } from "@/lib/types";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";

import { UTApi } from "uploadthing/server";
import { revalidatePath } from "next/cache";
import { requireManager } from "./require-manager";

const utapi = new UTApi();

// Helper to extract the raw key if a full UploadThing URL is passed
function extractFileKey(urlOrKey: string | null | undefined): string | null {
  if (!urlOrKey) return null;
  // If it's a URL like https://utfs.io/f/FILE_KEY or https://uploader.uploadthing.com/f/FILE_KEY
  if (urlOrKey.startsWith("http://") || urlOrKey.startsWith("https://")) {
    const parts = urlOrKey.split("/");
    return parts[parts.length - 1] || null;
  }
  return urlOrKey;
}

export async function updateLesson(
  values: LessonSchemaType,
  lessonId: string,
): Promise<ApiResponse> {
  await requireManager();

  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
      };
    }

    const keysToDelete: string[] = [];

    await prisma.$transaction(async (tx) => {
      // 1. Fetch current keys from DB
      const currentLesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        select: { videoKey: true, thumbnailKey: true },
      });

      if (!currentLesson) {
        throw new Error("Lesson not found");
      }

      // 2. Extract cleaned keys for comparison
      const oldVideoKey = extractFileKey(currentLesson.videoKey);
      const newVideoKey = extractFileKey(result.data.videoKey);

      const oldThumbKey = extractFileKey(currentLesson.thumbnailKey);
      const newThumbKey = extractFileKey(result.data.thumbnailKey);

      // Compare videoKey
      if (oldVideoKey && oldVideoKey !== newVideoKey) {
        keysToDelete.push(oldVideoKey);
      }

      // Compare thumbnailKey
      if (oldThumbKey && oldThumbKey !== newThumbKey) {
        keysToDelete.push(oldThumbKey);
      }

      // 4. Update the database
      await tx.lesson.update({
        where: { id: lessonId },
        data: {
          title: result.data.name,
          description: result.data.description,
          videoKey: result.data.videoKey,
          thumbnailKey: result.data.thumbnailKey,
        },
      });
    });

    // 4. Delete replaced files from UploadThing
    if (keysToDelete.length > 0) {
      try {
        const response = await utapi.deleteFiles(keysToDelete);
        console.log("UploadThing deletion response:", response);
      } catch (deleteError) {
        console.error(
          "Failed to delete old files from UploadThing:",
          deleteError,
        );
      }
    }

    revalidatePath(`/educator/products/${values.productId}/edit`);

    return {
      status: "success",
      message: "Lesson updated successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update course",
    };
  }
}
