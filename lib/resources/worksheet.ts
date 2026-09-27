import prisma from "@/lib/prisma";
import {
  ResourceAccessType,
  ResourceStatus,
  ResourceType,
  ResourceVisibility,
} from "@/lib/generated/prisma/enums";
import { WorksheetDocumentSchema } from "@/lib/ai/worksheet/schema";

type WorksheetDocument = ReturnType<typeof WorksheetDocumentSchema.parse>;

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "worksheet"
  );
}

function createSlug(title: string) {
  return `${slugify(title)}-${crypto.randomUUID().slice(0, 8)}`;
}

function buildMetadata(worksheet: WorksheetDocument) {
  return {
    source: "worksheet-engine",
    gradeLevel: worksheet.gradeLevel,
    subject: worksheet.subject,
    topic: worksheet.topic,
    learningObjective: worksheet.learningObjective ?? null,
  };
}

/**
 * Finds the universal Resource associated with an AI worksheet generation.
 *
 * Existing worksheets created before the Resource migration are automatically
 * migrated the first time they are opened.
 */
export async function getOrCreateWorksheetResource({
  userId,
  generationId,
  worksheet,
}: {
  userId: string;
  generationId: string;
  worksheet: WorksheetDocument;
}) {
  const existingVersion = await prisma.resourceVersion.findFirst({
    where: {
      generationId,
      resource: {
        userId,
        type: ResourceType.WORKSHEET,
      },
    },
    orderBy: {
      versionNumber: "desc",
    },
    select: {
      resourceId: true,
    },
  });

  if (existingVersion) {
    const resource = await prisma.resource.findFirst({
      where: {
        id: existingVersion.resourceId,
        userId,
        type: ResourceType.WORKSHEET,
      },
    });

    if (resource) {
      return resource;
    }
  }

  return prisma.$transaction(async (tx) => {
    const alreadyCreated = await tx.resourceVersion.findFirst({
      where: {
        generationId,
        resource: {
          userId,
          type: ResourceType.WORKSHEET,
        },
      },
      orderBy: {
        versionNumber: "desc",
      },
      select: {
        resource: true,
      },
    });

    if (alreadyCreated?.resource) {
      return alreadyCreated.resource;
    }

    const resource = await tx.resource.create({
      data: {
        userId,
        title: worksheet.title,
        slug: createSlug(worksheet.title),
        type: ResourceType.WORKSHEET,
        subject: worksheet.subject,
        topic: worksheet.topic,
        grade: worksheet.gradeLevel,
        learningObjectives: worksheet.learningObjective
          ? [worksheet.learningObjective]
          : [],
        status: ResourceStatus.DRAFT,
        visibility: ResourceVisibility.PRIVATE,
        accessType: ResourceAccessType.FREE,
        content: worksheet,
        answerKey: worksheet.answerKey ?? null,
        metadata: buildMetadata(worksheet),
      },
    });

    await tx.resourceVersion.create({
      data: {
        resourceId: resource.id,
        versionNumber: 1,
        content: worksheet,
        answerKey: worksheet.answerKey ?? null,
        metadata: buildMetadata(worksheet),
        generationId,
      },
    });

    return resource;
  });
}

/**
 * Returns the latest universal worksheet version.
 */
export async function getLatestWorksheetVersion({
  resourceId,
  userId,
}: {
  resourceId: string;
  userId: string;
}) {
  return prisma.resourceVersion.findFirst({
    where: {
      resourceId,
      resource: {
        id: resourceId,
        userId,
        type: ResourceType.WORKSHEET,
      },
    },
    orderBy: {
      versionNumber: "desc",
    },
  });
}

/**
 * Saves an edited worksheet as a new ResourceVersion.
 *
 * The Resource itself also receives the latest snapshot so ordinary reads
 * don't need to resolve the version every time.
 */
export async function saveWorksheetVersion({
  resourceId,
  userId,
  worksheet,
  expectedUpdatedAt,
}: {
  resourceId: string;
  userId: string;
  worksheet: WorksheetDocument;
  expectedUpdatedAt: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const resource = await tx.resource.findFirst({
      where: {
        id: resourceId,
        userId,
        type: ResourceType.WORKSHEET,
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    if (!resource) {
      return {
        conflict: false,
        notFound: true,
        resource: null,
        version: null,
      };
    }

    const updated = await tx.resource.updateMany({
      where: {
        id: resource.id,
        userId,
        type: ResourceType.WORKSHEET,
        updatedAt: expectedUpdatedAt,
      },
      data: {
        title: worksheet.title,
        subject: worksheet.subject,
        topic: worksheet.topic,
        grade: worksheet.gradeLevel,
        learningObjectives: worksheet.learningObjective
          ? [worksheet.learningObjective]
          : [],
        content: worksheet,
        answerKey: worksheet.answerKey ?? null,
        metadata: buildMetadata(worksheet),
      },
    });

    if (updated.count !== 1) {
      return {
        conflict: true,
        notFound: false,
        resource: null,
        version: null,
      };
    }

    const latest = await tx.resourceVersion.findFirst({
      where: {
        resourceId: resource.id,
      },
      orderBy: {
        versionNumber: "desc",
      },
      select: {
        versionNumber: true,
      },
    });

    const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;

    const version = await tx.resourceVersion.create({
      data: {
        resourceId: resource.id,
        versionNumber: nextVersionNumber,
        content: worksheet,
        answerKey: worksheet.answerKey ?? null,
        metadata: buildMetadata(worksheet),
      },
    });

    const savedResource = await tx.resource.findUnique({
      where: {
        id: resource.id,
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    return {
      conflict: false,
      notFound: false,
      resource: savedResource,
      version,
    };
  });
}
