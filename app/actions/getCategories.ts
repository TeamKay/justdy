// lib/getCategories.ts

import prisma from "@/lib/prisma";

export async function getCategories() {
  const categories = await prisma.product.findMany({
    where: {
      type: "Course",
      category: {
        not: null,
      },
    },
    select: {
      category: true,
    },
    distinct: ["category"],
    orderBy: {
      category: "asc",
    },
  });

  return categories
    .map((c) => c.category)
    .filter((category): category is string => category !== null);
}
