import "server-only";

import { requireAdmin } from "./require-admin";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";


export async function adminGetCourse(id: string) {
    await requireAdmin();

    const data = await prisma.course.findUnique({
        where: {
            id: id,
        },
        select: {
            id: true,
            title: true,
            smallDescription: true,
            description: true,
            duration: true,
            level: true,
            status: true,
            price: true,
            fileKey: true,
            slug: true,
            category: true,
            chapter:{
                select: {
                    id: true,
                    title: true,
                    position: true,
                    lessons:{
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

export type AdminCourseSingularType = Awaited<ReturnType<typeof adminGetCourse>>;