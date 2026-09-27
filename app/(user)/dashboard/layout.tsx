import { redirect } from "next/navigation";


import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SidebarInset, SidebarProvider } from "@/app/_components/ui/sidebar";
import { AppSidebar } from "@/app/_components/sidebar/dashboard-sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
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
      emailVerified: true,
      canLearn: true,
    },
  });

  if (!currentUser) {
    redirect("/auth?mode=signin");
  }

  const normalizedRole = String(currentUser.role ?? "")
    .trim()
    .toUpperCase();

  // Admin users belong in the admin workspace.
  if (normalizedRole === "ADMIN") {
    redirect("/admin");
  }

  // Only normal USER accounts can access the user dashboard.
  if (normalizedRole !== "USER") {
    return (
      <div className="min-h-screen bg-background p-10">
        <div className="mx-auto max-w-xl rounded-xl border bg-card p-8">
          <h1 className="text-2xl font-bold">Access denied</h1>

          <p className="mt-3 text-muted-foreground">
            Your account does not have access to the user dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}