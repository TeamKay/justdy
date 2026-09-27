import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  AIGenerationStatus,
  AIGenerationType,
  ResourceAccessType,
  ResourceStatus,
  ResourceType,
  ResourceVisibility,
} from "@/lib/generated/prisma/enums";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildDocument(value: unknown, fallbackTitle: string) {
  const text =
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).text === "string"
      ? cleanText((value as Record<string, unknown>).text)
      : cleanText(value);

  if (!text) return null;

  const firstHeading = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  const title =
    firstHeading && firstHeading.length <= 140
      ? firstHeading.replace(/^#+\s*/, "").trim()
      : fallbackTitle;

  return {
    title: title || fallbackTitle,
    content: text,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ generationId: string }> },
) {
  const user = await getAuthenticatedUser();
  if (!user) return errorResponse("Authentication required.", 401);

  const generationId = (await params).generationId.trim();
  if (!generationId) return errorResponse("Generation ID is required.", 400);

  const generation = await prisma.aIGeneration.findFirst({
    where: {
      id: generationId,
      userId: user.id,
      type: AIGenerationType.TEXT,
    },
    select: {
      id: true,
      status: true,
      prompt: true,
      outputData: true,
      projectId: true,
      createdAt: true,
    },
  });

  if (!generation) return errorResponse("Document generation not found.", 404);
  if (generation.status !== AIGenerationStatus.COMPLETED) {
    return errorResponse("Document generation is not completed.", 409);
  }

  const existing = await prisma.resource.findFirst({
    where: {
      userId: user.id,
      type: ResourceType.DOCUMENT,
      versions: {
        some: { generationId: generation.id },
      },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      status: true,
      visibility: true,
      accessType: true,
      content: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  if (existing) {
    return NextResponse.json({
      generationId: generation.id,
      resource: existing,
    });
  }

  const rawOutput = generation.outputData;
  const outputText =
    typeof rawOutput === "object" &&
    rawOutput !== null &&
    !Array.isArray(rawOutput)
      ? (rawOutput as Record<string, unknown>).text
      : rawOutput;

  const document = buildDocument(
    outputText,
    generation.prompt.trim().slice(0, 140) || "Untitled document",
  );

  if (!document) {
    return errorResponse("The generated document is unavailable.", 500);
  }

  const slugBase =
    document.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `document-${generation.id.slice(0, 8)}`;

  let slug = slugBase;
  let suffix = 2;
  while (
    await prisma.resource.findUnique({
      where: { slug },
      select: { id: true },
    })
  ) {
    slug = `${slugBase}-${suffix++}`;
  }

  const resource = await prisma.$transaction(async (tx) => {
    const created = await tx.resource.create({
      data: {
        userId: user.id,
        projectId: generation.projectId,
        title: document.title,
        description: `AI-generated document from: ${generation.prompt.trim()}`,
        slug,
        type: ResourceType.DOCUMENT,
        status: ResourceStatus.DRAFT,
        visibility: ResourceVisibility.PRIVATE,
        accessType: ResourceAccessType.FREE,
        content: document,
        metadata: {
          source: "AI_GENERATION",
          generationId: generation.id,
          prompt: generation.prompt,
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        status: true,
        visibility: true,
        accessType: true,
        content: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    await tx.resourceVersion.create({
      data: {
        resourceId: created.id,
        versionNumber: 1,
        content: document,
        metadata: {
          source: "AI_GENERATION",
          generationId: generation.id,
        },
        generationId: generation.id,
      },
    });

    return created;
  });

  return NextResponse.json({
    generationId: generation.id,
    resource,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ generationId: string }> },
) {
  const user = await getAuthenticatedUser();
  if (!user) return errorResponse("Authentication required.", 401);

  const generationId = (await params).generationId.trim();
  if (!generationId) return errorResponse("Generation ID is required.", 400);

  let body: { title?: unknown; description?: unknown; content?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse("Invalid JSON request.", 400);
  }

  const title = cleanText(body.title);
  const content = cleanText(body.content);
  const description = cleanText(body.description);

  if (!title) return errorResponse("Document title is required.", 400);
  if (!content) return errorResponse("Document content is required.", 400);

  const generation = await prisma.aIGeneration.findFirst({
    where: {
      id: generationId,
      userId: user.id,
      type: AIGenerationType.TEXT,
      status: AIGenerationStatus.COMPLETED,
    },
    select: { id: true, projectId: true },
  });

  if (!generation) return errorResponse("Document generation not found.", 404);

  const existing = await prisma.resource.findFirst({
    where: {
      userId: user.id,
      type: ResourceType.DOCUMENT,
      versions: { some: { generationId } },
    },
    select: { id: true, slug: true, title: true },
  });

  if (existing) {
    const latest = await prisma.resourceVersion.findFirst({
      where: { resourceId: existing.id },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    const nextVersion = (latest?.versionNumber ?? 0) + 1;

    const saved = await prisma.$transaction(async (tx) => {
      const resource = await tx.resource.update({
        where: { id: existing.id },
        data: {
          title,
          description: description || null,
          content: { title, content },
          status: ResourceStatus.DRAFT,
          visibility: ResourceVisibility.PRIVATE,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          content: true,
          status: true,
          visibility: true,
          accessType: true,
          updatedAt: true,
        },
      });

      await tx.resourceVersion.create({
        data: {
          resourceId: resource.id,
          versionNumber: nextVersion,
          content: { title, content },
          generationId,
        },
      });

      return resource;
    });

    return NextResponse.json({ generationId, resource: saved });
  }

  return errorResponse(
    "The document resource has not been initialized. Load it before saving.",
    409,
  );
}
