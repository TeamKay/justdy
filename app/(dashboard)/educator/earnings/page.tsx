import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getEducatorEarnings, getEducatorPayouts } from "@/app/actions/payout";
import { EducatorEarnings } from "@/app/_components/EducatorEarnings";

export default async function DoctorDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user?.role !== "Educator") {
    redirect("/onboarding");
  }

  if (session.user?.verificationStatus !== "Verified") {
    redirect("/educator/verification");
  }

  // Fetching data concurrently for speed
  const [earningsData, payoutsData] = await Promise.all([
    getEducatorEarnings(),
    getEducatorPayouts(),
  ]);

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Financial Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your earnings, view history, and request payouts.
          </p>
        </div>

        <EducatorEarnings
          earnings={earningsData.earnings || {}}
          payouts={payoutsData.payouts || []}
        />
      </div>
    </div>
  );
}

// import { redirect } from "next/navigation";
// import { getEducatorEarnings, getEducatorPayouts } from "@/app/actions/payout";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";
// import { EducatorEarnings } from "@/app/_components/EducatorEarnings";

// export default async function DoctorDashboardPage() {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   const [earningsData, payoutsData] = await Promise.all([
//     getEducatorEarnings(),
//     getEducatorPayouts(),
//   ]);

//   //   // Redirect if not a doctor
//   if (session?.user?.role !== "Educator") {
//     redirect("/onboarding");
//   }

//   // If already verified, redirect to dashboard
//   if (session.user?.verificationStatus !== "Verified") {
//     redirect("/educator/verification");
//   }

//   return (
//     <div className="md:col-span-3">
//       <EducatorEarnings
//         earnings={earningsData.earnings || {}}
//         payouts={payoutsData.payouts || []}
//       />
//     </div>
//   );
// }
