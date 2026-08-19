"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  LogOut,
  Moon,
  ChevronRight,
  Languages,
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
          router.push("/");
        },
      },
    });
  };

  return (
    <header
      className="
        sticky
        top-0
        z-30
        flex
        h-16
        w-full
        items-center
        justify-between
        border-b
        border-slate-200
        bg-white/95
        px-4
        text-slate-900
        shadow-[0_1px_3px_rgba(0,0,0,0.03)]
        backdrop-blur
        transition-all

        sm:px-6
        lg:px-8
      "
    >
      {/* ============================================================
          LEFT
      ============================================================ */}

      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger
          className="
            size-9
            shrink-0
            rounded-lg
            border
            border-slate-200
            bg-white
            text-slate-500
            shadow-sm
            transition-all
            hover:bg-slate-50
            hover:text-slate-900
            hover:shadow
          "
        />

        <div className="hidden h-5 w-px bg-slate-200 sm:block" />

        <div className="flex min-w-0 items-center">
          <span className="truncate text-sm font-semibold text-slate-800">
            Dashboard
          </span>
        </div>
      </div>

      {/* ============================================================
          CENTER
      ============================================================ */}

      <div className="hidden flex-1 md:block" />

      {/* ============================================================
          RIGHT
      ============================================================ */}

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Notifications */}

        <button
          type="button"
          title="Notifications"
          aria-label="Notifications"
          className="
            relative
            flex
            size-9
            items-center
            justify-center
            rounded-lg
            text-slate-500
            transition-colors
            hover:bg-slate-100
            hover:text-slate-900
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#857938]
            focus-visible:ring-offset-2
          "
        >
          <Bell className="size-5" />

          {/* Notification indicator */}

          {/*
          <span
            className="
              absolute
              right-1.5
              top-1.5
              size-2
              rounded-full
              bg-red-600
              ring-2
              ring-white
            "
          />
          */}
        </button>

        {/* Divider */}

        <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

        {/* Theme */}

        <div
          className="
            flex
            size-9
            items-center
            justify-center
            rounded-lg
            text-slate-500
            transition-colors
            hover:bg-slate-100
            hover:text-slate-900
          "
        >
          <ThemeToggle />
        </div>

        {/* User */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open user menu"
              className="
                ml-1
                rounded-full
                outline-none
                focus-visible:ring-2
                focus-visible:ring-[#857938]
                focus-visible:ring-offset-2
              "
            >
              <Avatar
                className="
                  size-9
                  cursor-pointer
                  border
                  border-slate-200
                  shadow-sm
                  transition-all
                  hover:border-slate-300
                  hover:shadow
                "
              >
                <AvatarImage
                  src={userImage}
                  alt={userName}
                  className="object-cover"
                />

                <AvatarFallback
                  suppressHydrationWarning
                  className="
                    bg-slate-100
                    text-xs
                    font-semibold
                    text-slate-700
                  "
                >
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="
              w-80
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-1
              text-slate-900
              shadow-2xl
            "
          >
            {/* USER INFORMATION */}

            <DropdownMenuLabel className="p-4 font-normal">
              <div className="flex items-center gap-4">
                <Avatar className="size-12 border border-slate-200">
                  <AvatarImage
                    src={userImage}
                    alt={userName}
                    className="object-cover"
                  />

                  <AvatarFallback className="bg-slate-100 text-lg font-semibold text-slate-700">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-900">
                    {userName}
                  </p>

                  <p className="truncate text-sm text-slate-500">
                    {userEmail || userHandle}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-slate-200" />

            <DropdownMenuGroup className="p-1">
              {/* My Courses */}

              <DropdownMenuItem
                asChild
                className="
                  cursor-pointer
                  rounded-xl
                  p-2.5
                  text-slate-700
                  transition-colors
                  focus:bg-slate-50
                  focus:text-slate-900
                "
              >
                <Link
                  href="/courses"
                  className="flex w-full items-center gap-4"
                >
                  <BookOpen className="size-5 text-slate-500" />

                  <span className="flex-1 text-sm font-medium">My Courses</span>
                </Link>
              </DropdownMenuItem>

              {/* Appearance */}

              <DropdownMenuItem
                className="
                  cursor-pointer
                  rounded-xl
                  p-2.5
                  text-slate-700
                  transition-colors
                  focus:bg-slate-50
                  focus:text-slate-900
                "
              >
                <div className="flex w-full items-center gap-4">
                  <Moon className="size-5 text-slate-500" />

                  <span className="flex-1 text-sm font-medium">Appearance</span>

                  <ChevronRight className="size-4 text-slate-400" />
                </div>
              </DropdownMenuItem>

              {/* Language */}

              <DropdownMenuItem
                className="
                  cursor-pointer
                  rounded-xl
                  p-2.5
                  text-slate-700
                  transition-colors
                  focus:bg-slate-50
                  focus:text-slate-900
                "
              >
                <div className="flex w-full items-center gap-4">
                  <Languages className="size-5 text-slate-500" />

                  <span className="flex-1 text-sm font-medium">
                    Display Language
                  </span>

                  <ChevronRight className="size-4 text-slate-400" />
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-slate-200" />

            {/* SIGN OUT */}

            <DropdownMenuGroup className="p-1">
              <DropdownMenuItem
                onClick={handleLogout}
                className="
                  flex
                  cursor-pointer
                  items-center
                  gap-4
                  rounded-xl
                  p-2.5
                  text-slate-700
                  transition-colors
                  focus:bg-red-50
                  focus:text-red-600
                "
              >
                <LogOut className="size-5 text-slate-500" />

                <span className="flex-1 text-sm font-medium">Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// "use client";

// import React from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import {
//   Bell,
//   BookOpen,
//   LogOut,
//   Moon,
//   ChevronRight,
//   Languages,
// } from "lucide-react";

// import { SidebarTrigger } from "@/app/_components/ui/sidebar";
// import { authClient } from "@/lib/auth-client";

// import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
// import { ThemeToggle } from "../ui/themeToggle";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuGroup,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "../ui/dropdown-menu";

// interface SiteHeaderProps {
//   userName?: string;
//   userImage?: string;
// }

// export function SiteHeader({
//   userName: initialUserName,
//   userImage: initialUserImage,
// }: SiteHeaderProps) {
//   const router = useRouter();
//   const { data: session } = authClient.useSession();
//   const user = session?.user;

//   // Prioritize server-passed props to prevent SSR hydration mismatch
//   const userName = initialUserName || user?.name || "Justdy User";

//   const userImage = initialUserImage || user?.image || "";

//   const userEmail = user?.email || "";

//   const userHandle =
//     `@${userName.replace(/\s+/g, "").toLowerCase()}` || "@user";

//   const userInitials = userName
//     ? userName
//         .trim()
//         .split(" ")
//         .filter(Boolean)
//         .map((n) => n[0])
//         .join("")
//         .slice(0, 2)
//         .toUpperCase()
//     : "JU";

//   const handleLogout = async () => {
//     await authClient.signOut({
//       fetchOptions: {
//         onSuccess: () => {
//           router.push("/");
//         },
//       },
//     });
//   };

//   return (
//     <header
//       className="
//         sticky
//         top-0
//         z-30
//         flex
//         h-14
//         w-full
//         items-center
//         justify-between
//         rounded-none
//         border-b
//         border-gray-200
//         bg-white
//         px-4
//         text-gray-900
//         shadow-sm
//         transition-all
//         gap-4
//       "
//     >
//       {/* ==================================================
//           LEFT SECTION
//       ================================================== */}

//       <div className="flex items-center gap-3 shrink-0">
//         {/* Sidebar Trigger */}
//         <SidebarTrigger
//           className="
//             h-9
//             w-9
//             rounded-md
//             border
//             border-transparent
//             text-gray-500
//             hover:bg-gray-100
//             hover:text-gray-900
//             transition-colors
//             flex
//             items-center
//             justify-center
//           "
//         />

//         {/* Page Title */}
//         <div className="flex items-center px-2">
//           <div
//             className="
//               text-sm
//               font-semibold
//               text-gray-800
//               whitespace-nowrap
//             "
//           >
//             Dashboard
//           </div>
//         </div>
//       </div>

//       {/* ==================================================
//           CENTER SECTION
//       ================================================== */}

//       <div className="hidden md:flex flex-1" />

//       {/* ==================================================
//           RIGHT SECTION
//       ================================================== */}

//       <div className="flex items-center gap-2 sm:gap-3 shrink-0">
//         {/* Notifications */}
//         <button
//           type="button"
//           title="Notifications"
//           aria-label="Notifications"
//           className="
//             relative
//             p-2
//             rounded-full
//             text-gray-500
//             hover:bg-gray-100
//             hover:text-gray-900
//             transition-colors
//             focus:outline-none
//             focus-visible:ring-2
//             focus-visible:ring-red-500
//             focus-visible:ring-offset-2
//           "
//         >
//           <Bell className="w-5 h-5" />

//           {/* Optional notification indicator */}
//           {/*
//           <span
//             className="
//               absolute
//               right-1.5
//               top-1.5
//               h-2
//               w-2
//               rounded-full
//               bg-red-600
//               ring-2
//               ring-white
//             "
//           />
//           */}
//         </button>

//         {/* Divider + Theme Toggle */}
//         <div className="flex items-center gap-2 shrink-0">
//           <div
//             className="
//               h-5
//               w-px
//               bg-gray-200
//             "
//           />

//           <div
//             className="
//               text-gray-500
//               hover:text-gray-900
//             "
//           >
//             <ThemeToggle />
//           </div>
//         </div>

//         {/* ==================================================
//             USER PROFILE DROPDOWN
//         ================================================== */}

//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <button
//               type="button"
//               aria-label="Open user menu"
//               className="
//                 ml-1
//                 outline-none
//                 rounded-full
//                 focus-visible:ring-2
//                 focus-visible:ring-red-500
//                 focus-visible:ring-offset-2
//               "
//             >
//               <Avatar
//                 className="
//                   w-8
//                   h-8
//                   border
//                   border-gray-200
//                   cursor-pointer
//                   hover:border-gray-300
//                   transition-colors
//                 "
//               >
//                 <AvatarImage
//                   src={userImage}
//                   alt={userName}
//                   className="object-cover"
//                 />

//                 <AvatarFallback
//                   suppressHydrationWarning
//                   className="
//                     bg-gray-100
//                     text-gray-700
//                     text-xs
//                     font-semibold
//                   "
//                 >
//                   {userInitials}
//                 </AvatarFallback>
//               </Avatar>
//             </button>
//           </DropdownMenuTrigger>

//           {/* ==================================================
//               DROPDOWN MENU
//           ================================================== */}

//           <DropdownMenuContent
//             align="end"
//             sideOffset={8}
//             className="
//               w-80
//               bg-white
//               border
//               border-gray-200
//               text-gray-900
//               shadow-xl
//               rounded-2xl
//               p-1
//               overflow-hidden
//             "
//           >
//             {/* ==================================================
//                 USER INFO
//             ================================================== */}

//             <DropdownMenuLabel
//               className="
//                 font-normal
//                 p-4
//               "
//             >
//               <div className="flex items-center gap-4">
//                 <Avatar
//                   className="
//                     w-12
//                     h-12
//                     border
//                     border-gray-200
//                   "
//                 >
//                   <AvatarImage
//                     src={userImage}
//                     alt={userName}
//                     className="object-cover"
//                   />

//                   <AvatarFallback
//                     className="
//                       bg-gray-100
//                       text-gray-700
//                       text-lg
//                       font-semibold
//                     "
//                   >
//                     {userInitials}
//                   </AvatarFallback>
//                 </Avatar>

//                 <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
//                   <p
//                     className="
//                       text-base
//                       font-semibold
//                       leading-tight
//                       text-gray-900
//                       truncate
//                     "
//                   >
//                     {userName}
//                   </p>

//                   <p
//                     className="
//                       text-sm
//                       leading-tight
//                       text-gray-500
//                       truncate
//                     "
//                   >
//                     {userEmail || userHandle}
//                   </p>
//                 </div>
//               </div>
//             </DropdownMenuLabel>

//             <DropdownMenuSeparator
//               className="
//                 bg-gray-200
//                 mx-0
//               "
//             />

//             {/* ==================================================
//                 SECONDARY ACTIONS
//             ================================================== */}

//             <DropdownMenuGroup className="p-1">
//               {/* My Courses */}
//               <DropdownMenuItem
//                 asChild
//                 className="
//                   p-2.5
//                   cursor-pointer
//                   rounded-xl
//                   text-gray-700
//                   focus:bg-red-50
//                   focus:text-red-600
//                   transition-colors
//                 "
//               >
//                 <Link
//                   href="/courses"
//                   className="
//                     flex
//                     items-center
//                     gap-4
//                     w-full
//                   "
//                 >
//                   <BookOpen
//                     className="
//                       w-5
//                       h-5
//                       text-gray-500
//                       group-focus:text-red-600
//                     "
//                   />

//                   <span className="flex-1 text-sm font-medium">My Courses</span>
//                 </Link>
//               </DropdownMenuItem>

//               {/* Appearance */}
//               <DropdownMenuItem
//                 className="
//                   p-2.5
//                   cursor-pointer
//                   rounded-xl
//                   text-gray-700
//                   focus:bg-red-50
//                   focus:text-red-600
//                   transition-colors
//                 "
//               >
//                 <div
//                   className="
//                     flex
//                     items-center
//                     gap-4
//                     w-full
//                   "
//                 >
//                   <Moon
//                     className="
//                       w-5
//                       h-5
//                       text-gray-500
//                     "
//                   />

//                   <span
//                     className="
//                       flex-1
//                       text-sm
//                       font-medium
//                     "
//                   >
//                     Appearance
//                   </span>

//                   <ChevronRight
//                     className="
//                       w-4
//                       h-4
//                       text-gray-400
//                     "
//                   />
//                 </div>
//               </DropdownMenuItem>

//               {/* Display Language */}
//               <DropdownMenuItem
//                 className="
//                   p-2.5
//                   cursor-pointer
//                   rounded-xl
//                   text-gray-700
//                   focus:bg-red-50
//                   focus:text-red-600
//                   transition-colors
//                 "
//               >
//                 <div
//                   className="
//                     flex
//                     items-center
//                     gap-4
//                     w-full
//                   "
//                 >
//                   <Languages
//                     className="
//                       w-5
//                       h-5
//                       text-gray-500
//                     "
//                   />

//                   <span
//                     className="
//                       flex-1
//                       text-sm
//                       font-medium
//                     "
//                   >
//                     Display Language
//                   </span>

//                   <ChevronRight
//                     className="
//                       w-4
//                       h-4
//                       text-gray-400
//                     "
//                   />
//                 </div>
//               </DropdownMenuItem>
//             </DropdownMenuGroup>

//             <DropdownMenuSeparator
//               className="
//                 bg-gray-200
//                 mx-0
//               "
//             />

//             {/* ==================================================
//                 SIGN OUT
//             ================================================== */}

//             <DropdownMenuGroup className="p-1">
//               <DropdownMenuItem
//                 onClick={handleLogout}
//                 className="
//                   p-2.5
//                   cursor-pointer
//                   rounded-xl
//                   flex
//                   items-center
//                   gap-4
//                   text-gray-700
//                   focus:bg-red-50
//                   focus:text-red-600
//                   transition-colors
//                 "
//               >
//                 <LogOut
//                   className="
//                     w-5
//                     h-5
//                     text-gray-500
//                   "
//                 />

//                 <span
//                   className="
//                     flex-1
//                     text-sm
//                     font-medium
//                   "
//                 >
//                   Sign out
//                 </span>
//               </DropdownMenuItem>
//             </DropdownMenuGroup>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>
//     </header>
//   );
// }
