import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  CAPABILITIES,
  hasCapability,
} from "@/lib/auth/capabilities";

import EducatorProfileForm from "@/app/_components/EducatorProfileForm";

export const dynamic = "force-dynamic";

export default async function EducatorProfilePage() {
  const session =
    await auth.api.getSession({
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

  const canTeach =
    await hasCapability(
      userId,
      CAPABILITIES.TEACH,
    );

  if (!isAdmin && !canTeach) {
    redirect("/dashboard");
  }

  const [user, profile] =
    await Promise.all([
      prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      }),

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
          subjects: true,
          gradeLevels: true,
          verificationStatus: true,
        },
      }),
    ]);

  if (!user) {
    redirect("/signin");
  }

  const profileFormValue =
    profile
      ? {
          id: profile.id,
          headline: profile.headline,
          specialty: profile.specialty,
          experience: profile.experience,
          description:
            profile.description,
          hourlyRate:
            profile.hourlyRate,
          currency: String(
            profile.currency ??
              "USD",
          ),
          subjects:
            profile.subjects,
          gradeLevels:
            profile.gradeLevels,
          verificationStatus:
            String(
              profile.verificationStatus ??
                "",
            ),

          /*
           * Keep the image URL on the profile
           * object as well for compatibility.
           */
          imageUrl:
            user.imageUrl ?? null,
        }
      : null;

  return (
    <main className="min-h-full bg-background text-white/70">
      <div className="mx-auto w-full max-w-330 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[26px] font-semibold tracking-[-0.035em] text-white/70 sm:text-[30px]">
              Teaching profile
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage the information students see when they
              discover your tutoring profile.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-sm bg-card px-3.5 py-2 text-xs text-white shadow-sm sm:block">
              {user.email}
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="grid gap-5 lg:grid-cols-1">
          <section className="min-w-0">
            <div className="overflow-hidden rounded-sm bg-card">
              <div className="px-5 py-6 sm:px-7 sm:py-7">
                <EducatorProfileForm
                  initialProfile={profileFormValue}
                  initialImageUrl={user.imageUrl ?? null}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}