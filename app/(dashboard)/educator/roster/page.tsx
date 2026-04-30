import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function EducatorRosterPage() {
  // const enrollmentData = await educatorGetStats();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 1. Check Auth & Role FIRST
  if (!session?.user) redirect("/login");

  if (session.user.role !== "Educator") {
    redirect("/onboarding");
  }

  if (session.user?.verificationStatus !== "Verified") {
    redirect("/educator/verification");
  }

  return (
    <div className=" max-w-6xl mx-auto items-center justify-center">
      {/* --- CONTENT BELOW --- */}
      <div className="mt-6">mmmmmmm</div>
    </div>
  );
}
