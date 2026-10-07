import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";

import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env";
import { getCreditPack } from "@/lib/credits/packages";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const authenticatedUser = session?.user;

    if (!authenticatedUser?.id || !authenticatedUser.email) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to purchase credits.",
        },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: authenticatedUser.id,
      },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Your account could not be found.",
        },
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => null)) as {
      pack?: unknown;
    } | null;

    const packKey =
      typeof body?.pack === "string"
        ? body.pack.trim()
        : "";

    const pack = getCreditPack(packKey);

    if (!pack) {
      return NextResponse.json(
        {
          error: "Invalid credit pack.",
        },
        { status: 400 },
      );
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      env.BETTER_AUTH_URL ||
      "http://localhost:3000"
    ).replace(/\/$/, "");

    const checkoutParams = {
      mode: "payment" as const,

      ui_mode: "elements" as const,

      payment_method_types: ["card"] as const,

      wallet_options: {
        link: {
          display: "never" as const,
        },
      },

      billing_address_collection: "auto" as const,

      ...(user.stripeCustomerId
        ? {
            customer: user.stripeCustomerId,
          }
        : {
            customer_email: user.email
              .trim()
              .toLowerCase(),

            customer_creation: "always" as const,
          }),

      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: pack.priceCents,

            product_data: {
              name: `${pack.name} Credits`,
              description:
                `${pack.credits.toLocaleString()} Justdy credits`,

              metadata: {
                creditPack: pack.key,
                credits: String(pack.credits),
              },
            },
          },

          quantity: 1,
        },
      ],

      return_url:
        `${appUrl}/dashboard/credits` +
        `?purchase=success&session_id={CHECKOUT_SESSION_ID}`,

      metadata: {
        purchaseType: "credit",
        creditPack: pack.key,
        userId: user.id,
      },
    } as unknown as Stripe.Checkout.SessionCreateParams;

    const checkoutSession =
      await stripe.checkout.sessions.create(
        checkoutParams,
      );

    if (!checkoutSession.client_secret) {
      console.error(
        "CREDIT STRIPE CHECKOUT RETURNED NO CLIENT SECRET:",
        checkoutSession.id,
      );

      return NextResponse.json(
        {
          error:
            "Payment was initialized but the secure checkout could not be loaded.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,

      clientSecret:
        checkoutSession.client_secret,

      customerEmail: user.email,

      currency: "USD",

      amount: pack.priceCents,

      pack: {
        key: pack.key,
        name: pack.name,
        credits: pack.credits,
        priceCents: pack.priceCents,
      },
    });
  } catch (error) {
    console.error(
      "Credit checkout creation failed:",
      error,
    );

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to start credit checkout.",
      },
      { status: 500 },
    );
  }
}