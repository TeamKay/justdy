import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import prisma from "@/lib/prisma";

import type { Prisma } from "@/lib/generated/prisma/client";

export const runtime = "nodejs";

type PresentationSlide = {
  slideNumber: number;
  title: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  speakerNotes?: string;
};

type PresentationDocument = {
  title: string;
  subtitle?: string;
  audience?: string;
  subject?: string;
  topic?: string;
  learningObjectives?: string[];
  slides: PresentationSlide[];
};

type SavePresentationRequest = {
  generationId?: string;
  projectId?: string | null;
  presentation?: PresentationDocument;
};

function isValidPresentation(value: unknown): value is PresentationDocument {
  if (!value || typeof value !== "object") {
    return false;
  }

  const presentation = value as Record<string, unknown>;

  if (typeof presentation.title !== "string" || !presentation.title.trim()) {
    return false;
  }

  if (!Array.isArray(presentation.slides)) {
    return false;
  }

  if (presentation.slides.length === 0) {
    return false;
  }

  return presentation.slides.every((slide) => {
    if (!slide || typeof slide !== "object") {
      return false;
    }

    const item = slide as Record<string, unknown>;

    return typeof item.title === "string" && item.title.trim().length > 0;
  });
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * POST /api/ai/presentation
 *
 * Creates or updates the canonical AIAsset for an AI-generated
 * presentation.
 *
 * Presentations are stored as DOCUMENT assets because AIAssetType
 * intentionally represents storage/media categories rather than
 * every individual AI generation operation.
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    let body: SavePresentationRequest;

    try {
      body = (await request.json()) as SavePresentationRequest;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON request body.",
        },
        {
          status: 400,
        },
      );
    }

    const generationId = body.generationId?.trim();

    if (!generationId) {
      return NextResponse.json(
        {
          error: "Generation ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidPresentation(body.presentation)) {
      return NextResponse.json(
        {
          error: "A valid presentation is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * The generation must belong to the authenticated user.
     *
     * This prevents one user from attaching content to another
     * user's AI generation.
     */
    const generation = await prisma.aIGeneration.findFirst({
      where: {
        id: generationId,
        userId: user.id,
      },
      select: {
        id: true,
        userId: true,
        projectId: true,
        type: true,
        operation: true,
        status: true,
        prompt: true,
      },
    });

    if (!generation) {
      return NextResponse.json(
        {
          error: "AI generation not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (generation.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error: "Only completed AI generations can be saved.",
          status: generation.status,
        },
        {
          status: 409,
        },
      );
    }

    if (
      generation.type !== "PRESENTATION" &&
      generation.operation !== "PRESENTATION"
    ) {
      return NextResponse.json(
        {
          error: "The selected generation is not a presentation.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * If the caller supplies a project ID, it must belong to the
     * authenticated user.
     */
    let projectId = generation.projectId ?? null;

    if (body.projectId !== undefined) {
      const requestedProjectId = body.projectId?.trim() || null;

      if (requestedProjectId) {
        const project = await prisma.aIProject.findFirst({
          where: {
            id: requestedProjectId,
            userId: user.id,
            status: "ACTIVE",
          },
          select: {
            id: true,
          },
        });

        if (!project) {
          return NextResponse.json(
            {
              error: "Project not found.",
            },
            {
              status: 404,
            },
          );
        }

        projectId = project.id;
      } else {
        projectId = null;
      }
    }

    const presentation = body.presentation;

    const metadata = {
      artifactType: "PRESENTATION",
      operation: "PRESENTATION",
      editable: true,
      source: "AI_LAUNCHPAD",
      generationId,
      title: presentation.title,
      subject: presentation.subject ?? null,
      topic: presentation.topic ?? null,
      audience: presentation.audience ?? null,
      presentation: toInputJsonValue(presentation),
    } satisfies Prisma.InputJsonValue;

    const outputData = {
      type: "PRESENTATION",
      presentation: toInputJsonValue(presentation),
    } satisfies Prisma.InputJsonValue;

    const result = await prisma.$transaction(async (tx) => {
      /*
       * Keep the generation's output synchronized with the edited
       * presentation. This means the generation itself remains the
       * canonical source associated with the creation.
       */
      await tx.aIGeneration.update({
        where: {
          id: generation.id,
        },
        data: {
          outputData,
        },
      });

      const existingAsset = await tx.aIAsset.findFirst({
        where: {
          userId: user.id,
          generationId: generation.id,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
        },
      });

      if (existingAsset) {
        return tx.aIAsset.update({
          where: {
            id: existingAsset.id,
          },
          data: {
            projectId,
            type: "DOCUMENT",
            name: presentation.title.trim(),
            mimeType: "application/json",
            metadata,
          },
          select: {
            id: true,
            generationId: true,
            projectId: true,
            type: true,
            name: true,
            mimeType: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      }

      return tx.aIAsset.create({
        data: {
          userId: user.id,
          generationId: generation.id,
          projectId,
          type: "DOCUMENT",
          name: presentation.title.trim(),
          mimeType: "application/json",
          metadata,
        },
        select: {
          id: true,
          generationId: true,
          projectId: true,
          type: true,
          name: true,
          mimeType: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        asset: result,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("POST /api/ai/presentation failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save presentation.",
      },
      {
        status: 500,
      },
    );
  }
}
