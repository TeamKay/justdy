import "server-only";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

export async function getIndividualProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: {
      slug: slug,
    },
    select: {
      id: true,
      title: true,
      smallDescription: true,
      price: true,
      slug: true,
      status: true,
      // 1. Digital product relation & image keys
      digitalProduct: {
        select: {
          id: true,
          fileKey: true,
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
        },
      },
      // 2. Course relation & structure
      course: {
        select: {
          id: true,
          category: true,
          imageKey: true,
          duration: true,
          chapter: {
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
      },
    },
  });

  if (!product) {
    return notFound();
  }

  return product;
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
