
import type { Metadata } from "next";
import { Suspense } from "react";

import {
  SidebarInset,
  SidebarProvider,
} from "@/app/_components/ui/sidebar";

import { AppSidebar } from "../_components/sidebar/dashboard-sidebar";
import { DashboardHeader } from "../_components/sidebar/dashboard-header";

export const metadata: Metadata = {
  title: "Dashboard | Justdy",
  description:
    "Manage your Justdy learning, courses, students, and educational activities.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      defaultOpen={true}
      className="min-h-svh w-full bg-[#eef0f5]"
    >
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>

      <SidebarInset className="min-h-svh min-w-0 bg-[#eef0f5]">
        <DashboardHeader />

        <main className="min-h-0 flex-1 bg-[#eef0f5]">
          <div className="mx-auto min-h-full w-full max-w-[1600px] px-0 py-0">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
