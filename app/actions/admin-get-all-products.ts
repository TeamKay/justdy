import { ProductStatus, ProductType } from "@/lib/generated/prisma/enums";
import prisma from "@/lib/prisma";

export type AdminProductType = {
  id: string;
  title: string;
  smallDescription: string;
  status: ProductStatus;
  type: ProductType;
  price: number;
  slug: string;
  duration: number;
  fileKey: string;
  educatorName: string;
  // Added main video URL extracted from the first lesson
  mainVideoUrl?: string | null;
  // Array of digital product image keys sorted by position
  digitalProductImages?: string[];

  course?: {
    chapter: Array<{
      id: string;
      title: string;
      lessons: Array<{
        id: string;
        title: string;
        videoUrl?: string | null;
      }>;
    }>;
  } | null;
};

export async function adminGetProducts(
  searchQuery?: string,
): Promise<AdminProductType[]> {
  const products = await prisma.product.findMany({
    where: searchQuery
      ? {
          OR: [
            { title: { contains: searchQuery, mode: "insensitive" } },
            { user: { name: { contains: searchQuery, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      smallDescription: true,
      status: true,
      type: true,
      price: true,
      slug: true,
      user: {
        select: {
          name: true,
        },
      },
      digitalProduct: {
        select: {
          images: {
            orderBy: { position: "asc" },
            select: {
              imageKey: true,
            },
          },
        },
      },
      course: {
        select: {
          imageKey: true,
          duration: true,
          chapter: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              lessons: {
                orderBy: { position: "asc" },
                select: {
                  id: true,
                  title: true,
                  videoKey: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return products.map((product) => {
    // 1. Process course lessons and format video URLs
    const courseData = product.course
      ? {
          ...product.course,
          chapter: product.course.chapter.map((chap) => ({
            ...chap,
            lessons: chap.lessons.map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              videoUrl: lesson.videoKey
                ? lesson.videoKey.startsWith("http")
                  ? lesson.videoKey
                  : `https://utfs.io/f/${lesson.videoKey}`
                : null,
            })),
          })),
        }
      : null;

    // 2. Extract the first lesson's videoUrl safely for mainVideoUrl
    const mainVideoUrl =
      courseData?.chapter?.[0]?.lessons?.[0]?.videoUrl ?? null;

    return {
      id: product.id,
      title: product.title,
      smallDescription: product.smallDescription ?? "",
      status: product.status,
      type: product.type,
      price: product.price ?? 0,
      slug: product.slug,
      duration: product.course?.duration ?? 0,
      fileKey: product.course?.imageKey ?? "",
      educatorName: product.user?.name || "Unknown Educator",
      mainVideoUrl,
      digitalProductImages:
        product.digitalProduct?.images.map((img) => img.imageKey) ?? [],
      course: courseData,
    };
  });
}

// import { ProductStatus, ProductType } from "@/lib/generated/prisma/enums";
// import prisma from "@/lib/prisma";

// export type AdminProductType = {
//   id: string;
//   title: string;
//   smallDescription: string;
//   status: ProductStatus;
//   type: ProductType;
//   price: number;
//   slug: string;
//   duration: number;
//   fileKey: string;
//   educatorName: string;
//   // Added array of digital product image keys sorted by position
//   digitalProductImages?: string[];

//   course?: {
//     chapter: Array<{
//       id: string;
//       title: string;
//       lessons: Array<{
//         id: string;
//         title: string;
//         videoUrl?: string | null;
//       }>;
//     }>;
//   } | null;
// };

// export async function adminGetProducts(
//   searchQuery?: string,
// ): Promise<AdminProductType[]> {
//   const products = await prisma.product.findMany({
//     where: searchQuery
//       ? {
//           OR: [
//             { title: { contains: searchQuery, mode: "insensitive" } },
//             { user: { name: { contains: searchQuery, mode: "insensitive" } } },
//           ],
//         }
//       : undefined,
//     orderBy: { createdAt: "desc" },
//     select: {
//       id: true,
//       title: true,
//       smallDescription: true,
//       status: true,
//       type: true,
//       price: true,
//       slug: true,
//       user: {
//         select: {
//           name: true,
//         },
//       },
//       digitalProduct: {
//         select: {
//           images: {
//             orderBy: { position: "asc" },
//             select: {
//               imageKey: true,
//             },
//           },
//         },
//       },
//       course: {
//         select: {
//           imageKey: true,
//           duration: true,
//           chapter: {
//             orderBy: { position: "asc" },
//             select: {
//               id: true,
//               title: true,
//               lessons: {
//                 orderBy: { position: "asc" },
//                 select: {
//                   id: true,
//                   title: true,
//                   videoKey: true,
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   });

//   return products.map((product) => ({
//     id: product.id,
//     title: product.title,
//     smallDescription: product.smallDescription ?? "",
//     status: product.status,
//     type: product.type,
//     price: product.price ?? 0,
//     slug: product.slug,
//     duration: product.course?.duration ?? 0,
//     fileKey: product.course?.imageKey ?? "",
//     educatorName: product.user?.name || "Unknown Educator",
//     digitalProductImages:
//       product.digitalProduct?.images.map((img) => img.imageKey) ?? [],

//     course: product.course
//       ? {
//           ...product.course,
//           chapter: product.course.chapter.map((chap) => ({
//             ...chap,
//             lessons: chap.lessons.map((lesson) => ({
//               id: lesson.id,
//               title: lesson.title,
//               videoUrl: lesson.videoKey
//                 ? lesson.videoKey.startsWith("http")
//                   ? lesson.videoKey
//                   : `https://utfs.io/f/${lesson.videoKey}`
//                 : null,
//             })),
//           })),
//         }
//       : null,
//   }));
// }

// import { ProductStatus, ProductType } from "@/lib/generated/prisma/enums";
// import prisma from "@/lib/prisma";

// export type AdminProductType = {
//   id: string;
//   title: string;
//   smallDescription: string;
//   status: ProductStatus;
//   type: ProductType;
//   price: number;
//   slug: string;
//   duration: number;
//   fileKey: string;
//   educatorName: string;

//   course?: {
//     chapter: Array<{
//       id: string;
//       title: string;
//       lessons: Array<{
//         id: string;
//         title: string;
//         videoUrl?: string | null;
//       }>;
//     }>;
//   } | null;
// };

// export async function adminGetProducts(
//   searchQuery?: string,
// ): Promise<AdminProductType[]> {
//   const products = await prisma.product.findMany({
//     where: searchQuery
//       ? {
//           OR: [
//             { title: { contains: searchQuery, mode: "insensitive" } },
//             { user: { name: { contains: searchQuery, mode: "insensitive" } } },
//           ],
//         }
//       : undefined,
//     orderBy: { createdAt: "desc" },
//     select: {
//       id: true,
//       title: true,
//       smallDescription: true,
//       status: true,
//       type: true,
//       price: true,
//       slug: true,
//       user: {
//         select: {
//           name: true,
//         },
//       },
//       course: {
//         select: {
//           imageKey: true,
//           duration: true,
//           chapter: {
//             orderBy: { position: "asc" },
//             select: {
//               id: true,
//               title: true,
//               lessons: {
//                 orderBy: { position: "asc" },
//                 select: {
//                   id: true,
//                   title: true,
//                   videoKey: true,
//                   // Removed isFreePreview
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   });

//   return products.map((product) => ({
//     id: product.id,
//     title: product.title,
//     smallDescription: product.smallDescription ?? "",
//     status: product.status,
//     type: product.type,
//     price: product.price ?? 0,
//     slug: product.slug,
//     duration: product.course?.duration ?? 0,
//     fileKey: product.course?.imageKey ?? "",
//     educatorName: product.user?.name || "Unknown Educator",

//     course: product.course
//       ? {
//           ...product.course,
//           chapter: product.course.chapter.map((chap) => ({
//             ...chap,
//             lessons: chap.lessons.map((lesson) => ({
//               id: lesson.id,
//               title: lesson.title,
//               videoUrl: lesson.videoKey
//                 ? lesson.videoKey.startsWith("http")
//                   ? lesson.videoKey
//                   : `https://utfs.io/f/${lesson.videoKey}`
//                 : null,
//             })),
//           })),
//         }
//       : null,
//   }));
// }
