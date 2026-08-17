import "server-only";

import prisma from "@/lib/prisma";
import { requireUser } from "./require-student";

export async function getEnrolledCourses() {
  const user = await requireUser();

  const data = await prisma.enrollment.findMany({
    where: {
      userId: user.id,
      status: "Active",
      product: {
        type: "Course",
      },
    },

    select: {
      id: true,
      amount: true,
      status: true,
      productId: true,
      createdAt: true,

      product: {
        select: {
          id: true,
          title: true,
          description: true,
          fileKey: true,
          category: true,
          duration: true,
          slug: true,
          imageKey: true,

          chapters: {
            orderBy: {
              position: "asc",
            },

            select: {
              id: true,
              title: true,
              position: true,

              lessons: {
                orderBy: {
                  position: "asc",
                },

                select: {
                  id: true,
                  title: true,
                  description: true,
                  thumbnailKey: true,
                  videoKey: true,
                  position: true,

                  lessonProgress: {
                    where: {
                      userId: user.id,
                    },

                    select: {
                      id: true,
                      completed: true,
                      lessonId: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return data;
}

export type EnrolledCourseType = Awaited<
  ReturnType<typeof getEnrolledCourses>
>[number];

// import "server-only";

// import prisma from "@/lib/prisma";
// import { requireUser } from "./require-student";

// export async function getEnrolledCourses() {
//   const user = requireUser();

//   const data = await prisma.enrollment.findMany({
//     where: {
//       userId: (await user).id,
//       status: "Active",
//     },
//     select: {
//       Course: {
//         select: {
//           id: true,
//           smallDescription: true,
//           title: true,
//           fileKey: true,
//           level: true,
//           slug: true,
//           duration: true,
//           chapter: {
//             select: {
//               id: true,
//               lessons: {
//                 select: {
//                   id: true,
//                   lessonProgress: {
//                     where: {
//                       userId: (await user).id,
//                     },
//                     select: {
//                       id: true,
//                       completed: true,
//                       lessonId: true,
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   });

//   return data;
// }

// export type EnrolledCourseType = Awaited<
//   ReturnType<typeof getEnrolledCourses>
// >[0];
