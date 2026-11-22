
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import EducatorManagementView, {
  type EducatorManagementRow,
} from "@/app/_components/EducatorManagementView";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function jsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export default async function EducatorManagementPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth?mode=signin");
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
      emailVerified: true,
    },
  });

  if (!currentUser) {
    redirect("/auth?mode=signin");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  if (!currentUser.emailVerified) {
    redirect("/verify-email-notice");
  }

  const [teachingProfiles, tutorApplications] = await Promise.all([
    prisma.teachingProfile.findMany({
      where: {
        user: {
          role: "TUTOR",
          status: {
            not: "Deleted",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        userId: true,
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
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }),

    prisma.tutorApplication.findMany({
      where: {
        OR: [
          {
            userId: null,
          },
          {
            user: {
              status: {
                not: "Deleted",
              },
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        phoneNumber: true,
        headline: true,
        specialty: true,
        experience: true,
        credentialUrl: true,
        description: true,
        hourlyRate: true,
        currency: true,
        subjects: true,
        gradeLevels: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  type TeachingProfileRecord = (typeof teachingProfiles)[number];
  type TutorApplicationRecord = (typeof tutorApplications)[number];

  const profileByUserId = new Map<string, TeachingProfileRecord>(
    teachingProfiles.map((profile) => [profile.userId, profile]),
  );

  const applicationUserIds = new Set(
    tutorApplications
      .map((application) => application.userId)
      .filter((userId): userId is string => Boolean(userId)),
  );

  const applicationRows: EducatorManagementRow[] = tutorApplications.map(
    (application: TutorApplicationRecord) => {
      const profile = application.userId
        ? profileByUserId.get(application.userId) ?? null
        : null;

      const user = application.user ?? profile?.user ?? null;

      let status: EducatorManagementRow["status"];

      if (user?.status === "Suspended") {
        status = "Suspended";
      } else if (application.status === "Pending") {
        status = "Pending";
      } else if (application.status === "Rejected") {
        status = "Rejected";
      } else {
        status = "Approved";
      }

      return {
        id: `application-${application.id}`,
        name: user?.name || application.name,
        email: user?.email || application.email,
        imageUrl: user?.imageUrl ?? null,
        accountStatus: user?.status ?? null,
        joinedAt: user?.createdAt.toISOString() ?? null,
        status,

        application: {
          id: application.id,
          status: application.status,
          name: application.name,
          email: application.email,
          phoneNumber: application.phoneNumber,
          headline: application.headline,
          specialty: application.specialty,
          experience: application.experience,
          credentialUrl: application.credentialUrl,
          description: application.description,
          hourlyRate: application.hourlyRate,
          currency: String(application.currency),
          subjects: jsonStringArray(application.subjects),
          gradeLevels: jsonStringArray(application.gradeLevels),
          createdAt: application.createdAt.toISOString(),
        },

        profile: profile
          ? {
              id: profile.id,
              userId: profile.userId,
              headline: profile.headline,
              specialty: profile.specialty,
              experience: profile.experience,
              credentialUrl: profile.credentialUrl,
              description: profile.description,
              hourlyRate: profile.hourlyRate,
              currency: String(profile.currency),
              subjects: jsonStringArray(profile.subjects),
              gradeLevels: jsonStringArray(profile.gradeLevels),
              verificationStatus:
                profile.verificationStatus === "Verified"
                  ? "Verified"
                  : profile.verificationStatus === "Rejected"
                    ? "Rejected"
                    : "Pending",
            }
          : null,
      };
    },
  );

  const legacyProfileRows: EducatorManagementRow[] = teachingProfiles
    .filter((profile) => !applicationUserIds.has(profile.userId))
    .map((profile) => {
      const status: EducatorManagementRow["status"] =
        profile.user.status === "Suspended"
          ? "Suspended"
          : profile.verificationStatus === "Verified"
            ? "Approved"
            : profile.verificationStatus === "Rejected"
              ? "Rejected"
              : "Pending";

      return {
        id: `profile-${profile.id}`,
        name: profile.user.name,
        email: profile.user.email,
        imageUrl: profile.user.imageUrl,
        accountStatus: profile.user.status,
        joinedAt: profile.user.createdAt.toISOString(),
        status,
        application: null,
        profile: {
          id: profile.id,
          userId: profile.userId,
          headline: profile.headline,
          specialty: profile.specialty,
          experience: profile.experience,
          credentialUrl: profile.credentialUrl,
          description: profile.description,
          hourlyRate: profile.hourlyRate,
          currency: String(profile.currency),
          subjects: jsonStringArray(profile.subjects),
          gradeLevels: jsonStringArray(profile.gradeLevels),
          verificationStatus:
            profile.verificationStatus === "Verified"
              ? "Verified"
              : profile.verificationStatus === "Rejected"
                ? "Rejected"
                : "Pending",
        },
      };
    });

  const educators = [...applicationRows, ...legacyProfileRows].sort(
    (a, b) => {
      const dateA = new Date(
        a.application?.createdAt ?? a.joinedAt ?? 0,
      ).getTime();

      const dateB = new Date(
        b.application?.createdAt ?? b.joinedAt ?? 0,
      ).getTime();

      return dateB - dateA;
    },
  );

  return <EducatorManagementView educators={educators} />;
}
