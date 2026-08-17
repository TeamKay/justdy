"use server";

import arcjet, { fixedWindow } from "@/lib/arcjet";

import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

import { request } from "@arcjet/next";

import Stripe from "stripe";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ============================================================
// ARCJET
// ============================================================

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  }),
);

// ============================================================
// TYPES
// ============================================================

export type CheckoutCartItem = {
  productId: string;
  quantity: number;
};

export type CheckoutResponse = {
  status: "success" | "error";
  message?: string;
  checkoutUrl?: string;
};

// ============================================================
// CREATE CHECKOUT SESSION
// ============================================================

export async function createCheckoutSessionAction(
  cartItems: CheckoutCartItem[],
): Promise<CheckoutResponse> {
  try {
    // ==========================================================
    // 1. REQUEST
    // ==========================================================

    const req = await request();

    // ==========================================================
    // 2. AUTH SESSION
    // ==========================================================

    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    // ==========================================================
    // 3. GET USER FROM DATABASE
    // ==========================================================

    const user = authSession?.user
      ? await prisma.user.findUnique({
          where: {
            id: authSession.user.id,
          },

          select: {
            id: true,
            email: true,
            name: true,
            stripeCustomerId: true,
            role: true,
          },
        })
      : null;

    // ==========================================================
    // 4. ARCJET
    // ==========================================================

    const decision = await aj.protect(req, {
      fingerprint: user?.id ?? "guest",
    });

    if (decision.isDenied()) {
      return {
        status: "error",
        message: "You have been blocked due to too many requests.",
      };
    }

    // ==========================================================
    // 5. VALIDATE CART
    // ==========================================================

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return {
        status: "error",
        message: "Your cart is empty.",
      };
    }

    // ==========================================================
    // 6. NORMALIZE CART
    // ==========================================================

    const quantityMap = new Map<string, number>();

    for (const item of cartItems) {
      if (
        !item ||
        typeof item.productId !== "string" ||
        !item.productId.trim()
      ) {
        continue;
      }

      const productId = item.productId.trim();

      const quantity = Math.max(
        1,
        Math.min(100, Math.floor(Number(item.quantity) || 1)),
      );

      const existing = quantityMap.get(productId) ?? 0;

      quantityMap.set(productId, Math.min(100, existing + quantity));
    }

    if (quantityMap.size === 0) {
      return {
        status: "error",
        message: "Your cart contains no valid products.",
      };
    }

    const productIds = Array.from(quantityMap.keys());

    // ==========================================================
    // 7. DATABASE PRODUCTS
    // ==========================================================

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },

      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        type: true,
        status: true,
        imageKey: true,

        images: {
          orderBy: {
            position: "asc",
          },

          select: {
            imageKey: true,
            position: true,
          },
        },
      },
    });

    // ==========================================================
    // 8. CHECK MISSING PRODUCTS
    // ==========================================================

    if (products.length !== productIds.length) {
      return {
        status: "error",
        message: "One or more products in your cart are no longer available.",
      };
    }

    // ==========================================================
    // 9. CHECK STATUS
    // ==========================================================

    const unavailable = products.find(
      (product) => product.status !== "Published",
    );

    if (unavailable) {
      return {
        status: "error",
        message: `"${unavailable.title}" is not currently available for purchase.`,
      };
    }

    // ==========================================================
    // 10. CHECK PRICES
    // ==========================================================

    for (const product of products) {
      const price = Number(product.price);

      if (!Number.isInteger(price) || price < 0) {
        return {
          status: "error",
          message: `"${product.title}" has an invalid price.`,
        };
      }
    }

    // ==========================================================
    // 11. PREVENT DUPLICATE COURSE PURCHASE
    // ==========================================================

    if (user) {
      const courses = products.filter((product) => product.type === "Course");

      for (const course of courses) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_productId: {
              userId: user.id,
              productId: course.id,
            },
          },

          select: {
            status: true,
          },
        });

        if (enrollment?.status === "Active") {
          return {
            status: "error",
            message: `You are already enrolled in "${course.title}".`,
          };
        }
      }
    }

    // ==========================================================
    // 12. CREATE STRIPE LINE ITEMS
    // ==========================================================

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      products.map((product) => {
        const quantity = quantityMap.get(product.id) ?? 1;

        const imageKey =
          product.type === "Course"
            ? product.imageKey?.trim()
            : product.images?.[0]?.imageKey?.trim();

        let imageUrl: string | undefined;

        if (imageKey) {
          if (
            imageKey.startsWith("http://") ||
            imageKey.startsWith("https://")
          ) {
            imageUrl = imageKey;
          } else {
            imageUrl = `https://utfs.io/f/${imageKey}`;
          }
        }

        return {
          price_data: {
            currency: "usd",

            unit_amount: Number(product.price),

            product_data: {
              name: product.title,

              ...(imageUrl
                ? {
                    images: [imageUrl],
                  }
                : {}),

              metadata: {
                productId: product.id,
                productType: product.type,
                source: "Justdy",
              },
            },
          },

          quantity,
        };
      });

    // ==========================================================
    // 13. TOTAL QUANTITY
    // ==========================================================

    const totalQuantity = Array.from(quantityMap.values()).reduce(
      (total, quantity) => total + quantity,
      0,
    );

    // ==========================================================
    // 14. APP URL
    // ==========================================================

    const appUrl = env.BETTER_AUTH_URL.replace(/\/$/, "");

    // ==========================================================
    // 15. SESSION PARAMETERS
    // ==========================================================

    const params: Stripe.Checkout.SessionCreateParams = {
      line_items: lineItems,
      mode: "payment",
      payment_method_types: ["card"],

      name_collection: {
        individual: {
          enabled: true,
          optional: false,
        },
      },

      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/cancel`,

      metadata: {
        purchaseType: "product",
        itemCount: String(products.length),
        totalQuantity: String(totalQuantity),
        userId: user?.id ?? "",
      },
    };

    // ==========================================================
    // 16. CUSTOMER
    // ==========================================================

    if (user) {
      if (user.stripeCustomerId) {
        params.customer = user.stripeCustomerId;
        params.customer_update = {
          name: "auto",
        };
      } else if (user.email) {
        params.customer_email = user.email;
        params.customer_creation = "always";
      }
    } else {
      params.customer_creation = "always";
    }

    // ==========================================================
    // 17. LOG CHECKOUT
    // ==========================================================

    console.log("CREATING PRODUCT CHECKOUT:", {
      userId: user?.id ?? null,
      email: user?.email ?? null,
      guest: !user,
      products: productIds,
      totalQuantity,
    });

    // ==========================================================
    // 18. CREATE STRIPE SESSION
    // ==========================================================

    const checkoutSession = await stripe.checkout.sessions.create(params);

    // ==========================================================
    // 19. CHECK CHECKOUT URL
    // ==========================================================

    if (!checkoutSession.url) {
      return {
        status: "error",
        message: "Failed to generate checkout session URL.",
      };
    }

    // ==========================================================
    // 20. LOG CREATED SESSION
    // ==========================================================

    console.log("CHECKOUT CREATED:", {
      sessionId: checkoutSession.id,
    });

    // ==========================================================
    // 21. RETURN CHECKOUT URL
    // ==========================================================

    return {
      status: "success",
      checkoutUrl: checkoutSession.url,
    };
  } catch (error) {
    // ==========================================================
    // ERROR HANDLING
    // ==========================================================

    console.error("CHECKOUT SESSION CREATION ERROR:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return {
        status: "error",
        message: `Stripe error: ${error.message}`,
      };
    }

    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to process checkout.",
    };
  }
}

// "use server";

// import arcjet, { fixedWindow } from "@/lib/arcjet";
// import { env } from "@/lib/env";
// import prisma from "@/lib/prisma";
// import { stripe } from "@/lib/stripe";
// import { request } from "@arcjet/next";
// import Stripe from "stripe";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";

// const aj = arcjet.withRule(
//   fixedWindow({
//     mode: "LIVE",
//     window: "1m",
//     max: 10,
//   }),
// );

// export type CheckoutCartItem = {
//   productId: string;
//   quantity: number;
// };

// export type CheckoutResponse = {
//   status: "success" | "error";
//   message?: string;
//   checkoutUrl?: string;
// };

// export async function createCheckoutSessionAction(
//   cartItems: CheckoutCartItem[],
// ): Promise<CheckoutResponse> {
//   try {
//     // ============================================================
//     // 1. REQUEST + USER
//     // ============================================================

//     const req = await request();

//     const session = await auth.api.getSession({
//       headers: await headers(),
//     });

//     const user = session?.user
//       ? await prisma.user.findUnique({
//           where: {
//             id: session.user.id,
//           },
//           select: {
//             id: true,
//             email: true,
//             name: true,
//             stripeCustomerId: true,
//           },
//         })
//       : null;

//     // ============================================================
//     // 2. RATE LIMIT
//     // ============================================================

//     const decision = await aj.protect(req, {
//       fingerprint: user?.id ?? "guest",
//     });

//     if (decision.isDenied()) {
//       return {
//         status: "error",
//         message: "You have been blocked due to too many requests.",
//       };
//     }

//     // ============================================================
//     // 3. VALIDATE CART
//     // ============================================================

//     if (!Array.isArray(cartItems) || cartItems.length === 0) {
//       return {
//         status: "error",
//         message: "Your cart is empty.",
//       };
//     }

//     // ============================================================
//     // 4. NORMALIZE QUANTITIES
//     // ============================================================

//     const quantityMap = new Map<string, number>();

//     for (const item of cartItems) {
//       if (
//         !item ||
//         typeof item.productId !== "string" ||
//         !item.productId.trim()
//       ) {
//         continue;
//       }

//       const quantity = Math.max(
//         1,
//         Math.min(100, Math.floor(Number(item.quantity) || 1)),
//       );

//       const currentQuantity = quantityMap.get(item.productId) ?? 0;

//       quantityMap.set(
//         item.productId,
//         Math.min(100, currentQuantity + quantity),
//       );
//     }

//     if (quantityMap.size === 0) {
//       return {
//         status: "error",
//         message: "Your cart contains no valid products.",
//       };
//     }

//     const productIds = Array.from(quantityMap.keys());

//     // ============================================================
//     // 5. GET PRODUCTS FROM DATABASE
//     // ============================================================

//     const products = await prisma.product.findMany({
//       where: {
//         id: {
//           in: productIds,
//         },
//       },

//       select: {
//         id: true,
//         title: true,
//         price: true,
//         type: true,
//         status: true,
//         imageKey: true,

//         images: {
//           orderBy: {
//             position: "asc",
//           },

//           select: {
//             imageKey: true,
//             position: true,
//           },
//         },
//       },
//     });

//     // ============================================================
//     // 6. VERIFY PRODUCTS
//     // ============================================================

//     if (products.length !== productIds.length) {
//       const foundIds = new Set(products.map((product) => product.id));

//       const missingProducts = productIds.filter((id) => !foundIds.has(id));

//       console.error("Products missing from checkout:", missingProducts);

//       return {
//         status: "error",
//         message: "One or more products in your cart are no longer available.",
//       };
//     }

//     // ============================================================
//     // 7. VERIFY STATUS
//     // ============================================================

//     const unavailableProduct = products.find(
//       (product) => product.status !== "Published",
//     );

//     if (unavailableProduct) {
//       return {
//         status: "error",
//         message: `"${unavailableProduct.title}" is not currently available for purchase.`,
//       };
//     }

//     // ============================================================
//     // 8. VERIFY PRICES
//     // ============================================================

//     for (const product of products) {
//       const price = Number(product.price);

//       if (!Number.isInteger(price) || price < 0) {
//         return {
//           status: "error",
//           message: `"${product.title}" has an invalid price.`,
//         };
//       }
//     }

//     // ============================================================
//     // 9. PREVENT DUPLICATE COURSE PURCHASES FOR SIGNED-IN USERS
//     // ============================================================

//     if (user) {
//       const courseProducts = products.filter(
//         (product) => product.type === "Course",
//       );

//       for (const course of courseProducts) {
//         const existingEnrollment = await prisma.enrollment.findUnique({
//           where: {
//             userId_productId: {
//               userId: user.id,
//               productId: course.id,
//             },
//           },

//           select: {
//             status: true,
//           },
//         });

//         if (existingEnrollment?.status === "Active") {
//           return {
//             status: "error",
//             message: `You are already enrolled in "${course.title}".`,
//           };
//         }
//       }
//     }

//     // ============================================================
//     // 10. CREATE DYNAMIC STRIPE LINE ITEMS
//     // ============================================================

//     const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
//       products.map((product) => {
//         const quantity = quantityMap.get(product.id) ?? 1;

//         const imageKey =
//           product.type === "Course"
//             ? product.imageKey?.trim()
//             : product.images?.[0]?.imageKey?.trim();

//         let imageUrl: string | undefined;

//         if (imageKey) {
//           if (
//             imageKey.startsWith("http://") ||
//             imageKey.startsWith("https://")
//           ) {
//             imageUrl = imageKey;
//           } else {
//             imageUrl = `https://utfs.io/f/${imageKey}`;
//           }
//         }

//         return {
//           price_data: {
//             currency: "usd",

//             // Prisma stores cents.
//             unit_amount: Number(product.price),

//             product_data: {
//               name: product.title,

//               ...(imageUrl
//                 ? {
//                     images: [imageUrl],
//                   }
//                 : {}),

//               metadata: {
//                 productId: product.id,
//                 productType: product.type,
//               },
//             },
//           },

//           quantity,
//         };
//       });

//     // ============================================================
//     // 11. CREATE CHECKOUT SESSION
//     // ============================================================

//     const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
//       line_items: lineItems,

//       mode: "payment",

//       payment_method_types: ["card"],

//       success_url:
//         `${env.BETTER_AUTH_URL}/payment/success` +
//         `?session_id={CHECKOUT_SESSION_ID}`,

//       cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,

//       metadata: {
//         itemCount: String(products.length),
//         userId: user?.id ?? "",
//       },
//     };

//     // ============================================================
//     // 12. CUSTOMER
//     // ============================================================

//     if (user) {
//       if (user.stripeCustomerId) {
//         checkoutSessionParams.customer = user.stripeCustomerId;
//       } else if (user.email) {
//         checkoutSessionParams.customer_email = user.email;
//         checkoutSessionParams.customer_creation = "always";
//       }
//     } else {
//       // Stripe collects guest email.
//       checkoutSessionParams.customer_creation = "always";
//     }

//     // ============================================================
//     // 13. CREATE SESSION
//     // ============================================================

//     const checkoutSession = await stripe.checkout.sessions.create(
//       checkoutSessionParams,
//     );

//     if (!checkoutSession.url) {
//       return {
//         status: "error",
//         message: "Failed to generate checkout session URL.",
//       };
//     }

//     return {
//       status: "success",
//       checkoutUrl: checkoutSession.url,
//     };
//   } catch (error) {
//     console.error("Checkout session creation error:", error);

//     if (error instanceof Stripe.errors.StripeError) {
//       return {
//         status: "error",
//         message: `Stripe error: ${error.message}`,
//       };
//     }

//     if (error instanceof Error) {
//       return {
//         status: "error",
//         message: error.message,
//       };
//     }

//     return {
//       status: "error",
//       message: "Failed to process checkout.",
//     };
//   }
// }

// "use server";

// import arcjet, { fixedWindow } from "@/lib/arcjet";
// import { env } from "@/lib/env";
// import prisma from "@/lib/prisma";
// import { stripe } from "@/lib/stripe";
// import { request } from "@arcjet/next";
// import Stripe from "stripe";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";

// const aj = arcjet.withRule(
//   fixedWindow({
//     mode: "LIVE",
//     window: "1m",
//     max: 10,
//   }),
// );

// export type CheckoutCartItem = {
//   productId: string;
//   quantity: number;
// };

// export type CheckoutResponse = {
//   status: "success" | "error";
//   message?: string;
//   checkoutUrl?: string;
// };

// export async function createCheckoutSessionAction(
//   cartItems: CheckoutCartItem[],
// ): Promise<CheckoutResponse> {
//   try {
//     // ============================================================
//     // 1. GET REQUEST + CURRENT USER
//     // ============================================================

//     const req = await request();

//     const session = await auth.api.getSession({
//       headers: await headers(),
//     });

//     const user = session?.user
//       ? await prisma.user.findUnique({
//           where: {
//             id: session.user.id,
//           },
//           select: {
//             id: true,
//             email: true,
//             name: true,
//             stripeCustomerId: true,
//           },
//         })
//       : null;

//     // ============================================================
//     // 2. RATE LIMITING
//     // ============================================================

//     const decision = await aj.protect(req, {
//       fingerprint: user?.id ?? "guest",
//     });

//     if (decision.isDenied()) {
//       return {
//         status: "error",
//         message: "You have been blocked due to too many requests.",
//       };
//     }

//     // ============================================================
//     // 3. VALIDATE CART
//     // ============================================================

//     if (!Array.isArray(cartItems) || cartItems.length === 0) {
//       return {
//         status: "error",
//         message: "Your cart is empty.",
//       };
//     }

//     // Remove invalid/duplicate entries safely.
//     // If the same product appears twice, combine quantities.
//     const quantityMap = new Map<string, number>();

//     for (const item of cartItems) {
//       if (
//         !item ||
//         typeof item.productId !== "string" ||
//         !item.productId.trim()
//       ) {
//         continue;
//       }

//       const quantity = Math.max(
//         1,
//         Math.min(100, Math.floor(Number(item.quantity) || 1)),
//       );

//       const currentQuantity = quantityMap.get(item.productId) ?? 0;

//       quantityMap.set(
//         item.productId,
//         Math.min(100, currentQuantity + quantity),
//       );
//     }

//     if (quantityMap.size === 0) {
//       return {
//         status: "error",
//         message: "Your cart contains no valid products.",
//       };
//     }

//     const productIds = Array.from(quantityMap.keys());

//     // ============================================================
//     // 4. GET PRODUCTS FROM DATABASE
//     // ============================================================
//     //
//     // IMPORTANT:
//     //
//     // We NEVER trust the price, title, or image sent by the
//     // browser.
//     //
//     // Everything comes from Prisma.
//     //
//     // Course:
//     //   Product.imageKey
//     //
//     // Digital product:
//     //   Product.images[0].imageKey
//     //
//     // ============================================================

//     const products = await prisma.product.findMany({
//       where: {
//         id: {
//           in: productIds,
//         },
//       },

//       select: {
//         id: true,
//         title: true,
//         price: true,
//         type: true,
//         status: true,

//         // ========================================================
//         // COURSE THUMBNAIL
//         // ========================================================

//         imageKey: true,

//         // ========================================================
//         // DIGITAL PRODUCT GALLERY
//         // ========================================================

//         images: {
//           orderBy: {
//             position: "asc",
//           },
//           select: {
//             imageKey: true,
//             position: true,
//           },
//         },
//       },
//     });

//     // ============================================================
//     // 5. MAKE SURE EVERY CART PRODUCT STILL EXISTS
//     // ============================================================

//     if (products.length !== productIds.length) {
//       const foundIds = new Set(products.map((product) => product.id));

//       const missingProducts = productIds.filter((id) => !foundIds.has(id));

//       console.error("Products missing from checkout:", missingProducts);

//       return {
//         status: "error",
//         message: "One or more products in your cart are no longer available.",
//       };
//     }

//     // ============================================================
//     // 6. CHECK PRODUCT STATUS
//     // ============================================================

//     const unavailableProduct = products.find(
//       (product) => product.status !== "Published",
//     );

//     if (unavailableProduct) {
//       return {
//         status: "error",
//         message: `"${unavailableProduct.title}" is not currently available for purchase.`,
//       };
//     }

//     // ============================================================
//     // 7. CHECK PRICES
//     // ============================================================

//     for (const product of products) {
//       const price = Number(product.price);

//       if (!Number.isInteger(price) || price < 0) {
//         return {
//           status: "error",
//           message: `"${product.title}" has an invalid price.`,
//         };
//       }
//     }

//     // ============================================================
//     // 8. CHECK COURSE ENROLLMENTS
//     // ============================================================

//     if (user) {
//       const courseProducts = products.filter(
//         (product) => product.type === "Course",
//       );

//       for (const course of courseProducts) {
//         const existingEnrollment = await prisma.enrollment.findUnique({
//           where: {
//             userId_productId: {
//               userId: user.id,
//               productId: course.id,
//             },
//           },

//           select: {
//             status: true,
//           },
//         });

//         if (existingEnrollment?.status === "Active") {
//           return {
//             status: "error",
//             message: `You are already enrolled in "${course.title}".`,
//           };
//         }
//       }
//     }

//     // ============================================================
//     // 9. CREATE STRIPE LINE ITEMS
//     // ============================================================

//     const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
//       products.map((product) => {
//         const quantity = quantityMap.get(product.id) ?? 1;

//         // ========================================================
//         // DETERMINE IMAGE
//         // ========================================================
//         //
//         // COURSE:
//         //   Use Product.imageKey
//         //
//         // OTHER PRODUCTS:
//         //   Use first ProductImage
//         //
//         // ========================================================

//         const imageKey =
//           product.type === "Course"
//             ? product.imageKey?.trim()
//             : product.images?.[0]?.imageKey?.trim();

//         // ========================================================
//         // CONVERT TO PUBLIC URL
//         // ========================================================

//         let imageUrl: string | undefined;

//         if (imageKey) {
//           if (
//             imageKey.startsWith("http://") ||
//             imageKey.startsWith("https://")
//           ) {
//             imageUrl = imageKey;
//           } else {
//             imageUrl = `https://utfs.io/f/${imageKey}`;
//           }
//         }

//         // ========================================================
//         // DYNAMIC STRIPE PRICE
//         // ========================================================

//         return {
//           price_data: {
//             currency: "usd",

//             // Prisma price is already stored in cents.
//             unit_amount: Number(product.price),

//             product_data: {
//               name: product.title,

//               // ==================================================
//               // PRODUCT IMAGE
//               // ==================================================
//               //
//               // Stripe Checkout will now display:
//               //
//               // Course → course thumbnail
//               // Workbook/etc. → first gallery image
//               //
//               // ==================================================

//               ...(imageUrl
//                 ? {
//                     images: [imageUrl],
//                   }
//                 : {}),

//               // ==================================================
//               // STRIPE PRODUCT METADATA
//               // ==================================================

//               metadata: {
//                 productId: product.id,
//                 productType: product.type,
//               },
//             },
//           },

//           quantity,
//         };
//       });

//     // ============================================================
//     // 10. CREATE CHECKOUT SESSION
//     // ============================================================

//     const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
//       line_items: lineItems,

//       mode: "payment",

//       payment_method_types: ["card"],

//       success_url:
//         `${env.BETTER_AUTH_URL}/payment/success` +
//         `?session_id={CHECKOUT_SESSION_ID}`,

//       cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,

//       metadata: {
//         itemCount: String(products.length),
//         userId: user?.id ?? "",
//       },
//     };

//     // ============================================================
//     // 11. CUSTOMER INFORMATION
//     // ============================================================

//     if (user) {
//       if (user.stripeCustomerId) {
//         checkoutSessionParams.customer = user.stripeCustomerId;
//       } else if (user.email) {
//         checkoutSessionParams.customer_email = user.email;

//         checkoutSessionParams.customer_creation = "always";
//       }
//     } else {
//       // Guest checkout.
//       //
//       // Stripe Checkout will collect the customer's email.
//       //
//       // Your webhook can later use this email to create
//       // the user's account.

//       checkoutSessionParams.customer_creation = "always";
//     }

//     // ============================================================
//     // 12. CREATE STRIPE SESSION
//     // ============================================================

//     const checkoutSession = await stripe.checkout.sessions.create(
//       checkoutSessionParams,
//     );

//     // ============================================================
//     // 13. VERIFY CHECKOUT URL
//     // ============================================================

//     if (!checkoutSession.url) {
//       return {
//         status: "error",
//         message: "Failed to generate checkout session URL.",
//       };
//     }

//     // ============================================================
//     // 14. SUCCESS
//     // ============================================================

//     return {
//       status: "success",
//       checkoutUrl: checkoutSession.url,
//     };
//   } catch (error) {
//     console.error("Checkout session creation error:", error);

//     if (error instanceof Stripe.errors.StripeError) {
//       return {
//         status: "error",
//         message: `Stripe error: ${error.message}`,
//       };
//     }

//     if (error instanceof Error) {
//       return {
//         status: "error",
//         message: error.message,
//       };
//     }

//     return {
//       status: "error",
//       message: "Failed to process checkout.",
//     };
//   }
// }
