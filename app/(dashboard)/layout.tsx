// app/dashboard/layout.tsx
import { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { SidebarInset, SidebarProvider } from "@/app/_components/ui/sidebar";
import { AppSidebar } from "../_components/sidebar/dashboard-sidebar";
import { SiteHeader } from "../_components/sidebar/header-welcome";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 1. Get session on the server
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // 2. Fetch user's roles & permissions using `include`
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      facilitatorProfile: true,
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // 3. Extract roles safely
  const extractedRoles: string[] = [];

  if (user.role) {
    extractedRoles.push(user.role);
  }

  if (user.facilitatorProfile) {
    extractedRoles.push("educator");
  }

  user.roles?.forEach((ur) => {
    if (ur.role?.name) {
      extractedRoles.push(ur.role.name);
    }
  });

  const userRoles = Array.from(
    new Set(extractedRoles.map((r) => r.toLowerCase())),
  );

  const permissions = Array.from(
    new Set(
      (user.roles ?? []).flatMap((ur) =>
        (ur.role?.permissions ?? []).map((rp) => rp.permission.name),
      ),
    ),
  );

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        userRoles={userRoles}
        permissions={permissions}
      />
      <SidebarInset className="bg-[#0c0c0e] text-zinc-100 flex flex-col h-screen overflow-hidden">
        {/* Fixed Site Header */}
        <SiteHeader userName={user.name ?? undefined} />

        {/* Main Full-Bleed Container */}
        <main className="flex-1 flex flex-col overflow-y-auto w-full h-full">
          <div className="flex-1 flex flex-col w-full h-full p-0 sm:p-0">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
