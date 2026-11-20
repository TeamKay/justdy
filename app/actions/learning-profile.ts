
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ALLOWED_GRADE_LEVELS = [
  "Pre-K",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
] as const;

export type GradeLevel = (typeof ALLOWED_GRADE_LEVELS)[number];

export async function saveLearnerGrade(gradeLevel: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Please sign in to save your learning level.",
      };
    }

    if (
      !ALLOWED_GRADE_LEVELS.includes(
        gradeLevel as GradeLevel,
      )
    ) {
      return {
        success: false,
        error: "Please select a valid grade level.",
      };
    }

    await prisma.studentProfile.upsert({
      where: {
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        gradeLevel,
      },
      update: {
        gradeLevel,
      },
    });

    revalidatePath("/");

    return {
      success: true,
      gradeLevel,
      message: "Your learning level has been saved!",
    };
  } catch (error) {
    console.error("Save learner grade error:", error);

    return {
      success: false,
      error: "We couldn't save your grade. Please try again.",
    };
  }
}
