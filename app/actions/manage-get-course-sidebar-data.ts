import "server-only";

import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "./require-student";

export async function getCourseSidebarData(slug: string) {
  // ==========================================================
  // AUTHENTICATE USER
  // ==========================================================

  const session = await requireUser();

  // ==========================================================
  // FIND THE COURSE PRODUCT
  // ==========================================================
  //
  // In the current Prisma schema, courses are Products with:
  //
  // product.type === "Course"
  //
  // Enrollment connects the learner to Product through productId.
  // ==========================================================

  const course = await prisma.product.findFirst({
    where: {
      slug,
      type: "Course",
    },

    select: {
      id: true,
      title: true,
      description: true,
      fileKey: true,
      imageKey: true,
      duration: true,
      category: true,
      slug: true,

      // ======================================================
      // CHAPTERS
      // ======================================================

      chapters: {
        orderBy: {
          position: "asc",
        },

        select: {
          id: true,
          title: true,
          position: true,

          // ==================================================
          // LESSONS
          // ==================================================

          lessons: {
            orderBy: {
              position: "asc",
            },

            select: {
              id: true,
              title: true,
              position: true,
              description: true,
              thumbnailKey: true,
              videoKey: true,

              // ==============================================
              // LESSON PROGRESS
              // ==============================================

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
            },
          },
        },
      },
    },
  });

  // ==========================================================
  // COURSE NOT FOUND
  // ==========================================================

  if (!course) {
    return notFound();
  }

  // ==========================================================
  // VERIFY LEARNER ENROLLMENT
  // ==========================================================
  //
  // Enrollment uses:
  //
  // userId
  // productId
  //
  // NOT:
  //
  // courseId
  // ==========================================================

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: session.id,
      productId: course.id,
      status: "Active",
    },

    select: {
      id: true,
      status: true,
      productId: true,
      createdAt: true,
    },
  });

  // ==========================================================
  // ACCESS DENIED
  // ==========================================================

  if (!enrollment) {
    return notFound();
  }

  // ==========================================================
  // RETURN SIDEBAR DATA
  // ==========================================================

  return {
    course,
    enrollment,
  };
}

export type CourseSidebarDataType = Awaited<
  ReturnType<typeof getCourseSidebarData>
>;
