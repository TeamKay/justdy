"use server";

import arcjet, { fixedWindow } from "@/lib/arcjet";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { ApiResponse } from "@/lib/types";
import {
  chapterSchema,
  ChapterSchemaType,
  lessonSchema,
  LessonSchemaType,
  productSchema,
  ProductSchemaType,
} from "@/lib/zodSchemas";
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

/* ============================================================
   EDIT COURSE / PRODUCT
   ============================================================ */

export async function editCourse(
  data: ProductSchemaType,
  id: string,
): Promise<ApiResponse> {
  const user = await requireManager();

  try {
    // ============================================================
    // 1. RATE LIMITING
    // ============================================================

    const reg = await request();

    const decision = await aj.protect(reg, {
      fingerprint: user.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "Rate limit exceeded. Please try again later.",
        };
      }

      return {
        status: "error",
        message: "Request denied.",
      };
    }

    // ============================================================
    // 2. VALIDATE FORM DATA
    // ============================================================

    const result = productSchema.safeParse(data);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    // ============================================================
    // 3. PREPARE PRICE
    // ============================================================
    //
    // IMPORTANT:
    //
    // The form works in DOLLARS:
    //
    //     $200 -> 200
    //
    // The database and Stripe work in CENTS:
    //
    //     $200 -> 20,000
    //
    // Therefore we MUST convert here.
    //
    // ============================================================

    const priceInDollars = Number(result.data.price);

    if (!Number.isFinite(priceInDollars) || priceInDollars < 0) {
      return {
        status: "error",
        message: "Invalid product price.",
      };
    }

    const priceInCents = Math.round(priceInDollars * 100);

    // ============================================================
    // 4. GET EXISTING PRODUCT
    // ============================================================

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        userId: user.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        slug: true,
        duration: true,
        category: true,
        imageKey: true,
        stripePriceId: true,
      },
    });

    if (!existingProduct) {
      return {
        status: "error",
        message: "Product not found.",
      };
    }

    // ============================================================
    // 5. IDENTIFY OLD IMAGE
    // ============================================================

    let oldFileKeyToDelete: string | null = null;

    const currentImageKey = existingProduct.imageKey;

    if (currentImageKey && currentImageKey !== result.data.fileKey) {
      oldFileKeyToDelete = currentImageKey;
    }

    // ============================================================
    // 6. STRIPE SYNCHRONIZATION
    // ============================================================
    //
    // DATABASE IS THE SOURCE OF TRUTH.
    // Stripe is the payment/integration layer.
    //
    // If the stored Stripe Price exists, synchronize it.
    // If it no longer exists, create a replacement Stripe
    // Product + Price and save the new Price ID to the database.
    // If no Stripe Price ID exists in the database, create one.
    //
    // ============================================================

    let newStripePriceId = existingProduct.stripePriceId;

    const priceChanged = existingProduct.price !== priceInCents;

    const imageUrl = result.data.fileKey
      ? result.data.fileKey.startsWith("http://") ||
        result.data.fileKey.startsWith("https://")
        ? result.data.fileKey
        : `https://utfs.io/f/${result.data.fileKey}`
      : null;

    // ============================================================
    // EXISTING STRIPE PRICE
    // ============================================================

    if (existingProduct.stripePriceId) {
      try {
        const existingStripePrice = await stripe.prices.retrieve(
          existingProduct.stripePriceId,
        );

        const stripeProductId =
          typeof existingStripePrice.product === "string"
            ? existingStripePrice.product
            : existingStripePrice.product?.id;

        if (!stripeProductId) {
          throw new Error(
            "Could not determine the Stripe Product associated with the existing Stripe Price.",
          );
        }

        // Synchronize Stripe Product information.
        await stripe.products.update(stripeProductId, {
          name: result.data.title,
          images: imageUrl ? [imageUrl] : [],
        });

        // Stripe Prices cannot be modified. Create a replacement
        // Price when the database price changes.
        if (priceChanged) {
          const newStripePrice = await stripe.prices.create({
            product: stripeProductId,
            currency: "usd",
            unit_amount: priceInCents,
          });

          newStripePriceId = newStripePrice.id;

          await stripe.products.update(stripeProductId, {
            default_price: newStripePrice.id,
          });

          await stripe.prices.update(existingProduct.stripePriceId, {
            active: false,
          });
        }
      } catch (stripeError: unknown) {
        // A missing Stripe Price means the DB contains stale Stripe
        // integration data. Repair Stripe instead of rejecting the
        // course update.
        const isMissingStripeResource =
          stripeError &&
          typeof stripeError === "object" &&
          "code" in stripeError &&
          stripeError.code === "resource_missing";

        if (!isMissingStripeResource) {
          console.error("COURSE STRIPE UPDATE ERROR:", stripeError);

          return {
            status: "error",
            message:
              stripeError instanceof Error
                ? `Stripe update failed: ${stripeError.message}`
                : "Failed to synchronize Stripe.",
          };
        }

        console.warn(
          `Stored Stripe Price ${existingProduct.stripePriceId} no longer exists. Creating a replacement Stripe Product and Price.`,
        );

        try {
          const replacementStripeProduct = await stripe.products.create({
            name: result.data.title,
            images: imageUrl ? [imageUrl] : [],
            metadata: {
              productId: existingProduct.id,
              source: "justdy",
            },
            default_price_data: {
              currency: "usd",
              unit_amount: priceInCents,
            },
          });

          newStripePriceId =
            typeof replacementStripeProduct.default_price === "string"
              ? replacementStripeProduct.default_price
              : (replacementStripeProduct.default_price?.id ?? null);

          if (!newStripePriceId) {
            throw new Error(
              "Stripe created the replacement Product but did not return a Price ID.",
            );
          }
        } catch (replacementError: unknown) {
          console.error(
            "STRIPE REPLACEMENT PRODUCT CREATION ERROR:",
            replacementError,
          );

          return {
            status: "error",
            message:
              replacementError instanceof Error
                ? `Could not create replacement Stripe Price: ${replacementError.message}`
                : "Could not create replacement Stripe Price.",
          };
        }
      }
    } else {
      // ==========================================================
      // NO STRIPE PRICE EXISTS IN DATABASE
      // ==========================================================

      try {
        const stripeProduct = await stripe.products.create({
          name: result.data.title,
          images: imageUrl ? [imageUrl] : [],
          metadata: {
            productId: existingProduct.id,
            source: "justdy",
          },
          default_price_data: {
            currency: "usd",
            unit_amount: priceInCents,
          },
        });

        newStripePriceId =
          typeof stripeProduct.default_price === "string"
            ? stripeProduct.default_price
            : (stripeProduct.default_price?.id ?? null);

        if (!newStripePriceId) {
          throw new Error(
            "Stripe Product was created but no default Price ID was returned.",
          );
        }
      } catch (stripeError: unknown) {
        console.error("STRIPE PRODUCT CREATION ERROR:", stripeError);

        return {
          status: "error",
          message:
            stripeError instanceof Error
              ? `Stripe product creation failed: ${stripeError.message}`
              : "Failed to create Stripe product.",
        };
      }
    }

    // ============================================================
    // 7. UPDATE DATABASE
    // ============================================================

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: {
          id,
        },

        data: {
          title: result.data.title,

          description: result.data.description,

          // IMPORTANT:
          // Store price in CENTS.
          //
          // $200 -> 20,000
          // $19.99 -> 1,999
          //
          price: priceInCents,

          slug: result.data.slug,

          duration: result.data.duration,

          category: result.data.category,

          imageKey: result.data.fileKey,

          // Keep Stripe Price synchronized
          stripePriceId: newStripePriceId,
        },
      });
    });

    // ============================================================
    // 8. DELETE OLD IMAGE FROM UPLOADTHING
    // ============================================================

    if (oldFileKeyToDelete) {
      try {
        await utapi.deleteFiles(oldFileKeyToDelete);
      } catch (deleteError) {
        console.error(
          "Failed to delete old image from UploadThing:",
          deleteError,
        );
      }
    }

    // ============================================================
    // 9. REVALIDATE
    // ============================================================

    revalidatePath("/manage/products");
    revalidatePath(`/manage/products/${id}/edit`);
    revalidatePath(`/products/${result.data.slug}`);

    // ============================================================
    // 10. SUCCESS
    // ============================================================

    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch (error) {
    console.error("EDIT COURSE ERROR:", error);

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while updating the product",
    };
  }
}

/* ============================================================
   EDIT LESSON
   ============================================================ */

export async function editLesson({
  lessonId,
  productId,
  values,
}: {
  lessonId: string;
  productId: string;
  values: LessonSchemaType;
}): Promise<ApiResponse> {
  await requireManager();

  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    const keysToDelete: string[] = [];

    await prisma.$transaction(async (tx) => {
      const existingLesson = await tx.lesson.findUnique({
        where: {
          id: lessonId,
        },
        select: {
          videoKey: true,
          thumbnailKey: true,
        },
      });

      if (!existingLesson) {
        throw new Error("Lesson not found");
      }

      if (
        existingLesson.videoKey &&
        result.data.videoKey &&
        existingLesson.videoKey !== result.data.videoKey
      ) {
        keysToDelete.push(existingLesson.videoKey);
      }

      if (
        existingLesson.thumbnailKey &&
        result.data.thumbnailKey &&
        existingLesson.thumbnailKey !== result.data.thumbnailKey
      ) {
        keysToDelete.push(result.data.thumbnailKey);
      }

      await tx.lesson.update({
        where: {
          id: lessonId,
        },

        data: {
          title: result.data.name,
          description: result.data.description,
          videoKey: result.data.videoKey,
          thumbnailKey: result.data.thumbnailKey,
        },
      });
    });

    if (keysToDelete.length > 0) {
      try {
        await utapi.deleteFiles(keysToDelete);
      } catch (deleteError) {
        console.error(
          "Failed to delete old lesson files from UploadThing:",
          deleteError,
        );
      }
    }

    revalidatePath(`/manage/products/${productId}/edit`);

    return {
      status: "success",
      message: "Lesson updated successfully",
    };
  } catch (error) {
    console.error("EDIT LESSON ERROR:", error);

    return {
      status: "error",
      message: "Failed to update lesson",
    };
  }
}

/* ============================================================
   REORDER LESSONS
   ============================================================ */

export async function reorderLessons(
  chapterId: string,
  lessons: { id: string; position: number }[],
  courseId: string,
): Promise<ApiResponse> {
  await requireManager();

  try {
    if (!lessons || lessons.length === 0) {
      return {
        status: "error",
        message: "No lessons provided for reordering",
      };
    }

    const updates = lessons.map((lesson) =>
      prisma.lesson.update({
        where: {
          id: lesson.id,
          chapterId: chapterId,
        },
        data: {
          position: lesson.position,
        },
      }),
    );

    await prisma.$transaction(updates);

    revalidatePath(`/manage/products/${courseId}/edit`);

    return {
      status: "success",
      message: "Lessons reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to reorder lessons",
    };
  }
}

/* ============================================================
   REORDER CHAPTERS
   ============================================================ */

export async function reorderChapters(
  productId: string,
  chapters: { id: string; position: number }[],
): Promise<ApiResponse> {
  await requireManager();

  try {
    if (!chapters || chapters.length === 0) {
      return {
        status: "error",
        message: "No chapters provided for reordering.",
      };
    }

    const updates = chapters.map((chapter) =>
      prisma.chapter.update({
        where: {
          id: chapter.id,
          productId: productId,
        },
        data: {
          position: chapter.position,
        },
      }),
    );

    await prisma.$transaction(updates);

    revalidatePath(`/manage/products/${productId}/edit`);

    return {
      status: "success",
      message: "Chapters reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to reorder chapters",
    };
  }
}

/* ============================================================
   CREATE CHAPTER
   ============================================================ */

export async function createChapter(
  values: ChapterSchemaType,
): Promise<ApiResponse> {
  await requireManager();

  try {
    const result = chapterSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
      };
    }

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: {
          id: result.data.productId,
        },
      });

      if (!product) {
        throw new Error("Product does not exist");
      }

      const maxPos = await tx.chapter.findFirst({
        where: {
          productId: product.id,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });

      await tx.chapter.create({
        data: {
          title: result.data.name,
          productId: product.id,
          position: (maxPos?.position ?? 0) + 1,
        },
      });
    });

    revalidatePath(`/manage/products/${result.data.productId}/edit`);

    return {
      status: "success",
      message: "Chapter Created Successfully",
    };
  } catch (error) {
    console.error("CREATE CHAPTER ERROR:", error);

    return {
      status: "error",
      message: "Failed to create chapter",
    };
  }
}

/* ============================================================
   CREATE LESSON
   ============================================================ */

export async function createLesson(
  values: LessonSchemaType,
): Promise<ApiResponse> {
  await requireManager();

  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
      };
    }

    await prisma.$transaction(async (tx) => {
      const maxPos = await tx.lesson.findFirst({
        where: {
          chapterId: result.data.chapterId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });

      await tx.lesson.create({
        data: {
          title: result.data.name,
          description: result.data.description,
          videoKey: result.data.videoKey,
          thumbnailKey: result.data.thumbnailKey,
          chapterId: result.data.chapterId,
          position: (maxPos?.position ?? 0) + 1,
        },
      });
    });

    revalidatePath(`/manage/products/${result.data.productId}/edit`);

    return {
      status: "success",
      message: "Lesson Created Successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create lesson",
    };
  }
}

/* ============================================================
   DELETE LESSON
   ============================================================ */

export async function deleteLesson({
  chapterId,
  courseId,
  lessonId,
}: {
  chapterId: string;
  courseId: string;
  lessonId: string;
}): Promise<ApiResponse> {
  await requireManager();

  try {
    const chapterWithLessons = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
      select: {
        lessons: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
            videoKey: true,
            thumbnailKey: true,
          },
        },
      },
    });

    if (!chapterWithLessons) {
      return {
        status: "error",
        message: "Chapter not Found",
      };
    }

    const lessons = chapterWithLessons.lessons;

    const lessonsToDelete = lessons.find((lesson) => lesson.id === lessonId);

    if (!lessonsToDelete) {
      return {
        status: "error",
        message: "Lesson not Found in the chapter",
      };
    }

    const keysToDelete: string[] = [];

    if (lessonsToDelete.videoKey) {
      keysToDelete.push(lessonsToDelete.videoKey);
    }

    if (lessonsToDelete.thumbnailKey) {
      keysToDelete.push(lessonsToDelete.thumbnailKey);
    }

    const remainingLessons = lessons.filter((lesson) => lesson.id !== lessonId);

    const updates = remainingLessons.map((lesson, index) => {
      return prisma.lesson.update({
        where: {
          id: lesson.id,
        },
        data: {
          position: index + 1,
        },
      });
    });

    await prisma.$transaction([
      ...updates,

      prisma.lesson.delete({
        where: {
          id: lessonId,
          chapterId: chapterId,
        },
      }),
    ]);

    if (keysToDelete.length > 0) {
      try {
        await utapi.deleteFiles(keysToDelete);
      } catch (deleteError) {
        console.error(
          "Failed to delete lesson files from UploadThing:",
          deleteError,
        );
      }
    }

    revalidatePath(`/manage/products/${courseId}/edit`);

    return {
      status: "success",
      message: "Lesson deleted and reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete lesson",
    };
  }
}

/* ============================================================
   DELETE CHAPTER
   ============================================================ */

export async function deleteChapter({
  chapterId,
  courseId,
}: {
  chapterId: string;
  courseId: string;
}): Promise<ApiResponse> {
  await requireManager();

  try {
    const productWithChapters = await prisma.product.findUnique({
      where: {
        id: courseId,
      },
      select: {
        chapters: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
          },
        },
      },
    });

    if (!productWithChapters) {
      return {
        status: "error",
        message: "Product not Found",
      };
    }

    const chapters = productWithChapters.chapters;

    const chapterToDelete = chapters.find(
      (chapter) => chapter.id === chapterId,
    );

    if (!chapterToDelete) {
      return {
        status: "error",
        message: "Chapter not Found in the product",
      };
    }

    const remainingChapters = chapters.filter(
      (chapter) => chapter.id !== chapterId,
    );

    const updates = remainingChapters.map((chapter, index) => {
      return prisma.chapter.update({
        where: {
          id: chapter.id,
        },
        data: {
          position: index + 1,
        },
      });
    });

    await prisma.$transaction([
      ...updates,

      prisma.chapter.delete({
        where: {
          id: chapterId,
        },
      }),
    ]);

    revalidatePath(`/manage/products/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapter deleted and reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete chapter",
    };
  }
}

// "use server";

// import arcjet, { fixedWindow } from "@/lib/arcjet";
// import prisma from "@/lib/prisma";
// import { stripe } from "@/lib/stripe";
// import { ApiResponse } from "@/lib/types";
// import {
//   chapterSchema,
//   ChapterSchemaType,
//   lessonSchema,
//   LessonSchemaType,
//   productSchema,
//   ProductSchemaType,
// } from "@/lib/zodSchemas";
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

// /* ============================================================
//    EDIT COURSE / PRODUCT
//    ============================================================ */

// export async function editCourse(
//   data: ProductSchemaType,
//   id: string,
// ): Promise<ApiResponse> {
//   const user = await requireManager();

//   try {
//     // ============================================================
//     // 1. RATE LIMITING
//     // ============================================================

//     const reg = await request();

//     const decision = await aj.protect(reg, {
//       fingerprint: user.user.id,
//     });

//     if (decision.isDenied()) {
//       if (decision.reason.isRateLimit()) {
//         return {
//           status: "error",
//           message: "Rate limit exceeded. Please try again later.",
//         };
//       }

//       return {
//         status: "error",
//         message: "Request denied.",
//       };
//     }

//     // ============================================================
//     // 2. VALIDATE FORM DATA
//     // ============================================================

//     const result = productSchema.safeParse(data);

//     if (!result.success) {
//       return {
//         status: "error",
//         message: "Invalid data",
//       };
//     }

//     // ============================================================
//     // 3. PREPARE PRICE
//     // ============================================================
//     //
//     // IMPORTANT:
//     //
//     // The form works in DOLLARS:
//     //
//     //     $200 -> 200
//     //
//     // The database and Stripe work in CENTS:
//     //
//     //     $200 -> 20,000
//     //
//     // Therefore we MUST convert here.
//     //
//     // ============================================================

//     const priceInDollars = Number(result.data.price);

//     if (!Number.isFinite(priceInDollars) || priceInDollars < 0) {
//       return {
//         status: "error",
//         message: "Invalid product price.",
//       };
//     }

//     const priceInCents = Math.round(priceInDollars * 100);

//     // ============================================================
//     // 4. GET EXISTING PRODUCT
//     // ============================================================

//     const existingProduct = await prisma.product.findFirst({
//       where: {
//         id,
//         userId: user.user.id,
//       },
//       select: {
//         id: true,
//         title: true,
//         description: true,
//         price: true,
//         slug: true,
//         duration: true,
//         category: true,
//         imageKey: true,
//         stripePriceId: true,
//       },
//     });

//     if (!existingProduct) {
//       return {
//         status: "error",
//         message: "Product not found.",
//       };
//     }

//     // ============================================================
//     // 5. IDENTIFY OLD IMAGE
//     // ============================================================

//     let oldFileKeyToDelete: string | null = null;

//     const currentImageKey = existingProduct.imageKey;

//     if (currentImageKey && currentImageKey !== result.data.fileKey) {
//       oldFileKeyToDelete = currentImageKey;
//     }

//     // ============================================================
//     // 6. STRIPE SYNCHRONIZATION
//     // ============================================================

//     let newStripePriceId = existingProduct.stripePriceId;

//     const priceChanged = existingProduct.price !== priceInCents;

//     if (existingProduct.stripePriceId) {
//       try {
//         // --------------------------------------------------------
//         // Retrieve current Stripe Price
//         // --------------------------------------------------------

//         const existingStripePrice = await stripe.prices.retrieve(
//           existingProduct.stripePriceId,
//         );

//         const stripeProductId =
//           typeof existingStripePrice.product === "string"
//             ? existingStripePrice.product
//             : existingStripePrice.product?.id;

//         if (!stripeProductId) {
//           return {
//             status: "error",
//             message:
//               "Could not determine the Stripe Product associated with this course.",
//           };
//         }

//         // --------------------------------------------------------
//         // Update Stripe Product information
//         // --------------------------------------------------------

//         await stripe.products.update(stripeProductId, {
//           name: result.data.title,
//           images: result.data.fileKey
//             ? [
//                 result.data.fileKey.startsWith("http://") ||
//                 result.data.fileKey.startsWith("https://")
//                   ? result.data.fileKey
//                   : `https://utfs.io/f/${result.data.fileKey}`,
//               ]
//             : [],
//         });

//         // --------------------------------------------------------
//         // Stripe Prices cannot be modified.
//         //
//         // If price changed:
//         // 1. Create a new Price
//         // 2. Make it the default Price
//         // 3. Deactivate old Price
//         // --------------------------------------------------------

//         if (priceChanged) {
//           const newStripePrice = await stripe.prices.create({
//             product: stripeProductId,
//             currency: "usd",
//             unit_amount: priceInCents,
//           });

//           newStripePriceId = newStripePrice.id;

//           await stripe.products.update(stripeProductId, {
//             default_price: newStripePrice.id,
//           });

//           await stripe.prices.update(existingProduct.stripePriceId, {
//             active: false,
//           });
//         }
//       } catch (stripeError) {
//         console.error("COURSE STRIPE UPDATE ERROR:", stripeError);

//         return {
//           status: "error",
//           message:
//             stripeError instanceof Error
//               ? `Stripe update failed: ${stripeError.message}`
//               : "Failed to update Stripe.",
//         };
//       }
//     } else {
//       // ==========================================================
//       // NO STRIPE PRICE EXISTS
//       //
//       // Create a new Stripe Product + Price.
//       // ==========================================================

//       try {
//         const stripeProduct = await stripe.products.create({
//           name: result.data.title,

//           // Do NOT send the rich-text description to Stripe.
//           // Omitting it completely prevents Stripe from displaying it
//           // and avoids the "description cannot be unset" error.

//           images: result.data.fileKey
//             ? [
//                 result.data.fileKey.startsWith("http://") ||
//                 result.data.fileKey.startsWith("https://")
//                   ? result.data.fileKey
//                   : `https://utfs.io/f/${result.data.fileKey}`,
//               ]
//             : [],

//           default_price_data: {
//             currency: "usd",
//             unit_amount: priceInCents,
//           },
//         });

//         newStripePriceId =
//           typeof stripeProduct.default_price === "string"
//             ? stripeProduct.default_price
//             : (stripeProduct.default_price?.id ?? null);
//       } catch (stripeError) {
//         console.error("STRIPE PRODUCT CREATION ERROR:", stripeError);

//         return {
//           status: "error",
//           message:
//             stripeError instanceof Error
//               ? `Stripe product creation failed: ${stripeError.message}`
//               : "Failed to create Stripe product.",
//         };
//       }
//     }

//     // ============================================================
//     // 7. UPDATE DATABASE
//     // ============================================================

//     await prisma.$transaction(async (tx) => {
//       await tx.product.update({
//         where: {
//           id,
//         },

//         data: {
//           title: result.data.title,

//           description: result.data.description,

//           // IMPORTANT:
//           // Store price in CENTS.
//           //
//           // $200 -> 20,000
//           // $19.99 -> 1,999
//           //
//           price: priceInCents,

//           slug: result.data.slug,

//           duration: result.data.duration,

//           category: result.data.category,

//           imageKey: result.data.fileKey,

//           // Keep Stripe Price synchronized
//           stripePriceId: newStripePriceId,
//         },
//       });
//     });

//     // ============================================================
//     // 8. DELETE OLD IMAGE FROM UPLOADTHING
//     // ============================================================

//     if (oldFileKeyToDelete) {
//       try {
//         await utapi.deleteFiles(oldFileKeyToDelete);
//       } catch (deleteError) {
//         console.error(
//           "Failed to delete old image from UploadThing:",
//           deleteError,
//         );
//       }
//     }

//     // ============================================================
//     // 9. REVALIDATE
//     // ============================================================

//     revalidatePath("/manage/products");
//     revalidatePath(`/manage/products/${id}/edit`);
//     revalidatePath(`/products/${result.data.slug}`);

//     // ============================================================
//     // 10. SUCCESS
//     // ============================================================

//     return {
//       status: "success",
//       message: "Course updated successfully",
//     };
//   } catch (error) {
//     console.error("EDIT COURSE ERROR:", error);

//     return {
//       status: "error",
//       message:
//         error instanceof Error
//           ? error.message
//           : "An error occurred while updating the product",
//     };
//   }
// }

// /* ============================================================
//    EDIT LESSON
//    ============================================================ */

// export async function editLesson({
//   lessonId,
//   productId,
//   values,
// }: {
//   lessonId: string;
//   productId: string;
//   values: LessonSchemaType;
// }): Promise<ApiResponse> {
//   await requireManager();

//   try {
//     const result = lessonSchema.safeParse(values);

//     if (!result.success) {
//       return {
//         status: "error",
//         message: "Invalid data",
//       };
//     }

//     const keysToDelete: string[] = [];

//     await prisma.$transaction(async (tx) => {
//       const existingLesson = await tx.lesson.findUnique({
//         where: {
//           id: lessonId,
//         },
//         select: {
//           videoKey: true,
//           thumbnailKey: true,
//         },
//       });

//       if (!existingLesson) {
//         throw new Error("Lesson not found");
//       }

//       if (
//         existingLesson.videoKey &&
//         result.data.videoKey &&
//         existingLesson.videoKey !== result.data.videoKey
//       ) {
//         keysToDelete.push(existingLesson.videoKey);
//       }

//       if (
//         existingLesson.thumbnailKey &&
//         result.data.thumbnailKey &&
//         existingLesson.thumbnailKey !== result.data.thumbnailKey
//       ) {
//         keysToDelete.push(result.data.thumbnailKey);
//       }

//       await tx.lesson.update({
//         where: {
//           id: lessonId,
//         },

//         data: {
//           title: result.data.name,
//           description: result.data.description,
//           videoKey: result.data.videoKey,
//           thumbnailKey: result.data.thumbnailKey,
//         },
//       });
//     });

//     if (keysToDelete.length > 0) {
//       try {
//         await utapi.deleteFiles(keysToDelete);
//       } catch (deleteError) {
//         console.error(
//           "Failed to delete old lesson files from UploadThing:",
//           deleteError,
//         );
//       }
//     }

//     revalidatePath(`/manage/products/${productId}/edit`);

//     return {
//       status: "success",
//       message: "Lesson updated successfully",
//     };
//   } catch (error) {
//     console.error("EDIT LESSON ERROR:", error);

//     return {
//       status: "error",
//       message: "Failed to update lesson",
//     };
//   }
// }

// /* ============================================================
//    REORDER LESSONS
//    ============================================================ */

// export async function reorderLessons(
//   chapterId: string,
//   lessons: { id: string; position: number }[],
//   courseId: string,
// ): Promise<ApiResponse> {
//   await requireManager();

//   try {
//     if (!lessons || lessons.length === 0) {
//       return {
//         status: "error",
//         message: "No lessons provided for reordering",
//       };
//     }

//     const updates = lessons.map((lesson) =>
//       prisma.lesson.update({
//         where: {
//           id: lesson.id,
//           chapterId: chapterId,
//         },
//         data: {
//           position: lesson.position,
//         },
//       }),
//     );

//     await prisma.$transaction(updates);

//     revalidatePath(`/manage/products/${courseId}/edit`);

//     return {
//       status: "success",
//       message: "Lessons reordered successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to reorder lessons",
//     };
//   }
// }

// /* ============================================================
//    REORDER CHAPTERS
//    ============================================================ */

// export async function reorderChapters(
//   productId: string,
//   chapters: { id: string; position: number }[],
// ): Promise<ApiResponse> {
//   await requireManager();

//   try {
//     if (!chapters || chapters.length === 0) {
//       return {
//         status: "error",
//         message: "No chapters provided for reordering.",
//       };
//     }

//     const updates = chapters.map((chapter) =>
//       prisma.chapter.update({
//         where: {
//           id: chapter.id,
//           productId: productId,
//         },
//         data: {
//           position: chapter.position,
//         },
//       }),
//     );

//     await prisma.$transaction(updates);

//     revalidatePath(`/manage/products/${productId}/edit`);

//     return {
//       status: "success",
//       message: "Chapters reordered successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to reorder chapters",
//     };
//   }
// }

// /* ============================================================
//    CREATE CHAPTER
//    ============================================================ */

// export async function createChapter(
//   values: ChapterSchemaType,
// ): Promise<ApiResponse> {
//   await requireManager();

//   try {
//     const result = chapterSchema.safeParse(values);

//     if (!result.success) {
//       return {
//         status: "error",
//         message: "Invalid Data",
//       };
//     }

//     await prisma.$transaction(async (tx) => {
//       const product = await tx.product.findUnique({
//         where: {
//           id: result.data.productId,
//         },
//       });

//       if (!product) {
//         throw new Error("Product does not exist");
//       }

//       const maxPos = await tx.chapter.findFirst({
//         where: {
//           productId: product.id,
//         },
//         select: {
//           position: true,
//         },
//         orderBy: {
//           position: "desc",
//         },
//       });

//       await tx.chapter.create({
//         data: {
//           title: result.data.name,
//           productId: product.id,
//           position: (maxPos?.position ?? 0) + 1,
//         },
//       });
//     });

//     revalidatePath(`/manage/products/${result.data.productId}/edit`);

//     return {
//       status: "success",
//       message: "Chapter Created Successfully",
//     };
//   } catch (error) {
//     console.error("CREATE CHAPTER ERROR:", error);

//     return {
//       status: "error",
//       message: "Failed to create chapter",
//     };
//   }
// }

// /* ============================================================
//    CREATE LESSON
//    ============================================================ */

// export async function createLesson(
//   values: LessonSchemaType,
// ): Promise<ApiResponse> {
//   await requireManager();

//   try {
//     const result = lessonSchema.safeParse(values);

//     if (!result.success) {
//       return {
//         status: "error",
//         message: "Invalid Data",
//       };
//     }

//     await prisma.$transaction(async (tx) => {
//       const maxPos = await tx.lesson.findFirst({
//         where: {
//           chapterId: result.data.chapterId,
//         },
//         select: {
//           position: true,
//         },
//         orderBy: {
//           position: "desc",
//         },
//       });

//       await tx.lesson.create({
//         data: {
//           title: result.data.name,
//           description: result.data.description,
//           videoKey: result.data.videoKey,
//           thumbnailKey: result.data.thumbnailKey,
//           chapterId: result.data.chapterId,
//           position: (maxPos?.position ?? 0) + 1,
//         },
//       });
//     });

//     revalidatePath(`/manage/products/${result.data.productId}/edit`);

//     return {
//       status: "success",
//       message: "Lesson Created Successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to create lesson",
//     };
//   }
// }

// /* ============================================================
//    DELETE LESSON
//    ============================================================ */

// export async function deleteLesson({
//   chapterId,
//   courseId,
//   lessonId,
// }: {
//   chapterId: string;
//   courseId: string;
//   lessonId: string;
// }): Promise<ApiResponse> {
//   await requireManager();

//   try {
//     const chapterWithLessons = await prisma.chapter.findUnique({
//       where: {
//         id: chapterId,
//       },
//       select: {
//         lessons: {
//           orderBy: {
//             position: "asc",
//           },
//           select: {
//             id: true,
//             position: true,
//             videoKey: true,
//             thumbnailKey: true,
//           },
//         },
//       },
//     });

//     if (!chapterWithLessons) {
//       return {
//         status: "error",
//         message: "Chapter not Found",
//       };
//     }

//     const lessons = chapterWithLessons.lessons;

//     const lessonsToDelete = lessons.find((lesson) => lesson.id === lessonId);

//     if (!lessonsToDelete) {
//       return {
//         status: "error",
//         message: "Lesson not Found in the chapter",
//       };
//     }

//     const keysToDelete: string[] = [];

//     if (lessonsToDelete.videoKey) {
//       keysToDelete.push(lessonsToDelete.videoKey);
//     }

//     if (lessonsToDelete.thumbnailKey) {
//       keysToDelete.push(lessonsToDelete.thumbnailKey);
//     }

//     const remainingLessons = lessons.filter((lesson) => lesson.id !== lessonId);

//     const updates = remainingLessons.map((lesson, index) => {
//       return prisma.lesson.update({
//         where: {
//           id: lesson.id,
//         },
//         data: {
//           position: index + 1,
//         },
//       });
//     });

//     await prisma.$transaction([
//       ...updates,

//       prisma.lesson.delete({
//         where: {
//           id: lessonId,
//           chapterId: chapterId,
//         },
//       }),
//     ]);

//     if (keysToDelete.length > 0) {
//       try {
//         await utapi.deleteFiles(keysToDelete);
//       } catch (deleteError) {
//         console.error(
//           "Failed to delete lesson files from UploadThing:",
//           deleteError,
//         );
//       }
//     }

//     revalidatePath(`/manage/products/${courseId}/edit`);

//     return {
//       status: "success",
//       message: "Lesson deleted and reordered successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to delete lesson",
//     };
//   }
// }

// /* ============================================================
//    DELETE CHAPTER
//    ============================================================ */

// export async function deleteChapter({
//   chapterId,
//   courseId,
// }: {
//   chapterId: string;
//   courseId: string;
// }): Promise<ApiResponse> {
//   await requireManager();

//   try {
//     const productWithChapters = await prisma.product.findUnique({
//       where: {
//         id: courseId,
//       },
//       select: {
//         chapters: {
//           orderBy: {
//             position: "asc",
//           },
//           select: {
//             id: true,
//             position: true,
//           },
//         },
//       },
//     });

//     if (!productWithChapters) {
//       return {
//         status: "error",
//         message: "Product not Found",
//       };
//     }

//     const chapters = productWithChapters.chapters;

//     const chapterToDelete = chapters.find(
//       (chapter) => chapter.id === chapterId,
//     );

//     if (!chapterToDelete) {
//       return {
//         status: "error",
//         message: "Chapter not Found in the product",
//       };
//     }

//     const remainingChapters = chapters.filter(
//       (chapter) => chapter.id !== chapterId,
//     );

//     const updates = remainingChapters.map((chapter, index) => {
//       return prisma.chapter.update({
//         where: {
//           id: chapter.id,
//         },
//         data: {
//           position: index + 1,
//         },
//       });
//     });

//     await prisma.$transaction([
//       ...updates,

//       prisma.chapter.delete({
//         where: {
//           id: chapterId,
//         },
//       }),
//     ]);

//     revalidatePath(`/manage/products/${courseId}/edit`);

//     return {
//       status: "success",
//       message: "Chapter deleted and reordered successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to delete chapter",
//     };
//   }
// }

// "use server";

// import arcjet, { fixedWindow } from "@/lib/arcjet";
// import prisma from "@/lib/prisma";
// import { ApiResponse } from "@/lib/types";
// import {
//   chapterSchema,
//   ChapterSchemaType,
//   lessonSchema,
//   LessonSchemaType,
//   productSchema,
//   ProductSchemaType,
// } from "@/lib/zodSchemas";
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

// export async function editCourse(
//   data: ProductSchemaType,
//   id: string,
// ): Promise<ApiResponse> {
//   const user = await requireManager();

//   try {
//     const reg = await request();
//     const decision = await aj.protect(reg, {
//       fingerprint: user.user.id,
//     });

//     if (decision.isDenied()) {
//       if (decision.reason.isRateLimit()) {
//         return {
//           status: "error",
//           message: "Rate limit exceeded. Please try again later.",
//         };
//       } else {
//         return {
//           status: "error",
//           message: "Request denied.",
//         };
//       }
//     }

//     const result = productSchema.safeParse(data);

//     if (!result.success) {
//       return {
//         status: "error",
//         message: "Invalid data",
//       };
//     }

//     let oldFileKeyToDelete: string | null = null;

//     await prisma.$transaction(async (tx) => {
//       // 1. Check product exists
//       const product = await tx.product.findFirst({
//         where: {
//           id,
//           userId: user.user.id,
//         },
//       });

//       if (!product) {
//         throw new Error("Product not found");
//       }

//       // 2. Identify if the file key changed
//       const currentImageKey = product.imageKey;
//       if (currentImageKey && currentImageKey !== result.data.fileKey) {
//         oldFileKeyToDelete = currentImageKey;
//       }

//       // Update Product table including course-specific fields
//       await tx.product.update({
//         where: {
//           id,
//         },
//         data: {
//           title: result.data.title,
//           description: result.data.description,
//           price: result.data.price,
//           slug: result.data.slug,
//           duration: result.data.duration,
//           category: result.data.category,
//           imageKey: result.data.fileKey,
//         },
//       });
//     });

//     // 3. Delete the old file from UploadThing after DB transaction succeeds
//     if (oldFileKeyToDelete) {
//       try {
//         await utapi.deleteFiles(oldFileKeyToDelete);
//       } catch (deleteError) {
//         console.error(
//           "Failed to delete old image from UploadThing:",
//           deleteError,
//         );
//       }
//     }

//     revalidatePath("/manage/products");

//     return {
//       status: "success",
//       message: "Course updated successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "An error occurred while updating the product",
//     };
//   }
// }

// export async function editLesson({
//   lessonId,
//   productId,
//   values,
// }: {
//   lessonId: string;
//   productId: string;
//   values: LessonSchemaType;
// }): Promise<ApiResponse> {
//   await requireManager();

//   try {
//     const result = lessonSchema.safeParse(values);

//     if (!result.success) {
//       return {
//         status: "error",
//         message: "Invalid data",
//       };
//     }

//     const keysToDelete: string[] = [];

//     await prisma.$transaction(async (tx) => {
//       const existingLesson = await tx.lesson.findUnique({
//         where: { id: lessonId },
//         select: { videoKey: true, thumbnailKey: true },
//       });

//       if (!existingLesson) {
//         throw new Error("Lesson not found");
//       }

//       if (
//         existingLesson.videoKey &&
//         result.data.videoKey &&
//         existingLesson.videoKey !== result.data.videoKey
//       ) {
//         keysToDelete.push(existingLesson.videoKey);
//       }

//       if (
//         existingLesson.thumbnailKey &&
//         result.data.thumbnailKey &&
//         existingLesson.thumbnailKey !== result.data.thumbnailKey
//       ) {
//         keysToDelete.push(existingLesson.thumbnailKey);
//       }

//       await tx.lesson.update({
//         where: { id: lessonId },
//         data: {
//           title: result.data.name,
//           description: result.data.description,
//           videoKey: result.data.videoKey,
//           thumbnailKey: result.data.thumbnailKey,
//         },
//       });
//     });

//     if (keysToDelete.length > 0) {
//       try {
//         await utapi.deleteFiles(keysToDelete);
//       } catch (deleteError) {
//         console.error(
//           "Failed to delete old lesson files from UploadThing:",
//           deleteError,
//         );
//       }
//     }

//     revalidatePath(`/manage/products/${productId}/edit`);

//     return {
//       status: "success",
//       message: "Lesson updated successfully",
//     };
//   } catch (error) {
//     console.error("EDIT LESSON ERROR:", error);
//     return {
//       status: "error",
//       message: "Failed to update lesson",
//     };
//   }
// }

// export async function reorderLessons(
//   chapterId: string,
//   lessons: { id: string; position: number }[],
//   courseId: string,
// ): Promise<ApiResponse> {
//   await requireManager();
//   try {
//     if (!lessons || lessons.length === 0) {
//       return {
//         status: "error",
//         message: "No lessons provided for reordering",
//       };
//     }

//     const updates = lessons.map((lesson) =>
//       prisma.lesson.update({
//         where: {
//           id: lesson.id,
//           chapterId: chapterId,
//         },
//         data: {
//           position: lesson.position,
//         },
//       }),
//     );

//     await prisma.$transaction(updates);

//     revalidatePath(`/manage/products/${courseId}/edit`);

//     return {
//       status: "success",
//       message: "Lessons reordered successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to reorder lessons",
//     };
//   }
// }

// export async function reorderChapters(
//   productId: string,
//   chapters: { id: string; position: number }[],
// ): Promise<ApiResponse> {
//   await requireManager();
//   try {
//     if (!chapters || chapters.length === 0) {
//       return {
//         status: "error",
//         message: "No chapters provided for reordering.",
//       };
//     }

//     const updates = chapters.map((chapter) =>
//       prisma.chapter.update({
//         where: {
//           id: chapter.id,
//           productId,
//         },
//         data: {
//           position: chapter.position,
//         },
//       }),
//     );

//     await prisma.$transaction(updates);

//     revalidatePath(`/manage/products/${productId}/edit`);

//     return {
//       status: "success",
//       message: "Chapters reordered successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to reorder chapters",
//     };
//   }
// }

// export async function createChapter(
//   values: ChapterSchemaType,
// ): Promise<ApiResponse> {
//   await requireManager();
//   try {
//     const result = chapterSchema.safeParse(values);

//     if (!result.success) {
//       return {
//         status: "error",
//         message: "Invalid Data",
//       };
//     }

//     await prisma.$transaction(async (tx) => {
//       const product = await tx.product.findUnique({
//         where: {
//           id: result.data.productId,
//         },
//       });

//       if (!product) {
//         throw new Error("Product does not exist");
//       }

//       const maxPos = await tx.chapter.findFirst({
//         where: {
//           productId: product.id,
//         },
//         select: {
//           position: true,
//         },
//         orderBy: {
//           position: "desc",
//         },
//       });

//       await tx.chapter.create({
//         data: {
//           title: result.data.name,
//           productId: product.id,
//           position: (maxPos?.position ?? 0) + 1,
//         },
//       });
//     });

//     revalidatePath(`/manage/products/${result.data.productId}/edit`);

//     return {
//       status: "success",
//       message: "Chapter Created Successfully",
//     };
//   } catch (error) {
//     console.error("CREATE CHAPTER ERROR:", error);
//     return {
//       status: "error",
//       message: "Failed to create chapter",
//     };
//   }
// }

// export async function createLesson(
//   values: LessonSchemaType,
// ): Promise<ApiResponse> {
//   await requireManager();
//   try {
//     const result = lessonSchema.safeParse(values);

//     if (!result.success) {
//       return {
//         status: "error",
//         message: "Invalid Data",
//       };
//     }

//     await prisma.$transaction(async (tx) => {
//       const maxPos = await tx.lesson.findFirst({
//         where: {
//           chapterId: result.data.chapterId,
//         },
//         select: {
//           position: true,
//         },
//         orderBy: {
//           position: "desc",
//         },
//       });

//       await tx.lesson.create({
//         data: {
//           title: result.data.name,
//           description: result.data.description,
//           videoKey: result.data.videoKey,
//           thumbnailKey: result.data.thumbnailKey,
//           chapterId: result.data.chapterId,
//           position: (maxPos?.position ?? 0) + 1,
//         },
//       });
//     });

//     revalidatePath(`/manage/products/${result.data.productId}/edit`);

//     return {
//       status: "success",
//       message: "Lesson Created Successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to create lesson",
//     };
//   }
// }

// export async function deleteLesson({
//   chapterId,
//   courseId,
//   lessonId,
// }: {
//   chapterId: string;
//   courseId: string;
//   lessonId: string;
// }): Promise<ApiResponse> {
//   await requireManager();
//   try {
//     const chapterWithLessons = await prisma.chapter.findUnique({
//       where: {
//         id: chapterId,
//       },
//       select: {
//         lessons: {
//           orderBy: {
//             position: "asc",
//           },
//           select: {
//             id: true,
//             position: true,
//             videoKey: true,
//             thumbnailKey: true,
//           },
//         },
//       },
//     });

//     if (!chapterWithLessons) {
//       return {
//         status: "error",
//         message: "Chapter not Found",
//       };
//     }

//     const lessons = chapterWithLessons.lessons;
//     const lessonsToDelete = lessons.find((lesson) => lesson.id === lessonId);

//     if (!lessonsToDelete) {
//       return {
//         status: "error",
//         message: "Lesson not Found in the chapter",
//       };
//     }

//     const keysToDelete: string[] = [];
//     if (lessonsToDelete.videoKey) keysToDelete.push(lessonsToDelete.videoKey);
//     if (lessonsToDelete.thumbnailKey)
//       keysToDelete.push(lessonsToDelete.thumbnailKey);

//     const remainingLessons = lessons.filter((lesson) => lesson.id !== lessonId);

//     const updates = remainingLessons.map((lesson, index) => {
//       return prisma.lesson.update({
//         where: { id: lesson.id },
//         data: { position: index + 1 },
//       });
//     });

//     await prisma.$transaction([
//       ...updates,
//       prisma.lesson.delete({
//         where: {
//           id: lessonId,
//           chapterId: chapterId,
//         },
//       }),
//     ]);

//     if (keysToDelete.length > 0) {
//       try {
//         await utapi.deleteFiles(keysToDelete);
//       } catch (deleteError) {
//         console.error(
//           "Failed to delete lesson files from UploadThing:",
//           deleteError,
//         );
//       }
//     }

//     revalidatePath(`/manage/products/${courseId}/edit`);

//     return {
//       status: "success",
//       message: "Lesson deleted and reordered successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to delete lesson",
//     };
//   }
// }

// export async function deleteChapter({
//   chapterId,
//   courseId,
// }: {
//   chapterId: string;
//   courseId: string;
// }): Promise<ApiResponse> {
//   await requireManager();
//   try {
//     const productWithChapters = await prisma.product.findUnique({
//       where: {
//         id: courseId,
//       },
//       select: {
//         chapters: {
//           orderBy: {
//             position: "asc",
//           },
//           select: {
//             id: true,
//             position: true,
//           },
//         },
//       },
//     });

//     if (!productWithChapters) {
//       return {
//         status: "error",
//         message: "Product not Found",
//       };
//     }

//     const chapters = productWithChapters.chapters;
//     const chapterToDelete = chapters.find(
//       (chapter) => chapter.id === chapterId,
//     );

//     if (!chapterToDelete) {
//       return {
//         status: "error",
//         message: "Chapter not Found in the product",
//       };
//     }

//     const remainingChapters = chapters.filter(
//       (chapter) => chapter.id !== chapterId,
//     );

//     const updates = remainingChapters.map((chapter, index) => {
//       return prisma.chapter.update({
//         where: { id: chapter.id },
//         data: { position: index + 1 },
//       });
//     });

//     await prisma.$transaction([
//       ...updates,
//       prisma.chapter.delete({
//         where: {
//           id: chapterId,
//         },
//       }),
//     ]);

//     revalidatePath(`/manage/products/${courseId}/edit`);

//     return {
//       status: "success",
//       message: "Chapter deleted and reordered successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to delete chapter",
//     };
//   }
// }

// "use server";

// import arcjet, { fixedWindow } from "@/lib/arcjet";
// import prisma from "@/lib/prisma";
// import { ApiResponse } from "@/lib/types";
// import {
//   chapterSchema,
//   ChapterSchemaType,
//   lessonSchema,
//   LessonSchemaType,
//   productSchema,
//   ProductSchemaType,
// } from "@/lib/zodSchemas";
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

// export async function editCourse(
//   data: ProductSchemaType,
//   id: string,
// ): Promise<ApiResponse> {
//   const user = await requireManager();

//   try {
//     const reg = await request();
//     const decision = await aj.protect(reg, {
//       fingerprint: user.user.id,
//     });

//     if (decision.isDenied()) {
//       if (decision.reason.isRateLimit()) {
//         return {
//           status: "error",
//           message: "Rate limit exceeded. Please try again later.",
//         };
//       } else {
//         return {
//           status: "error",
//           message: "Request denied.",
//         };
//       }
//     }

//     const result = productSchema.safeParse(data);

//     if (!result.success) {
//       return {
//         status: "error",
//         message: "Invalid data",
//       };
//     }

//     let oldFileKeyToDelete: string | null = null;

//     await prisma.$transaction(async (tx) => {
//       // 1. Check product exists
//       const product = await tx.product.findFirst({
//         where: {
//           id,
//           userId: user.user.id,
//         },
//         include: {
//           course: true,
//         },
//       });

//       if (!product) {
//         throw new Error("Product not found");
//       }

//       // 2. Identify if the file key changed
//       const currentImageKey = product.course?.imageKey;
//       if (currentImageKey && currentImageKey !== result.data.fileKey) {
//         oldFileKeyToDelete = currentImageKey;
//       }

//       // Update Product table
//       await tx.product.update({
//         where: {
//           id,
//         },
//         data: {
//           title: result.data.title,
//           description: result.data.description,
//           price: result.data.price,
//           slug: result.data.slug,
//         },
//       });

//       // 3. Check if course exists
//       if (product.course) {
//         // Course exists -> update
//         await tx.course.update({
//           where: {
//             productId: id,
//           },
//           data: {
//             duration: result.data.duration,
//             category: result.data.category,
//             imageKey: result.data.fileKey,
//           },
//         });
//       } else {
//         // Course does not exist -> create
//         await tx.course.create({
//           data: {
//             productId: id,
//             duration: result.data.duration,
//             category: result.data.category,
//             imageKey: result.data.fileKey,
//           },
//         });
//       }
//     });

//     // 4. Delete the old file from UploadThing after DB transaction succeeds
//     if (oldFileKeyToDelete) {
//       try {
//         await utapi.deleteFiles(oldFileKeyToDelete);
//       } catch (deleteError) {
//         console.error(
//           "Failed to delete old image from UploadThing:",
//           deleteError,
//         );
//       }
//     }

//     revalidatePath("/manage/products");

//     return {
//       status: "success",
//       message: "Course updated successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "An error occurred while updating the product",
//     };
//   }
// }

// export async function editLesson({
//   lessonId,
//   productId,
//   values,
// }: {
//   lessonId: string;
//   productId: string;
//   values: LessonSchemaType;
// }): Promise<ApiResponse> {
//   await requireManager();

//   try {
//     const result = lessonSchema.safeParse(values);

//     if (!result.success) {
//       return {
//         status: "error",
//         message: "Invalid data",
//       };
//     }

//     const keysToDelete: string[] = [];

//     await prisma.$transaction(async (tx) => {
//       // 1. Fetch existing lesson to check for old keys
//       const existingLesson = await tx.lesson.findUnique({
//         where: { id: lessonId },
//         select: { videoKey: true, thumbnailKey: true },
//       });

//       if (!existingLesson) {
//         throw new Error("Lesson not found");
//       }

//       // 2. Collect old video key if replaced
//       if (
//         existingLesson.videoKey &&
//         result.data.videoKey &&
//         existingLesson.videoKey !== result.data.videoKey
//       ) {
//         keysToDelete.push(existingLesson.videoKey);
//       }

//       // 3. Collect old thumbnail key if replaced
//       if (
//         existingLesson.thumbnailKey &&
//         result.data.thumbnailKey &&
//         existingLesson.thumbnailKey !== result.data.thumbnailKey
//       ) {
//         keysToDelete.push(existingLesson.thumbnailKey);
//       }

//       // 4. Update the lesson
//       await tx.lesson.update({
//         where: { id: lessonId },
//         data: {
//           title: result.data.name,
//           description: result.data.description,
//           videoKey: result.data.videoKey,
//           thumbnailKey: result.data.thumbnailKey,
//         },
//       });
//     });

//     // 5. Delete old files from UploadThing
//     if (keysToDelete.length > 0) {
//       try {
//         await utapi.deleteFiles(keysToDelete);
//       } catch (deleteError) {
//         console.error(
//           "Failed to delete old lesson files from UploadThing:",
//           deleteError,
//         );
//       }
//     }

//     revalidatePath(`/manage/products/${productId}/edit`);

//     return {
//       status: "success",
//       message: "Lesson updated successfully",
//     };
//   } catch (error) {
//     console.error("EDIT LESSON ERROR:", error);
//     return {
//       status: "error",
//       message: "Failed to update lesson",
//     };
//   }
// }

// export async function reorderLessons(
//   chapterId: string,
//   lessons: { id: string; position: number }[],
//   courseId: string,
// ): Promise<ApiResponse> {
//   await requireManager();
//   try {
//     if (!lessons || lessons.length === 0) {
//       return {
//         status: "error",
//         message: "No lessons provided for reordering",
//       };
//     }

//     const updates = lessons.map((lesson) =>
//       prisma.lesson.update({
//         where: {
//           id: lesson.id,
//           chapterId: chapterId,
//         },
//         data: {
//           position: lesson.position,
//         },
//       }),
//     );

//     await prisma.$transaction(updates);

//     revalidatePath(`/manage/products/${courseId}/edit`);

//     return {
//       status: "success",
//       message: "Lessons reordered successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to reorder lessons",
//     };
//   }
// }

// export async function reorderChapters(
//   productId: string,
//   chapters: { id: string; position: number }[],
// ): Promise<ApiResponse> {
//   await requireManager();
//   try {
//     if (!chapters || chapters.length === 0) {
//       return {
//         status: "error",
//         message: "No chapters provided for reordering.",
//       };
//     }

//     const updates = chapters.map((chapter) =>
//       prisma.chapter.update({
//         where: {
//           id: chapter.id,
//           productId,
//         },
//         data: {
//           position: chapter.position,
//         },
//       }),
//     );

//     await prisma.$transaction(updates);

//     revalidatePath(`/manage/products/${productId}/edit`);

//     return {
//       status: "success",
//       message: "Chapters reordered successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to reorder chapters",
//     };
//   }
// }

// export async function createChapter(
//   values: ChapterSchemaType,
// ): Promise<ApiResponse> {
//   await requireManager();
//   try {
//     const result = chapterSchema.safeParse(values);

//     if (!result.success) {
//       return {
//         status: "error",
//         message: "Invalid Data",
//       };
//     }

//     await prisma.$transaction(async (tx) => {
//       const course = await tx.course.findUnique({
//         where: {
//           productId: result.data.productId,
//         },
//       });

//       if (!course) {
//         throw new Error("Course does not exist");
//       }

//       const maxPos = await tx.chapter.findFirst({
//         where: {
//           courseId: course.id,
//         },
//         select: {
//           position: true,
//         },
//         orderBy: {
//           position: "desc",
//         },
//       });

//       await tx.chapter.create({
//         data: {
//           title: result.data.name,
//           courseId: course.id,
//           position: (maxPos?.position ?? 0) + 1,
//         },
//       });
//     });

//     revalidatePath(`/manage/products/${result.data.productId}/edit`);

//     return {
//       status: "success",
//       message: "Chapter Created Successfully",
//     };
//   } catch (error) {
//     console.error("CREATE CHAPTER ERROR:", error);
//     return {
//       status: "error",
//       message: "Failed to create chapter",
//     };
//   }
// }

// export async function createLesson(
//   values: LessonSchemaType,
// ): Promise<ApiResponse> {
//   await requireManager();
//   try {
//     const result = lessonSchema.safeParse(values);

//     if (!result.success) {
//       return {
//         status: "error",
//         message: "Invalid Data",
//       };
//     }

//     await prisma.$transaction(async (tx) => {
//       const maxPos = await tx.lesson.findFirst({
//         where: {
//           chapterId: result.data.chapterId,
//         },
//         select: {
//           position: true,
//         },
//         orderBy: {
//           position: "desc",
//         },
//       });

//       await tx.lesson.create({
//         data: {
//           title: result.data.name,
//           description: result.data.description,
//           videoKey: result.data.videoKey,
//           thumbnailKey: result.data.thumbnailKey,
//           chapterId: result.data.chapterId,
//           position: (maxPos?.position ?? 0) + 1,
//         },
//       });
//     });

//     revalidatePath(`/manage/products/${result.data.productId}/edit`);

//     return {
//       status: "success",
//       message: "Lesson Created Successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to create lesson",
//     };
//   }
// }

// export async function deleteLesson({
//   chapterId,
//   courseId,
//   lessonId,
// }: {
//   chapterId: string;
//   courseId: string;
//   lessonId: string;
// }): Promise<ApiResponse> {
//   await requireManager();
//   try {
//     const chapterWithLessons = await prisma.chapter.findUnique({
//       where: {
//         id: chapterId,
//       },
//       select: {
//         lessons: {
//           orderBy: {
//             position: "asc",
//           },
//           select: {
//             id: true,
//             position: true,
//             videoKey: true,
//             thumbnailKey: true,
//           },
//         },
//       },
//     });

//     if (!chapterWithLessons) {
//       return {
//         status: "error",
//         message: "Chapter not Found",
//       };
//     }

//     const lessons = chapterWithLessons.lessons;
//     const lessonsToDelete = lessons.find((lesson) => lesson.id === lessonId);

//     if (!lessonsToDelete) {
//       return {
//         status: "error",
//         message: "Lesson not Found in the chapter",
//       };
//     }

//     // Collect keys to delete from UploadThing
//     const keysToDelete: string[] = [];
//     if (lessonsToDelete.videoKey) keysToDelete.push(lessonsToDelete.videoKey);
//     if (lessonsToDelete.thumbnailKey)
//       keysToDelete.push(lessonsToDelete.thumbnailKey);

//     const remainingLessons = lessons.filter((lesson) => lesson.id !== lessonId);

//     const updates = remainingLessons.map((lesson, index) => {
//       return prisma.lesson.update({
//         where: { id: lessonId },
//         data: { position: index + 1 },
//       });
//     });

//     await prisma.$transaction([
//       ...updates,
//       prisma.lesson.delete({
//         where: {
//           id: lessonId,
//           chapterId: chapterId,
//         },
//       }),
//     ]);

//     if (keysToDelete.length > 0) {
//       try {
//         await utapi.deleteFiles(keysToDelete);
//       } catch (deleteError) {
//         console.error(
//           "Failed to delete lesson files from UploadThing:",
//           deleteError,
//         );
//       }
//     }

//     revalidatePath(`/manage/products/${courseId}/edit`);

//     return {
//       status: "success",
//       message: "Lesson deleted and reordered successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to delete lesson",
//     };
//   }
// }

// export async function deleteChapter({
//   chapterId,
//   courseId,
// }: {
//   chapterId: string;
//   courseId: string;
// }): Promise<ApiResponse> {
//   await requireManager();
//   try {
//     const productWithChapters = await prisma.course.findUnique({
//       where: {
//         productId: courseId,
//       },
//       select: {
//         chapter: {
//           orderBy: {
//             position: "asc",
//           },
//           select: {
//             id: true,
//             position: true,
//           },
//         },
//       },
//     });

//     if (!productWithChapters) {
//       return {
//         status: "error",
//         message: "Product not Found",
//       };
//     }

//     const chapters = productWithChapters.chapter;
//     const chapterToDelete = chapters.find(
//       (chapter) => chapter.id === chapterId,
//     );

//     if (!chapterToDelete) {
//       return {
//         status: "error",
//         message: "Chapter not Found in the product",
//       };
//     }

//     const remainingChapters = chapters.filter(
//       (chapter) => chapter.id !== chapterId,
//     );

//     const updates = remainingChapters.map((chapter, index) => {
//       return prisma.chapter.update({
//         where: { id: chapter.id },
//         data: { position: index + 1 },
//       });
//     });
//     await prisma.$transaction([
//       ...updates,
//       prisma.chapter.delete({
//         where: {
//           id: chapterId,
//         },
//       }),
//     ]);
//     revalidatePath(`/manage/products/${courseId}/edit`);

//     return {
//       status: "success",
//       message: "Chapter deleted and reordered successfully",
//     };
//   } catch {
//     return {
//       status: "error",
//       message: "Failed to delete chapter",
//     };
//   }
// }
