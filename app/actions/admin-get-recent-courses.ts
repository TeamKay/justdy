import "server-only";

import prisma from "@/lib/prisma";
import { requireManager } from "./require-manager";

export async function adminGetRecentCourses() {
  await requireManager();

  const data = await prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 2,
    select: {
      id: true,
      title: true,
      duration: true,
      status: true,
      price: true,
      fileKey: true,
      slug: true,
    },
  });

  return data;
}
