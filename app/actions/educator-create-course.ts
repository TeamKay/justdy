"use server";

import arcjet, { fixedWindow } from "@/lib/arcjet";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { ApiResponse } from "@/lib/types";
import {courseSchema, CourseSchemaType} from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { requireEducator } from "./require-educator";

const aj = arcjet.withRule(
    fixedWindow({
        mode: "LIVE",
        window: "1m",
        max: 5,
    })
)

export async function CreateCourse(values: CourseSchemaType): Promise<ApiResponse>{
        const session = await requireEducator();

    try {
        const req = await request();
       const decision = await aj.protect(req, {
            fingerprint: session.user.id,
       });

       if (decision.isDenied()){
            if(decision.reason.isRateLimit()){
                return {
                    status: "error",
                    message: "You have exceeded the number of allowed requests. Please try again later.",
                };
            } else {
                return {
                    status: "error",
                    message: "You are a bot! If this is a mistake, please contact support.",
                }
            }
       }

        const validation = courseSchema.safeParse(values);

        if(!validation.success) {
            return {
                status: "error",
                message: "Invalid Form Data",
            };
        }

        if (validation.data.status === "Pending" && validation.data.price <= 0) {
            return {
                status: "error",
                message: "You must set a price greater than $0 to submit for review."
            }
        }
      const stripeProduct = await stripe.products.create({
        name: validation.data.title,
        description: validation.data.smallDescription,
        default_price_data: {
            currency: 'usd',
            unit_amount: Math.round(validation.data.price * 100),
        },
      });

      await prisma.course.create({
            data: {
                ...validation.data,
                userId: session?.user.id as string,
                stripePriceId: stripeProduct.default_price as string,
            },
        });

        return {
            status: "success",
            message: "Course Created Successfully",
        };
    } catch {
        console.error("SERVER ACTION ERROR:");
    return {
        status: 'error',
        message: 'Failed to create course',
    };

}
}