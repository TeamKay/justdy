"use server";

import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { requireManager } from "./require-manager";

const utapi = new UTApi();

export async function deleteProductDeliverable(
  productId: string,
): Promise<ApiResponse> {
  await requireManager();

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        fileKey: true,
        type: true,
      },
    });

    if (!product) {
      return {
        status: "error",
        message: "Product not found.",
      };
    }

    if (product.type === "Course") {
      return {
        status: "error",
        message: "Course thumbnails cannot be deleted as deliverable files.",
      };
    }

    const fileKey = product.fileKey;

    await prisma.product.update({
      where: { id: productId },
      data: {
        fileKey: null,
        fileType: null,
        fileSize: null,
      },
    });

    if (fileKey) {
      try {
        await utapi.deleteFiles(fileKey);
      } catch (uploadThingError) {
        // The database is already cleared. Log the storage failure so it can
        // be retried/cleaned up without leaving the product pointing at it.
        console.error(
          "Failed to delete deliverable from UploadThing:",
          uploadThingError,
        );
      }
    }

    revalidatePath(`/manage/products/${productId}/edit`);
    revalidatePath("/manage/products");

    return {
      status: "success",
      message: "Deliverable deleted successfully.",
    };
  } catch (error) {
    console.error("DELETE PRODUCT DELIVERABLE ERROR:", error);

    return {
      status: "error",
      message: "Failed to delete deliverable.",
    };
  }
}
