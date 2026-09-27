import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  CAPABILITIES,
  hasCapability,
} from "@/lib/auth/capabilities";

import EducatorServicesStudio from "@/app/_components/EducatorServicesStudio";

export const dynamic = "force-dynamic";

export default async function EducatorServicesPage() {
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
      verificationStatus: true,
      headline: true,
      specialty: true,
      subjects: true,
      gradeLevels: true,
    },
  });

  if (!profile) {
    redirect("/admin/profile");
  }

  const services = await prisma.service.findMany({
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
  });

  /*
   * Prisma returns Date objects.
   *
   * EducatorServicesStudio expects serializable strings.
   * Convert them here at the server boundary.
   */
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
    <main className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-0">

        <EducatorServicesStudio
          profile={{
            id: profile.id,
            verificationStatus: String(
              profile.verificationStatus ?? "",
            ),
            headline: profile.headline,
            specialty: profile.specialty,
            subjects: profile.subjects,
            gradeLevels: profile.gradeLevels,
          }}
          initialServices={serializedServices}
        />
      </div>
    </main>
  );
}