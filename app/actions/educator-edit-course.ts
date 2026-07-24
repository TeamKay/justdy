"use server";

import { requireAdmin } from "@/app/actions/require-admin";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import {
  chapterSchema,
  ChapterSchemaType,
  courseSchema,
  CourseSchemaType,
  lessonSchema,
  LessonSchemaType,
} from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { requireEducator } from "./require-educator";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  }),
);

export async function editCourse(
  data: CourseSchemaType,
  id: string,
): Promise<ApiResponse> {
  const user = await requireEducator();

  try {
    const reg = await request();
    const decision = await aj.protect(reg, {
      fingerprint: user.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "Rate limit exceeded. Please try again later.",
        };
      } else {
        return {
          status: "error",
          message: "Request denied.",
        };
      }
    }

    const result = courseSchema.safeParse(data);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    let oldFileKeyToDelete: string | null = null;

    await prisma.$transaction(async (tx) => {
      // 1. Check product exists
      const product = await tx.product.findFirst({
        where: {
          id,
          userId: user.user.id,
        },
        include: {
          course: true,
        },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      // 2. Identify if the file key changed
      const currentImageKey = product.course?.imageKey;
      if (currentImageKey && currentImageKey !== result.data.fileKey) {
        oldFileKeyToDelete = currentImageKey;
      }

      // Update Product table
      await tx.product.update({
        where: {
          id,
        },
        data: {
          title: result.data.title,
          description: result.data.description,
          smallDescription: result.data.smallDescription,
          price: result.data.price,
          slug: result.data.slug,
        },
      });

      // 3. Check if course exists
      if (product.course) {
        // Course exists -> update
        await tx.course.update({
          where: {
            productId: id,
          },
          data: {
            duration: result.data.duration,
            category: result.data.category,
            imageKey: result.data.fileKey,
          },
        });
      } else {
        // Course does not exist -> create
        await tx.course.create({
          data: {
            productId: id,
            duration: result.data.duration,
            category: result.data.category,
            imageKey: result.data.fileKey,
          },
        });
      }
    });

    // 4. Delete the old file from UploadThing after DB transaction succeeds
    if (oldFileKeyToDelete) {
      try {
        await utapi.deleteFiles(oldFileKeyToDelete);
      } catch (deleteError) {
        console.error(
          "Failed to delete old image from UploadThing:",
          deleteError,
        );
      }
    }

    revalidatePath("/educator/products");

    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch {
    return {
      status: "error",
      message: "An error occurred while updating the product",
    };
  }
}

export async function editLesson({
  lessonId,
  productId,
  values,
}: {
  lessonId: string;
  productId: string;
  values: LessonSchemaType;
}): Promise<ApiResponse> {
  await requireEducator();

  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    const keysToDelete: string[] = [];

    await prisma.$transaction(async (tx) => {
      // 1. Fetch existing lesson to check for old keys
      const existingLesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        select: { videoKey: true, thumbnailKey: true },
      });

      if (!existingLesson) {
        throw new Error("Lesson not found");
      }

      // 2. Collect old video key if replaced
      if (
        existingLesson.videoKey &&
        result.data.videoKey &&
        existingLesson.videoKey !== result.data.videoKey
      ) {
        keysToDelete.push(existingLesson.videoKey);
      }

      // 3. Collect old thumbnail key if replaced
      if (
        existingLesson.thumbnailKey &&
        result.data.thumbnailKey &&
        existingLesson.thumbnailKey !== result.data.thumbnailKey
      ) {
        keysToDelete.push(existingLesson.thumbnailKey);
      }

      // 4. Update the lesson
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

    // 5. Delete old files from UploadThing
    if (keysToDelete.length > 0) {
      try {
        await utapi.deleteFiles(keysToDelete);
      } catch (deleteError) {
        console.error(
          "Failed to delete old lesson files from UploadThing:",
          deleteError,
        );
      }
    }

    revalidatePath(`/educator/products/${productId}/edit`);

    return {
      status: "success",
      message: "Lesson updated successfully",
    };
  } catch (error) {
    console.error("EDIT LESSON ERROR:", error);
    return {
      status: "error",
      message: "Failed to update lesson",
    };
  }
}

export async function reorderLessons(
  chapterId: string,
  lessons: { id: string; position: number }[],
  courseId: string,
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    if (!lessons || lessons.length === 0) {
      return {
        status: "error",
        message: "No lessons provided for reordering",
      };
    }

    const updates = lessons.map((lesson) =>
      prisma.lesson.update({
        where: {
          id: lesson.id,
          chapterId: chapterId,
        },
        data: {
          position: lesson.position,
        },
      }),
    );

    await prisma.$transaction(updates);

    revalidatePath(`/educator/products/${courseId}/edit`);

    return {
      status: "success",
      message: "Lessons reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to reorder lessons",
    };
  }
}

export async function reorderChapters(
  productId: string,
  chapters: { id: string; position: number }[],
): Promise<ApiResponse> {
  await requireEducator();
  try {
    if (!chapters || chapters.length === 0) {
      return {
        status: "error",
        message: "No chapters provided for reordering.",
      };
    }

    const updates = chapters.map((chapter) =>
      prisma.chapter.update({
        where: {
          id: chapter.id,
          productId,
        },
        data: {
          position: chapter.position,
        },
      }),
    );

    await prisma.$transaction(updates);

    revalidatePath(`/educator/products/${productId}/edit`);

    return {
      status: "success",
      message: "Chapters reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to reorder chapters",
    };
  }
}

export async function createChapter(
  values: ChapterSchemaType,
): Promise<ApiResponse> {
  await requireEducator();
  try {
    const result = chapterSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
      };
    }

    await prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({
        where: {
          productId: result.data.productId,
        },
      });

      if (!course) {
        throw new Error("Course does not exist");
      }

      const maxPos = await tx.chapter.findFirst({
        where: {
          courseId: course.id,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });

      await tx.chapter.create({
        data: {
          title: result.data.name,
          courseId: course.id,
          position: (maxPos?.position ?? 0) + 1,
        },
      });
    });

    revalidatePath(`/educator/products/${result.data.productId}/edit`);

    return {
      status: "success",
      message: "Chapter Created Successfully",
    };
  } catch (error) {
    console.error("CREATE CHAPTER ERROR:", error);
    return {
      status: "error",
      message: "Failed to create chapter",
    };
  }
}

export async function createLesson(
  values: LessonSchemaType,
): Promise<ApiResponse> {
  await requireEducator();
  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
      };
    }

    await prisma.$transaction(async (tx) => {
      const maxPos = await tx.lesson.findFirst({
        where: {
          chapterId: result.data.chapterId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });

      await tx.lesson.create({
        data: {
          title: result.data.name,
          description: result.data.description,
          videoKey: result.data.videoKey,
          thumbnailKey: result.data.thumbnailKey,
          chapterId: result.data.chapterId,
          position: (maxPos?.position ?? 0) + 1,
        },
      });
    });

    revalidatePath(`/educator/products/${result.data.productId}/edit`);

    return {
      status: "success",
      message: "Lesson Created Successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create lesson",
    };
  }
}

export async function deleteLesson({
  chapterId,
  courseId,
  lessonId,
}: {
  chapterId: string;
  courseId: string;
  lessonId: string;
}): Promise<ApiResponse> {
  await requireEducator();
  try {
    const chapterWithLessons = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
      select: {
        lessons: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
            videoKey: true,
            thumbnailKey: true,
          },
        },
      },
    });

    if (!chapterWithLessons) {
      return {
        status: "error",
        message: "Chapter not Found",
      };
    }

    const lessons = chapterWithLessons.lessons;
    const lessonsToDelete = lessons.find((lesson) => lesson.id === lessonId);

    if (!lessonsToDelete) {
      return {
        status: "error",
        message: "Lesson not Found in the chapter",
      };
    }

    // Collect keys to delete from UploadThing
    const keysToDelete: string[] = [];
    if (lessonsToDelete.videoKey) keysToDelete.push(lessonsToDelete.videoKey);
    if (lessonsToDelete.thumbnailKey)
      keysToDelete.push(lessonsToDelete.thumbnailKey);

    const remainingLessons = lessons.filter((lesson) => lesson.id !== lessonId);

    const updates = remainingLessons.map((lesson, index) => {
      return prisma.lesson.update({
        where: { id: lessonId },
        data: { position: index + 1 },
      });
    });

    await prisma.$transaction([
      ...updates,
      prisma.lesson.delete({
        where: {
          id: lessonId,
          chapterId: chapterId,
        },
      }),
    ]);

    if (keysToDelete.length > 0) {
      try {
        await utapi.deleteFiles(keysToDelete);
      } catch (deleteError) {
        console.error(
          "Failed to delete lesson files from UploadThing:",
          deleteError,
        );
      }
    }

    revalidatePath(`/educator/products/${courseId}/edit`);

    return {
      status: "success",
      message: "Lesson deleted and reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete lesson",
    };
  }
}

export async function deleteChapter({
  chapterId,
  courseId,
}: {
  chapterId: string;
  courseId: string;
}): Promise<ApiResponse> {
  await requireEducator();
  try {
    const productWithChapters = await prisma.course.findUnique({
      where: {
        productId: courseId,
      },
      select: {
        chapter: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
          },
        },
      },
    });

    if (!productWithChapters) {
      return {
        status: "error",
        message: "Product not Found",
      };
    }

    const chapters = productWithChapters.chapter;
    const chapterToDelete = chapters.find(
      (chapter) => chapter.id === chapterId,
    );

    if (!chapterToDelete) {
      return {
        status: "error",
        message: "Chapter not Found in the product",
      };
    }

    const remainingChapters = chapters.filter(
      (chapter) => chapter.id !== chapterId,
    );

    const updates = remainingChapters.map((chapter, index) => {
      return prisma.chapter.update({
        where: { id: chapter.id },
        data: { position: index + 1 },
      });
    });
    await prisma.$transaction([
      ...updates,
      prisma.chapter.delete({
        where: {
          id: chapterId,
        },
      }),
    ]);
    revalidatePath(`/educator/products/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapter deleted and reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete chapter",
    };
  }
}
