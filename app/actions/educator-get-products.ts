import "server-only";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireManager } from "./require-manager";

export async function educatorGetProducts() {
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
      status: true,
      price: true,
      type: true,
      slug: true,
      user: {
        select: {
          name: true,
        },
      },
      course: {
        select: {
          imageKey: true,
          _count: {
            select: {
              enrollment: true,
            },
          },
        },
      },
      // 1. Explicitly select the nested images sorted by position
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
    },
  });

  // 2. Map the data so digitalProductImages is a flat array of string keys
  return data.map((product) => ({
    ...product,
    educatorName: product.user.name,
    fileKey: product.course?.imageKey ?? "",
    digitalProductImages:
      product.digitalProduct?.images.map((img) => img.imageKey) ?? [],
  }));
}

export type EducatorProductType = Awaited<
  ReturnType<typeof educatorGetProducts>
>[number];

// import "server-only";

// import prisma from "@/lib/prisma";
// import { requireEducator } from "./require-educator";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";

// export async function educatorGetProducts() {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });
//   const userId = session?.user?.id;

//   await requireEducator();
//   if (!userId) throw new Error("Unauthorized");

//   const data = await prisma.product.findMany({
//     where: { userId: userId },
//     orderBy: { createdAt: "desc" },
//     select: {
//       id: true,
//       title: true,
//       smallDescription: true,
//       status: true,
//       price: true,
//       type: true,
//       slug: true,
//       user: {
//         select: {
//           name: true,
//         },
//       },
//       course: {
//         select: {
//           imageKey: true,
//           _count: {
//             select: {
//               enrollment: true,
//             },
//           },
//         },
//       },
//       digitalProduct: true,
//     },
//   });

//   // 2. Map the data to include "educatorName" at the top level
//   return data.map((product) => ({
//     ...product,
//     educatorName: product.user.name,
//   }));
// }

// export type EducatorProductType = Awaited<
//   ReturnType<typeof educatorGetProducts>
// >[number];
