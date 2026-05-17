"use server";

import { requireUser } from "@/app/actions/require-student";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

// Define a type for our price structure to keep TypeScript happy
type PriceConfig = string | { mins30: string; mins45: string; mins60: string };

export async function CreateSubscription(planName: string) {
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
      email: stripeUserId?.email ?? undefined,
      name: stripeUserId?.name ?? undefined,
      metadata: { userId: user.id },
    });

    stripeUserId = await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: stripeCustomer.id },
    });
  }

  // 1. Fully-typed Price IDs Map
  const PLAN_PRICES: Record<string, PriceConfig> = {
    FlexPay: {
      mins30: process.env.STRIPE_FLEXPAY_30M!,
      mins45: process.env.STRIPE_FLEXPAY_45M!,
      mins60: process.env.STRIPE_FLEXPAY_60M!,
    },
    "Monthly Premium": process.env.STRIPE_MONTHLY_PRICE_ID!,
  };

  let priceId: string | undefined;
  let checkoutMode: "payment" | "subscription" = "subscription";

  // 2. Parse the dynamic strings coming from your new Frontend setup
  if (planName.includes("FlexPay")) {
    checkoutMode = "payment"; // One-time charge for single sessions

    const flexPrices = PLAN_PRICES["FlexPay"];
    if (typeof flexPrices === "object") {
      if (planName.includes("30 Min")) priceId = flexPrices.mins30;
      else if (planName.includes("45 Min")) priceId = flexPrices.mins45;
      else if (planName.includes("60 Min")) priceId = flexPrices.mins60;
    }
  } else {
    // Regular subscription plan lookup
    const priceConfig = PLAN_PRICES[planName];
    if (typeof priceConfig === "string") {
      priceId = priceConfig;
      checkoutMode = "subscription";
    }
  }

  if (!priceId) {
    throw new Error(
      `Invalid plan selected or missing Price ID for: ${planName}`,
    );
  }

  // 3. Create Custom Stripe checkout session matching the chosen mode
  const session = await stripe.checkout.sessions.create({
    customer: stripeUserId.stripeCustomerId as string,
    mode: checkoutMode, // Dynamic switcher ("payment" vs "subscription")
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
