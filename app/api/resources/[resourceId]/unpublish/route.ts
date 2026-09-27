import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import {
  ResourceStatus,
  ResourceVisibility,
} from "@/lib/generated/prisma/enums";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

interface RouteContext {
  params: Promise<{
    resourceId: string;
  }>;
}

function errorResponse(message: string, status = 400) {
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

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  const { resourceId } = await params;
  const normalizedId = resourceId.trim();

  if (!normalizedId) {
    return errorResponse("Resource ID is required.", 400);
  }

  const resource = await prisma.resource.findFirst({
    where: {
      id: normalizedId,
      userId: user.id,
    },
    select: {
      id: true,
      slug: true,
      status: true,
      updatedAt: true,
    },
  });

  if (!resource) {
    return errorResponse("Resource not found.", 404);
  }

  if (!user.canPublish) {
    return errorResponse(
      "Your account does not currently have permission to manage published resources.",
      403,
    );
  }

  if (resource.status !== ResourceStatus.PUBLISHED) {
    return errorResponse("This resource is not currently published.", 409);
  }

  const updated = await prisma.resource.updateMany({
    where: {
      id: resource.id,
      userId: user.id,
      status: ResourceStatus.PUBLISHED,
      updatedAt: resource.updatedAt,
    },
    data: {
      status: ResourceStatus.UNPUBLISHED,
      visibility: ResourceVisibility.PRIVATE,
    },
  });

  if (updated.count !== 1) {
    return errorResponse(
      "This resource changed while you were unpublishing it. Reload and try again.",
      409,
    );
  }

  const saved = await prisma.resource.findUnique({
    where: {
      id: resource.id,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      visibility: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  if (!saved) {
    return errorResponse(
      "The resource was unpublished but could not be reloaded.",
      500,
    );
  }

  return NextResponse.json(
    {
      success: true,
      resource: saved,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
