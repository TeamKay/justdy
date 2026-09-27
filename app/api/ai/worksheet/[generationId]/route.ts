import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  AIGenerationStatus,
  AIGenerationType,
} from "@/lib/generated/prisma/enums";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { WorksheetDocumentSchema } from "@/lib/ai/worksheet/schema";
import {
  getOrCreateWorksheetResource,
  getLatestWorksheetVersion,
  saveWorksheetVersion,
} from "@/lib/resources/worksheet";

interface RouteContext {
  params: Promise<{
    generationId: string;
  }>;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function readWorksheet(outputData: unknown) {
  if (
    !outputData ||
    typeof outputData !== "object" ||
    Array.isArray(outputData)
  ) {
    return null;
  }

  const data = outputData as {
    worksheet?: unknown;
  };

  if (!data.worksheet) {
    return null;
  }

  const parsed = WorksheetDocumentSchema.safeParse(data.worksheet);

  return parsed.success ? parsed.data : null;
}

/* ============================================================
   GET WORKSHEET
============================================================ */

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  const { generationId } = await params;
  const normalizedId = generationId.trim();

  if (!normalizedId) {
    return errorResponse("Generation ID is required.", 400);
  }

  const generation = await prisma.aIGeneration.findFirst({
    where: {
      id: normalizedId,
      userId: user.id,
      type: AIGenerationType.WORKSHEET,
    },
    select: {
      id: true,
      status: true,
      outputData: true,
      createdAt: true,
    },
  });

  if (!generation) {
    return errorResponse("Worksheet generation not found.", 404);
  }

  if (generation.status !== AIGenerationStatus.COMPLETED) {
    return errorResponse("This worksheet has not finished generating.", 409);
  }

  /*
   * The original AIGeneration output remains the migration source.
   * Once a Resource exists, the latest ResourceVersion becomes canonical.
   */
  const legacyWorksheet = readWorksheet(generation.outputData);

  if (!legacyWorksheet) {
    return errorResponse(
      "The generated worksheet document is unavailable.",
      500,
    );
  }

  const resource = await getOrCreateWorksheetResource({
    userId: user.id,
    generationId: generation.id,
    worksheet: legacyWorksheet,
  });

  const latestVersion = await getLatestWorksheetVersion({
    resourceId: resource.id,
    userId: user.id,
  });

  if (!latestVersion?.content) {
    return errorResponse("The worksheet resource has no usable version.", 500);
  }

  const parsedWorksheet = WorksheetDocumentSchema.safeParse(
    latestVersion.content,
  );

  if (!parsedWorksheet.success) {
    return errorResponse(
      "The worksheet resource contains invalid content.",
      500,
    );
  }

  return NextResponse.json(
    {
      generationId: generation.id,
      resourceId: resource.id,
      versionId: latestVersion.id,
      versionNumber: latestVersion.versionNumber,
      worksheet: parsedWorksheet.data,
      updatedAt: resource.updatedAt.toISOString(),
      createdAt: resource.createdAt.toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

/* ============================================================
   SAVE WORKSHEET
============================================================ */

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  const { generationId } = await params;
  const normalizedId = generationId.trim();

  if (!normalizedId) {
    return errorResponse("Generation ID is required.", 400);
  }

  let body: {
    worksheet?: unknown;
    updatedAt?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse("Invalid JSON request.", 400);
  }

  const parsedWorksheet = WorksheetDocumentSchema.safeParse(body.worksheet);

  if (!parsedWorksheet.success) {
    return errorResponse("The worksheet document is invalid.", 400);
  }

  const expectedUpdatedAt =
    typeof body.updatedAt === "string" ? new Date(body.updatedAt) : null;

  if (!expectedUpdatedAt || !Number.isFinite(expectedUpdatedAt.getTime())) {
    return errorResponse("A valid worksheet version is required.", 400);
  }

  const generation = await prisma.aIGeneration.findFirst({
    where: {
      id: normalizedId,
      userId: user.id,
      type: AIGenerationType.WORKSHEET,
    },
    select: {
      id: true,
      status: true,
      outputData: true,
    },
  });

  if (!generation) {
    return errorResponse("Worksheet generation not found.", 404);
  }

  if (generation.status !== AIGenerationStatus.COMPLETED) {
    return errorResponse("Only completed worksheets can be edited.", 409);
  }

  /*
   * Existing worksheets may predate the universal Resource system.
   * Ensure the Resource + initial version exists before saving.
   */
  const existingWorksheet = readWorksheet(generation.outputData);

  if (!existingWorksheet) {
    return errorResponse(
      "The generated worksheet document is unavailable.",
      500,
    );
  }

  const resource = await getOrCreateWorksheetResource({
    userId: user.id,
    generationId: generation.id,
    worksheet: existingWorksheet,
  });

  const result = await saveWorksheetVersion({
    resourceId: resource.id,
    userId: user.id,
    worksheet: parsedWorksheet.data,
    expectedUpdatedAt,
  });

  if (result.notFound) {
    return errorResponse("Worksheet resource not found.", 404);
  }

  if (result.conflict) {
    return NextResponse.json(
      {
        error:
          "This worksheet was changed elsewhere. Reload it before saving again.",
        code: "WORKSHEET_VERSION_CONFLICT",
      },
      {
        status: 409,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  if (!result.resource) {
    return errorResponse("Worksheet was saved but could not be reloaded.", 500);
  }

  return NextResponse.json(
    {
      generationId: generation.id,
      resourceId: result.resource.id,
      versionId: result.version?.id ?? null,
      versionNumber: result.version?.versionNumber ?? null,
      worksheet: parsedWorksheet.data,
      updatedAt: result.resource.updatedAt.toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
