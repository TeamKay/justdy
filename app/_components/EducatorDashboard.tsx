"use client";

import React from "react";
import Image from "next/image";
import { Mail, Phone, MapPin, Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import { useSession } from "@/lib/auth-client";

type Appointment = {
  id: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  date?: string;
  studentName?: string;
  createdAt: string;
};

interface EducatorDashboardProps {
  appointments: Appointment[];
  publishedCoursesCount: number;
}

export default function EducatorDashboard({
  appointments,
  publishedCoursesCount,
}: EducatorDashboardProps) {
  const { data: session, isPending: sessionPending } = useSession();

  // 1. Auth & Role Guards
  if (sessionPending) {
    return <div className="p-8 text-center text-zinc-500">Loading...</div>;
  }
  if (!session?.user) redirect("/login");
  if (session.user.role !== "Educator") {
    redirect("/onboarding");
  }

  const scheduledAppointments =
    appointments?.filter((app) => app.status === "Scheduled") || [];

  // Graph math configuration setup
  const graphData = [42, 28, 38, 26, 20, 24, 35, 32, 26, 38, 32, 34, 22];
  const graphWidth = 1000;
  const graphHeight = 220;
  const points = graphData.map((h, i) => ({
    x: i * (graphWidth / (graphData.length - 1)),
    y: graphHeight - (h / 50) * graphHeight,
  }));

  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cpX1 = points[i].x + (points[i + 1].x - points[i].x) / 3;
    const cpY1 = points[i].y;
    const cpX2 = points[i].x + (2 * (points[i + 1].x - points[i].x)) / 3;
    const cpY2 = points[i + 1].y;
    linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i + 1].x} ${points[i + 1].y}`;
  }

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${graphHeight} L 0 ${graphHeight} Z`;

  // --- UploadThing Image Generation Logic ---
  // Safely extract the file key from your session's user object
  const fileKey = session.user.image || session.user.image;

  // Construct the secure CDN url using UploadThing's delivery format, falling back to local asset if null
  const userAvatarSrc = fileKey
    ? `https://utfs.io/f/${fileKey}`
    : "/avatar-placeholder.png";

  return (
    <div className="bg-background text-[#1d1d1d] font-sans antialiased pb-12">
      <div className="max-w-7xl mx-auto md:px-0 space-y-6">
        {/* Profile Card Header Block */}
        <div className="bg-emerald-900/10 rounded-md border border-emerald-950 shadow-sm overflow-hidden">
          {/* Cover Graphic Strip */}
          <div className="h-44 w-full relative bg-linear-to-r from-amber-900 via-orange-950 to-sky-900 overflow-hidden">
            <div className="absolute inset-0 opacity-60 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-size-[40px_40px] transform skew-y-12 scale-150"></div>
          </div>

          <div className="px-8 pb-6 relative flex flex-col md:flex-row md:items-center md:justify-between">
            {/* Left Side: Avatar Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:space-x-5 text-center sm:text-left">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-amber-100 flex items-center justify-center shadow-sm z-10 overflow-hidden relative">
                <Image
                  src={userAvatarSrc}
                  alt={`${session.user.name || "Educator"}'s Profile Picture`}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                  priority
                  unoptimized={!!fileKey}
                />
              </div>
              <div className="mt-3 sm:mt-0 pb-1">
                <h1 className="text-2xl font-bold text-emerald-300 tracking-tight">
                  {session.user.name || "Educator Profile"}
                </h1>
                <p className="text-sm text-gray-500 font-medium tracking-wide">
                  {session.user.email || ""}
                </p>
              </div>
            </div>

            {/* Right Side: Key High Level Metric Balances */}
            <div className="flex justify-center items-center space-x-10 mt-6 md:mt-0 text-center md:text-right border-t pt-4 md:pt-0 md:border-0 border-gray-100">
              <div>
                <p className="text-2xl font-bold text-emerald-300">
                  {scheduledAppointments.length}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Upcoming Appointments
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-300">
                  {publishedCoursesCount}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Published Courses
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-300">{0}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Active Students
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-300">{0}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Total Earnings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column Meta Info Panels */}
          <div className="lg:col-span-4 space-y-6">
            {/* Contact Information Sub-Card */}
            <div className="bg-emerald-900/20 rounded-md p-6 border border-emerald-900/10 shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-white/60 tracking-tight">
                Info
              </h3>
              <hr className="border-gray-100 -mx-6" />

              <div className="space-y-4 pt-1">
                <div className="flex items-start space-x-3.5">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-sky-50 text-sky-600">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                      Email
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      {session.user.email || "info@educator.com"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-sky-50 text-sky-600">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                      Phone
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      +1-202-555-0151
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-sky-50 text-sky-600">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                      Location
                    </p>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed">
                      Suite# 402, Block-C, Learning Arc, Global Remote
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Biography Sub-Card */}
            <div className="bg-emerald-900/20 rounded-md p-6 border border-emerald-900/10 shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Biography
              </h3>
              <hr className="border-gray-100 -mx-6" />
              <div className="space-y-4 text-sm text-gray-500 leading-relaxed">
                <p className="font-semibold text-gray-800">About Me</p>
                <p>
                  Dedicated professional committed to cultivating interactive
                  dynamic class environments. Experienced in managing remote
                  students, curriculum architecting, and optimizing learning
                  metrics with data-centric insights.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Role:</span>{" "}
                  <span className="text-gray-700 font-semibold">
                    Lead Senior Instructor
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Team:</span>{" "}
                  <span className="text-gray-700 font-semibold">
                    Academic Operations
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Joined:</span>{" "}
                  <span className="text-gray-700 font-semibold">
                    November 2021
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Core Statistics and Activity Streams */}
          <div className="lg:col-span-8 space-y-6">
            {/* Analytical Performance Spline Chart Block */}
            <div className="bg-emerald-900/20 rounded-md p-6 border border-emerald-900/10 shadow-sm space-y-5">
              <div className="flex justify-between items-center pb-4 mb-4">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                  Statistics
                </h3>
                <select className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer">
                  <option>This Month</option>
                  <option>Last 6 Months</option>
                </select>
              </div>

              <div className="relative w-full pt-2">
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] font-bold text-gray-300 pointer-events-none select-none">
                  <span>50K</span>
                  <span>10K</span>
                  <span>1K</span>
                  <span>500</span>
                  <span>100</span>
                  <span>00</span>
                </div>

                <div className="pl-8">
                  <svg
                    viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                    className="w-full h-52 overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="chartGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#2563eb"
                          stopOpacity="0.12"
                        />
                        <stop
                          offset="100%"
                          stopColor="#2563eb"
                          stopOpacity="0.00"
                        />
                      </linearGradient>
                    </defs>

                    <path d={areaPath} fill="url(#chartGradient)" />

                    <path
                      d={linePath}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="flex justify-between mt-3 text-[10px] text-gray-400 font-bold tracking-wider uppercase">
                    <span>Nov 01</span>
                    <span>Nov 10</span>
                    <span>Nov 20</span>
                    <span>Nov 30</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Interactive Stream Activity Tracking Component */}
            <div className="bg-emerald-900/20 rounded-md p-6 border border-emerald-900/10 shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Latest Activity
              </h3>

              {scheduledAppointments.length === 0 ? (
                <div className="p-8 text-center text-gray-400 border border-dashed rounded-xl border-gray-200 text-sm">
                  No upcoming scheduled student appointments found.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-sm text-gray-700 bg-gray-50/70 p-3 rounded-xl border border-gray-100/50">
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs">
                      🎓
                    </div>
                    <p className="font-medium">
                      You have{" "}
                      <span className="font-bold text-blue-600">
                        {scheduledAppointments.length}
                      </span>{" "}
                      upcoming appointment sessions waiting action.
                    </p>
                  </div>

                  {/* Horizon Block Grid Cards for Appointments Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scheduledAppointments.slice(0, 4).map((app) => (
                      <div
                        key={app.id}
                        className="bg-rose-50/40 border border-rose-100/70 rounded-xl p-4 flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold tracking-wide uppercase mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            <span>Urgent</span>
                          </div>
                          <h4 className="font-bold text-gray-800 text-sm tracking-tight leading-snug line-clamp-2">
                            Session with student{" "}
                            {app.studentName || "Enrolled Learner"}
                          </h4>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-rose-100/50">
                          <div className="flex items-center text-xs text-gray-500 space-x-2">
                            <div className="w-5 h-5 rounded-full bg-white border flex items-center justify-center text-[10px]">
                              👤
                            </div>
                            <span className="font-medium text-gray-600">
                              ID: #{app.id.substring(0, 6)}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 space-x-2">
                            <Calendar className="size-3.5 text-gray-400" />
                            <span className="font-medium text-gray-600">
                              {app.date
                                ? new Date(app.date).toLocaleString()
                                : "Date TBD"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// "use client";
// import { BarChart3, Coins, TrendingUp } from "lucide-react";

// import { redirect } from "next/navigation";
// import { useSession } from "@/lib/auth-client";

// import { Card, CardContent } from "./ui/card";

// type Appointment = {
//   id: string;
//   status: "Scheduled" | "Completed" | "Cancelled"; // adjust as needed
//   date?: string;
//   studentName?: string;
// };

// export default function EducatorDashboard({
//   appointments,
//   publishedCoursesCount,
// }: {
//   appointments: Appointment[];
//   publishedCoursesCount: number;
// }) {
//   const { data: session, isPending: sessionPending } = useSession();

//   // 1. Check Auth & Role FIRST
//   if (!session?.user) redirect("/login");

//   if (session.user.role !== "Educator") {
//     redirect("/onboarding");
//   }

//   if (sessionPending)
//     return <div className="p-8 text-center text-zinc-500">Loading...</div>;
//   if (!session)
//     return <div className="p-8 text-center text-red-500">Access Denied</div>;

//   const scheduledAppointments =
//     appointments?.filter((app) => app.status === "Scheduled") || [];

//   const data = [30, 45, 35, 85, 40, 55, 45, 60, 30, 75, 50, 40];
//   const labels = [
//     "JAN",
//     "FEB",
//     "MAR",
//     "APR",
//     "MAY",
//     "JUN",
//     "JUL",
//     "AUG",
//     "SEP",
//     "OCT",
//     "NOV",
//     "DEC",
//   ];

//   const width = 1000;
//   const height = 200;

//   const points = data.map((h, i) => ({
//     x: i * (width / (data.length - 1)),
//     y: height - (h / 100) * height,
//     value: h * 100, // Example: turning percentage into "Points"
//   }));

//   const linePath = points.map((p) => `${p.x},${p.y}`).join(" ");
//   const areaPath = `${linePath} ${points[points.length - 1].x},${height} 0,${height}`;

//   const stats = [
//     {
//       label: "Appointments",
//       value: scheduledAppointments.length,
//       sub: "Upcoming",
//       icon: Coins,
//       color: "text-emerald-400",
//     },
//     {
//       label: "Courses",
//       value: publishedCoursesCount,
//       sub: "Published",
//       icon: TrendingUp,
//       color: "text-blue-400",
//     },
//     {
//       label: "Students",
//       value: 0,
//       sub: "Enrolled",
//       icon: BarChart3,
//       color: "text-orange-400",
//     },
//   ];

//   return (
//     <div className="max-w-7xl mx-auto space-y-6">
//       {/* Welcome Card */}

//       {/* 2. Other Cards arranged horizontally below */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//         {stats.map((stat, i) => (
//           <Card
//             key={i}
//             className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm group"
//           >
//             <CardContent className="p-6">
//               <div className="flex justify-between items-start">
//                 <div className="space-y-1">
//                   <p className="text-lg font-medium text-zinc-400">
//                     {stat.label}
//                   </p>
//                   <p className="text-4xl pt-5 font-bold text-white">
//                     {stat.value}
//                   </p>
//                   <p className="text-xs text-zinc-500">{stat.sub}</p>
//                 </div>
//                 <div className="p-2 rounded-xl bg-zinc-800 transition-colors group-hover:bg-zinc-700">
//                   <stat.icon className={`size-5 ${stat.color}`} />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Bars */}
//       <div className="col-span-12 bg-[#1a1a1a] p-8 rounded-xl border border-white/5 shadow-2xl">
//         <div className="relative h-64 w-full">
//           <svg
//             viewBox={`0 0 ${width} ${height}`}
//             className="w-full h-48 overflow-visible"
//             preserveAspectRatio="none"
//           >
//             <defs>
//               <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="0%" stopColor="#DFFF00" stopOpacity="0.3" />
//                 <stop offset="100%" stopColor="#DFFF00" stopOpacity="0" />
//               </linearGradient>
//             </defs>

//             <polyline fill="url(#lineGradient)" points={areaPath} />

//             <polyline
//               fill="none"
//               stroke="#DFFF00"
//               strokeWidth="3"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               points={linePath}
//               className="drop-shadow-[0_0_8px_rgba(223,255,0,0.4)]"
//             />

//             {points.map((p, i) => (
//               <g key={i} className="group/point">
//                 {/* Invisible 'Hit Area' - makes hovering easier */}
//                 <rect
//                   x={p.x - 20}
//                   y={0}
//                   width="40"
//                   height={height}
//                   fill="transparent"
//                   className="cursor-pointer"
//                 />

//                 {/* The Dot */}
//                 <circle
//                   cx={p.x}
//                   cy={p.y}
//                   r="4"
//                   className="fill-[#1a1a1a] stroke-[#DFFF00] stroke-2 transition-all duration-200 group-hover/point:r-6 group-hover/point:fill-[#DFFF00]"
//                 />

//                 {/* Tooltip Wrapper */}
//                 <foreignObject
//                   x={p.x - 40}
//                   y={p.y - 50}
//                   width="80"
//                   height="40"
//                   className="opacity-0 translate-y-2 transition-all duration-200 group-hover/point:opacity-100 group-hover/point:translate-y-0 pointer-events-none"
//                 >
//                   <div className="flex justify-center">
//                     <div className="bg-white text-black text-[11px] font-bold px-2 py-1 rounded shadow-xl relative">
//                       {p.value} pts
//                       {/* Tiny Arrow */}
//                       <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
//                     </div>
//                   </div>
//                 </foreignObject>
//               </g>
//             ))}
//           </svg>

//           <div className="flex justify-between mt-6 px-1">
//             {labels.map((label, i) => (
//               <span
//                 key={i}
//                 className="text-[10px] text-gray-500 font-bold tracking-wider"
//               >
//                 {label}
//               </span>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
