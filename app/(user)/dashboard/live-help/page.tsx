import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { CAPABILITIES, hasCapability } from "@/lib/auth/capabilities";
import LiveHomeworkHelpWorkspace from "@/app/_components/LiveHomeworkHelpWorkspace";
import LiveHomeworkTeacherWorkspace from "@/app/_components/LiveHomeworkTeacherWorkspace";

export const dynamic = "force-dynamic";

export default async function LiveHomeworkHelpPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth");
  }

  const role = session.user.role ?? null;

  const canUseTeacherWorkspace =
    role === "ADMIN" ||
    (role !== "ADMIN" &&
      (await hasCapability(
        session.user.id,
        CAPABILITIES.TEACH,
      )));

  return (
    <main className="min-h-full bg-slate-50">
      <Suspense fallback={null}>
        {canUseTeacherWorkspace ? (
          <LiveHomeworkTeacherWorkspace
            user={{
              id: session.user.id,
              name: session.user.name,
              role,
            }}
          />
        ) : (
          <LiveHomeworkHelpWorkspace
            user={{
              id: session.user.id,
              name: session.user.name,
              role,
            }}
          />
        )}
      </Suspense>
    </main>
  );
}