"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  BookOpen,
  Settings,
  HelpCircle,
  LogOut,
  UserCheck,
  ShieldCheck,
  Moon,
  ChevronRight,
  Languages,
  MessageSquarePlus,
} from "lucide-react";

import { SidebarTrigger } from "@/app/_components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ThemeToggle } from "../ui/themeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface SiteHeaderProps {
  userName?: string;
  userImage?: string;
}

export function SiteHeader({
  userName: initialUserName,
  userImage: initialUserImage,
}: SiteHeaderProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  // Prioritize server-passed props to prevent SSR hydration mismatch, then fallback to client session
  const userName = initialUserName || user?.name || "Justdy User";
  const userImage = initialUserImage || user?.image || "";
  const userEmail = user?.email || "";
  const userHandle =
    `@${userName.replace(/\s+/g, "").toLowerCase()}` || "@user";

  const userInitials = userName
    ? userName
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "JU";

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-800/60 bg-[#0f0f0f] px-4 backdrop-blur-md transition-all gap-4 text-zinc-200">
      {/* Left: Sidebar Trigger */}
      <div className="flex items-center gap-3 shrink-0">
        <SidebarTrigger className="h-9 w-9 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center justify-center" />

        <div className="flex-1 max-w-xl mx-auto px-2">
          <div className="">Dashboard</div>
        </div>
      </div>

      {/* Center: YouTube-Style Search Bar */}

      {/* Right: Studio Action Buttons & Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notifications */}
        <button
          title="Notifications"
          className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
        >
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <div className="h-4 w-px bg-zinc-800 my-auto" />
          <ThemeToggle />
        </div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-blue-500">
              <Avatar className="w-8 h-8 border border-zinc-700 cursor-pointer hover:border-zinc-500 transition-colors">
                <AvatarImage
                  src={userImage}
                  alt={userName}
                  className="object-cover"
                />
                <AvatarFallback
                  suppressHydrationWarning
                  className="bg-zinc-800 text-zinc-200 text-xs font-medium"
                >
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-80 bg-[#141414] border-zinc-800 text-zinc-200 shadow-2xl rounded-2xl p-0.5 overflow-hidden"
          >
            {/* User Info Header (Group 1) */}
            <DropdownMenuLabel className="font-normal p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={userImage}
                    alt={userName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-zinc-800 text-zinc-200 text-lg font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5 flex-1">
                  <p className="text-base font-semibold leading-tight text-zinc-50">
                    {userName}
                  </p>
                  <p className="text-sm leading-tight text-zinc-400 truncate">
                    {userEmail || userHandle}
                  </p>
                  {/* View Profile/Channel Link */}
                  <Link
                    href="/profile"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors pt-2 block w-max"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-zinc-800/80 mx-0" />

            {/* Main Actions (Group 2) */}
            <DropdownMenuGroup className="p-1">
              <DropdownMenuItem
                asChild
                className="p-2.5 cursor-pointer focus:bg-zinc-800/60 focus:text-zinc-100 rounded-xl"
              >
                <Link
                  href="/account"
                  className="flex items-center gap-4 w-full"
                >
                  <UserCheck className="w-5 h-5 text-zinc-300" />
                  <span className="flex-1 text-sm">Account Manager</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                asChild
                className="p-2.5 cursor-pointer focus:bg-zinc-800/60 focus:text-zinc-100 rounded-xl"
              >
                <Link
                  href="/privacy"
                  className="flex items-center gap-4 w-full"
                >
                  <ShieldCheck className="w-5 h-5 text-zinc-300" />
                  <span className="flex-1 text-sm">Security & Privacy</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleLogout}
                className="p-2.5 cursor-pointer focus:bg-zinc-800/60 focus:text-zinc-100 rounded-xl flex items-center gap-4"
              >
                <LogOut className="w-5 h-5 text-zinc-300" />
                <span className="flex-1 text-sm">Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-zinc-800/80 mx-0" />

            {/* Secondary Actions (Group 3) */}
            <DropdownMenuGroup className="p-1">
              <DropdownMenuItem
                asChild
                className="p-2.5 cursor-pointer focus:bg-zinc-800/60 focus:text-zinc-100 rounded-xl"
              >
                <Link
                  href="/courses"
                  className="flex items-center gap-4 w-full"
                >
                  <BookOpen className="w-5 h-5 text-zinc-300" />
                  <span className="flex-1 text-sm">My Courses</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem className="p-2.5 cursor-pointer focus:bg-zinc-800/60 focus:text-zinc-100 rounded-xl">
                <div className="flex items-center gap-4 w-full">
                  <Moon className="w-5 h-5 text-zinc-300" />
                  <span className="flex-1 text-sm">Appearance</span>
                  <ChevronRight className="w-5 h-5 text-zinc-500" />
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem className="p-2.5 cursor-pointer focus:bg-zinc-800/60 focus:text-zinc-100 rounded-xl">
                <div className="flex items-center gap-4 w-full">
                  <Languages className="w-5 h-5 text-zinc-300" />
                  <span className="flex-1 text-sm">Display Language</span>
                  <ChevronRight className="w-5 h-5 text-zinc-500" />
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-zinc-800/80 mx-0" />

            {/* Bottom Actions (Group 4) */}
            <DropdownMenuGroup className="p-1">
              <DropdownMenuItem
                asChild
                className="p-2.5 cursor-pointer focus:bg-zinc-800/60 focus:text-zinc-100 rounded-xl"
              >
                <Link
                  href="/learner/settings"
                  className="flex items-center gap-4 w-full"
                >
                  <Settings className="w-5 h-5 text-zinc-300" />
                  <span className="flex-1 text-sm">Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                asChild
                className="p-2.5 cursor-pointer focus:bg-zinc-800/60 focus:text-zinc-100 rounded-xl"
              >
                <Link href="/help" className="flex items-center gap-4 w-full">
                  <HelpCircle className="w-5 h-5 text-zinc-300" />
                  <span className="flex-1 text-sm">Help & Support</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                asChild
                className="p-2.5 cursor-pointer focus:bg-zinc-800/60 focus:text-zinc-100 rounded-xl"
              >
                <Link
                  href="/feedback"
                  className="flex items-center gap-4 w-full"
                >
                  <MessageSquarePlus className="w-5 h-5 text-zinc-300" />
                  <span className="flex-1 text-sm">Send Feedback</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

//   // Generate dynamic breadcrumbs from URL path
//   const segments = pathname.split("/").filter(Boolean);

//   return (
//     <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-md transition-all sm:px-6 gap-4">
//       {/* Left: Sidebar Toggle, Breadcrumbs & Search Bar */}
//       <div className="flex items-center gap-4 flex-1">
//         <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-100 transition-colors shrink-0" />
//         <div className="h-4 w-px bg-zinc-800 shrink-0" />

//         {/* Dynamic Breadcrumbs */}
//         <nav className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 shrink-0 capitalize">
//           <Link
//             href="/dashboard"
//             className="hover:text-zinc-200 transition-colors font-medium"
//           >
//             Dashboard
//           </Link>

//           {segments.map((segment, index) => {
//             const href = `/${segments.slice(0, index + 1).join("/")}`;
//             const isLast = index === segments.length - 1;

//             if (segment === "dashboard") return null;

//             return (
//               <React.Fragment key={href}>
//                 <ChevronRight className="w-3 h-3 text-zinc-600" />
//                 {isLast ? (
//                   <span className="text-zinc-200 font-medium">{segment}</span>
//                 ) : (
//                   <Link
//                     href={href}
//                     className="hover:text-zinc-200 transition-colors"
//                   >
//                     {segment}
//                   </Link>
//                 )}
//               </React.Fragment>
//             );
//           })}
//         </nav>

//         {/* Search Bar aligned immediately after Breadcrumbs */}
//         <div className="hidden md:flex items-center w-full max-w-md ml-2">
//           <div className="relative w-full">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
//             <input
//               type="text"
//               placeholder="Search platform, sessions, courses... (⌘K)"
//               className="w-full h-8 pl-9 pr-3 text-xs bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Right: Quick Actions & Exit */}
//       <div className="flex items-center gap-2 shrink-0">
//         <ThemeToggle />

//         <div className="h-4 w-px bg-zinc-800 my-auto" />

//         <Link
//           href="/"
//           className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 bg-zinc-900/40 border border-zinc-800 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
//         >
//           <LogOut className="w-3.5 h-3.5" />
//           <span className="hidden sm:inline">Exit</span>
//         </Link>
//       </div>
//     </header>
//   );
// }

// import Link from "next/link";
// import { IconLogout } from "@tabler/icons-react";

// export function HeaderWelcome({ name }: { name: string }) {
//   return (
//     <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between w-full h-14">
//       {/* Left Side: Hamburger Menu + Welcome Text */}
//       <div className="flex items-center gap-3">
//         <h3 className="text-sm md:text-lg font-semibold text-white truncate max-w-45 sm:max-w-none">
//           Welcome, <span className="text-[#DFFF00]">{name}</span>
//         </h3>
//       </div>

//       {/* Right Side: Exit Button */}
//       <Link
//         href="/"
//         className="
//           flex items-center gap-1.5 md:gap-2
//           rounded-md px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm
//           bg-white/5 border border-white/10
//           hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400
//           transition shrink-0
//         "
//       >
//         <IconLogout size={14} className="md:w-4 md:h-4" />
//         <span>Exit</span>
//       </Link>
//     </div>
//   );
// }

// import Link from "next/link";
// import { IconLogout } from "@tabler/icons-react";

// export function HeaderWelcome({ name }: { name: string }) {
//   return (
//     <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-0">
//       <div>
//         <h3 className="text-lg font-semibold text-white">
//           Welcome back, <span className="text-[#DFFF00]">{name}</span>
//         </h3>
//       </div>

//       <Link
//         href="/"
//         className="
//           flex items-center gap-2
//           rounded-md px-3 py-2 text-sm
//           bg-white/5 border border-white/10
//           hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400
//           transition
//         "
//       >
//         <IconLogout size={16} />
//         Exit
//       </Link>
//     </div>
//   );
// }
