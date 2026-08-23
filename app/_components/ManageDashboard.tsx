"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

import {
  Users,
  GraduationCap,
  BookOpen,
  Video,
  ShieldCheck,
  Settings,
  PlusCircle,
  BarChart3,
  X,
  PhoneCall,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { Skeleton } from "@/app/_components/ui/skeleton";

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export type ConsultationStats = {
  totalLeads: number;
  pendingCalls: number;
  completedCalls: number;
  conversionRate: number;
};

export type AdminStats = {
  totalLearners: number;
  totalEducators: number;
  totalCoursesApproved: number;
  totalLessonsApproved: number;
  consultations?: ConsultationStats;
};

type Props = {
  stats: AdminStats;
};

export default function ManageDashboard({
  stats = {
    totalLearners: 0,
    totalEducators: 0,
    totalCoursesApproved: 0,
    totalLessonsApproved: 0,
    consultations: {
      totalLeads: 0,
      pendingCalls: 0,
      completedCalls: 0,
      conversionRate: 0,
    },
  },
}: Props) {
  const { data: session, isPending } = useSession();

  const mounted = useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const [isStatsOpen, setIsStatsOpen] = useState(false);

  if (!mounted || isPending) {
    return <DashboardSkeleton />;
  }

  if (!session) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-md border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mb-4 flex size-12 items-center justify-center rounded-md border border-red-100 bg-red-50 text-red-600">
          <ShieldCheck className="size-6" />
        </div>

        <h2 className="mb-1 text-base font-semibold text-slate-900">
          Authentication Required
        </h2>

        <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-500">
          Please log in with authorized credentials to access management
          controls.
        </p>

        <Button
          size="sm"
          asChild
          className="bg-red-600 text-white shadow-sm hover:bg-red-700"
        >
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  const isAdmin = session.user?.role?.toLowerCase() === "admin";

  const consultations = stats.consultations || {
    totalLeads: 0,
    pendingCalls: 0,
    completedCalls: 0,
    conversionRate: 0,
  };

  const pendingCount = consultations.pendingCalls;
  const needsAttention = isAdmin && pendingCount > 0;
  const firstName = session.user?.name?.split(" ")[0] || "there";

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-4 lg:px-4 py-5 space-y-4">
      <section className="flex flex-col gap-5 rounded-md border border-slate-200 bg-card p-5 shadow-sm sm:p-0 lg:flex-row lg:items-center lg:justify-between lg:p-7">
        <div className="flex min-w-0 items-center gap-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Welcome back, {firstName}
              </h1>
            </div>

            <p className="text-sm text-slate-500">
              {isAdmin
                ? "Here's what's happening across your platform today."
                : "Manage your courses, students, and teaching activities."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <Button
              size="sm"
              variant="outline"
              asChild
              className="
                h-9
                border-slate-200
                bg-white
                px-3
                text-xs
                text-slate-700
                shadow-sm
                hover:bg-slate-50
              "
            >
              <Link href="/manage/settings">
                <Settings className="mr-1.5 size-3.5 text-slate-500" />
                Settings
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              asChild
              className="
                h-9
                bg-red-600
                px-3
                text-xs
                text-white
                shadow-sm
                hover:bg-red-700
              "
            >
              <Link href="/manage/products/new">
                <PlusCircle className="mr-1.5 size-3.5" />
                New Product
              </Link>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setIsStatsOpen(true)}
            className="
              h-9
              gap-1.5
              bg-slate-900
              px-3
              text-xs
              text-white
              shadow-sm
              hover:bg-slate-800
            "
          >
            <BarChart3 className="size-3.5" />
            View Stats
          </Button>
        </div>
      </section>

      <section>
        {needsAttention ? (
          <div className="overflow-hidden rounded-md border border-amber-200 bg-amber-50">
            <div className="flex items-center justify-between gap-3 border-b border-amber-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <AlertCircle className="size-4" />
                <span>Items Requiring Your Attention</span>
              </div>

              <Badge
                variant="outline"
                className="
                  border-amber-200
                  bg-white
                  text-xs
                  font-medium
                  text-amber-700
                "
              >
                {pendingCount} Pending
              </Badge>
            </div>

            <div className="p-4 sm:p-5">
              <div
                className="
                  flex
                  flex-col
                  gap-4
                  rounded-md
                  border
                  border-slate-200
                  bg-white
                  p-4
                  shadow-sm

                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div className="flex items-start gap-3">
                  <div
                    className="
                      flex
                      size-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-md
                      border
                      border-amber-100
                      bg-amber-50
                      text-amber-600
                    "
                  >
                    <PhoneCall className="size-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Consultation Leads Awaiting Callback
                    </h3>

                    <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
                      You have {pendingCount} lead
                      {pendingCount === 1 ? "" : "s"} waiting for confirmation
                      or outreach.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  asChild
                  className="
                    h-9
                    shrink-0
                    bg-red-600
                    px-3
                    text-xs
                    text-white
                    hover:bg-red-700
                  "
                >
                  <Link href="/manage/consultation-leads">
                    Review Leads
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-emerald-200 bg-amber-100 p-6 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-emerald-100 bg-[#857938] text-white">
                  <CheckCircle className="size-5" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    All Caught Up
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {isAdmin
                      ? "No pending consultation requests or critical tasks require your attention."
                      : "Your course activities and student updates are up to date."}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsStatsOpen(true)}
                className="h-9 shrink-0 border-slate-200 bg-[#857938] px-3 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Sparkles className="mr-1.5 size-3.5 text-red-500" />
                Explore Metrics
              </Button>
            </div>
          </div>
        )}
      </section>

      {isStatsOpen && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-950/30
            p-4
            backdrop-blur-sm
          "
          onClick={() => setIsStatsOpen(false)}
        >
          <div
            className="
              flex
              max-h-[90vh]
              w-full
              max-w-3xl
              flex-col
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-2xl
            "
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    size-9
                    items-center
                    justify-center
                    rounded-lg
                    bg-red-50
                    text-red-600
                  "
                >
                  <BarChart3 className="size-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Detailed Platform Statistics
                  </h3>

                  <p className="text-xs text-slate-500">
                    Overview of platform growth and activity.
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setIsStatsOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Modal Content */}

            <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Core Ecosystem Metrics
                </h4>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ModalMetricCard
                    title="Learners"
                    value={stats.totalLearners}
                    icon={<Users className="size-4 text-slate-400" />}
                  />

                  <ModalMetricCard
                    title="Educators"
                    value={stats.totalEducators}
                    icon={<GraduationCap className="size-4 text-slate-400" />}
                  />

                  <ModalMetricCard
                    title="Courses"
                    value={stats.totalCoursesApproved}
                    icon={<BookOpen className="size-4 text-slate-400" />}
                  />

                  <ModalMetricCard
                    title="Lessons"
                    value={stats.totalLessonsApproved}
                    icon={<Video className="size-4 text-slate-400" />}
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="border-t border-slate-200 pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Consultation Funnel
                    </h4>

                    <Link
                      href="/manage/consultation-leads"
                      onClick={() => setIsStatsOpen(false)}
                      className="flex items-center text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Manage Leads
                      <ArrowRight className="ml-1 size-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <ModalMetricCard
                      title="Total Leads"
                      value={consultations.totalLeads}
                      icon={<Users className="size-4 text-slate-400" />}
                    />

                    <ModalMetricCard
                      title="Pending"
                      value={consultations.pendingCalls}
                      icon={<AlertCircle className="size-4 text-amber-500" />}
                    />

                    <ModalMetricCard
                      title="Completed"
                      value={consultations.completedCalls}
                      icon={
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      }
                    />

                    <ModalMetricCard
                      title="Conversion"
                      value={`${consultations.conversionRate}%`}
                      icon={<TrendingUp className="size-4 text-slate-400" />}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsStatsOpen(false)}
                className="border-slate-200 bg-white text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalMetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-slate-200
        bg-slate-50
        p-3.5
        transition-colors
        hover:bg-white
        hover:shadow-sm
      "
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {title}
        </span>

        {icon}
      </div>

      <div className="mt-1 text-xl font-bold tracking-tight text-slate-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

/* ==========================================================================
   DASHBOARD SKELETON
========================================================================== */

function DashboardSkeleton() {
  return (
    <div className="w-full space-y-8">
      {/* Header */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-xl" />

          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      </div>

      {/* Metrics */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>

      {/* Main */}

      <Skeleton className="h-40 rounded-2xl" />

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

// "use client";

// import React, { useState, useSyncExternalStore } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { useSession } from "@/lib/auth-client";
// import {
//   Users,
//   GraduationCap,
//   BookOpen,
//   Video,
//   ShieldCheck,
//   Settings,
//   PlusCircle,
//   BarChart3,
//   X,
//   PhoneCall,
//   AlertCircle,
//   CheckCircle2,
//   TrendingUp,
//   ArrowRight,
//   Sparkles,
//   CheckCircle,
// } from "lucide-react";

// import { Button } from "@/app/_components/ui/button";
// import { Badge } from "@/app/_components/ui/badge";
// import { Skeleton } from "@/app/_components/ui/skeleton";

// const emptySubscribe = () => () => {};
// const getSnapshot = () => true;
// const getServerSnapshot = () => false;

// export type ConsultationStats = {
//   totalLeads: number;
//   pendingCalls: number;
//   completedCalls: number;
//   conversionRate: number;
// };

// export type AdminStats = {
//   totalLearners: number;
//   totalEducators: number;
//   totalCoursesApproved: number;
//   totalLessonsApproved: number;
//   consultations?: ConsultationStats;
// };

// type Props = {
//   stats: AdminStats;
// };

// export default function ManageDashboard({
//   stats = {
//     totalLearners: 0,
//     totalEducators: 0,
//     totalCoursesApproved: 0,
//     totalLessonsApproved: 0,
//     consultations: {
//       totalLeads: 0,
//       pendingCalls: 0,
//       completedCalls: 0,
//       conversionRate: 0,
//     },
//   },
// }: Props) {
//   const { data: session, isPending } = useSession();

//   const mounted = useSyncExternalStore(
//     emptySubscribe,
//     getSnapshot,
//     getServerSnapshot,
//   );

//   const [isStatsOpen, setIsStatsOpen] = useState(false);

//   if (!mounted || isPending) {
//     return <DashboardSkeleton />;
//   }

//   if (!session) {
//     return (
//       <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-white">
//         <div className="size-12 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mb-4">
//           <ShieldCheck className="size-6" />
//         </div>

//         <h2 className="text-base font-semibold text-gray-900 mb-1">
//           Authentication Required
//         </h2>

//         <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
//           Please log in with authorized credentials to access management
//           controls.
//         </p>

//         <Button
//           size="sm"
//           asChild
//           className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
//         >
//           <Link href="/login">Sign In</Link>
//         </Button>
//       </div>
//     );
//   }

//   const isAdmin = session.user?.role?.toLowerCase() === "admin";

//   const consultations = stats.consultations || {
//     totalLeads: 0,
//     pendingCalls: 0,
//     completedCalls: 0,
//     conversionRate: 0,
//   };

//   // Determine if anything needs urgent attention
//   const pendingCount = consultations.pendingCalls;
//   const needsAttention = isAdmin && pendingCount > 0;

//   return (
//     <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 relative bg-white">
//       {/* =========================================================
//           HEADER SECTION
//       ========================================================= */}

//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
//         <div className="flex items-center gap-3.5">
//           {/* User Avatar */}
//           <div className="relative size-12 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0 shadow-sm">
//             {session.user?.image ? (
//               <Image
//                 src={session.user.image}
//                 alt={session.user.name ?? "User"}
//                 fill
//                 sizes="48px"
//                 className="object-cover"
//               />
//             ) : (
//               <div className="w-full h-full flex items-center justify-center font-bold text-sm text-gray-500">
//                 {session.user?.name?.charAt(0) || "U"}
//               </div>
//             )}
//           </div>

//           {/* Welcome Text */}
//           <div>
//             <div className="flex items-center gap-2 flex-wrap">
//               <h1 className="text-lg font-semibold tracking-tight text-gray-900">
//                 Welcome back, {session.user?.name?.split(" ")[0]}
//               </h1>

//               <Badge
//                 variant="outline"
//                 className="
//                   text-[10px]
//                   font-semibold
//                   tracking-wider
//                   uppercase
//                   rounded-md
//                   px-2
//                   py-0.5
//                   border-gray-200
//                   bg-gray-50
//                   text-gray-600
//                 "
//               >
//                 {isAdmin ? "Admin" : "Educator"}
//               </Badge>
//             </div>

//             <p className="text-sm text-gray-500 mt-0.5">
//               {isAdmin
//                 ? "Platform management & operational exception log."
//                 : "Manage your courses, content inventory, and student updates."}
//             </p>
//           </div>
//         </div>

//         {/* Header Actions */}
//         <div className="flex items-center gap-2">
//           {isAdmin ? (
//             <Button
//               size="sm"
//               variant="outline"
//               className="
//                 text-xs
//                 h-9
//                 px-3
//                 border-gray-200
//                 bg-white
//                 text-gray-700
//                 hover:bg-gray-50
//                 hover:text-gray-900
//               "
//               asChild
//             >
//               <Link href="/admin/settings">
//                 <Settings className="size-3.5 mr-1.5 text-gray-500" />
//                 Settings
//               </Link>
//             </Button>
//           ) : (
//             <Button
//               size="sm"
//               className="
//                 text-xs
//                 h-9
//                 px-3
//                 bg-red-600
//                 hover:bg-red-700
//                 text-white
//                 shadow-sm
//               "
//               asChild
//             >
//               <Link href="/manage/products/new">
//                 <PlusCircle className="size-3.5 mr-1.5" />
//                 New Product
//               </Link>
//             </Button>
//           )}

//           <Button
//             size="sm"
//             className="
//               text-xs
//               h-9
//               px-3
//               gap-1.5
//               bg-gray-900
//               hover:bg-gray-800
//               text-white
//               shadow-sm
//             "
//             onClick={() => setIsStatsOpen(true)}
//           >
//             <BarChart3 className="size-3.5" />
//             <span>View Stats</span>
//           </Button>
//         </div>
//       </div>

//       {/* =========================================================
//           ATTENTION CONTAINER / EMPTY STATE
//       ========================================================= */}

//       {needsAttention ? (
//         <div
//           className="
//             bg-amber-50
//             border
//             border-amber-200
//             rounded-2xl
//             p-5
//             sm:p-6
//             space-y-4
//           "
//         >
//           <div className="flex items-center justify-between gap-3">
//             <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
//               <AlertCircle className="size-4" />
//               <span>Items Requiring Your Attention</span>
//             </div>

//             <Badge
//               variant="outline"
//               className="
//                 border-amber-200
//                 bg-white
//                 text-amber-700
//                 text-xs
//                 font-medium
//               "
//             >
//               {pendingCount} Pending Call
//               {pendingCount === 1 ? "" : "s"}
//             </Badge>
//           </div>

//           <div
//             className="
//               bg-white
//               border
//               border-gray-200
//               rounded-xl
//               p-4
//               flex
//               flex-col
//               sm:flex-row
//               sm:items-center
//               justify-between
//               gap-4
//               shadow-sm
//             "
//           >
//             <div className="flex items-start gap-3">
//               <div
//                 className="
//                   size-9
//                   rounded-lg
//                   bg-amber-50
//                   border
//                   border-amber-100
//                   text-amber-600
//                   flex
//                   items-center
//                   justify-center
//                   shrink-0
//                   mt-0.5
//                 "
//               >
//                 <PhoneCall className="size-4" />
//               </div>

//               <div>
//                 <h4 className="text-sm font-semibold text-gray-900">
//                   Consultation Leads Awaiting Callback
//                 </h4>

//                 <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
//                   You have {pendingCount} lead submission
//                   {pendingCount === 1 ? "" : "s"} waiting for confirmation or
//                   outreach.
//                 </p>
//               </div>
//             </div>

//             <Button
//               size="sm"
//               className="
//                 text-xs
//                 h-8
//                 shrink-0
//                 bg-red-600
//                 hover:bg-red-700
//                 text-white
//               "
//               asChild
//             >
//               <Link href="/admin/free-consultations">
//                 Review Leads
//                 <ArrowRight className="size-3.5 ml-1.5" />
//               </Link>
//             </Button>
//           </div>
//         </div>
//       ) : (
//         <div
//           className="
//             bg-linear-to-b
//             from-gray-50
//             to-white
//             border
//             border-gray-200
//             rounded-2xl
//             p-10
//             sm:p-12
//             text-center
//             space-y-4
//           "
//         >
//           <div
//             className="
//               mx-auto
//               size-14
//               rounded-2xl
//               bg-emerald-50
//               border
//               border-emerald-100
//               text-emerald-600
//               flex
//               items-center
//               justify-center
//               shadow-sm
//             "
//           >
//             <CheckCircle className="size-7" />
//           </div>

//           <div className="space-y-1 max-w-md mx-auto">
//             <h3 className="text-base font-bold text-gray-900 tracking-tight">
//               All Caught Up!
//             </h3>

//             <p className="text-sm text-gray-500 leading-relaxed">
//               {isAdmin
//                 ? "There are no pending consultation requests or critical tasks requiring your immediate attention. Great job keeping the platform running smoothly!"
//                 : "Your course modules are fully up to date and your student engagement levels look fantastic."}
//             </p>
//           </div>

//           <div className="pt-2">
//             <Button
//               size="sm"
//               variant="outline"
//               className="
//                 text-xs
//                 h-9
//                 px-4
//                 border-gray-200
//                 bg-white
//                 text-gray-700
//                 hover:bg-gray-50
//                 hover:text-gray-900
//               "
//               onClick={() => setIsStatsOpen(true)}
//             >
//               <Sparkles className="size-3.5 mr-1.5 text-red-500" />
//               Explore Platform Metrics
//             </Button>
//           </div>
//         </div>
//       )}

//       {/* =========================================================
//           MODAL / POPUP: DETAILED STATS
//       ========================================================= */}

//       {isStatsOpen && (
//         <div
//           className="
//             fixed
//             inset-0
//             z-50
//             flex
//             items-center
//             justify-center
//             bg-gray-900/30
//             backdrop-blur-sm
//             p-4
//             animate-in
//             fade-in
//             duration-200
//           "
//         >
//           <div
//             className="
//               bg-white
//               border
//               border-gray-200
//               w-full
//               max-w-3xl
//               rounded-2xl
//               shadow-2xl
//               overflow-hidden
//               flex
//               flex-col
//               max-h-[90vh]
//             "
//           >
//             {/* Modal Header */}
//             <div
//               className="
//                 flex
//                 items-center
//                 justify-between
//                 px-6
//                 py-4
//                 border-b
//                 border-gray-200
//               "
//             >
//               <div className="flex items-center gap-2.5">
//                 <div
//                   className="
//                     size-9
//                     rounded-lg
//                     bg-red-50
//                     border
//                     border-red-100
//                     text-red-600
//                     flex
//                     items-center
//                     justify-center
//                   "
//                 >
//                   <BarChart3 className="size-4" />
//                 </div>

//                 <div>
//                   <h3 className="text-sm font-bold text-gray-900">
//                     Detailed Platform Statistics
//                   </h3>

//                   <p className="text-xs text-gray-500">
//                     Comprehensive overview of platform growth and funnels
//                   </p>
//                 </div>
//               </div>

//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="
//                   size-8
//                   rounded-lg
//                   text-gray-400
//                   hover:text-gray-900
//                   hover:bg-gray-100
//                 "
//                 onClick={() => setIsStatsOpen(false)}
//               >
//                 <X className="size-4" />
//               </Button>
//             </div>

//             {/* Modal Content */}
//             <div className="p-6 overflow-y-auto space-y-6">
//               {/* Primary User & Content Metrics */}
//               <div className="space-y-3">
//                 <h4
//                   className="
//                     text-xs
//                     font-semibold
//                     uppercase
//                     tracking-wider
//                     text-gray-500
//                   "
//                 >
//                   Core Ecosystem Metrics
//                 </h4>

//                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//                   <ModalMetricCard
//                     title="Learners"
//                     value={stats.totalLearners}
//                     icon={<Users className="size-4 text-gray-400" />}
//                   />

//                   <ModalMetricCard
//                     title="Educators"
//                     value={stats.totalEducators}
//                     icon={<GraduationCap className="size-4 text-gray-400" />}
//                   />

//                   <ModalMetricCard
//                     title="Courses"
//                     value={stats.totalCoursesApproved}
//                     icon={<BookOpen className="size-4 text-gray-400" />}
//                   />

//                   <ModalMetricCard
//                     title="Lessons"
//                     value={stats.totalLessonsApproved}
//                     icon={<Video className="size-4 text-gray-400" />}
//                   />
//                 </div>
//               </div>

//               {/* Consultation Leads */}
//               {isAdmin && (
//                 <div className="space-y-3 pt-2 border-t border-gray-200">
//                   <div className="flex items-center justify-between gap-3">
//                     <h4
//                       className="
//                         text-xs
//                         font-semibold
//                         uppercase
//                         tracking-wider
//                         text-gray-500
//                       "
//                     >
//                       Consultation & Onboarding Funnel
//                     </h4>

//                     <Button
//                       size="sm"
//                       variant="link"
//                       className="
//                         text-xs
//                         h-auto
//                         p-0
//                         text-red-600
//                         hover:text-red-700
//                       "
//                       asChild
//                     >
//                       <Link
//                         href="/admin/consultation-leads"
//                         onClick={() => setIsStatsOpen(false)}
//                       >
//                         Manage Leads
//                         <ArrowRight className="size-3 ml-1" />
//                       </Link>
//                     </Button>
//                   </div>

//                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
//                     {/* Total Leads */}
//                     <div
//                       className="
//                         p-3.5
//                         rounded-xl
//                         border
//                         border-gray-200
//                         bg-gray-50
//                         space-y-1
//                       "
//                     >
//                       <div
//                         className="
//                           flex
//                           items-center
//                           justify-between
//                           text-[11px]
//                           font-medium
//                           text-gray-500
//                           uppercase
//                         "
//                       >
//                         <span>Total Leads</span>
//                         <Users className="size-3.5" />
//                       </div>

//                       <div className="text-lg font-bold text-gray-900">
//                         {consultations.totalLeads.toLocaleString()}
//                       </div>

//                       <p className="text-[10px] text-gray-500">
//                         Inbound requests
//                       </p>
//                     </div>

//                     {/* Pending */}
//                     <div
//                       className="
//                         p-3.5
//                         rounded-xl
//                         border
//                         border-amber-200
//                         bg-amber-50
//                         space-y-1
//                       "
//                     >
//                       <div
//                         className="
//                           flex
//                           items-center
//                           justify-between
//                           text-[11px]
//                           font-medium
//                           text-amber-700
//                           uppercase
//                         "
//                       >
//                         <span>Pending</span>
//                         <AlertCircle className="size-3.5" />
//                       </div>

//                       <div className="text-lg font-bold text-gray-900">
//                         {consultations.pendingCalls.toLocaleString()}
//                       </div>

//                       <p className="text-[10px] text-gray-500">
//                         Awaiting response
//                       </p>
//                     </div>

//                     {/* Completed */}
//                     <div
//                       className="
//                         p-3.5
//                         rounded-xl
//                         border
//                         border-emerald-200
//                         bg-emerald-50
//                         space-y-1
//                       "
//                     >
//                       <div
//                         className="
//                           flex
//                           items-center
//                           justify-between
//                           text-[11px]
//                           font-medium
//                           text-emerald-700
//                           uppercase
//                         "
//                       >
//                         <span>Completed</span>
//                         <CheckCircle2 className="size-3.5" />
//                       </div>

//                       <div className="text-lg font-bold text-gray-900">
//                         {consultations.completedCalls.toLocaleString()}
//                       </div>

//                       <p className="text-[10px] text-gray-500">
//                         Successfully enrolled
//                       </p>
//                     </div>

//                     {/* Conversion */}
//                     <div
//                       className="
//                         p-3.5
//                         rounded-xl
//                         border
//                         border-gray-200
//                         bg-gray-50
//                         space-y-1
//                       "
//                     >
//                       <div
//                         className="
//                           flex
//                           items-center
//                           justify-between
//                           text-[11px]
//                           font-medium
//                           text-gray-500
//                           uppercase
//                         "
//                       >
//                         <span>Conversion</span>
//                         <TrendingUp className="size-3.5" />
//                       </div>

//                       <div className="text-lg font-bold text-gray-900">
//                         {consultations.conversionRate}%
//                       </div>

//                       <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden mt-1">
//                         <div
//                           className="
//                             bg-red-600
//                             h-full
//                             rounded-full
//                             transition-all
//                             duration-500
//                           "
//                           style={{
//                             width: `${Math.min(
//                               consultations.conversionRate,
//                               100,
//                             )}%`,
//                           }}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Modal Footer */}
//             <div
//               className="
//                 flex
//                 items-center
//                 justify-end
//                 px-6
//                 py-3
//                 border-t
//                 border-gray-200
//                 bg-gray-50
//               "
//             >
//               <Button
//                 size="sm"
//                 variant="outline"
//                 className="
//                   text-xs
//                   border-gray-200
//                   bg-white
//                   text-gray-700
//                   hover:bg-gray-100
//                 "
//                 onClick={() => setIsStatsOpen(false)}
//               >
//                 Close Window
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ============================================================
// // HELPER COMPONENT
// // ============================================================

// function ModalMetricCard({
//   title,
//   value,
//   icon,
// }: {
//   title: string;
//   value: string | number;
//   icon: React.ReactNode;
// }) {
//   return (
//     <div
//       className="
//         p-3.5
//         rounded-xl
//         border
//         border-gray-200
//         bg-gray-50
//         space-y-1
//         hover:bg-white
//         hover:border-gray-300
//         transition-colors
//       "
//     >
//       <div className="flex items-center justify-between">
//         <span
//           className="
//             text-[11px]
//             font-medium
//             text-gray-500
//             uppercase
//             tracking-wider
//           "
//         >
//           {title}
//         </span>

//         {icon}
//       </div>

//       <div className="text-xl font-bold tracking-tight text-gray-900">
//         {typeof value === "number" ? value.toLocaleString() : value}
//       </div>
//     </div>
//   );
// }

// // ============================================================
// // DASHBOARD SKELETON
// // ============================================================

// function DashboardSkeleton() {
//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 bg-white">
//       <div className="flex items-center justify-between pb-6 border-b border-gray-200">
//         <div className="flex items-center gap-3.5">
//           <Skeleton className="size-12 rounded-xl shrink-0" />

//           <div className="space-y-2">
//             <Skeleton className="h-5 w-40" />
//             <Skeleton className="h-3 w-56" />
//           </div>
//         </div>

//         <Skeleton className="h-9 w-24 rounded-md" />
//       </div>

//       <Skeleton className="h-40 w-full rounded-2xl" />
//     </div>
//   );
// }
