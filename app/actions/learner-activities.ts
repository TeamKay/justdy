"use server";

import { auth } from "@/lib/auth"; // Adjust path based on your auth setup
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function getLearnerDashboardData() {
  // 1. Authenticate user session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user?.email) {
    throw new Error("Unauthorized access");
  }

  // 2. Fetch all required data points from the database
  const userData = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      subscription: true,
      learnerAppointments: {
        include: {
          educator: {
            select: { name: true },
          },
        },
        orderBy: {
          startTime: "asc",
        },
      },
      enrollment: {
        include: {
          Course: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
      },
      enrollmentProgress: true,
      communityMemberships: {
        select: {
          id: true,
          communityId: true,
        },
      },
    },
  });

  if (!userData) {
    throw new Error("Learner profile records not found");
  }

  // 3. Format structural fields to match UI prop interfaces
  const appointments = userData.learnerAppointments.map((appt) => ({
    id: appt.id,
    status: appt.status,
    startTime: appt.startTime.toISOString(),
    educator: {
      name: appt.educator.name,
    },
  }));

  const courses = userData.enrollment.map((enr) => {
    const matchingProgress = userData.enrollmentProgress.find(
      (prog) => prog.courseId === enr.courseId,
    );

    return {
      id: enr.Course.id,
      title: enr.Course.title,
      category: enr.Course.category,
      enrollmentProgress: [
        {
          progress: matchingProgress ? matchingProgress.progress : 0,
        },
      ],
    };
  });

  const userProfile = {
    description: userData.description,
  };

  const plan = userData.subscription?.planId || "Free";

  return {
    appointments,
    courses,
    communityMemberships: userData.communityMemberships,
    userProfile,
    plan,
  };
}
