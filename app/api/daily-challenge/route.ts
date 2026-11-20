
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getUtcChallengeDate() {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
}

function normalizeAnswer(value: string) {
  return value.trim().toLocaleLowerCase();
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function getLearnerContext() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { error: "UNAUTHENTICATED" as const };
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { gradeLevel: true },
  });

  if (!profile?.gradeLevel) {
    return { error: "GRADE_REQUIRED" as const };
  }

  return {
    error: null,
    userId: user.id,
    gradeLevel: profile.gradeLevel,
  };
}

function publicChallenge(challenge: {
  id: string;
  challengeDate: Date;
  gradeLevel: string;
  subject: string;
  topic: string;
  difficulty: string;
  title: string;
  question: string;
  options: unknown;
  hint: string | null;
  points: number;
}) {
  const options = Array.isArray(challenge.options)
    ? challenge.options.filter(
        (option): option is string => typeof option === "string"
      )
    : [];

  return {
    id: challenge.id,
    challengeDate: challenge.challengeDate.toISOString().slice(0, 10),
    gradeLevel: challenge.gradeLevel,
    subject: challenge.subject,
    topic: challenge.topic,
    difficulty: challenge.difficulty,
    title: challenge.title,
    question: challenge.question,
    options,
    hint: challenge.hint,
    points: challenge.points,
  };
}

export async function GET() {
  try {
    const learner = await getLearnerContext();

    if (learner.error === "UNAUTHENTICATED") {
      return NextResponse.json(
        { error: "Please sign in to access your daily challenge." },
        { status: 401 }
      );
    }

    if (learner.error === "GRADE_REQUIRED") {
      return NextResponse.json(
        { error: "Please select your school grade to receive a challenge." },
        { status: 409 }
      );
    }

    const challengeDate = getUtcChallengeDate();

    const challenge = await prisma.dailyChallenge.findFirst({
      where: {
        challengeDate,
        gradeLevel: learner.gradeLevel,
        status: "PUBLISHED",
      },
      orderBy: [
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    if (!challenge) {
      return NextResponse.json({
        challenge: null,
        message: "Your next daily challenge is being prepared.",
      });
    }

    const attempt = await prisma.dailyChallengeAttempt.findUnique({
      where: {
        challengeId_userId: {
          challengeId: challenge.id,
          userId: learner.userId,
        },
      },
      select: {
        isCorrect: true,
        score: true,
        submittedAt: true,
      },
    });

    return NextResponse.json({
      challenge: publicChallenge(challenge),
      attempt: attempt
        ? {
            isCorrect: attempt.isCorrect,
            score: attempt.score,
            submittedAt: attempt.submittedAt.toISOString(),
            correctAnswer: challenge.correctAnswer,
            explanation: challenge.explanation,
          }
        : null,
    });
  } catch (error) {
    console.error("Get daily challenge error:", error);

    return NextResponse.json(
      { error: "Unable to load your daily challenge." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const learner = await getLearnerContext();

    if (learner.error === "UNAUTHENTICATED") {
      return NextResponse.json(
        { error: "Please sign in to submit your answer." },
        { status: 401 }
      );
    }

    if (learner.error === "GRADE_REQUIRED") {
      return NextResponse.json(
        { error: "Please select your school grade first." },
        { status: 409 }
      );
    }

    const body: unknown = await request.json().catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      !("challengeId" in body) ||
      !("answer" in body) ||
      typeof body.challengeId !== "string" ||
      typeof body.answer !== "string" ||
      !body.challengeId.trim() ||
      !body.answer.trim() ||
      body.answer.length > 300
    ) {
      return NextResponse.json(
        { error: "Please select a valid answer." },
        { status: 400 }
      );
    }

    const challenge = await prisma.dailyChallenge.findFirst({
      where: {
        id: body.challengeId,
        challengeDate: getUtcChallengeDate(),
        gradeLevel: learner.gradeLevel,
        status: "PUBLISHED",
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "This challenge is unavailable or is not assigned to your grade." },
        { status: 404 }
      );
    }

    const options = Array.isArray(challenge.options)
      ? challenge.options.filter(
          (option): option is string => typeof option === "string"
        )
      : [];

    const submittedAnswer = body.answer;

    const selectedOption = options.find(
    (option) =>
        normalizeAnswer(option) === normalizeAnswer(submittedAnswer)
    );

    if (!selectedOption) {
      return NextResponse.json(
        { error: "Please choose one of the available answer choices." },
        { status: 400 }
      );
    }

    const isCorrect =
      normalizeAnswer(selectedOption) ===
      normalizeAnswer(challenge.correctAnswer);

    const score = isCorrect ? challenge.points : 0;

    try {
      await prisma.dailyChallengeAttempt.create({
        data: {
          challengeId: challenge.id,
          userId: learner.userId,
          answer: selectedOption,
          isCorrect,
          score,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const existingAttempt =
          await prisma.dailyChallengeAttempt.findUnique({
            where: {
              challengeId_userId: {
                challengeId: challenge.id,
                userId: learner.userId,
              },
            },
            select: {
              isCorrect: true,
              score: true,
              submittedAt: true,
            },
          });

        return NextResponse.json(
          {
            error: "You have already submitted an answer for this challenge.",
            attempt: existingAttempt
              ? {
                  isCorrect: existingAttempt.isCorrect,
                  score: existingAttempt.score,
                  submittedAt: existingAttempt.submittedAt.toISOString(),
                  correctAnswer: challenge.correctAnswer,
                  explanation: challenge.explanation,
                }
              : null,
          },
          { status: 409 }
        );
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      result: {
        isCorrect,
        score,
        correctAnswer: challenge.correctAnswer,
        explanation: challenge.explanation,
        message: isCorrect
          ? `Excellent work! You earned ${score} points.`
          : "Good effort! Review the explanation and keep learning.",
      },
    });
  } catch (error) {
    console.error("Submit daily challenge error:", error);

    return NextResponse.json(
      { error: "Unable to submit your answer. Please try again." },
      { status: 500 }
    );
  }
}
