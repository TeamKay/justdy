import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { SidebarInset, SidebarProvider } from "@/app/_components/ui/sidebar";
import { SidebarReopenTrigger } from "@/app/_components/sidebar/SidebarReopenTrigger";
import { AppSidebar } from "@/app/_components/sidebar/dashboard-sidebar";

export const metadata: Metadata = {
  title: "Justdy | Dashboard",
  description: "Your Justdy learning and teaching workspace.",
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth?mode=signin");
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      className="flex h-dvh min-h-0 bg-background text-foreground"
    >
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>

      <SidebarInset className="relative flex min-h-0 flex-1 flex-col bg-background text-foreground">
        <SidebarReopenTrigger />
        <main className="min-h-0 flex-1 bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
