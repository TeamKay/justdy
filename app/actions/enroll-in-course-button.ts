"use server";

import { requireUser } from "@/app/actions/require-student";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { request } from "@arcjet/next";
import Stripe from "stripe";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  }),
);

export type EnrollmentResponse = {
  status: "success" | "error";
  message?: string;
  checkoutUrl?: string;
};

export async function enrollInCourseAction(
  courseId: string,
): Promise<EnrollmentResponse> {
  const user = await requireUser();

  try {
    // 1. Rate Limiting Check
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: user.id,
    });

    if (decision.isDenied()) {
      return {
        status: "error",
        message: "You have been blocked due to too many requests.",
      };
    }

    // 2. Fetch Course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        price: true,
        slug: true,
        stripePriceId: true,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    // 3. Check for existing active enrollment
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingEnrollment?.status === "Active") {
      return {
        status: "error",
        message: "You are already enrolled in this course",
      };
    }

    // 4. Ensure Stripe Customer ID exists
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    // 5. Upsert Pending Enrollment
    const enrollment = existingEnrollment
      ? await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            amount: course.price,
            status: "Pending",
            updatedAt: new Date(),
          },
        })
      : await prisma.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            amount: course.price,
            status: "Pending",
          },
        });

    // 6. Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: course.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${env.BETTER_AUTH_URL}/payment/success`,
      cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,
      metadata: {
        userId: user.id,
        courseId: course.id,
        enrollmentId: enrollment.id,
      },
    });

    if (!checkoutSession.url) {
      return {
        status: "error",
        message: "Failed to generate checkout session URL.",
      };
    }

    // Return the URL directly to client
    return {
      status: "success",
      checkoutUrl: checkoutSession.url,
    };
  } catch (error) {
    console.error("Enrollment error:", error);
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
//     fixedWindow({
//         mode: 'LIVE',
//         window: '1m',
//         max: 5,
//     })
// )

// export async function enrollInCourseAction(courseId: string): Promise<ApiResponse | never>{
//     const user = await requireUser();

//     let checkoutUrl: string;
//     try{

//         const req = await request();
//         const decision = await aj.protect(req, {
//             fingerprint: user.id,
//         });

//         if(decision.isDenied()){
//             return {
//                 status: 'error',
//                 message: 'You have been blocked',
//             }
//         }
//         const course = await prisma.course.findUnique({
//             where: {
//                 id: courseId,
//             },
//             select: {
//                 id: true,
//                 title: true,
//                 price: true,
//                 slug: true,
//                 stripePriceId: true,
//             },
//         });

//         if(!course){
//             return {
//                 status: 'error',
//                 message: 'Course not found',
//             };
//         }

//         let stripeCustomerId: string;
//         const userWithStripeCustomerId = await prisma.user.findUnique({
//             where: {
//                 id: user.id,
//             },
//             select: {
//                   stripeCustomerId: true,
//             },
//         });

//         if(userWithStripeCustomerId?.stripeCustomerId){
//             stripeCustomerId = userWithStripeCustomerId.stripeCustomerId;
//         }else {

//             const customer = await stripe.customers.create({
//                 email: user.email,
//                 name: user.name,
//                 metadata: {
//                     userId: user.id,
//                 },
//             });

//             stripeCustomerId = customer.id;

//             await prisma.user.update({
//                 where: {
//                     id: user.id,
//                 },
//                 data: {
//                     stripeCustomerId: stripeCustomerId,
//                 },
//             });
//         }

//         const result = await prisma.$transaction(async (tx) => {
//             const existingEnrollment = await tx.enrollment.findUnique({
//                 where: {
//                     userId_courseId: {
//                         userId: user.id,
//                         courseId: courseId,
//                     },
//                 },
//                 select: {
//                     status: true,
//                     id: true,
//                 },
//             });

//             if(existingEnrollment?.status === 'Active'){
//                 return {
//                     status: 'success',
//                     message: 'You are already enrolled in this course',
//                 };
//             }

//             let enrollment;

//             if (existingEnrollment){
//                 enrollment = await tx.enrollment.update({
//                     where: {
//                         id: existingEnrollment.id
//                     },
//                     data: {
//                         amount: course.price,
//                         status: 'Active',
//                         updatedAt: new Date()
//                     },
//                 });
//             }else {
//                 enrollment = await tx.enrollment.create({
//                     data: {
//                         userId: user.id,
//                         courseId: course.id,
//                         amount: course.price,
//                         status: 'Pending',
//                     },
//                 });
//             }

//             const checkoutSession = await stripe.checkout.sessions.create({
//                 customer: stripeCustomerId,
//                 line_items: [
//                     {
//                         price: course.stripePriceId,  //price_1T7nQ7FJyix524XbCh8UWfVK
//                         quantity: 1,
//                     },
//                 ],
//                 mode: "payment",
//                 success_url: `${env.BETTER_AUTH_URL}/payment/success`,
//                 cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,
//                 metadata: {
//                     userId: user.id,
//                     courseId: course.id,
//                     enrollmentId: enrollment.id,
//                 },
//             });

//             return {
//                 enrollment: enrollment,
//                 checkoutUrl: checkoutSession.url,
//             };
//         });

//         checkoutUrl = result.checkoutUrl as string;

//     } catch (error) {
//         if(error instanceof Stripe.errors.StripeError){
//             return {
//                 status: 'error',
//                 message: 'Payment system error. Please try again'
//             }
//         }
//         return {
//             status: 'error',
//             message: 'Failed to enroll in course'
//         }
//     }

//     redirect(checkoutUrl)
// }
