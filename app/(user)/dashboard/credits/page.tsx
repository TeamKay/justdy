import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import CreditsClient from "@/app/_components/CreditsClient";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={null}>
      <CreditsClient
        userName={session.user.name ?? ""}
      />
    </Suspense>
  );
}