import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true, emailVerified: true },
  });
  if (
    !actor ||
    String(actor.role).toUpperCase() !== "ADMIN" ||
    actor.status !== "Active" ||
    !actor.emailVerified
  ) {
    return NextResponse.json(
      {
        error:
          "Only an active, email-verified administrator can cancel a request.",
      },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const existing = await prisma.tutoringOnboardingRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      stripeCheckoutSessionId: true,
    },
  });
  if (!existing)
    return NextResponse.json(
      { error: "Tutoring request not found." },
      { status: 404 },
    );
  if (existing.status.toLowerCase() === "cancelled")
    return NextResponse.json({ message: "This request is already cancelled." });
  if (
    ["paid", "payment_received"].includes(existing.paymentStatus.toLowerCase())
  ) {
    return NextResponse.json(
      { error: "A request with a received payment cannot be cancelled here." },
      { status: 409 },
    );
  }

  // Expire an open Checkout session first so a previously emailed payment link
  // cannot remain usable after cancellation. Do not cancel if Stripe says it
  // has already completed.
  if (existing.stripeCheckoutSessionId) {
    try {
      const checkout = await stripe.checkout.sessions.retrieve(
        existing.stripeCheckoutSessionId,
      );
      if (
        checkout.status === "complete" &&
        checkout.payment_status === "paid"
      ) {
        return NextResponse.json(
          {
            error:
              "Payment has already completed. Refresh the page before taking further action.",
          },
          { status: 409 },
        );
      }
      if (checkout.status === "open") {
        await stripe.checkout.sessions.expire(existing.stripeCheckoutSessionId);
      }
    } catch (error) {
      console.error("Could not expire tutoring Checkout session:", error);
      return NextResponse.json(
        {
          error:
            "Could not safely cancel the request because its payment link could not be checked. Please try again.",
        },
        { status: 502 },
      );
    }
  }

  const result = await prisma.tutoringOnboardingRequest.updateMany({
    where: {
      id,
      status: { not: "cancelled" },
      paymentStatus: { notIn: ["paid", "payment_received"] },
    },
    data: { status: "cancelled", paymentStatus: "cancelled" },
  });
  if (result.count !== 1) {
    return NextResponse.json(
      {
        error:
          "The request changed while you were cancelling it. Refresh and try again.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Tutoring request cancelled and any open payment link expired.",
  });
}
