"use client";

import * as React from "react";
import Link from "next/link";

import {
  Menu,
  X,
  Search,
  ChevronDown,
  Gamepad2,
  Zap,
  Swords,
} from "lucide-react";
import { ThemeToggle } from "@/app/_components/themeToggle";
import { authClient } from "@/lib/auth-client";
import { UserDropdown } from "./UserDropdown";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import MyLogo from "./Logo";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "./ui/navigation-menu";

const gameItems = [
  {
    title: "Mathle (Daily Wordle)",
    description: "Guess today's 6-character math puzzle.",
    href: "/games/mathle",
    icon: Gamepad2,
  },
  {
    title: "Prodigy Math",
    description: "Fast-paced arcade runner for core math facts.",
    href: "/games/prodigy-math",
    icon: Zap,
  },
  {
    title: "Math Duel (1v1)",
    description: "Real-time 60-second multiplayer showdown.",
    href: "/games/duel",
    icon: Swords,
  },
];

interface UserProps {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string | null;
}

export function NavbarClient({}: { user: UserProps | null }) {
  const { data: session, isPending } = authClient.useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGamesOpen, setMobileGamesOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Determine user role(s) safely from session
  const rolesList: string[] = [];
  if (session?.user) {
    const userObj = session.user as { role?: string; roles?: string[] };
    if (userObj.role) rolesList.push(userObj.role);
    if (Array.isArray(userObj.roles)) rolesList.push(...userObj.roles);
  }

  const normalizedRoles = rolesList.map((r) => r.toLowerCase());

  const dashboardUrl = normalizedRoles.includes("admin")
    ? "/admin"
    : normalizedRoles.includes("educator") ||
        normalizedRoles.includes("facilitator")
      ? "/educator"
      : "/learner";

  const userRole = session?.user?.role?.toLowerCase() ?? "learner";

  const menuVariants: Variants = {
    hidden: {
      opacity: 0,
      y: -15,
      transition: { duration: 0.2, ease: "easeInOut" },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 dark:border-slate-800/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between">
        {/* Left Side: Logo */}
        <div className="shrink-0">
          <MyLogo />
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center justify-start gap-6 flex-1 pl-6">
          <nav>
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                <NavigationMenuItem>
                  <Link
                    href="/tutoring"
                    className="px-3 py-2 font-semibold text-slate-600 hover:text-purple-600 dark:text-muted-foreground dark:hover:text-purple-400 transition text-[13px] whitespace-nowrap"
                  >
                    Tutoring
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    href="/products"
                    className="px-3 py-2 font-semibold text-slate-600 hover:text-purple-600 dark:text-muted-foreground dark:hover:text-purple-400 transition text-[13px] whitespace-nowrap"
                  >
                    Products
                  </Link>
                </NavigationMenuItem>

                {/* Games Dropdown Item */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="px-3 py-2 font-semibold text-slate-600 hover:text-purple-600 dark:text-muted-foreground dark:hover:text-purple-400 transition text-[13px] whitespace-nowrap bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                    Games
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[320px] gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800">
                      {gameItems.map((game, idx) => {
                        const Icon = game.icon;
                        return (
                          <li key={idx}>
                            <Link
                              href={game.href}
                              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                            >
                              <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 shrink-0">
                                <Icon size={18} />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                  {game.title}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                  {game.description}
                                </div>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    href="/videos"
                    className="px-3 py-2 font-semibold text-slate-600 hover:text-purple-600 dark:text-muted-foreground dark:hover:text-purple-400 transition text-[13px] whitespace-nowrap"
                  >
                    Free Content
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    href="/about"
                    className="px-3 py-2 font-semibold text-slate-600 hover:text-purple-600 dark:text-muted-foreground dark:hover:text-purple-400 transition text-[13px] whitespace-nowrap"
                  >
                    About
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center space-x-3 justify-end shrink-0">
          <div className="flex items-center justify-center h-9 w-9 border border-border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ThemeToggle />
          </div>

          {!isPending &&
            mounted &&
            (session ? (
              <div className="flex items-center gap-3">
                <Link
                  href={dashboardUrl}
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white bg-[#857938] rounded-md hover:bg-blue-700 transition shadow-sm"
                >
                  Go to Dashboard &rarr;
                </Link>

                <UserDropdown
                  email={session.user.email ?? ""}
                  image={session.user.image ?? ""}
                  name={session.user.name ?? "User"}
                  role={userRole}
                />
              </div>
            ) : (
              <div className="hidden sm:flex items-center">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "h-9 bg-[#857938] hover:bg-blue-700 px-6 text-[12px] text-white active:scale-95 transition-all rounded-md border-0",
                  )}
                >
                  Get Started
                </Link>
              </div>
            ))}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 focus:outline-none active:scale-90 transition-transform"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="px-4 py-4 space-y-4 border-t border-slate-100 dark:border-slate-800 md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-md overflow-hidden"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-9 rounded-xl border border-input bg-background pl-9 pr-4 text-sm outline-none"
              />
            </div>

            <div className="space-y-1">
              <Link
                href="/tutoring"
                className="block py-2 text-sm font-medium text-slate-700 hover:text-purple-600 dark:text-slate-200 dark:hover:text-purple-400 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Tutoring
              </Link>

              <Link
                href="/products"
                className="block py-2 text-sm font-medium text-slate-700 hover:text-purple-600 dark:text-slate-200 dark:hover:text-purple-400 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Products
              </Link>

              {/* Mobile Games Collapsible Accordion */}
              <div>
                <button
                  onClick={() => setMobileGamesOpen(!mobileGamesOpen)}
                  className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-700 hover:text-purple-600 dark:text-slate-200 dark:hover:text-purple-400 transition-colors"
                >
                  <span>Games</span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "transition-transform duration-200",
                      mobileGamesOpen && "rotate-180",
                    )}
                  />
                </button>
                {mobileGamesOpen && (
                  <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-1">
                    {gameItems.map((game, idx) => (
                      <Link
                        key={idx}
                        href={game.href}
                        className="block py-1.5 text-xs font-medium text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {game.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/videos"
                className="block py-2 text-sm font-medium text-slate-700 hover:text-purple-600 dark:text-slate-200 dark:hover:text-purple-400 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Free Content
              </Link>

              <Link
                href="/about"
                className="block py-2 text-sm font-medium text-slate-700 hover:text-purple-600 dark:text-slate-200 dark:hover:text-purple-400 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                About
              </Link>

              {session && (
                <Link
                  href={dashboardUrl}
                  className="block py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 transition-colors pt-2 border-t mt-2"
                  onClick={() => setMobileOpen(false)}
                >
                  Go to Dashboard &rarr;
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// "use client";

// import * as React from "react";
// import Link from "next/link";

// import { Menu, X, Search } from "lucide-react";
// import { ThemeToggle } from "@/app/_components/themeToggle";
// import { authClient } from "@/lib/auth-client";
// import { UserDropdown } from "./UserDropdown";
// import { buttonVariants } from "./ui/button";
// import { cn } from "@/lib/utils";
// import MyLogo from "./Logo";
// import { useEffect, useState } from "react";
// import { motion, AnimatePresence, Variants } from "framer-motion";

// import {
//   NavigationMenu,
//   NavigationMenuItem,
//   NavigationMenuList,
// } from "./ui/navigation-menu";

// const productItems = [
//   {
//     title: "Tutoring",
//     href: "/tutoring",
//   },
//   {
//     title: "Products",
//     href: "/products",
//   },
//   {
//     title: "Games",
//     href: "/games",
//   },
//   {
//     title: "Free Content",
//     href: "/videos",
//   },
//   {
//     title: "About",
//     href: "/about",
//   },
// ];

// interface UserProps {
//   id: string;
//   email: string;
//   name: string | null;
//   image: string | null;
//   role: string | null;
// }

// export function NavbarClient({}: { user: UserProps | null }) {
//   const { data: session, isPending } = authClient.useSession();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     const frame = requestAnimationFrame(() => {
//       setMounted(true);
//     });
//     return () => cancelAnimationFrame(frame);
//   }, []);

//   // 1. Determine user role(s) safely from session
//   const rolesList: string[] = [];
//   if (session?.user) {
//     const userObj = session.user as { role?: string; roles?: string[] };
//     if (userObj.role) rolesList.push(userObj.role);
//     if (Array.isArray(userObj.roles)) rolesList.push(...userObj.roles);
//   }

//   const normalizedRoles = rolesList.map((r) => r.toLowerCase());

//   // 2. Resolve destination path based on role hierarchy
//   const dashboardUrl = normalizedRoles.includes("admin")
//     ? "/admin"
//     : normalizedRoles.includes("educator") ||
//         normalizedRoles.includes("facilitator")
//       ? "/educator"
//       : "/learner";

//   const userRole = session?.user?.role?.toLowerCase() ?? "learner";

//   // Menu Animation Variants
//   const menuVariants: Variants = {
//     hidden: {
//       opacity: 0,
//       y: -15,
//       transition: { duration: 0.2, ease: "easeInOut" },
//     },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: 0.3, ease: "easeOut" },
//     },
//   };

//   return (
//     <header className="sticky top-0 z-50 w-full border-b border-slate-100 dark:border-slate-800/50 bg-background/80 backdrop-blur-md">
//       <div className="max-w-7xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between">
//         {/* Left Side: Logo only */}
//         <div className="shrink-0">
//           <MyLogo />
//         </div>

//         {/* Center: Navigation Links */}
//         <div className="hidden md:flex items-center justify-start gap-6 flex-1 pl-6">
//           <nav>
//             <NavigationMenu>
//               <NavigationMenuList className="gap-1">
//                 {productItems.map((item, index) => (
//                   <NavigationMenuItem key={index}>
//                     <Link
//                       href={item.href}
//                       className="px-3 py-2 font-semibold text-slate-600 hover:text-purple-600 dark:text-muted-foreground dark:hover:text-purple-400 transition text-[13px] whitespace-nowrap"
//                     >
//                       {item.title}
//                     </Link>
//                   </NavigationMenuItem>
//                 ))}
//               </NavigationMenuList>
//             </NavigationMenu>
//           </nav>
//         </div>

//         {/* Right Side: Actions (Theme, Dashboard CTA, User Dropdown / Sign-In) */}
//         <div className="flex items-center space-x-3 justify-end shrink-0">
//           <div className="flex items-center justify-center h-9 w-9 border border-border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
//             <ThemeToggle />
//           </div>

//           {!isPending &&
//             mounted &&
//             (session ? (
//               <div className="flex items-center gap-3">
//                 {/* Desktop Go to Dashboard CTA Button */}
//                 <Link
//                   href={dashboardUrl}
//                   className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white bg-[#857938] rounded-md hover:bg-blue-700 transition shadow-sm"
//                 >
//                   Go to Dashboard &rarr;
//                 </Link>

//                 <UserDropdown
//                   email={session.user.email ?? ""}
//                   image={session.user.image ?? ""}
//                   name={session.user.name ?? "User"}
//                   role={userRole}
//                 />
//               </div>
//             ) : (
//               <div className="hidden sm:flex items-center">
//                 <Link
//                   href="/login"
//                   className={cn(
//                     buttonVariants({ variant: "default", size: "sm" }),
//                     "h-9 bg-[#857938] hover:bg-blue-700 px-6 text-[12px] text-white active:scale-95 transition-all rounded-md border-0",
//                   )}
//                 >
//                   Get Started
//                 </Link>
//               </div>
//             ))}

//           <button
//             onClick={() => setMobileOpen(!mobileOpen)}
//             className="md:hidden p-2 text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 focus:outline-none active:scale-90 transition-transform"
//           >
//             {mobileOpen ? <X size={24} /> : <Menu size={24} />}
//           </button>
//         </div>
//       </div>

//       {/* Mobile Drawer Menu */}
//       <AnimatePresence>
//         {mobileOpen && (
//           <motion.div
//             variants={menuVariants}
//             initial="hidden"
//             animate="visible"
//             exit="hidden"
//             className="px-4 py-4 space-y-4 border-t border-slate-100 dark:border-slate-800 md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-md overflow-hidden"
//           >
//             {/* Mobile Search Bar inside menu */}
//             <div className="relative w-full">
//               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//               <input
//                 type="text"
//                 placeholder="Search..."
//                 className="w-full h-9 rounded-xl border border-input bg-background pl-9 pr-4 text-sm outline-none"
//               />
//             </div>

//             <div className="space-y-1">
//               {productItems.map((item, index) => (
//                 <Link
//                   key={index}
//                   href={item.href}
//                   className="block py-2 text-sm font-medium text-slate-700 hover:text-purple-600 dark:text-slate-200 dark:hover:text-purple-400 transition-colors"
//                   onClick={() => setMobileOpen(false)}
//                 >
//                   {item.title}
//                 </Link>
//               ))}

//               {/* Mobile version of Dashboard button */}
//               {session && (
//                 <Link
//                   href={dashboardUrl}
//                   className="block py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 transition-colors pt-2 border-t mt-2"
//                   onClick={() => setMobileOpen(false)}
//                 >
//                   Go to Dashboard &rarr;
//                 </Link>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </header>
//   );
// }

// "use client";

// import * as React from "react";
// import Link from "next/link";

// import { Menu, X, Search } from "lucide-react";
// import { ThemeToggle } from "@/app/_components/themeToggle";
// import { authClient } from "@/lib/auth-client";
// import { UserDropdown } from "./UserDropdown";
// import { buttonVariants } from "./ui/button";
// import { cn } from "@/lib/utils";
// import MyLogo from "./Logo";
// import { useEffect, useState } from "react";
// import { motion, AnimatePresence, Variants } from "framer-motion";

// import {
//   NavigationMenu,
//   NavigationMenuItem,
//   NavigationMenuList,
// } from "./ui/navigation-menu";

// const productItems = [
//   {
//     title: "Tutoring",
//     href: "/tutoring",
//   },
//   {
//     title: "Products",
//     href: "/products",
//   },
//   {
//     title: "Games",
//     href: "/games",
//   },
//   {
//     title: "Free Content",
//     href: "/games",
//   },
//   {
//     title: "About",
//     href: "/about",
//   },
// ];

// interface UserProps {
//   id: string;
//   email: string;
//   name: string | null;
//   image: string | null;
//   role: string | null;
// }

// export function NavbarClient({}: { user: UserProps | null }) {
//   const { data: session, isPending } = authClient.useSession();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [mounted, setMounted] = useState(false);

//   const userRole = session?.user?.role?.toLowerCase() ?? "Learner";

//   useEffect(() => {
//     const frame = requestAnimationFrame(() => {
//       setMounted(true);
//     });
//     return () => cancelAnimationFrame(frame);
//   }, []);

//   // Menu Animation Variants
//   const menuVariants: Variants = {
//     hidden: {
//       opacity: 0,
//       y: -15,
//       transition: { duration: 0.2, ease: "easeInOut" },
//     },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: 0.3, ease: "easeOut" },
//     },
//   };

//   return (
//     <header className="sticky top-0 z-50 w-full border-b border-slate-100 dark:border-slate-800/50 bg-background/80 backdrop-blur-md">
//       <div className="max-w-7xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between">
//         {/* Left Side: Logo only */}
//         <div className="shrink-0">
//           <MyLogo />
//         </div>

//         {/* Center: Navigation Links */}
//         <div className="hidden md:flex items-center justify-start gap-6 flex-1 pl-6">
//           <nav>
//             <NavigationMenu>
//               <NavigationMenuList className="gap-1">
//                 {productItems.map((item, index) => (
//                   <NavigationMenuItem key={index}>
//                     <Link
//                       href={item.href}
//                       className="px-3 py-2 font-semibold text-slate-600 hover:text-purple-600 dark:text-muted-foreground dark:hover:text-purple-400 transition text-[13px] whitespace-nowrap"
//                     >
//                       {item.title}
//                     </Link>
//                   </NavigationMenuItem>
//                 ))}
//               </NavigationMenuList>
//             </NavigationMenu>
//           </nav>
//         </div>

//         {/* Right Side: Actions (Theme, Dashboard CTA, User Dropdown / Sign-In) */}
//         <div className="flex items-center space-x-3 justify-end shrink-0">
//           <div className="flex items-center justify-center h-9 w-9 border border-border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
//             <ThemeToggle />
//           </div>

//           {!isPending &&
//             mounted &&
//             (session ? (
//               <div className="flex items-center gap-3">
//                 {/* Go to Dashboard CTA Button */}
//                 <Link
//                   href="/admin"
//                   className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white bg-[#857938] rounded-lg hover:bg-blue-700 transition shadow-sm"
//                 >
//                   Go to Dashboard &rarr;
//                 </Link>

//                 <UserDropdown
//                   email={session.user.email ?? ""}
//                   image={session.user.image ?? ""}
//                   name={session.user.name ?? "User"}
//                   role={userRole}
//                 />
//               </div>
//             ) : (
//               <div className="hidden sm:flex items-center">
//                 <Link
//                   href="/login"
//                   className={cn(
//                     buttonVariants({ variant: "default", size: "sm" }),
//                     "h-9 bg-[#857938] hover:bg-blue-700 px-6 text-[12px] text-white active:scale-95 transition-all rounded-md border-0",
//                   )}
//                 >
//                   Get Started
//                 </Link>
//               </div>
//             ))}

//           <button
//             onClick={() => setMobileOpen(!mobileOpen)}
//             className="md:hidden p-2 text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 focus:outline-none active:scale-90 transition-transform"
//           >
//             {mobileOpen ? <X size={24} /> : <Menu size={24} />}
//           </button>
//         </div>
//       </div>

//       {/* Mobile Drawer Menu */}
//       <AnimatePresence>
//         {mobileOpen && (
//           <motion.div
//             variants={menuVariants}
//             initial="hidden"
//             animate="visible"
//             exit="hidden"
//             className="px-4 py-4 space-y-4 border-t border-slate-100 dark:border-slate-800 md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-md overflow-hidden"
//           >
//             {/* Mobile Search Bar inside menu */}
//             <div className="relative w-full">
//               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//               <input
//                 type="text"
//                 placeholder="Search..."
//                 className="w-full h-9 rounded-xl border border-input bg-background pl-9 pr-4 text-sm outline-none"
//               />
//             </div>

//             <div className="space-y-1">
//               {productItems.map((item, index) => (
//                 <Link
//                   key={index}
//                   href={item.href}
//                   className="block py-2 text-sm font-medium text-slate-700 hover:text-purple-600 dark:text-slate-200 dark:hover:text-purple-400 transition-colors"
//                   onClick={() => setMobileOpen(false)}
//                 >
//                   {item.title}
//                 </Link>
//               ))}

//               {/* Mobile version of Dashboard button if logged in */}
//               {session && (
//                 <Link
//                   href="/dashboard"
//                   className="block py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 transition-colors pt-2 border-t mt-2"
//                   onClick={() => setMobileOpen(false)}
//                 >
//                   Go to Dashboard &rarr;
//                 </Link>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </header>
//   );
// }

// "use client";

// import * as React from "react";
// import Link from "next/link";

// import { Menu, X, LayoutDashboard, LogInIcon, Search } from "lucide-react";
// import clsx from "clsx";
// import { ThemeToggle } from "@/app/_components/themeToggle";
// import { authClient } from "@/lib/auth-client";
// import { UserDropdown } from "./UserDropdown";
// import { buttonVariants } from "./ui/button";
// import { cn } from "@/lib/utils";
// import MyLogo from "./Logo";
// import { useEffect, useState } from "react";
// import { motion, AnimatePresence, Variants } from "framer-motion";

// import {
//   NavigationMenu,
//   NavigationMenuItem,
//   NavigationMenuList,
// } from "./ui/navigation-menu";

// const productItems = [
//   {
//     title: "Tutoring",
//     href: "/tutoring",
//   },
//   {
//     title: "Products",
//     href: "/products",
//   },
//   {
//     title: "Games",
//     href: "/games",
//   },

//   {
//     title: "About",
//     href: "/about",
//   },
// ];

// interface UserProps {
//   id: string;
//   email: string;
//   name?: string;
//   image?: string;
//   role?: string;
// }

// export function NavbarClient({}: { user: UserProps | null }) {
//   const { data: session, isPending } = authClient.useSession();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [mounted, setMounted] = useState(false);

//   const userRole = session?.user?.role?.toLowerCase() ?? "unassigned";
//   // const navConfig = ROLE_NAV_CONFIG[userRole] ?? ROLE_NAV_CONFIG["unassigned"];

//   useEffect(() => {
//     const frame = requestAnimationFrame(() => {
//       setMounted(true);
//     });
//     return () => cancelAnimationFrame(frame);
//   }, []);

//   // Menu Animation Variants
//   const menuVariants: Variants = {
//     hidden: {
//       opacity: 0,
//       y: -15,
//       transition: { duration: 0.2, ease: "easeInOut" },
//     },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: 0.3, ease: "easeOut" },
//     },
//   };

//   return (
//     <header className="sticky top-0 z-50 w-full border-b border-slate-100 dark:border-slate-800/50 bg-background/80 backdrop-blur-md">
//       <div className="max-w-8xl mx-auto px-4 md:px-6 lg:px-16 flex min-h-16 items-center gap-4 justify-between relative">
//         {/* Left Side: Logo only */}
//         <div className="shrink-0">
//           <MyLogo />
//         </div>

//         {/* Center: Navigation Links followed by Desktop Search Bar */}
//         <div className="hidden md:flex items-center justify-center gap-6 flex-1">
//           <nav>
//             <NavigationMenu>
//               <NavigationMenuList className="gap-1">
//                 {productItems.map((item, index) => (
//                   <NavigationMenuItem key={index}>
//                     <Link
//                       href={item.href}
//                       className="px-3 py-2 font-semibold text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-400 transition text-sm whitespace-nowrap"
//                     >
//                       {item.title}
//                     </Link>
//                   </NavigationMenuItem>
//                 ))}
//               </NavigationMenuList>
//             </NavigationMenu>
//           </nav>
//         </div>

//         {/* Right Side: Actions (Theme, Sign-In, and Profile dropdown) */}
//         <div className="flex items-center space-x-3 justify-end shrink-0">
//           <div className="flex items-center justify-center h-9 w-9 border border-border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
//             <ThemeToggle />
//           </div>

//           {!isPending &&
//             mounted &&
//             (session ? (
//               <div className="flex items-center gap-3">
//                 {/* <Link
//                   href={navConfig.href}
//                   className={clsx(
//                     buttonVariants({ variant: "outline", size: "sm" }),
//                     "hidden sm:flex h-9 items-center gap-2 border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-900/50 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 active:scale-95 transition-all rounded-xl",
//                   )}
//                 >
//                   <LayoutDashboard className="h-4 w-4" />
//                   <span className="font-semibold">{navConfig.label}</span>
//                 </Link> */}

//                 <UserDropdown
//                   email={session.user.email ?? ""}
//                   image={session.user.image ?? ""}
//                   name={session.user.name ?? "User"}
//                   role={userRole}
//                 />
//               </div>
//             ) : (
//               <div className="hidden sm:flex items-center">
//                 <Link
//                   href="/login"
//                   className={cn(
//                     buttonVariants({ variant: "default", size: "sm" }),
//                     "h-9 bg-[#857938] hover:bg-[#857938]/90 px-6 text-white active:scale-95 transition-all rounded-md border-0",
//                   )}
//                 >
//                   <LogInIcon className="size-4 mr-2" />
//                   Sign In
//                 </Link>
//               </div>
//             ))}

//           <button
//             onClick={() => setMobileOpen(!mobileOpen)}
//             className="md:hidden p-2 text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 focus:outline-none active:scale-90 transition-transform"
//           >
//             {mobileOpen ? <X size={24} /> : <Menu size={24} />}
//           </button>
//         </div>
//       </div>

//       {/* Mobile Drawer Menu */}
//       <AnimatePresence>
//         {mobileOpen && (
//           <motion.div
//             variants={menuVariants}
//             initial="hidden"
//             animate="visible"
//             exit="hidden"
//             className="px-4 py-4 space-y-4 border-t border-slate-100 dark:border-slate-800 md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-md overflow-hidden"
//           >
//             {/* Mobile Search Bar inside menu */}
//             <div className="relative w-full">
//               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//               <input
//                 type="text"
//                 placeholder="Search..."
//                 className="w-full h-9 rounded-xl border border-input bg-background pl-9 pr-4 text-sm outline-none"
//               />
//             </div>

//             <div className="space-y-1">
//               {productItems.map((item, index) => (
//                 <Link
//                   key={index}
//                   href={item.href}
//                   className="block py-2 text-sm font-medium text-slate-700 hover:text-purple-600 dark:text-slate-200 dark:hover:text-purple-400 transition-colors"
//                   onClick={() => setMobileOpen(false)}
//                 >
//                   {item.title}
//                 </Link>
//               ))}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </header>
//   );
// }

// "use client";

// import * as React from "react";
// import Link from "next/link";

// import { Menu, X, LayoutDashboard, LogInIcon } from "lucide-react";
// import clsx from "clsx";
// import { ThemeToggle } from "@/app/_components/themeToggle";
// import { authClient } from "@/lib/auth-client";
// import { UserDropdown } from "./UserDropdown";
// import { buttonVariants } from "./ui/button";
// import { cn } from "@/lib/utils";
// import MyLogo from "./Logo";
// import { useEffect, useState } from "react";
// import { motion, AnimatePresence, Variants } from "framer-motion";
// import { ChevronDown } from "lucide-react";
// import { ROLE_NAV_CONFIG } from "@/lib/role-config";
// import {
//   NavigationMenu,
//   NavigationMenuItem,
//   NavigationMenuList,
// } from "./ui/navigation-menu";

// const productItems = [
//   {
//     title: "Programs",
//     children: [
//       {
//         title: "Mathematics",
//         href: "/programs/math",
//       },
//     ],
//   },
//   {
//     title: "Marketplace",
//     href: "/marketplace",
//   },
//   {
//     title: "Services",
//     href: "/aitutor",
//   },
//   {
//     title: "Resources",
//     href: "/aitutor",
//   },
//   {
//     title: "About",
//     href: "/aitutor",
//   },
// ];

// interface UserProps {
//   id: string;
//   email: string;
//   name?: string;
//   image?: string;
//   role?: string;
// }

// export function NavbarClient({}: { user: UserProps | null }) {
//   const { data: session, isPending } = authClient.useSession();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [mounted, setMounted] = useState(false);
//   const [programOpen, setProgramOpen] = useState(false);

//   const userRole = session?.user?.role?.toLowerCase() ?? "unassigned";
//   const navConfig = ROLE_NAV_CONFIG[userRole] ?? ROLE_NAV_CONFIG["unassigned"];

//   useEffect(() => {
//     const frame = requestAnimationFrame(() => {
//       setMounted(true);
//     });
//     return () => cancelAnimationFrame(frame);
//   }, []);

//   // Menu Animation Variants
//   const menuVariants: Variants = {
//     hidden: {
//       opacity: 0,
//       y: -15,
//       transition: { duration: 0.2, ease: "easeInOut" },
//     },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: 0.3, ease: "easeOut" },
//     },
//   };

//   const dropdownVariants: Variants = {
//     hidden: { opacity: 0, height: 0 },
//     visible: { opacity: 1, height: "auto", transition: { duration: 0.2 } },
//   };

//   return (
//     <header className="sticky top-0 z-50 w-full border-b border-slate-100 dark:border-slate-800/50 bg-background/80 backdrop-blur-md">
//       <div className="max-w-8xl mx-auto flex min-h-16 items-center px-4 md:px-8 lg:px-15 relative">
//         <MyLogo />

//         {/* Center Navigation */}
//         <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2">
//           <NavigationMenu>
//             <NavigationMenuList>
//               <NavigationMenuItem>
//                 <Link
//                   href="/onboarding"
//                   className="px-4 py-2 font-semibold text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-400 transition"
//                 >
//                   Session
//                 </Link>
//               </NavigationMenuItem>
//               <NavigationMenuItem>
//                 <Link
//                   href="/products"
//                   className="px-4 py-2 font-semibold text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-400 transition"
//                 >
//                   Digital Store
//                 </Link>
//               </NavigationMenuItem>
//               <NavigationMenuItem>
//                 <Link
//                   href="/about"
//                   className="px-4 py-2 font-semibold text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-400 transition"
//                 >
//                   About
//                 </Link>
//               </NavigationMenuItem>
//             </NavigationMenuList>
//           </NavigationMenu>
//         </nav>

//         {/* Right Side */}
//         <div className="ml-auto flex items-center space-x-4">
//           <div className="flex items-center justify-center h-9 w-9 border border-border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
//             <ThemeToggle />
//           </div>

//           {!isPending &&
//             mounted &&
//             (session ? (
//               <div className="flex items-center gap-3">
//                 <Link
//                   href={navConfig.href}
//                   className={clsx(
//                     buttonVariants({ variant: "outline", size: "sm" }),
//                     "hidden sm:flex h-9 items-center gap-2 border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-900/50 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 active:scale-95 transition-all rounded-xl",
//                   )}
//                 >
//                   <LayoutDashboard className="h-4 w-4" />
//                   <span className="font-semibold">{navConfig.label}</span>
//                 </Link>

//                 <UserDropdown
//                   email={session.user.email ?? ""}
//                   image={session.user.image ?? ""}
//                   name={session.user.name ?? "User"}
//                   role={userRole}
//                 />
//               </div>
//             ) : (
//               <div className="hidden sm:flex items-center space-x-2">
//                 <Link
//                   href="/login"
//                   className={cn(
//                     buttonVariants({ variant: "default", size: "sm" }),
//                     "h-9 bg-[#857938] from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 px-8 text-white active:scale-95 transition-all shadow-md shadow-purple-600/10 rounded-md border-0",
//                   )}
//                 >
//                   <LogInIcon className="size-4 mr-2" />
//                   Sign In
//                 </Link>
//               </div>
//             ))}

//           <button
//             onClick={() => setMobileOpen(!mobileOpen)}
//             className="md:hidden p-2 text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 focus:outline-none active:scale-90 transition-transform"
//           >
//             {mobileOpen ? <X size={24} /> : <Menu size={24} />}
//           </button>
//         </div>
//       </div>

//       {/* 2. WRAP MOBILE MENU IN ANIMATEPRESENCE FOR EXIT ANIMATIONS */}
//       <AnimatePresence>
//         {mobileOpen && (
//           <motion.div
//             variants={menuVariants}
//             initial="hidden"
//             animate="visible"
//             exit="hidden"
//             className="px-4 py-3 space-y-2 border-t border-slate-100 dark:border-slate-800 md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-md overflow-hidden"
//           >
//             {productItems.map((item, index) => {
//               if (item.children) {
//                 return (
//                   <div key={index} className="space-y-1">
//                     <button
//                       onClick={() => setProgramOpen(!programOpen)}
//                       className="w-full flex items-center justify-between py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
//                     >
//                       <span>{item.title}</span>
//                       <ChevronDown
//                         className={cn(
//                           "h-4 w-4 transition-transform duration-200 text-slate-500",
//                           programOpen && "rotate-180",
//                         )}
//                       />
//                     </button>

//                     {/* 3. OPTIONAL: ANIMATE THE INSIDE NESTED DROPDOWN TOO */}
//                     <AnimatePresence initial={false}>
//                       {programOpen && (
//                         <motion.div
//                           variants={dropdownVariants}
//                           initial="hidden"
//                           animate="visible"
//                           exit="hidden"
//                           className="pl-4 space-y-1 border-l-2 border-purple-100 dark:border-slate-800 ml-2 overflow-hidden"
//                         >
//                           {item.children.map((child, childIndex) => (
//                             <Link
//                               key={childIndex}
//                               href={child.href}
//                               className="block py-2 pl-2 text-sm text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
//                               onClick={() => setMobileOpen(false)}
//                             >
//                               {child.title}
//                             </Link>
//                           ))}
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </div>
//                 );
//               }

//               return (
//                 <Link
//                   key={index}
//                   href={item.href || "#"}
//                   className="block py-2 text-sm font-medium text-slate-700 hover:text-purple-600 dark:text-slate-200 dark:hover:text-purple-400 transition-colors"
//                   onClick={() => setMobileOpen(false)}
//                 >
//                   {item.title}
//                 </Link>
//               );
//             })}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </header>
//   );
// }
