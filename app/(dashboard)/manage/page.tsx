import React from "react";
import prisma from "@/lib/prisma";
import {
  PendingEnrollmentStatus,
  ProductType,
  ProductStatus,
} from "@/lib/generated/prisma/client";
import ManageDashboard, { AdminStats } from "@/app/_components/ManageDashboard";

export default async function ManagePage() {
  const [
    totalLearners,
    totalEducators,
    totalCoursesApproved,
    totalLessonsApproved,
    totalLeads,
    pendingCalls,
    completedCalls,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: "LEARNER",
      },
    }),

    prisma.user.count({
      where: {
        role: "EDUCATOR",
      },
    }),

    prisma.product.count({
      where: {
        type: ProductType.Course,
        status: ProductStatus.Published,
      },
    }),

    prisma.lesson.count(),

    prisma.pendingEnrollment.count(),

    prisma.pendingEnrollment.count({
      where: {
        status: PendingEnrollmentStatus.Pending,
      },
    }),

    prisma.pendingEnrollment.count({
      where: {
        status: PendingEnrollmentStatus.Enrolled,
      },
    }),
  ]);

  const conversionRate =
    totalLeads > 0 ? Math.round((completedCalls / totalLeads) * 100) : 0;

  const stats: AdminStats = {
    totalLearners,
    totalEducators,
    totalCoursesApproved,
    totalLessonsApproved,

    consultations: {
      totalLeads,
      pendingCalls,
      completedCalls,
      conversionRate,
    },
  };

  return <ManageDashboard stats={stats} />;
}
