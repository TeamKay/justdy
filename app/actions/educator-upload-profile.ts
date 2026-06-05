"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveProfileImage(
  userId: string,
  imageUrl: string,
  imageKey: string,
) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      imageUrl,
      imageKey,
    },
  });

  revalidatePath(`/profile/${userId}`);

  return { success: true };
}
