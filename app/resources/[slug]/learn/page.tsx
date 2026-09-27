import { notFound } from "next/navigation";

import prisma from "@/lib/prisma";

import {
  ResourceAccessType,
  ResourceStatus,
  ResourceType,
  ResourceVisibility,
} from "@/lib/generated/prisma/enums";
import PresentationLearner from "@/app/_components/PresentationLearner";
import { WorksheetDocumentSchema } from "@/lib/ai/worksheet/schema";

import ResourceLearner from "@/app/_components/ResourceLearner";
import QuizLearner from "@/app/_components/QuizLearner";
import ColoringPageLearner from "@/app/_components/ColoringPageLearner";
import DocumentLearner from "@/app/_components/DocumentLearner";
import ImageLearner from "@/app/_components/ImageLearner";

interface QuizQuestion {
  id: string;
  type?: string;
  question?: string;
  options?: string[] | null;
  points?: number;
}

interface QuizContent {
  title?: string;
  description?: string;
  instructions?: string;
  questions: QuizQuestion[];
}

interface ColoringPage {
  index: number;
  url: string;
  mimeType?: string | null;
}

interface ColoringPageContent {
  kind: "COLORING_PAGE";
  imageUrl?: string;
  pages?: ColoringPage[];
  prompt?: string;
}

interface ImageContent {
  title?: string;
  description?: string | null;
  imageUrl: string;
  assetId?: string | null;
  mimeType?: string | null;
  prompt?: string;
  model?: string | null;
  size?: string | null;
  quality?: string | null;
}

interface DocumentContent {
  title?: string;
  content: string;
}

/* -------------------------------------------------------------------------- */
/* Quiz validation                                                            */
/* -------------------------------------------------------------------------- */

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const question = value as Record<string, unknown>;

  if (
    typeof question.id !== "string" ||
    typeof question.question !== "string"
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
    typeof question.points !== "number"
  ) {
    return false;
  }

  return true;
}

function isQuizContent(value: unknown): value is QuizContent {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const content = value as Record<string, unknown>;

  if (
    content.title !== undefined &&
    typeof content.title !== "string"
  ) {
    return false;
  }

  if (
    content.description !== undefined &&
    typeof content.description !== "string"
  ) {
    return false;
  }

  if (
    content.instructions !== undefined &&
    typeof content.instructions !== "string"
  ) {
    return false;
  }

  return (
    Array.isArray(content.questions) &&
    content.questions.every(isQuizQuestion)
  );
}

/* -------------------------------------------------------------------------- */
/* Coloring page validation                                                   */
/* -------------------------------------------------------------------------- */

function isColoringPage(value: unknown): value is ColoringPage {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const page = value as Record<string, unknown>;

  return (
    typeof page.index === "number" &&
    Number.isInteger(page.index) &&
    page.index > 0 &&
    typeof page.url === "string" &&
    page.url.trim().length > 0 &&
    (
      page.mimeType === undefined ||
      page.mimeType === null ||
      typeof page.mimeType === "string"
    )
  );
}

function isColoringPageContent(
  value: unknown,
): value is ColoringPageContent {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const content = value as Record<string, unknown>;

  if (content.kind !== "COLORING_PAGE") {
    return false;
  }

  if (
    content.imageUrl !== undefined &&
    typeof content.imageUrl !== "string"
  ) {
    return false;
  }

  if (
    content.prompt !== undefined &&
    typeof content.prompt !== "string"
  ) {
    return false;
  }

  if (
    content.pages !== undefined &&
    (
      !Array.isArray(content.pages) ||
      !content.pages.every(isColoringPage)
    )
  ) {
    return false;
  }

  const pages = Array.isArray(content.pages)
    ? content.pages
    : [];

  return (
    pages.length > 0 ||
    (
      typeof content.imageUrl === "string" &&
      content.imageUrl.trim().length > 0
    )
  );
}

/* -------------------------------------------------------------------------- */
/* Generic image validation                                                   */
/* -------------------------------------------------------------------------- */

function isImageContent(value: unknown): value is ImageContent {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const content = value as Record<string, unknown>;

  if (
    typeof content.imageUrl !== "string" ||
    content.imageUrl.trim().length === 0
  ) {
    return false;
  }

  if (
    content.title !== undefined &&
    typeof content.title !== "string"
  ) {
    return false;
  }

  if (
    content.description !== undefined &&
    content.description !== null &&
    typeof content.description !== "string"
  ) {
    return false;
  }

  if (
    content.assetId !== undefined &&
    content.assetId !== null &&
    typeof content.assetId !== "string"
  ) {
    return false;
  }

  if (
    content.mimeType !== undefined &&
    content.mimeType !== null &&
    typeof content.mimeType !== "string"
  ) {
    return false;
  }

  if (
    content.prompt !== undefined &&
    typeof content.prompt !== "string"
  ) {
    return false;
  }

  if (
    content.model !== undefined &&
    content.model !== null &&
    typeof content.model !== "string"
  ) {
    return false;
  }

  if (
    content.size !== undefined &&
    content.size !== null &&
    typeof content.size !== "string"
  ) {
    return false;
  }

  if (
    content.quality !== undefined &&
    content.quality !== null &&
    typeof content.quality !== "string"
  ) {
    return false;
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/* Document validation                                                        */
/* -------------------------------------------------------------------------- */

function isDocumentContent(
  value: unknown,
): value is DocumentContent {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const content = value as Record<string, unknown>;

  return (
    typeof content.content === "string" &&
    content.content.trim().length > 0 &&
    (
      content.title === undefined ||
      typeof content.title === "string"
    )
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default async function ResourceLearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const resource = await prisma.resource.findFirst({
    where: {
      slug,
      status: ResourceStatus.PUBLISHED,
      visibility: {
        in: [
          ResourceVisibility.PUBLIC,
          ResourceVisibility.MARKETPLACE,
        ],
      },
      accessType: ResourceAccessType.FREE,
      type: {
        in: [
          ResourceType.WORKSHEET,
          ResourceType.QUIZ,
          ResourceType.IMAGE,
          ResourceType.DOCUMENT,
        ],
      },
    },

    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      content: true,
      type: true,
    },
  });

  if (!resource) {
    notFound();
  }

  /* ------------------------------------------------------------------------ */
  /* DOCUMENT                                                                 */
  /* ------------------------------------------------------------------------ */

  if (resource.type === ResourceType.DOCUMENT) {
    if (!isDocumentContent(resource.content)) {
      notFound();
    }

    return (
      <DocumentLearner
        slug={resource.slug}
        title={
          resource.content.title?.trim() ||
          resource.title
        }
        description={resource.description}
        content={resource.content.content}
      />
    );
  }

  /* ------------------------------------------------------------------------ */
  /* IMAGE                                                                     */
  /* ------------------------------------------------------------------------ */

  if (resource.type === ResourceType.IMAGE) {
    /*
     * Coloring pages are also stored as ResourceType.IMAGE.
     *
     * Check for the specialized coloring-page format first.
     */
    if (isColoringPageContent(resource.content)) {
      const pages =
        Array.isArray(resource.content.pages) &&
        resource.content.pages.length > 0
          ? resource.content.pages
          : [
              {
                index: 1,
                url: resource.content.imageUrl!,
                mimeType: "image/png",
              },
            ];

      return (
        <ColoringPageLearner
          resourceId={resource.id}
          slug={resource.slug}
          title={resource.title}
          description={resource.description}
          pages={pages
            .slice()
            .sort((a, b) => a.index - b.index)
            .map((page) => ({
              index: page.index,
              url: page.url,
              mimeType: page.mimeType ?? "image/png",
            }))}
        />
      );
    }

    

    /*
     * Otherwise this is a normal AI-generated image/poster.
     */
    if (isImageContent(resource.content)) {
      const image = resource.content;

      return (
        <ImageLearner
          resourceId={resource.id}
          slug={resource.slug}
          title={
            image.title?.trim() ||
            resource.title
          }
          description={
            image.description?.trim() ||
            resource.description
          }
          imageUrl={image.imageUrl}
          mimeType={image.mimeType}
        />
      );
    }



    /*
     * If it is an IMAGE resource but doesn't contain either
     * supported structure, don't render a broken learner.
     */
    notFound();
  }

  if (resource.type === ResourceType.PRESENTATION) {
  const content = resource.content;

  if (
    !content ||
    typeof content !== "object" ||
    Array.isArray(content)
  ) {
    notFound();
  }

  const data = content as {
    title?: unknown;
    description?: unknown;
    slides?: unknown;
  };

  if (!Array.isArray(data.slides)) {
    notFound();
  }

  const slides = data.slides
    .filter(
      (slide): slide is Record<string, unknown> =>
        !!slide &&
        typeof slide === "object" &&
        !Array.isArray(slide),
    )
    .map((slide, index) => ({
      id:
        typeof slide.id === "string"
          ? slide.id
          : `slide-${index + 1}`,
      title:
        typeof slide.title === "string"
          ? slide.title
          : `Slide ${index + 1}`,
      subtitle:
        typeof slide.subtitle === "string"
          ? slide.subtitle
          : null,
      content:
        typeof slide.content === "string"
          ? slide.content
          : null,
      bullets: Array.isArray(slide.bullets)
        ? slide.bullets.filter(
            (item): item is string =>
              typeof item === "string",
          )
        : [],
      notes:
        typeof slide.notes === "string"
          ? slide.notes
          : null,
    }));

  return (
    <PresentationLearner
      resourceId={resource.id}
      slug={resource.slug}
      title={
        typeof data.title === "string"
          ? data.title
          : resource.title
      }
      description={
        typeof data.description === "string"
          ? data.description
          : resource.description ?? ""
      }
      slides={slides}
    />
  );
}

  /* ------------------------------------------------------------------------ */
  /* QUIZ                                                                      */
  /* ------------------------------------------------------------------------ */

  if (resource.type === ResourceType.QUIZ) {
    if (
      !isQuizContent(resource.content) ||
      resource.content.questions.length === 0
    ) {
      notFound();
    }

    const quiz = resource.content;

    return (
      <QuizLearner
        resourceId={resource.id}
        slug={resource.slug}
        quiz={{
          title:
            quiz.title?.trim() ||
            resource.title,

          description:
            quiz.description?.trim() ||
            resource.description ||
            undefined,

          instructions:
            quiz.instructions?.trim() ||
            undefined,

          questions: quiz.questions.map((question) => ({
            id: question.id,
            type: question.type,
            question: question.question,
            options: question.options ?? undefined,
            points: question.points,
          })),
        }}
      />
    );
  }

  /* ------------------------------------------------------------------------ */
  /* WORKSHEET                                                                 */
  /* ------------------------------------------------------------------------ */

  if (resource.type === ResourceType.WORKSHEET) {
    const worksheet =
      WorksheetDocumentSchema.safeParse(
        resource.content,
      );

    if (!worksheet.success) {
      notFound();
    }

    return (
      <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6">
        <ResourceLearner
          resourceId={resource.id}
          initialResource={{
            id: resource.id,
            type: resource.type,
            title: worksheet.data.title,
            gradeLevel: worksheet.data.gradeLevel,
            subject: worksheet.data.subject,
            topic: worksheet.data.topic,
            learningObjective:
              worksheet.data.learningObjective ?? null,

            questions:
              worksheet.data.questions.map((q) => ({
                id: q.id,
                number: q.number,
                type: q.type,
                question: q.question,
                options: q.options,
                points: q.points,
              })),
          }}
        />
      </main>
    );
  }

  notFound();
}