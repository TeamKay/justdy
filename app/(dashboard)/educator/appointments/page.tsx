import {
  getEducatorAppointments,
  getEducatorAvailability,
} from "@/app/actions/educator";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import EducatorAppointmentList from "../../../_components/EducatorAppointmentList";

export default async function EducatorDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 1. Check Auth & Role FIRST
  if (!session?.user) redirect("/login");

  if (session.user.role !== "Educator") {
    redirect("/onboarding");
  }

  if (session.user?.verificationStatus !== "Verified") {
    redirect("/educator/verification");
  }

  // 3. ONLY fetch data once authorized
  const [appointmentsData] = await Promise.all([
    getEducatorAppointments(),
    getEducatorAvailability(),
  ]);

  return (
    <div className="space-y-6">
      {/* --- CONTENT BELOW --- */}
      <div className="mt-6">
        <EducatorAppointmentList
          appointments={appointmentsData.appointments || []}
        />
      </div>
    </div>
  );
}
