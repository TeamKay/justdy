import { redirect } from "next/navigation";

import ArtifactLibrary from "@/app/_components/ai/ArtifactLibrary";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-7 lg:px-0 lg:py-10">
        <ArtifactLibrary />
      </div>
    </main>
  );
}
