import { FacilitatorProfile, User } from "@/lib/generated/prisma/client";

interface UserWithProfile extends User {
  facilitatorProfile?: FacilitatorProfile | null;
}

export default function WelcomeCard({ user }: { user: UserWithProfile }) {
  const isPendingEducator =
    user.facilitatorProfile?.verificationStatus === "Pending";

  return (
    <div className="p-6 border rounded-xl bg-linear-to-r from-slate-900 to-slate-800 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 className="text-2xl font-bold">
          Welcome back, {user.firstName}! 👋
        </h2>
        <p className="text-slate-300 text-sm mt-1">
          Here is what’s happening with your account today.
        </p>

        {isPendingEducator && (
          <div className="mt-3 inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-500/30">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Educator profile verification is pending approval.
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 font-mono">{user.email}</span>
      </div>
    </div>
  );
}
