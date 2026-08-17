import { ProductStatus, ProductType } from "@/lib/generated/prisma/enums";
import prisma from "@/lib/prisma";

export type ProductTableType = {
  id: string;
  title: string;
  description: string;
  status: ProductStatus;
  type: ProductType;
  price: number;
  slug: string;
  duration: number;
  fileKey: string;
  educatorName: string;
  mainVideoUrl?: string | null;
  digitalProductImages?: string[];
  course?: {
    duration: number | null;
    imageKey: string | null;
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

export async function GetAllProducts(
  type?: ProductType,
  searchQuery?: string,
): Promise<ProductTableType[]> {
  const products = await prisma.product.findMany({
    where: {
      ...(type
        ? {
            type,
          }
        : {}),

      ...(searchQuery
        ? {
            OR: [
              {
                title: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
              {
                user: {
                  name: {
                    contains: searchQuery,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      title: true,
      status: true,
      description: true,
      type: true,
      price: true,
      slug: true,
      duration: true,
      imageKey: true,

      user: {
        select: {
          name: true,
        },
      },

      images: {
        orderBy: {
          position: "asc",
        },
        select: {
          imageKey: true,
        },
      },

      chapters: {
        orderBy: {
          position: "asc",
        },

        select: {
          id: true,
          title: true,

          lessons: {
            orderBy: {
              position: "asc",
            },

            select: {
              id: true,
              title: true,
              videoKey: true,
            },
          },
        },
      },
    },
  });

  return products.map((product) => {
    const courseData =
      product.type === ProductType.Course
        ? {
            duration: product.duration,
            imageKey: product.imageKey,
            chapter: product.chapters.map(
              (chap: {
                id: string;
                title: string;
                lessons: Array<{
                  id: string;
                  title: string;
                  videoKey: string | null;
                }>;
              }) => ({
                id: chap.id,
                title: chap.title,

                lessons: chap.lessons.map(
                  (lesson: {
                    id: string;
                    title: string;
                    videoKey: string | null;
                  }) => ({
                    id: lesson.id,
                    title: lesson.title,

                    videoUrl: lesson.videoKey
                      ? lesson.videoKey.startsWith("http")
                        ? lesson.videoKey
                        : `https://utfs.io/f/${lesson.videoKey}`
                      : null,
                  }),
                ),
              }),
            ),
          }
        : null;

    const mainVideoUrl =
      courseData?.chapter?.[0]?.lessons?.[0]?.videoUrl ?? null;

    return {
      id: product.id,
      title: product.title,
      description: product.description ?? "",
      status: product.status,
      type: product.type,
      price: (product.price ?? 0) / 100,
      slug: product.slug,
      duration: product.duration ?? 0,
      fileKey: product.imageKey ?? "",
      educatorName: product.user?.name || "Unknown Educator",
      mainVideoUrl,
      digitalProductImages:
        product.images?.map((img: { imageKey: string }) => img.imageKey) ?? [],
      course: courseData,
    };
  });
}

export async function GetAllPublishedProducts(
  type?: ProductType,
  searchQuery?: string,
): Promise<ProductTableType[]> {
  const products = await prisma.product.findMany({
    where: {
      status: ProductStatus.Published,

      ...(type
        ? {
            type,
          }
        : {}),

      ...(searchQuery
        ? {
            OR: [
              {
                title: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
              {
                user: {
                  name: {
                    contains: searchQuery,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      title: true,
      status: true,
      description: true,
      type: true,
      price: true,
      slug: true,
      duration: true,
      imageKey: true,

      user: {
        select: {
          name: true,
        },
      },

      images: {
        orderBy: {
          position: "asc",
        },
        select: {
          imageKey: true,
        },
      },

      chapters: {
        orderBy: {
          position: "asc",
        },

        select: {
          id: true,
          title: true,

          lessons: {
            orderBy: {
              position: "asc",
            },

            select: {
              id: true,
              title: true,
              videoKey: true,
            },
          },
        },
      },
    },
  });

  return products.map((product) => {
    const courseData =
      product.type === ProductType.Course
        ? {
            duration: product.duration,
            imageKey: product.imageKey,
            chapter: product.chapters.map(
              (chap: {
                id: string;
                title: string;
                lessons: Array<{
                  id: string;
                  title: string;
                  videoKey: string | null;
                }>;
              }) => ({
                id: chap.id,
                title: chap.title,

                lessons: chap.lessons.map(
                  (lesson: {
                    id: string;
                    title: string;
                    videoKey: string | null;
                  }) => ({
                    id: lesson.id,
                    title: lesson.title,

                    videoUrl: lesson.videoKey
                      ? lesson.videoKey.startsWith("http")
                        ? lesson.videoKey
                        : `https://utfs.io/f/${lesson.videoKey}`
                      : null,
                  }),
                ),
              }),
            ),
          }
        : null;

    const mainVideoUrl =
      courseData?.chapter?.[0]?.lessons?.[0]?.videoUrl ?? null;

    return {
      id: product.id,
      title: product.title,
      description: product.description ?? "",
      status: product.status,
      type: product.type,
      price: (product.price ?? 0) / 100,
      slug: product.slug,
      duration: product.duration ?? 0,
      fileKey: product.imageKey ?? "",
      educatorName: product.user?.name || "Unknown Educator",
      mainVideoUrl,
      digitalProductImages:
        product.images?.map((img: { imageKey: string }) => img.imageKey) ?? [],
      course: courseData,
    };
  });
}

// import { ProductStatus, ProductType } from "@/lib/generated/prisma/enums";
// import prisma from "@/lib/prisma";

// export type ProductTableType = {
//   id: string;
//   title: string;
//   description: string;
//   status: ProductStatus;
//   type: ProductType;
//   price: number;
//   slug: string;
//   duration: number;
//   fileKey: string;
//   educatorName: string;
//   mainVideoUrl?: string | null;
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

// export async function GetAllProducts(
//   type?: ProductType,
//   searchQuery?: string,
// ): Promise<ProductTableType[]> {
//   const products = await prisma.product.findMany({
//     where: {
//       ...(type
//         ? {
//             type,
//           }
//         : {}),

//       ...(searchQuery
//         ? {
//             OR: [
//               {
//                 title: {
//                   contains: searchQuery,
//                   mode: "insensitive",
//                 },
//               },
//               {
//                 user: {
//                   name: {
//                     contains: searchQuery,
//                     mode: "insensitive",
//                   },
//                 },
//               },
//             ],
//           }
//         : {}),
//     },

//     orderBy: {
//       createdAt: "desc",
//     },

//     select: {
//       id: true,
//       title: true,
//       status: true,
//       description: true,
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
//             orderBy: {
//               position: "asc",
//             },
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
//             orderBy: {
//               position: "asc",
//             },

//             select: {
//               id: true,
//               title: true,

//               lessons: {
//                 orderBy: {
//                   position: "asc",
//                 },

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

//   return products.map((product) => {
//     const courseData = product.course
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
//       : null;

//     const mainVideoUrl =
//       courseData?.chapter?.[0]?.lessons?.[0]?.videoUrl ?? null;

//     return {
//       id: product.id,
//       title: product.title,
//       description: product.description ?? "",
//       status: product.status,
//       type: product.type,
//       price: (product.price ?? 0) / 100,
//       slug: product.slug,
//       duration: product.course?.duration ?? 0,
//       fileKey: product.course?.imageKey ?? "",
//       educatorName: product.user?.name || "Unknown Educator",
//       mainVideoUrl,
//       digitalProductImages:
//         product.digitalProduct?.images.map((img) => img.imageKey) ?? [],
//       course: courseData,
//     };
//   });
// }

// export async function GetAllPublishedProducts(
//   type?: ProductType,
//   searchQuery?: string,
// ): Promise<ProductTableType[]> {
//   const products = await prisma.product.findMany({
//     where: {
//       status: ProductStatus.Published,

//       ...(type
//         ? {
//             type,
//           }
//         : {}),

//       ...(searchQuery
//         ? {
//             OR: [
//               {
//                 title: {
//                   contains: searchQuery,
//                   mode: "insensitive",
//                 },
//               },
//               {
//                 user: {
//                   name: {
//                     contains: searchQuery,
//                     mode: "insensitive",
//                   },
//                 },
//               },
//             ],
//           }
//         : {}),
//     },

//     orderBy: {
//       createdAt: "desc",
//     },

//     select: {
//       id: true,
//       title: true,
//       status: true,
//       description: true,
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
//             orderBy: {
//               position: "asc",
//             },
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
//             orderBy: {
//               position: "asc",
//             },

//             select: {
//               id: true,
//               title: true,

//               lessons: {
//                 orderBy: {
//                   position: "asc",
//                 },

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

//   return products.map((product) => {
//     const courseData = product.course
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
//       : null;

//     const mainVideoUrl =
//       courseData?.chapter?.[0]?.lessons?.[0]?.videoUrl ?? null;

//     return {
//       id: product.id,
//       title: product.title,
//       description: product.description ?? "",
//       status: product.status,
//       type: product.type,
//       price: (product.price ?? 0) / 100,
//       slug: product.slug,

//       duration: product.course?.duration ?? 0,

//       fileKey: product.course?.imageKey ?? "",

//       educatorName: product.user?.name || "Unknown Educator",

//       mainVideoUrl,

//       digitalProductImages:
//         product.digitalProduct?.images.map((img) => img.imageKey) ?? [],

//       course: courseData,
//     };
//   });
// }
