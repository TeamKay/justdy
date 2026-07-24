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

    // 1. Fetch Product along with its relation to Course
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        title: true,
        price: true,
        type: true,
        course: {
          select: {
            id: true,
          },
        },
      },
    });

    // 2. Validate product existence and make sure it's a Course
    if (!product || product.type !== "Course" || !product.course) {
      return {
        status: "error",
        message: "This product is not a course or does not exist",
      };
    }

    const courseId = product.course.id;

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
          stripeCustomerId: stripeCustomerId,
        },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 3. Query Enrollment using the correct compound index: userId_courseId
      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: courseId,
          },
        },
        select: {
          status: true,
          id: true,
        },
      });

      if (existingEnrollment?.status === "Active") {
        return {
          status: "success",
          message: "You are already enrolled in this course",
        };
      }

      let enrollment;

      if (existingEnrollment) {
        enrollment = await tx.enrollment.update({
          where: {
            id: existingEnrollment.id,
          },
          data: {
            amount: product.price,
            status: "Active",
            updatedAt: new Date(),
          },
        });
      } else {
        // 4. Create Enrollment linked to courseId
        enrollment = await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: courseId,
            amount: product.price,
            status: "Pending",
          },
        });
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [
          {
            price: "price_1Sw0aAF115MtVFXmLp59jfXF",
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${env.BETTER_AUTH_URL}/payment/success`,
        cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,
        metadata: {
          userId: user.id,
          productId: product.id,
          courseId: courseId,
          enrollmentId: enrollment.id,
        },
      });

      return {
        enrollment: enrollment,
        checkoutUrl: checkoutSession.url,
      };
    });

    checkoutUrl = result.checkoutUrl as string;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      return {
        status: "error",
        message: "Payment system error. Please try again",
      };
    }
    return {
      status: "error",
      message: "Failed to enroll in course",
    };
  }

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
