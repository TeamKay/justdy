"use client";

import { useSession } from "@/lib/auth-client";
import React from "react";
import Link from "next/link";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  GraduationCap,
  LockKeyhole,
  Compass,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type UserProfile = {
  id?: string;
  description?: string | null;
};

type Appointment = {
  id: string;
  status: "Scheduled" | "Completed" | "Cancelled" | string;
  startTime: Date | string;
  educator?: {
    name?: string;
  };
};

type CourseItem = {
  id: string;
  title: string;
  category: string;
  progress?: number;
};

type DigitalProduct = {
  id: string;
  title: string;
};

type Props = {
  appointments?: Appointment[];
  courses?: CourseItem[];
  digitalProducts?: DigitalProduct[];
  userProfile?: UserProfile;
  plan?: string;
};

// ============================================================
// DATE FORMATTER
// ============================================================

function formatAppointmentTime(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", dateOptions).format(
    date,
  );
  const formattedTime = new Intl.DateTimeFormat("en-US", timeOptions).format(
    date,
  );

  return `${formattedDate} · ${formattedTime}`;
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function LearnerDashboard({
  courses = [],
  appointments = [],
  digitalProducts = [],
}: Props) {
  const { data: session, isPending } = useSession();

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="flex items-center gap-3 text-sm font-medium">
          <span className="size-5 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />
          Loading your learning hub...
        </div>
      </div>
    );
  }

  // ==========================================================
  // ACCESS DENIED
  // ==========================================================

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <LockKeyhole className="size-6" />
          </div>

          <h2 className="mt-6 text-xl font-bold tracking-tight text-white">
            Authentication Required
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Please sign in to access your learner dashboard and continue
            tracking your progress.
          </p>

          <Link
            href="/?login=true"
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
          >
            Sign In to Account
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================================
  // USER INFORMATION
  // ==========================================================

  const userName = session.user?.name || "Learner";
  const firstName = userName.trim().split(" ")[0] || "Learner";

  // ==========================================================
  // COURSE PROGRESS & CALCULATIONS
  // ==========================================================

  const averageProgress =
    courses.length > 0
      ? Math.round(
          courses.reduce((total, course) => total + (course.progress || 0), 0) /
            courses.length,
        )
      : 0;

  const activeCourses = courses.filter(
    (course) => (course.progress || 0) < 100,
  );

  const nextAppointment =
    appointments.length > 0
      ? (appointments.find(
          (appointment) => appointment.status !== "Cancelled",
        ) ?? null)
      : null;

  const nextCourse = activeCourses
    .slice()
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))[0];

  // ==========================================================
  // DASHBOARD LAYOUT
  // ==========================================================

  return (
    <div className="min-h-screen bg-white text-slate-100 flex flex-col md:flex-row">
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full">
        {/* TOP WELCOME BANNER */}
        <div className="relative overflow-hidden rounded-md bg-linear-to-r bg-white p-0">
          <div className="absolute right-0 top-0 size-80 rounded-md blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-2xl font-extrabold text-blue-600 tracking-tight">
                Welcome back, {firstName}! 👋
              </h1>
              <p className="mt-1 text-sm text-slate-400 max-w-lg">
                You&apos;re making great strides. Check your active sessions or
                jump right back into your top priority course.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
              >
                <Compass className="size-4" />
                Explore Products
              </Link>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-emerald-400">
            <MetricCard
              label="Enrolled Courses"
              value={courses.length}
              icon={<BookOpen className="size-4 text-indigo-400" />}
            />
            <MetricCard
              label="Digital Products"
              value={digitalProducts.length}
              icon={<Download className="size-4 text-indigo-400" />}
            />
            <MetricCard
              label="Tutoring Sessions"
              value={appointments.length}
              icon={<CalendarDays className="size-4 text-indigo-400" />}
            />
            <MetricCard
              label="Average Progress"
              value={`${averageProgress}%`}
              icon={<CheckCircle2 className="size-4 text-indigo-400" />}
            />
          </div>
        </div>

        {/* DYNAMIC TAB SECTIONS */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Active Course Focus */}
          <div className="lg:col-span-2 space-y-8">
            <section className="rounded-md border border-emerald-900/30 bg-white p-6 ">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-blue-900">
                  Continue Learning
                </h2>
                <Link
                  href="/learner/courses"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  View all
                </Link>
              </div>

              {nextCourse ? (
                <div className="rounded-md bg-amber-100 p-5">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-900 text-white text-xs font-semibold mb-3">
                    {nextCourse.category}
                  </span>
                  <h3 className="text-lg font-bold text-black">
                    {nextCourse.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-blue-800 mt-2">
                    <span>Progress</span>
                    <span className="font-semibold text-blue-800">
                      {nextCourse.progress || 0}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${nextCourse.progress || 0}%` }}
                    />
                  </div>
                  <div className="mt-5 flex justify-end">
                    <Link
                      href={`/learner/courses/${nextCourse.id}`}
                      className="inline-flex items-center gap-2 rounded-md bg-white text-slate-950 px-4 py-2 text-xs font-bold transition hover:bg-slate-200"
                    >
                      Resume Lesson <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <GraduationCap className="size-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">
                    No active courses found.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Upcoming Sessions & Quick Actions */}
          <div className="space-y-8">
            <section className="rounded-md bg-amber-100 p-6 backdrop-blur-xl shadow-lg">
              <h2 className="text-lg font-bold text-blue-900 mb-4">
                Next Tutoring Session
              </h2>

              {nextAppointment ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <Clock3 className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {nextAppointment.educator?.name || "Educator"}
                      </p>
                      <p className="text-xs text-slate-400">1-on-1 Coaching</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/40 p-4 border border-slate-800/80">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Time
                    </p>
                    <p className="text-sm font-bold text-white mt-1">
                      {formatAppointmentTime(nextAppointment.startTime)}
                    </p>
                  </div>

                  <Link
                    href="/learner/appointments"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white transition border border-slate-700"
                  >
                    Manage Sessions <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <CalendarDays className="size-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No upcoming sessions scheduled.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-emerald-900/30 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-blue-900">{label}</span>
      </div>
      <p className="text-xl font-extrabold text-black">{value}</p>
    </div>
  );
}

// "use client";

// import { useSession } from "@/lib/auth-client";
// import React from "react";
// import Image from "next/image";
// import Link from "next/link";

// import {
//   ArrowRight,
//   BookOpen,
//   CalendarDays,
//   CheckCircle2,
//   ChevronRight,
//   Clock3,
//   Download,
//   GraduationCap,
//   LayoutDashboard,
//   LockKeyhole,
//   MessageCircle,
//   PackageOpen,
//   PlayCircle,
//   ShoppingBag,
//   Sparkles,
// } from "lucide-react";

// // ============================================================
// // TYPES
// // ============================================================

// type UserProfile = {
//   id?: string;
//   description?: string | null;
// };

// type Appointment = {
//   id: string;
//   status: "Scheduled" | "Completed" | "Cancelled" | string;
//   startTime: Date | string;

//   educator?: {
//     name?: string;
//   };
// };

// type CourseItem = {
//   id: string;
//   title: string;
//   category: string;
//   progress?: number;
// };

// type DigitalProduct = {
//   id: string;
//   title: string;
// };

// type Props = {
//   appointments?: Appointment[];
//   courses?: CourseItem[];
//   digitalProducts?: DigitalProduct[];
//   userProfile?: UserProfile;
//   plan?: string;
// };

// // ============================================================
// // DATE FORMATTER
// // ============================================================

// function formatAppointmentTime(dateInput: Date | string): string {
//   const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

//   if (isNaN(date.getTime())) {
//     return "Invalid Date";
//   }

//   const dateOptions: Intl.DateTimeFormatOptions = {
//     weekday: "short",
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   };

//   const timeOptions: Intl.DateTimeFormatOptions = {
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   };

//   const formattedDate = new Intl.DateTimeFormat("en-US", dateOptions).format(
//     date,
//   );

//   const formattedTime = new Intl.DateTimeFormat("en-US", timeOptions).format(
//     date,
//   );

//   return `${formattedDate} · ${formattedTime}`;
// }

// // ============================================================
// // MAIN DASHBOARD
// // ============================================================

// export default function LearnerDashboard({
//   courses = [],
//   appointments = [],
//   digitalProducts = [],
//   plan,
// }: Props) {
//   const { data: session, isPending } = useSession();

//   // ==========================================================
//   // LOADING
//   // ==========================================================

//   if (isPending) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-slate-50">
//         <div className="flex items-center gap-3 text-sm text-slate-500">
//           <span className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
//           Loading your dashboard...
//         </div>
//       </div>
//     );
//   }

//   // ==========================================================
//   // ACCESS DENIED
//   // ==========================================================

//   if (!session) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
//         <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
//           <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-red-50">
//             <LockKeyhole className="size-6 text-red-500" />
//           </div>

//           <h2 className="mt-5 text-xl font-bold text-slate-900">
//             Sign in required
//           </h2>

//           <p className="mt-2 text-sm leading-6 text-slate-500">
//             Please sign in to access your learner dashboard.
//           </p>

//           <Link
//             href="/?login=true"
//             className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
//           >
//             Sign In
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   // ==========================================================
//   // USER INFORMATION
//   // ==========================================================

//   const userName = session.user?.name || "Learner";

//   const firstName = userName.trim().split(" ")[0] || "Learner";

//   const userImage = session.user?.image;

//   const userInitials =
//     userName
//       .split(" ")
//       .filter(Boolean)
//       .slice(0, 2)
//       .map((part) => part[0]?.toUpperCase())
//       .join("") || "L";

//   // ==========================================================
//   // COURSE PROGRESS
//   // ==========================================================

//   const averageProgress =
//     courses.length > 0
//       ? Math.round(
//           courses.reduce((total, course) => total + (course.progress || 0), 0) /
//             courses.length,
//         )
//       : 0;

//   const activeCourses = courses.filter(
//     (course) => (course.progress || 0) < 100,
//   );

//   const completedCourses = courses.filter(
//     (course) => (course.progress || 0) >= 100,
//   );

//   // ==========================================================
//   // APPOINTMENTS
//   //
//   // IMPORTANT:
//   // We intentionally do NOT call Date.now(), new Date(), or
//   // any other time-dependent function during render.
//   //
//   // getLearnerDashboardData() should provide appointments
//   // already ordered with the next appointment first.
//   // ==========================================================

//   const nextAppointment =
//     appointments.length > 0
//       ? (appointments.find(
//           (appointment) => appointment.status !== "Cancelled",
//         ) ?? null)
//       : null;

//   // ==========================================================
//   // NEXT COURSE
//   // ==========================================================

//   const nextCourse = activeCourses
//     .slice()
//     .sort((a, b) => (b.progress || 0) - (a.progress || 0))[0];

//   // ==========================================================
//   // TOTAL LEARNING ITEMS
//   // ==========================================================

//   const totalLearningItems = courses.length + digitalProducts.length;

//   // ==========================================================
//   // DASHBOARD
//   // ==========================================================

//   return (
//     <div className="min-h-screen bg-slate-50">
//       <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
//         {/* ====================================================
//             WELCOME HERO
//         ===================================================== */}

//         <section className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-xl">
//           <div className="absolute -right-32 -top-32 size-96 rounded-full bg-blue-600/20 blur-3xl" />

//           <div className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-indigo-500/10 blur-3xl" />

//           <div className="relative px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
//             <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
//               {/* USER */}

//               <div className="flex items-center gap-4">
//                 <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-lg font-bold text-white shadow-lg sm:size-20">
//                   {userImage ? (
//                     <Image
//                       src={userImage}
//                       alt={userName}
//                       fill
//                       sizes="80px"
//                       className="object-cover"
//                     />
//                   ) : (
//                     userInitials
//                   )}
//                 </div>

//                 <div>
//                   <div className="flex items-center gap-2">
//                     <Sparkles className="size-4 text-blue-400" />

//                     <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
//                       Learner Dashboard
//                     </span>
//                   </div>

//                   <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
//                     Welcome back, {firstName}
//                   </h1>

//                   <p className="mt-1 text-sm text-slate-400">
//                     Continue your learning journey and pick up where you left
//                     off.
//                   </p>
//                 </div>
//               </div>

//               {/* ACTIONS */}

//               <div className="flex flex-wrap gap-3">
//                 <Link
//                   href="/learner/enrolled"
//                   className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
//                 >
//                   <PlayCircle className="size-4" />
//                   Continue Learning
//                 </Link>

//                 <Link
//                   href="/courses"
//                   className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
//                 >
//                   Browse Courses
//                   <ArrowRight className="size-4" />
//                 </Link>
//               </div>
//             </div>

//             {/* ==================================================
//                 MINI STATS
//             =================================================== */}

//             <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
//               <HeroStat
//                 icon={<BookOpen className="size-4" />}
//                 label="Enrolled Courses"
//                 value={courses.length}
//               />

//               <HeroStat
//                 icon={<Download className="size-4" />}
//                 label="Digital Products"
//                 value={digitalProducts.length}
//               />

//               <HeroStat
//                 icon={<CalendarDays className="size-4" />}
//                 label="Tutoring Sessions"
//                 value={appointments.length}
//               />

//               <HeroStat
//                 icon={<CheckCircle2 className="size-4" />}
//                 label="Average Progress"
//                 value={`${averageProgress}%`}
//               />
//             </div>
//           </div>
//         </section>

//         {/* ====================================================
//             QUICK ACCESS
//         ===================================================== */}

//         <section className="mt-6">
//           <div className="mb-4">
//             <h2 className="text-lg font-bold text-slate-900">
//               Your learning space
//             </h2>

//             <p className="mt-1 text-sm text-slate-500">
//               Everything you need to manage your learning in one place.
//             </p>
//           </div>

//           <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//             <DashboardLink
//               href="/learner/enrolled"
//               icon={<BookOpen className="size-5" />}
//               title="My Courses"
//               description="Continue your enrolled courses"
//               count={courses.length}
//             />

//             <DashboardLink
//               href="/learner/products"
//               icon={<PackageOpen className="size-5" />}
//               title="Digital Products"
//               description="Access your purchased resources"
//               count={digitalProducts.length}
//             />

//             <DashboardLink
//               href="/learner/appointments"
//               icon={<CalendarDays className="size-5" />}
//               title="Tutoring Sessions"
//               description="View and manage your sessions"
//               count={appointments.length}
//             />
//           </div>
//         </section>

//         {/* ====================================================
//             MAIN CONTENT
//         ===================================================== */}

//         <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
//           {/* CONTINUE LEARNING */}

//           <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//             <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
//               <div>
//                 <h2 className="font-bold text-slate-900">Continue learning</h2>

//                 <p className="mt-0.5 text-xs text-slate-500">
//                   Pick up where you left off.
//                 </p>
//               </div>

//               <Link
//                 href="/learner/enrolled"
//                 className="text-xs font-semibold text-blue-600 hover:text-blue-700"
//               >
//                 View all
//               </Link>
//             </div>

//             <div className="p-5">
//               {nextCourse ? (
//                 <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
//                   <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
//                     <div className="min-w-0">
//                       <div className="mb-2 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
//                         {nextCourse.category}
//                       </div>

//                       <h3 className="text-lg font-bold text-slate-900">
//                         {nextCourse.title}
//                       </h3>

//                       <p className="mt-1 text-sm text-slate-500">
//                         {nextCourse.progress || 0}% complete
//                       </p>

//                       <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
//                         <div
//                           className="h-full rounded-full bg-blue-600 transition-all"
//                           style={{
//                             width: `${Math.min(
//                               100,
//                               Math.max(0, nextCourse.progress || 0),
//                             )}%`,
//                           }}
//                         />
//                       </div>
//                     </div>

//                     <Link
//                       href={`/learner/enrolled/${nextCourse.id}`}
//                       className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
//                     >
//                       Continue
//                       <ArrowRight className="size-4" />
//                     </Link>
//                   </div>
//                 </div>
//               ) : completedCourses.length > 0 ? (
//                 <EmptyState
//                   icon={<CheckCircle2 className="size-6" />}
//                   title="Great work!"
//                   description="You've completed all your current courses. Explore more learning opportunities."
//                   href="/courses"
//                   action="Browse Courses"
//                 />
//               ) : (
//                 <EmptyState
//                   icon={<GraduationCap className="size-6" />}
//                   title="Start your learning journey"
//                   description="You haven't enrolled in a course yet. Explore our courses and find something that interests you."
//                   href="/courses"
//                   action="Explore Courses"
//                 />
//               )}
//             </div>
//           </section>

//           {/* UPCOMING SESSION */}

//           <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
//             <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
//               <div>
//                 <h2 className="font-bold text-slate-900">Upcoming session</h2>

//                 <p className="mt-0.5 text-xs text-slate-500">
//                   Your next tutoring appointment.
//                 </p>
//               </div>

//               <CalendarDays className="size-5 text-slate-300" />
//             </div>

//             <div className="p-5">
//               {nextAppointment ? (
//                 <div>
//                   <div className="flex items-center gap-3">
//                     <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
//                       <Clock3 className="size-5" />
//                     </div>

//                     <div className="min-w-0">
//                       <p className="text-sm font-bold text-slate-900">
//                         {nextAppointment.educator?.name || "Your Educator"}
//                       </p>

//                       <p className="mt-1 text-xs text-slate-500">
//                         Upcoming tutoring session
//                       </p>
//                     </div>
//                   </div>

//                   <div className="mt-5 rounded-xl bg-slate-50 p-4">
//                     <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
//                       Scheduled for
//                     </p>

//                     <p className="mt-1 text-sm font-bold text-slate-900">
//                       {formatAppointmentTime(nextAppointment.startTime)}
//                     </p>
//                   </div>

//                   <Link
//                     href="/learner/appointments"
//                     className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
//                   >
//                     View Session
//                     <ArrowRight className="size-4" />
//                   </Link>
//                 </div>
//               ) : (
//                 <EmptyState
//                   icon={<CalendarDays className="size-6" />}
//                   title="No upcoming sessions"
//                   description="Book a tutoring session when you're ready to learn with an educator."
//                   href="/learner/appointments"
//                   action="View Sessions"
//                 />
//               )}
//             </div>
//           </section>
//         </div>

//         {/* ====================================================
//             PROGRESS + ACCOUNT
//         ===================================================== */}

//         <div className="mt-6 grid gap-6 md:grid-cols-2">
//           {/* PROGRESS */}

//           <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="font-bold text-slate-900">Learning progress</h2>

//                 <p className="mt-1 text-xs text-slate-500">
//                   Your overall progress across enrolled courses.
//                 </p>
//               </div>

//               <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
//                 {averageProgress}%
//               </div>
//             </div>

//             <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
//               <div
//                 className="h-full rounded-full bg-blue-600 transition-all"
//                 style={{
//                   width: `${averageProgress}%`,
//                 }}
//               />
//             </div>

//             <div className="mt-4 flex items-center justify-between text-xs">
//               <span className="text-slate-500">
//                 {completedCourses.length} completed
//               </span>

//               <span className="font-semibold text-slate-700">
//                 {activeCourses.length} in progress
//               </span>
//             </div>

//             <Link
//               href="/learner/progress"
//               className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
//             >
//               View detailed progress
//               <ChevronRight className="size-4 text-slate-400" />
//             </Link>
//           </section>

//           {/* ACCOUNT */}

//           <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="flex items-start justify-between">
//               <div>
//                 <h2 className="font-bold text-slate-900">
//                   Your Justdy account
//                 </h2>

//                 <p className="mt-1 text-xs text-slate-500">
//                   Manage your learning account and resources.
//                 </p>
//               </div>

//               <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
//                 <LayoutDashboard className="size-5 text-slate-600" />
//               </div>
//             </div>

//             <div className="mt-5 rounded-xl bg-slate-50 p-4">
//               <p className="text-xs font-medium text-slate-400">Current plan</p>

//               <p className="mt-1 text-base font-bold text-slate-900">
//                 {plan || "Learner"}
//               </p>

//               <p className="mt-1 text-xs text-slate-500">
//                 {totalLearningItems > 0
//                   ? `You have ${totalLearningItems} learning resource${
//                       totalLearningItems === 1 ? "" : "s"
//                     } in your Justdy account.`
//                   : "Start building your learning library today."}
//               </p>
//             </div>

//             <div className="mt-4 grid grid-cols-2 gap-3">
//               <AccountAction
//                 href="/learner/products"
//                 icon={<ShoppingBag className="size-4" />}
//                 label="My Library"
//               />

//               <AccountAction
//                 href="/learner/communities"
//                 icon={<MessageCircle className="size-4" />}
//                 label="Community"
//               />
//             </div>
//           </section>
//         </div>

//         {/* ====================================================
//             DISCOVER MORE
//         ===================================================== */}

//         <section className="mt-6 rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm sm:p-7">
//           <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
//             <div>
//               <div className="flex items-center gap-2">
//                 <Sparkles className="size-4 text-blue-600" />

//                 <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
//                   Keep growing
//                 </span>
//               </div>

//               <h2 className="mt-2 text-xl font-bold text-slate-900">
//                 Discover your next learning opportunity
//               </h2>

//               <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
//                 Explore courses, digital learning resources, and tutoring
//                 opportunities designed to help you reach your goals.
//               </p>
//             </div>

//             <Link
//               href="/courses"
//               className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
//             >
//               Explore Learning
//               <ArrowRight className="size-4" />
//             </Link>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }

// // ============================================================
// // HERO STAT
// // ============================================================

// function HeroStat({
//   icon,
//   label,
//   value,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   value: string | number;
// }) {
//   return (
//     <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
//       <div className="flex items-center gap-2">
//         <span className="text-blue-400">{icon}</span>

//         <span className="text-[11px] font-medium text-slate-400">{label}</span>
//       </div>

//       <p className="mt-2 text-xl font-bold text-white">{value}</p>
//     </div>
//   );
// }

// // ============================================================
// // DASHBOARD LINK
// // ============================================================

// function DashboardLink({
//   href,
//   icon,
//   title,
//   description,
//   count,
// }: {
//   href: string;
//   icon: React.ReactNode;
//   title: string;
//   description: string;
//   count: number;
// }) {
//   return (
//     <Link
//       href={href}
//       className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
//     >
//       <div className="flex items-start justify-between gap-3">
//         <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
//           {icon}
//         </div>

//         <ChevronRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
//       </div>

//       <div className="mt-4">
//         <div className="flex items-center gap-2">
//           <h3 className="text-sm font-bold text-slate-900">{title}</h3>

//           <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
//             {count}
//           </span>
//         </div>

//         <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
//       </div>
//     </Link>
//   );
// }

// // ============================================================
// // ACCOUNT ACTION
// // ============================================================

// function AccountAction({
//   href,
//   icon,
//   label,
// }: {
//   href: string;
//   icon: React.ReactNode;
//   label: string;
// }) {
//   return (
//     <Link
//       href={href}
//       className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
//     >
//       {icon}

//       {label}
//     </Link>
//   );
// }

// // ============================================================
// // EMPTY STATE
// // ============================================================

// function EmptyState({
//   icon,
//   title,
//   description,
//   href,
//   action,
// }: {
//   icon: React.ReactNode;
//   title: string;
//   description: string;
//   href: string;
//   action: string;
// }) {
//   return (
//     <div className="flex flex-col items-center justify-center py-7 text-center">
//       <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
//         {icon}
//       </div>

//       <h3 className="mt-4 text-sm font-bold text-slate-900">{title}</h3>

//       <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
//         {description}
//       </p>

//       <Link
//         href={href}
//         className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white transition hover:bg-blue-700"
//       >
//         {action}

//         <ArrowRight className="size-3.5" />
//       </Link>
//     </div>
//   );
// }
