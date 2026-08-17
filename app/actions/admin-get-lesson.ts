import "server-only";

import prisma from "@/lib/prisma";

import { notFound } from "next/navigation";
import { requireManager } from "./require-manager";

export async function adminGetLesson(id: string) {
  await requireManager();

  const data = await prisma.lesson.findUnique({
    where: {
      id: id,
    },
    select: {
      title: true,
      videoKey: true,
      thumbnailKey: true,
      description: true,
      id: true,
      position: true,
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

export type AdminLessonType = Awaited<ReturnType<typeof adminGetLesson>>;
