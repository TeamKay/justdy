import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  AIGenerationStatus,
  AIGenerationType,
  ResourceAccessType,
  ResourceStatus,
  ResourceType,
  ResourceVisibility,
} from "@/lib/generated/prisma/enums";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

interface RouteContext {
  params: Promise<{ generationId: string }>;
}

interface PresentationSlide {
  id: string;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  bullets?: string[];
  notes?: string | null;
}

interface PresentationContent {
  title: string;
  description: string | null;
  slides: PresentationSlide[];
  theme?: string | null;
  prompt?: string | null;
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled-presentation"
  );
}

async function uniqueSlug(base: string) {
  let slug = base;
  let suffix = 2;

  while (
    await prisma.resource.findUnique({
      where: { slug },
      select: { id: true },
    })
  ) {
    slug = `${base}-${suffix++}`;
  }

  return slug;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSlide(value: unknown, index: number): PresentationSlide | null {
  if (!isRecord(value)) return null;

  const title =
    cleanText(value.title) ||
    cleanText(value.heading) ||
    `Slide ${index + 1}`;

  const content =
    cleanText(value.content) ||
    cleanText(value.body) ||
    cleanText(value.text) ||
    null;

  const bullets = readStringArray(
    value.bullets ?? value.points ?? value.keyPoints,
  );

  const subtitle =
    cleanText(value.subtitle) ||
    cleanText(value.subheading) ||
    null;

  const notes =
    cleanText(value.notes) ||
    cleanText(value.speakerNotes) ||
    null;

  return {
    id:
      cleanText(value.id) ||
      `slide-${index + 1}`,
    title,
    subtitle,
    content,
    bullets,
    notes,
  };
}

function readPresentation(outputData: unknown, prompt: string): PresentationContent | null {
  if (!isRecord(outputData)) return null;

  const candidate =
    isRecord(outputData.presentation)
      ? outputData.presentation
      : isRecord(outputData.data)
        ? outputData.data
        : outputData;

  const rawSlides =
    candidate.slides ??
    candidate.pages ??
    candidate.sections;

  if (!Array.isArray(rawSlides)) return null;

  const slides = rawSlides
    .map((slide, index) => normalizeSlide(slide, index))
    .filter((slide): slide is PresentationSlide => slide !== null);

  if (slides.length === 0) return null;

  const title =
    cleanText(candidate.title) ||
    cleanText(candidate.name) ||
    cleanText(prompt).slice(0, 120) ||
    "AI-generated presentation";

  return {
    title,
    description:
      cleanText(candidate.description) ||
      cleanText(candidate.summary) ||
      null,
    slides,
    theme:
      cleanText(candidate.theme) ||
      cleanText(candidate.style) ||
      null,
    prompt,
  };
}

async function getGeneration(userId: string, generationId: string) {
  return prisma.aIGeneration.findFirst({
    where: {
      id: generationId,
      userId,
      type: AIGenerationType.PRESENTATION,
      status: AIGenerationStatus.COMPLETED,
    },
  });
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const user = await getAuthenticatedUser();
  if (!user) return errorResponse("Authentication required.", 401);

  const generationId = (await params).generationId.trim();
  if (!generationId) {
    return errorResponse("Generation ID is required.", 400);
  }

  const generation = await getGeneration(user.id, generationId);

  if (!generation) {
    return errorResponse("Presentation generation not found.", 404);
  }

  const existing = await prisma.resource.findFirst({
    where: {
      userId: user.id,
      type: ResourceType.PRESENTATION,
      versions: { some: { generationId } },
    },
    include: {
      versions: {
        where: { generationId },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (existing) {
    return NextResponse.json({
      generationId,
      resource: {
        id: existing.id,
        slug: existing.slug,
        title: existing.title,
        description: existing.description,
        type: existing.type,
        status: existing.status,
        visibility: existing.visibility,
        accessType: existing.accessType,
        content: existing.versions[0]?.content ?? existing.content,
        versionId: existing.versions[0]?.id ?? null,
        versionNumber: existing.versions[0]?.versionNumber ?? null,
        updatedAt: existing.updatedAt,
        createdAt: existing.createdAt,
      },
    });
  }

  const presentation = readPresentation(
    generation.outputData,
    generation.prompt,
  );

  if (!presentation) {
    return errorResponse(
      "The generated presentation could not be read. Make sure the presentation contains at least one slide.",
      422,
    );
  }

  return NextResponse.json({
    generationId,
    generation: {
      id: generation.id,
      projectId: generation.projectId,
      prompt: generation.prompt,
      ...presentation,
    },
  });
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  const user = await getAuthenticatedUser();
  if (!user) return errorResponse("Authentication required.", 401);

  const generationId = (await params).generationId.trim();
  if (!generationId) {
    return errorResponse("Generation ID is required.", 400);
  }

  let body: {
    title?: unknown;
    description?: unknown;
    content?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse("Invalid JSON request.", 400);
  }

  const generation = await getGeneration(user.id, generationId);

  if (!generation) {
    return errorResponse("Presentation generation not found.", 404);
  }

  /*
   * Prefer the presentation currently in the editor.
   *
   * The Studio sends the user's edited presentation in body.content.
   * We must not require the original AI output to be re-readable in
   * order to save those edits. The generation is still verified above
   * for ownership/type/status and is used for project metadata.
   */
  const requestedContent =
    isRecord(body.content)
      ? readPresentation(body.content, generation.prompt)
      : null;

  let presentation = requestedContent;

  /*
   * Backward compatibility: if an older caller does not send content,
   * fall back to the stored AI generation output.
   */
  if (!presentation) {
    presentation = readPresentation(
      generation.outputData,
      generation.prompt,
    );
  }

  if (!presentation) {
    return errorResponse(
      "The presentation data could not be read. Please regenerate the presentation and try again.",
      422,
    );
  }

  const title =
    cleanText(body.title) ||
    presentation.title ||
    "AI-generated presentation";

  const description =
    cleanText(body.description) ||
    presentation.description ||
    null;

  const content = {
    title,
    description,
    slides: presentation.slides,
    theme: presentation.theme ?? null,
    prompt: presentation.prompt ?? generation.prompt,
  };

  const jsonContent =
    content as unknown as Prisma.InputJsonValue;

  const existing = await prisma.resource.findFirst({
    where: {
      userId: user.id,
      type: ResourceType.PRESENTATION,
      versions: { some: { generationId } },
    },
    include: {
      versions: {
        where: { generationId },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (existing) {
    const latest = existing.versions[0];
    const nextVersion = (latest?.versionNumber ?? 0) + 1;

    const saved = await prisma.$transaction(async (tx) => {
      const resource = await tx.resource.update({
        where: { id: existing.id },
        data: {
          title,
          description,
          content: jsonContent,
          status: ResourceStatus.DRAFT,
          visibility: ResourceVisibility.PRIVATE,
        },
      });

      await tx.resourceVersion.create({
        data: {
          resourceId: resource.id,
          versionNumber: nextVersion,
          content: jsonContent,
          generationId,
          metadata: {
            source: "AI_GENERATION",
            slideCount: presentation.slides.length,
          },
        },
      });

      return resource;
    });

    return NextResponse.json({
      success: true,
      resource: saved,
      generationId,
    });
  }

  const slug = await uniqueSlug(slugify(title));

  const resource = await prisma.$transaction(async (tx) => {
    const created = await tx.resource.create({
      data: {
        userId: user.id,
        projectId: generation.projectId,
        title,
        description,
        slug,
        type: ResourceType.PRESENTATION,
        status: ResourceStatus.DRAFT,
        visibility: ResourceVisibility.PRIVATE,
        accessType: ResourceAccessType.FREE,
        content: jsonContent,
        metadata: {
          source: "AI_GENERATION",
          generationId,
          prompt: generation.prompt,
          slideCount: presentation.slides.length,
        },
      },
    });

    await tx.resourceVersion.create({
      data: {
        resourceId: created.id,
        versionNumber: 1,
        content: jsonContent,
        generationId,
        metadata: {
          source: "AI_GENERATION",
          slideCount: presentation.slides.length,
        },
      },
    });

    return created;
  });

  return NextResponse.json(
    { success: true, resource, generationId },
    { status: 201 },
  );
}
