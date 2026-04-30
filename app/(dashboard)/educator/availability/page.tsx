import { getEducatorAvailability } from "@/app/actions/educator";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AvailabilitySettings from "../../../_components/AvailabilitySettings";

export default async function EducatorAvailability() {
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
  const [availabilityData] = await Promise.all([getEducatorAvailability()]);

  return (
    <div className="space-y-6">
      <div className="mt-6">
        <AvailabilitySettings slots={availabilityData.slots || []} />
      </div>
    </div>
  );
}
