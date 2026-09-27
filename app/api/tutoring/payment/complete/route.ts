import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { processUniversalTutoringBooking } from "@/lib/tutoring-payment-finalization";

export const dynamic = "force-dynamic";

/**
 * Server-side reconciliation path after a successful tutoring payment.
 * Stripe webhooks remain the primary path, while this browser return path
 * guarantees that a paid Checkout Session is finalized even when a webhook
 * is delayed or cannot reach a local development server.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id")?.trim();
  const successUrl = new URL("/tutoring/booking/success", request.url);

  if (sessionId) {
    successUrl.searchParams.set("session_id", sessionId);
  }

  if (!sessionId) {
    successUrl.searchParams.set("payment", "missing_session");
    return NextResponse.redirect(successUrl);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.checkoutType !== "TUTORING") {
      successUrl.searchParams.set("payment", "invalid_session");
      return NextResponse.redirect(successUrl);
    }

    if (session.payment_status !== "paid") {
      successUrl.searchParams.set("payment", "not_paid");
      return NextResponse.redirect(successUrl);
    }

    await processUniversalTutoringBooking(session);

    successUrl.searchParams.set("payment", "confirmed");
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("TUTORING PAYMENT RETURN FINALIZATION FAILED:", error);
    successUrl.searchParams.set("payment", "verification_failed");
    return NextResponse.redirect(successUrl);
  }
}
