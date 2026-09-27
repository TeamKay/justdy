import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getVerifiedTutor } from "@/lib/tutoring/authorization";
import { Prisma } from "@/lib/generated/prisma/client";


type RouteContext = {
  params: Promise<{ id: string }>;
};

type FeedbackBody = {
  topic?: unknown;
  topicsCovered?: unknown;
  strengths?: unknown;
  needsPractice?: unknown;
  nextStep?: unknown;
  tutorNotes?: unknown;
  learnerOutcome?: unknown;
};

function optionalText(value: unknown, field: string, maxLength = 5000) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new Error(`${field} must be text.`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`${field} is too long.`);
  }
  return trimmed || null;
}

function parseTopicsCovered(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (!Array.isArray(value)) {
    throw new Error("topicsCovered must be an array of topics.");
  }

  const topics = value
    .filter((topic): topic is string => typeof topic === "string")
    .map((topic) => topic.trim())
    .filter(Boolean);

  if (topics.length > 20) {
    throw new Error("A maximum of 20 topics can be recorded.");
  }

  if (topics.some((topic) => topic.length > 200)) {
    throw new Error("Each topic must be 200 characters or fewer.");
  }

  return topics;
}

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

async function canManageLearner(userId: string, learnerId: string) {
  const membership = await prisma.familyMember.findFirst({
    where: {
      userId,
      role: { in: ["PARENT", "GUARDIAN"] },
      family: {
        members: {
          some: { userId: learnerId, role: "CHILD" },
        },
      },
    },
    select: { userId: true },
  });

  return Boolean(membership);
}

async function getSession(id: string, userId: string) {
  const tutoringSession = await prisma.tutoringSession.findUnique({
    where: { id },
    select: {
      id: true,
      learnerId: true,
      educatorId: true,
      status: true,
      topic: true,
      topicsCovered: true,
      strengths: true,
      needsPractice: true,
      nextStep: true,
      tutorNotes: true,
      learnerOutcome: true,
    },
  });

  if (!tutoringSession) return { session: null, unauthorized: false, isTutor: false };

  const directAccess =
    tutoringSession.learnerId === userId || tutoringSession.educatorId === userId;
  const parentAccess = directAccess
    ? false
    : await canManageLearner(userId, tutoringSession.learnerId);

  return {
    session: directAccess || parentAccess ? tutoringSession : null,
    unauthorized: !directAccess && !parentAccess,
    isTutor: tutoringSession.educatorId === userId,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
    }

    const result = await getSession(id, user.id);
    if (result.unauthorized) {
      return NextResponse.json({ error: "You are not authorized to view this session." }, { status: 403 });
    }
    if (!result.session) {
      return NextResponse.json({ error: "Tutoring session not found." }, { status: 404 });
    }

    const feedback = result.session
      ? {
          ...result.session,
          tutorNotes: result.isTutor ? result.session.tutorNotes : null,
        }
      : null;

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("GET /api/tutoring/sessions/[id]/feedback error:", error);
    return NextResponse.json({ error: "Failed to load session feedback." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
    }

    const session = await prisma.tutoringSession.findUnique({
      where: { id },
      select: {
        id: true,
        learnerId: true,
        educatorId: true,
        status: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Tutoring session not found." }, { status: 404 });
    }

    if (session.educatorId !== user.id) {
      return NextResponse.json({ error: "Only the tutor can submit session feedback." }, { status: 403 });
    }

    const tutor = await getVerifiedTutor(user.id);
    if (!tutor) {
      return NextResponse.json({ error: "Your verified tutor status is not currently active." }, { status: 403 });
    }

    if (session.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Session feedback can only be submitted after the lesson is completed." },
        { status: 409 },
      );
    }

    const body = (await request.json().catch(() => null)) as FeedbackBody | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "A feedback payload is required." }, { status: 400 });
    }

    let topic: string | null;
    let topicsCovered: string[] | null;
    let strengths: string | null;
    let needsPractice: string | null;
    let nextStep: string | null;
    let tutorNotes: string | null;
    let learnerOutcome: string | null;

    try {
      topic = optionalText(body.topic, "topic", 500);
      topicsCovered = parseTopicsCovered(body.topicsCovered);
      strengths = optionalText(body.strengths, "strengths");
      needsPractice = optionalText(body.needsPractice, "needsPractice");
      nextStep = optionalText(body.nextStep, "nextStep");
      tutorNotes = optionalText(body.tutorNotes, "tutorNotes");
      learnerOutcome = optionalText(body.learnerOutcome, "learnerOutcome");
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid feedback." },
        { status: 400 },
      );
    }

    const updated = await prisma.tutoringSession.updateMany({
      where: {
        id: session.id,
        educatorId: user.id,
        status: "COMPLETED",
      },
     data: {
  topic,
  topicsCovered:
    topicsCovered === null
      ? Prisma.JsonNull
      : topicsCovered,
  strengths,
  needsPractice,
  nextStep,
  tutorNotes,
  learnerOutcome,
},
    });

    if (updated.count !== 1) {
      return NextResponse.json(
        { error: "The session changed while feedback was being saved. Please refresh." },
        { status: 409 },
      );
    }

    const feedback = await prisma.tutoringSession.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        topic: true,
        topicsCovered: true,
        strengths: true,
        needsPractice: true,
        nextStep: true,
        tutorNotes: true,
        learnerOutcome: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("POST /api/tutoring/sessions/[id]/feedback error:", error);
    return NextResponse.json({ error: "Failed to save session feedback." }, { status: 500 });
  }
}
