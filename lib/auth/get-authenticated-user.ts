import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const getAuthenticatedUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      phoneNumber: true,
      role: true,
      onboardingCompleted: true,
      status: true,
      verificationStatus: true,
      stripeCustomerId: true,

      

      teachingProfile: {
        select: {
          id: true,
          headline: true,
          specialty: true,
          experience: true,
          credentialUrl: true,
          description: true,
          verificationStatus: true,
          hourlyRate: true,
          currency: true,
          subjects: true,
          gradeLevels: true,
        },
      },

    
      // Temporary compatibility for existing tutoring/auth consumers.
     
    },
  });
});
