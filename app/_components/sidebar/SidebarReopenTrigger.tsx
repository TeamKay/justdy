
"use client";

import { SidebarTrigger, useSidebar } from "@/app/_components/ui/sidebar";

export function SidebarReopenTrigger() {
  const { open, openMobile, isMobile } = useSidebar();

  // Check the correct sidebar state depending on the device.
  const sidebarIsOpen = isMobile ? openMobile : open;

  // Hide the floating trigger only when the
  // sidebar is actually visible.
  if (sidebarIsOpen) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-3 top-3 z-[60]">
      <SidebarTrigger
        className="
          pointer-events-auto
          size-9
          rounded-xl
          border
          border-border
          bg-background
          text-muted-foreground
          shadow-md
          transition-colors
          hover:bg-muted
          hover:text-foreground
          focus-visible:ring-2
          focus-visible:ring-ring/40
        "
        aria-label="Open sidebar"
        title="Open sidebar"
      />
    </div>
  );
}
