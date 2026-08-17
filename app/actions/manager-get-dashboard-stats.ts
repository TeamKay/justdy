import "server-only";

import prisma from "@/lib/prisma";
import { requireManager } from "./require-manager";

export async function managerGetDashboardStats() {
  await requireManager();

  const [totallearners, totalEducators, totalCourses, totalLessons] =
    await Promise.all([
      //total students
      prisma.user.count({
        where: {
          role: "Learner",
        },
      }),

      //total educators
      prisma.user.count({
        where: {
          role: "Educator",
        },
      }),

      //total courses
      prisma.course.count(),

      //total lessos
      prisma.lesson.count(),
    ]);

  return {
    totallearners,
    totalEducators,
    totalCourses,
    totalLessons,
  };
}
