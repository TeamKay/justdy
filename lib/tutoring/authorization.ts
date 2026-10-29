import prisma from "@/lib/prisma";

export async function getVerifiedTutor(userId: string) {
  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      status: "Active",
      teachingProfile: {
        is: {
          verificationStatus: "Verified",
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      teachingProfile: {
        select: {
          id: true,
          headline: true,
          verificationStatus: true,
        },
      },
    },
  });
}

export async function canProvideTutoring(
  userId: string,
): Promise<boolean> {
  return Boolean(await getVerifiedTutor(userId));
}

export async function requireVerifiedTutor(userId: string) {
  const tutor = await getVerifiedTutor(userId);

  if (!tutor) {
    throw new Error("Verified tutor access is required.");
  }

  return tutor;
}

export async function canTeach(userId: string): Promise<boolean> {
  return canProvideTutoring(userId);
}

export async function getVerifiedTutorByTeachingProfileId(
  teachingProfileId: string,
) {
  const profile = await prisma.teachingProfile.findFirst({
    where: {
      id: teachingProfileId,
      verificationStatus: "Verified",
      user: {
        is: {
          status: "Active",
        },
      },
    },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },
    },
  });

  return profile?.user ?? null;
}