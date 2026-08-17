"use server";

import { UTApi } from "uploadthing/server";
import { requireManager } from "./require-manager";

const utapi = new UTApi();

export async function deleteUTFile(fileKey: string) {
  await requireManager();
  try {
    await utapi.deleteFiles(fileKey);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete file:", error);
    return { success: false };
  }
}
