import "server-only";

import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "./require-student";

export async function getLessonContent(lessonId: string) {
  // ==========================================================
  // AUTHENTICATE LEARNER
  // ==========================================================

  const session = await requireUser();

  // ==========================================================
  // GET LESSON
  // ==========================================================

  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },

    select: {
      id: true,
      title: true,
      description: true,
      thumbnailKey: true,
      videoKey: true,
      position: true,

      // ======================================================
      // LESSON PROGRESS
      // ======================================================

      lessonProgress: {
        where: {
          userId: session.id,
        },

        select: {
          id: true,
          completed: true,
          lessonId: true,
        },
      },

      // ======================================================
      // CHAPTER
      // ======================================================

      chapter: {
        select: {
          id: true,
          title: true,
          position: true,

          // ==================================================
          // PRODUCT
          // ==================================================

          productId: true,

          product: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
        },
      },
    },
  });

  // ==========================================================
  // LESSON NOT FOUND
  // ==========================================================

  if (!lesson) {
    return notFound();
  }

  // ==========================================================
  // CHAPTER / PRODUCT VALIDATION
  // ==========================================================

  if (!lesson.chapter?.productId) {
    return notFound();
  }

  // ==========================================================
  // VERIFY LEARNER ENROLLMENT
  // ==========================================================
  //
  // Enrollment is connected to Product through productId.
  //
  // Old:
  // userId_courseId
  //
  // Current:
  // userId + productId
  // ==========================================================

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: session.id,
      productId: lesson.chapter.productId,
      status: "Active",
    },

    select: {
      id: true,
      status: true,
      productId: true,
    },
  });

  // ==========================================================
  // ACCESS DENIED
  // ==========================================================

  if (!enrollment) {
    return notFound();
  }

  // ==========================================================
  // RETURN LESSON
  // ==========================================================

  return lesson;
}

export type LessonContentType = Awaited<ReturnType<typeof getLessonContent>>;
