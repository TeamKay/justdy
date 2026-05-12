import StudentDashboard from "@/app/_components/StudentDashboard";
import { getStudentAppointments } from "@/app/actions/students";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SubscriptionStatus } from "@/lib/generated/prisma/browser";

export default async function Page() {
  // 1. Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  // 2. Fetch appointments
  const { appointments, error } = await getStudentAppointments();

  if (error) {
    return <div>Error loading data: {error}</div>;
  }

  // 3. Fetch active subscription (SOURCE OF TRUTH)
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: SubscriptionStatus.active,
    },
  });

  const plan = subscription?.planId ?? "Free";

  // 4. Serialize data
  const serializedAppointments = JSON.parse(JSON.stringify(appointments || []));

  return (
    <StudentDashboard
      appointments={serializedAppointments}
      courses={{ courses: [] }}
      plan={plan} // ✅ ADD THIS
    />
  );
}
