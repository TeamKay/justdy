import React from "react";
import Link from "next/link";

import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  Mail,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { PendingEnrollmentStatus, Prisma } from "@/lib/generated/prisma/client";
import { SearchInput } from "@/app/_components/consutationSearchInput";
import { ConsultationActionMenu } from "@/app/_components/ConsultationActionMenu";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}

// HELPER: Extract initial letters from a name
function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default async function AdminFreeConsultationsPage({
  searchParams,
}: PageProps) {
  const { status, search } = await searchParams;

  const TABS = [
    { label: "ALL", value: "ALL" },
    { label: "Pending", value: "Pending" },
    { label: "Enrolled", value: "Enrolled" },
    { label: "Dropped", value: "Cancelled" },
  ];

  // Build Prisma filter query
  const whereFilter: Prisma.PendingEnrollmentWhereInput = {};

  if (status && status !== "ALL") {
    const upperStatus = status.toUpperCase();
    const enumValues = Object.values(PendingEnrollmentStatus) as string[];

    if (enumValues.includes(upperStatus)) {
      whereFilter.status = upperStatus as PendingEnrollmentStatus;
    } else {
      const matchedKey = Object.keys(PendingEnrollmentStatus).find(
        (key) => key.toUpperCase() === upperStatus,
      );
      if (matchedKey) {
        whereFilter.status =
          PendingEnrollmentStatus[
            matchedKey as keyof typeof PendingEnrollmentStatus
          ];
      }
    }
  }

  // Live search filtering across name, email, phone, topic, subject
  if (search && search.trim() !== "") {
    const query = search.trim();

    whereFilter.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { phoneNumber: { contains: query, mode: "insensitive" } },
      { topic: { contains: query, mode: "insensitive" } },
      { subject: { contains: query, mode: "insensitive" } },
    ];
  }

  // Fetch consultation leads
  const consultations = await prisma.pendingEnrollment.findMany({
    where: whereFilter,
    include: {
      educator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto min-h-screen text-slate-900 dark:text-slate-100">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Consultation Leads
          </h1>
          <p className="text-sm text-slate-700 mt-1">
            Review consultation requests and either enroll the client as a
            full-time learner or drop the consultation.
          </p>
        </div>
      </div>

      {/* CONTROLS & FILTERS */}
      <div className=" bg-amber-100 rounded-md p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-md w-full md:w-auto overflow-x-auto">
            {TABS.map((tab) => {
              const active =
                (!status && tab.value === "ALL") ||
                status?.toLowerCase() === tab.value.toLowerCase();

              return (
                <Link
                  key={tab.value}
                  href={`/manage/consultation-leads?status=${tab.value}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                    active
                      ? "bg-[#857938] text-white shadow-xs font-semibold"
                      : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Real-time Search Input */}
          <SearchInput />
        </div>

        {/* --- MOBILE VIEW: VERTICAL STACKED CARDS --- */}
        <div className="block md:hidden space-y-3">
          {consultations.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 border rounded-md border-slate-200 dark:border-slate-800">
              No consultation onboardings found matching your filter.
            </div>
          ) : (
            consultations.map((item) => {
              const formattedDate = new Date(
                item.sessionDate,
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const formattedTime = new Date(item.startTime).toLocaleTimeString(
                "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-2xs"
                >
                  {/* Top Bar: Name & Actions */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/50">
                        {getInitials(item.name)}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {item.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={item.status} />
                      <ConsultationActionMenu item={item} />
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Schedule */}
                    <div className="col-span-2 flex items-center gap-2 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md border border-slate-100 dark:border-slate-800/60">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {formattedDate}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">
                        •
                      </span>
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400">
                        {formattedTime}
                      </span>
                    </div>

                    {/* Interest & Grade */}
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{item.subject}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Grade: {item.gradeLevel}</span>
                    </div>

                    {/* Email & Phone */}
                    <div className="col-span-2 flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        {item.phoneNumber ? (
                          <a
                            href={`tel:${item.phoneNumber}`}
                            className="hover:underline"
                          >
                            {item.phoneNumber}
                          </a>
                        ) : (
                          <span className="italic text-slate-400">
                            No phone
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- DESKTOP & TABLET VIEW: FULL TABLE --- */}
        {/* Changed overflow-hidden to visible / relative container so absolute dropdown pops out freely */}
        <div className="hidden md:block border rounded-lg border-slate-200 dark:border-slate-800 relative bg-white dark:bg-slate-900">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <th className="py-3 px-4 w-[20%] rounded-tl-lg">Lead Name</th>
                <th className="py-3 px-4 w-[16%]">Contact Details</th>
                <th className="py-3 px-4 w-[14%]">Subject</th>
                <th className="py-3 px-4 w-[13%]">Grade</th>
                <th className="py-3 px-4 w-[22%]">Scheduled Time</th>
                <th className="py-3 px-4 w-[10%]">Status</th>
                <th className="py-3 px-4 w-[5%] text-right rounded-tr-lg"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {consultations.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-8 text-slate-500 dark:text-slate-400"
                  >
                    No consultation onboardings found matching your filter.
                  </td>
                </tr>
              ) : (
                consultations.map((item) => {
                  const formattedDate = new Date(
                    item.sessionDate,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const formattedTime = new Date(
                    item.startTime,
                  ).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* CLIENT NAME */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/50 shadow-xs">
                            {getInitials(item.name)}
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                            {item.name}
                          </div>
                        </div>
                      </td>

                      {/* CONTACT INFO */}
                      <td className="py-3.5 px-4 font-medium">
                        <div
                          className="text-slate-500 dark:text-slate-400 text-[11px] truncate"
                          title={item.email}
                        >
                          {item.email}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          {item.phoneNumber ? (
                            <a
                              href={`tel:${item.phoneNumber}`}
                              className="hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 truncate"
                            >
                              {item.phoneNumber}
                            </a>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic">
                              No phone
                            </span>
                          )}
                        </div>
                      </td>

                      {/* AREA OF INTEREST */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 font-medium text-[11px] truncate max-w-full">
                          {item.subject}
                        </span>
                      </td>

                      {/* GRADE LEVEL */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {item.gradeLevel}
                        </div>
                      </td>

                      {/* SCHEDULED DATE & TIME */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 flex-wrap text-xs">
                          <div className="flex items-center gap-1 font-medium text-slate-900 dark:text-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>{formattedDate}</span>
                          </div>
                          <span className="text-slate-300 dark:text-slate-600 font-bold">
                            •
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>{formattedTime}</span>
                          </div>
                        </div>
                      </td>

                      {/* STATUS BADGE */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.status} />
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 text-right relative">
                        <ConsultationActionMenu item={item} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// STATUS BADGE HELPER COMPONENT
function StatusBadge({ status }: { status: PendingEnrollmentStatus }) {
  const normalized = status?.toString().toUpperCase();

  if (normalized === "ENROLLED" || normalized === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3" />
        Enrolled
      </span>
    );
  }

  if (normalized === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 whitespace-nowrap">
        <XCircle className="w-3 h-3" />
        Dropped
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 whitespace-nowrap">
      <AlertCircle className="w-3 h-3" />
      Pending Call
    </span>
  );
}

// import React from "react";
// import Link from "next/link";

// import {
//   Calendar,
//   Clock,
//   CheckCircle2,
//   AlertCircle,
//   XCircle,
//   Phone,
//   Mail,
//   GraduationCap,
//   BookOpen,
// } from "lucide-react";
// import prisma from "@/lib/prisma";
// import { PendingEnrollmentStatus, Prisma } from "@/lib/generated/prisma/client";
// import { SearchInput } from "@/app/_components/consutationSearchInput";
// import { ConsultationActionMenu } from "@/app/_components/ConsultationActionMenu";

// interface PageProps {
//   searchParams: Promise<{
//     status?: string;
//     search?: string;
//   }>;
// }

// // HELPER: Extract initial letters from a name
// function getInitials(name: string): string {
//   if (!name) return "?";
//   const parts = name.trim().split(/\s+/);
//   if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
//   return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
// }

// export default async function AdminFreeConsultationsPage({
//   searchParams,
// }: PageProps) {
//   const { status, search } = await searchParams;

//   const TABS = [
//     { label: "ALL", value: "ALL" },
//     { label: "Pending", value: "Pending" },
//     { label: "Enrolled", value: "Enrolled" },
//     { label: "Cancelled", value: "Cancelled" },
//   ];

//   // Build Prisma filter query
//   const whereFilter: Prisma.PendingEnrollmentWhereInput = {};

//   if (status && status !== "ALL") {
//     const upperStatus = status.toUpperCase();
//     const enumValues = Object.values(PendingEnrollmentStatus) as string[];

//     if (enumValues.includes(upperStatus)) {
//       whereFilter.status = upperStatus as PendingEnrollmentStatus;
//     } else {
//       const matchedKey = Object.keys(PendingEnrollmentStatus).find(
//         (key) => key.toUpperCase() === upperStatus,
//       );
//       if (matchedKey) {
//         whereFilter.status =
//           PendingEnrollmentStatus[
//             matchedKey as keyof typeof PendingEnrollmentStatus
//           ];
//       }
//     }
//   }

//   // Live search filtering across name, email, phone, topic, subject
//   if (search && search.trim() !== "") {
//     const query = search.trim();

//     whereFilter.OR = [
//       { name: { contains: query, mode: "insensitive" } },
//       { email: { contains: query, mode: "insensitive" } },
//       { phoneNumber: { contains: query, mode: "insensitive" } },
//       { topic: { contains: query, mode: "insensitive" } },
//       { subject: { contains: query, mode: "insensitive" } },
//     ];
//   }

//   // Fetch consultation leads
//   const consultations = await prisma.pendingEnrollment.findMany({
//     where: whereFilter,
//     include: {
//       educator: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//         },
//       },
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//   });

//   return (
//     <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto min-h-screen text-slate-900 dark:text-slate-100">
//       {/* HEADER */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
//         <div>
//           <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
//             Consultation Leads
//           </h1>
//           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
//             Review onboarding requests and convert completed consultations into
//             active subscribers.
//           </p>
//         </div>
//       </div>

//       {/* CONTROLS & FILTERS */}
//       <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
//         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
//           {/* Status Tabs */}
//           <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
//             {TABS.map((tab) => {
//               const active =
//                 (!status && tab.value === "ALL") ||
//                 status?.toLowerCase() === tab.value.toLowerCase();

//               return (
//                 <Link
//                   key={tab.value}
//                   href={`/manage/consultation-leads?status=${tab.value}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
//                   className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
//                     active
//                       ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs font-semibold"
//                       : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
//                   }`}
//                 >
//                   {tab.label}
//                 </Link>
//               );
//             })}
//           </div>

//           {/* Real-time Search Input */}
//           <SearchInput />
//         </div>

//         {/* --- MOBILE VIEW: VERTICAL STACKED CARDS --- */}
//         <div className="block md:hidden space-y-3">
//           {consultations.length === 0 ? (
//             <div className="text-center py-8 text-slate-500 dark:text-slate-400 border rounded-lg border-slate-200 dark:border-slate-800">
//               No consultation onboardings found matching your filter.
//             </div>
//           ) : (
//             consultations.map((item) => {
//               const formattedDate = new Date(
//                 item.sessionDate,
//               ).toLocaleDateString("en-US", {
//                 month: "short",
//                 day: "numeric",
//                 year: "numeric",
//               });
//               const formattedTime = new Date(item.startTime).toLocaleTimeString(
//                 "en-US",
//                 {
//                   hour: "2-digit",
//                   minute: "2-digit",
//                 },
//               );

//               return (
//                 <div
//                   key={item.id}
//                   className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-2xs"
//                 >
//                   {/* Top Bar: Name & Actions */}
//                   <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
//                     <div className="flex items-center gap-2.5 min-w-0">
//                       <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/50">
//                         {getInitials(item.name)}
//                       </div>
//                       <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">
//                         {item.name}
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2 shrink-0">
//                       <StatusBadge status={item.status} />
//                       <ConsultationActionMenu item={item} />
//                     </div>
//                   </div>

//                   {/* Body Info */}
//                   <div className="grid grid-cols-2 gap-2 text-xs">
//                     {/* Schedule */}
//                     <div className="col-span-2 flex items-center gap-2 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md border border-slate-100 dark:border-slate-800/60">
//                       <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
//                       <span className="font-medium text-slate-900 dark:text-slate-200">
//                         {formattedDate}
//                       </span>
//                       <span className="text-slate-300 dark:text-slate-600">
//                         •
//                       </span>
//                       <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
//                       <span className="text-slate-500 dark:text-slate-400">
//                         {formattedTime}
//                       </span>
//                     </div>

//                     {/* Interest & Grade */}
//                     <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
//                       <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
//                       <span className="truncate">{item.subject}</span>
//                     </div>

//                     <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
//                       <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
//                       <span>Grade: {item.gradeLevel}</span>
//                     </div>

//                     {/* Email & Phone */}
//                     <div className="col-span-2 flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
//                       <div className="flex items-center gap-1.5 truncate">
//                         <Mail className="w-3 h-3 text-slate-400 shrink-0" />
//                         <span className="truncate">{item.email}</span>
//                       </div>
//                       <div className="flex items-center gap-1.5">
//                         <Phone className="w-3 h-3 text-slate-400 shrink-0" />
//                         {item.phoneNumber ? (
//                           <a
//                             href={`tel:${item.phoneNumber}`}
//                             className="hover:underline"
//                           >
//                             {item.phoneNumber}
//                           </a>
//                         ) : (
//                           <span className="italic text-slate-400">
//                             No phone
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>

//         {/* --- DESKTOP & TABLET VIEW: FULL TABLE --- */}
//         {/* Changed overflow-hidden to visible / relative container so absolute dropdown pops out freely */}
//         <div className="hidden md:block border rounded-lg border-slate-200 dark:border-slate-800 relative bg-white dark:bg-slate-900">
//           <table className="w-full table-fixed text-left text-xs border-collapse">
//             <thead>
//               <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
//                 <th className="py-3 px-4 w-[20%] rounded-tl-lg">Lead Name</th>
//                 <th className="py-3 px-4 w-[16%]">Contact Details</th>
//                 <th className="py-3 px-4 w-[14%]">Subject</th>
//                 <th className="py-3 px-4 w-[13%]">Grade</th>
//                 <th className="py-3 px-4 w-[22%]">Scheduled Time</th>
//                 <th className="py-3 px-4 w-[10%]">Status</th>
//                 <th className="py-3 px-4 w-[5%] text-right rounded-tr-lg"></th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
//               {consultations.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={7}
//                     className="text-center py-8 text-slate-500 dark:text-slate-400"
//                   >
//                     No consultation onboardings found matching your filter.
//                   </td>
//                 </tr>
//               ) : (
//                 consultations.map((item) => {
//                   const formattedDate = new Date(
//                     item.sessionDate,
//                   ).toLocaleDateString("en-US", {
//                     month: "short",
//                     day: "numeric",
//                     year: "numeric",
//                   });
//                   const formattedTime = new Date(
//                     item.startTime,
//                   ).toLocaleTimeString("en-US", {
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   });

//                   return (
//                     <tr
//                       key={item.id}
//                       className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
//                     >
//                       {/* CLIENT NAME */}
//                       <td className="py-3.5 px-4 font-medium">
//                         <div className="flex items-center gap-3 min-w-0">
//                           <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/50 shadow-xs">
//                             {getInitials(item.name)}
//                           </div>
//                           <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
//                             {item.name}
//                           </div>
//                         </div>
//                       </td>

//                       {/* CONTACT INFO */}
//                       <td className="py-3.5 px-4 font-medium">
//                         <div
//                           className="text-slate-500 dark:text-slate-400 text-[11px] truncate"
//                           title={item.email}
//                         >
//                           {item.email}
//                         </div>
//                         <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
//                           <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
//                           {item.phoneNumber ? (
//                             <a
//                               href={`tel:${item.phoneNumber}`}
//                               className="hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 truncate"
//                             >
//                               {item.phoneNumber}
//                             </a>
//                           ) : (
//                             <span className="text-slate-400 dark:text-slate-500 italic">
//                               No phone
//                             </span>
//                           )}
//                         </div>
//                       </td>

//                       {/* AREA OF INTEREST */}
//                       <td className="py-3.5 px-4">
//                         <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 font-medium text-[11px] truncate max-w-full">
//                           {item.subject}
//                         </span>
//                       </td>

//                       {/* GRADE LEVEL */}
//                       <td className="py-3.5 px-4">
//                         <div className="text-slate-500 dark:text-slate-400 text-[11px]">
//                           {item.gradeLevel}
//                         </div>
//                       </td>

//                       {/* SCHEDULED DATE & TIME */}
//                       <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
//                         <div className="flex items-center gap-1.5 flex-wrap text-xs">
//                           <div className="flex items-center gap-1 font-medium text-slate-900 dark:text-slate-200">
//                             <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
//                             <span>{formattedDate}</span>
//                           </div>
//                           <span className="text-slate-300 dark:text-slate-600 font-bold">
//                             •
//                           </span>
//                           <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
//                             <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
//                             <span>{formattedTime}</span>
//                           </div>
//                         </div>
//                       </td>

//                       {/* STATUS BADGE */}
//                       <td className="py-3.5 px-4">
//                         <StatusBadge status={item.status} />
//                       </td>

//                       {/* ACTIONS */}
//                       <td className="py-3.5 px-4 text-right relative">
//                         <ConsultationActionMenu item={item} />
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// // STATUS BADGE HELPER COMPONENT
// function StatusBadge({ status }: { status: PendingEnrollmentStatus }) {
//   const normalized = status?.toString().toUpperCase();

//   if (normalized === "ENROLLED" || normalized === "COMPLETED") {
//     return (
//       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
//         <CheckCircle2 className="w-3 h-3" />
//         Enrolled
//       </span>
//     );
//   }

//   if (normalized === "CANCELLED") {
//     return (
//       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 whitespace-nowrap">
//         <XCircle className="w-3 h-3" />
//         Cancelled
//       </span>
//     );
//   }

//   return (
//     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 whitespace-nowrap">
//       <AlertCircle className="w-3 h-3" />
//       Pending Call
//     </span>
//   );
// }
