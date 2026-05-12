"use client";

import { useSession } from "@/lib/auth-client";
import {
  Calendar,
  BookOpen,
  ArrowRight,
  Video,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

type Appointment = {
  id: string;
  status: "Scheduled" | "Completed" | "Cancelled" | string;
  startTime: string;
  educator?: { name?: string };
};

type Course = { id: string; title?: string };

type CoursesResponse = { courses: Course[] };

type Props = {
  appointments: Appointment[];
  courses: CoursesResponse;
  plan: "Free" | "Standard" | "Premium";
};

const planStyles = {
  Free: "text-zinc-500",
  Standard: "text-emerald-400",
  Premium: "text-amber-300",
};

type StatCardProps = {
  title: string;
  value: number | string;
  icon: LucideIcon;
};

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/5 bg-zinc-950/40 backdrop-blur-2xl shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)] hover:shadow-[0_0_60px_-10px_rgba(16,185,129,0.25)] transition">
      {children}
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-md p-6 bg-linear-to-b from-zinc-900/60 to-black border border-white/5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            {title}
          </p>

          <p className="text-3xl font-semibold mt-2 tracking-tight text-white">
            {value}
          </p>
        </div>

        <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard({
  appointments,
  courses,
  plan,
}: Props) {
  const { data: session, isPending } = useSession();

  if (isPending)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-emerald-400">
        Loading dashboard...
      </div>
    );

  if (!session)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-400">
        Access denied
      </div>
    );

  const scheduled = appointments?.filter((a) => a.status === "Scheduled") || [];
  const hasUsedFreeSession =
    appointments?.some((a) => a.status === "Completed") || false;

  return (
    <div className="min-h-screen bg-background text-white">
      {/* HEADER */}

      {/* GRID */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <StatCard
              title="Upcoming Sessions"
              value={scheduled.length}
              icon={Calendar}
            />
            <StatCard
              title="Courses"
              value={courses?.courses?.length ?? 0}
              icon={BookOpen}
            />
          </div>

          <GlassCard>
            <div className="p-6 border-b border-white/5 flex items-center gap-2">
              <Calendar className="text-emerald-400" />
              <h2 className="font-medium tracking-wide">Upcoming Sessions</h2>
            </div>

            <div className="p-6 space-y-3">
              {scheduled.length ? (
                scheduled.slice(0, 4).map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-md bg-white/5 border border-white/5 hover:border-emerald-500/30 transition"
                  >
                    <div>
                      <p className="font-medium tracking-tight">
                        {app.educator?.name || "Session"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(app.startTime).toLocaleString()}
                      </p>
                    </div>

                    <Link
                      href="/student/appointments"
                      className="px-4 py-2 rounded-md bg-emerald-500/90 hover:bg-emerald-500 text-black text-sm font-medium flex items-center gap-2"
                    >
                      <Video className="w-4 h-4" /> Join
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-zinc-500 py-10">
                  No upcoming sessions
                </p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <GlassCard>
            <div className="p-6 text-center relative overflow-hidden">
              {/* Glow */}
              <div className="absolute inset-0 bg-emerald-500/5 blur-3xl pointer-events-none" />

              <CreditCard className="mx-auto text-emerald-400 relative z-10" />

              <p className="text-xs text-zinc-500 mt-2 uppercase tracking-widest relative z-10">
                Current Plan
              </p>

              <h3
                className={`text-3xl font-semibold mt-2 relative z-10 ${planStyles[plan]}`}
              >
                {plan}
              </h3>

              {/* FREE SESSION STATUS */}
              {plan === "Free" && (
                <div className="mt-5 relative z-10">
                  {!hasUsedFreeSession ? (
                    <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4 text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-md bg-emerald-400 animate-pulse" />

                        <p className="text-sm font-medium text-emerald-300">
                          1 Free Live Session Available
                        </p>
                      </div>

                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        Book your complimentary live session with an educator
                        and experience personalized learning.
                      </p>

                      <Link
                        href="/student/appointments"
                        className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-emerald-500 text-black py-2.5 text-sm font-medium hover:bg-emerald-400 transition"
                      >
                        Book Free Session
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-md border border-zinc-800 bg-white/5 p-4 text-left">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />

                        <p className="text-sm font-medium text-zinc-200">
                          Free Session Used
                        </p>
                      </div>

                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                        Your complimentary live session has been completed.
                        Upgrade your plan to continue booking premium sessions.
                      </p>

                      <Link
                        href="/student/myplan"
                        className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-white/10 border border-white/10 text-white py-2.5 text-sm font-medium hover:bg-white/15 transition"
                      >
                        Upgrade Plan
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* STANDARD/PREMIUM CTA */}
              {plan !== "Free" && (
                <Link
                  href="/student/myplan"
                  className="mt-6 inline-block w-full bg-emerald-500 text-black py-3 rounded-md font-medium hover:bg-emerald-400 transition relative z-10"
                >
                  Manage Subscription
                </Link>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <BookOpen className="text-emerald-400" />
              <p className="text-xs text-zinc-500 mt-2 uppercase tracking-widest">
                My Courses
              </p>
              <p className="text-3xl font-semibold mt-2">
                {courses?.courses?.length ?? 0}
              </p>

              <Link
                href="/student/enrolled"
                className="text-emerald-400 text-sm mt-4 inline-flex items-center gap-1"
              >
                Open classroom <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </GlassCard>

          <div className="rounded-md bg-linear-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 p-6 backdrop-blur-xl">
            <CheckCircle2 className="text-emerald-400" />
            <h3 className="font-medium mt-2">Assignments</h3>
            <p className="text-zinc-400 text-sm mt-1">
              Pending tasks awaiting completion
            </p>
            <Link
              href="/student/assignments"
              className="mt-5 block text-center bg-emerald-500 text-black py-3 rounded-md font-medium hover:bg-emerald-400"
            >
              View Tasks
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { useSession } from "@/lib/auth-client";
// import {
//   Calendar,
//   BookOpen,
//   ArrowRight,
//   Video,
//   LayoutDashboard,
//   CreditCard,
//   CheckCircle2,
//   Sparkles,
//   TrendingUp,
// } from "lucide-react";
// import Link from "next/link";

// type Appointment = {
//   id: string;
//   status: "Scheduled" | "Completed" | "Cancelled" | string;
//   startTime: string;
//   educator?: { name?: string };
// };

// type Course = { id: string; title?: string };

// type CoursesResponse = { courses: Course[] };

// type Props = {
//   appointments: Appointment[];
//   courses: CoursesResponse;
//   plan: "Free" | "Standard" | "Premium";
// };

// const planStyles = {
//   Free: "text-zinc-500",
//   Standard: "text-emerald-500",
//   Premium: "text-amber-400",
// };

// function GlassCard({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="rounded-3xl border border-white/10 bg-white/70 dark:bg-zinc-950/60 backdrop-blur-xl shadow-lg hover:shadow-emerald-500/10 transition">
//       {children}
//     </div>
//   );
// }

// function StatCard({ title, value, icon: Icon }: any) {
//   return (
//     <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-50 to-white dark:from-zinc-900 dark:to-zinc-950 border border-emerald-100/40 dark:border-zinc-800 shadow-sm">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm text-zinc-500">{title}</p>
//           <p className="text-3xl font-bold mt-1 text-zinc-900 dark:text-white">
//             {value}
//           </p>
//         </div>
//         <div className="p-3 rounded-2xl bg-emerald-500/10">
//           <Icon className="w-5 h-5 text-emerald-500" />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function StudentDashboard({
//   appointments,
//   courses,
//   plan,
// }: Props) {
//   const { data: session, isPending } = useSession();

//   if (isPending)
//     return (
//       <div className="min-h-screen flex items-center justify-center text-emerald-500">
//         Loading dashboard...
//       </div>
//     );

//   if (!session)
//     return (
//       <div className="min-h-screen flex items-center justify-center text-red-500">
//         Access denied
//       </div>
//     );

//   const scheduled = appointments?.filter((a) => a.status === "Scheduled") || [];

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-zinc-950 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white">
//       {/* HEADER */}
//       <div className="max-w-7xl mx-auto px-6 pt-10">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold flex items-center gap-2">
//               <Sparkles className="text-emerald-500" />
//               Student Dashboard
//             </h1>
//             <p className="text-sm text-zinc-500 mt-1">
//               Your learning hub, beautifully organized
//             </p>
//           </div>

//           <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-zinc-200 dark:border-zinc-800">
//             <TrendingUp className="w-4 h-4 text-emerald-500" />
//             <span className={`text-sm font-medium ${planStyles[plan]}`}>
//               {plan} Plan
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* GRID */}
//       <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-6">
//         {/* LEFT */}
//         <div className="lg:col-span-2 space-y-6">
//           <div className="grid sm:grid-cols-2 gap-4">
//             <StatCard
//               title="Upcoming Sessions"
//               value={scheduled.length}
//               icon={Calendar}
//             />
//             <StatCard
//               title="Courses"
//               value={courses?.courses?.length ?? 0}
//               icon={BookOpen}
//             />
//           </div>

//           <GlassCard>
//             <div className="p-5 border-b border-white/10 dark:border-zinc-800 flex justify-between">
//               <div className="flex items-center gap-2">
//                 <Calendar className="text-emerald-500" />
//                 <h2 className="font-semibold">Upcoming Sessions</h2>
//               </div>
//             </div>

//             <div className="p-5 space-y-3">
//               {scheduled.length ? (
//                 scheduled.slice(0, 4).map((app) => (
//                   <div
//                     key={app.id}
//                     className="flex items-center justify-between p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/40 border border-white/10 hover:border-emerald-300 transition"
//                   >
//                     <div>
//                       <p className="font-medium">
//                         {app.educator?.name || "Session"}
//                       </p>
//                       <p className="text-xs text-zinc-500">
//                         {new Date(app.startTime).toLocaleString()}
//                       </p>
//                     </div>

//                     <Link
//                       href="/student/appointments"
//                       className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm hover:bg-emerald-600 flex items-center gap-2"
//                     >
//                       <Video className="w-4 h-4" /> Join
//                     </Link>
//                   </div>
//                 ))
//               ) : (
//                 <p className="text-center text-sm text-zinc-500 py-10">
//                   No upcoming sessions
//                 </p>
//               )}
//             </div>
//           </GlassCard>
//         </div>

//         {/* RIGHT */}
//         <div className="space-y-6">
//           <GlassCard>
//             <div className="p-6 text-center">
//               <CreditCard className="mx-auto text-emerald-500" />
//               <p className="text-sm text-zinc-500 mt-2">Current Plan</p>
//               <h3 className={`text-3xl font-bold ${planStyles[plan]} mt-1`}>
//                 {plan}
//               </h3>

//               <Link
//                 href="/student/credit"
//                 className="mt-5 inline-block w-full bg-emerald-500 text-white py-3 rounded-2xl hover:bg-emerald-600"
//               >
//                 Upgrade
//               </Link>
//             </div>
//           </GlassCard>

//           <GlassCard>
//             <div className="p-6">
//               <BookOpen className="text-emerald-500" />
//               <p className="text-sm text-zinc-500 mt-2">My Courses</p>
//               <p className="text-3xl font-bold">
//                 {courses?.courses?.length ?? 0}
//               </p>
//               <Link
//                 href="/student/enrolled"
//                 className="text-emerald-500 text-sm mt-3 inline-flex items-center gap-1"
//               >
//                 Open <ArrowRight className="w-4 h-4" />
//               </Link>
//             </div>
//           </GlassCard>

//           <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 shadow-lg">
//             <CheckCircle2 />
//             <h3 className="font-semibold mt-2">Assignments</h3>
//             <p className="text-emerald-100 text-sm">You have pending tasks</p>
//             <Link
//               href="/student/assignments"
//               className="mt-4 block text-center bg-white text-emerald-600 py-3 rounded-2xl font-medium"
//             >
//               View Tasks
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// "use client";

// import { useSession } from "@/lib/auth-client";
// import { Calendar, BookOpen, ArrowRight, Video } from "lucide-react";
// import Link from "next/link";

// type Appointment = {
//   id: string;
//   status: "Scheduled" | "Completed" | "Cancelled" | string;
//   startTime: string;
//   educator?: {
//     name?: string;
//   };
// };

// type Course = {
//   id: string;
//   title?: string;
// };

// type CoursesResponse = {
//   courses: Course[];
// };

// type Props = {
//   appointments: Appointment[];
//   courses: CoursesResponse;
//   plan: "Free" | "Standard" | "Premium";
// };

// const planStyles = {
//   Free: "text-gray-500",
//   Standard: "text-emerald-600",
//   Premium: "text-yellow-500",
// };

// export default function StudentDashboard({
//   appointments,
//   courses,
//   plan,
// }: Props) {
//   const { data: session, isPending } = useSession();

//   if (isPending)
//     return <div className="p-8 text-center text-emerald-500">Loading...</div>;
//   if (!session)
//     return <div className="p-8 text-center text-red-500">Access Denied</div>;

//   const scheduledAppointments: Appointment[] =
//     appointments?.filter((a) => a.status === "Scheduled") || [];

//   return (
//     <div className="min-h-screen bg-background dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-white">
//       <div className="max-w-7xl mx-auto px-0 py-10 space-y-10">
//         {/* HERO HEADER */}

//         {/* MAIN GRID */}
//         <div className="grid lg:grid-cols-3 gap-6">
//           {/* LEFT - SESSIONS */}
//           <div className="lg:col-span-2 space-y-6">
//             <div className="rounded-md border border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden hover:shadow-md transition">
//               <div className="p-6 flex items-center justify-between border-b border-emerald-50 dark:border-zinc-800">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
//                     <Calendar className="w-5 h-5 text-emerald-600" />
//                   </div>
//                   <h2 className="font-semibold text-lg">Upcoming Sessions</h2>
//                 </div>

//                 <span className="text-xs px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20">
//                   {scheduledAppointments.length} scheduled
//                 </span>
//               </div>

//               <div className="p-6 space-y-4">
//                 {scheduledAppointments.length ? (
//                   scheduledAppointments.slice(0, 3).map((app: Appointment) => (
//                     <div
//                       key={app.id}
//                       className="flex items-center justify-between p-4 rounded-md border border-emerald-50 dark:border-zinc-800 hover:border-emerald-200 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition"
//                     >
//                       <div className="flex items-center gap-4">
//                         <div className="text-center w-14 py-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
//                           <p className="text-[10px] text-emerald-600 uppercase">
//                             {new Date(app.startTime).toLocaleString("en-US", {
//                               month: "short",
//                             })}
//                           </p>
//                           <p className="font-bold text-lg">
//                             {new Date(app.startTime).getDate()}
//                           </p>
//                         </div>

//                         <div>
//                           <p className="font-medium">
//                             {app.educator?.name || "1-on-1 Session"}
//                           </p>
//                           <p className="text-xs text-zinc-500">
//                             {new Date(app.startTime).toLocaleTimeString([], {
//                               hour: "2-digit",
//                               minute: "2-digit",
//                             })}
//                           </p>
//                         </div>
//                       </div>

//                       <Link
//                         href="/student/appointments"
//                         className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition"
//                       >
//                         <Video className="w-4 h-4" />
//                         Join
//                       </Link>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-center text-sm text-zinc-500 py-10">
//                     No upcoming sessions. Book your first session today.
//                   </p>
//                 )}
//               </div>

//               <div className="p-4 border-t border-emerald-50 dark:border-zinc-800">
//                 <Link
//                   href="/student/appointments"
//                   className="flex items-center justify-center text-sm text-emerald-600 hover:text-emerald-700 gap-2"
//                 >
//                   View all sessions <ArrowRight className="w-4 h-4" />
//                 </Link>
//               </div>
//             </div>
//           </div>

//           {/* RIGHT SIDEBAR */}
//           <div className="space-y-6">
//             {/* CREDIT CARD */}
//             <div className="rounded-md border border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
//               <p className="font-bold text-zinc-700 dark:text-zinc-200">
//                 Current Plan
//               </p>

//               <h3 className={`text-3xl font-bold mt-2 ${planStyles[plan]}`}>
//                 {plan}
//               </h3>

//               <p className="text-xs text-zinc-500 mt-1">
//                 Manage your subscription and billing
//               </p>

//               <Link
//                 href="/student/credit"
//                 className="mt-5 inline-flex w-full justify-center px-4 py-3 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
//               >
//                 Upgrade Plan
//               </Link>
//             </div>

//             {/* COURSES */}
//             <div className="rounded-md border border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-zinc-950 p-6 shadow-sm">
//               <div className="flex items-center gap-2 mb-3">
//                 <BookOpen className="w-5 h-5 text-emerald-600" />
//                 <h3 className="font-semibold">My Courses</h3>
//               </div>

//               <p className="text-3xl font-bold">
//                 {courses?.courses?.length ?? 0}
//               </p>

//               <Link
//                 href="/student/enrolled"
//                 className="text-sm text-emerald-600 mt-3 inline-flex items-center gap-1"
//               >
//                 Open classroom <ArrowRight className="w-4 h-4" />
//               </Link>
//             </div>

//             {/* ASSIGNMENTS */}
//             <div className="rounded-md bg-emerald-600 text-white p-6 shadow-lg relative overflow-hidden">
//               <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 blur-2xl rounded-md" />

//               <h3 className="font-semibold text-lg">Assignments</h3>
//               <p className="text-emerald-100 text-sm mt-2">
//                 You have pending tasks waiting for review.
//               </p>

//               <Link
//                 href="/student/assignments"
//                 className="mt-5 inline-block w-full text-center bg-white text-emerald-700 py-3 rounded-md font-medium hover:bg-emerald-50 transition"
//               >
//                 View Tasks
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
