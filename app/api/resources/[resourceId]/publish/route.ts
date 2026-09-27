import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

import {
  ResourceStatus,
  ResourceType,
  ResourceVisibility,
} from "@/lib/generated/prisma/enums";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

import { WorksheetDocumentSchema } from "@/lib/ai/worksheet/schema";

interface RouteContext {
  params: Promise<{
    resourceId: string;
  }>;
}

function errorResponse(
  message: string,
  status = 400,
) {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

/* ============================================================
   QUIZ VALIDATION
   ============================================================ */

interface QuizQuestion {
  id: string;
  question: string;
  type?: string;
  options?: string[];
  points?: number;
}

interface QuizAnswerKeyItem {
  questionId: string;
  answer: string;
  explanation?: string | null;
  points?: number;
}

function isQuizQuestion(
  value: unknown,
): value is QuizQuestion {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const question =
    value as Record<string, unknown>;

  if (
    typeof question.id !== "string" ||
    !question.id.trim()
  ) {
    return false;
  }

  if (
    typeof question.question !== "string" ||
    !question.question.trim()
  ) {
    return false;
  }

  if (
    question.type !== undefined &&
    typeof question.type !== "string"
  ) {
    return false;
  }

 if (
  question.options !== undefined &&
  question.options !== null
) {
  if (!Array.isArray(question.options)) {
    return false;
  }

  if (
    !question.options.every(
      (option) => typeof option === "string",
    )
  ) {
    return false;
  }
}

  if (
    question.points !== undefined &&
    (
      typeof question.points !== "number" ||
      !Number.isFinite(question.points) ||
      question.points < 0
    )
  ) {
    return false;
  }

  return true;
}

function isQuizAnswerKeyItem(
  value: unknown,
): value is QuizAnswerKeyItem {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const answer =
    value as Record<string, unknown>;

  if (
    typeof answer.questionId !== "string" ||
    !answer.questionId.trim()
  ) {
    return false;
  }

  if (
    typeof answer.answer !== "string" ||
    !answer.answer.trim()
  ) {
    return false;
  }

  if (
    answer.explanation !== undefined &&
    answer.explanation !== null &&
    typeof answer.explanation !== "string"
  ) {
    return false;
  }

  if (
    answer.points !== undefined &&
    (
      typeof answer.points !== "number" ||
      !Number.isFinite(answer.points) ||
      answer.points < 0
    )
  ) {
    return false;
  }

  return true;
}

function validateQuizContent(
  content: unknown,
): {
  valid: true;
  questions: QuizQuestion[];
} | {
  valid: false;
  error: string;
} {
  if (
    typeof content !== "object" ||
    content === null ||
    Array.isArray(content)
  ) {
    return {
      valid: false,
      error:
        "This quiz has invalid content and cannot be published.",
    };
  }

  const data =
    content as Record<string, unknown>;

  if (
    typeof data.title !== "string" ||
    !data.title.trim()
  ) {
    return {
      valid: false,
      error:
        "This quiz must have a title before it can be published.",
    };
  }

  if (!Array.isArray(data.questions)) {
    return {
      valid: false,
      error:
        "This quiz does not contain a valid question list.",
    };
  }

  if (data.questions.length === 0) {
    return {
      valid: false,
      error:
        "This quiz must contain at least one question before it can be published.",
    };
  }

  const questions: QuizQuestion[] = [];

  const questionIds = new Set<string>();

  for (const item of data.questions) {
    if (!isQuizQuestion(item)) {
      return {
        valid: false,
        error:
          "One or more quiz questions are invalid. Please fix them in the Quiz Editor.",
      };
    }

    if (questionIds.has(item.id)) {
      return {
        valid: false,
        error:
          "This quiz contains duplicate question IDs. Please fix the quiz in the editor.",
      };
    }

    questionIds.add(item.id);
    questions.push(item);
  }

  return {
    valid: true,
    questions,
  };
}

function validateQuizAnswerKey(
  answerKey: unknown,
  questions: QuizQuestion[],
): {
  valid: true;
} | {
  valid: false;
  error: string;
} {
  if (!Array.isArray(answerKey)) {
    return {
      valid: false,
      error:
        "This quiz is missing its answer key and cannot be published.",
    };
  }

  if (answerKey.length === 0) {
    return {
      valid: false,
      error:
        "This quiz has an empty answer key and cannot be published.",
    };
  }

  const questionIds = new Set(
    questions.map(
      (question) => question.id,
    ),
  );

  const answerQuestionIds =
    new Set<string>();

  for (const item of answerKey) {
    if (!isQuizAnswerKeyItem(item)) {
      return {
        valid: false,
        error:
          "This quiz has an invalid answer key and cannot be published.",
      };
    }

    if (
      !questionIds.has(
        item.questionId,
      )
    ) {
      return {
        valid: false,
        error:
          "The quiz answer key contains an answer for a question that does not exist.",
      };
    }

    if (
      answerQuestionIds.has(
        item.questionId,
      )
    ) {
      return {
        valid: false,
        error:
          "The quiz answer key contains duplicate answers for a question.",
      };
    }

    answerQuestionIds.add(
      item.questionId,
    );
  }

  /*
   * Every learner-facing question must
   * have a corresponding private answer.
   */
  for (const question of questions) {
    if (
      !answerQuestionIds.has(
        question.id,
      )
    ) {
      return {
        valid: false,
        error:
          "This quiz is missing an answer for one or more questions.",
      };
    }
  }

  return {
    valid: true,
  };
}

/* ============================================================
   PUBLISH RESOURCE
   ============================================================ */

/**
 * Phase 1 publishing gate.
 *
 * Publishing is performed against the canonical Resource.
 *
 * AIGeneration:
 *   AI generation/history event
 *
 * Resource:
 *   Canonical educational artifact
 *
 * ResourceVersion:
 *   Versioned content snapshot
 *
 * Published Resource:
 *   Discoverable learner-facing artifact
 */
export async function POST(
  _request: Request,
  {
    params,
  }: RouteContext,
) {
  const user =
    await getAuthenticatedUser();

  if (!user) {
    return errorResponse(
      "Authentication required.",
      401,
    );
  }

  const {
    resourceId,
  } = await params;

  const normalizedId =
    resourceId.trim();

  if (!normalizedId) {
    return errorResponse(
      "Resource ID is required.",
      400,
    );
  }

  const resource =
    await prisma.resource.findFirst({
      where: {
        id: normalizedId,
        userId: user.id,
      },

      select: {
        id: true,
        userId: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        visibility: true,
        content: true,
        answerKey: true,
        updatedAt: true,
      },
    });

  if (!resource) {
    return errorResponse(
      "Resource not found.",
      404,
    );
  }

  /*
   * Publishing permission is checked
   * before changing the resource.
   */
  if (!user.canPublish) {
    return errorResponse(
      "Your account does not currently have permission to publish resources.",
      403,
    );
  }

  /*
   * Archived and rejected resources
   * cannot be published.
   */
  if (
    resource.status ===
      ResourceStatus.ARCHIVED ||
    resource.status ===
      ResourceStatus.REJECTED
  ) {
    return errorResponse(
      "This resource cannot be published in its current state.",
      409,
    );
  }

  /*
   * Every published resource must
   * have learner-facing content.
   */
  if (!resource.content) {
    return errorResponse(
      "This resource has no content to publish.",
      409,
    );
  }

  /* ============================================================
     WORKSHEET VALIDATION
     ============================================================ */

  if (
    resource.type ===
    ResourceType.WORKSHEET
  ) {
    const parsed =
      WorksheetDocumentSchema.safeParse(
        resource.content,
      );

    if (!parsed.success) {
      return errorResponse(
        "This worksheet is invalid and cannot be published. Please fix it in the editor first.",
        422,
      );
    }

    if (!parsed.data.answerKey) {
      return errorResponse(
        "This worksheet is missing its answer key and cannot be published.",
        422,
      );
    }
  }

  /* ============================================================
     QUIZ VALIDATION
     ============================================================ */

  if (
    resource.type ===
    ResourceType.QUIZ
  ) {
    const contentResult =
      validateQuizContent(
        resource.content,
      );

    if (!contentResult.valid) {
      return errorResponse(
        contentResult.error,
        422,
      );
    }

    const answerKeyResult =
      validateQuizAnswerKey(
        resource.answerKey,
        contentResult.questions,
      );

    if (!answerKeyResult.valid) {
      return errorResponse(
        answerKeyResult.error,
        422,
      );
    }
  }

  /* ============================================================
     PUBLISH
     ============================================================ */

  const publishedAt =
    resource.status ===
    ResourceStatus.PUBLISHED
      ? undefined
      : new Date();

  const updated =
    await prisma.resource.updateMany({
      where: {
        id: resource.id,
        userId: user.id,
        updatedAt: resource.updatedAt,
      },

      data: {
        status:
          ResourceStatus.PUBLISHED,

        visibility:
          ResourceVisibility.PUBLIC,

        ...(publishedAt
          ? {
              publishedAt,
            }
          : {}),
      },
    });

  /*
   * If another request modified the
   * resource between our read and update,
   * do not silently overwrite it.
   */
  if (updated.count !== 1) {
    return errorResponse(
      "This resource was modified before it could be published. Please refresh and try again.",
      409,
    );
  }

  const savedResource =
    await prisma.resource.findUnique({
      where: {
        id: resource.id,
      },

      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        visibility: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

  if (!savedResource) {
    return errorResponse(
      "The resource was published, but its updated state could not be loaded.",
      500,
    );
  }

  return NextResponse.json(
    {
      success: true,

      resource: savedResource,

      publicUrl:
        `/resources/${encodeURIComponent(
          savedResource.slug,
        )}`,
    },
    {
      status: 200,

      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}