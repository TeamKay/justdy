// @/app/actions/get-all-courses.ts
import prisma from "@/lib/prisma";
import "server-only";

export async function getAllCourses() {
  try {
    const data = await prisma.course.findMany({
      where: {
        status: "Published", // This ensures only approved courses show up
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        title: true,
        price: true,
        smallDescription: true,
        slug: true,
        fileKey: true,
        id: true,
        level: true,
        duration: true,
        category: true,
        status: true,
      },
    });

    return data;
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

export type PublicCourseType = Awaited<ReturnType<typeof getAllCourses>>[0];
