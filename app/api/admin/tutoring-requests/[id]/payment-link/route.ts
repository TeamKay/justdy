import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(key);
}
const esc = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);

async function sendPaymentEmail(input: {
  to: string;
  guardianName: string;
  studentName: string;
  subject: string;
  schedule: string;
  duration: number;
  amountLabel: string;
  checkoutUrl: string;
  paymentLabel: string;
  totalLabel: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.TUTORING_PAYMENT_FROM_EMAIL;
  if (!apiKey || !from)
    throw new Error(
      "RESEND_API_KEY and TUTORING_PAYMENT_FROM_EMAIL must be configured.",
    );
  const e = Object.fromEntries(
    Object.entries(input).map(([k, v]) => [
      k,
      typeof v === "string" ? esc(v) : v,
    ]),
  ) as typeof input;
  const text = `Hello,\n\nThe tutoring plan for ${input.studentName} has been agreed.\nSubject: ${input.subject}\nSchedule: ${input.schedule}\nSession duration: ${input.duration} minutes\nCourse total: ${input.totalLabel}\n${input.paymentLabel}: ${input.amountLabel}\n\nPay securely through Stripe: ${input.checkoutUrl}\n\nThe payment link does not confirm a tutoring booking.\n\nThe Justdy Team`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Justdy tutoring payment for ${e.studentName}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#172033;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Your agreed tutoring plan is ready. Review the details and pay securely through Stripe.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
    style="background:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0"
          style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;">

          <tr>
            <td style="background:#102c54;padding:30px 32px 28px;">
              <div style="font-size:32px;font-weight:800;letter-spacing:-1px;color:#ffffff;">
                justdy<span style="color:#60a5fa;">.</span>
              </div>
              <div style="padding-top:10px;font-size:12px;letter-spacing:2px;font-weight:700;color:#cbdcf5;">
                PERSONALIZED LEARNING
              </div>
              <div style="margin-top:24px;height:4px;width:64px;background:#60a5fa;border-radius:4px;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px 40px;">
              <div style="margin-bottom:16px;color:#2864f0;font-size:13px;font-weight:800;letter-spacing:2px;">
                TUTORING PLAN AGREED
              </div>

              <h1 style="margin:0 0 24px;color:#102c54;font-size:32px;line-height:1.2;">
                Your tutoring plan is ready
              </h1>

              <p style="margin:0 0 20px;font-size:17px;line-height:1.7;color:#34445e;">
                Hello ${e.guardianName},
              </p>

              <p style="margin:0 0 28px;font-size:17px;line-height:1.8;color:#475569;">
                The tutoring plan for <strong>${e.studentName}</strong> has been agreed.
                Please review the details below and complete the requested payment.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                <tr>
                  <td style="padding:20px 18px 8px;color:#64748b;font-size:12px;letter-spacing:1.5px;font-weight:700;"
                    colspan="2">
                    YOUR AGREED TUTORING PLAN
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 18px;color:#64748b;font-size:14px;">Subject</td>
                  <td style="padding:10px 18px;color:#102c54;font-size:14px;font-weight:700;text-align:right;">${e.subject}</td>
                </tr>
                <tr>
                  <td style="padding:10px 18px;color:#64748b;font-size:14px;">Schedule</td>
                  <td style="padding:10px 18px;color:#102c54;font-size:14px;font-weight:700;text-align:right;">${e.schedule}</td>
                </tr>
                <tr>
                  <td style="padding:10px 18px;color:#64748b;font-size:14px;">Session duration</td>
                  <td style="padding:10px 18px;color:#102c54;font-size:14px;font-weight:700;text-align:right;">${e.duration} minutes</td>
                </tr>
                <tr>
                  <td style="padding:10px 18px;color:#64748b;font-size:14px;">Course total</td>
                  <td style="padding:10px 18px;color:#102c54;font-size:14px;font-weight:700;text-align:right;">${e.totalLabel}</td>
                </tr>
                <tr>
                  <td style="padding:14px 18px 20px;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0;">
                    ${e.paymentLabel}
                  </td>
                  <td style="padding:14px 18px 20px;color:#102c54;font-size:20px;font-weight:800;text-align:right;border-top:1px solid #e2e8f0;">
                    ${e.amountLabel}
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 18px;color:#34445e;font-size:16px;line-height:1.7;">
                Use the secure Stripe button below to complete your payment.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 26px;">
                <tr>
                  <td align="center" bgcolor="#102c54" style="border-radius:8px;">
                    <a href="${e.checkoutUrl}"
                      style="display:inline-block;padding:16px 26px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">
                      Pay securely with Stripe
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 10px;color:#8291a7;font-size:13px;line-height:1.7;">
                If the button does not work, copy and paste this link into your browser:
              </p>

              <p style="margin:0 0 26px;font-size:13px;line-height:1.8;overflow-wrap:anywhere;word-break:break-word;">
                <a href="${e.checkoutUrl}" style="color:#2864f0;overflow-wrap:anywhere;word-break:break-word;">${e.checkoutUrl}</a>
              </p>

              <div style="padding:16px 18px;background:#eff6ff;border-left:4px solid #2864f0;border-radius:5px;">
                <p style="margin:0;color:#1e3a5f;font-size:14px;line-height:1.8;">
                  This payment link does not itself confirm a tutoring booking.
                  Your booking will be confirmed according to Justdy's payment and scheduling process.
                </p>
              </div>

              <p style="margin:28px 0 0;color:#475569;font-size:15px;line-height:1.8;">
                Warm regards,<br><strong style="color:#102c54;">The Justdy Team</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <div style="font-size:22px;font-weight:800;color:#102c54;">Justdy</div>
              <p style="margin:12px 0 22px;color:#60738f;font-size:14px;line-height:1.7;">
                Supporting your learning journey, one step at a time.
              </p>
              <p style="margin:0;color:#8b9bb2;font-size:12px;line-height:1.8;">
                This email contains payment information for your agreed tutoring plan.
                Please keep it for your records.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Justdy tutoring payment for ${input.studentName}`,
      text,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Payment email could not be sent (${res.status}): ${(
        await res.text().catch(() => "")
      ).slice(0, 300)}`,
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    const actor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, emailVerified: true, status: true },
    });
    if (
      !actor ||
      String(actor.role).toUpperCase() !== "ADMIN" ||
      !actor.emailVerified ||
      actor.status !== "Active"
    )
      return NextResponse.json(
        {
          error: "Only an active, email-verified admin can send payment links.",
        },
        { status: 403 },
      );
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      paymentKind?: string;
      recipientEmail?: string;
    };
    const requestRow = await prisma.tutoringOnboardingRequest.findUnique({
      where: { id },
      include: { tutoringPayments: { orderBy: { installmentNumber: "asc" } } },
    });
    if (!requestRow) {
      return NextResponse.json(
        { error: "Tutoring request not found." },
        { status: 404 },
      );
    }

    // The recipient is chosen explicitly in the confirmation dialog. Persist it
    // so the next payment defaults to the same payer. Legacy requests default to guardian.
    const paymentRecipient = String(
      body.recipientEmail ?? requestRow.billingEmail ?? requestRow.email,
    )
      .trim()
      .toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentRecipient)) {
      return NextResponse.json(
        {
          error:
            "The payment recipient email is invalid. Update the request before sending a payment link.",
        },
        { status: 422 },
      );
    }
    if (
      paymentRecipient !==
      (requestRow.billingEmail?.trim().toLowerCase() ||
        requestRow.email.trim().toLowerCase())
    ) {
      await prisma.tutoringOnboardingRequest.update({
        where: { id },
        data: { billingEmail: paymentRecipient },
      });
    }
    if (!requestRow.learnerUserId || !requestRow.learnerAccountSetupSentAt) {
      return NextResponse.json(
        {
          error:
            "Complete learner account setup first. Agree the plan, send the learner their account setup email, then retry the payment link.",
        },
        { status: 409 },
      );
    }
    const mayRequestNextInstallment =
      requestRow.paymentPlan === "installments" &&
      requestRow.status === "payment_received" &&
      requestRow.paymentStatus !== "paid";
    if (
      (requestRow.status !== "plan_agreed" && !mayRequestNextInstallment) ||
      !requestRow.planAgreedAt ||
      !requestRow.planAgreedById
    ) {
      return NextResponse.json(
        {
          error:
            "The tutoring plan must be agreed before a payment link can be sent. For later installments, the prior payment must be recorded first.",
        },
        { status: 409 },
      );
    }
    const missingPlanFields = {
      subject: !requestRow.subject?.trim(),
      agreedSchedule: !requestRow.agreedSchedule?.trim(),
      sessionDurationMinutes:
        requestRow.sessionDurationMinutes == null ||
        requestRow.sessionDurationMinutes <= 0,
      sessionsPerWeek:
        requestRow.sessionsPerWeek == null || requestRow.sessionsPerWeek <= 0,
      courseDurationWeeks:
        requestRow.courseDurationWeeks == null ||
        requestRow.courseDurationWeeks <= 0,
      agreedRateCents:
        requestRow.agreedRateCents == null || requestRow.agreedRateCents <= 0,
    };

    if (Object.values(missingPlanFields).some(Boolean)) {
      console.error("[payment-link] Missing agreed plan fields:", {
        requestId: id,
        missingFields: Object.entries(missingPlanFields)
          .filter(([, missing]) => missing)
          .map(([field]) => field),
      });
      return NextResponse.json(
        {
          error:
            "The agreed plan is missing duration, schedule, course length, or rate details.",
        },
        { status: 422 },
      );
    }

    // These values are safe to use as non-null after the validation above.
    const subject = requestRow.subject!;
    const schedule = requestRow.agreedSchedule!;
    const duration = requestRow.sessionDurationMinutes!;
    const sessionsPerWeek = requestRow.sessionsPerWeek!;
    const courseDurationWeeks = requestRow.courseDurationWeeks!;
    const agreedRateCents = requestRow.agreedRateCents!;

    const currency = (requestRow.currency || "usd").toLowerCase();
    if (!["usd", "ghs", "gbp", "eur"].includes(currency))
      return NextResponse.json(
        { error: "Unsupported currency." },
        { status: 422 },
      );
    const totalSessions = sessionsPerWeek * courseDurationWeeks;
    const calculatedTotalCents = agreedRateCents * totalSessions;
    if (
      !Number.isSafeInteger(totalSessions) ||
      totalSessions <= 0 ||
      !Number.isSafeInteger(calculatedTotalCents) ||
      calculatedTotalCents <= 0
    ) {
      return NextResponse.json(
        { error: "Calculated course amount is invalid." },
        { status: 422 },
      );
    }
    // Persist the canonical total once, and refuse to silently charge a total that
    // conflicts with a previously agreed/stored amount.
    if (
      requestRow.courseTotalCents != null &&
      requestRow.courseTotalCents !== calculatedTotalCents
    ) {
      return NextResponse.json(
        {
          error:
            "The stored course total does not match the agreed plan. Review the plan before requesting payment.",
        },
        { status: 409 },
      );
    }
    const totalCents = requestRow.courseTotalCents ?? calculatedTotalCents;
    if (requestRow.courseTotalCents == null) {
      await prisma.tutoringOnboardingRequest.update({
        where: { id },
        data: { courseTotalCents: totalCents },
      });
    }
    if (body.paymentKind !== "full" && body.paymentKind !== "installment") {
      return NextResponse.json(
        { error: "Choose a valid payment type." },
        { status: 400 },
      );
    }
    const kind = body.paymentKind;
    if (kind === "full" && requestRow.paymentPlan === "installments")
      return NextResponse.json(
        {
          error:
            "This plan was agreed for installments. Select the next installment payment.",
        },
        { status: 409 },
      );
    if (kind === "installment" && requestRow.paymentPlan !== "installments")
      return NextResponse.json(
        { error: "This plan was agreed for full payment." },
        { status: 409 },
      );
    const paid = requestRow.tutoringPayments.filter((p) => p.status === "paid");
    if (requestRow.paymentPlan === "full" && paid.length)
      return NextResponse.json(
        { error: "The course payment has already been recorded." },
        { status: 409 },
      );
    const installmentCount =
      requestRow.paymentPlan === "installments"
        ? requestRow.installmentCount
        : 1;
    if (
      !Number.isSafeInteger(installmentCount) ||
      installmentCount < 2 ||
      installmentCount > 24
    ) {
      if (requestRow.paymentPlan === "installments") {
        return NextResponse.json(
          {
            error:
              "The agreed installment count is invalid. Update the plan before requesting payment.",
          },
          { status: 422 },
        );
      }
    }
    const nextNumber = paid.length + 1;
    if (nextNumber > installmentCount)
      return NextResponse.json(
        { error: "All agreed payments have already been recorded." },
        { status: 409 },
      );
    const amountCents =
      requestRow.paymentPlan === "full"
        ? totalCents
        : Math.floor(totalCents / installmentCount) +
          (nextNumber <= totalCents % installmentCount ? 1 : 0);
    const prior = requestRow.tutoringPayments.find(
      (p) => p.installmentNumber === nextNumber && p.status !== "paid",
    );
    if (prior?.stripeCheckoutSessionId) {
      const existingSession = await getStripe().checkout.sessions.retrieve(
        prior.stripeCheckoutSessionId,
      );
      if (existingSession.status === "complete") {
        if (existingSession.payment_status === "paid") {
          return NextResponse.json(
            {
              error:
                "Stripe reports this payment as complete. Wait for payment confirmation to sync before sending another link.",
            },
            { status: 409 },
          );
        }
        return NextResponse.json(
          {
            error:
              "This Checkout session is complete but payment is not marked paid. Verify the Stripe event before creating another link.",
          },
          { status: 409 },
        );
      }
      if (existingSession.status === "open" && existingSession.url) {
        await sendPaymentEmail({
          to: paymentRecipient,
          studentName: requestRow.studentName,
          guardianName: requestRow.guardianName,
          subject,
          schedule,
          duration,
          amountLabel: money(amountCents, currency),
          checkoutUrl: existingSession.url,
          paymentLabel:
            requestRow.paymentPlan === "full"
              ? "Full course payment"
              : `Installment ${nextNumber} of ${installmentCount}`,
          totalLabel: money(totalCents, currency),
        });
        await prisma.tutoringOnboardingPayment.update({
          where: { id: prior.id },
          data: { emailSentAt: new Date(), emailSentById: actor.id },
        });
        await prisma.tutoringOnboardingRequest.update({
          where: { id },
          data: {
            paymentStatus: "payment_requested",
            paymentLinkEmailSentAt: new Date(),
            paymentLinkEmailSentById: actor.id,
          },
        });
        return NextResponse.json({
          ok: true,
          message: `Payment link emailed to ${paymentRecipient}.`,
          paymentStatus: "payment_requested",
        });
      }
    }
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    if (!appUrl || !/^https?:\/\//i.test(appUrl))
      throw new Error("NEXT_PUBLIC_APP_URL must be an absolute URL.");
    let payment = prior;
    if (!payment) {
      try {
        payment = await prisma.tutoringOnboardingPayment.create({
          data: {
            onboardingRequestId: id,
            installmentNumber: nextNumber,
            expectedAmountCents: amountCents,
            currency,
            status: "payment_requested",
          },
        });
      } catch (createError) {
        // Another admin request may have created this installment concurrently.
        const existingPayment =
          await prisma.tutoringOnboardingPayment.findUnique({
            where: {
              onboardingRequestId_installmentNumber: {
                onboardingRequestId: id,
                installmentNumber: nextNumber,
              },
            },
          });
        if (!existingPayment) throw createError;
        payment = existingPayment;
        if (payment.status === "paid")
          return NextResponse.json(
            { error: "This installment has already been paid." },
            { status: 409 },
          );
        if (
          payment.expectedAmountCents !== amountCents ||
          payment.currency.toLowerCase() !== currency
        ) {
          return NextResponse.json(
            {
              error:
                "The existing installment does not match the agreed amount. Review the plan before retrying.",
            },
            { status: 409 },
          );
        }
      }
    }
    // Keep retries of the same attempt idempotent, but permit a fresh attempt
    // after the previously stored Checkout session has expired. The previous
    // session ID is the generation token; once the new session is persisted,
    // subsequent requests reuse it through the open-session branch above.
    const attemptGeneration = prior?.stripeCheckoutSessionId ?? "initial";
    const checkout = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: paymentRecipient,
        client_reference_id: id,
        metadata: {
          tutoringOnboardingRequestId: id,
          tutoringOnboardingPaymentId: payment.id,
          planAgreedAt: requestRow.planAgreedAt.toISOString(),
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: amountCents,
              product_data: {
                name: `Justdy ${subject} tutoring`,
                description: `${requestRow.paymentPlan === "full" ? "Full course payment" : `Installment ${nextNumber} of ${installmentCount}`} for ${requestRow.studentName}; ${totalSessions} planned sessions, ${duration} minutes each`,
              },
            },
          },
        ],
        success_url: `${appUrl}/tutoring/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/tutoring/payment/cancelled?request=${encodeURIComponent(id)}`,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
      },
      { idempotencyKey: `justdy-tutoring-${payment.id}-${attemptGeneration}` },
    );
    if (!checkout.url) throw new Error("Stripe did not return a Checkout URL.");
    await prisma.tutoringOnboardingPayment.update({
      where: { id: payment.id },
      data: { stripeCheckoutSessionId: checkout.id, checkoutUrl: checkout.url },
    });
    // Legacy columns remain as a latest-session compatibility pointer; webhook uses the per-payment record.
    await prisma.tutoringOnboardingRequest.update({
      where: { id },
      data: {
        stripeCheckoutSessionId: checkout.id,
        stripeCheckoutUrl: checkout.url,
      },
    });
    await sendPaymentEmail({
      to: paymentRecipient,
      studentName: requestRow.studentName,
      guardianName: requestRow.guardianName,
      subject,
      schedule,
      duration,
      amountLabel: money(amountCents, currency),
      checkoutUrl: checkout.url,
      paymentLabel:
        requestRow.paymentPlan === "full"
          ? "Full course payment"
          : `Installment ${nextNumber} of ${installmentCount}`,
      totalLabel: money(totalCents, currency),
    });
    await prisma.tutoringOnboardingPayment.update({
      where: { id: payment.id },
      data: { emailSentAt: new Date(), emailSentById: actor.id },
    });
    await prisma.tutoringOnboardingRequest.updateMany({
      where: { id, paymentStatus: { not: "paid" } },
      data: {
        paymentStatus: "payment_requested",
        paymentLinkEmailSentAt: new Date(),
        paymentLinkEmailSentById: actor.id,
      },
    });
    return NextResponse.json({
      ok: true,
      message: `Payment link emailed to ${paymentRecipient}.`,
      paymentStatus: "payment_requested",
      amountCents,
      installmentNumber: nextNumber,
    });
  } catch (error) {
    console.error("[admin tutoring payment link]", error);
    // Prisma unique-constraint conflicts can happen if two admins click Send at once.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A payment link is being prepared for this installment. Refresh the request and try again if it has not appeared.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send payment link.",
      },
      { status: 500 },
    );
  }
}
