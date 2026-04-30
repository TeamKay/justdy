"use client";

import { Button, buttonVariants } from "@/app/_components/ui/button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { IconLogout } from "@tabler/icons-react";
import { Calendar, BookOpen, ArrowRight, Video } from "lucide-react"; // Icons add a huge professional touch
import Link from "next/link";

type Appointment = {
  id: string;
  status: "Scheduled" | "Completed" | "Cancelled" | string;
  startTime: string;
  educator?: {
    name?: string;
  };
};

type Course = {
  id: string;
  title?: string;
};

type CoursesResponse = {
  courses: Course[];
};

export default function StudentDashboard({
  appointments,
  courses,
}: {
  appointments: Appointment[];
  courses: CoursesResponse;
}) {
  const { data: session, isPending: sessionPending } = useSession();

  if (sessionPending)
    return <div className="p-8 text-center text-zinc-500">Loading...</div>;
  if (!session)
    return <div className="p-8 text-center text-red-500">Access Denied</div>;

  const name = session?.user?.name ?? "User";
  const credits = (session.user as { credits?: number }).credits ?? 0;
  const scheduledAppointments =
    appointments?.filter((app) => app.status === "Scheduled") || [];

  return (
    <div className="max-w-7xl mx-auto p-0 lg:p-0 space-y-6 bg-background min-h-screen text-foreground">
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
      {/* Header Section */}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Card */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm flex flex-col">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-lg">Upcoming Sessions</h3>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">
              {scheduledAppointments.length} Total
            </span>
          </div>

          <div className="p-6 flex-1">
            {scheduledAppointments.length > 0 ? (
              <div className="space-y-4">
                {scheduledAppointments.slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-md border border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-12.5 py-1 bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] uppercase font-bold text-zinc-400">
                          {new Date(app.startTime).toLocaleString("en-US", {
                            month: "short",
                          })}
                        </p>
                        <p className="text-lg font-bold line-height-1">
                          {new Date(app.startTime).getDate()}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">
                          {app.educator?.name || "1-on-1 Session"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(app.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          • 60 mins
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/student/appointments"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "rounded-md border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all gap-2 flex items-center",
                      )}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Now</span>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-zinc-500 text-sm">
                  No sessions scheduled this week.
                </p>
                <Link
                  href="/educators"
                  className="text-emerald-600 text-sm font-medium mt-2 inline-block"
                >
                  Book a session →
                </Link>
              </div>
            )}
          </div>
          <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900 rounded-b-md">
            <Link
              href="/student/appointments"
              className="text-sm font-medium text-zinc-600 flex items-center justify-center gap-2 hover:text-zinc-900"
            >
              View Schedule <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Available Balance Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950/50">
            {/* Modern Gradient Accent */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl transition-opacity group-hover:opacity-100" />

            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Available Balance
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {credits}
                    </span>
                    <span className="text-sm font-semibold text-zinc-500">
                      credits
                    </span>
                  </div>
                  {/* Money Value Subtext */}
                  <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400/80">
                    Estimated value: ${(credits * 1.0).toFixed(2)} USD
                  </p>
                </div>

                {/* Optional Icon for visual focus */}
                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-400"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link href="/buy-credit" className="block w-full">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full gap-2 rounded-md border-zinc-200 bg-white font-semibold transition-all duration-200",
                      "hover:bg-zinc-900 hover:text-white hover:border-zinc-900",
                      "dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-50 dark:hover:text-zinc-900",
                    )}
                  >
                    <span>Add Funds</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Enrolled Courses */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">My Courses</h3>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">
                {courses?.courses?.length ?? 0}
              </span>
              <p className="text-zinc-500 text-sm mt-1 font-medium">
                Active Enrollments
              </p>
            </div>
            <Link href="/student/enrolled">
              <Button
                variant="outline"
                className="w-full rounded-md border-zinc-200 hover:bg-zinc-50"
              >
                Go to Classroom
              </Button>
            </Link>
          </div>

          {/* Assignments Card */}
          <div className="bg-zinc-900 dark:bg-emerald-950 text-white rounded-md p-6 shadow-xl relative overflow-hidden">
            {/* Decorative element */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-md blur-2xl" />

            <h3 className="font-semibold text-lg mb-2 relative z-10">
              Homework
            </h3>
            <p className="text-zinc-400 text-sm mb-6 relative z-10">
              You have 2 assignments pending for this week.
            </p>
            <Link href="/student/assignments">
              <Button className="w-full bg-white text-black hover:bg-zinc-200 rounded-md border-none">
                Review Tasks
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { Button, buttonVariants } from "@/app/_components/ui/button";
// import { useSession } from "@/lib/auth-client";
// import { cn } from "@/lib/utils";
// import Link from "next/link";
// import { useEffect, useState } from "react";
// import { getStudentAppointments } from "../actions/students";

// export default function StudentDashboard({
//   appointments,
//   courses,
// }: {
//   appointments: any[];
//   courses: any[];
// }) {
//   const { data: session, isPending: sessionPending } = useSession();

//   if (sessionPending) return <p>Loading...</p>;
//   if (!session) return <p>Access Denied</p>;

//   const name = session?.user?.name ?? "User";
//   const credits = (session.user as { credits?: number }).credits ?? 0;

//   // Inside StudentDashboard component
//   const scheduledAppointments =
//     appointments?.filter((app) => app.status === "Scheduled") || [];

//   return (
//     <div className="p-0 bg-background font-sans space-y-6">
//       {/* Welcome Banner */}
//       <div className="relative overflow-hidden rounded-sm bg-emerald-900/20 text-white/90 shadow-xl shadow-blue-100 lg:p-10">
//         <div className="relative z-10 grid grid-cols-1 items-center gap-8 md:grid-cols-2">
//           {/* Left Column: Welcome Text */}
//           <div className="space-y-4">
//             <div>
//               <h1 className="text-3xl font-bold tracking-tight lg:text-3xl">
//                 Welcome back, {name}
//               </h1>
//               <p className="mt-2 text-sm text-muted-foreground opacity-90">
//                 Manage your sessions and courses in your dashboard with ease
//               </p>
//             </div>
//             <Link
//               href="/buy-credit"
//               className={cn(
//                 buttonVariants({ variant: "default" }), // Using shadcn base styles
//                 "rounded-sm bg-white/60 px-6 py-3 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50 active:scale-95 border-none",
//               )}
//             >
//               Buy Credit
//             </Link>
//           </div>

//           {/* Right Column: Quick Highlight / Decorative Stats */}
//           <div className="flex justify-start md:justify-end">
//             {/* Added 'flex flex-col items-center' to the container below */}
//             <div className="flex flex-col items-center rounded-md border border-white/20 bg-emerald-800/20 p-6 backdrop-blur-md">
//               <p className="text-xs font-bold uppercase tracking-widest text-blue-100 text-center">
//                 Total Credits
//               </p>

//               <div className="mt-2 flex items-center justify-center gap-2">
//                 <span className="text-3xl font-bold">{credits}</span>
//               </div>

//               {/* Simple Progress Bar */}
//               <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-blue-900/30">
//                 <div
//                   className="h-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]"
//                   style={{ width: "100%" }} // Using style for width is often safer for dynamic values
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Analytics Section */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//         {/* Card 1: Upcoming Appointments */}
//         <div className="bg-emerald-900/20 p-6 rounded-sm border border-emerald-700/30 shadow-sm flex flex-col">
//           <div className="flex justify-between items-center mb-6">
//             <div>
//               <h3 className="font-bold text-lg text-white">Appointments</h3>
//               <p className="text-xs text-emerald-200/60">
//                 Your earliest schedulled sessions
//               </p>
//             </div>
//             {/* Use the filtered length here */}
//             <span className="px-2 py-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
//               {scheduledAppointments.length} Scheduled
//             </span>
//           </div>

//           <div className="flex-1 space-y-4 mb-6">
//             {scheduledAppointments.length > 0 ? (
//               scheduledAppointments.slice(0, 2).map((app) => (
//                 <div
//                   key={app.id}
//                   className="flex items-center gap-3 bg-zinc-900/40 p-3 rounded-md border border-white/5"
//                 >
//                   {/* Date Badge */}
//                   <div className="flex flex-col items-center justify-center bg-emerald-600/20 rounded h-12 w-12 border border-emerald-600/30 flex-shrink-0">
//                     <span className="text-[10px] uppercase font-bold text-emerald-400 leading-none mb-1">
//                       {new Date(app.startTime).toLocaleString("en-US", {
//                         month: "short",
//                       })}
//                     </span>
//                     <span className="text-lg font-bold text-white leading-none">
//                       {new Date(app.startTime).getDate()}
//                     </span>
//                   </div>

//                   {/* Appointment Info */}
//                   <div className="overflow-hidden">
//                     <p className="text-sm font-semibold text-white truncate">
//                       {app.educator?.name || "1-on-1 Session"}
//                     </p>
//                     <p className="text-xs text-slate-400 flex items-center gap-1">
//                       {/* Formatted Time Range */}
//                       <span>
//                         {new Date(app.startTime).toLocaleTimeString("en-US", {
//                           hour: "numeric",
//                           minute: "2-digit",
//                           hour12: true,
//                         })}
//                       </span>
//                       <span>•</span>
//                       <span className="opacity-70">
//                         {new Date(app.endTime).toLocaleTimeString("en-US", {
//                           hour: "numeric",
//                           minute: "2-digit",
//                           hour12: true,
//                         })}
//                       </span>
//                     </p>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="flex flex-col items-center justify-center py-4 opacity-50">
//                 <p className="text-xs text-slate-400">No scheduled sessions.</p>
//               </div>
//             )}
//           </div>

//           <Link href="/student/appointments" className="mt-auto">
//             <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-none h-9 text-xs">
//               View All Details
//             </Button>
//           </Link>
//         </div>

//         {/* Card 2: Enrolled Courses */}
//         {/* Card 2: Enrolled Courses */}
//         <div className="bg-emerald-900/20 p-6 rounded-sm border border-emerald-700/30 shadow-sm flex flex-col">
//           <div className="flex justify-between items-center mb-6">
//             <div>
//               <h3 className="font-bold text-lg text-white">Enrolled Courses</h3>
//               <p className="text-xs text-emerald-200/60">
//                 Your active learning paths
//               </p>
//             </div>
//             {/* Dynamic Badge for count */}
//             <span className="px-2 py-1 text-[10px] font-bold bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
//               {/* Assuming you pass a 'courses' prop. If not, replace with a hardcoded number for now */}
//               {(courses as any)?.courses?.length || 0} Active
//             </span>
//           </div>

//           {/* Display big number for visual impact */}
//           <div className="flex-1 flex flex-col items-center justify-center mb-6">
//             <div className="text-5xl font-bold text-white mb-1">
//               {(courses as any)?.courses?.length || 0}
//             </div>
//             <p className="text-xs text-slate-400 uppercase tracking-wider">
//               Courses in progress
//             </p>
//           </div>

//           <Link href="/student/enrolled" className="mt-auto">
//             <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white border-none h-9 text-xs">
//               Go to My Courses
//             </Button>
//           </Link>
//         </div>

//         {/* Card 3: Recent Activity (The New Card) */}
//         <div className="bg-emerald-900/20 p-6 rounded-sm border border-emerald-700/30 shadow-sm flex flex-col">
//           <div className="flex justify-between items-center mb-6">
//             <div>
//               <h3 className="font-bold text-lg text-white">
//                 Homework/Assignments
//               </h3>
//               <p className="text-xs text-slate-500">View all homework</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
