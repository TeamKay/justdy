import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import AdminWhiteboardStudio from "@/app/_components/admin/AdminWhiteboardStudio";

export const metadata = {
  title: "Whiteboard Studio | Justdy",
  description: "Open your private Justdy whiteboard workspace.",
};

export default async function AdminWhiteboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (String(session.user.role ?? "").toUpperCase() !== "ADMIN") {
    redirect("/");
  }

  return <AdminWhiteboardStudio />;
}
