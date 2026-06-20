"use server";

import prisma from "@/lib/prisma";

export default async function deleteAvailabilitySlot(formData: FormData) {
  const id = formData.get("id");

  await prisma.availability.delete({
    where: { id: String(id) },
  });

  return { success: true };
}
