import "server-only";

import { notFound } from "next/navigation";

import prisma from "@/lib/prisma";

export async function getIndividualProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: {
      slug,
    },

    select: {
      id: true,
      title: true,
      description: true,

      /*
       * Both prices are stored in cents
       * in the database.
       */
      price: true,
      printedPrice: true,

      slug: true,
      status: true,
      type: true,
      category: true,

      imageKey: true,

      duration: true,

      fileKey: true,
      fileType: true,
      fileSize: true,

      /* ================================================================
           PRODUCT CREATOR
        ================================================================= */

      user: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },

      /* ================================================================
           PRODUCT IMAGES
        ================================================================= */

      images: {
        select: {
          id: true,
          imageKey: true,
          position: true,
        },

        orderBy: {
          position: "asc",
        },
      },

      /* ================================================================
           COURSE CHAPTERS
        ================================================================= */

      chapters: {
        select: {
          id: true,
          title: true,

          lessons: {
            select: {
              id: true,
              title: true,
            },

            orderBy: {
              position: "asc",
            },
          },
        },

        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!product) {
    return notFound();
  }

  return {
    ...product,

    // Keep prices exactly as stored in the database
    price: product.price,

    printedPrice: product.printedPrice,

    // Creator information
    educatorName: product.user.name,

    educatorImage: product.user.imageUrl,
  };
}

// import "server-only";
// import { notFound } from "next/navigation";
// import prisma from "@/lib/prisma";

// export async function getIndividualProduct(slug: string) {
//   const product = await prisma.product.findUnique({
//     where: {
//       slug: slug,
//     },
//     select: {
//       id: true,
//       title: true,
//       description: true,
//       price: true,
//       slug: true,
//       status: true,

//       // Product creator / educator
//       user: {
//         select: {
//           id: true,
//           name: true,
//           imageUrl: true,
//         },
//       },

//       // Digital product relation & image keys
//       digitalProduct: {
//         select: {
//           id: true,
//           fileKey: true,
//           images: {
//             select: {
//               id: true,
//               imageKey: true,
//               position: true,
//             },
//             orderBy: {
//               position: "asc",
//             },
//           },
//         },
//       },

//       // Course relation & structure
//       course: {
//         select: {
//           id: true,
//           category: true,
//           imageKey: true,
//           duration: true,
//           chapter: {
//             select: {
//               id: true,
//               title: true,
//               lessons: {
//                 select: {
//                   id: true,
//                   title: true,
//                 },
//                 orderBy: {
//                   position: "asc",
//                 },
//               },
//             },
//             orderBy: {
//               position: "asc",
//             },
//           },
//         },
//       },
//     },
//   });

//   if (!product) {
//     return notFound();
//   }

//   return {
//     ...product,

//     // Convert cents to dollars
//     price: (product.price ?? 0) / 100,

//     // Make creator name easily available
//     educatorName: product.user.name,

//     // Optional creator image
//     educatorImage: product.user.imageUrl,
//   };
// }

// import "server-only";
// import { notFound } from "next/navigation";
// import prisma from "@/lib/prisma";

// export async function getIndividualProduct(slug: string) {
//   const product = await prisma.product.findUnique({
//     where: {
//       slug: slug,
//     },
//     select: {
//       id: true,
//       title: true,
//       description: true,
//       price: true,
//       slug: true,
//       status: true,

//       // 1. Digital product relation & image keys
//       digitalProduct: {
//         select: {
//           id: true,
//           fileKey: true,
//           images: {
//             select: {
//               id: true,
//               imageKey: true,
//               position: true,
//             },
//             orderBy: {
//               position: "asc",
//             },
//           },
//         },
//       },

//       // 2. Course relation & structure
//       course: {
//         select: {
//           id: true,
//           category: true,
//           imageKey: true,
//           duration: true,
//           chapter: {
//             select: {
//               id: true,
//               title: true,
//               lessons: {
//                 select: {
//                   id: true,
//                   title: true,
//                 },
//                 orderBy: {
//                   position: "asc",
//                 },
//               },
//             },
//             orderBy: {
//               position: "asc",
//             },
//           },
//         },
//       },
//     },
//   });

//   if (!product) {
//     return notFound();
//   }

//   return {
//     ...product,
//     price: (product.price ?? 0) / 100,
//   };
// }

// import "server-only";
// import { notFound } from "next/navigation";
// import prisma from "@/lib/prisma";

// export async function getIndividualProduct(slug: string) {
//   const product = await prisma.product.findUnique({
//     where: {
//       slug: slug,
//     },
//     select: {
//       id: true,
//       title: true,
//       description: true,
//       price: true,
//       slug: true,
//       status: true,
//       // 1. Digital product relation & image keys
//       digitalProduct: {
//         select: {
//           id: true,
//           fileKey: true,
//           images: {
//             select: {
//               id: true,
//               imageKey: true,
//               position: true,
//             },
//             orderBy: {
//               position: "asc",
//             },
//           },
//         },
//       },
//       // 2. Course relation & structure
//       course: {
//         select: {
//           id: true,
//           category: true,
//           imageKey: true,
//           duration: true,
//           chapter: {
//             select: {
//               id: true,
//               title: true,
//               lessons: {
//                 select: {
//                   id: true,
//                   title: true,
//                 },
//                 orderBy: {
//                   position: "asc",
//                 },
//               },
//             },
//             orderBy: {
//               position: "asc",
//             },
//           },
//         },
//       },
//     },
//   });

//   if (!product) {
//     return notFound();
//   }

//   return product;
// }

// import "server-only";
// import { notFound } from "next/navigation";
// import prisma from "@/lib/prisma";

// export async function getIndividualProduct(slug: string) {
//   const product = await prisma.product.findUnique({
//     where: {
//       slug: slug,
//     },
//     select: {
//       id: true,
//       title: true,
//       smallDescription: true,
//       price: true,
//       slug: true,
//       status: true,
//       course: {
//         select: {
//           id: true,
//           category: true,
//           imageKey: true,
//           duration: true,
//           chapter: {
//             select: {
//               id: true,
//               title: true,
//               lessons: {
//                 select: {
//                   id: true,
//                   title: true,
//                 },
//                 orderBy: {
//                   position: "asc",
//                 },
//               },
//             },
//             orderBy: {
//               position: "asc",
//             },
//           },
//         },
//       },
//     },
//   });

//   if (!product) {
//     return notFound();
//   }

//   return product;
// }
