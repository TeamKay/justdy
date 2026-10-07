import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getCreditBalance } from "@/lib/ai/credits";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const balance = await getCreditBalance(session.user.id);

  return NextResponse.json(
    {
      credits: {
        balance,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
