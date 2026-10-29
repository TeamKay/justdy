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

      learningProfile: {
        select: {
          id: true,
          gradeLevel: true,
          schoolName: true,
          learningGoals: true,
          preferredSubjects: true,
          interests: true,
          preferredLanguage: true,
          timezone: true,
        },
      },

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

      creatorProfile: {
        select: {
          id: true,
          displayName: true,
          bio: true,
          specialties: true,
          websiteUrl: true,
          socialLinks: true,
        },
      },

      permissions: {
        select: {
          permission: true,
        },
      },

      // Temporary compatibility for existing tutoring/auth consumers.
      facilitatorProfile: {
        select: {
          specialty: true,
          experience: true,
          credentialUrl: true,
          description: true,
          verificationStatus: true,
        },
      },
    },
  });
});
