"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProductStatus(
  productId: string,
  status: "Published" | "Rejected",
) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { status },
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to update product status:", error);
    return { success: false, error: "Failed to update product status" };
  }
}
