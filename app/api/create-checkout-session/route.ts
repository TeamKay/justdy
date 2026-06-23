// /app/api/create-checkout-session/route.ts
import "server-only";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma"; // Make sure path is correct

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

interface CheckoutRequestBody {
  email: string;
  name: string;
  enrollmentType: "hourly" | "monthly" | "";
  amount: number;
  gradeLevel: string;
  subject: string;
  sessionDate: string; // e.g., "2026-06-25"
  startTime: string; // e.g., "10:30 AM"
  endTime: string; // e.g., "11:30 AM"
  topic?: string;
  educatorId?: string | null;
}

// Helper to parse "2026-06-25" and "10:30 AM" into a valid Javascript Date object
function parseDateTime(dateStr: string, timeStr: string): Date {
  const [datePart] = dateStr.split("T");
  const [time, modifier] = timeStr.split(" ");

  // Changed hours to let (since we modify it), and minutes to const
  const parts = time.split(":").map(Number);
  let hours = parts[0];
  const minutes = parts[1]; // or destructure cleanly:
  // const [hoursRaw, minutes] = time.split(":").map(Number); let hours = hoursRaw;

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  const date = new Date(datePart);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export async function POST(req: Request) {
  try {
    const body: CheckoutRequestBody = await req.json();
    const {
      email,
      name,
      enrollmentType,
      amount,
      gradeLevel,
      subject,
      sessionDate,
      startTime,
      endTime,
      topic,
      educatorId,
    } = body;

    // 1. Parse date elements properly into native Date variants
    const parsedDate = new Date(sessionDate);
    const parsedStart = parseDateTime(sessionDate, startTime);
    const parsedEnd = parseDateTime(sessionDate, endTime);

    // 2. Build the metadata container object
    const metadataContext = {
      paymentType: enrollmentType,
      billingName: name,
      billingEmail: email,
      gradeLevel,
      subject,
      sessionDate,
      startTime,
      endTime,
      topic: topic || "",
      educatorId: educatorId || "",
    };

    let session: Stripe.Checkout.Session;

    if (enrollmentType === "monthly") {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer_email: email,
        line_items: [
          { price: process.env.STRIPE_MONTHLY_PLAN_PRICE_ID!, quantity: 1 },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
        metadata: metadataContext,
        subscription_data: { metadata: metadataContext },
      });
    } else {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${subject} - Hourly Tutoring Session`,
                description: `Math tutoring for ${gradeLevel}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
        metadata: metadataContext,
      });
    }

    // 3. Keep a ledger record using your database model setup
    await prisma.pendingEnrollment.create({
      data: {
        name,
        email,
        gradeLevel,
        subject,
        enrollmentType: enrollmentType === "monthly" ? "Monthly" : "Hourly",
        topic,
        sessionDate: parsedDate,
        startTime: parsedStart,
        endTime: parsedEnd,
        amount: Math.round(amount * 100),
        stripeSessionId: session.id,
        educatorId: educatorId || null,
        status: "Pending",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
