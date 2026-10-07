import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import LiveHomeworkTeacherWorkspace from "@/app/_components/LiveHomeworkTeacherWorkspace";

export const dynamic = "force-dynamic";

export default async function AdminLiveHomeworkHelpPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth");
  }

  const role = String(session.user.role ?? "").toUpperCase();

  if (role !== "ADMIN") {
    redirect("/dashboard/live-help");
  }

  return (
    <main className="min-h-full bg-slate-50">
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-sm text-slate-500">
              Loading Live Homework Help…
            </div>
          </div>
        }
      >
        <LiveHomeworkTeacherWorkspace
          user={{
            id: session.user.id,
            name: session.user.name,
            role: session.user.role ?? null,
          }}
        />
      </Suspense>
    </main>
  );
}