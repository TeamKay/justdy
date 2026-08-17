import "server-only";

import prisma from "@/lib/prisma";

export async function getAllCourses() {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const data = await prisma.product.findMany({
    where: {
      type: "Course",
      status: "Published",
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      slug: true,
      imageKey: true,
      duration: true,
      category: true,
    },
  });

  return data;
}

export type PublicCourseType = Awaited<
  ReturnType<typeof getAllCourses>
>[number];
