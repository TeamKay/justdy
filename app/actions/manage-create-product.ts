"use server";

import arcjet, { fixedWindow } from "@/lib/arcjet";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { productSchema, ProductSchemaType } from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { requireManager } from "./require-manager";
import { ProductStatus, ProductType } from "@/lib/generated/prisma/enums";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  }),
);

export async function CreateProduct(
  values: ProductSchemaType,
): Promise<ApiResponse> {
  const session = await requireManager();

  try {
    // ============================================================
    // 1. RATE LIMITING
    // ============================================================

    const req = await request();

    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message:
            "You have exceeded the number of allowed requests. Please try again later.",
        };
      }

      return {
        status: "error",
        message: "Action forbidden.",
      };
    }

    // ============================================================
    // 2. VALIDATE FORM DATA
    // ============================================================

    const validation = productSchema.safeParse(values);

    if (!validation.success) {
      console.error("Product validation failed:", validation.error.flatten());

      return {
        status: "error",
        message: "Invalid Form Data",
      };
    }

    const data = validation.data;

    // ============================================================
    // 3. VALIDATE DIGITAL PRICE
    // ============================================================

    if (!Number.isFinite(data.price) || data.price < 0) {
      return {
        status: "error",
        message: "Invalid product price.",
      };
    }

    if (data.status === "Pending" && data.price <= 0) {
      return {
        status: "error",
        message: "You must set a price greater than $0 to submit for review.",
      };
    }

    // ============================================================
    // 4. CONVERT DIGITAL PRICE TO CENTS
    // ============================================================
    //
    // Form:
    //
    // 19.99
    //
    // Database:
    //
    // 1999
    //
    // ============================================================

    const priceInCents = Math.round(data.price * 100);

    if (!Number.isFinite(priceInCents) || priceInCents < 0) {
      return {
        status: "error",
        message: "Invalid product price.",
      };
    }

    // ============================================================
    // 5. CONVERT PRINTED PRICE TO CENTS
    // ============================================================
    //
    // Courses do not have a printed price.
    //
    // Other product types may optionally have one.
    //
    // Example:
    //
    // 24.99 -> 2499
    //
    // ============================================================

    let printedPriceInCents: number | null = null;

    if (data.type !== "Course") {
      if (data.printedPrice !== undefined && data.printedPrice !== null) {
        const printedPrice = Number(data.printedPrice);

        if (!Number.isFinite(printedPrice) || printedPrice < 0) {
          return {
            status: "error",
            message: "Invalid printed product price.",
          };
        }

        printedPriceInCents = Math.round(printedPrice * 100);
      }
    }

    // ============================================================
    // 6. VALIDATE PRINTED PRICE
    // ============================================================
    //
    // If a printed version exists, it should normally cost
    // more than the digital version.
    //
    // You can remove this validation if you want to allow
    // printed products to be cheaper.
    //
    // ============================================================

    if (printedPriceInCents !== null && printedPriceInCents < priceInCents) {
      return {
        status: "error",
        message: "Printed price cannot be lower than the digital price.",
      };
    }

    // ============================================================
    // 7. CREATE PRODUCT IN DATABASE
    // ============================================================
    //
    // IMPORTANT:
    //
    // Stripe is NOT involved here.
    //
    // Prisma is the source of truth for product pricing.
    //
    // Stripe Checkout will create a dynamic Price using
    // the current database price when the customer checks out.
    //
    // ============================================================

    const product = await prisma.product.create({
      data: {
        title: data.title,

        // Keep the complete rich-text HTML.
        description: data.description,

        // Digital price stored in cents.
        price: priceInCents,

        // Printed price stored in cents.
        //
        // Courses always receive null.
        printedPrice: data.type === "Course" ? null : printedPriceInCents,

        slug: data.slug,

        type: data.type as ProductType,

        status: data.status as ProductStatus,

        userId: session.user.id,
      },

      select: {
        id: true,
        title: true,
        price: true,
        printedPrice: true,
        type: true,
        status: true,
      },
    });

    // ============================================================
    // 8. SUCCESS
    // ============================================================

    console.log("PRODUCT CREATED:", {
      id: product.id,
      title: product.title,
      type: product.type,
      priceInCents: product.price,
      printedPriceInCents: product.printedPrice,
      status: product.status,
    });

    return {
      status: "success",
      message: "Product Created Successfully",
    };
  } catch (error) {
    console.error("SERVER ACTION ERROR:", error);

    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

// "use server";

// import arcjet, { fixedWindow } from "@/lib/arcjet";
// import prisma from "@/lib/prisma";
// import { ApiResponse } from "@/lib/types";
// import { productSchema, ProductSchemaType } from "@/lib/zodSchemas";
// import { request } from "@arcjet/next";
// import { requireManager } from "./require-manager";
// import { ProductStatus, ProductType } from "@/lib/generated/prisma/enums";

// const aj = arcjet.withRule(
//   fixedWindow({
//     mode: "LIVE",
//     window: "1m",
//     max: 5,
//   }),
// );

// export async function CreateProduct(
//   values: ProductSchemaType,
// ): Promise<ApiResponse> {
//   const session = await requireManager();

//   try {
//     // ============================================================
//     // 1. RATE LIMITING
//     // ============================================================

//     const req = await request();

//     const decision = await aj.protect(req, {
//       fingerprint: session.user.id,
//     });

//     if (decision.isDenied()) {
//       if (decision.reason.isRateLimit()) {
//         return {
//           status: "error",
//           message:
//             "You have exceeded the number of allowed requests. Please try again later.",
//         };
//       }

//       return {
//         status: "error",
//         message: "Action forbidden.",
//       };
//     }

//     // ============================================================
//     // 2. VALIDATE FORM DATA
//     // ============================================================

//     const validation = productSchema.safeParse(values);

//     if (!validation.success) {
//       console.error("Product validation failed:", validation.error);

//       return {
//         status: "error",
//         message: "Invalid Form Data",
//       };
//     }

//     // ============================================================
//     // 3. VALIDATE PRICE
//     // ============================================================

//     if (validation.data.status === "Pending" && validation.data.price <= 0) {
//       return {
//         status: "error",
//         message: "You must set a price greater than $0 to submit for review.",
//       };
//     }

//     // ============================================================
//     // 4. CONVERT PRICE TO CENTS
//     // ============================================================
//     //
//     // Example:
//     //
//     // 19.99 -> 1999
//     // 12.99 -> 1299
//     // 5.00  -> 500
//     //
//     // Your database stores prices in cents.
//     //
//     // ============================================================

//     const priceInCents = Math.round(validation.data.price * 100);

//     if (!Number.isFinite(priceInCents) || priceInCents < 0) {
//       return {
//         status: "error",
//         message: "Invalid product price.",
//       };
//     }

//     // ============================================================
//     // 5. CREATE PRODUCT IN DATABASE
//     // ============================================================
//     //
//     // IMPORTANT:
//     //
//     // We DO NOT create a Stripe Product here.
//     //
//     // We DO NOT create a Stripe Price here.
//     //
//     // Prisma is now the source of truth for:
//     //
//     //   - Product title
//     //   - Product description
//     //   - Product price
//     //   - Product type
//     //   - Product status
//     //
//     // Stripe will receive the CURRENT price dynamically
//     // when the customer checks out.
//     //
//     // ============================================================

//     await prisma.product.create({
//       data: {
//         title: validation.data.title,

//         // Keep the complete rich-text HTML in your database.
//         description: validation.data.description,

//         // Store price in cents.
//         price: priceInCents,

//         slug: validation.data.slug,

//         type: validation.data.type as ProductType,

//         status: validation.data.status as ProductStatus,

//         userId: session.user.id,

//         // IMPORTANT:
//         // No stripePriceId is required anymore.
//         //
//         // Stripe Checkout will use price_data dynamically.
//       },
//     });

//     return {
//       status: "success",
//       message: "Product Created Successfully",
//     };
//   } catch (error) {
//     console.error("SERVER ACTION ERROR:", error);

//     return {
//       status: "error",
//       message:
//         error instanceof Error ? error.message : "Failed to create product",
//     };
//   }
// }

// "use server";

// import arcjet, { fixedWindow } from "@/lib/arcjet";
// import prisma from "@/lib/prisma";
// import { stripe } from "@/lib/stripe";
// import { ApiResponse } from "@/lib/types";
// import { productSchema, ProductSchemaType } from "@/lib/zodSchemas";
// import { request } from "@arcjet/next";
// import { requireManager } from "./require-manager";
// import { ProductStatus, ProductType } from "@/lib/generated/prisma/enums";

// const aj = arcjet.withRule(
//   fixedWindow({
//     mode: "LIVE",
//     window: "1m",
//     max: 5,
//   }),
// );

// export async function CreateProduct(
//   values: ProductSchemaType,
// ): Promise<ApiResponse> {
//   const session = await requireManager();

//   try {
//     // ============================================================
//     // 1. RATE LIMITING
//     // ============================================================

//     const req = await request();

//     const decision = await aj.protect(req, {
//       fingerprint: session.user.id,
//     });

//     if (decision.isDenied()) {
//       if (decision.reason.isRateLimit()) {
//         return {
//           status: "error",
//           message:
//             "You have exceeded the number of allowed requests. Please try again later.",
//         };
//       }

//       return {
//         status: "error",
//         message: "Action forbidden.",
//       };
//     }

//     // ============================================================
//     // 2. VALIDATE FORM DATA
//     // ============================================================

//     const validation = productSchema.safeParse(values);

//     if (!validation.success) {
//       return {
//         status: "error",
//         message: "Invalid Form Data",
//       };
//     }

//     // ============================================================
//     // 3. VALIDATE PRICE
//     // ============================================================

//     if (validation.data.status === "Pending" && validation.data.price <= 0) {
//       return {
//         status: "error",
//         message: "You must set a price greater than $0 to submit for review.",
//       };
//     }

//     const priceInCents = Math.round(validation.data.price * 100);

//     // ============================================================
//     // 4. CREATE STRIPE PRODUCT
//     // ============================================================
//     //
//     // IMPORTANT:
//     // We intentionally DO NOT send the rich-text description
//     // to Stripe.
//     //
//     // Your Prisma database will keep the full HTML description.
//     //
//     // Stripe will use:
//     //   - Product name
//     //   - Product image(s)
//     //   - Product price
//     //
//     // This gives you a much cleaner Stripe Checkout page.
//     //
//     // ============================================================

//     const stripeProduct = await stripe.products.create({
//       name: validation.data.title,

//       default_price_data: {
//         currency: "usd",
//         unit_amount: priceInCents,
//       },
//     });

//     // ============================================================
//     // 5. SAVE PRODUCT TO DATABASE
//     // ============================================================

//     await prisma.product.create({
//       data: {
//         title: validation.data.title,

//         // IMPORTANT:
//         // Keep the rich HTML description in your database.
//         description: validation.data.description,

//         // Store price in cents.
//         price: priceInCents,

//         slug: validation.data.slug,

//         type: validation.data.type as ProductType,

//         status: validation.data.status as ProductStatus,

//         userId: session.user.id,

//         // Stripe returns the default Price ID here.
//         stripePriceId: stripeProduct.default_price as string,
//       },
//     });

//     return {
//       status: "success",
//       message: "Product Created Successfully",
//     };
//   } catch (error) {
//     console.error("SERVER ACTION ERROR:", error);

//     return {
//       status: "error",
//       message:
//         error instanceof Error ? error.message : "Failed to create product",
//     };
//   }
// }
