import "server-only";

import { requireAdmin } from "./require-admin";
import prisma from "@/lib/prisma";

export async function adminGetDashboardStats() {
  await requireAdmin();

  const [totalStudents, totalEducators, totalCourses, totalLessons] =
    await Promise.all([
      //total students
      prisma.user.count({
        where: {
          role: "Student",
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
    totalStudents,
    totalEducators,
    totalCourses,
    totalLessons,
  };
}
