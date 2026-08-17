"use server";

import arcjet, { fixedWindow } from "@/lib/arcjet";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";
import { requireManager } from "./require-manager";

const utapi = new UTApi();

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  }),
);

// ============================================================
// HELPER
// ============================================================

function getRawFileKey(key: string): string {
  if (!key) return "";

  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key.substring(key.lastIndexOf("/") + 1);
  }

  return key;
}

export async function managerDeleteProduct(
  productId: string,
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
      return {
        status: "error",
        message: decision.reason.isRateLimit()
          ? "Too many requests. Try again later."
          : "Request blocked.",
      };
    }

    // ============================================================
    // 2. GET PRODUCT + ALL RELATED FILES
    // ============================================================

    const productData = await prisma.product.findUnique({
      where: {
        id: productId,
      },

      select: {
        id: true,
        title: true,
        type: true,

        // Main course/product image
        imageKey: true,

        // Digital product downloadable file
        fileKey: true,

        // Stripe
        stripePriceId: true,

        // Product gallery
        images: {
          select: {
            imageKey: true,
          },
        },

        // Course chapters and lessons
        chapters: {
          select: {
            lessons: {
              select: {
                id: true,
                videoKey: true,
                thumbnailKey: true,
              },
            },
          },
        },
      },
    });

    // ============================================================
    // 3. PRODUCT NOT FOUND
    // ============================================================

    if (!productData) {
      return {
        status: "error",
        message: "Product not found.",
      };
    }

    // ============================================================
    // 4. COLLECT ALL UPLOADTHING FILES
    // ============================================================

    const filesToDelete = new Set<string>();

    // ------------------------------------------------------------
    // Main product/course image
    // ------------------------------------------------------------

    if (productData.imageKey) {
      const key = getRawFileKey(productData.imageKey);

      if (key) {
        filesToDelete.add(key);
      }
    }

    // ------------------------------------------------------------
    // Digital product downloadable file
    // ------------------------------------------------------------

    if (productData.fileKey) {
      const key = getRawFileKey(productData.fileKey);

      if (key) {
        filesToDelete.add(key);
      }
    }

    // ------------------------------------------------------------
    // Gallery images
    // ------------------------------------------------------------

    for (const image of productData.images) {
      if (!image.imageKey) continue;

      const key = getRawFileKey(image.imageKey);

      if (key) {
        filesToDelete.add(key);
      }
    }

    // ------------------------------------------------------------
    // Course videos + lesson thumbnails
    // ------------------------------------------------------------

    for (const chapter of productData.chapters) {
      for (const lesson of chapter.lessons) {
        if (lesson.videoKey) {
          const key = getRawFileKey(lesson.videoKey);

          if (key) {
            filesToDelete.add(key);
          }
        }

        if (lesson.thumbnailKey) {
          const key = getRawFileKey(lesson.thumbnailKey);

          if (key) {
            filesToDelete.add(key);
          }
        }
      }
    }

    const uploadThingKeys = Array.from(filesToDelete);

    console.log(`Preparing to delete product: ${productData.title}`);

    console.log(`UploadThing files found: ${uploadThingKeys.length}`);

    // ============================================================
    // 5. DELETE UPLOADTHING FILES
    // ============================================================
    //
    // Do this BEFORE deleting the database records because
    // once the Product is deleted, we no longer have an easy
    // way to find its associated files.
    //

    if (uploadThingKeys.length > 0) {
      try {
        await utapi.deleteFiles(uploadThingKeys);

        console.log(
          `Successfully deleted ${uploadThingKeys.length} UploadThing files.`,
        );
      } catch (uploadError) {
        console.error("UPLOADTHING DELETE ERROR:", uploadError);

        // We continue with database deletion.
        //
        // This means a temporary UploadThing failure will not
        // prevent the product from being removed from your
        // application.
      }
    }

    // ============================================================
    // 6. CLEAN UP STRIPE
    // ============================================================
    //
    // Stripe Prices cannot be permanently deleted.
    // We deactivate the Price and archive the Stripe Product.
    //

    if (productData.stripePriceId) {
      try {
        const stripePrice = await stripe.prices.retrieve(
          productData.stripePriceId,
        );

        const stripeProductId =
          typeof stripePrice.product === "string"
            ? stripePrice.product
            : stripePrice.product?.id;

        // --------------------------------------------------------
        // Deactivate Price
        // --------------------------------------------------------

        if (stripePrice.active) {
          await stripe.prices.update(productData.stripePriceId, {
            active: false,
          });
        }

        // --------------------------------------------------------
        // Archive Stripe Product
        // --------------------------------------------------------

        if (stripeProductId) {
          await stripe.products.update(stripeProductId, {
            active: false,
          });
        }

        console.log("Stripe product successfully archived.");
      } catch (stripeError) {
        console.error("STRIPE DELETE/ARCHIVE ERROR:", stripeError);

        // Don't stop database deletion if Stripe cleanup fails.
      }
    }

    // ============================================================
    // 7. DELETE PRODUCT AND ALL DATABASE RELATIONS
    // ============================================================
    //
    // Your Prisma schema has cascading relationships:
    //
    // Product
    //   ↓
    // Chapters
    //   ↓
    // Lessons
    //
    // Product
    //   ↓
    // ProductImages
    //
    // Product
    //   ↓
    // Enrollments
    //
    // Product
    //   ↓
    // EnrollmentProgress
    //
    // Lesson
    //   ↓
    // LessonProgress
    //
    // Therefore deleting Product will cascade through these
    // related records.
    //

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    // ============================================================
    // 8. REVALIDATE
    // ============================================================

    revalidatePath("/manage/products");
    revalidatePath("/educator/products");
    revalidatePath("/products");

    // ============================================================
    // 9. SUCCESS
    // ============================================================

    return {
      status: "success",
      message: `${productData.title} was deleted successfully.`,
    };
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to delete product.",
    };
  }
}

// "use server";

// import arcjet, { fixedWindow } from "@/lib/arcjet";
// import prisma from "@/lib/prisma";
// import { ApiResponse } from "@/lib/types";
// import { request } from "@arcjet/next";
// import { revalidatePath } from "next/cache";
// import { UTApi } from "uploadthing/server";
// import { requireManager } from "./require-manager";

// const utapi = new UTApi();

// const aj = arcjet.withRule(
//   fixedWindow({
//     mode: "LIVE",
//     window: "1m",
//     max: 5,
//   }),
// );

// // Helper function to extract the raw file identifier if the key was stored as a full URL
// function getRawFileKey(key: string): string {
//   if (key.startsWith("http")) {
//     return key.substring(key.lastIndexOf("/") + 1);
//   }
//   return key;
// }

// export async function managerDeleteProduct(
//   productId: string,
// ): Promise<ApiResponse> {
//   const session = await requireManager();

//   try {
//     const req = await request();
//     const decision = await aj.protect(req, {
//       fingerprint: session.user.id,
//     });

//     if (decision.isDenied()) {
//       return {
//         status: "error",
//         message: decision.reason.isRateLimit()
//           ? "Too many requests. Try again later."
//           : "Request blocked.",
//       };
//     }

//     // 1. Query the Product, related Course, and all descendant Chapter/Lesson keys
//     const productData = await prisma.product.findUnique({
//       where: { id: productId },
//       select: {
//         course: {
//           select: {
//             imageKey: true,
//             chapter: {
//               select: {
//                 lessons: {
//                   select: {
//                     thumbnailKey: true,
//                     videoKey: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!productData) {
//       return {
//         status: "error",
//         message: "Product not found",
//       };
//     }

//     // 2. Gather all file keys that need to be removed from UploadThing
//     const keysToDelete: string[] = [];

//     if (productData.course) {
//       // Course Image / Thumbnail Key
//       if (productData.course.imageKey) {
//         keysToDelete.push(getRawFileKey(productData.course.imageKey));
//       }

//       // Lesson Thumbnail & Video Keys
//       productData.course.chapter.forEach((chapter) => {
//         chapter.lessons.forEach((lesson) => {
//           if (lesson.thumbnailKey) {
//             keysToDelete.push(getRawFileKey(lesson.thumbnailKey));
//           }
//           if (lesson.videoKey) {
//             keysToDelete.push(getRawFileKey(lesson.videoKey));
//           }
//         });
//       });
//     }

//     // 3. Delete files from UploadThing in a single batch
//     if (keysToDelete.length > 0) {
//       try {
//         await utapi.deleteFiles(keysToDelete);
//       } catch (utError) {
//         // Log the error but don't halt DB deletion so the system doesn't get out of sync
//         console.error("Failed to delete assets from UploadThing:", utError);
//       }
//     }

//     // 4. Delete the product from DB (Cascades down to Course, Chapters, and Lessons)
//     await prisma.product.delete({
//       where: { id: productId },
//     });

//     revalidatePath("/educator/products");

//     return {
//       status: "success",
//       message: "Product deleted successfully",
//     };
//   } catch (error) {
//     console.error("Delete error:", error);

//     return {
//       status: "error",
//       message: "Product Failed to delete!",
//     };
//   }
// }

// "use server";

// import { requireEducator } from "@/app/actions/require-educator";
// import arcjet, { fixedWindow } from "@/lib/arcjet";
// import prisma from "@/lib/prisma";
// import { ApiResponse } from "@/lib/types";
// import { request } from "@arcjet/next";
// import { revalidatePath } from "next/cache";
// import { UTApi } from "uploadthing/server"; // 1. Import UploadThing Server API

// const utapi = new UTApi(); // 2. Initialize the API instance

// const aj = arcjet.withRule(
//   fixedWindow({
//     mode: "LIVE",
//     window: "1m",
//     max: 5,
//   }),
// );

// export async function deleteProduct(productId: string): Promise<ApiResponse> {
//   const session = await requireEducator();

//   try {
//     const req = await request();
//     const decision = await aj.protect(req, {
//       fingerprint: session.user.id,
//     });

//     if (decision.isDenied()) {
//       return {
//         status: "error",
//         message: decision.reason.isRateLimit()
//           ? "Too many requests. Try again later."
//           : "Request blocked.",
//       };
//     }

//     // ✅ 1. Get course first to retrieve the file information
//     const product = await prisma.product.findUnique({
//       where: { id: productId },
//       select: { fileKey: true },
//     });

//     if (!product) {
//       return {
//         status: "error",
//         message: "Product not found",
//       };
//     }

//     // ✅ 2. Delete the file from UploadThing if it exists
//     if (product.fileKey) {
//       try {
//         // Since you saved the full uploadRes[0].url into 'fileKey',
//         // we extract the raw file identifier from the end of the URL string.
//         const rawKey = product.fileKey.substring(
//           product.fileKey.lastIndexOf("/") + 1,
//         );

//         await utapi.deleteFiles(rawKey);
//       } catch (utError) {
//         // We catch this separately so that if an image deletion fails
//         // (e.g., if it was already missing), it doesn't block the database deletion.
//         console.error("Failed to delete asset from UploadThing:", utError);
//       }
//     }

//     // ✅ 3. Delete course from DB
//     await prisma.product.delete({
//       where: { id: productId },
//     });

//     revalidatePath("/educator/products");

//     return {
//       status: "success",
//       message: "Product deleted successfully",
//     };
//   } catch (error) {
//     console.error("Delete error:", error);

//     return {
//       status: "error",
//       message: "Failed to delete Course!",
//     };
//   }
// }
