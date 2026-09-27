import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const { id } = await params;
  let body: { action?: string };
  try { body = await req.json(); } catch { body = {}; }
  if (body.action !== "markPaid" && body.action !== "release") {
    return NextResponse.json({ error: "Action must be markPaid or release." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({ where: { id } });
      if (!payout) throw new Error("NOT_FOUND");
      if (payout.status !== "Processing") throw new Error("NOT_PROCESSING");

      const bookings = await tx.booking.findMany({
        where: {
          educatorId: payout.educatorId,
          status: "Completed",
          payoutStatus: "Processing",
          tutoringSession: { status: "COMPLETED" },
          service: { type: "TUTORING" },
        },
        select: { id: true, service: { select: { price: true } } },
      });

      const expectedGross = bookings.reduce((sum, b) => sum + (b.service?.price ?? 0), 0);
      if (expectedGross !== payout.amount) throw new Error("PAYOUT_MISMATCH");

      const nextStatus = body.action === "markPaid" ? "Paid" : "Unpaid";
      const updated = await tx.payout.update({
        where: { id },
        data: {
          status: nextStatus,
          processedBy: session.user.id,
          processedAt: new Date(),
        },
      });

      if (bookings.length) {
        await tx.booking.updateMany({
          where: { id: { in: bookings.map((b) => b.id) }, payoutStatus: "Processing" },
          data: { payoutStatus: nextStatus === "Paid" ? "Paid" : "Unpaid" },
        });
      }

      return { payout: updated, bookings: bookings.length };
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NOT_FOUND") return NextResponse.json({ error: "Payout not found." }, { status: 404 });
    if (message === "NOT_PROCESSING") return NextResponse.json({ error: "Only processing payouts can be changed." }, { status: 409 });
    if (message === "PAYOUT_MISMATCH") return NextResponse.json({ error: "Payout amount no longer matches its processing bookings. Investigate before changing this payout." }, { status: 409 });
    console.error("Admin payout processing error:", error);
    return NextResponse.json({ error: "Unable to process payout." }, { status: 500 });
  }
}
