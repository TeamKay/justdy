import prisma from "@/lib/prisma";
import { requireEducator } from "./require-educator";
import { notFound } from "next/navigation";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function educatorGetCourse(productId: string) {
  const user = await requireEducator();

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId: user.user.id,
    },
    include: {
      course: {
        include: {
          chapter: {
            orderBy: { position: "asc" },
            include: {
              lessons: {
                orderBy: { position: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!product) notFound();

  let imageUrl = "/images/no-image.jpeg";

  if (product.course?.imageKey) {
    const key = product.course.imageKey;

    // Check if the key stored in DB is already a full URL
    if (key.startsWith("http://") || key.startsWith("https://")) {
      imageUrl = key;
    } else {
      try {
        const result = await utapi.getFileUrls([key]);
        imageUrl = result.data[0]?.url ?? `https://utfs.io/f/${key}`;
      } catch (error) {
        console.error("Failed to fetch image URL from UploadThing:", error);
        imageUrl = `https://utfs.io/f/${key}`;
      }
    }
  }

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    smallDescription: product.smallDescription,
    price: product.price,
    slug: product.slug,
    status: product.status,
    type: product.type,
    fileKey: product.course?.imageKey ?? "",
    imageUrl,
    duration: product.course?.duration ?? 0,
    category: product.course?.category ?? "",
    hasCourseRelation: !!product.course,
    chapter: product.course?.chapter ?? [],
  };
}

export type EducatorCourseType = Awaited<ReturnType<typeof educatorGetCourse>>;
export type AdminCourseSingularType = Awaited<
  ReturnType<typeof educatorGetCourse>
>;

// export async function educatorGetCourse(id: string) {
//   const user = await requireEducator();
//   const utapi = new UTApi();
//   let imageUrl = "/images/course-placeholder.png";

//   const product = await prisma.product.findFirst({
//     where: {
//       id,
//       userId: user.user.id,
//     },
//     include: {
//       course: {
//         include: {
//           chapter: {
//             orderBy: {
//               position: "asc",
//             },
//             include: {
//               lessons: {
//                 orderBy: {
//                   position: "asc",
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   });

//   if (!product) {
//     notFound();
//   }

//   if (product.course?.imageKey) {
//     const file = await utapi.getFileUrls([product.course.imageKey]);

//     imageUrl = file.data[0]?.url ?? "/images/course-placeholder.png";
//   }

//   // const product = await prisma.product.findUnique({
//   //   where: {
//   //     id: id,
//   //     userId: user.user.id, // Security verification
//   //   },
//   //   include: {
//   //     course: {
//   //       include: {
//   //         chapter: {
//   //           orderBy: {
//   //             position: "asc",
//   //           },
//   //           include: {
//   //             lessons: {
//   //               orderBy: {
//   //                 position: "asc",
//   //               },
//   //             },
//   //           },
//   //         },
//   //       },
//   //     },
//   //   },
//   // });

//   // if (!product) {
//   //   notFound();
//   // }

//   // Check if course-specific data actually exists

//   return {
//     id: product.id,

//     title: product.title,
//     description: product.description,
//     smallDescription: product.smallDescription,
//     price: product.price,
//     slug: product.slug,
//     status: product.status,
//     type: product.type,
//     hasCourseRelation: !!product.course,
//     duration: product.course?.duration ?? 0,
//     category: product.course?.category ?? "",
//     imageKey: product.course?.imageKey ?? "",
//     imageUrl,
//     chapter: product.course?.chapter ?? [],
//   };
// }

// import prisma from "@/lib/prisma";
// import { requireEducator } from "./require-educator"; // Adjust paths accordingly
// import { notFound } from "next/navigation";

// export async function educatorGetCourse(productId: string) {
//   const user = await requireEducator();

//   const product = await prisma.product.findUnique({
//     where: {
//       id: productId,
//       userId: user.user.id, // Security verification
//     },
//     include: {
//       course: {
//         include: {
//           chapter: {
//             orderBy: {
//               position: "asc",
//             },
//             include: {
//               lessons: {
//                 orderBy: {
//                   position: "asc",
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   });

//   if (!product) {
//     notFound();
//   }

//   // Ensure the product actually is a course and has course metadata
//   if (product.type !== "Course" || !product.course) {
//     throw new Error(
//       "This product is not a course or does not have course specifications.",
//     );
//   }

//   // Combine product and course properties into a clean unified object for your client components
//   return {
//     id: product.id,
//     title: product.title,
//     description: product.description,
//     smallDescription: product.smallDescription,
//     price: product.price,
//     slug: product.slug,
//     status: product.status,

//     // Extracted from the related 'course' table
//     duration: product.course.duration,
//     category: product.course.category,
//     fileKey: product.course.imageKey ?? "", // Matches 'fileKey' expected by EditCourseForm defaultValues

//     // Keep nested chapters intact for the <ProductStructure /> component
//     chapter: product.course.chapter,
//   };
// }

// import "server-only";

// import { notFound } from "next/navigation";
// import prisma from "@/lib/prisma";
// import { requireEducator } from "./require-educator";

// export async function educatorGetCourse(id: string) {
//   await requireEducator();

//   const data = await prisma.product.findUnique({
//     where: {
//       id: id,
//     },
//     select: {
//       id: true,
//       title: true,
//       smallDescription: true,
//       description: true,
//       price: true,
//       slug: true,
//       status: true,
//       type: true,

//       course: {
//         select: {
//           id: true,
//           duration: true,
//           category: true,
//           imageKey: true,

//           chapter: {
//             select: {
//               id: true,
//               title: true,
//               position: true,

//               lessons: {
//                 select: {
//                   id: true,
//                   title: true,
//                   description: true,
//                   thumbnailKey: true,
//                   videoKey: true,
//                   position: true,
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   });

//   if (!data) {
//     return notFound();
//   }

//   return data;
// }

// import "server-only";

// import { notFound } from "next/navigation";
// import prisma from "@/lib/prisma";
// import { requireEducator } from "./require-educator";

// export async function educatorGetCourse(id: string) {
//   await requireEducator();

//   const data = await prisma.course.findUnique({
//     where: {
//       id: id,
//     },
//     select: {
//       id: true,
//       title: true,
//       smallDescription: true,
//       description: true,
//       duration: true,
//       status: true,
//       price: true,
//       fileKey: true,
//       slug: true,
//       category: true,
//       chapter: {
//         select: {
//           id: true,
//           title: true,
//           position: true,
//           lessons: {
//             select: {
//               id: true,
//               title: true,
//               description: true,
//               thumbnailKey: true,
//               videoKey: true,
//               position: true,
//             },
//           },
//         },
//       },
//     },
//   });

//   if (!data) {
//     return notFound();
//   }

//   return data;
// }

// export type AdminCourseSingularType = Awaited<
//   ReturnType<typeof educatorGetCourse>
// >;
