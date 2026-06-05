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
    { title: "Communities", url: "/admin/communities", icon: Camera },
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
  learner: [
    { title: "Dashboard", url: "/learner", icon: LayoutDashboard },
    { title: "My Courses", url: "/learner/enrolled", icon: BookOpen },
    { title: "Bookings", url: "/learner/appointments", icon: Users },
    { title: "AI Tutor", url: "/learner/ai-tutor", icon: CreditCard },
    { title: "Messages", url: "/learner/messages", icon: Camera },
    { title: "Settings", url: "/learner/settings", icon: Settings },
  ],
};

const secondaryNav = [
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
  const navMainItems = navigationData[userRole] ?? navigationData.learner;

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
