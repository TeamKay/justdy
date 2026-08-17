import "server-only";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireManager } from "./require-manager";

export async function educatorGetCourses() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id;

  await requireManager();
  if (!userId) throw new Error("Unauthorized");

  const data = await prisma.product.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      price: true,

      slug: true,
      // 1. Select the related user's name
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

  // 2. Map the data to include "educatorName" at the top level
  return data.map((course) => ({
    ...course,
    educatorName: course.user.name,
  }));
}

export type EducatorCourseType = Awaited<
  ReturnType<typeof educatorGetCourses>
>[number];

// import "server-only";

// import prisma from "@/lib/prisma";
// import { requireEducator } from "./require-educator";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";

// export async function educatorGetCourses(){
//     const session = await auth.api.getSession({
//         headers: await headers()
//       });
//     const userId = session?.user?.id;
//     await new Promise((resolve) => setTimeout(resolve, 2000));
//     await requireEducator();

//     if (!userId) throw new Error("Unauthorized");

//     const data = await prisma.course.findMany({
//         where: {userId: userId,
//         },
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
//             _count:{
//                 select: {
//                     enrollment: true,
//                 }
//             }
//         },
//     });
//     return data;
// }

// export type AdminCourseType = Awaited<ReturnType<typeof educatorGetCourses>>[number];
