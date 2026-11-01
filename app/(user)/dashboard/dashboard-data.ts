import { headers } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function getDashboardData() {
  const session = await auth.api.getSession({
    headers: await headers(),
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
    redirect(`/verify-request?email=${encodeURIComponent(user.email)}`);
  }

  const normalizedRole = String(user.role ?? "")
    .trim()
    .toUpperCase();

  const isTeacherAdmin = normalizedRole === "ADMIN";
  const isLearner = normalizedRole === "LEARNER";

  const now = new Date();

  /*
   * LEARNER DASHBOARD DATA
   *
   * Keep the upcoming lesson query small because it only powers
   * the next-lessons section on the dashboard.
   *
   * The progress page uses a larger history window for activity,
   * completed sessions, weekly trends, subject summaries, and
   * tutor feedback.
   */

  const learnerBookingsPromise = isLearner
    ? prisma.booking
        .findMany({
          where: {
            studentId: userId,
            endTime: {
              gt: now,
            },
            status: "Scheduled",
          },
          orderBy: {
            startTime: "asc",
          },
          take: 5,
          select: {
            id: true,
            startTime: true,
            endTime: true,
            subject: true,
            tutoringSession: {
              select: {
                id: true,
              },
            },
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
        .then((rows) =>
          rows.map(({ tutoringSession, ...booking }) => ({
            ...booking,
            tutoringSessionId: tutoringSession?.id ?? null,
          })),
        )
    : Promise.resolve([]);

  const teacherBookingsPromise = isTeacherAdmin
    ? prisma.booking.findMany({
        where: {
          educatorId: userId,
          endTime: {
            gt: now,
          },
          status: {
            in: ["Scheduled", "PendingPayment"],
          },
        },
        orderBy: {
          startTime: "asc",
        },
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

  /*
   * Retrieve a larger learner activity history so the progress page
   * can calculate activity completion, scores, streaks, and trends.
   *
   * Keep the teacher/admin query empty because these records are
   * only used by the learner progress experience.
   */
  const learningActivitiesPromise = isLearner
    ? prisma.learningActivity.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 365,
        select: {
          id: true,
          activityType: true,
          status: true,
          score: true,
          maxScore: true,
          createdAt: true,
          completedAt: true,
        },
      })
    : Promise.resolve([]);

  /*
   * Learners need a larger completed-session history for their
   * progress page, subject activity, learning streaks, and tutor
   * feedback. Teacher dashboards retain the smaller recent list.
   */
  const completedSessionsPromise = prisma.tutoringSession.findMany({
    where: {
      OR: [
        ...(isLearner ? [{ learnerId: userId }] : []),
        ...(isTeacherAdmin ? [{ educatorId: userId }] : []),
      ],
      status: "COMPLETED",
    },
    orderBy: {
      scheduledStart: "desc",
    },
    take: isLearner ? 365 : 6,
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
        where: {
          educatorId: userId,
        },
        orderBy: {
          createdAt: "desc",
        },
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

  const [
    learnerBookings,
    teacherBookings,
    learningActivities,
    completedSessions,
    latestPayout,
    adminStats,
  ] = await Promise.all([
    learnerBookingsPromise,
    teacherBookingsPromise,
    learningActivitiesPromise,
    completedSessionsPromise,
    latestPayoutPromise,
    adminStatsPromise,
  ]);

  return {
    account: {
      name: user.name ?? "there",
      email: user.email,
      imageUrl: user.imageUrl,
      isLearner,
      isTeacherAdmin,
      teachingVerification: user.teachingProfile?.verificationStatus ?? null,
      teachingHeadline: user.teachingProfile?.headline ?? null,
    },
    learnerUpcoming: learnerBookings,
    teacherUpcoming: teacherBookings,
    completedSessions,
    learningActivities,
    latestPayout,
    adminStats,

    // These remain empty because the current dashboard source does not
    // populate client-growth or recent-client records yet.
    clientGrowth: [],
    recentClients: [],
  };
}
