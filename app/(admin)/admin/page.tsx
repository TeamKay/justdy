import { redirect } from "next/navigation";
import { Suspense } from "react";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";

import DashboardView from "@/app/_components/Dashboard-view";

export const dynamic = "force-dynamic";

function DashboardLoading() {
  return (
    <div className="min-h-[70vh] animate-pulse space-y-6 bg-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="h-40 rounded-3xl bg-muted" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-2xl bg-muted lg:col-span-2" />
        <div className="h-80 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

async function DashboardContent() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user) {
    redirect("/auth?mode=signin");
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      role: true,
      emailVerified: true,
      canLearn: true,
      canTutor: true,
      canTeach: true,
      teachingProfile: {
        select: {
          verificationStatus: true,
          headline: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth?mode=signin");
  }

  if (!user.emailVerified) {
    redirect(
      `/verify-request?email=${encodeURIComponent(user.email)}`,
    );
  }

  /*
   * Justdy has two primary account roles:
   *
   * ADMIN -> tutor + platform administration workspace
   * USER  -> learner workspace
   *
   * Capabilities still control specific actions. The role itself is
   * not used as a substitute for capability checks.
   */
  const normalizedRole = String(user.role ?? "")
    .trim()
    .toUpperCase();

  const isTeacherAdmin = normalizedRole === "ADMIN";
  const isLearner = normalizedRole === "USER" && Boolean(user.canLearn);

  const [canBookTutoring, canReceivePayouts] = await Promise.all([
    hasCapability(userId, CAPABILITIES.BOOK_TUTORING),
    hasCapability(userId, CAPABILITIES.RECEIVE_PAYOUTS),
  ]);

  const now = new Date();

  type CourseEnrollmentSummary = {
    id: string;
    progress: number;
    status: string;
    course: {
      id: string;
      title: string;
      slug: string;
      smallDescription: string | null;
      category: string | null;
      level: string;
      duration: number | null;
    };
  };

  const learnerBookingsPromise = isLearner
    ? prisma.booking.findMany({
        where: {
          studentId: userId,
          startTime: { gte: now },
          status: { in: ["Scheduled", "PendingPayment"] },
        },
        orderBy: { startTime: "asc" },
        take: 5,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          subject: true,
          gradeLevel: true,
          status: true,
          educator: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          service: {
            select: {
              id: true,
              title: true,
              durationMinutes: true,
              price: true,
              currency: true,
            },
          },
        },
      })
    : Promise.resolve([]);

  const teacherBookingsPromise = isTeacherAdmin
    ? prisma.booking.findMany({
        where: {
          educatorId: userId,
          startTime: { gte: now },
          status: { in: ["Scheduled", "PendingPayment"] },
        },
        orderBy: { startTime: "asc" },
        take: 5,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          subject: true,
          gradeLevel: true,
          status: true,
          student: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          service: {
            select: {
              id: true,
              title: true,
              durationMinutes: true,
              price: true,
              currency: true,
            },
          },
        },
      })
    : Promise.resolve([]);

  const courseEnrollmentsPromise: Promise<CourseEnrollmentSummary[]> =
    isLearner
      ? prisma.courseEnrollment
          .findMany({
            where: {
              learnerId: userId,
              status: {
                in: ["Pending", "Active"],
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
            take: 6,
            select: {
              id: true,
              progress: true,
              status: true,
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  smallDescription: true,
                  category: true,
                  level: true,
                  duration: true,
                },
              },
            },
          })
          .then((rows) => rows as CourseEnrollmentSummary[])
      : Promise.resolve([]);

  const learningActivitiesPromise = isLearner
    ? prisma.learningActivity.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          activityType: true,
          status: true,
          score: true,
          maxScore: true,
          createdAt: true,
          completedAt: true,
          resource: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })
    : Promise.resolve([]);

  const completedSessionsPromise = prisma.tutoringSession.findMany({
    where: {
      OR: [
        ...(isLearner ? [{ learnerId: userId }] : []),
        ...(isTeacherAdmin ? [{ educatorId: userId }] : []),
      ],
      status: "COMPLETED",
    },
    orderBy: { scheduledStart: "desc" },
    take: 6,
    select: {
      id: true,
      scheduledStart: true,
      scheduledEnd: true,
      topic: true,
      topicsCovered: true,
      strengths: true,
      needsPractice: true,
      nextStep: true,
      tutorNotes: true,
      learnerOutcome: true,
      learner: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
      educator: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
      service: {
        select: {
          id: true,
          title: true,
          subject: true,
        },
      },
    },
  });

  const latestPayoutPromise = isTeacherAdmin
    ? prisma.payout.findFirst({
        where: { educatorId: userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          netAmount: true,
          status: true,
          createdAt: true,
        },
      })
    : Promise.resolve(null);

  const adminStatsPromise = isTeacherAdmin
    ? Promise.all([
        prisma.user.count(),

        prisma.teachingProfile.count({
          where: {
            verificationStatus: "Pending",
          },
        }),

        prisma.booking.count(),

        prisma.booking.count({
          where: {
            status: "Scheduled",
          },
        }),

        prisma.tutoringSession.count({
          where: {
            status: "COMPLETED",
          },
        }),

        prisma.payout.count({
          where: {
            educatorId: userId,
          },
        }),
      ]).then(
        ([
          totalUsers,
          pendingTeacherApprovals,
          totalBookings,
          scheduledBookings,
          completedSessions,
          payoutCount,
        ]) => ({
          totalUsers,
          pendingTeacherApprovals,
          totalBookings,
          scheduledBookings,
          completedSessions,
          payoutCount,
        }),
      )
    : Promise.resolve(null);

  const clientGrowthPromise = isTeacherAdmin
    ? (async () => {
        const start = new Date(
          now.getFullYear(),
          now.getMonth() - 11,
          1,
        );

        const clients = await prisma.user.findMany({
          where: {
            role: "USER",
            canLearn: true,
            createdAt: { gte: start },
          },
          select: { createdAt: true },
        });

        const buckets = Array.from({ length: 12 }, (_, index) => {
          const date = new Date(
            start.getFullYear(),
            start.getMonth() + index,
            1,
          );

          return {
            date: date.toISOString(),
            label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
            value: 0,
          };
        });

        for (const client of clients) {
          const created = new Date(client.createdAt);
          const index =
            (created.getFullYear() - start.getFullYear()) * 12 +
            (created.getMonth() - start.getMonth());

          if (index >= 0 && index < buckets.length) {
            buckets[index].value += 1;
          }
        }

        return buckets;
      })()
    : Promise.resolve([]);

  const [
    learnerBookings,
    teacherBookings,
    learningActivities,
    courseEnrollments,
    completedSessions,
    latestPayout,
    adminStats,
    clientGrowth,
  ] = await Promise.all([
    learnerBookingsPromise,
    teacherBookingsPromise,
    learningActivitiesPromise,
    courseEnrollmentsPromise,
    completedSessionsPromise,
    latestPayoutPromise,
    adminStatsPromise,
    clientGrowthPromise,
  ]);

  return (
    <DashboardView
      account={{
        name: user.name ?? "there",
        email: user.email,
        imageUrl: user.imageUrl,
        isLearner,
        isTeacherAdmin,
        canBookTutoring,
        canReceivePayouts,
        teachingVerification: user.teachingProfile?.verificationStatus ?? null,
        teachingHeadline: user.teachingProfile?.headline ?? null,
      }}
      learnerUpcoming={learnerBookings}
      teacherUpcoming={teacherBookings}
      completedSessions={completedSessions}
      learningActivities={learningActivities}
      courseEnrollments={courseEnrollments}
      latestPayout={latestPayout}
      adminStats={adminStats}
      clientGrowth={clientGrowth} recentClients={[]}    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
