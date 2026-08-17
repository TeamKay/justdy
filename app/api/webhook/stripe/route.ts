import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { Resend } from "resend";
import crypto from "crypto";

// ============================================================
// RESEND
// ============================================================

const resendApiKey: string | undefined = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not configured.");
}

const resend = new Resend(resendApiKey);

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
      role?: string;
    } = {};

    if (!user.stripeCustomerId && stripeCustomerId) {
      updateData.stripeCustomerId = stripeCustomerId;
    }

    if (user.role !== "Admin" && user.role !== "Educator") {
      updateData.role = "Learner";
    }

    if (Object.keys(updateData).length > 0) {
      user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: updateData,
      });
    }

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
        role: "Learner",

        emailVerified: true,

        ...(stripeCustomerId
          ? {
              stripeCustomerId,
            }
          : {}),
      },
    });

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
  // ONLY PROCESS CHECKOUT COMPLETED
  // ==========================================================

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({
      received: true,
    });
  }

  // ==========================================================
  // CHECKOUT SESSION
  // ==========================================================

  const session = event.data.object as Stripe.Checkout.Session;

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

            dashboardUrl: `${appUrl}/learner/products`,
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

              dashboardUrl: `${appUrl}/learner/access`,
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

    const emailPayload = await prisma.$transaction(async (tx) => {
      // ==================================================
      // PENDING ENROLLMENT
      // ==================================================

      const pendingEnrollment = await tx.pendingEnrollment.findUnique({
        where: {
          stripeSessionId: session.id,
        },
      });

      // ==================================================
      // EMAIL / NAME
      // ==================================================

      const finalEmail = pendingEnrollment?.email || email;

      const finalName = pendingEnrollment?.name || name;

      // ==================================================
      // IMPORTANT:
      //
      // finalEmail is guaranteed to be a string
      // because email was already validated above.
      // ==================================================

      const safeFinalEmail: string = finalEmail.trim().toLowerCase();

      if (!safeFinalEmail) {
        throw new Error("No customer email found.");
      }

      // ==================================================
      // EDUCATOR
      // ==================================================

      const targetEducatorId =
        pendingEnrollment?.educatorId || session.metadata?.educatorId;

      // ==================================================
      // SUBJECT
      // ==================================================

      const subject =
        pendingEnrollment?.subject ||
        session.metadata?.subject ||
        "Tutoring Session";

      // ==================================================
      // GRADE LEVEL
      // ==================================================

      const gradeLevel =
        pendingEnrollment?.gradeLevel || session.metadata?.gradeLevel || "N/A";

      // ==================================================
      // TOPIC
      // ==================================================

      const topic = pendingEnrollment?.topic || session.metadata?.topic || "";

      // ==================================================
      // SESSION DATES
      // ==================================================

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

      // ==================================================
      // EDUCATOR
      // ==================================================

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

      // ==================================================
      // FALLBACK EDUCATOR
      // ==================================================

      if (!finalEducatorId) {
        const fallback = await tx.user.findFirst({
          where: {
            role: "Educator",
          },
        });

        if (!fallback) {
          throw new Error("No valid educator found.");
        }

        finalEducatorId = fallback.id;
      }

      // ==================================================
      // EDUCATOR ID
      // ==================================================

      const educatorId: string = finalEducatorId;

      const educator = await tx.user.findUnique({
        where: {
          id: educatorId,
        },
      });

      const educatorEmail: string = educator?.email || "";

      const educatorName: string = educator?.name || "Educator";

      // ==================================================
      // LEARNER
      //
      // IMPORTANT:
      //
      // NO encodedPurchaseData HERE.
      // ==================================================

      const accountResult = await findOrCreateLearner({
        email: safeFinalEmail,

        name: finalName,

        stripeCustomerId,
      });

      const user = accountResult.user;

      // ==================================================
      // TRANSACTION
      // ==================================================

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

      // ==================================================
      // APPOINTMENT
      // ==================================================

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

      // ==================================================
      // UPDATE PENDING ENROLLMENT
      // ==================================================

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

      // ==================================================
      // EMAIL DATA
      // ==================================================

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

    // ========================================================
    // TUTORING EMAILS
    // ========================================================

    try {
      const {
        appointmentDetails,

        learnerName,

        learnerEmail,

        educatorEmail,

        educatorName,
      } = emailPayload;

      // ======================================================
      // LEARNER EMAIL
      // ======================================================

      const LearnerBookingConfirmedEmail = (
        await import("@/app/_components/LearnerBookingConfirmedEmail")
      ).default;

      const learnerResult = await resend.emails.send({
        from: "Justdy <onboarding@justdy.com>",

        to: [learnerEmail.trim().toLowerCase()],

        subject: "Your Tutoring Session Is Confirmed",

        react: LearnerBookingConfirmedEmail({
          username: learnerName,

          subject: appointmentDetails.subject,

          date: appointmentDetails.date,

          time: `${appointmentDetails.startTime} - ${appointmentDetails.endTime}`,

          amountPaid: ((session.amount_total ?? 0) / 100).toFixed(2),

          verificationUrl: `${appUrl}/learner/products`,
        }),
      });

      if (learnerResult.error) {
        console.error("LEARNER TUTORING EMAIL ERROR:", learnerResult.error);
      } else {
        console.log("LEARNER TUTORING EMAIL SENT:", {
          id: learnerResult.data?.id,

          to: learnerEmail,
        });
      }

      // ======================================================
      // EDUCATOR EMAIL
      // ======================================================

      if (educatorEmail) {
        const EducatorSessionScheduledEmail = (
          await import("@/app/_components/EducatorSessionScheduledEmail")
        ).default;

        const educatorResult = await resend.emails.send({
          from: "Justdy <onboarding@justdy.com>",

          to: [educatorEmail.trim().toLowerCase()],

          subject: "New Student Session Scheduled",

          react: EducatorSessionScheduledEmail({
            educatorName,

            learnerName,

            subject: appointmentDetails.subject,

            date: appointmentDetails.date,

            time: `${appointmentDetails.startTime} - ${appointmentDetails.endTime}`,
          }),
        });

        if (educatorResult.error) {
          console.error("EDUCATOR EMAIL ERROR:", educatorResult.error);
        } else {
          console.log("EDUCATOR EMAIL SENT:", {
            id: educatorResult.data?.id,

            to: educatorEmail,
          });
        }
      }
    } catch (emailError) {
      console.error("TUTORING DATABASE SAVED BUT EMAIL FAILED:", emailError);
    }

    // ========================================================
    // TUTORING SUCCESS
    // ========================================================

    return NextResponse.json({
      received: true,

      tutoringProcessed: true,
    });
  } catch (error) {
    console.error("================================================");

    console.error("STRIPE WEBHOOK PROCESSING FAILED:", error);

    console.error("================================================");

    return new NextResponse("Webhook processing failed", {
      status: 500,
    });
  }
}

// import { NextResponse } from "next/server";
// import { headers } from "next/headers";
// import Stripe from "stripe";
// import prisma from "@/lib/prisma";
// import { stripe } from "@/lib/stripe";
// import { auth } from "@/lib/auth";
// import { env } from "@/lib/env";
// import { Resend } from "resend";
// import crypto from "crypto";

// // ============================================================
// // RESEND
// // ============================================================

// const resendApiKey = process.env.RESEND_API_KEY;

// if (typeof resendApiKey !== "string" || resendApiKey.length === 0) {
//   throw new Error("RESEND_API_KEY is not configured.");
// }

// const resend = new Resend(resendApiKey);

// // ============================================================
// // STRIPE WEBHOOK SECRET
// // ============================================================

// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// if (typeof endpointSecret !== "string" || endpointSecret.length === 0) {
//   throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
// }

// // ============================================================
// // APP URL
// // ============================================================

// const appUrl = (
//   process.env.NEXT_PUBLIC_APP_URL ||
//   env.BETTER_AUTH_URL ||
//   "http://localhost:3000"
// ).replace(/\/$/, "");

// // ============================================================
// // DATE HELPER
// // ============================================================

// function parseDateTime(dateStr: string, timeStr: string): Date {
//   const datePart = dateStr.split("T")[0];

//   if (!datePart) {
//     throw new Error(`Invalid date: ${dateStr}`);
//   }

//   const [year, month, day] = datePart.split("-").map(Number);

//   if (
//     year === undefined ||
//     month === undefined ||
//     day === undefined ||
//     Number.isNaN(year) ||
//     Number.isNaN(month) ||
//     Number.isNaN(day)
//   ) {
//     throw new Error(`Invalid date format: ${dateStr}`);
//   }

//   const timeParts = timeStr.trim().split(/\s+/);

//   const clock = timeParts[0];

//   const modifier = timeParts[1]?.toUpperCase();

//   if (!clock) {
//     throw new Error(`Invalid time: ${timeStr}`);
//   }

//   const [rawHours, rawMinutes] = clock.split(":").map(Number);

//   if (
//     rawHours === undefined ||
//     rawMinutes === undefined ||
//     Number.isNaN(rawHours) ||
//     Number.isNaN(rawMinutes)
//   ) {
//     throw new Error(`Invalid time format: ${timeStr}`);
//   }

//   let hours = rawHours;

//   const minutes = rawMinutes;

//   if (modifier === "PM" && hours < 12) {
//     hours += 12;
//   }

//   if (modifier === "AM" && hours === 12) {
//     hours = 0;
//   }

//   return new Date(year, month - 1, day, hours, minutes, 0, 0);
// }

// // ============================================================
// // FIND / CREATE LEARNER
// // ============================================================

// async function findOrCreateLearner({
//   email,
//   name,
//   stripeCustomerId,
// }: {
//   email: string;
//   name: string;
//   stripeCustomerId?: string | null;
// }) {
//   const normalizedEmail = email.trim().toLowerCase();

//   // ==========================================================
//   // FIND EXISTING USER
//   // ==========================================================

//   let user = await prisma.user.findUnique({
//     where: {
//       email: normalizedEmail,
//     },
//   });

//   // ==========================================================
//   // EXISTING USER
//   // ==========================================================

//   if (user) {
//     console.log("EXISTING LEARNER FOUND:", {
//       id: user.id,

//       email: user.email,

//       role: user.role,
//     });

//     const updateData: {
//       stripeCustomerId?: string;
//       role?: string;
//     } = {};

//     if (!user.stripeCustomerId && stripeCustomerId) {
//       updateData.stripeCustomerId = stripeCustomerId;
//     }

//     if (user.role !== "Admin" && user.role !== "Educator") {
//       updateData.role = "Learner";
//     }

//     if (Object.keys(updateData).length > 0) {
//       user = await prisma.user.update({
//         where: {
//           id: user.id,
//         },

//         data: updateData,
//       });
//     }

//     return {
//       user,

//       isNewAccount: false,
//     };
//   }

//   // ==========================================================
//   // CREATE NEW USER
//   // ==========================================================

//   const temporaryPassword =
//     crypto.randomBytes(48).toString("base64url") + "Aa1!";

//   console.log("CREATING NEW STRIPE LEARNER:", {
//     email: normalizedEmail,

//     name,
//   });

//   try {
//     // ========================================================
//     // BETTER AUTH CREATION
//     // ========================================================

//     const signup = await auth.api.signUpEmail({
//       body: {
//         name: name.trim() || "Learner",

//         email: normalizedEmail,

//         password: temporaryPassword,
//       },
//     });

//     console.log("BETTER AUTH ACCOUNT CREATED:", {
//       email: normalizedEmail,

//       userId: signup.user?.id ?? null,
//     });

//     // ========================================================
//     // RETRIEVE PRISMA USER
//     // ========================================================

//     user = await prisma.user.findUnique({
//       where: {
//         email: normalizedEmail,
//       },
//     });

//     if (!user) {
//       throw new Error(
//         "Better Auth created the account but Prisma could not find the user.",
//       );
//     }

//     // ========================================================
//     // UPDATE APPLICATION FIELDS
//     // ========================================================

//     user = await prisma.user.update({
//       where: {
//         id: user.id,
//       },

//       data: {
//         role: "Learner",

//         ...(stripeCustomerId
//           ? {
//               stripeCustomerId: stripeCustomerId,
//             }
//           : {}),
//       },
//     });

//     console.log("NEW LEARNER CREATED:", {
//       id: user.id,

//       email: user.email,

//       role: user.role,
//     });

//     return {
//       user,

//       isNewAccount: true,
//     };
//   } catch (error) {
//     console.error("FAILED TO CREATE STRIPE LEARNER:", error);

//     // ========================================================
//     // HANDLE WEBHOOK RACE
//     // ========================================================

//     const existing = await prisma.user.findUnique({
//       where: {
//         email: normalizedEmail,
//       },
//     });

//     if (existing) {
//       console.log("USER ALREADY EXISTS AFTER CREATION ATTEMPT:", {
//         id: existing.id,

//         email: existing.email,
//       });

//       return {
//         user: existing,

//         isNewAccount: false,
//       };
//     }

//     throw error;
//   }
// }

// // ============================================================
// // POST
// // ============================================================

// export async function POST(req: Request) {
//   // ==========================================================
//   // RAW BODY
//   // ==========================================================

//   const body = await req.text();

//   // ==========================================================
//   // STRIPE HEADERS
//   // ==========================================================

//   const headersList = await headers();

//   const signature = headersList.get("Stripe-Signature");

//   if (!signature) {
//     return new NextResponse("Missing Stripe signature", {
//       status: 400,
//     });
//   }

//   // ==========================================================
//   // STRIPE EVENT
//   // ==========================================================

//   let event: Stripe.Event;

//   // ==========================================================
//   // VERIFY STRIPE EVENT
//   // ==========================================================

//   try {
//     event = stripe.webhooks.constructEvent(
//       body,
//       signature,
//       endpointSecret as string,
//     );
//   } catch (error) {
//     const message =
//       error instanceof Error ? error.message : "Unknown webhook error";

//     console.error("STRIPE WEBHOOK SIGNATURE ERROR:", message);

//     return new NextResponse(`Webhook Error: ${message}`, {
//       status: 400,
//     });
//   }

//   // ==========================================================
//   // LOG EVENT
//   // ==========================================================

//   console.log("================================================");

//   console.log("STRIPE WEBHOOK:", {
//     eventId: event.id,

//     eventType: event.type,
//   });

//   console.log("================================================");

//   // ==========================================================
//   // ONLY PROCESS CHECKOUT COMPLETED
//   // ==========================================================

//   if (event.type !== "checkout.session.completed") {
//     return NextResponse.json({
//       received: true,
//     });
//   }

//   // ==========================================================
//   // CHECKOUT SESSION
//   // ==========================================================

//   const session = event.data.object as Stripe.Checkout.Session;

//   console.log("CHECKOUT SESSION:", {
//     id: session.id,

//     email: session.customer_details?.email,

//     name: session.customer_details?.name,

//     paymentStatus: session.payment_status,

//     metadata: session.metadata,
//   });

//   try {
//     // ========================================================
//     // CUSTOMER EMAIL
//     // ========================================================

//     const email = session.customer_details?.email?.trim().toLowerCase();

//     // ========================================================
//     // CUSTOMER NAME
//     // ========================================================

//     const name = session.customer_details?.name?.trim() || "Learner";

//     // ========================================================
//     // EMAIL REQUIRED
//     // ========================================================

//     if (!email) {
//       throw new Error("Stripe checkout did not provide a customer email.");
//     }

//     // ========================================================
//     // STRIPE CUSTOMER
//     // ========================================================

//     let stripeCustomerId =
//       typeof session.customer === "string" ? session.customer : null;

//     if (!stripeCustomerId) {
//       const customer = await stripe.customers.create({
//         email,
//         name,
//       });

//       stripeCustomerId = customer.id;

//       console.log("CREATED STRIPE CUSTOMER:", {
//         customerId: stripeCustomerId,

//         email,
//       });
//     }

//     // ========================================================
//     // CHECKOUT TYPE
//     // ========================================================

//     const isProductPurchase = session.metadata?.purchaseType === "product";

//     console.log("CHECKOUT TYPE:", {
//       sessionId: session.id,

//       isProductPurchase,

//       purchaseType: session.metadata?.purchaseType,
//     });

//     // ========================================================
//     // PRODUCT PURCHASE
//     // ========================================================

//     if (isProductPurchase) {
//       // ======================================================
//       // GET LINE ITEMS
//       // ======================================================

//       const lineItems = await stripe.checkout.sessions.listLineItems(
//         session.id,
//         {
//           limit: 100,

//           expand: ["data.price.product"],
//         },
//       );

//       if (lineItems.data.length === 0) {
//         throw new Error("Stripe checkout contains no line items.");
//       }

//       console.log("STRIPE LINE ITEMS:", {
//         sessionId: session.id,

//         count: lineItems.data.length,
//       });

//       // ======================================================
//       // CREATE / FIND LEARNER
//       // ======================================================

//       const accountResult = await findOrCreateLearner({
//         email,

//         name,

//         stripeCustomerId,
//       });

//       const user = accountResult.user;

//       console.log("PURCHASE USER:", {
//         id: user.id,

//         email: user.email,

//         role: user.role,

//         newAccount: accountResult.isNewAccount,
//       });

//       // ======================================================
//       // PURCHASE EMAIL ITEMS
//       // ======================================================

//       const purchaseEmailItems: Array<{
//         title: string;
//         type: string;
//         quantity: number;
//         amount: number;
//         accessType: "course" | "download";
//       }> = [];

//       // ======================================================
//       // DATABASE TRANSACTION
//       // ======================================================

//       await prisma.$transaction(async (tx) => {
//         for (const lineItem of lineItems.data) {
//           // ==================================================
//           // STRIPE PRODUCT
//           // ==================================================

//           const stripeProduct = lineItem.price?.product;

//           // ==================================================
//           // PRODUCT NOT EXPANDED
//           // ==================================================

//           if (!stripeProduct || typeof stripeProduct === "string") {
//             console.error("STRIPE PRODUCT WAS NOT EXPANDED:", {
//               lineItemId: lineItem.id,

//               product: stripeProduct,
//             });

//             continue;
//           }

//           // ==================================================
//           // DELETED PRODUCT
//           // ==================================================

//           if ("deleted" in stripeProduct && stripeProduct.deleted === true) {
//             console.error("STRIPE PRODUCT HAS BEEN DELETED:", {
//               lineItemId: lineItem.id,

//               productId: stripeProduct.id,
//             });

//             continue;
//           }

//           // ==================================================
//           // JUSTDY PRODUCT ID
//           // ==================================================

//           const productId = stripeProduct.metadata?.productId;

//           if (!productId) {
//             console.error("STRIPE PRODUCT HAS NO JUSTDY PRODUCT ID:", {
//               stripeProductId: stripeProduct.id,

//               lineItemId: lineItem.id,

//               metadata: stripeProduct.metadata,
//             });

//             continue;
//           }

//           // ==================================================
//           // FIND JUSTDY PRODUCT
//           // ==================================================

//           const product = await tx.product.findUnique({
//             where: {
//               id: productId,
//             },

//             select: {
//               id: true,

//               title: true,

//               type: true,

//               price: true,

//               fileKey: true,
//             },
//           });

//           if (!product) {
//             throw new Error(`Justdy product ${productId} does not exist.`);
//           }

//           // ==================================================
//           // QUANTITY
//           // ==================================================

//           const quantity = Math.max(
//             1,

//             Number(lineItem.quantity ?? 1),
//           );

//           // ==================================================
//           // AMOUNT
//           // ==================================================

//           const amount = Number(lineItem.amount_total ?? 0);

//           // ==================================================
//           // COURSE
//           // ==================================================

//           if (product.type === "Course") {
//             await tx.enrollment.upsert({
//               where: {
//                 userId_productId: {
//                   userId: user.id,

//                   productId: product.id,
//                 },
//               },

//               update: {
//                 status: "Active",

//                 amount: amount,
//               },

//               create: {
//                 userId: user.id,

//                 productId: product.id,

//                 amount: amount,

//                 status: "Active",
//               },
//             });

//             purchaseEmailItems.push({
//               title: product.title,

//               type: product.type,

//               quantity,

//               amount,

//               accessType: "course",
//             });
//           }

//           // ==================================================
//           // DIGITAL PRODUCT
//           // ==================================================
//           else {
//             await tx.purchase.upsert({
//               where: {
//                 stripeSessionId_productId: {
//                   stripeSessionId: session.id,

//                   productId: product.id,
//                 },
//               },

//               update: {
//                 quantity,

//                 amount,

//                 status: "Paid",

//                 stripePaymentIntentId:
//                   typeof session.payment_intent === "string"
//                     ? session.payment_intent
//                     : null,
//               },

//               create: {
//                 userId: user.id,

//                 productId: product.id,

//                 amount,

//                 quantity,

//                 stripeSessionId: session.id,

//                 stripePaymentIntentId:
//                   typeof session.payment_intent === "string"
//                     ? session.payment_intent
//                     : null,

//                 status: "Paid",
//               },
//             });

//             purchaseEmailItems.push({
//               title: product.title,

//               type: product.type,

//               quantity,

//               amount,

//               accessType: "download",
//             });
//           }
//         }

//         // ==================================================
//         // VERIFY PRODUCTS
//         // ==================================================

//         if (purchaseEmailItems.length === 0) {
//           throw new Error(
//             "No valid Justdy products were found in this checkout.",
//           );
//         }

//         // ==================================================
//         // TRANSACTION
//         // ==================================================

//         const existingTransaction = await tx.transaction.findFirst({
//           where: {
//             stripeSessionId: session.id,
//           },

//           select: {
//             id: true,
//           },
//         });

//         if (existingTransaction) {
//           await tx.transaction.update({
//             where: {
//               id: existingTransaction.id,
//             },

//             data: {
//               userId: user.id,

//               amount: session.amount_total ?? 0,

//               stripePaymentIntentId:
//                 typeof session.payment_intent === "string"
//                   ? session.payment_intent
//                   : null,

//               status: "Paid",
//             },
//           });
//         } else {
//           await tx.transaction.create({
//             data: {
//               userId: user.id,

//               amount: session.amount_total ?? 0,

//               stripeSessionId: session.id,

//               stripePaymentIntentId:
//                 typeof session.payment_intent === "string"
//                   ? session.payment_intent
//                   : null,

//               status: "Paid",
//             },
//           });
//         }
//       });

//       // ======================================================
//       // DATABASE COMPLETE
//       // ======================================================

//       console.log("PURCHASE DATABASE PROCESSING COMPLETE:", {
//         sessionId: session.id,

//         userId: user.id,

//         email: user.email,

//         items: purchaseEmailItems.length,
//       });

//       // ======================================================
//       // DIRECT RESEND PURCHASE EMAIL
//       // ======================================================

//       try {
//         const PurchaseConfirmationEmail = (
//           await import("@/app/_components/emails/PurchaseConfirmationEmail")
//         ).default;

//         console.log("SENDING PURCHASE EMAIL:", {
//           to: user.email,

//           isNewAccount: accountResult.isNewAccount,

//           items: purchaseEmailItems.length,
//         });

//         const result = await resend.emails.send({
//           from: "Consultations <onboarding@justdy.com>",
//           to: [user.email.trim().toLowerCase()],
//           subject: "Your Justdy Purchase Was Successful",
//           react: PurchaseConfirmationEmail({
//             username: user.name || name || "Learner",
//             items: purchaseEmailItems,
//             amountPaid: ((session.amount_total ?? 0) / 100).toFixed(2),
//             isNewAccount: accountResult.isNewAccount,

//             dashboardUrl: `${appUrl}/learner/access`,
//           }),
//         });
//         console.log("RESEND FULL RESPONSE:", result);

//         if (result.error) {
//           console.error("PURCHASE EMAIL RESEND ERROR:", {
//             name: result.error.name,
//             message: result.error.message,
//           });
//           throw new Error(`Purchase email failed: ${result.error.message}`);
//         } else {
//           console.log("PURCHASE EMAIL SUCCESSFULLY SENT:", {
//             id: result.data?.id,

//             to: user.email,
//           });
//         }
//       } catch (emailError) {
//         console.error("PURCHASE SAVED BUT EMAIL FAILED:", emailError);
//       }

//       return NextResponse.json({
//         received: true,

//         purchaseProcessed: true,

//         userId: user.id,

//         isNewAccount: accountResult.isNewAccount,
//       });
//     }

//     // ========================================================
//     // TUTORING BOOKING
//     // ========================================================

//     const emailPayload = await prisma.$transaction(async (tx) => {
//       // ==================================================
//       // PENDING ENROLLMENT
//       // ==================================================

//       const pendingEnrollment = await tx.pendingEnrollment.findUnique({
//         where: {
//           stripeSessionId: session.id,
//         },
//       });

//       // ==================================================
//       // EMAIL / NAME
//       // ==================================================

//       const finalEmail = pendingEnrollment?.email || email;

//       const finalName = pendingEnrollment?.name || name;

//       if (!finalEmail) {
//         throw new Error("No customer email found.");
//       }

//       // ==================================================
//       // EDUCATOR
//       // ==================================================

//       const targetEducatorId =
//         pendingEnrollment?.educatorId || session.metadata?.educatorId;

//       // ==================================================
//       // SUBJECT
//       // ==================================================

//       const subject =
//         pendingEnrollment?.subject ||
//         session.metadata?.subject ||
//         "Tutoring Session";

//       // ==================================================
//       // GRADE LEVEL
//       // ==================================================

//       const gradeLevel =
//         pendingEnrollment?.gradeLevel || session.metadata?.gradeLevel || "N/A";

//       // ==================================================
//       // TOPIC
//       // ==================================================

//       const topic = pendingEnrollment?.topic || session.metadata?.topic || "";

//       // ==================================================
//       // SESSION DATES
//       // ==================================================

//       let finalStartDate: Date;

//       let finalEndDate: Date;

//       let finalSessionDate: Date;

//       if (pendingEnrollment) {
//         finalStartDate = pendingEnrollment.startTime;

//         finalEndDate = pendingEnrollment.endTime;

//         finalSessionDate = pendingEnrollment.sessionDate;
//       } else if (
//         session.metadata?.sessionDate &&
//         session.metadata?.startTime &&
//         session.metadata?.endTime
//       ) {
//         const sessionDate: string = session.metadata.sessionDate;

//         const startTime: string = session.metadata.startTime;

//         const endTime: string = session.metadata.endTime;

//         finalStartDate = parseDateTime(sessionDate, startTime);

//         finalEndDate = parseDateTime(sessionDate, endTime);

//         finalSessionDate = new Date(sessionDate);
//       } else {
//         throw new Error("Unable to determine tutoring session dates.");
//       }

//       // ==================================================
//       // EDUCATOR
//       // ==================================================

//       let finalEducatorId = targetEducatorId || null;

//       if (finalEducatorId) {
//         const educator = await tx.user.findUnique({
//           where: {
//             id: finalEducatorId,
//           },
//         });

//         if (!educator) {
//           finalEducatorId = null;
//         }
//       }

//       // ==================================================
//       // FALLBACK EDUCATOR
//       // ==================================================

//       if (!finalEducatorId) {
//         const fallback = await tx.user.findFirst({
//           where: {
//             role: "Educator",
//           },
//         });

//         if (!fallback) {
//           throw new Error("No valid educator found.");
//         }

//         finalEducatorId = fallback.id;
//       }

//       // ==================================================
//       // FINAL EDUCATOR ID MUST EXIST
//       // ==================================================

//       const educatorId = finalEducatorId;

//       if (!educatorId) {
//         throw new Error("Unable to determine educator ID.");
//       }

//       const educator = await tx.user.findUnique({
//         where: {
//           id: educatorId,
//         },
//       });

//       const educatorEmail = educator?.email || "";

//       const educatorName = educator?.name || "Educator";

//       // ==================================================
//       // LEARNER
//       // ==================================================

//       const accountResult = await findOrCreateLearner({
//         email: finalEmail,

//         name: finalName,

//         stripeCustomerId,
//       });

//       const user = accountResult.user;

//       // ==================================================
//       // TRANSACTION
//       // ==================================================

//       await tx.transaction.create({
//         data: {
//           userId: user.id,

//           amount: session.amount_total ?? 0,

//           stripeSessionId: session.id,

//           stripePaymentIntentId:
//             typeof session.payment_intent === "string"
//               ? session.payment_intent
//               : null,

//           status: "Paid",
//         },
//       });

//       // ==================================================
//       // APPOINTMENT
//       // ==================================================

//       await tx.appointment.create({
//         data: {
//           learnerId: user.id,

//           educatorId: educatorId,

//           subject,

//           gradeLevel,

//           date: finalSessionDate,

//           startTime: finalStartDate,

//           endTime: finalEndDate,

//           learnerDescription: topic,

//           status: "Scheduled",

//           payoutStatus: "Unpaid",

//           stripeCheckoutSessionId: session.id,
//         },
//       });

//       // ==================================================
//       // UPDATE PENDING ENROLLMENT
//       // ==================================================

//       if (pendingEnrollment) {
//         await tx.pendingEnrollment.update({
//           where: {
//             id: pendingEnrollment.id,
//           },

//           data: {
//             status: "Enrolled",
//           },
//         });
//       }

//       // ==================================================
//       // EMAIL DATA
//       // ==================================================

//       return {
//         learnerEmail: user.email,

//         learnerName: user.name || "Learner",

//         educatorEmail,

//         educatorName,

//         appointmentDetails: {
//           subject,

//           date: finalSessionDate.toLocaleDateString("en-US", {
//             weekday: "long",

//             year: "numeric",

//             month: "long",

//             day: "numeric",
//           }),

//           startTime: finalStartDate.toLocaleTimeString("en-US", {
//             hour: "2-digit",

//             minute: "2-digit",
//           }),

//           endTime: finalEndDate.toLocaleTimeString("en-US", {
//             hour: "2-digit",

//             minute: "2-digit",
//           }),
//         },
//       };
//     });

//     // ========================================================
//     // TUTORING EMAILS
//     // ========================================================

//     try {
//       const {
//         appointmentDetails,
//         learnerName,
//         learnerEmail,
//         educatorEmail,
//         educatorName,
//       } = emailPayload;

//       // ======================================================
//       // LEARNER
//       // ======================================================

//       const LearnerBookingConfirmedEmail = (
//         await import("@/app/_components/LearnerBookingConfirmedEmail")
//       ).default;

//       const learnerResult = await resend.emails.send({
//         from: "Consultations <onboarding@justdy.com>",

//         to: [learnerEmail.trim().toLowerCase()],

//         subject: "Your Tutoring Session Is Confirmed",

//         react: LearnerBookingConfirmedEmail({
//           username: learnerName,

//           subject: appointmentDetails.subject,

//           date: appointmentDetails.date,

//           time: `${appointmentDetails.startTime} - ${appointmentDetails.endTime}`,

//           amountPaid: ((session.amount_total ?? 0) / 100).toFixed(2),

//           verificationUrl: `${appUrl}/learner/products`,
//         }),
//       });

//       if (learnerResult.error) {
//         console.error("LEARNER TUTORING EMAIL ERROR:", learnerResult.error);
//       } else {
//         console.log("LEARNER TUTORING EMAIL SENT:", {
//           id: learnerResult.data?.id,

//           to: learnerEmail,
//         });
//       }

//       // ======================================================
//       // EDUCATOR
//       // ======================================================

//       if (educatorEmail) {
//         const EducatorSessionScheduledEmail = (
//           await import("@/app/_components/EducatorSessionScheduledEmail")
//         ).default;

//         const educatorResult = await resend.emails.send({
//           from: "Consultations <onboarding@justdy.com>",

//           to: [educatorEmail.trim().toLowerCase()],

//           subject: "New Student Session Scheduled",

//           react: EducatorSessionScheduledEmail({
//             educatorName,

//             learnerName,

//             subject: appointmentDetails.subject,

//             date: appointmentDetails.date,

//             time: `${appointmentDetails.startTime} - ${appointmentDetails.endTime}`,
//           }),
//         });

//         if (educatorResult.error) {
//           console.error("EDUCATOR EMAIL ERROR:", educatorResult.error);
//         } else {
//           console.log("EDUCATOR EMAIL SENT:", {
//             id: educatorResult.data?.id,

//             to: educatorEmail,
//           });
//         }
//       }
//     } catch (emailError) {
//       console.error("TUTORING DATABASE SAVED BUT EMAIL FAILED:", emailError);
//     }

//     // ========================================================
//     // TUTORING SUCCESS
//     // ========================================================

//     return NextResponse.json({
//       received: true,

//       tutoringProcessed: true,
//     });
//   } catch (error) {
//     console.error("================================================");

//     console.error("STRIPE WEBHOOK PROCESSING FAILED:", error);

//     console.error("================================================");

//     return new NextResponse("Webhook processing failed", {
//       status: 500,
//     });
//   }
// }
