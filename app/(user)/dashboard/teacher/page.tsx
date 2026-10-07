import { Suspense } from "react";
import { redirect } from "next/navigation";

import TeacherDashboard from "@/app/_components/dashboard/TeacherDashboard";
import { getDashboardData } from "@/app/(user)/dashboard/dashboard-data";
import DashboardLoading from "@/app/(user)/dashboard/dashboard-loading";

async function TeacherDashboardContent() {
  const data = await getDashboardData();

  if (!data.account.isTeacherAdmin) {
    redirect(data.account.isLearner ? "/dashboard/learner" : "/auth?mode=signin");
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <TeacherDashboard
        account={data.account}
        upcoming={data.teacherUpcoming}
        completedSessions={data.completedSessions}
        latestPayout={data.latestPayout}
        adminStats={data.adminStats}
        clientGrowth={data.clientGrowth}
        recentClients={data.recentClients}
      />
    </main>
  );
}

export default function TeacherDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <TeacherDashboardContent />
    </Suspense>
  );
}
