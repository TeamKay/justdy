import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SettingsClient from "@/app/_components/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth?mode=signin");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
    },
  });

  if (!user) {
    redirect("/auth?mode=signin");
  }

  return (
    <SettingsClient
      user={{
        name: user.name ?? "Justdy User",
        email: user.email,
        image: user.imageUrl ?? "",
      }}
    />
  );
}
