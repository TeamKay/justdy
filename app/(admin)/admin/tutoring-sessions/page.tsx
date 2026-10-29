import { headers } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import LearnerSessionsTable from "@/app/_components/LearnerSessionsTable";

export const dynamic = "force-dynamic";

interface SessionsPageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

const SESSION_STATUSES = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;
type SessionStatus = (typeof SESSION_STATUSES)[number];

export default async function AdminSessionsPage({
  searchParams,
}: SessionsPageProps) {
  const params = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) redirect("/auth?mode=signin");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, emailVerified: true },
  });

  if (!currentUser) redirect("/auth?mode=signin");

  if (
    String(currentUser.role ?? "")
      .trim()
      .toUpperCase() !== "ADMIN"
  ) {
    return (
      <div className="min-h-screen bg-background p-10">
        <div className="mx-auto max-w-xl rounded-xl border bg-card p-8">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="mt-3 text-muted-foreground">
            Your account does not have administrator access.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Current role: {String(currentUser.role ?? "Unknown")}
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser.emailVerified) redirect("/verify-email-notice");

  const search = params.search?.trim() ?? "";
  const status: SessionStatus | "ALL" =
    params.status && SESSION_STATUSES.includes(params.status as SessionStatus)
      ? (params.status as SessionStatus)
      : "ALL";

  type ActualArgs = NonNullable<
    Parameters<typeof prisma.tutoringSession.findMany>[0]
  >;
  type ActualWhere = NonNullable<ActualArgs["where"]>;
  const actualWhere: ActualWhere = {};
  if (status !== "ALL") actualWhere.status = status;
  if (search) {
    actualWhere.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { bookingId: { contains: search, mode: "insensitive" } },
      { topic: { contains: search, mode: "insensitive" } },
      { learner: { name: { contains: search, mode: "insensitive" } } },
      { learner: { email: { contains: search, mode: "insensitive" } } },
      { educator: { name: { contains: search, mode: "insensitive" } } },
      { educator: { email: { contains: search, mode: "insensitive" } } },
      { service: { title: { contains: search, mode: "insensitive" } } },
      { service: { subject: { contains: search, mode: "insensitive" } } },
    ];
  }

  type OnboardingArgs = NonNullable<
    Parameters<typeof prisma.tutoringOnboardingSession.findMany>[0]
  >;
  type OnboardingWhere = NonNullable<OnboardingArgs["where"]>;
  const onboardingWhere: OnboardingWhere = {};
  if (status !== "ALL") onboardingWhere.status = status;
  if (search) {
    onboardingWhere.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
      { gradeLevel: { contains: search, mode: "insensitive" } },
      {
        onboardingRequest: {
          is: {
            OR: [
              { studentName: { contains: search, mode: "insensitive" } },
              { guardianName: { contains: search, mode: "insensitive" } },
              { learnerEmail: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { subject: { contains: search, mode: "insensitive" } },
              {
                assignedTutor: {
                  is: {
                    OR: [
                      { name: { contains: search, mode: "insensitive" } },
                      { email: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    ];
  }

  const [actualSessions, onboardingSessions] = await Promise.all([
    prisma.tutoringSession.findMany({
      where: actualWhere,
      orderBy: { scheduledStart: "asc" },
      select: {
        id: true,
        bookingId: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
        learnerAttendance: true,
        educatorAttendance: true,
        topic: true,
        learner: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        educator: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        service: {
          select: {
            id: true,
            title: true,
            type: true,
            subject: true,
            durationMinutes: true,
          },
        },
        booking: { select: { id: true, status: true } },
      },
    }),
    prisma.tutoringOnboardingSession.findMany({
      where: onboardingWhere,
      orderBy: [{ scheduledStart: "asc" }, { sessionNumber: "asc" }],
      select: {
        id: true,
        bookingId: true,
        sessionNumber: true,
        status: true,
        scheduledStart: true,
        scheduledEnd: true,
        durationMinutes: true,
        subject: true,
        gradeLevel: true,
        timeZone: true,
        onboardingRequest: {
          select: {
            id: true,
            studentName: true,
            guardianName: true,
            learnerEmail: true,
            email: true,
            subject: true,
            gradeLevel: true,
            assignedTutor: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
  ]);

  const [
    scheduledCount,
    inProgressCount,
    completedCount,
    cancelledCount,
    noShowCount,
  ] = await Promise.all([
    prisma.tutoringSession.count({ where: { status: "SCHEDULED" } }),
    prisma.tutoringSession.count({ where: { status: "IN_PROGRESS" } }),
    prisma.tutoringSession.count({ where: { status: "COMPLETED" } }),
    prisma.tutoringSession.count({ where: { status: "CANCELLED" } }),
    prisma.tutoringSession.count({ where: { status: "NO_SHOW" } }),
  ]);

  return (
    <LearnerSessionsTable
      actualSessions={actualSessions}
      onboardingSessions={onboardingSessions}
      search={search}
      status={status}
      summary={{
        actual: actualSessions.length,
        planned: onboardingSessions.length,
        scheduled: scheduledCount,
        inProgress: inProgressCount,
        completed: completedCount,
        cancelled: cancelledCount,
        noShow: noShowCount,
      }}
    />
  );
}
