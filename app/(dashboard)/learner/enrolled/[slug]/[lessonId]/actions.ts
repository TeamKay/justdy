"use server";

import { requireUser } from "@/app/actions/require-student";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function markLessonComplete(lessonId: string, slug: string): Promise<ApiResponse>{
    const session = await requireUser();

    try{
        await prisma.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: session.id,
                    lessonId: lessonId,
                },
            },
            update: {
                completed: true,
            },
            create: {
                lessonId: lessonId,
                userId: session.id,
                completed: true,
            },
        });

        revalidatePath(`/dashboard/admin/${slug}`);

        return {
            status: 'success',
            message: 'Progress updated'
        }
    }catch{
        return {
            status: 'error',
            message: 'Failed to mark lesson as complete'
        }
    }
}