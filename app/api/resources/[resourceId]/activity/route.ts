import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  ResourceStatus,
  ResourceVisibility,
  ResourceAccessType,
  ResourceType,
} from "@/lib/generated/prisma/enums";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { WorksheetDocumentSchema } from "@/lib/ai/worksheet/schema";
import {
  completeResourceActivity,
  startResourceActivity,
} from "@/lib/learning/resource-activity";

interface RouteContext {
  params: Promise<{ resourceId: string }>;
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isPublicFree(resource: {
  status: ResourceStatus;
  visibility: ResourceVisibility;
  accessType: ResourceAccessType;
}) {
  return (
    resource.status === ResourceStatus.PUBLISHED &&
    (resource.visibility === ResourceVisibility.PUBLIC ||
      resource.visibility === ResourceVisibility.MARKETPLACE) &&
    resource.accessType === ResourceAccessType.FREE
  );
}

function getWorksheet(content: unknown) {
  const parsed = WorksheetDocumentSchema.safeParse(content);
  return parsed.success ? parsed.data : null;
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Authentication required.", 401);

  const { resourceId } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId.trim() },
    select: {
      id: true,
      type: true,
      status: true,
      visibility: true,
      accessType: true,
      content: true,
    },
  });

  if (!resource) return error("Resource not found.", 404);
  if (!isPublicFree(resource)) {
    return error(
      resource.accessType === ResourceAccessType.PAID
        ? "This resource requires purchase before it can be used."
        : "This resource is not available for learning.",
      403,
    );
  }

  if (resource.type !== ResourceType.WORKSHEET) {
    return error(
      "This learner activity endpoint currently supports worksheets only.",
      400,
    );
  }

  const worksheet = getWorksheet(resource.content);
  if (!worksheet) return error("The resource content is invalid.", 500);

  const activity = await startResourceActivity({
    userId: user.id,
    resourceId: resource.id,
  });

  // Never return answerKey through this learner endpoint.
  return NextResponse.json({
    activityId: activity.id,
    resource: {
      id: resource.id,
      type: resource.type,
      title: worksheet.title,
      gradeLevel: worksheet.gradeLevel,
      subject: worksheet.subject,
      topic: worksheet.topic,
      learningObjective: worksheet.learningObjective ?? null,
      questions: worksheet.questions.map((question) => ({
        id: question.id,
        number: question.number,
        type: question.type,
        question: question.question,
        options: question.options,
        points: question.points,
      })),
    },
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Authentication required.", 401);

  const { resourceId } = await params;
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.activityId !== "string" ||
    !body.answers ||
    typeof body.answers !== "object"
  ) {
    return error("activityId and answers are required.", 400);
  }

  const activity = await prisma.learningActivity.findFirst({
    where: {
      id: body.activityId,
      userId: user.id,
      resourceId: resourceId.trim(),
      status: "STARTED",
    },
    select: { id: true },
  });
  if (!activity) return error("Learning activity not found.", 404);

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId.trim() },
    select: {
      type: true,
      content: true,
      status: true,
      visibility: true,
      accessType: true,
    },
  });
  if (!resource || !isPublicFree(resource))
    return error("Resource is no longer available.", 403);

  if (resource.type !== ResourceType.WORKSHEET)
    return error("Unsupported resource type.", 400);

  const worksheet = getWorksheet(resource.content);
  if (!worksheet) return error("The resource content is invalid.", 500);

  const submitted = body.answers as Record<string, unknown>;
  const normalizedAnswers: Record<string, string> = {};
  let score = 0;
  let maxScore = 0;

  for (const question of worksheet.questions) {
    const points = Number.isFinite(question.points) ? question.points : 0;
    maxScore += points;

    const raw = submitted[question.id];
    const answer = typeof raw === "string" ? raw.trim() : "";
    normalizedAnswers[question.id] = answer;

    if (
      answer &&
      answer.toLowerCase() === question.answer.trim().toLowerCase()
    ) {
      score += points;
    }
  }

  const result = await completeResourceActivity({
    userId: user.id,
    activityId: activity.id,
    score,
    maxScore,
    answers: normalizedAnswers,
    metadata: {
      resourceType: resource.type,
      questionCount: worksheet.questions.length,
    },
  });

  if (result.count !== 1) {
    return error("This learning activity was already completed.", 409);
  }

  return NextResponse.json({
    success: true,
    score,
    maxScore,
    percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    questionCount: worksheet.questions.length,
  });
}
