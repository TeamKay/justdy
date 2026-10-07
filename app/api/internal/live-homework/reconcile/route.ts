import { reconcileStaleLiveHomeworkReservations } from "@/lib/credits/live-homework-reconciliation";
import { NextRequest, NextResponse } from "next/server";



function isAuthorized(request: NextRequest) {
  const secret = process.env.INTERNAL_RECONCILE_SECRET?.trim();
  if (!secret) return false;

  const bearer = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-internal-reconcile-secret");
  return bearer === `Bearer ${secret}` || headerSecret === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const rawLimit = Number(url.searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(rawLimit) ? rawLimit : 50;

    const result = await reconcileStaleLiveHomeworkReservations({ limit });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET /api/internal/live-homework/reconcile error:", error);

    return NextResponse.json(
      { error: "Unable to reconcile stale Live Homework reservations." },
      { status: 500 },
    );
  }
}
