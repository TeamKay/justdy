import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  ResourceAccessType,
  ResourceStatus,
  ResourceType,
  ResourceVisibility,
} from "@/lib/generated/prisma/enums";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

interface RouteContext {
  params: Promise<{
    resourceId: string;
  }>;
}

interface QuizQuestion {
  id: string;
  type?: string;
  question?: string;
  options?: string[];
  points?: number;
}

interface QuizAnswerKey {
  questionId: string;
  answer: string;
  explanation?: string;
  points?: number;
}

interface SubmittedAnswers {
  [questionId: string]: string;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (!isRecord(value) || typeof value.id !== "string") {
    return false;
  }

  if (
    value.type !== undefined &&
    typeof value.type !== "string"
  ) {
    return false;
  }

  if (
    value.question !== undefined &&
    typeof value.question !== "string"
  ) {
    return false;
  }

  if (
    value.options !== undefined &&
    (!Array.isArray(value.options) ||
      !value.options.every(
        (option) => typeof option === "string",
      ))
  ) {
    return false;
  }

  if (
    value.points !== undefined &&
    (typeof value.points !== "number" ||
      !Number.isFinite(value.points) ||
      value.points < 0)
  ) {
    return false;
  }

  return true;
}

function isQuizAnswerKey(value: unknown): value is QuizAnswerKey {
  if (
    !isRecord(value) ||
    typeof value.questionId !== "string" ||
    typeof value.answer !== "string"
  ) {
    return false;
  }

  if (
    value.explanation !== undefined &&
    typeof value.explanation !== "string"
  ) {
    return false;
  }

  if (
    value.points !== undefined &&
    (typeof value.points !== "number" ||
      !Number.isFinite(value.points) ||
      value.points < 0)
  ) {
    return false;
  }

  return true;
}

function normalizeAnswer(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function readSubmittedAnswers(value: unknown): SubmittedAnswers | null {
  if (!isRecord(value)) {
    return null;
  }

  const answers: SubmittedAnswers = {};

  for (const [questionId, answer] of Object.entries(value)) {
    if (
      typeof questionId !== "string" ||
      !questionId.trim() ||
      typeof answer !== "string"
    ) {
      return null;
    }

    answers[questionId] = answer;
  }

  return answers;
}

function readQuizContent(value: unknown): {
  title: string;
  questions: QuizQuestion[];
} | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.title !== "string") {
    return null;
  }

  if (
    !Array.isArray(value.questions) ||
    !value.questions.every(isQuizQuestion)
  ) {
    return null;
  }

  return {
    title: value.title,
    questions: value.questions,
  };
}

function readAnswerKey(value: unknown): QuizAnswerKey[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  if (!value.every(isQuizAnswerKey)) {
    return null;
  }

  return value;
}

async function getPublishedQuiz(resourceId: string) {
  return prisma.resource.findFirst({
    where: {
      id: resourceId,
      type: ResourceType.QUIZ,
      status: ResourceStatus.PUBLISHED,
      visibility: {
        in: [
          // Marketplace resources are public in Phase 1.
          ResourceVisibility.PUBLIC,
          ResourceVisibility.MARKETPLACE,
        ],
      },
      accessType: ResourceAccessType.FREE,
    },
    select: {
      id: true,
      title: true,
      content: true,
      answerKey: true,
    },
  });
}


export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return jsonError("Authentication required.", 401);
    }

    const { resourceId } = await context.params;
    const normalizedResourceId = resourceId.trim();

    if (!normalizedResourceId) {
      return jsonError("Resource ID is required.", 400);
    }

    const body = await request.json().catch(() => null);

    if (!isRecord(body)) {
      return jsonError("Invalid request body.", 400);
    }

    const action =
      typeof body.action === "string"
        ? body.action.trim().toLowerCase()
        : "";

    if (action !== "start" && action !== "submit") {
      return jsonError(
        'Action must be either "start" or "submit".',
        400,
      );
    }

    const resource = await getPublishedQuiz(normalizedResourceId);

    if (!resource) {
      return jsonError(
        "Quiz not found or is not currently available.",
        404,
      );
    }

    const quiz = readQuizContent(resource.content);

    if (!quiz || quiz.questions.length === 0) {
      return jsonError(
        "This quiz has invalid or missing question content.",
        422,
      );
    }

    /*
     * START
     *
     * The answer key is deliberately never returned to the browser.
     */
    if (action === "start") {
      const activity = await prisma.learningActivity.create({
        data: {
          userId: user.id,
          resourceId: resource.id,
          activityType: "QUIZ",
          status: "STARTED",
          metadata: {
            questionCount: quiz.questions.length,
          },
        },
        select: {
          id: true,
          startedAt: true,
        },
      });

      return NextResponse.json(
        {
          activityId: activity.id,
          startedAt: activity.startedAt,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    /*
     * SUBMIT
     */
    const activityId =
      typeof body.activityId === "string"
        ? body.activityId.trim()
        : "";

    if (!activityId) {
      return jsonError(
        "An activity ID is required to submit the quiz.",
        400,
      );
    }

    const answers = readSubmittedAnswers(body.answers);

    if (!answers) {
      return jsonError(
        "Answers must be an object containing question IDs and answer text.",
        400,
      );
    }

    /*
     * Ownership check prevents a learner from submitting to another
     * learner's activity.
     */
    const activity = await prisma.learningActivity.findFirst({
      where: {
        id: activityId,
        userId: user.id,
        resourceId: resource.id,
        activityType: "QUIZ",
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!activity) {
      return jsonError("Quiz activity not found.", 404);
    }

    if (activity.status === "COMPLETED") {
      return jsonError(
        "This quiz attempt has already been submitted.",
        409,
      );
    }

    const answerKey = readAnswerKey(resource.answerKey);

    if (!answerKey || answerKey.length === 0) {
      return jsonError(
        "This quiz has an invalid answer key and cannot be scored.",
        422,
      );
    }

    const questionMap = new Map(
      quiz.questions.map((question) => [question.id, question]),
    );

    const answerMap = new Map(
      answerKey.map((item) => [item.questionId, item]),
    );

    /*
     * Require a valid answer-key entry for every published question.
     * This prevents silently giving learners full credit for malformed
     * or incomplete quiz data.
     */
    for (const question of quiz.questions) {
      if (!answerMap.has(question.id)) {
        return jsonError(
          "This quiz has an incomplete answer key and cannot be scored.",
          422,
        );
      }
    }

    /*
     * Ignore unknown answer IDs rather than allowing a client to
     * manufacture additional questions or points.
     */
    const results: Array<{
      questionId: string;
      correct: boolean;
      points: number;
      explanation?: string;
    }> = [];

    let score = 0;
    let maxScore = 0;
    let correctCount = 0;

    for (const question of quiz.questions) {
      const key = answerMap.get(question.id);

      if (!key) {
        continue;
      }

      const points =
        typeof key.points === "number"
          ? key.points
          : typeof question.points === "number"
            ? question.points
            : 1;

      maxScore += points;

      const submittedAnswer = answers[question.id] ?? "";
      const correct =
        normalizeAnswer(submittedAnswer) ===
        normalizeAnswer(key.answer);

      if (correct) {
        score += points;
        correctCount += 1;
      }

      results.push({
        questionId: question.id,
        correct,
        points: correct ? points : 0,
        ...(key.explanation
          ? { explanation: key.explanation }
          : {}),
      });
    }

    /*
     * Store only the learner's submitted answers and non-sensitive
     * scoring metadata. The expected answers remain server-side.
     */
    const updatedActivity =
      await prisma.learningActivity.updateMany({
        where: {
          id: activity.id,
          userId: user.id,
          resourceId: resource.id,
          activityType: "QUIZ",
          status: "STARTED",
        },
        data: {
          status: "COMPLETED",
          score,
          maxScore,
          answers,
          metadata: {
            questionCount: quiz.questions.length,
            answeredCount: Object.keys(answers).filter(
              (questionId) =>
                questionMap.has(questionId) &&
                answers[questionId].trim().length > 0,
            ).length,
            correctCount,
          },
          completedAt: new Date(),
        },
      });

    if (updatedActivity.count !== 1) {
      return jsonError(
        "This quiz attempt could not be completed. It may already have been submitted.",
        409,
      );
    }

    return NextResponse.json(
      {
        activityId: activity.id,
        score,
        maxScore,
        correctCount,
        totalQuestions: quiz.questions.length,
        results,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Quiz submission error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to process the quiz.",
      500,
    );
  }
}
