"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export interface EducatorProfileData {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  experience: number | null;
  description: string | null;
  verificationStatus: string | null;
}

export async function getEducator(): Promise<EducatorProfileData> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const educator = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      experience: true,
      description: true,
      verificationStatus: true,
    },
  });

  if (!educator) {
    throw new Error("Educator profile not found");
  }

  // Cast verificationStatus enum to string to match component expected props
  return {
    ...educator,
    verificationStatus: educator.verificationStatus
      ? String(educator.verificationStatus)
      : null,
  };
}

export async function updateEducatorProfile(data: {
  name: string;
  imageUrl: string;
  experience: number;
  description: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: {
      email: session.user.email,
    },
    data: {
      name: data.name,
      imageUrl: data.imageUrl,

      experience: data.experience,
      description: data.description,
    },
  });

  return {
    success: true,
  };
}

// "use server";

// import { auth } from "@/lib/auth";
// import prisma from "@/lib/prisma";
// import { headers } from "next/headers";

// export async function getEducator() {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user?.email) {
//     throw new Error("Unauthorized");
//   }

//   const educator = await prisma.user.findUnique({
//     where: {
//       email: session.user.email,
//     },

//     select: {
//       id: true,
//       name: true,
//       email: true,
//       imageUrl: true,

//       // educator fields
//       specialty: true,
//       experience: true,
//       description: true,
//       credentialUrl: true,
//       verificationStatus: true,

//       role: true,

//       createdAt: true,
//       updatedAt: true,
//     },
//   });

//   if (!educator) {
//     throw new Error("Educator profile not found");
//   }

//   return educator;
// }

// export async function updateEducatorProfile(data: {
//   name: string;
//   imageUrl: string;
//   specialty: string;
//   experience: number;
//   description: string;
//   credentialUrl: string;
// }) {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user?.email) {
//     throw new Error("Unauthorized");
//   }

//   await prisma.user.update({
//     where: {
//       email: session.user.email,
//     },
//     data: {
//       name: data.name,
//       imageUrl: data.imageUrl,
//       specialty: data.specialty,
//       experience: data.experience,
//       description: data.description,
//       credentialUrl: data.credentialUrl,
//     },
//   });

//   return {
//     success: true,
//   };
// }
