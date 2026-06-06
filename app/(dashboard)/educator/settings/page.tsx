import { getEducatorAvailability } from "@/app/actions/educator";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import AvailabilitySettings from "@/app/_components/AvailabilitySettings";
import ProfileSettings from "@/app/_components/ProfileSettings";

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
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <ProfileSettings />
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="mt-6">
          <AvailabilitySettings slots={availabilityData?.slots || []} />
        </TabsContent>

        {/* Security Tab */}
        {/* <TabsContent value="security" className="mt-6">
          <SecuritySettings />
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
