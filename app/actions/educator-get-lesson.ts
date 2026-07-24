import "server-only";

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { requireEducator } from "./require-educator";

export async function educatorGetLesson(id: string) {
  await requireEducator();

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

export type EducatorLessonType = Awaited<ReturnType<typeof educatorGetLesson>>;
