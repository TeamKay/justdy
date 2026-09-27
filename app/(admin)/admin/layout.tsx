import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

import {
  SidebarInset,
  SidebarProvider,
} from "@/app/_components/ui/sidebar";

import { AppSidebar } from "@/app/_components/sidebar/dashboard-sidebar";

interface LayoutProps {
  children: ReactNode;
}

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: LayoutProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth?mode=signin");
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
      status: true,
      emailVerified: true,
    },
  });

  if (!currentUser) {
    redirect("/auth?mode=signin");
  }

  /*
   * Normalize the database role.
   *
   * This supports values such as:
   *   ADMIN
   *   Admin
   *   admin
   */
  const normalizedRole = String(currentUser.role ?? "")
    .trim()
    .toUpperCase();

  console.log("[ADMIN LAYOUT]", {
    userId: currentUser.id,
    roleFromDatabase: currentUser.role,
    normalizedRole,
    emailVerified: currentUser.emailVerified,
  });

  /*
   * Only ADMIN accounts can access /admin.
   *
   * We intentionally do NOT redirect non-admin users to
   * /dashboard because that can create a redirect loop.
   */
  if (normalizedRole !== "ADMIN") {
    return (
      <div className="min-h-screen bg-background p-10">
        <div className="mx-auto max-w-xl rounded-xl border bg-card p-8">
          <h1 className="text-2xl font-bold">
            Access denied
          </h1>

          <p className="mt-3 text-muted-foreground">
            Your account does not have administrator access.
          </p>

          <p className="mt-4 text-sm text-muted-foreground">
            Current role:{" "}
            <span className="font-medium">
              {String(currentUser.role ?? "Unknown")}
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser.emailVerified) {
    redirect("/verify-email-notice");
  }

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

