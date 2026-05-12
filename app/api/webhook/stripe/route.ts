import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PlanType, SubscriptionStatus } from "@/lib/generated/prisma/browser";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  // -----------------------------
  // checkout.session.completed
  // -----------------------------
  const session = event.data.object as Stripe.Checkout.Session;
  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );
    const customerId = session.customer as string;

    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    await prisma.subscription.create({
      data: {
        stripeSubscriptionId: subscription.id,
        userId: user.id,
        currentPeriodStart: new Date(
          subscription.items.data[0]!.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          subscription.items.data[0]!.current_period_end * 1000,
        ),
        status: subscription.status as SubscriptionStatus,
        interval:
          subscription.items.data[0]?.price.recurring?.interval ?? "month",
        planId: subscription.items.data[0]?.price.id as PlanType,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  // -----------------------------
  // invoice.paid
  // -----------------------------
  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        planId: subscription.items.data[0]?.price.id as PlanType,
        status: subscription.status as SubscriptionStatus,
        currentPeriodStart: new Date(
          subscription.items.data[0]!.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          subscription.items.data[0]!.current_period_end * 1000,
        ),
      },
    });
  }

  // -----------------------------
  // subscription updated
  // -----------------------------
  if (event.type === "customer.subscription.updated") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    const sub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (sub) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          status: subscription.status as SubscriptionStatus,
          interval:
            subscription.items.data[0]?.price.recurring?.interval ?? "month",
          planId: subscription.items.data[0]?.price.id as PlanType,
          currentPeriodStart: new Date(
            subscription.items.data[0]!.current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(
            subscription.items.data[0]!.current_period_end * 1000,
          ),
        },
      });
    }
  }

  // -----------------------------
  // subscription deleted
  // -----------------------------
  if (event.type === "customer.subscription.deleted") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    const sub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (sub) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: "Canceled" as SubscriptionStatus,
          cancelAtPeriodEnd: true,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}

// import { env } from "@/lib/env";
// import prisma from "@/lib/prisma";
// import { stripe } from "@/lib/stripe";
// import { headers } from "next/headers";
// import Stripe from "stripe";

// export async function POST(req: Request) {
//   const body = await req.text();

//   const headersList = await headers();

//   const signature = headersList.get("Stripe-Signature") as string;

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       body,
//       signature,
//       env.STRIPE_WEBHOOK_SECRET!,
//     );
//   } catch {
//     return new Response("Webhook error", { status: 400 });
//   }

//   if (event.type === "checkout.session.completed") {
//     const session = event.data.object as Stripe.Checkout.Session;

//     const courseId = session.metadata?.courseId;
//     const customerId = session.customer as string;

//     if (!courseId) {
//       throw new Error("Course id not found...");
//     }
//     const user = await prisma.user.findUnique({
//       where: {
//         stripeCustomerId: customerId,
//       },
//     });

//     if (!user) {
//       throw new Error("User not found...");
//     }

//     await prisma.enrollment.update({
//       where: {
//         id: session.metadata?.enrollmentId as string,
//       },
//       data: {
//         userId: user.id,
//         courseId: courseId,
//         amount: session.amount_total as number,
//         status: "Active",
//       },
//     });
//   }

//   return new Response(null, { status: 200 });
// }
