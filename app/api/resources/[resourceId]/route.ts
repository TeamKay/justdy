import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const utapi = new UTApi();

type RouteContext = {
  params: Promise<{
    resourceId: string;
  }>;
};

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const stringValue = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

/**
 * Extract UploadThing file keys associated with a resource.
 *
 * Current justdy resources store the AI asset id in fields such as:
 * - Resource.thumbnailAssetId
 * - Resource.metadata.assetId
 * - Resource.content.assetId
 * - ResourceVersion.metadata.assetId
 *
 * The AIAsset table then contains the actual UploadThing fileKey.
 */
function collectAssetIds(resource: {
  thumbnailAssetId: string | null;
  metadata: unknown;
  content: unknown;
  versions: Array<{ metadata: unknown }>;
}) {
  const ids = new Set<string>();

  /*
   * Resource content can contain nested structures such as:
   *
   * pages: [
   *   { assetId: "...", url: "..." },
   *   { assetId: "...", url: "..." }
   * ]
   *
   * Walk the complete JSON tree so every associated AIAsset is found.
   */
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }

    const object = record(value);
    if (!object) return;

    const candidates = [
      object.assetId,
      object.assetID,
      object.aiAssetId,
      object.aiAssetID,
      object.thumbnailAssetId,
    ];

    for (const candidate of candidates) {
      const id = stringValue(candidate);
      if (id) ids.add(id);
    }

    for (const child of Object.values(object)) {
      if (child && typeof child === "object") {
        visit(child);
      }
    }
  };

  if (resource.thumbnailAssetId) {
    ids.add(resource.thumbnailAssetId);
  }

  visit(resource.metadata);
  visit(resource.content);

  for (const version of resource.versions) {
    visit(version.metadata);
  }

  return ids;
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { resourceId } = await params;
  const normalizedId = resourceId.trim();

  if (!normalizedId) {
    return NextResponse.json(
      { error: "Resource ID is required." },
      { status: 400 },
    );
  }

  try {
    /*
     * Read the resource first and verify ownership.
     * We collect the related AI assets before deleting the Resource
     * because ResourceVersion rows cascade from Resource deletion.
     */
    const resource = await prisma.resource.findFirst({
      where: {
        id: normalizedId,
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        thumbnailAssetId: true,
        metadata: true,
        content: true,
        versions: {
          select: {
            metadata: true,
          },
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 },
      );
    }

    const assetIds = collectAssetIds(resource);

    /*
     * Find the actual AIAsset rows. The userId condition prevents
     * deleting another user's asset even if an ID was somehow copied.
     */
    const assets = assetIds.size
      ? await prisma.aIAsset.findMany({
          where: {
            id: { in: [...assetIds] },
            userId: user.id,
          },
          select: {
            id: true,
            fileKey: true,
          },
        })
      : [];

    const fileKeys = [
      ...new Set(
        assets
          .map((asset) => asset.fileKey)
          .filter((key): key is string => Boolean(key)),
      ),
    ];

    /*
     * Delete the database resource first. ResourceVersion and
     * LearningActivity rows are configured with onDelete: Cascade.
     *
     * AIAsset rows are removed explicitly below.
     */
    await prisma.$transaction(async (tx) => {
      await tx.resource.delete({
        where: {
          id: resource.id,
        },
      });

      if (assets.length) {
        await tx.aIAsset.deleteMany({
          where: {
            id: { in: assets.map((asset) => asset.id) },
            userId: user.id,
          },
        });
      }
    });

    /*
     * Remove the physical UploadThing files after the DB deletion.
     *
     * If UploadThing reports an error, the resource is still gone from
     * the database, but we return an error so the storage cleanup is
     * visible and can be retried.
     */
    if (fileKeys.length) {
      try {
        await utapi.deleteFiles(fileKeys);
      } catch (uploadThingError) {
        console.error(
          "Resource deleted from database, but UploadThing cleanup failed:",
          uploadThingError,
        );

        return NextResponse.json(
          {
            success: false,
            deletedFromDatabase: true,
            deletedFromUploadThing: false,
            error:
              "The resource was deleted from the database, but one or more uploaded files could not be removed from storage.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      deletedFromDatabase: true,
      deletedFromUploadThing: true,
      deletedFileCount: fileKeys.length,
    });
  } catch (error) {
    console.error("DELETE /api/resources/[resourceId]:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete this resource.",
      },
      { status: 500 },
    );
  }
}



// import { NextResponse } from "next/server";
// import { Prisma } from "@/lib/generated/prisma/client";
// import {
//   ResourceAccessType,
//   ResourceStatus,
//   ResourceType,
//   ResourceVisibility,
// } from "@/lib/generated/prisma/enums";

// import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
// import prisma from "@/lib/prisma";
// import { persistVideoArtifact } from "@/lib/ai/video-artifact";

// interface RouteContext {
//   params: Promise<{ generationId: string }>;
// }

// function cleanText(value: unknown): string {
//   return typeof value === "string" ? value.trim() : "";
// }

// function slugify(value: string): string {
//   return (
//     value
//       .toLowerCase()
//       .trim()
//       .replace(/[^a-z0-9\s-]/g, "")
//       .replace(/\s+/g, "-")
//       .replace(/-+/g, "-")
//       .replace(/^-+|-+$/g, "")
//       .slice(0, 80) || "untitled-video"
//   );
// }

// async function uniqueSlug(base: string) {
//   let slug = base;
//   let suffix = 2;

//   while (
//     await prisma.resource.findUnique({
//       where: { slug },
//       select: { id: true },
//     })
//   ) {
//     slug = `${base}-${suffix++}`;
//   }

//   return slug;
// }

// export async function POST(
//   request: Request,
//   { params }: RouteContext,
// ) {
//   try {
//     const user = await getAuthenticatedUser();

//     if (!user) {
//       return NextResponse.json(
//         { error: "Authentication required." },
//         { status: 401 },
//       );
//     }

//     const generationId = (await params).generationId.trim();

//     if (!generationId) {
//       return NextResponse.json(
//         { error: "Generation ID is required." },
//         { status: 400 },
//       );
//     }

//     const body = (await request.json().catch(() => ({}))) as {
//       projectId?: unknown;
//       title?: unknown;
//       description?: unknown;
//     };

//     const projectId =
//       typeof body.projectId === "string" && body.projectId.trim()
//         ? body.projectId.trim()
//         : null;

//     if (projectId) {
//       const project = await prisma.aIProject.findFirst({
//         where: {
//           id: projectId,
//           userId: user.id,
//           status: "ACTIVE",
//         },
//         select: { id: true },
//       });

//       if (!project) {
//         return NextResponse.json(
//           { error: "Project not found." },
//           { status: 404 },
//         );
//       }
//     }

//     const video = await prisma.videoGeneration.findFirst({
//       where: {
//         id: generationId,
//         userId: user.id,
//         status: "COMPLETED",
//       },
//       select: {
//         id: true,
//         prompt: true,
//         provider: true,
//         model: true,
//         duration: true,
//         aspectRatio: true,
//         creditsUsed: true,
//         thumbnailUrl: true,
//       },
//     });

//     if (!video) {
//       return NextResponse.json(
//         { error: "Completed video generation not found." },
//         { status: 404 },
//       );
//     }

//     const asset = await persistVideoArtifact({
//       userId: user.id,
//       videoGenerationId: generationId,
//      projectId,
//     });

//     if (!asset.generationId) {
//       return NextResponse.json(
//         { error: "Video artifact generation could not be resolved." },
//         { status: 500 },
//       );
//     }

//     const existing = await prisma.resource.findFirst({
//       where: {
//         userId: user.id,
//         type: ResourceType.VIDEO,
//         versions: {
//           some: {
//             generationId: asset.generationId,
//           },
//         },
//       },
//       include: {
//         versions: {
//           where: { generationId: asset.generationId },
//           orderBy: { versionNumber: "desc" },
//           take: 1,
//         },
//       },
//     });

//     const title =
//       cleanText(body.title) ||
//       cleanText(video.prompt).slice(0, 120) ||
//       "AI Video";

//     const description =
//       cleanText(body.description) ||
//       `AI-generated video based on: ${video.prompt.trim()}`;

//     const content = {
//       kind: "VIDEO",
//       title,
//       description,
//       videoUrl: `/api/ai/video/${video.id}/content`,
//       thumbnailUrl: video.thumbnailUrl,
//       videoGenerationId: video.id,
//       aiGenerationId: asset.generationId,
//       assetId: asset.id,
//       prompt: video.prompt,
//       provider: video.provider,
//       model: video.model,
//       duration: video.duration,
//       aspectRatio: video.aspectRatio,
//       creditsUsed: video.creditsUsed,
//     } satisfies Prisma.InputJsonValue;

//     if (existing) {
//       const latest = existing.versions[0];
//       const nextVersion = (latest?.versionNumber ?? 0) + 1;

//       const resource = await prisma.$transaction(async (tx) => {
//         const updated = await tx.resource.update({
//           where: { id: existing.id },
//           data: {
//             title,
//             description,
//             content,
//             thumbnailUrl: video.thumbnailUrl,
//             status: ResourceStatus.DRAFT,
//             visibility: ResourceVisibility.PRIVATE,
//           },
//         });

//         await tx.resourceVersion.create({
//           data: {
//             resourceId: updated.id,
//             versionNumber: nextVersion,
//             content,
//             generationId: asset.generationId,
//             metadata: {
//               source: "AI_VIDEO_GENERATION",
//               videoGenerationId: video.id,
//               assetId: asset.id,
//             },
//           },
//         });

//         return updated;
//       });

//       return NextResponse.json({
//         success: true,
//         resource,
//         generationId,
//       });
//     }

//     const slug = await uniqueSlug(slugify(title));

//     const resource = await prisma.$transaction(async (tx) => {
//       const created = await tx.resource.create({
//         data: {
//           userId: user.id,
//         projectId,
//           title,
//           description,
//           slug,
//           type: ResourceType.VIDEO,
//           status: ResourceStatus.DRAFT,
//           visibility: ResourceVisibility.PRIVATE,
//           accessType: ResourceAccessType.FREE,
//           content,
//           thumbnailUrl: video.thumbnailUrl,
//           metadata: {
//             source: "AI_VIDEO_GENERATION",
//             generationId,
//             aiGenerationId: asset.generationId,
//             assetId: asset.id,
//             prompt: video.prompt,
//             provider: video.provider,
//             model: video.model,
//             duration: video.duration,
//             aspectRatio: video.aspectRatio,
//           },
//         },
//       });

//       await tx.resourceVersion.create({
//         data: {
//           resourceId: created.id,
//           versionNumber: 1,
//           content,
//           generationId: asset.generationId,
//           metadata: {
//             source: "AI_VIDEO_GENERATION",
//             videoGenerationId: video.id,
//             assetId: asset.id,
//           },
//         },
//       });

//       return created;
//     });

//     return NextResponse.json({
//       success: true,
//       resource,
//       generationId,
//     });
//   } catch (error) {
//     console.error("POST /api/resources/video/[generationId] failed:", error);

//     return NextResponse.json(
//       {
//         error:
//           error instanceof Error
//             ? error.message
//             : "Unable to save video resource.",
//       },
//       { status: 500 },
//     );
//   }
// }
