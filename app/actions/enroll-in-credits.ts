"use server";

import { requireUser } from "@/app/actions/require-student";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { redirect } from "next/navigation";

// Define the price mapping (In production, move these to your DB or Env)
const PRICE_MAP: Record<string, string> = {
  standard_monthly: "standard",
  pro_monthly: "premium",
};

export async function enrollInCreditsAction(planId: string) {
  const user = await requireUser();
  let checkoutUrl: string | null = null;

  try {
    // 1. Validation
    const stripePriceId = PRICE_MAP[planId];
    if (!stripePriceId) throw new Error("Invalid Plan ID");

    // 2. Customer Logic
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    // 3. Session Creation
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${env.BETTER_AUTH_URL}/payment/success`,
      cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,
      metadata: {
        userId: user.id,
        packageId: planId,
      },
    });

    checkoutUrl = session.url;
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    // Return an error object instead of throwing to avoid crashing the client
    return { error: "Could not initiate checkout. Please try again." };
  }

  // ONLY redirect if we successfully got a URL
  if (checkoutUrl) {
    redirect(checkoutUrl);
  }
}
