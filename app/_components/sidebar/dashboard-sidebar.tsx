// app/_components/sidebar/dashboard-sidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  Search,
  Columns,
  CreditCard,
  CreditCard as BillingIcon,
  Calendar,
  HelpCircleIcon,
  LucideIcon,
  GraduationCap,
  Library,
  Receipt,
  Clock,
  Compass,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "../ui/sidebar";

import { authClient } from "@/lib/auth-client";
import MyLogo from "../Logo";
import { NavUser } from "./nav-user";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
}

const navigationData: Record<string, NavItem[]> = {
  admin: [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Products & Courses", url: "/admin/products", icon: Columns },
    { title: "Educators", url: "/admin/educators", icon: GraduationCap }, // Changed icon
    { title: "Subjects", url: "/admin/subjects", icon: Library }, // Changed icon
    { title: "Student Roster", url: "/admin/roster", icon: Users },
    { title: "Payouts", url: "/admin/payouts", icon: CreditCard },
    { title: "Transactions", url: "/admin/transactions", icon: Receipt }, // 🆕 ADDED (For Subscriptions & Stripe logs)
  ],

  educator: [
    { title: "Dashboard", url: "/educator", icon: LayoutDashboard },
    { title: "My Products", url: "/educator/products", icon: BookOpen },
    { title: "Sessions", url: "/educator/sessions", icon: Calendar },
    { title: "Student Roster", url: "/educator/roster", icon: Users },
    { title: "Earnings", url: "/educator/earnings", icon: CreditCard },
    { title: "Availability", url: "/educator/availability", icon: Clock }, // Changed icon
    { title: "Profile Settings", url: "/educator/profile", icon: Settings },
  ],

  learner: [
    { title: "Dashboard", url: "/learner", icon: LayoutDashboard },
    { title: "Explore Catalog", url: "/courses", icon: Compass }, // 🆕 ADDED (To buy/browse new courses)
    { title: "My Courses", url: "/learner/enrolled", icon: BookOpen },
    { title: "My Sessions", url: "/learner/sessions", icon: Calendar },
    { title: "Billing & Plan", url: "/learner/billing", icon: BillingIcon }, // 🆕 ADDED (Manage subscription/receipts)
    { title: "Settings", url: "/learner/settings", icon: Settings },
  ],
};

const secondaryNav: NavItem[] = [
  { title: "Support & Help", url: "#", icon: HelpCircleIcon },
  { title: "Quick Search", url: "#", icon: Search },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRoles?: string[];
  permissions?: string[];
}

export function AppSidebar({
  userRoles = [],

  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { data: session } = authClient.useSession();

  const rolesList = [...userRoles];
  if (session?.user) {
    const userObj = session.user as { role?: string; roles?: string[] };
    if (userObj.role) rolesList.push(userObj.role);
    if (Array.isArray(userObj.roles)) rolesList.push(...userObj.roles);
  }

  const normalizedRoles = rolesList.map((r) => r.toLowerCase());

  const activeRoleKey = normalizedRoles.includes("admin")
    ? "admin"
    : normalizedRoles.includes("educator") ||
        normalizedRoles.includes("facilitator")
      ? "educator"
      : "learner";

  const navGroups = navigationData[activeRoleKey] ?? navigationData.learner;

  if (!mounted) {
    return <Sidebar {...props} />;
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-zinc-800/60 bg-[#09090b] p-0"
      {...props}
    >
      {/* Brand Header */}
      <SidebarHeader className="p-0">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between">
            <SidebarMenuButton asChild className="h-auto p-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-background w-full">
                  <MyLogo />
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="px-2 py-3 space-y-4">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navGroups.map((item, index) => {
                const Icon = item.icon;
                const isExact = pathname === item.url;

                // Root path check that dynamically catches /admin, /educator, /learner, /dashboard, etc.
                const isRootPath =
                  index === 0 || // The first item ("Dashboard") in any group is a root entry point
                  item.url === "/admin" ||
                  item.url === "/educator" ||
                  item.url === "/learner" ||
                  item.url === "/dashboard" ||
                  item.url === `/dashboard/${activeRoleKey}`;

                const isNested =
                  !isRootPath && pathname?.startsWith(`${item.url}/`);

                const isActive = isExact || isNested;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`h-9 px-3 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                      }`}
                    >
                      <Link
                        href={item.url}
                        className="flex items-center justify-between w-full"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? "text-indigo-400" : "text-zinc-400"
                            }`}
                          />
                          <span>{item.title}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Help Links */}
        <SidebarGroup className="mt-auto p-0 pt-4 border-t border-zinc-800/40">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="h-8 px-3 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-2.5"
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter className="p-3 border-t border-zinc-800/40 bg-zinc-950/50">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

// // app/_components/sidebar/dashboard-sidebar.tsx
// "use client";

// import * as React from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import {
//   LayoutDashboard,
//   Users,
//   BookOpen,
//   Settings,
//   Search,
//   Columns,
//   CreditCard,
//   Camera,
//   Calendar,
//   HelpCircleIcon,
//   LucideIcon,
// } from "lucide-react";

// import {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarGroup,
//   SidebarGroupLabel,
//   SidebarGroupContent,
// } from "../ui/sidebar";

// import { authClient } from "@/lib/auth-client";
// import MyLogo from "../Logo";
// import { NavUser } from "./nav-user";

// export interface NavItem {
//   title: string;
//   url: string;
//   icon: LucideIcon;
//   badge?: string;
// }

// const navigationData: Record<string, NavItem[]> = {
//   admin: [
//     { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
//     { title: "Products", url: "/dashboard/products", icon: Columns },
//     { title: "Subjects", url: "/dashboard/subjects", icon: Users },
//     { title: "Educators", url: "/dashboard/admin/educators", icon: Camera },
//     { title: "Student Roster", url: "/dashboard/admin/roster", icon: Users },
//     { title: "Payouts", url: "/dashboard/admin/payout", icon: CreditCard },
//   ],

//   educator: [
//     { title: "Dashboard", url: "/dashboard/educator", icon: LayoutDashboard },
//     { title: "Products", url: "/dashboard/educator/products", icon: BookOpen },
//     { title: "Sessions", url: "/dashboard/educator/sessions", icon: Calendar },
//     { title: "Student Roster", url: "/dashboard/educator/roster", icon: Users },
//     {
//       title: "Earnings",
//       url: "/dashboard/educator/earnings",
//       icon: CreditCard,
//     },
//     {
//       title: "Availability",
//       url: "/dashboard/educator/availability",
//       icon: Settings,
//     },
//     {
//       title: "Profile Settings",
//       url: "/dashboard/educator/profile",
//       icon: Settings,
//     },
//   ],

//   learner: [
//     {
//       title: "Dashboard",
//       url: "/dashboard/learner",
//       icon: LayoutDashboard,
//     },
//     {
//       title: "My Courses",
//       url: "/dashboard/learner/enrolled",
//       icon: BookOpen,
//     },
//     {
//       title: "My Sessions",
//       url: "/dashboard/learner/sessions",
//       icon: Calendar,
//     },
//     {
//       title: "Communities",
//       url: "/dashboard/learner/communities",
//       icon: Camera,
//     },

//     {
//       title: "Settings",
//       url: "/dashboard/learner/settings",
//       icon: Settings,
//     },
//   ],
// };

// const secondaryNav: NavItem[] = [
//   { title: "Support & Help", url: "#", icon: HelpCircleIcon },
//   { title: "Quick Search", url: "#", icon: Search },
// ];

// interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
//   userRoles?: string[];
//   permissions?: string[];
// }

// export function AppSidebar({
//   userRoles = [],
//   permissions = [],
//   ...props
// }: AppSidebarProps) {
//   const pathname = usePathname();
//   const mounted = React.useSyncExternalStore(
//     () => () => {},
//     () => true,
//     () => false,
//   );

//   const { data: session } = authClient.useSession();

//   const rolesList = [...userRoles];
//   if (session?.user) {
//     const userObj = session.user as { role?: string; roles?: string[] };
//     if (userObj.role) rolesList.push(userObj.role);
//     if (Array.isArray(userObj.roles)) rolesList.push(...userObj.roles);
//   }

//   const normalizedRoles = rolesList.map((r) => r.toLowerCase());

//   const activeRoleKey = normalizedRoles.includes("admin")
//     ? "admin"
//     : normalizedRoles.includes("educator") ||
//         normalizedRoles.includes("facilitator")
//       ? "educator"
//       : "learner";

//   const navGroups = navigationData[activeRoleKey] ?? navigationData.learner;

//   if (!mounted) {
//     return <Sidebar {...props} />;
//   }

//   return (
//     <Sidebar
//       collapsible="offcanvas"
//       className="border-r border-zinc-800/60 bg-[#09090b] p-0"
//       {...props}
//     >
//       {/* Brand Header */}
//       <SidebarHeader className="p-0 ">
//         <SidebarMenu>
//           <SidebarMenuItem className="flex items-center justify-between">
//             <SidebarMenuButton asChild className="h-auto p-0 ">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 rounded-xl bg-background w-full ">
//                   <MyLogo />
//                 </div>
//               </div>
//             </SidebarMenuButton>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarHeader>

//       {/* Main Navigation */}
//       <SidebarContent className="px-2 py-3 space-y-4">
//         {navGroups.map((group) => (
//           <SidebarGroup key={group.label} className="p-0">
//             <SidebarGroupLabel className="px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
//               {group.label}
//             </SidebarGroupLabel>
//             <SidebarGroupContent className="pt-1">
//               <SidebarMenu className="space-y-0.5">
//                 {group.items.map((item) => {
//                   const Icon = item.icon;
//                   const isActive =
//                     pathname === item.url ||
//                     (item.url !== `/dashboard/${activeRoleKey}` &&
//                       pathname?.startsWith(item.url));

//                   return (
//                     <SidebarMenuItem key={item.title}>
//                       <SidebarMenuButton
//                         asChild
//                         isActive={isActive}
//                         className={`h-9 px-3 rounded-lg text-xs font-medium transition-all ${
//                           isActive
//                             ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold"
//                             : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
//                         }`}
//                       >
//                         <Link
//                           href={item.url}
//                           className="flex items-center justify-between w-full"
//                         >
//                           <div className="flex items-center gap-2.5">
//                             <Icon
//                               className={`w-4 h-4 shrink-0 ${
//                                 isActive ? "text-indigo-400" : "text-zinc-400"
//                               }`}
//                             />
//                             <span>{item.title}</span>
//                           </div>
//                           {item.badge && (
//                             <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold">
//                               {item.badge}
//                             </span>
//                           )}
//                         </Link>
//                       </SidebarMenuButton>
//                     </SidebarMenuItem>
//                   );
//                 })}
//               </SidebarMenu>
//             </SidebarGroupContent>
//           </SidebarGroup>
//         ))}

//         {/* Secondary Help Links */}
//         <SidebarGroup className="mt-auto p-0 pt-4 border-t border-zinc-800/40">
//           <SidebarGroupContent>
//             <SidebarMenu className="space-y-0.5">
//               {secondaryNav.map((item) => {
//                 const Icon = item.icon;
//                 return (
//                   <SidebarMenuItem key={item.title}>
//                     <SidebarMenuButton
//                       asChild
//                       className="h-8 px-3 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
//                     >
//                       <Link
//                         href={item.url}
//                         className="flex items-center gap-2.5"
//                       >
//                         <Icon className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
//                         <span>{item.title}</span>
//                       </Link>
//                     </SidebarMenuButton>
//                   </SidebarMenuItem>
//                 );
//               })}
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>
//       </SidebarContent>

//       {/* User Footer */}
//       <SidebarFooter className="p-3 border-t border-zinc-800/40 bg-zinc-950/50">
//         <NavUser />
//       </SidebarFooter>
//     </Sidebar>
//   );
// }

// "use client";

// import * as React from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import {
//   LayoutDashboard,
//   Users,
//   BookOpen,
//   Settings,
//   Search,
//   Columns,
//   CreditCard,
//   Camera,
//   Calendar,
//   HelpCircleIcon,
//   LucideIcon,
// } from "lucide-react";

// import {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarMenuSub,
//   SidebarMenuSubButton,
//   SidebarMenuSubItem,
// } from "../ui/sidebar";

// import { authClient } from "@/lib/auth-client";
// import MyLogo from "../Logo";
// import { NavUser } from "./nav-user";

// export interface NavItem {
//   title: string;
//   url: string;
//   icon: LucideIcon;
//   items?: {
//     title: string;
//     url: string;
//   }[];
// }

// const navigationData: Record<string, NavItem[]> = {
//   admin: [
//     { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
//     { title: "Products", url: "/products", icon: Columns },
//     { title: "Subjects", url: "/subjects", icon: Users },
//     { title: "Educators", url: "/educators", icon: Camera },
//     { title: "Students", url: "/roster", icon: Users },
//     { title: "Payout", url: "/payout", icon: CreditCard },
//   ],
//   educator: [
//     { title: "Dashboard", url: "/educator", icon: LayoutDashboard },
//     { title: "Products", url: "/products", icon: BookOpen },
//     { title: "Sessions", url: "/sessions", icon: Calendar },
//     { title: "Student Roster", url: "/roster", icon: Users },
//     { title: "Earnings", url: "/earnings", icon: CreditCard },
//     { title: "Profile", url: "/profile", icon: Settings },
//     { title: "Availability", url: "/availability", icon: Settings },
//   ],
//   learner: [
//     { title: "Dashboard", url: "/learner", icon: LayoutDashboard },
//     { title: "My Communities", url: "/communities", icon: Camera },
//     { title: "My Courses", url: "/enrolled", icon: BookOpen },
//     { title: "My Sessions", url: "/sessions", icon: Users },
//     { title: "Settings", url: "/settings", icon: Settings },
//   ],
// };

// const secondaryNav: NavItem[] = [
//   { title: "Get Help", url: "#", icon: HelpCircleIcon },
//   { title: "Search", url: "#", icon: Search },
// ];

// interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
//   userRoles?: string[];
//   permissions?: string[];
// }

// export function AppSidebar({
//   userRoles = [],
//   permissions = [],
//   ...props
// }: AppSidebarProps) {
//   const pathname = usePathname();
//   const mounted = React.useSyncExternalStore(
//     () => () => {},
//     () => true,
//     () => false,
//   );

//   const { data: session, isPending } = authClient.useSession();

//   // Combine roles passed via layout props + client session fallback
//   const rolesList = [...userRoles];

//   if (session?.user) {
//     const userObj = session.user as { role?: string; roles?: string[] };
//     if (userObj.role) rolesList.push(userObj.role);
//     if (Array.isArray(userObj.roles)) rolesList.push(...userObj.roles);
//   }

//   const normalizedRoles = rolesList.map((r) => r.toLowerCase());

//   // Priority role resolution: Admin -> Educator -> Learner
//   const activeRoleKey = normalizedRoles.includes("admin")
//     ? "admin"
//     : normalizedRoles.includes("educator") ||
//         normalizedRoles.includes("facilitator")
//       ? "educator"
//       : "learner";

//   const navMainItems = navigationData[activeRoleKey] ?? navigationData.learner;

//   if (!mounted) {
//     return <Sidebar {...props} />;
//   }

//   return (
//     <Sidebar collapsible="offcanvas" {...props}>
//       {/* Header */}
//       <SidebarHeader className="p-0">
//         <SidebarMenu>
//           <SidebarMenuItem>
//             <SidebarMenuButton
//               asChild
//               className="h-auto p-0 hover:bg-transparent"
//             >
//               <div className="p-6 bg-amber-50 dark:bg-emerald-950 flex w-full items-center">
//                 <MyLogo />
//               </div>
//             </SidebarMenuButton>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarHeader>

//       {/* Main Navigation */}
//       <SidebarContent>
//         <SidebarGroup>
//           <SidebarGroupContent>
//             <SidebarMenu>
//               {navMainItems.map((item) => {
//                 const Icon = item.icon;
//                 const isActive =
//                   pathname === item.url ||
//                   (item.url !== `/${activeRoleKey}` &&
//                     pathname?.startsWith(item.url));

//                 return (
//                   <SidebarMenuItem key={item.title}>
//                     <SidebarMenuButton asChild isActive={isActive}>
//                       <Link href={item.url} className="flex items-center gap-3">
//                         <Icon className="w-4 h-4 shrink-0" />
//                         <span>{item.title}</span>
//                       </Link>
//                     </SidebarMenuButton>

//                     {item.items?.length ? (
//                       <SidebarMenuSub>
//                         {item.items.map((subItem) => (
//                           <SidebarMenuSubItem key={subItem.title}>
//                             <SidebarMenuSubButton
//                               asChild
//                               isActive={pathname === subItem.url}
//                             >
//                               <Link href={subItem.url}>
//                                 <span>{subItem.title}</span>
//                               </Link>
//                             </SidebarMenuSubButton>
//                           </SidebarMenuSubItem>
//                         ))}
//                       </SidebarMenuSub>
//                     ) : null}
//                   </SidebarMenuItem>
//                 );
//               })}
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>

//         {/* Secondary Navigation */}
//         <SidebarGroup className="mt-auto">
//           <SidebarGroupContent>
//             <SidebarMenu>
//               {secondaryNav.map((item) => {
//                 const Icon = item.icon;
//                 return (
//                   <SidebarMenuItem key={item.title}>
//                     <SidebarMenuButton asChild size="sm">
//                       <Link href={item.url} className="flex items-center gap-3">
//                         <Icon className="w-4 h-4 shrink-0" />
//                         <span>{item.title}</span>
//                       </Link>
//                     </SidebarMenuButton>
//                   </SidebarMenuItem>
//                 );
//               })}
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>
//       </SidebarContent>

//       {/* Footer */}
//       <SidebarFooter className="p-0">
//         <NavUser />
//       </SidebarFooter>
//     </Sidebar>
//   );
// }

// "use client";

// import * as React from "react";
// import {
//   LayoutDashboard,
//   Users,
//   BookOpen,
//   Settings,
//   Search,
//   Columns,
//   CreditCard,
//   Camera,
//   HelpCircleIcon,
// } from "lucide-react";

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

// import { authClient } from "@/lib/auth-client";
// import MyLogo from "../Logo";
// import { Calendar } from "lucide-react";

// const navigationData = {
//   admin: [
//     { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
//     { title: "Products", url: "/admin/products", icon: Columns },
//     { title: "Subjects", url: "/admin/subjects", icon: Users },
//     { title: "Educators", url: "/admin/educators", icon: Camera },
//     { title: "Students", url: "/admin/roster", icon: Users },
//     { title: "Payout", url: "/admin/payout", icon: CreditCard },
//   ],
//   educator: [
//     { title: "Dashboard", url: "/educator", icon: LayoutDashboard },
//     { title: "Products", url: "/educator/products", icon: BookOpen },
//     { title: "Sessions", url: "/educator/sessions", icon: Calendar },
//     { title: "Student Roster", url: "/educator/roster", icon: Users },
//     { title: "Earnings", url: "/educator/earnings", icon: CreditCard },
//     { title: "Profile", url: "/educator/profile", icon: Settings },
//     { title: "Availability", url: "/educator/availability", icon: Settings },
//   ],
//   learner: [
//     { title: "Dashboard", url: "/learner", icon: LayoutDashboard },
//     { title: "My Communities", url: "/learner/communities", icon: Camera },
//     { title: "My Courses", url: "/learner/enrolled", icon: BookOpen },
//     { title: "My Sessions", url: "/learner/sessions", icon: Users },
//     { title: "Settings", url: "/learner/settings", icon: Settings },
//   ],
// };

// const secondaryNav = [
//   { title: "Get Help", url: "#", icon: HelpCircleIcon },
//   { title: "Search", url: "#", icon: Search },
// ];

// export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
//   const mounted = React.useSyncExternalStore(
//     () => () => {},
//     () => true,
//     () => false,
//   );

//   const { data: session, isPending } = authClient.useSession();

//   if (!mounted) {
//     return <Sidebar {...props} />;
//   }

//   const rawRole = (session?.user as { role?: string })?.role || "Student";
//   const userRole = rawRole.toLowerCase() as keyof typeof navigationData;
//   const navMainItems = navigationData[userRole] ?? navigationData.learner;

//   return (
//     <Sidebar collapsible="offcanvas" {...props}>
//       <SidebarHeader className="p-0">
//         <SidebarMenu>
//           <SidebarMenuItem>
//             <SidebarMenuButton asChild>
//               <div className="p-6 bg-amber-50 dark:bg-emerald-950 flex">
//                 <MyLogo />
//               </div>
//             </SidebarMenuButton>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarHeader>

//       <SidebarContent>
//         {!isPending && <NavMain items={navMainItems} />}
//         <NavSecondary items={secondaryNav} className="mt-auto" />
//       </SidebarContent>

//       <SidebarFooter className="p-0">
//         <NavUser />
//       </SidebarFooter>
//     </Sidebar>
//   );
// }
