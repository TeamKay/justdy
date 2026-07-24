import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function checkIfCourseBought(productId: string): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return false;

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      course: {
        productId: productId,
      },
    },
    select: {
      status: true,
    },
  });

  return enrollment?.status === "Active" || enrollment?.status === "Pending"; // Adjust active status string based on your EnrollmentStatus enum
}

// import "server-only";

// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";
// import prisma from "@/lib/prisma";

// export async function checkIfCourseBought(productId: string): Promise<boolean> {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user) return false;

//   const enrollment = await prisma.enrollment.findUnique({
//     where: {
//       userId_productId: {
//         productId: productId,
//         userId: session.user.id,
//       },
//     },
//     select: {
//       status: true,
//     },
//   });

//   return enrollment?.status === "Active" ? true : false;
// }
