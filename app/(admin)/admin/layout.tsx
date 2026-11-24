import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SidebarInset, SidebarProvider } from "@/app/_components/ui/sidebar";
import { AppSidebar } from "@/app/_components/sidebar/dashboard-sidebar";
import { SidebarReopenTrigger } from "@/app/_components/sidebar/SidebarReopenTrigger";

interface LayoutProps {
  children: ReactNode;
}

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps) {
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

  const normalizedRole = String(currentUser.role ?? "")
    .trim()
    .toUpperCase();

  console.log("[ADMIN LAYOUT]", {
    userId: currentUser.id,
    roleFromDatabase: currentUser.role,
    normalizedRole,
    emailVerified: currentUser.emailVerified,
  });

  if (normalizedRole !== "ADMIN") {
    return (
      <div className="min-h-screen bg-background p-10">
        <div className="mx-auto max-w-xl rounded-xl border bg-card p-8">
          <h1 className="text-2xl font-bold">Access denied</h1>

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
    <SidebarProvider
      defaultOpen={true}
      className="
        flex h-dvh min-h-0 w-full
        overflow-hidden
        bg-[#F7FAF6] text-[#20372A]
      "
    >
      <AppSidebar />

      <SidebarInset
        className="
          relative flex h-dvh min-h-0 min-w-0
          flex-1 flex-col overflow-hidden
          bg-[#376421]
          shadow-none
        "
      >
        <SidebarReopenTrigger />

        <main
          className="
            min-h-0 min-w-0 flex-1
            overflow-x-hidden overflow-y-auto
            overscroll-y-contain
            scroll-smooth
            bg-[#F8FAF7]
          "
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
