"use server";

import "server-only";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export type ProductInput = {
  productId: string;

  title: string;

  description: string;

  /**
   * Digital price in cents.
   *
   * Example:
   * $19.99 -> 1999
   */
  price: number;

  /**
   * Printed/physical price in cents.
   *
   * Example:
   * $29.99 -> 2999
   *
   * null means that the product does not have
   * a printed version.
   */
  printedPrice?: number | null;

  imagesToDelete?: string[];

  fileKey: string;

  fileType: string;

  fileSize: number;

  images: {
    imageKey: string;
    position: number;
  }[];
};

export async function updateProduct(values: ProductInput) {
  try {
    // ============================================================
    // 1. AUTHENTICATE USER
    // ============================================================

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user?.id;

    if (!userId) {
      return {
        status: "error",
        message: "Unauthorized. Please log in.",
      };
    }

    // ============================================================
    // 2. GET EXISTING PRODUCT
    // ============================================================

    const product = await prisma.product.findUnique({
      where: {
        id: values.productId,
      },

      select: {
        id: true,
        userId: true,
        type: true,
      },
    });

    // ============================================================
    // 3. VERIFY OWNERSHIP
    // ============================================================

    if (!product || product.userId !== userId) {
      return {
        status: "error",
        message: "Product not found or access denied.",
      };
    }

    // ============================================================
    // 4. VALIDATE DIGITAL PRICE
    // ============================================================

    const newPriceInCents = Math.round(Number(values.price));

    if (!Number.isFinite(newPriceInCents) || newPriceInCents < 0) {
      return {
        status: "error",
        message: "Invalid product price.",
      };
    }

    // ============================================================
    // 5. VALIDATE PRINTED PRICE
    // ============================================================
    //
    // Courses do not have a printed price.
    //
    // For all other product types, printedPrice is optional.
    //
    // The frontend sends this value in cents.
    //
    // Example:
    //
    // $29.99 -> 2999
    //
    // ============================================================

    let newPrintedPriceInCents: number | null = null;

    if (product.type !== "Course") {
      if (values.printedPrice !== undefined && values.printedPrice !== null) {
        const parsedPrintedPrice = Math.round(Number(values.printedPrice));

        if (!Number.isFinite(parsedPrintedPrice) || parsedPrintedPrice < 0) {
          return {
            status: "error",
            message: "Invalid printed product price.",
          };
        }

        newPrintedPriceInCents = parsedPrintedPrice;
      }
    }

    // ============================================================
    // 6. CLEANUP OLD UPLOADTHING FILES
    // ============================================================

    if (values.imagesToDelete && values.imagesToDelete.length > 0) {
      try {
        await utapi.deleteFiles(values.imagesToDelete);
      } catch (utError) {
        // Do not fail the entire update if an old UploadThing
        // file cannot be deleted.
        console.error("Failed to delete old files from UploadThing:", utError);
      }
    }

    // ============================================================
    // 7. UPDATE DATABASE
    // ============================================================

    await prisma.$transaction(async (tx) => {
      // ----------------------------------------------------------
      // UPDATE PRODUCT
      // ----------------------------------------------------------

      await tx.product.update({
        where: {
          id: values.productId,
        },

        data: {
          title: values.title,

          // Keep the complete rich-text HTML.
          description: values.description,

          // Digital price in cents.
          price: newPriceInCents,

          // Printed price in cents.
          //
          // Course:
          //   null
          //
          // Digital product:
          //   2999, for example
          //
          printedPrice: newPrintedPriceInCents,

          fileKey: values.fileKey,

          fileType: values.fileType,

          fileSize: values.fileSize,
        },
      });

      // ----------------------------------------------------------
      // REPLACE PRODUCT IMAGES
      // ----------------------------------------------------------

      await tx.productImage.deleteMany({
        where: {
          productId: values.productId,
        },
      });

      if (values.images.length > 0) {
        await tx.productImage.createMany({
          data: values.images.map((img) => ({
            productId: values.productId,
            imageKey: img.imageKey,
            position: img.position,
          })),
        });
      }
    });

    // ============================================================
    // 8. REVALIDATE PRODUCT PAGES
    // ============================================================

    revalidatePath(`/admin/products/${values.productId}`);

    revalidatePath(`/manage/products/${values.productId}/edit`);

    revalidatePath("/educator/products");

    revalidatePath("/manage/products");

    revalidatePath("/products");

    // ============================================================
    // 9. SUCCESS
    // ============================================================

    return {
      status: "success",
      message: "Product updated successfully!",
    };
  } catch (error) {
    console.error("Digital product update failed:", error);

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update digital product details.",
    };
  }
}

// "use server";

// import "server-only";

// import prisma from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";
// import { revalidatePath } from "next/cache";
// import { UTApi } from "uploadthing/server";

// const utapi = new UTApi();

// export type ProductInput = {
//   productId: string;

//   title: string;

//   description: string;

//   /**
//    * IMPORTANT:
//    * The EditProductForm currently sends the price in cents.
//    *
//    * Example:
//    * $19.99 -> 1999
//    */
//   price: number;

//   imagesToDelete?: string[];

//   fileKey: string;

//   fileType: string;

//   fileSize: number;

//   images: {
//     imageKey: string;
//     position: number;
//   }[];
// };

// export async function updateProduct(values: ProductInput) {
//   try {
//     // ============================================================
//     // 1. AUTHENTICATE USER
//     // ============================================================

//     const session = await auth.api.getSession({
//       headers: await headers(),
//     });

//     const userId = session?.user?.id;

//     if (!userId) {
//       return {
//         status: "error",
//         message: "Unauthorized. Please log in.",
//       };
//     }

//     // ============================================================
//     // 2. GET EXISTING PRODUCT
//     // ============================================================

//     const product = await prisma.product.findUnique({
//       where: {
//         id: values.productId,
//       },

//       select: {
//         id: true,
//         userId: true,
//       },
//     });

//     // ============================================================
//     // 3. VERIFY OWNERSHIP
//     // ============================================================

//     if (!product || product.userId !== userId) {
//       return {
//         status: "error",
//         message: "Product not found or access denied.",
//       };
//     }

//     // ============================================================
//     // 4. VALIDATE PRICE
//     // ============================================================
//     //
//     // The frontend sends price in cents.
//     //
//     // Example:
//     //
//     // 19.99 -> 1999
//     //
//     // We store 1999 in Prisma.
//     //
//     // Stripe will receive this same value dynamically during
//     // checkout.
//     //
//     // ============================================================

//     const newPriceInCents = Math.round(Number(values.price));

//     if (!Number.isFinite(newPriceInCents) || newPriceInCents < 0) {
//       return {
//         status: "error",
//         message: "Invalid product price.",
//       };
//     }

//     // ============================================================
//     // 5. CLEANUP OLD UPLOADTHING FILES
//     // ============================================================

//     if (values.imagesToDelete && values.imagesToDelete.length > 0) {
//       try {
//         await utapi.deleteFiles(values.imagesToDelete);
//       } catch (utError) {
//         // We don't fail the entire product update if an old
//         // UploadThing file cannot be deleted.
//         console.error("Failed to delete old files from UploadThing:", utError);
//       }
//     }

//     // ============================================================
//     // 6. UPDATE DATABASE
//     // ============================================================

//     await prisma.$transaction(async (tx) => {
//       // ----------------------------------------------------------
//       // UPDATE PRODUCT
//       // ----------------------------------------------------------

//       await tx.product.update({
//         where: {
//           id: values.productId,
//         },

//         data: {
//           title: values.title,

//           // Keep the complete rich-text HTML in Prisma.
//           description: values.description,

//           // Store price in cents.
//           price: newPriceInCents,

//           fileKey: values.fileKey,

//           fileType: values.fileType,

//           fileSize: values.fileSize,

//           // IMPORTANT:
//           //
//           // We intentionally DO NOT update stripePriceId.
//           //
//           // Stripe no longer controls the product price.
//           // Prisma does.
//         },
//       });

//       // ----------------------------------------------------------
//       // REPLACE PRODUCT IMAGES
//       // ----------------------------------------------------------

//       await tx.productImage.deleteMany({
//         where: {
//           productId: values.productId,
//         },
//       });

//       if (values.images.length > 0) {
//         await tx.productImage.createMany({
//           data: values.images.map((img) => ({
//             productId: values.productId,
//             imageKey: img.imageKey,
//             position: img.position,
//           })),
//         });
//       }
//     });

//     // ============================================================
//     // 7. REVALIDATE PRODUCT PAGES
//     // ============================================================

//     revalidatePath(`/admin/products/${values.productId}`);

//     revalidatePath("/educator/products");

//     revalidatePath("/manage/products");

//     // If your product detail page uses this route,
//     // revalidate it as well.
//     revalidatePath(`/products/${values.productId}`);

//     // ============================================================
//     // 8. SUCCESS
//     // ============================================================

//     return {
//       status: "success",
//       message: "Digital product updated successfully!",
//     };
//   } catch (error) {
//     console.error("Digital product update failed:", error);

//     return {
//       status: "error",
//       message:
//         error instanceof Error
//           ? error.message
//           : "Failed to update digital product details.",
//     };
//   }
// }

// "use server";

// import "server-only";

// import prisma from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";
// import { revalidatePath } from "next/cache";
// import { UTApi } from "uploadthing/server";
// import { stripe } from "@/lib/stripe";
// import Stripe from "stripe";

// const utapi = new UTApi();

// export type ProductInput = {
//   productId: string;
//   title: string;
//   description: string;
//   price: number;

//   imagesToDelete?: string[];

//   fileKey: string;
//   fileType: string;
//   fileSize: number;

//   images: {
//     imageKey: string;
//     position: number;
//   }[];
// };

// export async function updateProduct(values: ProductInput) {
//   try {
//     // ============================================================
//     // 1. AUTHENTICATE USER
//     // ============================================================

//     const session = await auth.api.getSession({
//       headers: await headers(),
//     });

//     const userId = session?.user?.id;

//     if (!userId) {
//       return {
//         status: "error",
//         message: "Unauthorized. Please log in.",
//       };
//     }

//     // ============================================================
//     // 2. GET EXISTING PRODUCT
//     // ============================================================

//     const product = await prisma.product.findUnique({
//       where: {
//         id: values.productId,
//       },
//       select: {
//         id: true,
//         userId: true,
//         title: true,
//         description: true,
//         price: true,
//         stripePriceId: true,
//       },
//     });

//     // ============================================================
//     // 3. VERIFY OWNERSHIP
//     // ============================================================

//     if (!product || product.userId !== userId) {
//       return {
//         status: "error",
//         message: "Product not found or access denied.",
//       };
//     }

//     // ============================================================
//     // 4. PREPARE PRICE
//     // ============================================================

//     const newPriceInCents = Math.round(Number(values.price));

//     if (!Number.isFinite(newPriceInCents) || newPriceInCents < 0) {
//       return {
//         status: "error",
//         message: "Invalid product price.",
//       };
//     }

//     // ============================================================
//     // 5. PREPARE STRIPE IMAGES
//     // ============================================================
//     //
//     // Stripe requires publicly accessible image URLs.
//     //
//     // Your EditProductForm sends UploadThing URLs/keys.
//     //
//     // We convert keys into:
//     //
//     // https://utfs.io/f/KEY
//     //
//     // We use the first 8 images because Stripe supports
//     // multiple product images but has a limit.
//     //
//     // ============================================================

//     const stripeImages = values.images
//       .slice()
//       .sort((a, b) => a.position - b.position)
//       .map((image) => {
//         const imageKey = image.imageKey?.trim();

//         if (!imageKey) {
//           return null;
//         }

//         if (imageKey.startsWith("http://") || imageKey.startsWith("https://")) {
//           return imageKey;
//         }

//         return `https://utfs.io/f/${imageKey}`;
//       })
//       .filter((url): url is string => Boolean(url))
//       .slice(0, 8);

//     // ============================================================
//     // 6. SYNCHRONIZE STRIPE PRODUCT
//     // ============================================================

//     let stripeProductId: string | null = null;

//     if (product.stripePriceId) {
//       try {
//         const existingStripePrice = await stripe.prices.retrieve(
//           product.stripePriceId,
//         );

//         if (typeof existingStripePrice.product === "string") {
//           stripeProductId = existingStripePrice.product;
//         }

//         if (!stripeProductId) {
//           return {
//             status: "error",
//             message:
//               "Could not determine the Stripe Product associated with this product.",
//           };
//         }

//         const stripeProductUpdate: Stripe.ProductUpdateParams = {
//           name: values.title,
//           description: "",
//           images: stripeImages,
//         };

//         await stripe.products.update(stripeProductId, stripeProductUpdate);

//         await stripe.products.update(stripeProductId, stripeProductUpdate);
//       } catch (stripeError) {
//         console.error("Failed to update Stripe Product:", stripeError);

//         return {
//           status: "error",
//           message:
//             stripeError instanceof Error
//               ? `Stripe product update failed: ${stripeError.message}`
//               : "Failed to update Stripe product.",
//         };
//       }
//     }

//     // ============================================================
//     // 7. HANDLE STRIPE PRICE CHANGES
//     // ============================================================

//     let newStripePriceId = product.stripePriceId;

//     const priceChanged = newPriceInCents !== product.price;

//     if (product.stripePriceId && priceChanged) {
//       try {
//         // Retrieve the current Stripe Price.
//         const existingStripePrice = await stripe.prices.retrieve(
//           product.stripePriceId,
//         );

//         if (typeof existingStripePrice.product === "string") {
//           stripeProductId = existingStripePrice.product;
//         }

//         if (!stripeProductId) {
//           return {
//             status: "error",
//             message: "Could not determine the Stripe Product for this item.",
//           };
//         }

//         // --------------------------------------------------------
//         // Create a NEW Stripe Price.
//         // Stripe Prices should not be modified once created.
//         // --------------------------------------------------------

//         const newStripePrice = await stripe.prices.create({
//           product: stripeProductId,
//           currency: "usd",
//           unit_amount: newPriceInCents,
//         });

//         newStripePriceId = newStripePrice.id;

//         // --------------------------------------------------------
//         // Make the new price the default price.
//         // --------------------------------------------------------

//         await stripe.products.update(stripeProductId, {
//           default_price: newStripePrice.id,
//         });

//         // --------------------------------------------------------
//         // Deactivate the old price.
//         // --------------------------------------------------------

//         await stripe.prices.update(product.stripePriceId, {
//           active: false,
//         });
//       } catch (stripeError) {
//         console.error("Failed to update Stripe Price:", stripeError);

//         return {
//           status: "error",
//           message:
//             stripeError instanceof Error
//               ? `Stripe price update failed: ${stripeError.message}`
//               : "Failed to update Stripe price.",
//         };
//       }
//     }

//     // ============================================================
//     // 8. CLEANUP OLD UPLOADTHING FILES
//     // ============================================================

//     if (values.imagesToDelete && values.imagesToDelete.length > 0) {
//       try {
//         await utapi.deleteFiles(values.imagesToDelete);
//       } catch (utError) {
//         console.error("Failed to delete old files from UploadThing:", utError);
//       }
//     }

//     // ============================================================
//     // 9. UPDATE DATABASE
//     // ============================================================

//     await prisma.$transaction(async (tx) => {
//       // --------------------------------------------------------
//       // Update product
//       // --------------------------------------------------------

//       await tx.product.update({
//         where: {
//           id: values.productId,
//         },

//         data: {
//           title: values.title,

//           // Keep rich HTML in your database.
//           description: values.description,

//           // Store cents.
//           price: newPriceInCents,

//           fileKey: values.fileKey,
//           fileType: values.fileType,
//           fileSize: values.fileSize,

//           // Save the current Stripe Price ID.
//           stripePriceId: newStripePriceId,
//         },
//       });

//       // --------------------------------------------------------
//       // Replace gallery images
//       // --------------------------------------------------------

//       await tx.productImage.deleteMany({
//         where: {
//           productId: values.productId,
//         },
//       });

//       if (values.images.length > 0) {
//         await tx.productImage.createMany({
//           data: values.images.map((img) => ({
//             productId: values.productId,
//             imageKey: img.imageKey,
//             position: img.position,
//           })),
//         });
//       }
//     });

//     // ============================================================
//     // 10. REVALIDATE
//     // ============================================================

//     revalidatePath(`/admin/products/${values.productId}`);

//     revalidatePath(`/educator/products`);

//     revalidatePath(`/manage/products`);

//     // ============================================================
//     // 11. SUCCESS
//     // ============================================================

//     return {
//       status: "success",
//       message: "Digital product updated successfully!",
//     };
//   } catch (error) {
//     console.error("Digital product update failed:", error);

//     return {
//       status: "error",
//       message:
//         error instanceof Error
//           ? error.message
//           : "Failed to update digital product details.",
//     };
//   }
// }
