import { NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "Missing checkout session ID.",
        },
        { status: 400 },
      );
    }

    // Retrieve the Checkout Session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Make sure this was actually a successful payment
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        {
          error: "Payment has not been completed.",
        },
        { status: 400 },
      );
    }

    // Name collected from Stripe Checkout
    const customerName = session.customer_details?.name ?? null;

    // Email collected from Stripe Checkout
    const customerEmail = session.customer_details?.email ?? null;

    return NextResponse.json({
      name: customerName,
      email: customerEmail,
    });
  } catch (error) {
    console.error("PAYMENT SUCCESS API ERROR:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Unable to retrieve payment information.",
      },
      { status: 500 },
    );
  }
}
