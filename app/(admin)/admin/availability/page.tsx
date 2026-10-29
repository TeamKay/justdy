import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { hasCapability, CAPABILITIES } from "@/lib/auth/capabilities";
import prisma from "@/lib/prisma";

import EducatorAvailabilityStudio from "@/app/_components/EducatorAvailablityStudio";

import { materializeRecurringAvailability } from "@/lib/tutoring/recurring-availability";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAvailabilityPage() {
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

  const canTeach = await hasCapability(userId, CAPABILITIES.TEACH);

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
   * ------------------------------------------------------------
   * MATERIALIZE FIRST
   * ------------------------------------------------------------
   *
   * This is critical.
   *
   * RECURRING rows remain:
   *
   *   startTime = NULL
   *   endTime   = NULL
   *
   * But this creates the actual OCCURRENCE rows:
   *
   *   startTime = real date/time
   *   endTime   = real date/time
   */
  await materializeRecurringAvailability(userId);

  const now = new Date();

  const [availability, recurringRules, services] = await Promise.all([
    /*
     * Concrete bookable availability.
     */
    prisma.availability.findMany({
      where: {
        educatorId: userId,

        type: {
          in: ["ONE_OFF", "OCCURRENCE"],
        },

        startTime: {
          gte: now,
        },
      },

      orderBy: {
        startTime: "asc",
      },

      take: 200,

      select: {
        id: true,
        type: true,
        startTime: true,
        endTime: true,
        status: true,
        recurrenceKey: true,
        occurrenceDate: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    /*
     * Weekly recurring schedule.
     */
    prisma.availability.findMany({
      where: {
        educatorId: userId,
        type: "RECURRING",
      },

      orderBy: [
        {
          dayOfWeek: "asc",
        },
        {
          weeklyStartTime: "asc",
        },
      ],

      select: {
        id: true,
        dayOfWeek: true,
        weeklyStartTime: true,
        weeklyEndTime: true,
        timeZone: true,
        active: true,
        isAlwaysAvailable: true,
      },
    }),

    /*
     * Published tutoring services.
     */
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

  /*
   * ------------------------------------------------------------
   * SERIALIZE CONCRETE AVAILABILITY
   * ------------------------------------------------------------
   */

  const serializedAvailability = availability
    .filter(
      (
        slot,
      ): slot is typeof slot & {
        startTime: Date;
        endTime: Date;
      } => slot.startTime instanceof Date && slot.endTime instanceof Date,
    )
    .map((slot) => ({
      id: slot.id,

      type: slot.type,

      startTime: slot.startTime.toISOString(),

      endTime: slot.endTime.toISOString(),

      status: slot.status,

      recurringRuleId: slot.recurrenceKey,

      occurrenceDate: slot.occurrenceDate,

      createdAt: slot.createdAt.toISOString(),

      updatedAt: slot.updatedAt.toISOString(),
    }));

  /*
   * ------------------------------------------------------------
   * SERIALIZE WEEKLY RULES
   * ------------------------------------------------------------
   *
   * Notice:
   *
   * startTime comes from weeklyStartTime
   * endTime comes from weeklyEndTime
   *
   * NOT from the nullable DateTime columns.
   */
  const serializedRecurringRules = recurringRules.map((rule) => ({
    id: rule.id,

    dayOfWeek: rule.dayOfWeek ?? 0,

    startTime: rule.weeklyStartTime ?? "00:00",

    endTime: rule.weeklyEndTime ?? "00:00",

    timeZone: rule.timeZone,

    active: rule.active,

    isAlwaysAvailable: rule.isAlwaysAvailable,
  }));

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <main className="min-h-full bg-white">
      <div className="mx-auto w-full max-w-6xl px-0 py-5 lg:px-0">
        <div className="overflow-hidden bg-white shadow-sm">
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
