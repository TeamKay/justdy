import { NextRequest, NextResponse } from "next/server";

import {
  ResourceType,
} from "@/lib/generated/prisma/enums";

import {
  getAuthenticatedUser,
} from "@/lib/auth/get-authenticated-user";

import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    resourceId: string;
  }>;
};

function jsonError(
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

type QuizQuestion = {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  points: number;
};

type QuizAnswer = {
  id: string;
  answer: string;
  explanation: string | null;
  points: number;
};

type Quiz = {
  title: string;
  description: string;
  instructions: string;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
};

function cleanString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeQuiz(
  content: unknown,
  answerKey: unknown,
): Quiz {
  const data =
    content &&
    typeof content === "object"
      ? (content as Record<
          string,
          unknown
        >)
      : {};

  const rawQuestions =
    Array.isArray(
      data.questions,
    )
      ? data.questions
      : [];

  const answers =
    Array.isArray(answerKey)
      ? answerKey
      : [];

  const normalizedAnswers =
    answers.map((answer, index) => {
      const item =
        answer &&
        typeof answer === "object"
          ? (answer as Record<
              string,
              unknown
            >)
          : {};

      return {
        id:
          cleanString(item.id) ||
          `q${index + 1}`,

        answer:
          cleanString(
            item.answer,
          ),

        explanation:
          typeof item.explanation ===
          "string"
            ? item.explanation
            : null,

        points:
          typeof item.points ===
            "number" &&
          Number.isFinite(
            item.points,
          )
            ? item.points
            : 1,
      };
    });

  const questions =
    rawQuestions.map(
      (question, index) => {
        const item =
          question &&
          typeof question ===
            "object"
            ? (question as Record<
                string,
                unknown
              >)
            : {};

        const id =
          cleanString(item.id) ||
          `q${index + 1}`;

        const matchingAnswer =
          normalizedAnswers.find(
            (answer) =>
              answer.id === id,
          );

        return {
          id,

          type:
            cleanString(
              item.type,
            ) ||
            "multiple_choice",

          question:
            cleanString(
              item.question,
            ),

          options:
            Array.isArray(
              item.options,
            )
              ? item.options.map(
                  String,
                )
              : null,

          points:
            typeof item.points ===
              "number" &&
            Number.isFinite(
              item.points,
            )
              ? item.points
              : matchingAnswer
                ?.points ?? 1,
        };
      },
    );

  return {
    title:
      cleanString(
        data.title,
      ) ||
      "Untitled Quiz",

    description:
      cleanString(
        data.description,
      ),

    instructions:
      cleanString(
        data.instructions,
      ),

    questions,

    answers:
      normalizedAnswers,
  };
}

/* ============================================================
   GET EXISTING QUIZ RESOURCE
   ============================================================ */

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const user =
      await getAuthenticatedUser();

    if (!user) {
      return jsonError(
        "Unauthorized",
        401,
      );
    }

    const {
      resourceId,
    } = await context.params;

    const normalizedId =
      resourceId.trim();

    if (!normalizedId) {
      return jsonError(
        "Resource ID is required.",
        400,
      );
    }

    const resource =
      await prisma.resource.findFirst({
        where: {
          id: normalizedId,
          userId: user.id,
          type: ResourceType.QUIZ,
        },

        include: {
          versions: {
            orderBy: {
              versionNumber: "desc",
            },

            take: 1,
          },
        },
      });

    if (!resource) {
      return jsonError(
        "Quiz resource not found.",
        404,
      );
    }

    const version =
      resource.versions[0];

    const content =
      version?.content ??
      resource.content;

    const answerKey =
      version?.answerKey ??
      resource.answerKey;

    const quiz =
      normalizeQuiz(
        content,
        answerKey,
      );

    return NextResponse.json({
      resource: {
        id:
          resource.id,

        title:
          resource.title,

        description:
          resource.description,

        slug:
          resource.slug,

        type:
          resource.type,

        status:
          resource.status,

        visibility:
          resource.visibility,

        accessType:
          resource.accessType,

        content,

        answerKey,

        versionId:
          version?.id ?? null,

        versionNumber:
          version?.versionNumber ??
          null,

        updatedAt:
          resource.updatedAt,

        createdAt:
          resource.createdAt,
      },

      quiz,
    });
  } catch (error) {
    console.error(
      "[quiz-resource-by-id:get]",
      error,
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to load quiz.",
      500,
    );
  }
}

/* ============================================================
   POST NEW VERSION
   ============================================================ */

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user =
      await getAuthenticatedUser();

    if (!user) {
      return jsonError(
        "Unauthorized",
        401,
      );
    }

    const {
      resourceId,
    } = await context.params;

    const normalizedId =
      resourceId.trim();

    if (!normalizedId) {
      return jsonError(
        "Resource ID is required.",
        400,
      );
    }

    const resource =
      await prisma.resource.findFirst({
        where: {
          id: normalizedId,
          userId: user.id,
          type: ResourceType.QUIZ,
        },
      });

    if (!resource) {
      return jsonError(
        "Quiz resource not found.",
        404,
      );
    }

    const body =
      await request
        .json()
        .catch(() => null);

    const suppliedQuiz =
      body &&
      typeof body === "object" &&
      "quiz" in body
        ? (
            body as {
              quiz?: unknown;
            }
          ).quiz
        : null;

    if (!suppliedQuiz) {
      return jsonError(
        "Quiz data is required.",
        400,
      );
    }

    const quiz =
      normalizeQuiz(
        suppliedQuiz,
        null,
      );

    if (
      quiz.questions.length ===
      0
    ) {
      return jsonError(
        "A quiz must contain at least one question.",
        422,
      );
    }

    const content = {
      title: quiz.title,
      description:
        quiz.description,
      instructions:
        quiz.instructions,

      questions:
        quiz.questions.map(
          (question) => ({
            id: question.id,
            type: question.type,
            question:
              question.question,
            options:
              question.options,
            points:
              question.points,
          }),
        ),
    };

    const answerKey =
      quiz.answers;

    /*
     * This endpoint is used for editing an
     * existing Resource, so we need a new
     * immutable ResourceVersion.
     */
    const latestVersion =
      await prisma.resourceVersion.findFirst(
        {
          where: {
            resourceId:
              resource.id,
          },

          orderBy: {
            versionNumber:
              "desc",
          },

          select: {
            versionNumber:
              true,
          },
        },
      );

    const nextVersionNumber =
      (latestVersion?.versionNumber ??
        0) + 1;

    const result =
      await prisma.$transaction(
        async (tx) => {
          const version =
            await tx.resourceVersion.create(
              {
                data: {
                  resourceId:
                    resource.id,

                  versionNumber:
                    nextVersionNumber,

                  content,

                  answerKey,

                  generationId:
                    null,

                  metadata: {
                    source:
                      "QUIZ_EDITOR",
                    questionCount:
                      quiz.questions
                        .length,
                  },
                },
              },
            );

          const updatedResource =
            await tx.resource.update({
              where: {
                id: resource.id,
              },

              data: {
                title:
                  quiz.title,

                description:
                  quiz.description,

                content,

                answerKey,

                metadata: {
                  source:
                    "QUIZ_EDITOR",
                  questionCount:
                    quiz.questions
                      .length,
                },

                updatedAt:
                  new Date(),
              },
            });

          return {
            resource:
              updatedResource,

            version,
          };
        },
      );

    return NextResponse.json({
      success: true,

      resource: {
        id:
          result.resource.id,

        title:
          result.resource.title,

        description:
          result.resource.description,

        slug:
          result.resource.slug,

        type:
          result.resource.type,

        status:
          result.resource.status,

        visibility:
          result.resource.visibility,

        accessType:
          result.resource.accessType,

        versionId:
          result.version.id,

        versionNumber:
          result.version
            .versionNumber,

        content:
          result.version.content,

        answerKey:
          result.version.answerKey,

        updatedAt:
          result.resource.updatedAt,

        createdAt:
          result.resource.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "[quiz-resource-by-id:post]",
      error,
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to save quiz.",
      500,
    );
  }
}