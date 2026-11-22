
"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/app/_components/ui/sidebar";
import { SiteHeader } from "./header-welcome";

export function DashboardHeader() {
  const pathname = usePathname();

  if (pathname === "/chat") return null;

  return (
    <>
      {/* Mobile header */}
     <header
        className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center border-b border-white/10 px-4 md:hidden"
        style={{ backgroundColor: "#3D416F" }}
      >
        <SidebarTrigger
          aria-label="Open navigation menu"
          title="Open navigation menu"
          className="flex size-9 items-center justify-center rounded-lg border border-white/20 bg-white text-[#3D416F] shadow-sm transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white"
        />
      </header>

      {/* Existing desktop header */}
      <div className="hidden md:block">
        <SiteHeader />
      </div>
    </>
  );
}
