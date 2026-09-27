import prisma from "@/lib/prisma";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";

export async function getVerifiedTutor(userId: string) {
  if (!userId) return null;

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      status: "Active",
      teachingProfile: {
        verificationStatus: "Verified",
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

  if (!user?.teachingProfile) return null;

  if (!(await hasCapability(userId, CAPABILITIES.TUTOR))) return null;

  return user;
}

export async function canProvideTutoring(userId: string) {
  return Boolean(await getVerifiedTutor(userId));
}

export async function requireVerifiedTutor(userId: string) {
  const tutor = await getVerifiedTutor(userId);
  if (!tutor) {
    throw new Error("Verified tutor access is required.");
  }
  return tutor;
}

export async function canTeach(userId: string) {
  return hasCapability(userId, CAPABILITIES.TEACH);
}

export async function getVerifiedTutorByTeachingProfileId(
  teachingProfileId: string,
) {
  const profile = await prisma.teachingProfile.findFirst({
    where: {
      id: teachingProfileId,
      verificationStatus: "Verified",
      user: {
        status: "Active",
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

  if (!profile) return null;

  if (!(await hasCapability(profile.user.id, CAPABILITIES.TUTOR))) {
    return null;
  }

  return profile.user;
}
