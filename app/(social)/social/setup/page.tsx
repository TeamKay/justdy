import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SocialProfileSetupForm from "./SocialProfileSetupForm";

export const metadata = {
  title: "Create your learning profile | Justdy",
  description: "Set up your social learning profile on Justdy.",
};

export default async function SocialProfileSetupPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth?mode=signin");
  }

  const existingProfile = await prisma.socialProfile.findUnique({
    where: { userId: session.user.id },
    select: { username: true },
  });

  if (existingProfile) {
    redirect("/home");
  }

  return (
    <SocialProfileSetupForm
      initialDisplayName={session.user.name || ""}
    />
  );
}