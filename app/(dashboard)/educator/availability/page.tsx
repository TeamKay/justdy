import { getEducatorAvailability } from "@/app/actions/educator";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AvailabilitySettings from "@/app/_components/AvailabilitySettings";

export default async function EducatorSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Authentication & authorization
  if (!session?.user) redirect("/login");

  if (session.user.role !== "Educator") {
    redirect("/onboarding");
  }

  if (session.user.verificationStatus !== "Verified") {
    redirect("/educator/verification");
  }

  const availabilityData = await getEducatorAvailability();

  return (
    <div className="space-y-6">
      {/* Availability Tab */}

      <AvailabilitySettings slots={availabilityData?.slots || []} />
    </div>
  );
}
