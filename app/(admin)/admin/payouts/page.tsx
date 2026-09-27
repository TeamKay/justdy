import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WalletCards } from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminPayoutActions from "@/app/_components/AdminPayoutActions";

export default async function AdminPayoutsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { educator: { select: { name: true, email: true } } },
  });

  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            <WalletCards className="h-3.5 w-3.5" /> Admin
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Tutor payouts</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Review processing payouts and record the external payout result.</p>
        </div>
        <div className="space-y-4">
          {payouts.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No payout requests yet.</div> : payouts.map((payout) => (
            <article key={payout.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-950">{payout.educator.name || "Unnamed tutor"}</h2>
                  <p className="text-sm text-slate-500">{payout.educator.email}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                    <span>Gross: {payout.amount}</span>
                    <span>Tutor: {payout.netAmount}</span>
                    <span>Fee: {payout.platformFee}</span>
                    <span>Status: {payout.status}</span>
                    <span>PayPal: {payout.paypalEmail}</span>
                  </div>
                </div>
                <AdminPayoutActions payoutId={payout.id} status={payout.status} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
