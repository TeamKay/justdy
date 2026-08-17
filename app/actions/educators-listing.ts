"use server";

import "server-only";

import prisma from "@/lib/prisma";

export async function getAllEducators() {
  try {
    const educators = await prisma.user.findMany({
      where: {
        role: "Educator",
        verificationStatus: "Verified",
        status: "Active",
      },

      orderBy: {
        name: "asc",
      },

      select: {
        // ==========================================================
        // USER
        // ==========================================================

        id: true,
        name: true,
        email: true,
        imageUrl: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        phoneNumber: true,
        onboardingCompleted: true,
        lastLoginAt: true,
        verificationStatus: true,

        // ==========================================================
        // EDUCATOR PROFILE
        // ==========================================================

        facilitatorProfile: {
          select: {
            specialty: true,
            experience: true,
            description: true,
            credentialUrl: true,
            verificationStatus: true,
          },
        },
      },
    });

    // ==========================================================
    // CONVERT DATABASE RESULT INTO EDUCATOR UI TYPE
    // ==========================================================

    const formattedEducators = educators.map((educator) => ({
      id: educator.id,
      name: educator.name,
      email: educator.email,

      imageUrl: educator.imageUrl,

      role: educator.role,
      status: educator.status,

      createdAt: educator.createdAt,
      updatedAt: educator.updatedAt,

      emailVerified: educator.emailVerified,

      phoneNumber: educator.phoneNumber,

      onboardingCompleted: educator.onboardingCompleted,

      lastLoginAt: educator.lastLoginAt,

      verificationStatus: educator.verificationStatus,

      // ----------------------------------------------------------
      // FACILITATOR PROFILE
      // ----------------------------------------------------------

      specialty: educator.facilitatorProfile?.specialty ?? null,

      experience: educator.facilitatorProfile?.experience ?? null,

      description: educator.facilitatorProfile?.description ?? null,

      credentialUrl: educator.facilitatorProfile?.credentialUrl ?? null,
    }));

    return {
      educators: formattedEducators,
      error: null,
    };
  } catch (error) {
    console.error("GET ALL EDUCATORS ERROR:", error);

    return {
      educators: [],
      error:
        error instanceof Error ? error.message : "Failed to load educators.",
    };
  }
}
