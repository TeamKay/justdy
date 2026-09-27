import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { CAPABILITIES, ensureCapabilities, hasCapability } from "@/lib/auth/capabilities";
import { env } from "@/lib/env";
import { Resend } from "resend";
import crypto from "crypto";
import { processUniversalTutoringBooking } from "@/lib/tutoring-payment-finalization";


// ============================================================
// RESEND
// ============================================================

const resendApiKey: string | undefined = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not configured.");
}

const resend = new Resend(resendApiKey);

// ============================================================
// VONAGE VIDEO
// ============================================================
//
// Stripe payment finalization intentionally does not initialize Vonage.
// The live classroom route creates the video session lazily when a
// participant joins. Keeping Vonage out of the payment transaction prevents
// a temporary video-provider error from rolling back a successful payment.
//
// ============================================================

// ============================================================
// STRIPE WEBHOOK SECRET
// ============================================================

const endpointSecretValue: string | undefined =
  process.env.STRIPE_WEBHOOK_SECRET;

if (!endpointSecretValue) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
}

// Explicitly guarantee string type to TypeScript
const endpointSecret: string = endpointSecretValue;

// ============================================================
// APP URL
// ============================================================

const appUrl: string = (
  process.env.NEXT_PUBLIC_APP_URL ||
  env.BETTER_AUTH_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

// ============================================================
// DATE HELPER
// ============================================================

function parseDateTime(dateStr: string, timeStr: string): Date {
  const datePart = dateStr.split("T")[0];

  if (!datePart) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  const [year, month, day] = datePart.split("-").map(Number);

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  const timeParts = timeStr.trim().split(/\s+/);

  const clock = timeParts[0];

  const modifier = timeParts[1]?.toUpperCase();

  if (!clock) {
    throw new Error(`Invalid time: ${timeStr}`);
  }

  const [rawHours, rawMinutes] = clock.split(":").map(Number);

  if (
    rawHours === undefined ||
    rawMinutes === undefined ||
    Number.isNaN(rawHours) ||
    Number.isNaN(rawMinutes)
  ) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  let hours = rawHours;

  const minutes = rawMinutes;

  if (modifier === "PM" && hours < 12) {
    hours += 12;
  }

  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

// ============================================================
// FIND / CREATE LEARNER
// ============================================================

async function findOrCreateLearner({
  email,
  name,
  stripeCustomerId,
}: {
  email: string;
  name: string;
  stripeCustomerId?: string | null;
}) {
  const normalizedEmail = email.trim().toLowerCase();

  // ==========================================================
  // FIND EXISTING USER
  // ==========================================================

  let user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  // ==========================================================
  // EXISTING USER
  // ==========================================================

  if (user) {
    const updateData: {
      stripeCustomerId?: string;
    } = {};

    if (!user.stripeCustomerId && stripeCustomerId) {
      updateData.stripeCustomerId = stripeCustomerId;
    }


    if (Object.keys(updateData).length > 0) {
      user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: updateData,
      });
    }

    await ensureCapabilities(user.id, [
      CAPABILITIES.LEARN,
      CAPABILITIES.BOOK_TUTORING,
    ]);

    return {
      user,
      isNewAccount: false,
    };
  }

  // ==========================================================
  // CREATE NEW USER
  // ==========================================================

  const temporaryPassword =
    crypto.randomBytes(48).toString("base64url") + "Aa1!";

  try {
    // ========================================================
    // IMPORTANT
    //
    // This tells auth.ts that this is a Stripe-created
    // account and should NOT trigger the normal verification
    // email.
    // ========================================================

    const signupHeaders = new Headers({
      "x-justdy-account-setup": "true",
    });

    await auth.api.signUpEmail({
      headers: signupHeaders,

      body: {
        name: name.trim() || "Learner",

        email: normalizedEmail,

        password: temporaryPassword,
      },
    });

    // ========================================================
    // GET USER
    // ========================================================

    user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      throw new Error(
        "Better Auth created the account but Prisma could not find the user.",
      );
    }

    // ========================================================
    // MARK ACCOUNT VERIFIED
    // ========================================================

    user = await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        emailVerified: true,

        ...(stripeCustomerId
          ? {
              stripeCustomerId,
            }
          : {}),
      },
    });

    await ensureCapabilities(user.id, [
      CAPABILITIES.LEARN,
      CAPABILITIES.BOOK_TUTORING,
    ]);

    console.log("NEW STRIPE LEARNER CREATED:", {
      userId: user.id,

      email: user.email,

      emailVerified: user.emailVerified,
    });

    return {
      user,

      isNewAccount: true,
    };
  } catch (error) {
    console.error("FAILED TO CREATE STRIPE LEARNER:", error);

    // ========================================================
    // HANDLE RACE CONDITION
    // ========================================================

    const existing = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existing) {
      return {
        user: existing,

        isNewAccount: false,
      };
    }

    throw error;
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(req: Request) {
  // ==========================================================
  // RAW BODY
  // ==========================================================

  const body = await req.text();

  // ==========================================================
  // STRIPE SIGNATURE
  // ==========================================================

  const headersList = await headers();

  const signatureValue = headersList.get("Stripe-Signature");

  if (!signatureValue) {
    return new NextResponse("Missing Stripe signature", {
      status: 400,
    });
  }

  // Explicitly guarantee string
  const signature: string = signatureValue;

  // ==========================================================
  // STRIPE EVENT
  // ==========================================================

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook error";

    console.error("STRIPE WEBHOOK SIGNATURE ERROR:", message);

    return new NextResponse(`Webhook Error: ${message}`, {
      status: 400,
    });
  }

  // ==========================================================
  // LOG EVENT
  // ==========================================================

  console.log("================================================");

  console.log("STRIPE WEBHOOK:", {
    eventId: event.id,

    eventType: event.type,
  });

  console.log("================================================");

  // ==========================================================
  // PROCESS COMPLETED CHECKOUTS AND EXPIRED CHECKOUTS
  // ==========================================================

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.expired"
  ) {
    return NextResponse.json({
      received: true,
    });
  }

  // ==========================================================
  // CHECKOUT SESSION
  // ==========================================================

  const session = event.data.object as Stripe.Checkout.Session;

  // A checkout.completed event is only allowed to fulfill an order
  // when Stripe reports that the payment itself is paid. This keeps
  // booking/payment state coupled to the actual Stripe payment state.
  // The booking flow currently creates card-only Checkout Sessions,
  // so an unexpected non-paid completed event should be retried rather
  // than being treated as a successful purchase.
  if (
    event.type === "checkout.session.completed" &&
    session.payment_status !== "paid"
  ) {
    console.error("STRIPE CHECKOUT COMPLETED WITHOUT PAID PAYMENT:", {
      sessionId: session.id,
      paymentStatus: session.payment_status,
    });

    return new NextResponse("Checkout payment is not yet confirmed", {
      status: 409,
    });
  }

  // ==========================================================
  // RELEASE EXPIRED TUTORING CHECKOUTS
  // ==========================================================

  if (event.type === "checkout.session.expired") {
    if (session.metadata?.checkoutType === "TUTORING") {
      await expireUniversalTutoringBooking(session);
    }

    return NextResponse.json({
      received: true,
      expired: true,
    });
  }

  // ==========================================================
  // IDEMPOTENCY CHECK
  //
  // Stripe can send the same event more than once.
  //
  // This prevents duplicate:
  //
  // - transactions
  // - purchases
  // - enrollments
  // - emails
  // ==========================================================

  // Tutoring has its own idempotent finalizer below. Do not let the
  // generic transaction idempotency check short-circuit a tutoring
  // checkout that has a Transaction but is missing its canonical
  // TutoringSession/whiteboard. That state must be repairable on a
  // Stripe retry or browser return.
  const isUniversalTutoring =
    session.metadata?.checkoutType === "TUTORING";

  if (!isUniversalTutoring) {
    const alreadyProcessed = await prisma.transaction.findFirst({
      where: {
        stripeSessionId: session.id,
      },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (alreadyProcessed) {
      console.log("STRIPE WEBHOOK ALREADY PROCESSED:", {
        sessionId: session.id,
        transactionId: alreadyProcessed.id,
        userId: alreadyProcessed.userId,
        status: alreadyProcessed.status,
      });

      return NextResponse.json({
        received: true,
        alreadyProcessed: true,
      });
    }
  }

  // ==========================================================
  // CHECKOUT LOG
  // ==========================================================

  console.log("CHECKOUT SESSION:", {
    id: session.id,

    email: session.customer_details?.email,

    name: session.customer_details?.name,

    paymentStatus: session.payment_status,

    amountTotal: session.amount_total,

    metadata: session.metadata,
  });

  try {
    // ========================================================
    // CUSTOMER EMAIL
    // ========================================================

    const customerEmail = session.customer_details?.email;

    if (!customerEmail) {
      throw new Error("Stripe checkout did not provide a customer email.");
    }

    const email: string = customerEmail.trim().toLowerCase();

    // ========================================================
    // CUSTOMER NAME
    // ========================================================

    const name: string = session.customer_details?.name?.trim() || "Learner";

    // ========================================================
    // STRIPE CUSTOMER
    // ========================================================

    let stripeCustomerId: string | null =
      typeof session.customer === "string" ? session.customer : null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,

        name,
      });

      stripeCustomerId = customer.id;

      console.log("CREATED STRIPE CUSTOMER:", {
        customerId: stripeCustomerId,

        email,
      });
    }

    // ========================================================
    // CHECKOUT TYPE
    // ========================================================

    const isProductPurchase = session.metadata?.purchaseType === "product";

    console.log("CHECKOUT TYPE:", {
      sessionId: session.id,

      isProductPurchase,

      purchaseType: session.metadata?.purchaseType,
    });

    // ========================================================
    // PRODUCT PURCHASE
    // ========================================================

    if (isProductPurchase) {
      // ======================================================
      // GET LINE ITEMS
      // ======================================================

      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          limit: 100,

          expand: ["data.price.product"],
        },
      );

      if (lineItems.data.length === 0) {
        throw new Error("Stripe checkout contains no line items.");
      }

      // ======================================================
      // FIND / CREATE LEARNER
      // ======================================================

      const accountResult = await findOrCreateLearner({
        email,

        name,

        stripeCustomerId,
      });

      const user = accountResult.user;

      // ======================================================
      // PURCHASE EMAIL ITEMS
      // ======================================================

      const purchaseEmailItems: Array<{
        title: string;

        type: string;

        quantity: number;

        amount: number;

        accessType: "course" | "download";
      }> = [];

      // ======================================================
      // DATABASE TRANSACTION
      // ======================================================

      await prisma.$transaction(async (tx) => {
        for (const lineItem of lineItems.data) {
          // ==================================================
          // STRIPE PRODUCT
          // ==================================================

          const stripeProduct = lineItem.price?.product;

          if (!stripeProduct || typeof stripeProduct === "string") {
            console.error("STRIPE PRODUCT WAS NOT EXPANDED:", {
              lineItemId: lineItem.id,

              product: stripeProduct,
            });

            continue;
          }

          // ==================================================
          // DELETED PRODUCT
          // ==================================================

          if ("deleted" in stripeProduct && stripeProduct.deleted === true) {
            console.error("STRIPE PRODUCT HAS BEEN DELETED:", {
              lineItemId: lineItem.id,

              productId: stripeProduct.id,
            });

            continue;
          }

          // ==================================================
          // JUSTDY PRODUCT ID
          // ==================================================

          const productId = stripeProduct.metadata?.productId;

          if (!productId) {
            console.error("STRIPE PRODUCT HAS NO JUSTDY PRODUCT ID:", {
              stripeProductId: stripeProduct.id,

              lineItemId: lineItem.id,

              metadata: stripeProduct.metadata,
            });

            continue;
          }

          // ==================================================
          // FIND JUSTDY PRODUCT
          // ==================================================

          const product = await tx.product.findUnique({
            where: {
              id: productId,
            },

            select: {
              id: true,

              title: true,

              type: true,

              price: true,

              fileKey: true,
            },
          });

          if (!product) {
            throw new Error(`Justdy product ${productId} does not exist.`);
          }

          // ==================================================
          // QUANTITY
          // ==================================================

          const quantity = Math.max(1, Number(lineItem.quantity ?? 1));

          // ==================================================
          // AMOUNT
          // ==================================================

          const amount = Number(lineItem.amount_total ?? 0);

          // ==================================================
          // COURSE
          // ==================================================

          if (product.type === "Course") {
            await tx.enrollment.upsert({
              where: {
                userId_productId: {
                  userId: user.id,

                  productId: product.id,
                },
              },

              update: {
                status: "Active",

                amount,
              },

              create: {
                userId: user.id,

                productId: product.id,

                amount,

                status: "Active",
              },
            });

            purchaseEmailItems.push({
              title: product.title,

              type: product.type,

              quantity,

              amount,

              accessType: "course",
            });
          }

          // ==================================================
          // DIGITAL PRODUCT
          // ==================================================
          else {
            await tx.purchase.upsert({
              where: {
                stripeSessionId_productId: {
                  stripeSessionId: session.id,

                  productId: product.id,
                },
              },

              update: {
                quantity,

                amount,

                status: "Paid",

                stripePaymentIntentId:
                  typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : null,
              },

              create: {
                userId: user.id,

                productId: product.id,

                amount,

                quantity,

                stripeSessionId: session.id,

                stripePaymentIntentId:
                  typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : null,

                status: "Paid",
              },
            });

            purchaseEmailItems.push({
              title: product.title,

              type: product.type,

              quantity,

              amount,

              accessType: "download",
            });
          }
        }

        // ==================================================
        // VERIFY PRODUCTS
        // ==================================================

        if (purchaseEmailItems.length === 0) {
          throw new Error(
            "No valid Justdy products were found in this checkout.",
          );
        }

        // ==================================================
        // CREATE TRANSACTION
        // ==================================================

        const existingTransaction = await tx.transaction.findFirst({
          where: {
            stripeSessionId: session.id,
          },

          select: {
            id: true,
          },
        });

        if (existingTransaction) {
          await tx.transaction.update({
            where: {
              id: existingTransaction.id,
            },

            data: {
              userId: user.id,

              amount: session.amount_total ?? 0,

              stripePaymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : null,

              status: "Paid",
            },
          });
        } else {
          await tx.transaction.create({
            data: {
              userId: user.id,

              amount: session.amount_total ?? 0,

              stripeSessionId: session.id,

              stripePaymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : null,

              status: "Paid",
            },
          });
        }
      });

      // ======================================================
      // NEW ACCOUNT
      //
      // ONE EMAIL ONLY:
      // PURCHASE CONFIRMATION + ACCOUNT SETUP
      // ======================================================

      if (accountResult.isNewAccount) {
        try {
          const setupUrl = `${appUrl}/reset-password`;

          const purchaseEmailData = {
            items: purchaseEmailItems,

            amountPaid: ((session.amount_total ?? 0) / 100).toFixed(2),

            dashboardUrl: `${appUrl}/library`,
          };

          // Put the checkout marker and purchase data in redirectTo.
          // Do not depend on custom request headers inside
          // Better Auth's later sendResetPassword callback.

          const encodedPurchaseData = Buffer.from(
            JSON.stringify(purchaseEmailData),
            "utf8",
          ).toString("base64url");

          const checkoutSetupUrl =
            `${setupUrl}` +
            `?checkoutSetup=true` +
            `&purchaseData=${encodeURIComponent(encodedPurchaseData)}`;

          const resetResult = await auth.api.requestPasswordReset({
            body: {
              email: user.email.trim().toLowerCase(),

              redirectTo: checkoutSetupUrl,
            },
          });

          console.log("SINGLE PURCHASE + ACCOUNT SETUP EMAIL REQUESTED:", {
            email: user.email,
            result: resetResult,
          });
        } catch (resetError) {
          console.error(
            "PURCHASE SAVED BUT ACCOUNT SETUP EMAIL FAILED:",
            resetError,
          );
        }
      }

      // ======================================================
      // EXISTING USER
      //
      // ONE PURCHASE EMAIL
      // ======================================================

      if (!accountResult.isNewAccount) {
        try {
          const PurchaseConfirmationEmail = (
            await import("@/app/_components/emails/PurchaseConfirmationEmail")
          ).default;

          const result = await resend.emails.send({
            from: "Justdy <onboarding@justdy.com>",

            to: [user.email.trim().toLowerCase()],

            subject: "Your Justdy Purchase Was Successful",

            react: PurchaseConfirmationEmail({
              username: user.name || name || "Learner",

              email: user.email,

              items: purchaseEmailItems,

              amountPaid: ((session.amount_total ?? 0) / 100).toFixed(2),

              isNewAccount: false,

              dashboardUrl: `${appUrl}/library`,
            }),
          });

          if (result.error) {
            console.error("EXISTING USER PURCHASE EMAIL ERROR:", result.error);
          } else {
            console.log("EXISTING USER PURCHASE EMAIL SENT:", {
              id: result.data?.id,
              email: user.email,
            });
          }
        } catch (emailError) {
          console.error(
            "PURCHASE SAVED BUT EXISTING USER EMAIL FAILED:",
            emailError,
          );
        }
      }

      // ======================================================
      // PRODUCT SUCCESS
      // ======================================================

      return NextResponse.json({
        received: true,
        purchaseProcessed: true,
        userId: user.id,
        isNewAccount: accountResult.isNewAccount,
      });
    }

    // ========================================================
    // TUTORING BOOKING
    // ========================================================
    //
    // New tutoring checkout flow:
    //
    // Stripe metadata.bookingId
    //        ↓
    // TutoringBooking
    //        ↓
    // Payment verification
    //        ↓
    // Appointment
    //        ↓
    // Video session
    //        ↓
    // Session whiteboard
    //
    // PendingEnrollment remains supported by the legacy checkout
    // flow, but it is no longer the authoritative source for new
    // tutoring bookings.
    // ========================================================

    const checkoutType = session.metadata?.checkoutType;

    if (checkoutType !== "TUTORING") {
      /*
       * Keep the legacy tutoring checkout behavior for older Stripe
       * sessions that do not contain checkoutType=TUTORING.
       *
       * This is intentionally preserved so existing paid sessions
       * created before the new tutoring booking system was introduced
       * can still be reconciled.
       */
      const emailPayload = await prisma.$transaction(async (tx) => {
        const pendingEnrollment = await tx.pendingEnrollment.findUnique({
          where: {
            stripeSessionId: session.id,
          },
        });

        const finalEmail = pendingEnrollment?.email || email;
        const finalName = pendingEnrollment?.name || name;
        const safeFinalEmail = finalEmail.trim().toLowerCase();

        if (!safeFinalEmail) {
          throw new Error("No customer email found.");
        }

        const targetEducatorId =
          pendingEnrollment?.educatorId || session.metadata?.educatorId;

        const subject =
          pendingEnrollment?.subject ||
          session.metadata?.subject ||
          "Tutoring Session";

        const gradeLevel =
          pendingEnrollment?.gradeLevel ||
          session.metadata?.gradeLevel ||
          "N/A";

        const topic = pendingEnrollment?.topic || session.metadata?.topic || "";

        let finalStartDate: Date;
        let finalEndDate: Date;
        let finalSessionDate: Date;

        if (pendingEnrollment) {
          finalStartDate = pendingEnrollment.startTime;
          finalEndDate = pendingEnrollment.endTime;
          finalSessionDate = pendingEnrollment.sessionDate;
        } else if (
          session.metadata?.sessionDate &&
          session.metadata?.startTime &&
          session.metadata?.endTime
        ) {
          const sessionDate = session.metadata.sessionDate;
          const startTime = session.metadata.startTime;
          const endTime = session.metadata.endTime;

          finalStartDate = parseDateTime(sessionDate, startTime);
          finalEndDate = parseDateTime(sessionDate, endTime);
          finalSessionDate = new Date(sessionDate);
        } else {
          throw new Error("Unable to determine tutoring session dates.");
        }

        let finalEducatorId = targetEducatorId || null;

        if (finalEducatorId) {
          const educator = await tx.user.findUnique({
            where: {
              id: finalEducatorId,
            },
          });

          if (!educator) {
            finalEducatorId = null;
          }
        }

        if (!finalEducatorId) {
          const educatorCandidates = await tx.user.findMany({
            where: { verificationStatus: "Verified" },
            take: 50,
          });
          const fallback = (await Promise.all(educatorCandidates.map(async (candidate) =>
            (await hasCapability(candidate.id, CAPABILITIES.TEACH)) ? candidate : null
          ))).find(Boolean) ?? null;

          if (!fallback) {
            throw new Error("No valid educator found.");
          }

          finalEducatorId = fallback.id;
        }

        const educatorId: string = finalEducatorId;

        const educator = await tx.user.findUnique({
          where: {
            id: educatorId,
          },
        });

        const educatorEmail: string = educator?.email || "";
        const educatorName: string = educator?.name || "Educator";

        const accountResult = await findOrCreateLearner({
          email: safeFinalEmail,
          name: finalName,
          stripeCustomerId,
        });

        const user = accountResult.user;

        await tx.transaction.create({
          data: {
            userId: user.id,
            amount: session.amount_total ?? 0,
            stripeSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            status: "Paid",
          },
        });

        await tx.appointment.create({
          data: {
            learnerId: user.id,
            educatorId,
            subject,
            gradeLevel,
            date: finalSessionDate,
            startTime: finalStartDate,
            endTime: finalEndDate,
            learnerDescription: topic,
            status: "Scheduled",
            payoutStatus: "Unpaid",
            stripeCheckoutSessionId: session.id,
          },
        });

        if (pendingEnrollment) {
          await tx.pendingEnrollment.update({
            where: {
              id: pendingEnrollment.id,
            },
            data: {
              status: "Enrolled",
            },
          });
        }

        return {
          learnerEmail: user.email,
          learnerName: user.name || "Learner",
          educatorEmail,
          educatorName,
          appointmentDetails: {
            subject,
            date: finalSessionDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            startTime: finalStartDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            endTime: finalEndDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        };
      });

      try {
        const {
          appointmentDetails,
          learnerName,
          learnerEmail,
          educatorEmail,
          educatorName,
        } = emailPayload;

        const TutoringBookingConfirmedEmail = (
          await import("@/app/_components/emails/TutoringBookingConfirmedEmail")
        ).default;

        const customerResult = await resend.emails.send({
          from: "Justdy <onboarding@justdy.com>",
          to: [learnerEmail.trim().toLowerCase()],
          subject: "Your Justdy Tutoring Session Is Confirmed",
          react: TutoringBookingConfirmedEmail({
            username: learnerName,
            subject: appointmentDetails.subject,
            date: appointmentDetails.date,
            time: `${appointmentDetails.startTime} - ${appointmentDetails.endTime}`,
            amountPaid: ((session.amount_total ?? 0) / 100).toFixed(2),
            tutoringUrl: `${appUrl}/tutoring/sessions`,
          }),
        });

        if (customerResult.error) {
          console.error("CUSTOMER TUTORING EMAIL ERROR:", customerResult.error);
        }

        if (educatorEmail) {
          const TutoringSessionScheduledEmail = (
            await import("@/app/_components/emails/TutoringSessionScheduledEmail")
          ).default;

          const tutorResult = await resend.emails.send({
            from: "Justdy <onboarding@justdy.com>",
            to: [educatorEmail.trim().toLowerCase()],
            subject: "New Justdy Tutoring Session Scheduled",
            react: TutoringSessionScheduledEmail({
              tutorName: educatorName,
              customerName: learnerName,
              subject: appointmentDetails.subject,
              date: appointmentDetails.date,
              time: `${appointmentDetails.startTime} - ${appointmentDetails.endTime}`,
              tutoringUrl: `${appUrl}/tutor/sessions`,
            }),
          });

          if (tutorResult.error) {
            console.error("TUTOR TUTORING EMAIL ERROR:", tutorResult.error);
          }
        }
      } catch (emailError) {
        console.error(
          "LEGACY TUTORING DATABASE SAVED BUT EMAIL FAILED:",
          emailError,
        );
      }

      return NextResponse.json({
        received: true,
        tutoringProcessed: true,
        legacyTutoringProcessed: true,
      });
    }

    // ========================================================
    // UNIVERSAL TUTORING BOOKING
    // ========================================================
    //
    // New tutoring checkouts use the universal Booking / Service /
    // Availability models. The handler performs payment verification,
    // idempotency checks, availability locking, and the final
    // PendingPayment -> Scheduled transition.
    //
    // Legacy tutoring checkouts without checkoutType=TUTORING were
    // handled above and remain supported for backward compatibility.
    // ========================================================

    const tutoringProcessed = await processUniversalTutoringBooking(session);

    if (tutoringProcessed) {
      return NextResponse.json({
        received: true,
        tutoringProcessed: true,
        bookingId: session.metadata?.bookingId ?? null,
      });
    }
  } catch (error) {
    console.error("================================================");

    console.error("STRIPE WEBHOOK PROCESSING FAILED:", error);

    console.error("================================================");

    return new NextResponse("Webhook processing failed", {
      status: 500,
    });
  }
}

async function expireUniversalTutoringBooking(
  session: Stripe.Checkout.Session,
) {
  const bookingId = session.metadata?.bookingId;

  if (!bookingId) {
    console.warn("EXPIRED TUTORING CHECKOUT HAS NO BOOKING ID:", session.id);
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          studentId: true,
          educatorId: true,
          serviceId: true,
          availabilityId: true,
          status: true,
          stripeSessionId: true,
        },
      });

      if (!booking) {
        console.warn("EXPIRED TUTORING BOOKING NOT FOUND:", bookingId);
        return;
      }

      if (
        booking.stripeSessionId &&
        booking.stripeSessionId !== session.id
      ) {
        console.warn("IGNORING EXPIRED CHECKOUT FOR ANOTHER STRIPE SESSION:", {
          bookingId,
          bookingSessionId: booking.stripeSessionId,
          expiredSessionId: session.id,
        });
        return;
      }

      if (booking.status !== "PendingPayment") {
        return;
      }

      if (booking.availabilityId) {
        await tx.$queryRaw`
          SELECT id
          FROM "Availability"
          WHERE id = ${booking.availabilityId}
          FOR UPDATE
        `;
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "Cancelled",
        },
      });

      if (booking.serviceId && booking.availabilityId) {
        await tx.availability.updateMany({
          where: {
            id: booking.availabilityId,
            educatorId: booking.educatorId,
            status: "Booked",
          },
          data: {
            status: "Available",
          },
        });
      }
    },
    { isolationLevel: "Serializable" },
  );

  console.log("EXPIRED TUTORING CHECKOUT RELEASED:", {
    bookingId,
    stripeSessionId: session.id,
  });
}

