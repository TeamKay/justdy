import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

import {
  AIGenerationStatus,
  AIGenerationType,
  ResourceAccessType,
  ResourceStatus,
  ResourceType,
  ResourceVisibility,
} from "@/lib/generated/prisma/enums";

import prisma from "@/lib/prisma";

type QuizQuestion = {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string | null;
  points: number;
};

type QuizAnswer = {
  id: string;
  answer: string;
  explanation: string | null;
  points: number;
};

type NormalizedQuiz = {
  title: string;
  description: string;
  instructions: string;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
};

type RouteContext = {
  params: Promise<{
    generationId: string;
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

function cleanString(
  value: unknown,
  fallback = "",
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function parseJsonText(
  value: unknown,
): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const withoutMarkdown = trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      return JSON.parse(withoutMarkdown);
    } catch {
      return null;
    }
  }
}

function normalizeQuestion(
  rawQuestion: unknown,
  index: number,
): QuizQuestion | null {
  if (
    !rawQuestion ||
    typeof rawQuestion !== "object"
  ) {
    return null;
  }

  const question =
    rawQuestion as Record<string, unknown>;

  const questionText = cleanString(
    question.question ??
      question.prompt,
  );

  if (!questionText) {
    return null;
  }

  const type = cleanString(
    question.type,
    "multiple_choice",
  )
    .toLowerCase()
    .replace(/\s+/g, "_");

  const rawOptions =
    question.options;

  let options: string[] | null = null;

  if (Array.isArray(rawOptions)) {
    const normalizedOptions =
      rawOptions
        .map((option) => {
          if (typeof option === "string") {
            return option.trim();
          }

          if (
            option &&
            typeof option === "object" &&
            "text" in option
          ) {
            return cleanString(
              (
                option as {
                  text?: unknown;
                }
              ).text,
            );
          }

          return "";
        })
        .filter(Boolean);

    options =
      normalizedOptions.length > 0
        ? normalizedOptions
        : null;
  }

  const answer = cleanString(
    question.answer ??
      question.correctAnswer ??
      question.correct_answer,
  );

  if (!answer) {
    return null;
  }

  const explanationValue =
    question.explanation ??
    question.rationale ??
    question.feedback;

  const explanation =
    typeof explanationValue ===
    "string"
      ? explanationValue.trim() || null
      : null;

  const pointsValue = Number(
    question.points,
  );

  const points =
    Number.isFinite(pointsValue) &&
    pointsValue >= 0
      ? pointsValue
      : 1;

  return {
    id:
      cleanString(question.id) ||
      `q${index + 1}`,

    type,

    question: questionText,

    options,

    answer,

    explanation,

    points,
  };
}

function normalizeQuiz(
  raw: unknown,
): NormalizedQuiz {
  const parsed =
    parseJsonText(raw);

  if (
    !parsed ||
    typeof parsed !== "object"
  ) {
    throw new Error(
      "The AI returned an invalid quiz format.",
    );
  }

  const data =
    parsed as Record<string, unknown>;

  const rawQuestions =
    Array.isArray(data.questions)
      ? data.questions
      : Array.isArray(data.items)
        ? data.items
        : [];

  const questions =
    rawQuestions
      .map((question, index) =>
        normalizeQuestion(
          question,
          index,
        ),
      )
      .filter(
        (
          question,
        ): question is QuizQuestion =>
          question !== null,
      );

  if (questions.length === 0) {
    throw new Error(
      "The generated quiz does not contain any valid questions.",
    );
  }

  const answers: QuizAnswer[] =
    questions.map((question) => ({
      id: question.id,
      answer: question.answer,
      explanation:
        question.explanation,
      points: question.points,
    }));

  return {
    title:
      cleanString(data.title) ||
      "Untitled Quiz",

    description:
      cleanString(data.description) ||
      "AI-generated educational quiz.",

    instructions:
      cleanString(data.instructions) ||
      "Answer each question carefully.",

    questions,

    answers,
  };
}

function buildResourceContent(
  quiz: NormalizedQuiz,
) {
  return {
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
}

function buildMetadata(
  generation: {
    id: string;
    projectId: string | null;
    prompt: string;
  },
  quiz: NormalizedQuiz,
  source: string,
) {
  return {
    source,
    generationId:
      generation.id,
    projectId:
      generation.projectId ??
      null,
    questionCount:
      quiz.questions.length,
    prompt:
      generation.prompt,
  };
}

async function findOwnedResource(
  userId: string,
  resourceId: string,
) {
  return prisma.resource.findFirst({
    where: {
      id: resourceId,
      userId,
      type: ResourceType.QUIZ,
    },
  });
}

/* ============================================================
   GET
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
      generationId,
    } = await context.params;

    const cleanGenerationId =
      generationId.trim();

    if (!cleanGenerationId) {
      return jsonError(
        "Generation ID is required.",
        400,
      );
    }

    const generation =
      await prisma.aIGeneration.findFirst(
        {
          where: {
            id: cleanGenerationId,
            userId: user.id,
            type:
              AIGenerationType.QUIZ,
          },
        },
      );

    if (!generation) {
      return jsonError(
        "Quiz generation not found.",
        404,
      );
    }

    if (
      generation.status !==
      AIGenerationStatus.COMPLETED
    ) {
      return jsonError(
        generation.status ===
          AIGenerationStatus.FAILED
          ? generation.errorMessage ||
              "Quiz generation failed."
          : "Quiz generation is not complete yet.",
        409,
      );
    }

    const existingResource =
      await prisma.resource.findFirst({
        where: {
          userId: user.id,
          type: ResourceType.QUIZ,

          versions: {
            some: {
              generationId:
                cleanGenerationId,
            },
          },
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

    if (existingResource) {
      const version =
        existingResource
          .versions[0];

      return NextResponse.json({
        resource: {
          id:
            existingResource.id,

          title:
            existingResource.title,

          description:
            existingResource.description,

          slug:
            existingResource.slug,

          type:
            existingResource.type,

          status:
            existingResource.status,

          visibility:
            existingResource.visibility,

          accessType:
            existingResource.accessType,

          versionId:
            version?.id ?? null,

          versionNumber:
            version?.versionNumber ??
            null,

          content:
            version?.content ??
            existingResource.content,

          answerKey:
            version?.answerKey ??
            existingResource.answerKey,

          updatedAt:
            existingResource.updatedAt,

          createdAt:
            existingResource.createdAt,
        },
      });
    }

    if (!generation.outputData) {
      return jsonError(
        "The quiz generation does not contain output data.",
        422,
      );
    }

    const quiz =
      normalizeQuiz(
        generation.outputData &&
          typeof generation.outputData ===
            "object" &&
          "text" in
            generation.outputData
          ? (
              generation.outputData as {
                text?: unknown;
              }
            ).text
          : generation.outputData,
      );

    return NextResponse.json({
      generation: {
        id:
          generation.id,

        projectId:
          generation.projectId,
      },

      quiz,
    });
  } catch (error) {
    console.error(
      "[quiz-resource:get]",
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
   POST
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
      generationId,
    } = await context.params;

    const cleanGenerationId =
      generationId.trim();

    if (!cleanGenerationId) {
      return jsonError(
        "Generation ID is required.",
        400,
      );
    }

    const generation =
      await prisma.aIGeneration.findFirst(
        {
          where: {
            id: cleanGenerationId,
            userId: user.id,
            type:
              AIGenerationType.QUIZ,
          },
        },
      );

    if (!generation) {
      return jsonError(
        "Quiz generation not found.",
        404,
      );
    }

    if (
      generation.status !==
      AIGenerationStatus.COMPLETED
    ) {
      return jsonError(
        "The quiz generation is not complete.",
        409,
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

    const suppliedResourceId =
      body &&
      typeof body === "object" &&
      "resourceId" in body &&
      typeof (
        body as {
          resourceId?: unknown;
        }
      ).resourceId === "string"
        ? (
            body as {
              resourceId: string;
            }
          ).resourceId.trim()
        : null;

    /*
     * ==========================================================
     * EXISTING RESOURCE
     * ==========================================================
     */

    if (suppliedResourceId) {
      const resource =
        await findOwnedResource(
          user.id,
          suppliedResourceId,
        );

      if (!resource) {
        return jsonError(
          "Quiz resource not found.",
          404,
        );
      }

      let quiz: NormalizedQuiz;

      if (suppliedQuiz) {
        quiz =
          normalizeQuiz(
            suppliedQuiz,
          );
      } else {
        quiz =
          normalizeQuiz(
            resource.content,
          );
      }

      const content =
        buildResourceContent(
          quiz,
        );

      const answerKey =
        quiz.answers;

      const metadata =
        buildMetadata(
          generation,
          quiz,
          "AI_GENERATION_EDIT",
        );

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
                      cleanGenerationId,

                    metadata,
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

                  metadata,

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
    }

    /*
     * ==========================================================
     * FIRST RESOURCE CREATION
     * ==========================================================
     */

    const existingResource =
      await prisma.resource.findFirst({
        where: {
          userId: user.id,
          type: ResourceType.QUIZ,

          versions: {
            some: {
              generationId:
                cleanGenerationId,
            },
          },
        },

        include: {
          versions: {
            where: {
              generationId:
                cleanGenerationId,
            },

            orderBy: {
              versionNumber:
                "desc",
            },

            take: 1,
          },
        },
      });

    /*
     * Protect against duplicate initial saves.
     */
    if (existingResource) {
      const version =
        existingResource
          .versions[0];

      return NextResponse.json({
        success: true,

        resource: {
          id:
            existingResource.id,

          title:
            existingResource.title,

          description:
            existingResource.description,

          slug:
            existingResource.slug,

          type:
            existingResource.type,

          status:
            existingResource.status,

          visibility:
            existingResource.visibility,

          accessType:
            existingResource.accessType,

          versionId:
            version?.id ?? null,

          versionNumber:
            version?.versionNumber ??
            null,

          content:
            version?.content ??
            existingResource.content,

          answerKey:
            version?.answerKey ??
            existingResource.answerKey,

          updatedAt:
            existingResource.updatedAt,

          createdAt:
            existingResource.createdAt,
        },
      });
    }

    let quiz: NormalizedQuiz;

    if (suppliedQuiz) {
      quiz =
        normalizeQuiz(
          suppliedQuiz,
        );
    } else {
      if (!generation.outputData) {
        return jsonError(
          "The quiz generation does not contain output data.",
          422,
        );
      }

      quiz =
        normalizeQuiz(
          generation.outputData &&
            typeof generation.outputData ===
              "object" &&
            "text" in
              generation.outputData
            ? (
                generation.outputData as {
                  text?: unknown;
                }
              ).text
            : generation.outputData,
        );
    }

    const content =
      buildResourceContent(
        quiz,
      );

    const answerKey =
      quiz.answers;

    const slugBase =
      quiz.title
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-",
        )
        .replace(
          /^-+|-+$/g,
          "",
        )
        .slice(0, 70);

    const slug =
      `${
        slugBase || "quiz"
      }-${crypto
        .randomUUID()
        .slice(0, 8)}`;

    const metadata =
      buildMetadata(
        generation,
        quiz,
        "AI_GENERATION",
      );

    const result =
      await prisma.$transaction(
        async (tx) => {
          const resource =
            await tx.resource.create({
              data: {
                userId: user.id,

                projectId:
                  generation.projectId ??
                  null,

                title:
                  quiz.title,

                description:
                  quiz.description,

                slug,

                type:
                  ResourceType.QUIZ,

                status:
                  ResourceStatus.DRAFT,

                visibility:
                  ResourceVisibility.PRIVATE,

                accessType:
                  ResourceAccessType.FREE,

                content,

                answerKey,

                metadata,
              },
            });

          const version =
            await tx.resourceVersion.create(
              {
                data: {
                  resourceId:
                    resource.id,

                  versionNumber: 1,

                  content,

                  answerKey,

                  generationId:
                    generation.id,

                  metadata,
                },
              },
            );

          return {
            resource,
            version,
          };
        },
      );

    return NextResponse.json(
      {
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
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "[quiz-resource:post]",
      error,
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to save quiz resource.",
      500,
    );
  }
}