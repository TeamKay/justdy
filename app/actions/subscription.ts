"use server";

import { requireUser } from "@/app/actions/require-student";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

export async function CreateSubscription(plan: string) {
  const user = await requireUser();

  let stripeUserId = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
    },
  });

  // Create Stripe customer if missing
  if (!stripeUserId?.stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create({
      email: stripeUserId?.email,
      name: stripeUserId?.name ?? undefined,
      metadata: { userId: user.id },
    });

    stripeUserId = await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: stripeCustomer.id },
    });
  }

  // PLAN PRICE IDS
  const PLAN_PRICES: Record<string, string> = {
    Standard: process.env.STRIPE_STANDARD_PRICE_ID!,
    Premium: process.env.STRIPE_PREMIUM_PRICE_ID!,
  };

  const priceId = PLAN_PRICES[plan];

  if (!priceId) {
    throw new Error("Invalid plan selected");
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeUserId.stripeCustomerId as string,
    mode: "subscription",
    billing_address_collection: "auto",
    payment_method_types: ["card"],
    customer_update: {
      name: "auto",
      address: "auto",
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],

    success_url: `${env.BETTER_AUTH_URL}/payment/success`,
    cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,
  });

  if (!session.url) throw new Error("Stripe session failed");

  redirect(session.url);
}
