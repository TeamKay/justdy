"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveProfileImage(userId: string, imageUrl: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      imageUrl,
    },
  });

  revalidatePath(`/profile/${userId}`);

  return { success: true };
}
