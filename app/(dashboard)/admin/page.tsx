import { AdminDashboard } from "@/app/_components/AdminDashboard";
import { ChartAreaInteractive } from "@/app/_components/sidebar/dashboard-barchart-admin";

import { adminGetEnrollmentStats } from "@/app/actions/admin-get-enrolment-stats";

export default async function AdminDashboardPage() {
  const enrollmentData = await adminGetEnrollmentStats();

  return (
    <>
      <AdminDashboard />
      <ChartAreaInteractive data={enrollmentData} />
    </>
  );
}
