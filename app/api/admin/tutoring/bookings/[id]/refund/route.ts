import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "Admin") {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        paymentIntentId: true,
        stripeSessionId: true,
        service: { select: { price: true, currency: true } },
        studentId: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.status !== "Cancelled") {
      return NextResponse.json(
        { error: "Only cancelled tutoring bookings can be refunded." },
        { status: 409 },
      );
    }

    if (!booking.paymentIntentId) {
      return NextResponse.json(
        { error: "This booking has no confirmed Stripe payment to refund." },
        { status: 409 },
      );
    }

    const existing = await stripe.refunds.list({
      payment_intent: booking.paymentIntentId,
      limit: 100,
    });

    const alreadyRefunded = existing.data.reduce(
      (sum, refund) => sum + (refund.amount ?? 0),
      0,
    );

    const expected = booking.service?.price ?? 0;

    if (alreadyRefunded >= expected) {
      return NextResponse.json({
        success: true,
        alreadyRefunded: true,
        amount: alreadyRefunded,
        currency: booking.service?.currency ?? "usd",
      });
    }

    const refund = await stripe.refunds.create(
      {
        payment_intent: booking.paymentIntentId,
        amount: expected - alreadyRefunded,
        metadata: {
          bookingId: booking.id,
          reason: "tutoring_booking_cancellation",
          processedBy: session.user.id,
        },
      },
      {
        idempotencyKey: `justdy-tutoring-refund-${booking.id}`,
      },
    );

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      currency: refund.currency,
    });
  } catch (error) {
    console.error("Admin tutoring refund error:", error);
    return NextResponse.json(
      { error: "Unable to process this tutoring refund." },
      { status: 502 },
    );
  }
}
