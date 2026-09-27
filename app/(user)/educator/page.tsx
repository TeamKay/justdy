import { headers } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

import EducatorTutoringTabs from "@/app/_components/EducatorTutoringTabs";

export const dynamic = "force-dynamic";

export default async function EducatorWorkspacePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth?mode=signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      role: true,
      canTeach: true,
    },
  });

  if (!user) {
    redirect("/auth?mode=signin");
  }

  const normalizedRole = String(user.role ?? "")
    .trim()
    .toUpperCase();

  if (normalizedRole === "ADMIN") {
    redirect("/admin");
  }

  if (!user.canTeach) {
    redirect("/dashboard");
  }

  const now = new Date();

  const [profile, availability, services, upcomingSessions, completedSessionCount, uniqueStudents, latestPayout] = await Promise.all([
    prisma.teachingProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        headline: true,
        specialty: true,
        experience: true,
        description: true,
        hourlyRate: true,
        currency: true,
        verificationStatus: true,
        subjects: true,
        gradeLevels: true,
      },
    }),

    prisma.availability.findMany({
      where: {
        educatorId: user.id,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: "asc" },
      take: 100,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    prisma.service.findMany({
      where: { providerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        durationMinutes: true,
        price: true,
        currency: true,
        status: true,
        subject: true,
        gradeLevels: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    prisma.tutoringSession.findMany({
      where: {
        educatorId: user.id,
        scheduledStart: { gte: now },
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
      orderBy: { scheduledStart: "asc" },
      take: 5,
      select: {
        id: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
        topic: true,
        learner: {
          select: { id: true, name: true, imageUrl: true },
        },
        service: {
          select: { id: true, title: true },
        },
      },
    }),

    prisma.tutoringSession.count({
      where: {
        educatorId: user.id,
        status: "COMPLETED",
      },
    }),

    prisma.tutoringSession.findMany({
      where: { educatorId: user.id },
      distinct: ["learnerId"],
      select: { learnerId: true },
    }),

    prisma.payout.findFirst({
      where: { educatorId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        netAmount: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <EducatorTutoringTabs
          profile={profile}
          initialAvailability={availability.map((slot) => ({
            ...slot,
            startTime: slot.startTime.toISOString(),
            endTime: slot.endTime.toISOString(),
            createdAt: slot.createdAt.toISOString(),
            updatedAt: slot.updatedAt.toISOString(),
          }))}
          services={services.map((service) => ({
            ...service,
            createdAt: service.createdAt.toISOString(),
            updatedAt: service.updatedAt.toISOString(),
          }))}
          imageUrl={user.imageUrl}
          userName={user.name}
          upcomingSessions={upcomingSessions.map((session) => ({
            ...session,
            scheduledStart: session.scheduledStart.toISOString(),
            scheduledEnd: session.scheduledEnd.toISOString(),
          }))}
          completedSessionCount={completedSessionCount}
          studentCount={uniqueStudents.length}
          latestPayout={
            latestPayout
              ? {
                  netAmount: latestPayout.netAmount,
                  status: String(latestPayout.status),
                  createdAt: latestPayout.createdAt.toISOString(),
                }
              : null
          }
        />
      </div>
    </main>
  );
}
