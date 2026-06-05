import EducatorProfile from "@/app/_components/EducatorProfile";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { ComponentProps } from "react";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 1. Handle missing session or missing email safely
  if (!session?.user?.email) return <div>Not authenticated</div>;

  // 2. Fetch the user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return <div>User not found</div>;

  // 3. Cast the data directly to the component's expected prop type
  type EducatorProfileProps = ComponentProps<typeof EducatorProfile>["user"];

  return <EducatorProfile user={user as EducatorProfileProps} />;
}
