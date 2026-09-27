import { openai } from "@/lib/openai";

import { WorksheetDocumentSchema } from "./schema";

import type { ProjectContext } from "@/lib/ai/project-context";

export interface GenerateWorksheetInput {
  prompt?: string;

  gradeLevel: string;
  subject: string;
  topic: string;
  title?: string;
  learningObjective?: string;
  questionCount: number;
  difficulty: string;
  questionTypes: string[];
  instructions?: string;

  projectContext?: ProjectContext | null;
}

function buildWorksheetPrompt(input: GenerateWorksheetInput): string {
  const projectContext = input.projectContext;

  const projectContextBlock =
    projectContext &&
    (projectContext.instructions ||
      projectContext.audience ||
      projectContext.gradeLevel ||
      projectContext.subject ||
      projectContext.preferences)
      ? `
PROJECT CONTEXT

Use the following project context as standing guidance for this worksheet.

${
  projectContext.instructions
    ? `Instructions: ${projectContext.instructions}`
    : ""
}

${projectContext.audience ? `Audience: ${projectContext.audience}` : ""}

${projectContext.gradeLevel ? `Grade level: ${projectContext.gradeLevel}` : ""}

${projectContext.subject ? `Subject: ${projectContext.subject}` : ""}

${
  projectContext.preferences
    ? `Preferences: ${projectContext.preferences}`
    : ""
}

Rules:
- Treat the project context as persistent guidance.
- The current worksheet request remains the primary task.
- Do not interpret the project context as an additional user request.
- When the current request conflicts with project context, follow the current request.
`
      : "";

  return `
${projectContextBlock}

CURRENT WORKSHEET REQUEST

${input.prompt ?? ""}

WORKSHEET SPECIFICATIONS

Grade level: ${input.gradeLevel}
Subject: ${input.subject}
Topic: ${input.topic}
Title: ${input.title ?? ""}
Learning objective: ${input.learningObjective ?? ""}
Difficulty: ${input.difficulty}
Question count: ${input.questionCount}

Question types:
${input.questionTypes.join(", ")}

Additional instructions:
${input.instructions ?? ""}

IMPORTANT:
- Generate exactly ${input.questionCount} questions.
- Number questions from 1 through ${input.questionCount}.
- Generate one answer-key entry for every question.
- Set totalPoints to the sum of all question points.
- Use only the requested question types.

Create the worksheet according to these specifications.
`;
}

function buildJsonSchema(questionCount: number) {
  return {
    type: "object",

    additionalProperties: false,

    required: [
      "version",
      "title",
      "subject",
      "gradeLevel",
      "topic",
      "learningObjective",
      "instructions",
      "questions",
      "totalPoints",
      "answerKey",
    ],

    properties: {
      version: {
        type: "string",
      },

      title: {
        type: "string",
      },

      subject: {
        type: "string",
      },

      gradeLevel: {
        type: "string",
      },

      topic: {
        type: "string",
      },

      learningObjective: {
        type: "string",
      },

      instructions: {
        type: "string",
      },

      questions: {
        type: "array",

        minItems: questionCount,
        maxItems: questionCount,

        items: {
          type: "object",

          additionalProperties: false,

          required: [
            "id",
            "number",
            "type",
            "question",
            "options",
            "answer",
            "explanation",
            "points",
          ],

          properties: {
            id: {
              type: "string",
            },

            number: {
              type: "integer",
            },

            type: {
              type: "string",

              enum: [
                "multiple_choice",
                "short_answer",
                "true_false",
                "fill_in_blank",
                "matching",
                "open_response",
              ],
            },

            question: {
              type: "string",
            },

            options: {
              anyOf: [
                {
                  type: "array",

                  items: {
                    type: "object",

                    additionalProperties: false,

                    required: ["id", "text"],

                    properties: {
                      id: {
                        type: "string",
                      },

                      text: {
                        type: "string",
                      },
                    },
                  },
                },

                {
                  type: "null",
                },
              ],
            },

            answer: {
              type: "string",
            },

            explanation: {
              anyOf: [
                {
                  type: "string",
                },

                {
                  type: "null",
                },
              ],
            },

            points: {
              type: "integer",
            },
          },
        },
      },

      totalPoints: {
        type: "integer",
      },

      answerKey: {
        type: "array",

        minItems: questionCount,
        maxItems: questionCount,

        items: {
          type: "object",

          additionalProperties: false,

          required: [
            "questionNumber",
            "answer",
            "explanation",
          ],

          properties: {
            questionNumber: {
              type: "integer",
            },

            answer: {
              type: "string",
            },

            explanation: {
              anyOf: [
                {
                  type: "string",
                },

                {
                  type: "null",
                },
              ],
            },
          },
        },
      },
    },
  } as const;
}

export async function generateWorksheet(
  input: GenerateWorksheetInput,
) {
  if (
    !Number.isInteger(input.questionCount) ||
    input.questionCount < 1 ||
    input.questionCount > 100
  ) {
    throw new Error(
      "Question count must be between 1 and 100.",
    );
  }

  if (
    !input.questionTypes ||
    input.questionTypes.length === 0
  ) {
    throw new Error(
      "At least one question type is required.",
    );
  }

  const response = await openai.chat.completions.create({
    model: "gpt-5",

    response_format: {
      type: "json_schema",

      json_schema: {
        name: "justdy_worksheet",

        strict: true,

        schema: buildJsonSchema(input.questionCount),
      },
    },

    messages: [
      {
        role: "system",

        content:
          "You are the educational content engine for Justdy Learning. Generate accurate, age-appropriate educational content. Follow every worksheet specification exactly, especially the requested question count.",
      },

      {
        role: "user",

        content: buildWorksheetPrompt(input),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error(
      "The AI returned an empty worksheet.",
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(
      "The AI returned invalid JSON.",
    );
  }

  const worksheet =
    WorksheetDocumentSchema.parse(parsed);

  return worksheet;
}
