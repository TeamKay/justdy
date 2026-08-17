"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function getLearnerDashboardData() {
  // ==========================================================
  // 1. AUTHENTICATE USER
  // ==========================================================

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    throw new Error("Unauthorized access");
  }

  // ==========================================================
  // 2. FIND USER
  // ==========================================================

  const userData = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },

    include: {
      // ------------------------------------------------------
      // SUBSCRIPTION
      // ------------------------------------------------------

      subscription: true,

      // ------------------------------------------------------
      // TUTORING APPOINTMENTS
      // ------------------------------------------------------

      learnerAppointments: {
        include: {
          educator: {
            select: {
              name: true,
            },
          },
        },

        orderBy: {
          startTime: "asc",
        },
      },

      // ------------------------------------------------------
      // COURSE ENROLLMENTS
      //
      // Enrollment is connected directly to Product.
      // ------------------------------------------------------

      enrollment: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              category: true,
              type: true,
              slug: true,
              imageKey: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      },

      // ------------------------------------------------------
      // COURSE PROGRESS
      // ------------------------------------------------------

      enrollmentProgress: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },

      // ------------------------------------------------------
      // PURCHASED DIGITAL PRODUCTS
      // ------------------------------------------------------

      purchases: {
        where: {
          status: "Paid",
        },

        include: {
          product: {
            select: {
              id: true,
              title: true,
              category: true,
              type: true,
              slug: true,
              imageKey: true,
              fileType: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  // ==========================================================
  // 3. VERIFY USER
  // ==========================================================

  if (!userData) {
    throw new Error("Learner profile records not found");
  }

  // ==========================================================
  // 4. FORMAT APPOINTMENTS
  // ==========================================================

  const appointments = userData.learnerAppointments.map((appointment) => ({
    id: appointment.id,

    status: appointment.status,

    startTime: appointment.startTime.toISOString(),

    endTime: appointment.endTime.toISOString(),

    subject: appointment.subject,

    gradeLevel: appointment.gradeLevel,

    educator: {
      name: appointment.educator?.name || "Educator",
    },
  }));

  // ==========================================================
  // 5. FORMAT COURSE ENROLLMENTS
  //
  // Only ProductType.Course products belong in courses.
  // ==========================================================

  const courseEnrollments = userData.enrollment.filter(
    (enrollment) => enrollment.product?.type === "Course",
  );

  // ==========================================================
  // 6. FORMAT COURSES
  // ==========================================================

  const courses = courseEnrollments.map((enrollment) => {
    const progressRecord = userData.enrollmentProgress.find(
      (progress) => progress.productId === enrollment.productId,
    );

    const progress = progressRecord
      ? Math.round(Math.min(100, Math.max(0, progressRecord.progress)))
      : 0;

    return {
      id: enrollment.product.id,

      title: enrollment.product.title || "Untitled Course",

      category: enrollment.product.category || "Course",

      progress,

      slug: enrollment.product.slug,

      imageKey: enrollment.product.imageKey,

      enrollmentId: enrollment.id,

      status: enrollment.status,

      createdAt: enrollment.createdAt.toISOString(),
    };
  });

  // ==========================================================
  // 7. FORMAT DIGITAL PRODUCTS
  //
  // Your schema uses ProductType values such as:
  // Worksheets, Workbooks, Planners, Journals, etc.
  //
  // Everything purchased that isn't a Course is treated
  // as a digital product.
  // ==========================================================

  const digitalProducts = userData.purchases
    .filter((purchase) => purchase.product?.type !== "Course")
    .map((purchase) => ({
      id: purchase.product.id,

      title: purchase.product.title || "Untitled Product",

      category: purchase.product.category || purchase.product.type,

      type: purchase.product.type,

      slug: purchase.product.slug,

      imageKey: purchase.product.imageKey,

      fileType: purchase.product.fileType,

      quantity: purchase.quantity,

      amount: purchase.amount,

      purchaseId: purchase.id,

      purchasedAt: purchase.createdAt.toISOString(),
    }));

  // ==========================================================
  // 8. PLAN
  // ==========================================================

  const plan = userData.subscription?.planId || "Free";

  // ==========================================================
  // 9. USER PROFILE
  // ==========================================================

  const userProfile = {
    id: userData.id,

    name: userData.name,

    email: userData.email,

    image: userData.imageUrl,

    role: userData.role,

    description: null,

    onboardingCompleted: userData.onboardingCompleted,
  };

  // ==========================================================
  // 10. RETURN DASHBOARD DATA
  // ==========================================================

  return {
    appointments,

    courses,

    digitalProducts,

    // Your current Prisma schema does not contain a
    // CommunityMembership relation on User, so return
    // an empty array until that feature has a database model.
    communityMemberships: [],

    userProfile,

    plan,
  };
}
