import "server-only";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAdmin } from "./require-admin";

export async function adminGetCourses(
  searchQuery?: string,
): Promise<AdminCourseType[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id;

  await requireAdmin();
  if (!userId) throw new Error("Unauthorized");

  const courses = await prisma.course.findMany({
    where: searchQuery
      ? {
          OR: [
            { title: { contains: searchQuery, mode: "insensitive" } },
            { user: { name: { contains: searchQuery, mode: "insensitive" } } },
          ],
        }
      : {},
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      smallDescription: true,
      duration: true,
      level: true,
      status: true,
      price: true,
      fileKey: true,
      slug: true,
      // Select the name from the related user (the educator)
      user: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          enrollment: true,
        },
      },
    },
  });

  // Transform the data so the component gets exactly what it needs
  return courses.map((course) => ({
    ...course,
    educatorName: course.user?.name || "Unknown Educator",
    _count: {
      enrollment: course._count.enrollment,
    },
  }));
}

export type AdminCourseType = {
  id: string;
  title: string;
  smallDescription: string;
  duration: number; // or string, depending on your DB
  level: string; // Replace 'any' with your Level enum if applicable
  status: string; // Replace 'any' with your CourseStatus enum
  price: number;

  fileKey: string;
  slug: string;
  educatorName: string;
  _count: {
    enrollment: number;
  };
};

// import "server-only";

// import prisma from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";
// import { requireAdmin } from "./require-admin";

// // Add search parameter to the function
// export async function adminGetAllCourses(searchQuery?: string) {
//     const session = await auth.api.getSession({
//         headers: await headers()
//     });
//     const userId = session?.user?.id;

//     await requireAdmin();
//     if (!userId) throw new Error("Unauthorized");

//     const courses = await prisma.course.findMany({
//         where: searchQuery ? {
//             title: {
//                 contains: searchQuery,
//                 mode: 'insensitive', // This makes it case-insensitive (PostgreSQL/MongoDB)
//             }
//         } : {},
//         orderBy: {
//             createdAt: "desc",
//         },
//         select: {
//             id: true,
//             title: true,
//             smallDescription: true,
//             duration: true,
//             level: true,
//             status: true,
//             price: true,
//             fileKey: true,
//             slug: true,
//             user: true,
//             _count: {
//                 select: {
//                     enrollment: true,
//                 }
//             }
//         },
//     });

//     // Transform the data so the component gets exactly what it needs
//     return courses.map(course => ({
//         ...course,
//         _count: {
//             enrolledStudents: course._count.enrollment
//         }
//     }));
// }

// export type AdminCourseType = Awaited<ReturnType<typeof adminGetAllCourses>>[number];
