"use server";

import { requireUser } from "@/app/actions/require-student";
import prisma from "@/lib/prisma";

export async function getMyProducts() {
  const session = await requireUser();

  const userId = session.id;

  // ============================================================
  // COURSES
  // ============================================================

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      status: "Active",
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      product: {
        include: {
          images: {
            orderBy: {
              position: "asc",
            },

            select: {
              imageKey: true,
            },
          },

          chapters: {
            orderBy: {
              position: "asc",
            },

            include: {
              lessons: {
                orderBy: {
                  position: "asc",
                },

                include: {
                  lessonProgress: {
                    where: {
                      userId,
                    },

                    select: {
                      lessonId: true,
                      completed: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // ============================================================
  // DIGITAL PRODUCTS
  // ============================================================

  const purchases = await prisma.purchase.findMany({
    where: {
      userId,
      status: "Paid",
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      product: {
        include: {
          images: {
            orderBy: {
              position: "asc",
            },

            select: {
              imageKey: true,
            },
          },
        },
      },
    },
  });

  // ============================================================
  // NORMALIZE INTO ONE PRODUCT ARRAY
  // ============================================================

  const courseProducts = enrollments.map((enrollment) => ({
    id: enrollment.product.id,
    title: enrollment.product.title,
    slug: enrollment.product.slug,
    type: enrollment.product.type,

    description: enrollment.product.description,

    imageKey: enrollment.product.imageKey,

    images: enrollment.product.images,

    fileKey: enrollment.product.fileKey,

    fileType: enrollment.product.fileType,

    fileSize: enrollment.product.fileSize,

    purchasedAt: enrollment.createdAt,

    accessType: "course" as const,

    enrollmentId: enrollment.id,

    chapters: enrollment.product.chapters,

    progress: calculateCourseProgress(enrollment.product.chapters),
  }));

  const digitalProducts = purchases.map((purchase) => ({
    id: purchase.product.id,
    title: purchase.product.title,
    slug: purchase.product.slug,
    type: purchase.product.type,

    description: purchase.product.description,

    imageKey: purchase.product.imageKey,

    images: purchase.product.images,

    fileKey: purchase.product.fileKey,

    fileType: purchase.product.fileType,

    fileSize: purchase.product.fileSize,

    purchasedAt: purchase.createdAt,

    accessType: "digital" as const,

    purchaseId: purchase.id,

    quantity: purchase.quantity,

    chapters: [],

    progress: null,
  }));

  return [...courseProducts, ...digitalProducts];
}

// ============================================================
// COURSE PROGRESS
// ============================================================

function calculateCourseProgress(
  chapters: Array<{
    lessons: Array<{
      lessonProgress: Array<{
        lessonId: string;
        completed: boolean;
      }>;
    }>;
  }>,
) {
  const lessons = chapters.flatMap((chapter) => chapter.lessons);

  const totalLessons = lessons.length;

  const completedLessons = lessons.filter((lesson) =>
    lesson.lessonProgress.some((progress) => progress.completed === true),
  ).length;

  const progressPercentage =
    totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);

  return {
    totalLessons,
    completedLessons,
    progressPercentage,
  };
}
