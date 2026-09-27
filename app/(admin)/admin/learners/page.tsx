import { redirect } from "next/navigation";
import { headers } from "next/headers";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import LearnersView from "@/app/_components/LearnersView";

export const dynamic = "force-dynamic";

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getLastSixMonths() {
  const months: { key: string; label: string }[] = [];
  const now = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);

    months.push({
      key: getMonthKey(date),
      label: date.toLocaleDateString("en-US", {
        month: "short",
      }),
    });
  }

  return months;
}

export default async function LearnersPage() {
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

  const learners = await prisma.user.findMany({
    where: {
      role: "USER",
      canLearn: true,
      status: {
        not: "Deleted",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      emailVerified: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      canTeach: true,
      studentProfile: {
        select: {
          gradeLevel: true,
          learningStyle: true,
        },
      },
    },
  });

  const learnerIds = learners.map((learner) => learner.id);

  const [
    totalUsers,
    verifiedUsers,
    bookingCounts,
    upcomingBookingCounts,
    completedSessionCounts,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: "USER",
        status: { not: "Deleted" },
      },
    }),

    prisma.user.count({
      where: {
        role: "USER",
        canLearn: true,
        emailVerified: true,
        status: { not: "Deleted" },
      },
    }),

    learnerIds.length
      ? prisma.booking.groupBy({
          by: ["studentId"],
          where: {
            studentId: { in: learnerIds },
          },
          _count: {
            _all: true,
          },
        })
      : Promise.resolve([]),

    learnerIds.length
      ? prisma.booking.groupBy({
          by: ["studentId"],
          where: {
            studentId: { in: learnerIds },
            startTime: { gte: new Date() },
            status: {
              in: ["Scheduled", "PendingPayment"],
            },
          },
          _count: {
            _all: true,
          },
        })
      : Promise.resolve([]),

    learnerIds.length
      ? prisma.tutoringSession.groupBy({
          by: ["learnerId"],
          where: {
            learnerId: { in: learnerIds },
            status: "COMPLETED",
          },
          _count: {
            _all: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const bookingCountMap = new Map(
    bookingCounts.map((item) => [item.studentId, item._count._all]),
  );

  const upcomingBookingCountMap = new Map(
    upcomingBookingCounts.map((item) => [
      item.studentId,
      item._count._all,
    ]),
  );

  const completedSessionCountMap = new Map(
    completedSessionCounts.map((item) => [
      item.learnerId,
      item._count._all,
    ]),
  );

  const learnerRows = learners.map((learner) => ({
    id: learner.id,
    name: learner.name,
    email: learner.email,
    imageUrl: learner.imageUrl,
    emailVerified: learner.emailVerified,
    status: learner.status,
    createdAt: learner.createdAt,
    lastLoginAt: learner.lastLoginAt,
    canTeach: learner.canTeach,
    gradeLevel: learner.studentProfile?.gradeLevel ?? null,
    learningStyle: learner.studentProfile?.learningStyle ?? null,
    bookingCount: bookingCountMap.get(learner.id) ?? 0,
    upcomingBookingCount:
      upcomingBookingCountMap.get(learner.id) ?? 0,
    completedSessionCount:
      completedSessionCountMap.get(learner.id) ?? 0,
  }));

  const monthBuckets = new Map(
    getLastSixMonths().map((month) => [month.key, 0]),
  );

  for (const learner of learners) {
    const key = getMonthKey(learner.createdAt);

    if (monthBuckets.has(key)) {
      monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + 1);
    }
  }

  const learnerGrowth = getLastSixMonths().map((month) => ({
    label: month.label,
    value: monthBuckets.get(month.key) ?? 0,
  }));

  const currentMonth = new Date();
  const newThisMonth = learners.filter(
    (learner) =>
      learner.createdAt.getFullYear() === currentMonth.getFullYear() &&
      learner.createdAt.getMonth() === currentMonth.getMonth(),
  ).length;

  const activeTutoringLearners = learnerRows.filter(
    (learner) => learner.bookingCount > 0,
  ).length;

  return (
    <LearnersView
      learners={learnerRows}
      stats={{
        totalLearners: learners.length,
        totalUsers,
        verifiedLearners: verifiedUsers,
        activeTutoringLearners,
        newThisMonth,
      }}
      growth={learnerGrowth}
    />
  );
}
