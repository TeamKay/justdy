"use server";

import "server-only";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export type DigitalProductInput = {
  productId: string;
  title: string;
  smallDescription: string;
  description: string;
  price: number;
  imagesToDelete?: string[];
  digitalProduct: {
    fileKey: string;
    fileType: string;
    fileSize: number;
    images: { imageKey: string; position: number }[];
  };
};

export async function updateDigitalProduct(values: DigitalProductInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id;

    if (!userId) {
      return { status: "error", message: "Unauthorized. Please log in." };
    }

    // 1. Verify ownership & grab current digitalProduct ID
    const product = await prisma.product.findUnique({
      where: { id: values.productId },
      select: {
        userId: true,
        digitalProduct: {
          select: { id: true },
        },
      },
    });

    if (!product || product.userId !== userId) {
      return {
        status: "error",
        message: "Product not found or access denied.",
      };
    }

    // 2. Cleanup deleted files from UploadThing storage
    if (values.imagesToDelete && values.imagesToDelete.length > 0) {
      try {
        await utapi.deleteFiles(values.imagesToDelete);
      } catch (utError) {
        console.error("Failed to delete old files from UploadThing:", utError);
      }
    }

    // 3. Perform atomic update in DB
    await prisma.$transaction(async (tx) => {
      // Upsert parent product and DigitalProduct
      const updatedProduct = await tx.product.update({
        where: { id: values.productId },
        data: {
          title: values.title,
          smallDescription: values.smallDescription,
          description: values.description,
          price: Number(values.price),
          digitalProduct: {
            upsert: {
              create: {
                fileKey: values.digitalProduct.fileKey,
                fileType: values.digitalProduct.fileType,
                fileSize: values.digitalProduct.fileSize,
              },
              update: {
                fileKey: values.digitalProduct.fileKey,
                fileType: values.digitalProduct.fileType,
                fileSize: values.digitalProduct.fileSize,
              },
            },
          },
        },
        include: {
          digitalProduct: true,
        },
      });

      const digitalProductId = updatedProduct.digitalProduct?.id;

      if (digitalProductId) {
        // Replace existing images with the updated gallery set
        await tx.digitalProductImage.deleteMany({
          where: { digitalProductId },
        });

        if (values.digitalProduct.images.length > 0) {
          await tx.digitalProductImage.createMany({
            data: values.digitalProduct.images.map((img) => ({
              digitalProductId,
              imageKey: img.imageKey,
              position: img.position,
            })),
          });
        }
      }
    });

    revalidatePath(`/admin/products/${values.productId}`);
    revalidatePath(`/educator/products`);

    return {
      status: "success",
      message: "Digital product updated successfully!",
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

// export type DigitalProductInput = {
//   productId: string;
//   title: string;
//   smallDescription: string;
//   description: string;
//   price: number;
//   // images: string[];
//   imagesToDelete?: string[];
//   digitalProduct: {
//     fileKey: string;
//     fileType: string;
//     fileSize: number;
//     images: { imageKey: string; position: number }[];
//   };
// };

// export async function updateDigitalProduct(values: DigitalProductInput) {
//   try {
//     const session = await auth.api.getSession({
//       headers: await headers(),
//     });
//     const userId = session?.user?.id;

//     if (!userId) {
//       return { status: "error", message: "Unauthorized. Please log in." };
//     }

//     // 1. Verify ownership
//     const product = await prisma.product.findUnique({
//       where: { id: values.productId },
//       select: { userId: true },
//     });

//     if (!product || product.userId !== userId) {
//       return {
//         status: "error",
//         message: "Product not found or access denied.",
//       };
//     }

//     // 2. Delete removed images from UploadThing storage
//     if (values.imagesToDelete && values.imagesToDelete.length > 0) {
//       try {
//         await utapi.deleteFiles(values.imagesToDelete);
//         console.log(
//           "Successfully deleted old files from UploadThing:",
//           values.imagesToDelete,
//         );
//       } catch (utError) {
//         // Log error but don't crash the database update process if storage cleanup fails
//         console.error("Failed to delete old files from UploadThing:", utError);
//       }
//     }

//     // 2. Update parent product & upsert/update the nested DigitalProduct record
//     await prisma.product.update({
//       where: { id: values.productId },
//       data: {
//         title: values.title,
//         smallDescription: values.smallDescription,
//         description: values.description,
//         price: Number(values.price),

//         digitalProduct: {
//           upsert: {
//             create: {
//               fileKey: values.digitalProduct.fileKey,
//               fileType: values.digitalProduct.fileType,
//               fileSize: values.digitalProduct.fileSize,
//             },
//             update: {
//               fileKey: values.digitalProduct.fileKey,
//               fileType: values.digitalProduct.fileType,
//               fileSize: values.digitalProduct.fileSize,
//             },
//           },
//         },
//       },
//     });

//     revalidatePath(`/admin/products/${values.productId}`);
//     revalidatePath(`/educator/products`);

//     return {
//       status: "success",
//       message: "Digital product updated successfully!",
//     };
//   } catch (error) {
//     // Check terminal logs for full Prisma error output
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
