import "server-only";

import prisma from "@/lib/prisma";
import { requireManager } from "./require-manager";

export async function managerGetDashboardStats() {
  await requireManager();

  const [totallearners, totalEducators, totalCourses, totalLessons] =
    await Promise.all([
      // Total learners
      prisma.user.count({
        where: {
          role: "Learner",
        },
      }),

      // Total educators
      prisma.user.count({
        where: {
          role: "Educator",
        },
      }),

      // Total courses
      // Courses are Products with type = "Course"
      prisma.product.count({
        where: {
          type: "Course",
        },
      }),

      // Total lessons
      prisma.lesson.count(),
    ]);

  return {
    totallearners,
    totalEducators,
    totalCourses,
    totalLessons,
  };
}
