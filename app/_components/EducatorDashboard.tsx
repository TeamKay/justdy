"use client";

import React from "react";
import Image from "next/image";
import { Calendar, Bell, MessageSquare, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card } from "./ui/card";

// ---------------- TYPES ----------------
export type Appointment = {
  id: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "Pending_payment" | string; // 🔥 Added support for DB statuses
  date?: string;
  studentName?: string;
  createdAt: string;
  startTime: string | Date; // Added property alignment field
};

// Define the type structure for incoming community requests/notifications
type CommunityNotification = {
  id: string;
  communityName: string;
  type: "unanswered_question" | "flagged_content" | "join_request";
  message: string;
  timestamp: string;
  actionUrl: string;
};

interface EducatorDashboardProps {
  appointments: Appointment[];
  publishedProductsCount: number;
  notifications?: CommunityNotification[]; // Array of community alerts requiring user response
}

export default function EducatorDashboard({
  appointments,
  publishedProductsCount,
  notifications = [], // Default to an empty array if none are provided
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

  // --- UploadThing Image Generation Logic ---
  const fileKey = session.user.image;

  // Construct the secure CDN url using UploadThing's delivery format, falling back to local asset if null
  const userAvatarSrc = fileKey
    ? `https://utfs.io/f/${fileKey}`
    : "/avatar-placeholder.png";

  return (
    <div className="w-full text-[#1d1d1d] font-sans antialiased p-2">
      <div className="max-w-8xl w-full mx-auto px-4 md:px-0 space-y-6">
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
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={userAvatarSrc}
                    width={80}
                    height={80}
                  />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
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
                  {publishedProductsCount}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Published Products
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

        {/* ---------------- QUICK ACTIONS / SUB BUTTONS ---------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionButton label="My Communities" href="/educator/communities" />
          <ActionButton
            label="Manage Appointments"
            href="/educator/appointments"
          />
          <ActionButton
            label="Courses & Curriculums"
            href="/educator/courses"
          />
          <ActionButton label="Earnings & Payouts" href="/educator/earnings" />
        </div>

        {/* ---------------- INSIGHTS SECTION ---------------- */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Community Notifications Requiring Responses */}
          <Card className="p-4 rounded-lg border border-white/10 bg-white/5 text-white">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">
                  Needs Your Attention
                </h3>
              </div>
              {notifications.length > 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">
                  {notifications.length} Pending
                </span>
              )}
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded bg-white/5 border border-white/5 hover:border-emerald-500/30 transition flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
                          {item.communityName}
                        </span>
                        <span className="text-[10px] text-white/40">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 mt-1 line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                    <div className="flex justify-end mt-1">
                      <a
                        href={item.actionUrl}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
                      >
                        Respond <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-white/25 mx-auto mb-2" />
                  <p className="text-sm text-white/50">
                    All caught up! No open items require your action right now.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Schedule Summary (Replacing System Metrics) */}
          <Card className="p-4 rounded-lg border border-white/10 bg-white/5 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  Upcoming Session Agenda
                </h3>
              </div>

              {scheduledAppointments.length > 0 ? (
                <div className="space-y-2">
                  {scheduledAppointments.slice(0, 3).map((app) => (
                    <div
                      key={app.id}
                      className="text-sm flex justify-between items-center bg-white/5 p-2 rounded border border-white/5"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {app.studentName || "Student"}
                        </p>
                        <p className="text-xs text-white/50">
                          {app.date || "Date Pending"}
                        </p>
                      </div>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                        Confirmed
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50 py-4 text-center">
                  No upcoming scheduled sessions today.
                </p>
              )}
            </div>

            <p className="text-[11px] text-white/40 mt-4 border-t border-white/5 pt-2">
              Performance metrics and dashboard trends sync dynamically every
              hour.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------- SUB-COMPONENTS ----------------

function ActionButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="px-4 py-3 text-sm font-medium text-center rounded-md bg-white/5 hover:bg-white/10 border border-emerald-950/40 hover:border-emerald-800 text-emerald-600 dark:text-emerald-300 transition shadow-xs cursor-pointer block"
    >
      {label}
    </a>
  );
}

// "use client";

// import React from "react";
// import Image from "next/image";
// import { Mail, Phone, MapPin, Calendar } from "lucide-react";
// import { redirect } from "next/navigation";
// import { useSession } from "@/lib/auth-client";
// import { Card } from "./ui/card";

// type Appointment = {
//   id: string;
//   status: "Scheduled" | "Completed" | "Cancelled";
//   date?: string;
//   studentName?: string;
//   createdAt: string;
// };

// interface EducatorDashboardProps {
//   appointments: Appointment[];
//   publishedCoursesCount: number;
// }

// export default function EducatorDashboard({
//   appointments,
//   publishedCoursesCount,
// }: EducatorDashboardProps) {
//   const { data: session, isPending: sessionPending } = useSession();

//   // 1. Auth & Role Guards
//   if (sessionPending) {
//     return <div className="p-8 text-center text-zinc-500">Loading...</div>;
//   }
//   if (!session?.user) redirect("/login");
//   if (session.user.role !== "Educator") {
//     redirect("/onboarding");
//   }

//   const scheduledAppointments =
//     appointments?.filter((app) => app.status === "Scheduled") || [];

//   // Graph math configuration setup
//   const graphData = [42, 28, 38, 26, 20, 24, 35, 32, 26, 38, 32, 34, 22];
//   const graphWidth = 1000;
//   const graphHeight = 220;
//   const points = graphData.map((h, i) => ({
//     x: i * (graphWidth / (graphData.length - 1)),
//     y: graphHeight - (h / 50) * graphHeight,
//   }));

//   let linePath = `M ${points[0].x} ${points[0].y}`;
//   for (let i = 0; i < points.length - 1; i++) {
//     const cpX1 = points[i].x + (points[i + 1].x - points[i].x) / 3;
//     const cpY1 = points[i].y;
//     const cpX2 = points[i].x + (2 * (points[i + 1].x - points[i].x)) / 3;
//     const cpY2 = points[i + 1].y;
//     linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i + 1].x} ${points[i + 1].y}`;
//   }

//   const areaPath = `${linePath} L ${points[points.length - 1].x} ${graphHeight} L 0 ${graphHeight} Z`;

//   // --- UploadThing Image Generation Logic ---
//   const fileKey = session.user.image;

//   // Construct the secure CDN url using UploadThing's delivery format, falling back to local asset if null
//   const userAvatarSrc = fileKey
//     ? `https://utfs.io/f/${fileKey}`
//     : "/avatar-placeholder.png";

//   return (
//     <div className="bg-background text-[#1d1d1d] font-sans antialiased pb-12">
//       <div className="max-w-7xl mx-auto md:px-0 space-y-6">
//         {/* Profile Card Header Block */}
//         <div className="bg-emerald-900/10 rounded-md border border-emerald-950 shadow-sm overflow-hidden">
//           {/* Cover Graphic Strip */}
//           <div className="h-44 w-full relative bg-linear-to-r from-amber-900 via-orange-950 to-sky-900 overflow-hidden">
//             <div className="absolute inset-0 opacity-60 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-size-[40px_40px] transform skew-y-12 scale-150"></div>
//           </div>

//           <div className="px-8 pb-6 relative flex flex-col md:flex-row md:items-center md:justify-between">
//             {/* Left Side: Avatar Details */}
//             <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:space-x-5 text-center sm:text-left">
//               <div className="w-32 h-32 rounded-full border-4 border-white bg-amber-100 flex items-center justify-center shadow-sm z-10 overflow-hidden relative">
//                 <Image
//                   src={userAvatarSrc}
//                   alt={`${session.user.name || "Educator"}'s Profile Picture`}
//                   width={128}
//                   height={128}
//                   className="object-cover w-full h-full"
//                   priority
//                   unoptimized={!!fileKey}
//                 />
//               </div>
//               <div className="mt-3 sm:mt-0 pb-1">
//                 <h1 className="text-2xl font-bold text-emerald-300 tracking-tight">
//                   {session.user.name || "Educator Profile"}
//                 </h1>
//                 <p className="text-sm text-gray-500 font-medium tracking-wide">
//                   {session.user.email || ""}
//                 </p>
//               </div>
//             </div>

//             {/* Right Side: Key High Level Metric Balances */}
//             <div className="flex justify-center items-center space-x-10 mt-6 md:mt-0 text-center md:text-right border-t pt-4 md:pt-0 md:border-0 border-gray-100">
//               <div>
//                 <p className="text-2xl font-bold text-emerald-300">
//                   {scheduledAppointments.length}
//                 </p>
//                 <p className="text-xs text-gray-400 font-medium mt-0.5">
//                   Upcoming Appointments
//                 </p>
//               </div>
//               <div>
//                 <p className="text-2xl font-bold text-emerald-300">
//                   {publishedCoursesCount}
//                 </p>
//                 <p className="text-xs text-gray-400 font-medium mt-0.5">
//                   Published Courses
//                 </p>
//               </div>
//               <div>
//                 <p className="text-2xl font-bold text-emerald-300">{0}</p>
//                 <p className="text-xs text-gray-400 font-medium mt-0.5">
//                   Active Students
//                 </p>
//               </div>
//               <div>
//                 <p className="text-2xl font-bold text-emerald-300">{0}</p>
//                 <p className="text-xs text-gray-400 font-medium mt-0.5">
//                   Total Earnings
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ---------------- QUICK ACTIONS / SUB BUTTONS ---------------- */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//           <ActionButton label="My Communities" href="/educator/communities" />
//           <ActionButton
//             label="Manage Appointments"
//             href="/educator/appointments"
//           />
//           <ActionButton
//             label="Courses & Curriculums"
//             href="/educator/courses"
//           />
//           <ActionButton label="Earnings & Payouts" href="/educator/earnings" />
//         </div>

//         <div className="grid md:grid-cols-2 gap-4">
//           <Card title="Database Overview Summary">
//             <div className="text-sm text-white/70 space-y-2">
//               <div className="flex justify-between border-b border-white/5 pb-1">
//                 <span>Total Active Profiles:</span>
//                 <span className="text-white font-semibold">{0}</span>
//               </div>
//               <div className="flex justify-between border-b border-white/5 pb-1">
//                 <span>Total Content Inventory:</span>
//                 <span className="text-white font-semibold">{0}</span>
//               </div>
//             </div>
//           </Card>

//           <Card title="System Performance">
//             <p className="text-sm text-white/70">
//               Database state counts fetched cleanly using concurrent queries.
//               Ensure indices are set up on user role column fields for fast
//               performance at scale.
//             </p>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ---------------- SUB-COMPONENTS ----------------

// function ActionButton({ label, href }: { label: string; href: string }) {
//   return (
//     <a
//       href={href}
//       className="px-4 py-3 text-sm font-medium text-center rounded-md bg-white/5 hover:bg-white/10 border border-emerald-950/40 hover:border-emerald-800 text-emerald-600 dark:text-emerald-300 transition shadow-xs cursor-pointer block"
//     >
//       {label}
//     </a>
//   );
// }
