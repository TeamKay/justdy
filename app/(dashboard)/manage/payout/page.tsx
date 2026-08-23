import { PendingPayouts } from "@/app/_components/PendingPayouts";
import { getPendingPayouts } from "@/app/actions/manage-admin";

export default async function AdminPage() {
  const [pendingPayoutsData] = await Promise.all([getPendingPayouts()]);

  const payouts =
    pendingPayoutsData.payouts?.map((p) => {
      // Safely check for educator without triggering 'no-explicit-any'
      const educator =
        "educator" in p && p.educator
          ? (
              p as unknown as {
                educator: {
                  name: string;
                  email: string;
                  specialty?: string | null;
                };
              }
            ).educator
          : null;

      return {
        id: p.id,
        educator: {
          name: educator?.name ?? "Unknown Educator",
          email: educator?.email ?? "No Email",
          specialty: educator?.specialty ?? "General",
        },
        amount: p.netAmount + p.platformFee,
        platformFee: p.platformFee,
        netAmount: p.netAmount,
        paypalEmail: p.paypalEmail,
        createdAt: p.createdAt,
      };
    }) || [];

  return <PendingPayouts payouts={payouts} />;
}

// import { PendingPayouts } from "@/app/_components/PendingPayouts";
// import { getPendingPayouts } from "@/app/actions/admin";

// export default async function AdminPage() {
//   const [pendingPayoutsData] = await Promise.all([getPendingPayouts()]);

//   const payouts =
//     pendingPayoutsData.payouts?.map((p) => ({
//       id: p.id,
//       educator: {
//         name: p.educator.name,
//         email: p.educator.email,
//         specialty: p.educator.specialty ?? "General",
//       },

//       amount: p.netAmount + p.platformFee, // or define properly if backend has gross
//       platformFee: p.platformFee,
//       netAmount: p.netAmount,
//       paypalEmail: p.paypalEmail,
//       createdAt: p.createdAt,
//     })) || [];

//   return <PendingPayouts payouts={payouts} />;
// }
