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

type LessonSection = {
  id: string;
  title: string;
  content: string;
};

type LessonPlan = {
  title: string;
  description: string | null;
  subject: string | null;
  gradeLevel: string | null;
  topic: string | null;
  duration: number | null;
  learningObjectives: string[];
  sections: LessonSection[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function uniqueSlug(base: string) {
  return `${base || "lesson-plan"}-${Date.now().toString(36)}`;
}

function readLessonPlan(outputData: unknown, prompt?: string | null): LessonPlan | null {
  let candidate: unknown = outputData;

  if (isRecord(candidate)) {
    candidate = candidate.lessonPlan ?? candidate.lesson ?? candidate.data ?? candidate;
  }

  // The centralized text generator commonly stores structured JSON in outputData.text.
  if (isRecord(outputData) && typeof outputData.text === "string") {
    const text = outputData.text.trim();
    try {
      candidate = JSON.parse(text);
    } catch {
      // Fall through to a lightweight text-section parser below.
      candidate = outputData;
    }
  }

  if (!isRecord(candidate)) return null;

  const title =
    asString(candidate.title) ??
    asString(candidate.name) ??
    "Lesson Plan";

  const description =
    asString(candidate.description) ??
    asString(candidate.summary);

  const objectives =
    asStringArray(candidate.learningObjectives).length > 0
      ? asStringArray(candidate.learningObjectives)
      : asStringArray(candidate.objectives);

  const rawSections =
    candidate.sections ??
    candidate.lessonSections ??
    candidate.activities;

  let sections: LessonSection[] = [];

  if (Array.isArray(rawSections)) {
    sections = rawSections
      .map((section, index) => {
        if (!isRecord(section)) return null;
        const sectionTitle =
          asString(section.title) ??
          asString(section.heading) ??
          `Section ${index + 1}`;
        const content =
          asString(section.content) ??
          asString(section.description) ??
          asString(section.body) ??
          asString(section.text) ??
          "";
        return {
          id: asString(section.id) ?? `section-${index + 1}`,
          title: sectionTitle,
          content,
        };
      })
      .filter((section): section is LessonSection => section !== null && section.content.length > 0);
  }

  // Support object-shaped sections such as { materials: "...", assessment: "..." }.
  if (sections.length === 0) {
    const knownKeys = [
      "materials",
      "requiredMaterials",
      "priorKnowledge",
      "warmUp",
      "introduction",
      "teacherInstruction",
      "guidedPractice",
      "independentPractice",
      "assessment",
      "differentiation",
      "support",
      "extension",
      "homework",
      "followUp",
    ];

    sections = knownKeys
      .map((key) => {
        const content = asString(candidate[key]);
        if (!content) return null;
        const title = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (char) => char.toUpperCase());
        return {
          id: key,
          title,
          content,
        };
      })
      .filter((section): section is LessonSection => section !== null);
  }

  // If the model returned plain text, preserve it rather than losing the generation.
  if (sections.length === 0 && isRecord(outputData) && typeof outputData.text === "string") {
    const text = outputData.text.trim();
    if (text) {
      sections = [{ id: "lesson-content", title: "Lesson Content", content: text }];
    }
  }

  if (sections.length === 0) return null;

  const durationValue =
    typeof candidate.duration === "number"
      ? candidate.duration
      : typeof candidate.durationMinutes === "number"
        ? candidate.durationMinutes
        : null;

  return {
    title,
    description,
    subject: asString(candidate.subject),
    gradeLevel: asString(candidate.gradeLevel) ?? asString(candidate.grade),
    topic: asString(candidate.topic),
    duration: durationValue,
    learningObjectives: objectives,
    sections,
  };
}

async function getGeneration(generationId: string, userId: string) {
  return prisma.aIGeneration.findFirst({
    where: {
      id: generationId,
      userId,
      type: AIGenerationType.LESSON_PLAN,
      status: AIGenerationStatus.COMPLETED,
    },
    select: {
      id: true,
      userId: true,
      projectId: true,
      prompt: true,
      outputData: true,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ generationId: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { generationId } = await params;
    const generation = await getGeneration(generationId, user.id);

    if (!generation) {
      return NextResponse.json(
        { error: "Lesson plan generation not found." },
        { status: 404 },
      );
    }

    const existingVersion = await prisma.resourceVersion.findFirst({
      where: {
        generationId,
        resource: {
          userId: user.id,
          type: ResourceType.LESSON_PLAN,
        },
      },
      include: { resource: true },
      orderBy: { versionNumber: "desc" },
    });

    if (existingVersion) {
      return NextResponse.json({
        success: true,
        resource: existingVersion.resource,
        version: existingVersion,
        lessonPlan: existingVersion.content,
      });
    }

    const lessonPlan = readLessonPlan(generation.outputData, generation.prompt);

    if (!lessonPlan) {
      return NextResponse.json(
        { error: "The generated lesson plan could not be read. Please regenerate it." },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      resource: null,
      version: null,
      lessonPlan,
    });
  } catch (error) {
    console.error("Lesson plan resource GET error:", error);
    return NextResponse.json(
      { error: "Unable to load the lesson plan." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ generationId: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { generationId } = await params;
    const generation = await getGeneration(generationId, user.id);

    if (!generation) {
      return NextResponse.json(
        { error: "Lesson plan generation not found." },
        { status: 404 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const requested = isRecord(body.content)
      ? readLessonPlan(body.content, generation.prompt)
      : null;

    const lessonPlan = requested ?? readLessonPlan(generation.outputData, generation.prompt);

    if (!lessonPlan) {
      return NextResponse.json(
        { error: "The lesson plan data could not be read. Please regenerate the lesson plan." },
        { status: 422 },
      );
    }

    const content = lessonPlan as unknown as Prisma.InputJsonValue;
    const answerKey = undefined;

    const existing = await prisma.resource.findFirst({
      where: {
        userId: user.id,
        type: ResourceType.LESSON_PLAN,
        versions: { some: { generationId } },
      },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      },
    });

    const saved = await prisma.$transaction(async (tx) => {
      if (existing) {
        const latest = existing.versions[0];
        const versionNumber = (latest?.versionNumber ?? 0) + 1;

        const version = await tx.resourceVersion.create({
  data: {
    resourceId: existing.id,
    versionNumber,
    content,
    answerKey,
    metadata: {
      generationId,
      source: "lesson-studio",
    },
    generationId,
  },
});

        const resource = await tx.resource.update({
          where: { id: existing.id },
          data: {
            title: lessonPlan.title,
            description: lessonPlan.description,
            subject: lessonPlan.subject,
            topic: lessonPlan.topic,
            grade: lessonPlan.gradeLevel,
            status: ResourceStatus.DRAFT,
            visibility: ResourceVisibility.PRIVATE,
            accessType: ResourceAccessType.FREE,
            content,
            answerKey,
            metadata: {
              source: "lesson-studio",
              generationId,
              projectId: generation.projectId,
              duration: lessonPlan.duration,
            },
          },
        });

        return { resource, version };
      }

      const baseSlug = slugify(lessonPlan.title);
      const resource = await tx.resource.create({
        data: {
          userId: user.id,
          projectId: generation.projectId,
          title: lessonPlan.title,
          description: lessonPlan.description,
          slug: uniqueSlug(baseSlug),
          type: ResourceType.LESSON_PLAN,
          subject: lessonPlan.subject,
          topic: lessonPlan.topic,
          grade: lessonPlan.gradeLevel,
          status: ResourceStatus.DRAFT,
          visibility: ResourceVisibility.PRIVATE,
          accessType: ResourceAccessType.FREE,
          content,
          metadata: {
            source: "lesson-studio",
            generationId,
            projectId: generation.projectId,
            duration: lessonPlan.duration,
          },
        },
      });

      const version = await tx.resourceVersion.create({
        data: {
          resourceId: resource.id,
          versionNumber: 1,
          content,
          answerKey,
          metadata: {
            generationId,
            source: "lesson-studio",
          },
          generationId,
        },
      });

      return { resource, version };
    });

    return NextResponse.json({
      success: true,
      resource: saved.resource,
      version: saved.version,
      resourceId: saved.resource.id,
    });
  } catch (error) {
    console.error("Lesson plan resource POST error:", error);
    return NextResponse.json(
      { error: "Unable to save the lesson plan to your Library." },
      { status: 500 },
    );
  }
}
