import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  CAPABILITIES,
  hasCapability,
} from "@/lib/auth/capabilities";

import EducatorTutoringTabs from "@/app/_components/EducatorTutoringTabs";

export const dynamic = "force-dynamic";

export default async function EducatorTutoringPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/signin");
  }

  const userId = session.user.id;

  /*
   * Keep ADMIN and CAN_TEACH as the authorization model.
   * This avoids using "Educator" / "Learner" as account roles.
   */
  const normalizedRole = String(session.user.role ?? "")
    .trim()
    .toUpperCase();

  const isAdmin = normalizedRole === "ADMIN";

  const canTeach = await hasCapability(
    userId,
    CAPABILITIES.TEACH,
  );

  if (!isAdmin && !canTeach) {
    redirect("/dashboard");
  }

  const [profile, availability, services] = await Promise.all([
    prisma.teachingProfile.findUnique({
      where: {
        userId,
      },
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
        educatorId: userId,
        startTime: {
          gte: new Date(),
        },
      },
      orderBy: {
        startTime: "asc",
      },
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
      where: {
        providerId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
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
  ]);

  const serializedAvailability = availability.map((slot) => ({
    id: slot.id,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
    status: slot.status,
    createdAt: slot.createdAt.toISOString(),
    updatedAt: slot.updatedAt.toISOString(),
  }));

  const serializedServices = services.map((service) => ({
    id: service.id,
    title: service.title,
    description: service.description,
    type: service.type,
    durationMinutes: service.durationMinutes,
    price: service.price,
    currency: service.currency,
    status: service.status,
    subject: service.subject,
    gradeLevels: service.gradeLevels,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  }));

  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-5 py-7 lg:px-8 lg:py-10">
        <EducatorTutoringTabs
          profile={profile
            ? {
              id: profile.id,
              headline: profile.headline,
              specialty: profile.specialty,
              experience: profile.experience,
              description: profile.description,
              hourlyRate: profile.hourlyRate,
              currency: profile.currency,
              verificationStatus: profile.verificationStatus,
              subjects: profile.subjects,
              gradeLevels: profile.gradeLevels,
            }
            : null}
          initialAvailability={serializedAvailability}
          services={serializedServices} upcomingSessions={[]} completedSessionCount={0} studentCount={0} latestPayout={null}        />
      </div>
    </main>
  );
}