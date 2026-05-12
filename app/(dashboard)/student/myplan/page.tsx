import { PricingTable } from "@/app/_components/PricingTable";
import { auth } from "@/lib/auth"; // Your auth library

import { headers } from "next/headers";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return <div>Please Log In</div>;

  // const subscription = await prisma.subscription.findFirst({
  //   where: {
  //     userId: session.user.id,
  //   },
  //   orderBy: {
  //     createdAt: "desc",
  //   },
  // });

  return (
    <div className="h-screen bg-background p-8 font-sans">
      {/* The Pricing Card component remains untouched */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <PricingTable />
      </div>
    </div>
  );
}
