// @/app/actions/get-all-products.ts
import { ProductType } from "@/lib/generated/prisma/enums";
import prisma from "@/lib/prisma";

import "server-only";

export async function getAllProducts(
  typeFilter?: string,
  searchQuery?: string,
) {
  try {
    const validProductType =
      typeFilter &&
      Object.values(ProductType).includes(typeFilter as ProductType)
        ? (typeFilter as ProductType)
        : undefined;

    const products = await prisma.product.findMany({
      where: {
        status: "Published",
        ...(validProductType ? { type: validProductType } : {}),
        ...(searchQuery
          ? {
              OR: [
                { title: { contains: searchQuery, mode: "insensitive" } },
                {
                  smallDescription: {
                    contains: searchQuery,
                    mode: "insensitive",
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
        smallDescription: true,
        price: true,
        type: true,
        slug: true,
        status: true,
        course: {
          select: {
            duration: true,
            category: true,
            imageKey: true,
          },
        },
        digitalProduct: {
          select: {
            images: {
              orderBy: { position: "asc" },
              take: 1,
              select: {
                imageKey: true,
              },
            },
          },
        },
      },
    });

    return products.map((item) => {
      const isCourse = item.course !== null;

      const imageKey = isCourse
        ? item.course?.imageKey || null
        : item.digitalProduct?.images?.[0]?.imageKey || null;

      const category = isCourse
        ? item.course?.category || "General"
        : "Digital Product";

      const duration = isCourse ? item.course?.duration || null : null;

      return {
        id: item.id,
        imageKey,
        duration,
        category,
        product: {
          title: item.title,
          smallDescription: item.smallDescription ?? "",
          price: item.price ?? 0,
          slug: item.slug,
          status: item.status,
        },
      };
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export type PublicProductsType = Awaited<ReturnType<typeof getAllProducts>>[0];

// // @/app/actions/get-all-products.ts

// import { ProductType } from "@/lib/generated/prisma/enums";
// import prisma from "@/lib/prisma";

// import "server-only";

// export async function getAllProducts(typeFilter?: string) {
//   try {
//     // Safely parse or validate the string against ProductType enum
//     const validProductType =
//       typeFilter &&
//       Object.values(ProductType).includes(typeFilter as ProductType)
//         ? (typeFilter as ProductType)
//         : undefined;

//     const products = await prisma.product.findMany({
//       where: {
//         status: "Published",
//         ...(validProductType ? { type: validProductType } : {}),
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//       select: {
//         id: true,
//         title: true,
//         smallDescription: true,
//         price: true,
//         type: true,
//         slug: true,
//         status: true,
//         // Explicitly select relations so TypeScript knows they exist on `item`
//         course: {
//           select: {
//             duration: true,
//             category: true,
//             imageKey: true,
//           },
//         },
//         digitalProduct: {
//           select: {
//             images: {
//               orderBy: { position: "asc" },
//               take: 1,
//               select: {
//                 imageKey: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     // Map each item to the unified shape PublicProductCard expects
//     return products.map((item) => {
//       const isCourse = item.course !== null;

//       const imageKey = isCourse
//         ? item.course?.imageKey || null
//         : item.digitalProduct?.images?.[0]?.imageKey || null;

//       const category = isCourse
//         ? item.course?.category || "General"
//         : "Digital Product";

//       const duration = isCourse ? item.course?.duration || null : null;

//       return {
//         id: item.id,
//         imageKey,
//         duration,
//         category,
//         product: {
//           title: item.title,
//           smallDescription: item.smallDescription ?? "",
//           price: item.price ?? 0,
//           slug: item.slug,
//           status: item.status,
//         },
//       };
//     });
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     return [];
//   }
// }

// export type PublicProductsType = Awaited<ReturnType<typeof getAllProducts>>[0];

// // @/app/actions/get-all-courses.ts
// import prisma from "@/lib/prisma";
// import "server-only";

// export async function getAllProducts() {
//   try {
//     const data = await prisma.course.findMany({
//       where: {
//         product: {
//           status: "Published",
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//       select: {
//         id: true,
//         duration: true,
//         category: true,
//         imageKey: true,

//         product: {
//           select: {
//             title: true,
//             price: true,
//             smallDescription: true,
//             slug: true,
//             status: true,
//           },
//         },
//       },
//     });

//     return data;
//   } catch (error) {
//     console.error("Error fetching courses:", error);
//     return [];
//   }
// }

// export type PublicProductsType = Awaited<ReturnType<typeof getAllProducts>>[0];
