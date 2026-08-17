"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function PublishProduct(productId: string) {
  try {
    // ============================================================
    // 1. AUTHENTICATE USER
    // ============================================================

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // ============================================================
    // 2. FETCH PRODUCT
    // ============================================================
    //
    // A Course is now a Product with type = "Course".
    // Chapters belong directly to Product.
    // Lessons belong to Chapters.
    //
    // ============================================================

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        userId: session.user.id,
      },
      include: {
        chapters: {
          include: {
            lessons: true,
          },
        },
      },
    });

    if (!product) {
      return {
        success: false,
        error: "Product not found or access denied.",
      };
    }

    // ============================================================
    // 3. BASIC PRODUCT VALIDATION
    // ============================================================

    if (!product.title || product.title.trim() === "") {
      return {
        success: false,
        error: "Course title is required.",
      };
    }

    // ============================================================
    // 4. COURSE VALIDATION
    // ============================================================

    if (product.type === "Course") {
      const chapters = product.chapters ?? [];

      const totalLessons = chapters.reduce(
        (total, chapter) => total + (chapter.lessons?.length ?? 0),
        0,
      );

      // ----------------------------------------------------------
      // At least one chapter
      // ----------------------------------------------------------

      if (chapters.length === 0) {
        return {
          success: false,
          error: "Course must have at least one chapter before publishing.",
        };
      }

      // ----------------------------------------------------------
      // At least one lesson
      // ----------------------------------------------------------

      if (totalLessons === 0) {
        return {
          success: false,
          error: "Course must have at least one lesson before publishing.",
        };
      }
    }

    // ============================================================
    // 5. UPDATE PRODUCT STATUS
    // ============================================================

    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        status: "Published",
      },
    });

    // ============================================================
    // 6. REVALIDATE CACHE
    // ============================================================

    revalidatePath(`/manage/products/${productId}/edit`);

    revalidatePath("/manage/products");

    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error("Error publishing product:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "An unexpected database error occurred.",
    };
  }
}

// "use server";

// import "server-only";
// import prisma from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";
// import { revalidatePath } from "next/cache";

// export async function submitProductForReview(productId: string) {
//   try {
//     // 1. Authenticate session
//     const session = await auth.api.getSession({
//       headers: await headers(),
//     });
//     const userId = session?.user?.id;

//     if (!userId) {
//       return { status: "error", message: "Unauthorized: Please log in." };
//     }

//     // 2. Fetch product along with its digitalProduct relation
//     const existingProduct = await prisma.product.findFirst({
//       where: {
//         id: productId,
//         userId: userId,
//       },
//       include: {
//         digitalProduct: true,
//       },
//     });

//     if (!existingProduct) {
//       return { status: "error", message: "Product not found or unauthorized." };
//     }

//     // 3. Prevent duplicate submissions
//     if (existingProduct.status === "Pending") {
//       return { status: "error", message: "Product is already under review." };
//     }

//     // 4. Pre-flight check for Digital Products (ensures a file exists)
//     if (
//       existingProduct.type === "Downloadable" &&
//       !existingProduct.digitalProduct?.fileKey
//     ) {
//       return {
//         status: "error",
//         message:
//           "Cannot submit: Please upload the digital file before submitting for review.",
//       };
//     }

//     // 5. Update status
//     await prisma.product.update({
//       where: {
//         id: productId,
//       },
//       data: {
//         status: "Pending",
//       },
//     });

//     // 6. Revalidate cache
//     revalidatePath(`/admin/products/${productId}`);
//     revalidatePath(`/educator/products/${productId}/edit`);
//     revalidatePath(`/educator/products`);

//     return {
//       status: "success",
//       message: "Product submitted for review successfully!",
//     };
//   } catch (error) {
//     console.error("Error inside submitProductForReview action:", error);
//     return {
//       status: "error",
//       message:
//         "An unexpected error occurred while submitting your product for review.",
//     };
//   }
// }

// "use server";

// import "server-only";
// import prisma from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";
// import { revalidatePath } from "next/cache";

// export async function submitProductForReview(productId: string) {
//   try {
//     // 1. Authenticate the session
//     const session = await auth.api.getSession({
//       headers: await headers(),
//     });
//     const userId = session?.user?.id;

//     if (!userId) {
//       return { success: false, error: "Unauthorized: Please log in." };
//     }

//     // 2. Fetch the product directly
//     const existingProduct = await prisma.product.findFirst({
//       where: {
//         id: productId,
//         userId: userId,
//       },
//     });

//     if (!existingProduct) {
//       return { success: false, error: "Product not found or unauthorized." };
//     }

//     // 3. Prevent duplicate submissions if already pending
//     if (existingProduct.status === "Pending") {
//       return { success: false, error: "Product is already under review." };
//     }

//     // 4. Update status on the Product table
//     await prisma.product.update({
//       where: {
//         id: productId,
//       },
//       data: {
//         status: "Pending",
//       },
//     });

//     // 5. Purge Next.js data cache for the routes
//     revalidatePath(`/admin/products/${productId}`);
//     revalidatePath(`/educator/products/${productId}/edit`);
//     revalidatePath(`/educator/products`);

//     return { success: true };
//   } catch (error) {
//     console.error("Error inside submitProductForReview action:", error);
//     return {
//       success: false,
//       error:
//         "An unexpected error occurred while submitting your course for review.",
//     };
//   }
// }
