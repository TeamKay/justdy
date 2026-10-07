import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

interface RouteContext { params: Promise<{ resourceId: string }> }

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) return errorResponse("Authentication required.", 401);

  const { resourceId } = await params;
  const id = resourceId.trim();
  if (!id) return errorResponse("Resource ID is required.", 400);

  const resource = await prisma.resource.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true, title: true, description: true, slug: true, type: true,
      subject: true, topic: true, grade: true, status: true, visibility: true,
      accessType: true, thumbnailUrl: true, content: true, metadata: true,
      answerKey: true, createdAt: true, updatedAt: true,
      versions: {
        orderBy: { versionNumber: "desc" }, take: 1,
        select: { id: true, versionNumber: true, content: true, answerKey: true, metadata: true, generationId: true },
      },
    },
  });

  if (!resource) return errorResponse("Resource not found.", 404);
  const version = resource.versions[0] ?? null;

  return NextResponse.json({ resource: {
    id: resource.id, title: resource.title, description: resource.description,
    slug: resource.slug, type: resource.type, subject: resource.subject,
    topic: resource.topic, grade: resource.grade, status: resource.status,
    visibility: resource.visibility, accessType: resource.accessType,
    thumbnailUrl: resource.thumbnailUrl, content: version?.content ?? resource.content,
    answerKey: version?.answerKey ?? resource.answerKey,
    metadata: version?.metadata ?? resource.metadata, versionId: version?.id ?? null,
    versionNumber: version?.versionNumber ?? null, generationId: version?.generationId ?? null,
    createdAt: resource.createdAt, updatedAt: resource.updatedAt,
  } }, { headers: { "Cache-Control": "private, no-store" } });
}
