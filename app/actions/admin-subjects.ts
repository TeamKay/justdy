"use server";

import prisma from "@/lib/prisma";
import { subjectSchema } from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";

export async function getSubjects() {
  return await prisma.subject.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });
}

export async function getSubjectById(id: string) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id },
    });
    return subject;
  } catch (error) {
    console.error("getSubjectById error:", error);
    return null;
  }
}

export async function getActiveOnboardingSubjects() {
  try {
    return await prisma.subject.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
  } catch (error) {
    console.error("Failed to load onboarding subjects:", error);
    return [];
  }
}

export async function createSubject(values: unknown) {
  try {
    // Validates incoming fields against your updated subject Zod schema
    const validatedData = subjectSchema.parse(values);

    const subject = await prisma.subject.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
      },
    });

    revalidatePath("/admin/subjects");

    return {
      status: "success",
      data: subject,
    };
  } catch (error) {
    console.error(error);

    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to create subject",
    };
  }
}

export async function updateSubject(id: string, values: unknown) {
  try {
    const validatedData = subjectSchema.parse(values);

    await prisma.subject.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
      },
    });

    // Clear caches for layout paths to force changes UI-wide immediately
    revalidatePath("/admin/subjects");

    return {
      status: "success",
    };
  } catch (error) {
    console.error("updateSubject error:", error);

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "An unexpected system fault occurred while updating.",
    };
  }
}

export async function deleteSubject(id: string) {
  try {
    // Standard direct deletion since there are no image/media file assets to flush
    await prisma.subject.delete({
      where: { id },
    });

    revalidatePath("/admin/subjects");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete subject:", error);
    return { success: false, error: "Failed to delete subject" };
  }
}
