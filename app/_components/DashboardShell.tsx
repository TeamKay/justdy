import type { ReactNode } from "react";


import {
  SidebarInset,
  SidebarProvider,
} from "@/app/_components/ui/sidebar";
import { AppSidebar } from "./sidebar/dashboard-sidebar";

export default function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="min-h-screen bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
