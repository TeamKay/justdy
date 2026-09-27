import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ResourceType } from "@/lib/generated/prisma/enums";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { resourceId } = await params;

    const resource = await prisma.resource.findFirst({
      where: { id: resourceId, userId: user.id, type: ResourceType.LESSON_PLAN },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!resource) {
      return NextResponse.json({ error: "Lesson plan resource not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      resource,
      version: resource.versions[0] ?? null,
      lessonPlan: resource.content ?? resource.versions[0]?.content ?? null,
    });
  } catch (error) {
    console.error("Lesson plan resource GET error:", error);
    return NextResponse.json({ error: "Unable to load the lesson plan." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { resourceId } = await params;
    const resource = await prisma.resource.findFirst({
      where: { id: resourceId, userId: user.id, type: ResourceType.LESSON_PLAN },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!resource) {
      return NextResponse.json({ error: "Lesson plan resource not found." }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (!body.content || typeof body.content !== "object" || Array.isArray(body.content)) {
      return NextResponse.json({ error: "Lesson plan content is required." }, { status: 400 });
    }

    const content = body.content as object;
    const versionNumber = (resource.versions[0]?.versionNumber ?? 0) + 1;

    const saved = await prisma.$transaction(async (tx) => {
      const version = await tx.resourceVersion.create({
        data: {
          resourceId: resource.id,
          versionNumber,
          content,
          generationId: resource.versions[0]?.generationId ?? null,
          metadata: { source: "lesson-studio" },
        },
      });

      const updated = await tx.resource.update({
        where: { id: resource.id },
        data: {
          title:
            typeof (content as Record<string, unknown>).title === "string"
              ? ((content as Record<string, unknown>).title as string)
              : resource.title,
          description:
            typeof (content as Record<string, unknown>).description === "string"
              ? ((content as Record<string, unknown>).description as string)
              : resource.description,
          content,
          status: "DRAFT",
          visibility: "PRIVATE",
        },
      });

      return { version, resource: updated };
    });

    return NextResponse.json({
      success: true,
      resourceId: saved.resource.id,
      resource: saved.resource,
      version: saved.version,
    });
  } catch (error) {
    console.error("Lesson plan resource POST error:", error);
    return NextResponse.json({ error: "Unable to save the lesson plan." }, { status: 500 });
  }
}
