"use server";

import prisma from "@/lib/prisma";

export async function getAllEducators() {
  try {
    const educators = await prisma.user.findMany({
      where: {
        role: "Educator",
        verificationStatus: "Verified",
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        specialty: true,
        experience: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { educators };
  } catch (error) {
    console.error("Failed to fetch all educators:", error);
    return { error: "Failed to fetch educators", educators: [] };
  }
}

// "use server";

// import prisma from "@/lib/prisma";

// export async function getEducatorsBySpecialty(specialty: string) {
//   try {
//     const educators = await prisma.user.findMany({
//       where: {
//         role: "Educator",
//         verificationStatus: "Verified",
//         specialty: specialty,
//       },
//       select: {
//         id: true,
//         name: true,
//         imageUrl: true,
//         specialty: true,
//         experience: true,
//         description: true,
//       },
//       orderBy: {
//         name: "asc",
//       },
//     });

//     return { educators };
//   } catch (error) {
//     console.error("Failed to fetch educators by specialty:", error);
//     return { error: "Failed to fetch educators" };
//   }
// }
