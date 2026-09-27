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

interface ImageContent {
  title: string;
  description: string | null;
  imageUrl: string;
  assetId: string | null;
  mimeType: string;
  prompt: string;
  model: string | null;
  size: string | null;
  quality: string | null;
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

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
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
      .slice(0, 80) || "untitled-image"
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

function readGenerationImage(outputData: unknown, assetUrl?: string | null) {
  const data =
    outputData &&
    typeof outputData === "object" &&
    !Array.isArray(outputData)
      ? (outputData as Record<string, unknown>)
      : null;

  const url =
    (typeof data?.url === "string" ? data.url : null) ??
    (isHttpUrl(assetUrl) ? assetUrl : null);

  if (!url) return null;

  return {
    imageUrl: url,
    assetId: cleanText(data?.assetId) || null,
    mimeType: cleanText(data?.mimeType) || "image/png",
    model: cleanText(data?.model) || null,
    size: cleanText(data?.size) || null,
    quality: cleanText(data?.quality) || null,
  };
}

async function getGeneration(userId: string, generationId: string) {
  return prisma.aIGeneration.findFirst({
    where: {
      id: generationId,
      userId,
      type: AIGenerationType.IMAGE,
      status: AIGenerationStatus.COMPLETED,
    },
    include: {
      assets: {
        where: { type: "IMAGE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
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
  if (!generationId) return errorResponse("Generation ID is required.", 400);

  const generation = await getGeneration(user.id, generationId);

  if (!generation) {
    return errorResponse("Image generation not found.", 404);
  }

  const existing = await prisma.resource.findFirst({
    where: {
      userId: user.id,
      type: ResourceType.IMAGE,
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

  const asset = generation.assets[0];
  const image = readGenerationImage(
    generation.outputData,
    asset?.url,
  );

  if (!image) {
    return errorResponse(
      "The generated image is unavailable.",
      422,
    );
  }

  const title =
    cleanText(generation.prompt).slice(0, 120) ||
    "AI-generated image";

  return NextResponse.json({
    generationId,
    generation: {
      id: generation.id,
      projectId: generation.projectId,
      prompt: generation.prompt,
      title,
      ...image,
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
  if (!generationId) return errorResponse("Generation ID is required.", 400);

  let body: {
    title?: unknown;
    description?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse("Invalid JSON request.", 400);
  }

  const generation = await getGeneration(user.id, generationId);

  if (!generation) {
    return errorResponse("Image generation not found.", 404);
  }

  const asset = generation.assets[0];
  const image = readGenerationImage(
    generation.outputData,
    asset?.url,
  );

  if (!image) {
    return errorResponse(
      "The generated image is unavailable.",
      422,
    );
  }

  const title =
    cleanText(body.title) ||
    cleanText(generation.prompt).slice(0, 120) ||
    "AI-generated image";

  const description =
    cleanText(body.description) || null;

  const content: ImageContent = {
    title,
    description,
    imageUrl: image.imageUrl,
    assetId: image.assetId,
    mimeType: image.mimeType,
    prompt: generation.prompt,
    model: image.model,
    size: image.size,
    quality: image.quality,
  };

  // Prisma JSON fields require Prisma.InputJsonValue rather than a
  // structurally typed application interface.
  const jsonContent = content as unknown as Prisma.InputJsonValue;

  const existing = await prisma.resource.findFirst({
    where: {
      userId: user.id,
      type: ResourceType.IMAGE,
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
            assetId: image.assetId,
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
        type: ResourceType.IMAGE,
        status: ResourceStatus.DRAFT,
        visibility: ResourceVisibility.PRIVATE,
        accessType: ResourceAccessType.FREE,
        content: jsonContent,
        thumbnailUrl: image.imageUrl,
        thumbnailAssetId: image.assetId,
        metadata: {
          source: "AI_GENERATION",
          generationId,
          assetId: image.assetId,
          prompt: generation.prompt,
          model: image.model,
          size: image.size,
          quality: image.quality,
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
          assetId: image.assetId,
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
