"use server";

import { requireEducator } from "@/app/actions/require-educator";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  }),
);

// Helper function to extract the raw file identifier if the key was stored as a full URL
function getRawFileKey(key: string): string {
  if (key.startsWith("http")) {
    return key.substring(key.lastIndexOf("/") + 1);
  }
  return key;
}

export async function deleteProduct(productId: string): Promise<ApiResponse> {
  const session = await requireEducator();

  try {
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

    // 1. Query the Product, related Course, and all descendant Chapter/Lesson keys
    const productData = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        course: {
          select: {
            imageKey: true,
            chapter: {
              select: {
                lessons: {
                  select: {
                    thumbnailKey: true,
                    videoKey: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!productData) {
      return {
        status: "error",
        message: "Product not found",
      };
    }

    // 2. Gather all file keys that need to be removed from UploadThing
    const keysToDelete: string[] = [];

    if (productData.course) {
      // Course Image / Thumbnail Key
      if (productData.course.imageKey) {
        keysToDelete.push(getRawFileKey(productData.course.imageKey));
      }

      // Lesson Thumbnail & Video Keys
      productData.course.chapter.forEach((chapter) => {
        chapter.lessons.forEach((lesson) => {
          if (lesson.thumbnailKey) {
            keysToDelete.push(getRawFileKey(lesson.thumbnailKey));
          }
          if (lesson.videoKey) {
            keysToDelete.push(getRawFileKey(lesson.videoKey));
          }
        });
      });
    }

    // 3. Delete files from UploadThing in a single batch
    if (keysToDelete.length > 0) {
      try {
        await utapi.deleteFiles(keysToDelete);
      } catch (utError) {
        // Log the error but don't halt DB deletion so the system doesn't get out of sync
        console.error("Failed to delete assets from UploadThing:", utError);
      }
    }

    // 4. Delete the product from DB (Cascades down to Course, Chapters, and Lessons)
    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/educator/products");

    return {
      status: "success",
      message: "Product deleted successfully",
    };
  } catch (error) {
    console.error("Delete error:", error);

    return {
      status: "error",
      message: "Product Failed to delete!",
    };
  }
}

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
