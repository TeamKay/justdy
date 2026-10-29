import { headers } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

import TutorApplicationsView from "@/app/_components/TutorApplicationsView";

export const dynamic = "force-dynamic";

type ApplicationStatus = "Pending" | "Verified" | "Rejected";

type SearchParams = {
  status?: string;
};

function normalizeStatus(value: string | undefined): ApplicationStatus {
  if (value === "Pending" || value === "Verified" || value === "Rejected") {
    return value;
  }

  return "Pending";
}

function jsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export default async function TutorApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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

  const params = await searchParams;

  const selectedStatus = normalizeStatus(params.status);

  const [pendingCount, verifiedCount, rejectedCount, totalCount, applications] =
    await Promise.all([
      prisma.teachingProfile.count({
        where: {
          verificationStatus: "Pending",
          user: {
            status: {
              not: "Deleted",
            },
          },
        },
      }),

      prisma.teachingProfile.count({
        where: {
          verificationStatus: "Verified",
          user: {
            status: {
              not: "Deleted",
            },
          },
        },
      }),

      prisma.teachingProfile.count({
        where: {
          verificationStatus: "Rejected",
          user: {
            status: {
              not: "Deleted",
            },
          },
        },
      }),

      prisma.teachingProfile.count({
        where: {
          user: {
            status: {
              not: "Deleted",
            },
          },
        },
      }),

      prisma.teachingProfile.findMany({
        where: {
          verificationStatus: selectedStatus,
          user: {
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
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
              emailVerified: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

  const applicationRows = applications.map((application) => ({
    id: application.id,
    userId: application.userId,
    headline: application.headline,
    specialty: application.specialty,
    experience: application.experience,
    credentialUrl: application.credentialUrl,
    description: application.description,

    verificationStatus: normalizeStatus(String(application.verificationStatus)),

    hourlyRate: application.hourlyRate,
    currency: String(application.currency),
    subjects: jsonStringArray(application.subjects),
    gradeLevels: jsonStringArray(application.gradeLevels),
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,

    user: {
      id: application.user.id,
      name: application.user.name,
      email: application.user.email,
      imageUrl: application.user.imageUrl,
      emailVerified: application.user.emailVerified,
      status: application.user.status,
      createdAt: application.user.createdAt,
    },
  }));

  return (
    <TutorApplicationsView
      applications={applicationRows}
      selectedStatus={selectedStatus}
      stats={{
        total: totalCount,
        pending: pendingCount,
        verified: verifiedCount,
        rejected: rejectedCount,
      }}
    />
  );
}
