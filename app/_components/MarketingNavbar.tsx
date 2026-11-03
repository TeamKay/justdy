"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Inter } from "next/font/google";
import { authClient } from "@/lib/auth-client";
import { UserDropdown } from "./UserDropdown";
import LogoImg from "@/public/images/logo.png";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const tutoringItems = [{ label: "Start Learning", href: "/tutoring" }];

const resourceItems = [
  { label: "Free resources", href: "/" },
  { label: "Shop now", href: "/" },
  { label: "Video lessons", href: "/videos" },
  { label: "Games & puzzles", href: "/games" },
  { label: "Create with AI", href: "/" },
];

const aboutItems = [
  { label: "View Tutors", href: "/tutors" },
  { label: "Our Results", href: "/" },
  { label: "Our Mission", href: "/" },
  { label: "Refund Policy ", href: "/" }
];

const menuItems = [
  { label: "Tutoring", items: tutoringItems },
  { label: "Resources", items: resourceItems },
  { label: "About Us", items: aboutItems },
];

export default function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isFloating, setIsFloating] = useState(false);

  const {
    data: session,
    isPending: sessionPending,
    refetch: refetchSession,
  } = authClient.useSession();

  useEffect(() => {
    const handleScroll = () => setIsFloating(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleAuthStateChanged = () => void refetchSession();
    window.addEventListener("justdy:auth-state-changed", handleAuthStateChanged);
    return () =>
      window.removeEventListener("justdy:auth-state-changed", handleAuthStateChanged);
  }, [refetchSession]);

  const closeMenus = () => {
    setOpenMenu(null);
    setMobileOpen(false);
  };

  const user = session?.user;
  const userName =
    typeof user?.name === "string" && user.name.trim() ? user.name.trim() : "User";
  const userEmail = typeof user?.email === "string" ? user.email : "";
  const userImage = typeof user?.image === "string" ? user.image : "";
  const userRole =
    typeof (user as { role?: unknown } | null | undefined)?.role === "string"
      ? ((user as { role?: string }).role ?? "")
      : "";
  const isAdmin = userRole.trim().toUpperCase() === "ADMIN";
  const dashboardHref = isAdmin ? "/admin" : "/dashboard";
  const dashboardLabel = isAdmin ? "Admin dashboard" : "Go to dashboard";
  const showAuthenticatedUI = !sessionPending && !!user;
  const showUnauthenticatedUI = !sessionPending && !user;

  return (
    <>
      <header
        className={`${inter.className} fixed top-0 z-1000 isolate w-full text-[#173B2F] transition-all duration-200 ${
          isFloating
            ? "left-1/2 mt-2 w-full max-w-230 -translate-x-1/2 rounded-lg border border-[#173B2F]/10 shadow-[0_8px_28px_rgba(25,45,32,0.14)] sm:w-[calc(100%-0rem)]"
            : "inset-x-0"
        }`}
        style={{
          backgroundColor: "#FFFFFF",
         
          backgroundSize: "18px 18px",
          backgroundPosition: "0 0",
        }}
      >
        
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-3">
          <Link
             href="/"
             className="group inline-flex flex-row items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#173B2F]/90 transition hover:bg-[#173B2F]/6 hover:text-[#0B2D22]"
             onClick={closeMenus}
           >
             <Image
               src={LogoImg}
               alt="Justdy logo"
               width={34}
               height={34}
               priority
               className="h-6 w-6 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
             />

             <span className="text-[20px] font-bold tracking-[-0.04em] text-[#173B2F] transition-colors duration-200">
               Justdy
             </span>
           </Link>

          <nav
            className="hidden h-full items-center justify-center lg:flex"
            aria-label="Main navigation"
          >
            <Link href="/" className="inline-flex h-14 items-center gap-1.5 whitespace-nowrap px-4 text-[15px] font-semibold text-[#173B2F]/90 transition-colors hover:bg-[#173B2F]/6 hover:text-[#56852F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55]" onClick={closeMenus}>
              Home
            </Link>

            {menuItems.map((menu) => (
              <div
                key={menu.label}
                className="relative flex h-full items-center"
                onMouseEnter={() => setOpenMenu(menu.label)}
                onMouseLeave={() =>
                  setOpenMenu((current) => (current === menu.label ? null : current))
                }
              >
                <button
                  type="button"
                  className="inline-flex h-14 items-center gap-1.5 whitespace-nowrap px-4 text-[15px] font-semibold text-[#173B2F]/90 transition-colors hover:text-[#56852F] hover:bg-[#173B2F]/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55]"
                  aria-expanded={openMenu === menu.label}
                  aria-haspopup="true"
                  onClick={() =>
                    setOpenMenu(openMenu === menu.label ? null : menu.label)
                  }
                  onFocus={() => setOpenMenu(menu.label)}
                >
                  {menu.label}
                  <ChevronDown
                    className={`h-3.25 w-3.25 transition-transform ${
                      openMenu === menu.label ? "rotate-180" : ""
                    }`}
                    strokeWidth={2}
                  />
                </button>

                {openMenu === menu.label && (
                  <div className="absolute left-0 top-full z-1100 w-50 border border-white/15 bg-white py-1 text-black shadow-[0_8px_22px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                    {menu.items.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={closeMenus}
                        className="flex min-h-9 items-center justify-between px-5 py-2.25 text-[14px] font-normal text-black transition-colors hover:bg-[#FAD6AC] hover:text-black focus-visible:bg-white/10 focus-visible:outline-none"
                      >
                        {item.label}
                        {menu.label === "Math Tutoring" && (
                          <span
                            aria-hidden="true"
                            className="ml-3 text-[17px] leading-none text-white"
                          >
                            ›
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right-side actions: fill the navbar height and vertically center the controls. */}
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            {sessionPending ? (
              <div
                className="h-10 w-28 animate-pulse rounded-lg bg-[#f58750]"
                aria-hidden="true"
              />
            ) : showAuthenticatedUI ? (
              <>
                <Link
                  href={dashboardHref}
                  className="whitespace-nowrap rounded-lg px-3 py-2 text-[14px] bg-[#f58750] font-semibold text-white/90 transition-colors hover:bg-[#c38c70] hover:text-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55]"
                >
                  {dashboardLabel}
                </Link>
                <UserDropdown
                  email={userEmail}
                  image={userImage}
                  name={userName}
                  role={userRole}
                />
              </>
            ) : showUnauthenticatedUI ? (
              <Link
                href="/auth?mode=signin"
                className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg bg-[#f58750] px-7 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#c38c70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55]"
              >
                Sign in
              </Link>
            ) : null}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {showAuthenticatedUI && (
              <UserDropdown
                email={userEmail}
                image={userImage}
                name={userName}
                role={userRole}
              />
            )}
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-[5px] border border-white/20 text-black hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55]"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 bg-[#09dc5d77] px-4 pb-5 pt-2 text-white shadow-xl backdrop-blur-xl lg:hidden">
            
            {menuItems.map((menu) => (
              <div key={menu.label} className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() =>
                    setOpenMenu(openMenu === menu.label ? null : menu.label)
                  }
                  className="flex w-full items-center justify-between rounded px-3 py-3 text-left text-sm font-semibold text-amber-950 hover:bg-white/10"
                  aria-expanded={openMenu === menu.label}
                >
                  {menu.label}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      openMenu === menu.label ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openMenu === menu.label && (
                  <div className="mb-2 rounded-md border bg-[#43ea91] border-white/10 py-1">
                    {menu.items.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={closeMenus}
                        className="block px-5 py-2.5 text-sm text-black hover:bg-white/10"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
           
            <div className="mt-3 border-t border-white/10 pt-4">
              {sessionPending ? (
                <div
                  className="h-11 w-full animate-pulse rounded-lg bg-white/20"
                  aria-hidden="true"
                />
              ) : showAuthenticatedUI ? (
                <Link
                  href={dashboardHref}
                  onClick={closeMenus}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#3a3a08] px-5 text-sm font-semibold text-[#073f2d] transition-colors hover:bg-lime-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55] focus-visible:ring-offset-2"
                >
                  {dashboardLabel}
                </Link>
              ) : showUnauthenticatedUI ? (
                <Link
                  href="/auth?mode=signin"
                  onClick={closeMenus}
                 className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#f58750] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#c38c70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55]"
                >
                  Sign in
                  <span className="ml-2" aria-hidden="true">→</span>
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </header>
      <div aria-hidden="true" className="h-14.5" />
    </>
  );
}




// "use client";

// import Link from "next/link";
// import { useEffect, useState } from "react";
// import { ChevronDown, Menu, X } from "lucide-react";
// import { Inter } from "next/font/google";
// import { authClient } from "@/lib/auth-client";
// import { UserDropdown } from "./UserDropdown";
// import LogoImg from "@/public/images/logo.png";
// import Image from "next/image";

// const inter = Inter({ subsets: ["latin"], display: "swap" });
// const tutoringItems = [{ label: "Start Learning", href: "/tutoring" }];

// const resourceItems = [
//   { label: "Free resources", href: "/" },
//   { label: "Shop now", href: "/" },
//   { label: "Video lessons", href: "/videos" },
//   { label: "Games & puzzles", href: "/" },
//   { label: "Create with AI", href: "/" },
// ];

// const aboutItems = [
//   { label: "Our Tutors", href: "/" },
//   { label: "Our Results", href: "/" },
//   { label: "Our Mission", href: "/" },
//   { label: "Refund Policy ", href: "/" }
// ];

// const menuItems = [
//   { label: "Tutoring", items: tutoringItems },
//   { label: "Resources", items: resourceItems },
//   { label: "About Us", items: aboutItems },
// ];

// export default function MarketingNavbar() {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [openMenu, setOpenMenu] = useState<string | null>(null);
//   const [isFloating, setIsFloating] = useState(false);

//   const {
//     data: session,
//     isPending: sessionPending,
//     refetch: refetchSession,
//   } = authClient.useSession();

//   useEffect(() => {
//     const handleScroll = () => setIsFloating(window.scrollY > 24);
//     handleScroll();
//     window.addEventListener("scroll", handleScroll, { passive: true });
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   useEffect(() => {
//     const handleAuthStateChanged = () => void refetchSession();
//     window.addEventListener("justdy:auth-state-changed", handleAuthStateChanged);
//     return () =>
//       window.removeEventListener("justdy:auth-state-changed", handleAuthStateChanged);
//   }, [refetchSession]);

//   const closeMenus = () => {
//     setOpenMenu(null);
//     setMobileOpen(false);
//   };

//   const user = session?.user;
//   const userName =
//     typeof user?.name === "string" && user.name.trim() ? user.name.trim() : "User";
//   const userEmail = typeof user?.email === "string" ? user.email : "";
//   const userImage = typeof user?.image === "string" ? user.image : "";
//   const userRole =
//     typeof (user as { role?: unknown } | null | undefined)?.role === "string"
//       ? ((user as { role?: string }).role ?? "")
//       : "";
//   const isAdmin = userRole.trim().toUpperCase() === "ADMIN";
//   const dashboardHref = isAdmin ? "/admin" : "/dashboard";
//   const dashboardLabel = isAdmin ? "Admin dashboard" : "Go to dashboard";
//   const showAuthenticatedUI = !sessionPending && !!user;
//   const showUnauthenticatedUI = !sessionPending && !user;

//   return (
//     <>
//       <header
//         className={`${inter.className} fixed top-0 z-1000 isolate w-full text-[#173B2F] transition-all duration-200 ${
//           isFloating
//             ? "left-1/2 mt-2 w-full max-w-230 -translate-x-1/2 rounded-lg border border-[#173B2F]/10 shadow-[0_8px_28px_rgba(25,45,32,0.14)] sm:w-[calc(100%-0rem)]"
//             : "inset-x-0"
//         }`}
//         style={{
//           backgroundColor: "#FFFFFF",
         
//           backgroundSize: "18px 18px",
//           backgroundPosition: "0 0",
//         }}
//       >
        
//         <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-3">
//           <Link
//              href="/"
//              className="group inline-flex flex-row items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#173B2F]/90 transition hover:bg-[#173B2F]/6 hover:text-[#0B2D22]"
//              onClick={closeMenus}
//            >
//              <Image
//                src={LogoImg}
//                alt="Justdy logo"
//                width={34}
//                height={34}
//                priority
//                className="h-6 w-6 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
//              />

//              <span className="text-[20px] font-bold tracking-[-0.04em] text-[#173B2F] transition-colors duration-200">
//                Justdy
//              </span>
//            </Link>

//           <nav
//             className="hidden h-full items-center justify-center lg:flex"
//             aria-label="Main navigation"
//           >
//             <Link href="/" className="inline-flex h-14 items-center gap-1.5 whitespace-nowrap px-4 text-[15px] font-semibold text-[#173B2F]/90 transition-colors hover:bg-[#173B2F]/6 hover:text-[#56852F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55]" onClick={closeMenus}>
//               Home
//             </Link>

//             {menuItems.map((menu) => (
//               <div
//                 key={menu.label}
//                 className="relative flex h-full items-center"
//                 onMouseEnter={() => setOpenMenu(menu.label)}
//                 onMouseLeave={() =>
//                   setOpenMenu((current) => (current === menu.label ? null : current))
//                 }
//               >
//                 <button
//                   type="button"
//                   className="inline-flex h-14 items-center gap-1.5 whitespace-nowrap px-4 text-[15px] font-semibold text-[#173B2F]/90 transition-colors hover:text-[#56852F] hover:bg-[#173B2F]/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55]"
//                   aria-expanded={openMenu === menu.label}
//                   aria-haspopup="true"
//                   onClick={() =>
//                     setOpenMenu(openMenu === menu.label ? null : menu.label)
//                   }
//                   onFocus={() => setOpenMenu(menu.label)}
//                 >
//                   {menu.label}
//                   <ChevronDown
//                     className={`h-3.25 w-3.25 transition-transform ${
//                       openMenu === menu.label ? "rotate-180" : ""
//                     }`}
//                     strokeWidth={2}
//                   />
//                 </button>

//                 {openMenu === menu.label && (
//                   <div className="absolute left-0 top-full z-1100 w-50 border border-white/15 bg-white py-1 text-black shadow-[0_8px_22px_rgba(0,0,0,0.28)] backdrop-blur-xl">
//                     {menu.items.map((item) => (
//                       <Link
//                         key={item.label}
//                         href={item.href}
//                         onClick={closeMenus}
//                         className="flex min-h-9 items-center justify-between px-5 py-2.25 text-[14px] font-normal text-black transition-colors hover:bg-[#FAD6AC] hover:text-black focus-visible:bg-white/10 focus-visible:outline-none"
//                       >
//                         {item.label}
//                         {menu.label === "Math Tutoring" && (
//                           <span
//                             aria-hidden="true"
//                             className="ml-3 text-[17px] leading-none text-white"
//                           >
//                             ›
//                           </span>
//                         )}
//                       </Link>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </nav>

//           {/* Right-side actions: fill the navbar height and vertically center the controls. */}
//           <div className="hidden shrink-0 items-center gap-3 lg:flex">
//             {sessionPending ? (
//               <div
//                 className="h-10 w-28 animate-pulse rounded-lg bg-[#f58750]"
//                 aria-hidden="true"
//               />
//             ) : showAuthenticatedUI ? (
//               <>
//                 <Link
//                   href={dashboardHref}
//                   className="whitespace-nowrap rounded-lg px-3 py-2 text-[14px] bg-[#f58750] font-semibold text-white/90 transition-colors hover:bg-[#c38c70] hover:text-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55]"
//                 >
//                   {dashboardLabel}
//                 </Link>
//                 <UserDropdown
//                   email={userEmail}
//                   image={userImage}
//                   name={userName}
//                   role={userRole}
//                 />
//               </>
//             ) : showUnauthenticatedUI ? (
//               <Link
//                 href="/auth?mode=signin"
//                 className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg bg-[#f58750] px-7 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#c38c70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55]"
//               >
//                 Sign in
//               </Link>
//             ) : null}
//           </div>

//           <div className="flex items-center gap-2 lg:hidden">
//             {showAuthenticatedUI && (
//               <UserDropdown
//                 email={userEmail}
//                 image={userImage}
//                 name={userName}
//                 role={userRole}
//               />
//             )}
//             <button
//               type="button"
//               aria-label={mobileOpen ? "Close menu" : "Open menu"}
//               aria-expanded={mobileOpen}
//               onClick={() => setMobileOpen((open) => !open)}
//               className="flex h-10 w-10 items-center justify-center rounded-[5px] border border-white/20 text-black hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55]"
//             >
//               {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//             </button>
//           </div>
//         </div>

//         {mobileOpen && (
//           <div className="border-t border-white/10 bg-[#09dc5d77] px-4 pb-5 pt-2 text-white shadow-xl backdrop-blur-xl lg:hidden">
            
//             {menuItems.map((menu) => (
//               <div key={menu.label} className="border-b border-white/10">
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setOpenMenu(openMenu === menu.label ? null : menu.label)
//                   }
//                   className="flex w-full items-center justify-between rounded px-3 py-3 text-left text-sm font-semibold text-amber-950 hover:bg-white/10"
//                   aria-expanded={openMenu === menu.label}
//                 >
//                   {menu.label}
//                   <ChevronDown
//                     className={`h-4 w-4 transition-transform ${
//                       openMenu === menu.label ? "rotate-180" : ""
//                     }`}
//                   />
//                 </button>
//                 {openMenu === menu.label && (
//                   <div className="mb-2 rounded-md border bg-[#43ea91] border-white/10 py-1">
//                     {menu.items.map((item) => (
//                       <Link
//                         key={item.label}
//                         href={item.href}
//                         onClick={closeMenus}
//                         className="block px-5 py-2.5 text-sm text-black hover:bg-white/10"
//                       >
//                         {item.label}
//                       </Link>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ))}
           
//             <div className="mt-3 border-t border-white/10 pt-4">
//               {sessionPending ? (
//                 <div
//                   className="h-11 w-full animate-pulse rounded-lg bg-white/20"
//                   aria-hidden="true"
//                 />
//               ) : showAuthenticatedUI ? (
//                 <Link
//                   href={dashboardHref}
//                   onClick={closeMenus}
//                   className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#3a3a08] px-5 text-sm font-semibold text-[#073f2d] transition-colors hover:bg-lime-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55] focus-visible:ring-offset-2"
//                 >
//                   {dashboardLabel}
//                 </Link>
//               ) : showUnauthenticatedUI ? (
//                 <Link
//                   href="/auth?mode=signin"
//                   onClick={closeMenus}
//                  className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#f58750] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#c38c70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AAE55]"
//                 >
//                   Sign in
//                   <span className="ml-2" aria-hidden="true">→</span>
//                 </Link>
//               ) : null}
//             </div>
//           </div>
//         )}
//       </header>
//       <div aria-hidden="true" className="h-14.5" />
//     </>
//   );
// }

