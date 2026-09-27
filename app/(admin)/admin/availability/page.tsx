import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { hasCapability, CAPABILITIES } from "@/lib/auth/capabilities";
import prisma from "@/lib/prisma";
import EducatorAvailabilityStudio from "@/app/_components/EducatorAvailablityStudio";
import { materializeRecurringAvailability } from "@/lib/tutoring/recurring-availability";

export const dynamic = "force-dynamic";

export default async function EducatorAvailabilityPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/signin");
  }

  const userId = session.user.id;

  const isAdmin =
    String(session.user.role ?? "")
      .trim()
      .toUpperCase() === "ADMIN";

  const canTeach = await hasCapability(
    userId,
    CAPABILITIES.TEACH,
  );

  if (!isAdmin && !canTeach) {
    redirect("/dashboard");
  }

  const profile = await prisma.teachingProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      headline: true,
      specialty: true,
      verificationStatus: true,
      subjects: true,
      gradeLevels: true,
    },
  });

  if (!profile) {
    redirect("/admin/profile");
  }

  /*
   * Recurring schedules are the source of truth.
   *
   * materializeRecurringAvailability() is intentionally retained here
   * so this page continues to use the existing tutoring availability
   * architecture.
   */
  await materializeRecurringAvailability(userId);

  const [availability, recurringRules, services] = await Promise.all([
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
      take: 200,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        recurringRuleId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    prisma.recurringAvailability.findMany({
      where: {
        educatorId: userId,
        active: true,
      },
      orderBy: [
        {
          dayOfWeek: "asc",
        },
        {
          startTime: "asc",
        },
      ],
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        timeZone: true,
        active: true,
      },
    }),

    prisma.service.findMany({
      where: {
        providerId: userId,
        status: "Published",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        subject: true,
        durationMinutes: true,
        price: true,
        currency: true,
        status: true,
      },
    }),
  ]);

  const serializedAvailability = availability.map((slot) => ({
    id: slot.id,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
    status: slot.status,
    recurringRuleId: slot.recurringRuleId,
    createdAt: slot.createdAt.toISOString(),
    updatedAt: slot.updatedAt.toISOString(),
  }));

  const serializedRecurringRules = recurringRules.map((rule) => ({
    id: rule.id,
    dayOfWeek: rule.dayOfWeek,
    startTime: rule.startTime,
    endTime: rule.endTime,
    timeZone: rule.timeZone,
    active: rule.active,
  }));

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-6xl px-0 py-5 lg:px-0">
        <div className="mb-0">
          <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white/80">
                Set Availability
              </h1>
            </div>

            <div className="text-xs text-white">
              {availability.length} upcoming{" "}
              {availability.length === 1 ? "slot" : "slots"}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-md bg-background shadow-sm">
          <EducatorAvailabilityStudio
            profile={{
              id: profile.id,
              headline: profile.headline,
              specialty: profile.specialty,
              verificationStatus: profile.verificationStatus,
              subjects: profile.subjects,
              gradeLevels: profile.gradeLevels,
            }}
            initialAvailability={serializedAvailability}
            initialRecurringRules={serializedRecurringRules}
            publishedServices={services.map((service) => ({
              id: service.id,
              title: service.title,
              subject: service.subject,
              durationMinutes: service.durationMinutes ?? 0,
              price: service.price,
              currency: service.currency,
              status: service.status,
            }))}
          />
        </div>
      </div>
    </main>
  );
}