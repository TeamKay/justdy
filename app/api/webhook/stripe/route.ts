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

  // -------------------------------------------------------------
  // checkout.session.completed (Triggers for BOTH Sub & Hourly)
  // -------------------------------------------------------------
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Extract metadata values injected during session creation
    const appointmentId = session.metadata?.appointmentId;
    const paymentType = session.metadata?.paymentType;

    // 🔥 FIX CONFIGURATION A: HANDLE THE DYNAMIC HOURLY PACKAGES
    if (paymentType === "hourly" && appointmentId) {
      try {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: "Scheduled" }, // Match your custom schema configuration string case exactly
        });
        console.log(
          `✅ Hourly Appointment ${appointmentId} confirmed successfully via webhook.`,
        );
        return NextResponse.json({ received: true });
      } catch (dbErr) {
        console.error("❌ Error updating hourly appointment status:", dbErr);
        return new NextResponse("Database update failed", { status: 500 });
      }
    }

    // 🔥 FIX CONFIGURATION B: HANDLE THE RECURRING SUBSCRIPTION PLAN
    if (paymentType === "monthly") {
      // If there's an appointment associated with the signup initialization, unlock it too
      if (appointmentId) {
        try {
          await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "Scheduled" },
          });
        } catch (dbErr) {
          console.error(
            "❌ Error updating subscription appointment status:",
            dbErr,
          );
        }
      }

      // Continue with your existing customer record subscription syncing logic
      if (!session.subscription) {
        return new NextResponse("Missing subscription block context.", {
          status: 400,
        });
      }

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );
      const customerId = session.customer as string;

      // Ensure your application checks metadata fallback if stripeCustomerId isn't stored yet
      const learnerId = session.metadata?.learnerId;
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ stripeCustomerId: customerId }, { id: learnerId }],
        },
      });

      if (!user) {
        console.error(
          `❌ User not found for Customer: ${customerId} or Learner: ${learnerId}`,
        );
        return new NextResponse("User not found", { status: 404 });
      }

      // Save or connect customer record mapping reference tracking fields
      if (!user.stripeCustomerId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customerId },
        });
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
  }

  // -------------------------------------------------------------
  // invoice.paid (Only loops for recurring subscription actions)
  // -------------------------------------------------------------

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;

    // 🔥 SAFE WORKAROUND: Look up the parameter dynamically using Record typing
    const rawInvoice = invoice as unknown as Record<string, unknown>;
    const rawSubscription = rawInvoice.subscription;

    // Safely parse out the ID whether it's an object structure or a plain string
    const subscriptionId =
      typeof rawSubscription === "string"
        ? rawSubscription
        : (rawSubscription as Record<string, string> | null)?.id;

    // Ignore casual custom inline charge invoices that don't belong to ongoing tiers
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

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
  }

  // -----------------------------
  // subscription updated
  // -----------------------------
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;

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
    const subscription = event.data.object as Stripe.Subscription;

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

// import { stripe } from "@/lib/stripe";
// import prisma from "@/lib/prisma";
// import { headers } from "next/headers";
// import { NextResponse } from "next/server";
// import Stripe from "stripe";
// import { PlanType, SubscriptionStatus } from "@/lib/generated/prisma/browser";

// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// export async function POST(req: Request) {
//   const body = await req.text();
//   const headersList = await headers();
//   const sig = headersList.get("Stripe-Signature") as string;

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
//   } catch (err: unknown) {
//     const message = err instanceof Error ? err.message : "Unknown error";
//     return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
//   }

//   // -----------------------------
//   // checkout.session.completed
//   // -----------------------------
//   const session = event.data.object as Stripe.Checkout.Session;
//   if (event.type === "checkout.session.completed") {
//     const subscription = await stripe.subscriptions.retrieve(
//       session.subscription as string,
//     );
//     const customerId = session.customer as string;

//     const user = await prisma.user.findUnique({
//       where: { stripeCustomerId: customerId },
//     });

//     if (!user) {
//       throw new Error("User not found");
//     }

//     await prisma.subscription.create({
//       data: {
//         stripeSubscriptionId: subscription.id,
//         userId: user.id,
//         currentPeriodStart: new Date(
//           subscription.items.data[0]!.current_period_start * 1000,
//         ),
//         currentPeriodEnd: new Date(
//           subscription.items.data[0]!.current_period_end * 1000,
//         ),
//         status: subscription.status as SubscriptionStatus,
//         interval:
//           subscription.items.data[0]?.price.recurring?.interval ?? "month",
//         planId: subscription.items.data[0]?.price.id as PlanType,
//         cancelAtPeriodEnd: subscription.cancel_at_period_end,
//       },
//     });
//   }

//   // -----------------------------
//   // invoice.paid
//   // -----------------------------
//   if (event.type === "invoice.payment_succeeded") {
//     const subscription = await stripe.subscriptions.retrieve(
//       session.subscription as string,
//     );

//     await prisma.subscription.update({
//       where: { stripeSubscriptionId: subscription.id },
//       data: {
//         planId: subscription.items.data[0]?.price.id as PlanType,
//         status: subscription.status as SubscriptionStatus,
//         currentPeriodStart: new Date(
//           subscription.items.data[0]!.current_period_start * 1000,
//         ),
//         currentPeriodEnd: new Date(
//           subscription.items.data[0]!.current_period_end * 1000,
//         ),
//       },
//     });
//   }

//   // -----------------------------
//   // subscription updated
//   // -----------------------------
//   if (event.type === "customer.subscription.updated") {
//     const subscription = await stripe.subscriptions.retrieve(
//       session.subscription as string,
//     );

//     const sub = await prisma.subscription.findFirst({
//       where: { stripeSubscriptionId: subscription.id },
//     });

//     if (sub) {
//       await prisma.subscription.update({
//         where: { stripeSubscriptionId: subscription.id },
//         data: {
//           cancelAtPeriodEnd: subscription.cancel_at_period_end,
//           status: subscription.status as SubscriptionStatus,
//           interval:
//             subscription.items.data[0]?.price.recurring?.interval ?? "month",
//           planId: subscription.items.data[0]?.price.id as PlanType,
//           currentPeriodStart: new Date(
//             subscription.items.data[0]!.current_period_start * 1000,
//           ),
//           currentPeriodEnd: new Date(
//             subscription.items.data[0]!.current_period_end * 1000,
//           ),
//         },
//       });
//     }
//   }

//   // -----------------------------
//   // subscription deleted
//   // -----------------------------
//   if (event.type === "customer.subscription.deleted") {
//     const subscription = await stripe.subscriptions.retrieve(
//       session.subscription as string,
//     );

//     const sub = await prisma.subscription.findFirst({
//       where: { stripeSubscriptionId: subscription.id },
//     });

//     if (sub) {
//       await prisma.subscription.update({
//         where: { stripeSubscriptionId: subscription.id },
//         data: {
//           status: "Canceled" as SubscriptionStatus,
//           cancelAtPeriodEnd: true,
//         },
//       });
//     }
//   }

//   return NextResponse.json({ received: true });
// }
