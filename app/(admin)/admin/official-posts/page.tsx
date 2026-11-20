import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import AdminOfficialPostStudio from "@/app/_components/admin/AdminOfficialPostStudio";

export const metadata = {
  title: "Official Posts | Justdy",
  description: "Publish official Justdy announcements and mathematics challenges.",
};

export default async function AdminOfficialPostsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (String(session.user.role ?? "").toUpperCase() !== "ADMIN") {
    redirect("/");
  }

  return <AdminOfficialPostStudio />;
}
