"use server";

import { requireUser } from "@/app/actions/require-student";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { redirect } from "next/navigation";
import Stripe from "stripe";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  }),
);

export async function enrollInCourseAction(
  productId: string,
): Promise<ApiResponse | never> {
  const user = await requireUser();

  let checkoutUrl: string;

  try {
    // ============================================================
    // 1. ARCJET PROTECTION
    // ============================================================

    const req = await request();

    const decision = await aj.protect(req, {
      fingerprint: user.id,
    });

    if (decision.isDenied()) {
      return {
        status: "error",
        message: "You have been blocked",
      };
    }

    // ============================================================
    // 2. GET PRODUCT
    // ============================================================
    //
    // A course is now a Product with type = "Course".
    //
    // The database is the source of truth for:
    // - product identity
    // - price
    // - Stripe Price ID
    //
    // ============================================================

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        title: true,
        price: true,
        type: true,
        status: true,
        stripePriceId: true,
      },
    });

    // ============================================================
    // 3. VALIDATE PRODUCT
    // ============================================================

    if (!product) {
      return {
        status: "error",
        message: "This product does not exist",
      };
    }

    if (product.type !== "Course") {
      return {
        status: "error",
        message: "This product is not a course",
      };
    }

    if (product.status !== "Published") {
      return {
        status: "error",
        message: "This course is not currently available",
      };
    }

    if (product.price < 0) {
      return {
        status: "error",
        message: "Invalid course price",
      };
    }

    // ============================================================
    // 4. FREE COURSE
    // ============================================================
    //
    // Free courses don't need Stripe Checkout.
    //
    // ============================================================

    if (product.price === 0) {
      await prisma.enrollment.upsert({
        where: {
          userId_productId: {
            userId: user.id,
            productId: product.id,
          },
        },
        update: {
          amount: 0,
          status: "Active",
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          productId: product.id,
          amount: 0,
          status: "Active",
        },
      });

      return {
        status: "success",
        message: "You are now enrolled in this course",
      };
    }

    // ============================================================
    // 5. REQUIRE STRIPE PRICE
    // ============================================================

    if (!product.stripePriceId) {
      console.error(`Course ${product.id} does not have a Stripe Price ID.`);

      return {
        status: "error",
        message:
          "This course is not currently configured for payment. Please try again later.",
      };
    }

    // IMPORTANT:
    //
    // After the null check above, TypeScript knows that this
    // local variable is a string.
    //
    // This avoids:
    //
    // Type 'string | null' is not assignable to type
    // 'string | undefined'.
    //
    const stripePriceId = product.stripePriceId;

    // ============================================================
    // 6. GET OR CREATE STRIPE CUSTOMER
    // ============================================================

    let stripeCustomerId: string;

    const userWithStripeCustomerId = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        stripeCustomerId: true,
      },
    });

    if (userWithStripeCustomerId?.stripeCustomerId) {
      stripeCustomerId = userWithStripeCustomerId.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          stripeCustomerId,
        },
      });
    }

    // ============================================================
    // 7. VERIFY STRIPE PRICE
    // ============================================================
    //
    // The database remains authoritative for the amount.
    //
    // We only verify that the Stripe Price referenced by the
    // database still exists and is active.
    //
    // We intentionally DO NOT use stripePrice.unit_amount as
    // the course price.
    //
    // ============================================================

    let stripePrice: Stripe.Price;

    try {
      stripePrice = await stripe.prices.retrieve(stripePriceId);
    } catch (error) {
      console.error(
        `Stripe Price ${stripePriceId} could not be retrieved for product ${product.id}:`,
        error,
      );

      return {
        status: "error",
        message:
          "This course is temporarily unavailable for payment. Please try again later.",
      };
    }

    if (!stripePrice.active) {
      console.error(`Stripe Price ${stripePriceId} is inactive.`);

      return {
        status: "error",
        message:
          "This course is temporarily unavailable for payment. Please try again later.",
      };
    }

    // ============================================================
    // 8. CREATE / REUSE ENROLLMENT
    // ============================================================

    const result = await prisma.$transaction(async (tx) => {
      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId: product.id,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      // --------------------------------------------------------
      // Already enrolled
      // --------------------------------------------------------

      if (existingEnrollment?.status === "Active") {
        return {
          alreadyEnrolled: true,
          checkoutUrl: null,
        };
      }

      // --------------------------------------------------------
      // Reuse existing enrollment
      // --------------------------------------------------------

      let enrollment;

      if (existingEnrollment) {
        enrollment = await tx.enrollment.update({
          where: {
            id: existingEnrollment.id,
          },
          data: {
            amount: product.price,
            status: "Pending",
            updatedAt: new Date(),
          },
        });
      } else {
        enrollment = await tx.enrollment.create({
          data: {
            userId: user.id,
            productId: product.id,
            amount: product.price,
            status: "Pending",
          },
        });
      }

      // ========================================================
      // 9. CREATE STRIPE CHECKOUT SESSION
      // ========================================================

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,

        line_items: [
          {
            // Use the validated database Stripe Price ID.
            price: stripePriceId,
            quantity: 1,
          },
        ],

        mode: "payment",

        success_url:
          `${env.BETTER_AUTH_URL}/payment/success` +
          "?session_id={CHECKOUT_SESSION_ID}",

        cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,

        metadata: {
          userId: user.id,
          productId: product.id,
          enrollmentId: enrollment.id,
        },

        client_reference_id: enrollment.id,
      });

      if (!checkoutSession.url) {
        throw new Error("Stripe did not return a checkout URL.");
      }

      return {
        alreadyEnrolled: false,
        checkoutUrl: checkoutSession.url,
      };
    });

    // ============================================================
    // 10. ALREADY ENROLLED
    // ============================================================

    if (result.alreadyEnrolled) {
      return {
        status: "success",
        message: "You are already enrolled in this course",
      };
    }

    // ============================================================
    // 11. VALIDATE CHECKOUT URL
    // ============================================================

    if (!result.checkoutUrl) {
      return {
        status: "error",
        message: "Unable to create payment session",
      };
    }

    checkoutUrl = result.checkoutUrl;
  } catch (error) {
    console.error("ENROLLMENT / CHECKOUT ERROR:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return {
        status: "error",
        message: "Payment system error. Please try again.",
      };
    }

    return {
      status: "error",
      message: "Failed to enroll in course",
    };
  }

  // ============================================================
  // 12. REDIRECT TO STRIPE
  // ============================================================

  redirect(checkoutUrl);
}

// "use server";

// import { requireUser } from "@/app/actions/require-student";
// import arcjet, { fixedWindow } from "@/lib/arcjet";

// import { env } from "@/lib/env";
// import prisma from "@/lib/prisma";
// import { stripe } from "@/lib/stripe";
// import { ApiResponse } from "@/lib/types";
// import { request } from "@arcjet/next";
// import { redirect } from "next/navigation";
// import Stripe from "stripe";

// const aj = arcjet.withRule(
//   fixedWindow({
//     mode: "LIVE",
//     window: "1m",
//     max: 5,
//   }),
// );

// export async function enrollInCourseAction(
//   productId: string,
// ): Promise<ApiResponse | never> {
//   const user = await requireUser();

//   let checkoutUrl: string;
//   try {
//     const req = await request();
//     const decision = await aj.protect(req, {
//       fingerprint: user.id,
//     });

//     if (decision.isDenied()) {
//       return {
//         status: "error",
//         message: "You have been blocked",
//       };
//     }
//     const product = await prisma.product.findUnique({
//       where: {
//         id: productId,
//       },
//       select: {
//         id: true,
//         title: true,
//         price: true,
//         slug: true,
//       },
//     });

//     if (!product) {
//       return {
//         status: "error",
//         message: "Course not found",
//       };
//     }

//     let stripeCustomerId: string;
//     const userWithStripeCustomerId = await prisma.user.findUnique({
//       where: {
//         id: user.id,
//       },
//       select: {
//         stripeCustomerId: true,
//       },
//     });

//     if (userWithStripeCustomerId?.stripeCustomerId) {
//       stripeCustomerId = userWithStripeCustomerId.stripeCustomerId;
//     } else {
//       const customer = await stripe.customers.create({
//         email: user.email,
//         name: user.name,
//         metadata: {
//           userId: user.id,
//         },
//       });

//       stripeCustomerId = customer.id;

//       await prisma.user.update({
//         where: {
//           id: user.id,
//         },
//         data: {
//           stripeCustomerId: stripeCustomerId,
//         },
//       });
//     }

//     const result = await prisma.$transaction(async (tx) => {
//       const existingEnrollment = await tx.enrollment.findUnique({
//         where: {
//           userId_productId: {
//             userId: user.id,
//             productId: productId,
//           },
//         },
//         select: {
//           status: true,
//           id: true,
//         },
//       });

//       if (existingEnrollment?.status === "Active") {
//         return {
//           status: "success",
//           message: "You are already enrolled in this course",
//         };
//       }

//       let enrollment;

//       if (existingEnrollment) {
//         enrollment = await tx.enrollment.update({
//           where: {
//             id: existingEnrollment.id,
//           },
//           data: {
//             amount: product.price,
//             status: "Active",
//             updatedAt: new Date(),
//           },
//         });
//       } else {
//         enrollment = await tx.enrollment.create({
//           data: {
//             userId: user.id,
//             productId: product.id,
//             amount: product.price,
//             status: "Pending",
//           },
//         });
//       }

//       const checkoutSession = await stripe.checkout.sessions.create({
//         customer: stripeCustomerId,
//         line_items: [
//           {
//             price: "price_1Sw0aAF115MtVFXmLp59jfXF",
//             quantity: 1,
//           },
//         ],
//         mode: "payment",
//         success_url: `${env.BETTER_AUTH_URL}/payment/success`,
//         cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,
//         metadata: {
//           userId: user.id,
//           productId: product.id,
//           enrollmentId: enrollment.id,
//         },
//       });

//       return {
//         enrollment: enrollment,
//         checkoutUrl: checkoutSession.url,
//       };
//     });

//     checkoutUrl = result.checkoutUrl as string;
//   } catch (error) {
//     if (error instanceof Stripe.errors.StripeError) {
//       return {
//         status: "error",
//         message: "Payment system error. Please try again",
//       };
//     }
//     return {
//       status: "error",
//       message: "Failed to enroll in course",
//     };
//   }

//   redirect(checkoutUrl);
// }
