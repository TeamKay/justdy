import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function requireAdminApi() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, emailVerified: true } });
  if (!user || String(user.role).trim().toUpperCase() !== "ADMIN" || !user.emailVerified) return null;
  return user;
}

export async function requireAdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/auth?mode=signin");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, emailVerified: true } });
  if (!user || String(user.role).trim().toUpperCase() !== "ADMIN") redirect("/dashboard");
  if (!user.emailVerified) redirect(`/verify-request?email=${encodeURIComponent(session.user.email ?? "")}`);
  return user;
}
