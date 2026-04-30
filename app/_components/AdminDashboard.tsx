import Link from "next/link";
import { adminGetDashboardStats } from "../actions/admin-get-dashboard-stats";
import { IconLogout } from "@tabler/icons-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardContent } from "./ui/card";
import { BarChart3, Calendar, Coins, TrendingUp } from "lucide-react";

export async function AdminDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { totalStudents, totalEducators, totalCourses, totalLessons } =
    await adminGetDashboardStats();

  const stats = [
    {
      label: "Students",
      value: totalStudents,
      sub: "Enrolled",
      icon: Coins,
      color: "text-emerald-400",
    },
    {
      label: "Educators",
      value: totalEducators,
      sub: "Verified",
      icon: TrendingUp,
      color: "text-blue-400",
    },
    {
      label: "Courses",
      value: totalCourses,
      sub: "Published",
      icon: Calendar,
      color: "text-purple-400",
    },
    {
      label: "Lessons",
      value: totalLessons,
      sub: "Published",
      icon: BarChart3,
      color: "text-orange-400",
    },
  ];

  const name = session?.user?.name ?? "User";

  return (
    <main className="max-w-7xl mx-auto space-y-6">
      <div className="col-span-12 overflow-hidden rounded-xl border border-emerald-800/50 bg-linear-to-br from-emerald-900/40 to-emerald-950/60 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-white">
              Welcome back,{" "}
              <span className="text-[#DFFF00] drop-shadow-[0_0_15px_rgba(223,255,0,0.3)]">
                {name}
              </span>
            </h3>
            <p className="text-sm text-emerald-200/60">
              Here&apos;s what&apos;s happening with your platform today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Exit Button */}
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white border border-white/10 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all duration-200"
            >
              <IconLogout size={18} />
              <span>Exit</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="bg-zinc-900/40 border-white/5 backdrop-blur-md group hover:border-zinc-700/50 transition-all duration-300"
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
                    {stat.label}
                  </p>
                  <p className="text-3xl pt-4 font-bold tracking-tight text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{stat.sub}</p>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-800/50 border border-white/5 transition-all group-hover:scale-110 group-hover:bg-zinc-800">
                  <stat.icon className={`size-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
