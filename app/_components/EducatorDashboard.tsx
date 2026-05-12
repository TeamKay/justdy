"use client";
import { BarChart3, Calendar, Coins, TrendingUp } from "lucide-react";

import { redirect } from "next/navigation";
import { useSession } from "@/lib/auth-client";

import { Card, CardContent } from "./ui/card";

type Appointment = {
  id: string;
  status: "Scheduled" | "Completed" | "Cancelled"; // adjust as needed
  date?: string;
  studentName?: string;
};

export default function EducatorDashboard({
  appointments,
  publishedCoursesCount,
}: {
  appointments: Appointment[];
  publishedCoursesCount: number;
}) {
  const { data: session, isPending: sessionPending } = useSession();

  // 1. Check Auth & Role FIRST
  if (!session?.user) redirect("/login");

  if (session.user.role !== "Educator") {
    redirect("/onboarding");
  }

  if (sessionPending)
    return <div className="p-8 text-center text-zinc-500">Loading...</div>;
  if (!session)
    return <div className="p-8 text-center text-red-500">Access Denied</div>;

  const credits = (session.user as { credits?: number }).credits ?? 0;
  const scheduledAppointments =
    appointments?.filter((app) => app.status === "Scheduled") || [];

  const data = [30, 45, 35, 85, 40, 55, 45, 60, 30, 75, 50, 40];
  const labels = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const width = 1000;
  const height = 200;

  const points = data.map((h, i) => ({
    x: i * (width / (data.length - 1)),
    y: height - (h / 100) * height,
    value: h * 100, // Example: turning percentage into "Points"
  }));

  const linePath = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} ${points[points.length - 1].x},${height} 0,${height}`;

  const stats = [
    {
      label: "Appointments",
      value: scheduledAppointments.length,
      sub: "Upcoming",
      icon: Coins,
      color: "text-emerald-400",
    },
    {
      label: "Courses",
      value: publishedCoursesCount,
      sub: "Published",
      icon: TrendingUp,
      color: "text-blue-400",
    },
    {
      label: "Credits",
      value: credits,
      sub: `$${credits.toFixed(2)} ready`,
      icon: Calendar,
      color: "text-purple-400",
    },
    {
      label: "Students",
      value: 0,
      sub: "Enrolled",
      icon: BarChart3,
      color: "text-orange-400",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Card */}

      {/* 2. Other Cards arranged horizontally below */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm group"
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-lg font-medium text-zinc-400">
                    {stat.label}
                  </p>
                  <p className="text-4xl pt-5 font-bold text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-zinc-500">{stat.sub}</p>
                </div>
                <div className="p-2 rounded-xl bg-zinc-800 transition-colors group-hover:bg-zinc-700">
                  <stat.icon className={`size-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bars */}
      <div className="col-span-12 bg-[#1a1a1a] p-8 rounded-xl border border-white/5 shadow-2xl">
        <div className="relative h-64 w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-48 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DFFF00" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#DFFF00" stopOpacity="0" />
              </linearGradient>
            </defs>

            <polyline fill="url(#lineGradient)" points={areaPath} />

            <polyline
              fill="none"
              stroke="#DFFF00"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={linePath}
              className="drop-shadow-[0_0_8px_rgba(223,255,0,0.4)]"
            />

            {points.map((p, i) => (
              <g key={i} className="group/point">
                {/* Invisible 'Hit Area' - makes hovering easier */}
                <rect
                  x={p.x - 20}
                  y={0}
                  width="40"
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                />

                {/* The Dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  className="fill-[#1a1a1a] stroke-[#DFFF00] stroke-2 transition-all duration-200 group-hover/point:r-6 group-hover/point:fill-[#DFFF00]"
                />

                {/* Tooltip Wrapper */}
                <foreignObject
                  x={p.x - 40}
                  y={p.y - 50}
                  width="80"
                  height="40"
                  className="opacity-0 translate-y-2 transition-all duration-200 group-hover/point:opacity-100 group-hover/point:translate-y-0 pointer-events-none"
                >
                  <div className="flex justify-center">
                    <div className="bg-white text-black text-[11px] font-bold px-2 py-1 rounded shadow-xl relative">
                      {p.value} pts
                      {/* Tiny Arrow */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
                    </div>
                  </div>
                </foreignObject>
              </g>
            ))}
          </svg>

          <div className="flex justify-between mt-6 px-1">
            {labels.map((label, i) => (
              <span
                key={i}
                className="text-[10px] text-gray-500 font-bold tracking-wider"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
