"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateCourseStatus(
  courseId: string,
  status: "Published" | "Rejected",
) {
  try {
    await prisma.course.update({
      where: { id: courseId },
      data: { status },
    });

    revalidatePath("/admin/courses");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update course status" };
  }
}

// "use server"

// import { CourseStatus } from "@/lib/generated/prisma/client";
// import prisma from "@/lib/prisma";

// import { revalidatePath } from "next/cache";

// export async function adminGetPendingCourses() {
//     return await prisma.course.findMany({
//         where: { status: CourseStatus.Pending },
//         include: {
//             user: { select: { name: true, email: true } }, // To see which educator submitted it
//             _count: { select: { enrollment: true } }
//         },
//         orderBy: { updatedAt: 'asc' }
//     });
// }

// export async function publishCourse(courseId: string) {
//     // Add Admin authorization check here!
//     await prisma.course.update({
//         where: { id: courseId },
//         data: { status: CourseStatus.Published }
//     });
//     revalidatePath("/dashboard/educator/courses");
// }
