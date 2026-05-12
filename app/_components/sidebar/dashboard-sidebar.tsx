"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  Search,
  Columns,
  CreditCard,
  Camera,
  HelpCircleIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";

import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";

import { authClient } from "@/lib/auth-client";
import MyLogo from "../Logo";
import { Calendar, Clock } from "lucide-react";

const navigationData = {
  admin: [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Educators", url: "/admin/educators", icon: Camera },
    { title: "Courses", url: "/admin/courses", icon: Columns },
    { title: "Payout", url: "/admin/payout", icon: CreditCard },
    { title: "Students", url: "/admin/roster", icon: Users },
  ],
  educator: [
    { title: "Dashboard", url: "/educator", icon: LayoutDashboard },
    { title: "My Profile", url: "/educator/profile", icon: Users },
    { title: "Availability", url: "/educator/availability", icon: Clock },
    { title: "Appointments", url: "/educator/appointments", icon: Calendar },
    { title: "My Courses", url: "/educator/courses", icon: BookOpen },
    { title: "Student Roster", url: "/educator/roster", icon: Users },
    { title: "My Earnings", url: "/educator/earnings", icon: CreditCard },
  ],
  student: [
    { title: "Dashboard", url: "/student", icon: LayoutDashboard },
    { title: "Appointments", url: "/student/appointments", icon: Users },
    { title: "Enrolled Courses", url: "/student/enrolled", icon: Columns },
    { title: "My Plan", url: "/student/myplan", icon: Columns },
  ],
};

const secondaryNav = [
  { title: "Settings", url: "#", icon: Settings },
  { title: "Get Help", url: "#", icon: HelpCircleIcon },
  { title: "Search", url: "#", icon: Search },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [mounted, setMounted] = React.useState(false);
  const { data: session, isPending } = authClient.useSession();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Sidebar {...props}></Sidebar>;
  }

  const rawRole = (session?.user as { role?: string })?.role || "Student";
  const userRole = rawRole.toLowerCase() as keyof typeof navigationData;
  const navMainItems = navigationData[userRole] ?? navigationData.student;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className="p-6 bg-amber-50 dark:bg-emerald-950 flex">
                <MyLogo />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {!isPending && <NavMain items={navMainItems} />}
        <NavSecondary items={secondaryNav} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter className="p-0">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

// "use client";

// import * as React from "react";
// import {
//   IconCamera,
//   IconColumns,
//   IconDashboardFilled,
//   IconHelp,
//   IconSearch,
//   IconSettings,
//   IconUsers,
//   IconBook,
//   IconCash,
// } from "@tabler/icons-react";

// import {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from "../ui/sidebar";
// import { NavMain } from "./nav-main";
// import { NavSecondary } from "./nav-secondary";
// import { NavUser } from "./nav-user";

// // Import your Better Auth client instance
// import { authClient } from "@/lib/auth-client";
// import MyLogo from "../Logo";
// import { Calendar, Clock } from "lucide-react";
// import { usePathname } from "next/navigation";

// const navigationData = {
//   admin: [
//     { title: "Dashboard", url: "/admin", icon: IconDashboardFilled },
//     { title: "Educators", url: "/admin/educators", icon: IconCamera },
//     { title: "All Courses", url: "/admin/courses", icon: IconColumns },
//     { title: "Payout", url: "/admin/payout", icon: IconCash },
//     { title: "Students", url: "/admin/student", icon: IconUsers },
//   ],
//   educator: [
//     { title: "Dashboard", url: "/educator", icon: IconDashboardFilled },
//     { title: "Availability", url: "/educator/availability", icon: Clock },
//     { title: "Appointments", url: "/educator/appointments", icon: Calendar },
//     { title: "My Courses", url: "/educator/courses", icon: IconBook },
//     { title: "Student Roster", url: "/educator/assignments", icon: IconUsers },
//   ],
//   student: [
//     { title: "Dashboard", url: "/student", icon: IconDashboardFilled },
//     { title: "Appointments", url: "/student/appointments", icon: IconUsers },
//     { title: "Enrolled Courses", url: "student/enrolled", icon: IconColumns },
//   ],
// };

// const secondaryNav = [
//   { title: "Settings", url: "#", icon: IconSettings },
//   { title: "Get Help", url: "#", icon: IconHelp },
//   { title: "Search", url: "#", icon: IconSearch },
// ];

// export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
//   // 1. Hook into Better Auth session
//   const [mounted, setMounted] = React.useState(false);
//   const { data: session, isPending } = authClient.useSession();
//   const pathname = usePathname();

//   React.useEffect(() => {
//     setMounted(true);
//   }, []);

//   if (!mounted) {
//     return <Sidebar {...props}> </Sidebar>;
//   }

//   const rawRole = (session?.user as { role?: string })?.role || "Student";
//   const userRole = rawRole.toLowerCase() as keyof typeof navigationData;
//   const navMainItems = navigationData[userRole] || navigationData.student;

//   return (
//     <Sidebar collapsible="offcanvas" {...props}>
//       <SidebarHeader className="p-0">
//         <SidebarMenu>
//           <SidebarMenuItem key={item.title}>
//             <SidebarMenuButton asChild>
//               <div className="data-[slot=sidebar-menu-button] p-6 bg-amber-50 dark:bg-emerald-950  flex ">
//                 <MyLogo />
//               </div>
//             </SidebarMenuButton>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarHeader>

//       <SidebarContent>
//         {/* Optional: Show a skeleton or nothing while loading session */}
//         {!isPending && <NavMain items={navMainItems} />}

//         <NavSecondary items={secondaryNav} className="mt-auto" />
//       </SidebarContent>

//       <SidebarFooter className="p-0">
//         <NavUser />
//       </SidebarFooter>
//     </Sidebar>
//   );
// }
