"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteProductAction(productId: string) {
  try {
    // If your Prisma relations use `onDelete: Cascade`,
    // deleting the product automatically deletes chapters, lessons, purchases, etc.
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    revalidatePath("/admin/products"); // Adjust path if different
    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return {
      success: false,
      error: "Failed to delete product and its related records.",
    };
  }
}
