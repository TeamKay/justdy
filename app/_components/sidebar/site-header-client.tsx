"use client";

import { Menu } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { useSidebar } from "@/app/_components/ui/sidebar";

export function SiteHeaderClient({ children }: { children: React.ReactNode }) {
  const { toggleSidebar } = useSidebar();

  return (
    <header
      className="
        sticky top-0 z-40
        flex items-center gap-4
        backdrop-blur-xl
        bg-white/10 dark:bg-emerald-950
        border border-emerald-950
        px-4 lg:px-6
      "
      style={{ height: "var(--header-height)" }}
    >
      {/* Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="hover:bg-white/20 shrink-0"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Welcome content (fills space) */}
      <div className="flex-1">{children}</div>
    </header>
  );
}
