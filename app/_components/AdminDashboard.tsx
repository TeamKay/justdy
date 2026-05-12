import { adminGetDashboardStats } from "../actions/admin-get-dashboard-stats";

import { Card, CardContent } from "./ui/card";
import { BarChart3, Calendar, Coins, TrendingUp } from "lucide-react";

export async function AdminDashboard() {
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

  return (
    <main className="max-w-7xl mx-auto space-y-6">
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
