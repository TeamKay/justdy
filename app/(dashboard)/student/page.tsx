import StudentDashboard from "@/app/_components/StudentDashboard";
import { getStudentAppointments } from "@/app/actions/students";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SubscriptionStatus } from "@/lib/generated/prisma/browser";

// Helper function to map your actual database subscription plans
// to the strict literal types expected by the StudentDashboard component.
function mapPlanToDashboardTier(
  planId: string | undefined,
): "Free" | "Standard" | "Premium" {
  if (!planId) return "Free";

  // If the plan is any variation of FlexPay (e.g., FlexPay_30m, FlexPay_45m)
  if (planId.startsWith("FlexPay")) {
    return "Standard";
  }

  // If the plan is the Monthly subscription
  if (planId === "Monthly") {
    return "Premium";
  }

  return "Free";
}

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

  // Pass the database planId through the mapper to get "Free" | "Standard" | "Premium"
  const plan = mapPlanToDashboardTier(subscription?.planId);

  // 4. Serialize data
  const serializedAppointments = JSON.parse(JSON.stringify(appointments || []));

  return (
    <StudentDashboard
      appointments={serializedAppointments}
      courses={{ courses: [] }}
      plan={plan}
    />
  );
}

// import StudentDashboard from "@/app/_components/StudentDashboard";
// import { getStudentAppointments } from "@/app/actions/students";
// import prisma from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";
// import { SubscriptionStatus } from "@/lib/generated/prisma/browser";

// export default async function Page() {
//   // 1. Get session
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user?.id) {
//     return <div>Unauthorized</div>;
//   }

//   // 2. Fetch appointments
//   const { appointments, error } = await getStudentAppointments();

//   if (error) {
//     return <div>Error loading data: {error}</div>;
//   }

//   // 3. Fetch active subscription (SOURCE OF TRUTH)
//   const subscription = await prisma.subscription.findFirst({
//     where: {
//       userId: session.user.id,
//       status: SubscriptionStatus.active,
//     },
//   });

//   const plan = subscription?.planId ?? "Free";

//   // 4. Serialize data
//   const serializedAppointments = JSON.parse(JSON.stringify(appointments || []));

//   return (
//     <StudentDashboard
//       appointments={serializedAppointments}
//       courses={{ courses: [] }}
//       plan={plan} // ✅ ADD THIS
//     />
//   );
// }
