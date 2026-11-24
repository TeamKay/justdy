import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function requireAdminApi() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  const role = String(session.user.role ?? "")
    .trim()
    .toUpperCase();

  if (role !== "ADMIN") {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 },
      ),
    };
  }

  return { authorized: true as const };
}