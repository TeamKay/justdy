import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ResourceAccessType,
  ResourceStatus,
  ResourceType,
  ResourceVisibility,
} from "@/lib/generated/prisma/enums";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

interface RouteContext {
  params: Promise<{ generationId: string }>;
}

interface VideoResourceContent {
  kind: "VIDEO";
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  videoGenerationId: string;
  prompt: string;
  provider: string;
  model: string | null;
  duration: number;
  aspectRatio: string;
  creditsUsed: number;
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
      .slice(0, 80) || "untitled-video"
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

async function getCompletedVideo(userId: string, generationId: string) {
  return prisma.videoGeneration.findFirst({
    where: {
      id: generationId,
      userId,
      status: "COMPLETED",
    },
    select: {
      id: true,
      title: true,
      prompt: true,
      provider: true,
      model: true,
      duration: true,
      aspectRatio: true,
      creditsUsed: true,
      thumbnailUrl: true,
      completedAt: true,
      createdAt: true,
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
    projectId?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse("Invalid JSON request.", 400);
  }

  const video = await getCompletedVideo(user.id, generationId);

  if (!video) {
    return errorResponse(
      "Completed video generation not found or is not owned by the current user.",
      404,
    );
  }

  const projectId = cleanText(body.projectId) || null;

  if (projectId) {
    const project = await prisma.aIProject.findFirst({
      where: {
        id: projectId,
        userId: user.id,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (!project) return errorResponse("Project not found.", 404);
  }

  const title =
    cleanText(body.title) ||
    cleanText(video.title) ||
    cleanText(video.prompt).slice(0, 120) ||
    "AI-generated video";

  const description = cleanText(body.description) || null;
  const videoUrl = `/api/ai/video/${encodeURIComponent(video.id)}/content`;

  const content: VideoResourceContent = {
    kind: "VIDEO",
    title,
    description,
    videoUrl,
    thumbnailUrl: video.thumbnailUrl,
    videoGenerationId: video.id,
    prompt: video.prompt,
    provider: video.provider,
    model: video.model,
    duration: video.duration,
    aspectRatio: video.aspectRatio,
    creditsUsed: video.creditsUsed,
  };

  const jsonContent = content as unknown as Prisma.InputJsonValue;

  const existing = await prisma.resource.findFirst({
    where: {
      userId: user.id,
      type: ResourceType.VIDEO,
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
          projectId,
          content: jsonContent,
          thumbnailUrl: video.thumbnailUrl,
          status: ResourceStatus.DRAFT,
          visibility: ResourceVisibility.PRIVATE,
          accessType: ResourceAccessType.FREE,
          metadata: {
            source: "AI_VIDEO_GENERATION",
            videoGenerationId: video.id,
            videoUrl,
            prompt: video.prompt,
            provider: video.provider,
            model: video.model,
            duration: video.duration,
            aspectRatio: video.aspectRatio,
            creditsUsed: video.creditsUsed,
          },
        },
      });

      await tx.resourceVersion.create({
        data: {
          resourceId: resource.id,
          versionNumber: nextVersion,
          content: jsonContent,
          generationId,
          metadata: {
            source: "AI_VIDEO_GENERATION",
            videoGenerationId: video.id,
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
        projectId,
        title,
        description,
        slug,
        type: ResourceType.VIDEO,
        status: ResourceStatus.DRAFT,
        visibility: ResourceVisibility.PRIVATE,
        accessType: ResourceAccessType.FREE,
        content: jsonContent,
        thumbnailUrl: video.thumbnailUrl,
        metadata: {
          source: "AI_VIDEO_GENERATION",
          videoGenerationId: video.id,
          videoUrl,
          prompt: video.prompt,
          provider: video.provider,
          model: video.model,
          duration: video.duration,
          aspectRatio: video.aspectRatio,
          creditsUsed: video.creditsUsed,
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
          source: "AI_VIDEO_GENERATION",
          videoGenerationId: video.id,
        },
      },
    });

    return created;
  });

  return NextResponse.json(
    {
      success: true,
      resource,
      generationId,
    },
    { status: 201 },
  );
}
