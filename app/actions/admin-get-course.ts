import "server-only";

import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireManager } from "./require-manager";

export async function adminGetCourse(id: string) {
  await requireManager();

  const data = await prisma.product.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      duration: true,

      status: true,
      price: true,
      fileKey: true,
      slug: true,
      category: true,
      chapter: {
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnailKey: true,
              videoKey: true,
              position: true,
            },
          },
        },
      },
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

export type AdminCourseSingularType = Awaited<
  ReturnType<typeof adminGetCourse>
>;
