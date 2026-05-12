import EducatorProfile from "@/app/_components/EducatorProfile";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = await prisma.user.findUnique({
    where: { email: session?.user.email },
  });

  return <EducatorProfile user={user} />;
}
