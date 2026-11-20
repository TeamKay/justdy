
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
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

const challengeSchema = z.object({
  challengeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gradeLevel: z.enum(ALLOWED_GRADE_LEVELS),
  subject: z.string().trim().min(1).max(60),
  topic: z.string().trim().min(1).max(100),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  title: z.string().trim().min(3).max(160),
  question: z.string().trim().min(5).max(10000),
  options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
  correctAnswer: z.string().trim().min(1).max(300),
  hint: z.string().max(2000).optional(),
  explanation: z.string().trim().min(1).max(5000),
  points: z.number().int().min(1).max(1000),
}).superRefine((data, ctx) => {
  const normalizedOptions = data.options.map((option) =>
    option.trim().toLowerCase()
  );

  if (new Set(normalizedOptions).size !== normalizedOptions.length) {
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: "Answer choices must be unique.",
    });
  }

  if (!data.options.some((option) =>
    option.trim() === data.correctAnswer.trim()
  )) {
    ctx.addIssue({
      code: "custom",
      path: ["correctAnswer"],
      message: "The correct answer must match one of the answer choices.",
    });
  }
});

type ChallengeStatus = "DRAFT" | "PUBLISHED";

async function requireAdministrator() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Please sign in again.");
  }

  const administrator = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      status: true,
      emailVerified: true,
    },
  });

  if (
    !administrator ||
    administrator.role !== "ADMIN" ||
    administrator.status !== "Active" ||
    !administrator.emailVerified
  ) {
    throw new Error("Verified administrator access is required.");
  }

  return administrator;
}

function parseChallengeInput(input: unknown) {
  const parsed = challengeSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Please check the challenge details."
    );
  }

  const date = new Date(`${parsed.data.challengeDate}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== parsed.data.challengeDate
  ) {
    throw new Error("Please provide a valid challenge date.");
  }

  return {
    ...parsed.data,
    challengeDate: date,
    hint: parsed.data.hint?.trim() || null,
    options: parsed.data.options.map((option) => option.trim()),
  };
}

function refreshChallengePages() {
  revalidatePath("/admin/daily-challenges");
  revalidatePath("/");
}

export async function createDailyChallenge(input: unknown) {
  try {
    const administrator = await requireAdministrator();
    const data = parseChallengeInput(input);

    await prisma.dailyChallenge.create({
      data: {
        ...data,
        status: "DRAFT",
        createdById: administrator.id,
      },
    });

    refreshChallengePages();
    return { success: true, message: "Challenge saved as a draft." };
  } catch (error) {
    console.error("Create daily challenge:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "A challenge already exists for this grade, subject and date.",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save challenge.",
    };
  }
}

export async function updateDailyChallenge(
  id: string,
  input: unknown
) {
  try {
    await requireAdministrator();

    if (!id?.trim()) {
      throw new Error("Challenge ID is required.");
    }

    const data = parseChallengeInput(input);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.dailyChallenge.findUnique({
        where: { id },
        select: {
          id: true,
          attempts: { select: { id: true }, take: 1 },
        },
      });

      if (!existing) {
        throw new Error("Challenge not found.");
      }

      if (existing.attempts.length > 0) {
        throw new Error(
          "This challenge already has learner submissions and can no longer be edited."
        );
      }

      await tx.dailyChallenge.update({
        where: { id },
        data,
      });
    });

    refreshChallengePages();
    return { success: true, message: "Challenge updated successfully." };
  } catch (error) {
    console.error("Update daily challenge:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Another challenge already uses this grade, subject and date.",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update challenge.",
    };
  }
}

export async function setDailyChallengeStatus(
  id: string,
  status: ChallengeStatus
) {
  try {
    await requireAdministrator();

    if (!id?.trim() || !["DRAFT", "PUBLISHED"].includes(status)) {
      throw new Error("Invalid challenge action.");
    }

    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!challenge) {
      throw new Error("Challenge not found.");
    }

    await prisma.dailyChallenge.update({
      where: { id },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    refreshChallengePages();
    return {
      success: true,
      message: status === "PUBLISHED"
        ? "Challenge published."
        : "Challenge returned to draft.",
    };
  } catch (error) {
    console.error("Change daily challenge status:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update status.",
    };
  }
}
