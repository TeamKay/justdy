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
  <div className="min-h-full bg-[#F8FAF7] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
    <div className="mx-auto w-full max-w-[1500px]">
      <LearnerDashboard
        account={data.account}
        upcoming={data.learnerUpcoming}
        activities={data.learningActivities}
        completedSessions={data.completedSessions}
      />
    </div>
  </div>
);

}

export default function LearnerDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <LearnerDashboardContent />
    </Suspense>
  );
}
