import type { Metadata } from "next";

import { SidebarInset, SidebarProvider } from "@/app/_components/ui/sidebar";
import { AppSidebar } from "../_components/sidebar/dashboard-sidebar";
import { SiteHeader } from "../_components/sidebar/header-welcome";

export const metadata: Metadata = {
  title: "Dashboard | Justdy",
  description:
    "Manage your Justdy learning, courses, students, and educational activities.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true} className="min-h-screen bg-slate-50">
      <AppSidebar />

      <SidebarInset className="min-h-screen bg-slate-50">
        {/* ============================================================
            TOP HEADER
        ============================================================ */}
        <SiteHeader />

        {/* ============================================================
            MAIN DASHBOARD AREA

            The generous padding here creates the breathing room
            between the header and individual dashboard sections.
        ============================================================ */}
        <main className="flex-1 bg-slate-50">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// import type { CSSProperties, ReactNode } from "react";
// import { headers, cookies } from "next/headers";
// import { redirect } from "next/navigation";

// import { auth } from "@/lib/auth";
// import prisma from "@/lib/prisma";

// import { SidebarInset, SidebarProvider } from "@/app/_components/ui/sidebar";

// import { AppSidebar } from "../_components/sidebar/dashboard-sidebar";
// import { SiteHeader } from "../_components/sidebar/header-welcome";

// export default async function DashboardLayout({
//   children,
// }: {
//   children: ReactNode;
// }) {
//   // ============================================================
//   // SIDEBAR STATE
//   // ============================================================

//   const cookieStore = await cookies();

//   const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

//   // ============================================================
//   // SERVER-SIDE AUTHENTICATION
//   // ============================================================

//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user) {
//     redirect("/login");
//   }

//   // ============================================================
//   // FETCH USER + ROLES + PERMISSIONS
//   // ============================================================

//   const user = await prisma.user.findUnique({
//     where: {
//       id: session.user.id,
//     },
//     include: {
//       facilitatorProfile: true,

//       roles: {
//         include: {
//           role: {
//             include: {
//               permissions: {
//                 include: {
//                   permission: true,
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   });

//   if (!user) {
//     redirect("/login");
//   }

//   // ============================================================
//   // EXTRACT USER ROLES
//   // ============================================================

//   const extractedRoles: string[] = [];

//   if (user.role) {
//     extractedRoles.push(user.role);
//   }

//   // A user with a facilitator profile is also treated as an educator
//   if (user.facilitatorProfile) {
//     extractedRoles.push("educator");
//   }

//   user.roles?.forEach((userRole) => {
//     if (userRole.role?.name) {
//       extractedRoles.push(userRole.role.name);
//     }
//   });

//   // Normalize and remove duplicate roles
//   const userRoles = Array.from(
//     new Set(extractedRoles.map((role) => role.toLowerCase())),
//   );

//   // ============================================================
//   // EXTRACT USER PERMISSIONS
//   // ============================================================

//   const permissions = Array.from(
//     new Set(
//       (user.roles ?? []).flatMap((userRole) =>
//         (userRole.role?.permissions ?? []).map(
//           (rolePermission) => rolePermission.permission.name,
//         ),
//       ),
//     ),
//   );

//   // ============================================================
//   // DASHBOARD LAYOUT
//   // ============================================================

//   return (
//     <SidebarProvider
//       defaultOpen={defaultOpen}
//       className="min-h-svh bg-white text-gray-900"
//       style={
//         {
//           "--sidebar-width": "16rem",
//           "--header-height": "3.5rem",
//         } as CSSProperties
//       }
//     >
//       {/* ========================================================
//           SIDEBAR
//       ======================================================== */}

//       <AppSidebar
//         variant="inset"
//         userRoles={userRoles}
//         permissions={permissions}
//       />

//       {/* ========================================================
//           MAIN APPLICATION AREA
//       ======================================================== */}

//       <SidebarInset
//         className="
//           min-h-svh
//           bg-white
//           text-gray-900
//           flex
//           flex-col
//           overflow-hidden
//         "
//       >
//         {/* ======================================================
//             SITE HEADER
//         ====================================================== */}

//         <SiteHeader userName={user.name ?? undefined} />

//         {/* ======================================================
//             SCROLLABLE CONTENT AREA
//         ====================================================== */}

//         <div
//           className="
//             flex-1
//             min-h-0
//             flex
//             flex-col
//             overflow-y-auto
//             overflow-x-hidden
//             w-full
//             bg-white
//           "
//         >
//           <div
//             className="
//               flex-1
//               flex
//               flex-col
//               w-full
//               min-h-full
//               bg-white
//               p-0
//             "
//           >
//             {children}
//           </div>
//         </div>
//       </SidebarInset>
//     </SidebarProvider>
//   );
// }
