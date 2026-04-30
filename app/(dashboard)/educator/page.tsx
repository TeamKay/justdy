import EducatorDashboard from "@/app/_components/EducatorDashboard";
import { getEducatorAppointments } from "@/app/actions/educator";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user?.role !== "Educator") {
    redirect("/onboarding");
  }

  // If already verified, redirect to dashboard
  if (session.user?.verificationStatus !== "Verified") {
    redirect("/educator/verification");
  }

  const { appointments } = await getEducatorAppointments();

  const publishedCoursesCount = await prisma.course.count({
    where: {
      userId: session?.user.id,
      status: "Published",
    },
  });

  const serializedAppointments = appointments.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <EducatorDashboard
      appointments={serializedAppointments}
      publishedCoursesCount={publishedCoursesCount}
    />
  );
}
