import { getCurrentUser } from "@/app/actions/onboarding";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (user?.role) {
    if (user.role === "Student") redirect("/educators");
    if (user.role === "Educator") {
      return user.verificationStatus === "Verified"
        ? redirect("/educator")
        : redirect("/educator/verification");
    }
    if (user.role === "Admin") redirect("/admin");
  }

  return (
    <div className="container mx-auto px-4 py-0">
      <div className="max-w-3xl mx-auto">{children}</div>
    </div>
  );
}
