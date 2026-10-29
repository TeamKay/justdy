import { Suspense } from "react";
import { redirect } from "next/navigation";

import LearnerDashboard from "@/app/_components/dashboard/LearnerDashboard";
import { getDashboardData } from "@/app/(user)/dashboard/dashboard-data";
import DashboardLoading from "@/app/(user)/dashboard/dashboard-loading";

async function LearnerDashboardContent() {
  const data = await getDashboardData();

  if (!data.account.isLearner) {
    redirect(
      data.account.isTeacherAdmin ? "/dashboard/teacher" : "/auth?mode=signin",
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <LearnerDashboard
        account={data.account}
        upcoming={data.learnerUpcoming}
        activities={data.learningActivities}
        courseEnrollments={data.courseEnrollments}
        completedSessions={data.completedSessions}
      />
    </main>
  );
}

export default function LearnerDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <LearnerDashboardContent />
    </Suspense>
  );
}
