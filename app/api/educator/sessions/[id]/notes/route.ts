import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

type RouteContext = { params: Promise<{ id: string }> };

function cleanText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Session ID is required." }, { status: 400 });

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, canTeach: true },
    });

    if (!currentUser) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (String(currentUser.role ?? "").trim().toUpperCase() === "ADMIN") {
      return NextResponse.json({ error: "Use the admin session workflow for administrator edits." }, { status: 403 });
    }
    if (!currentUser.canTeach) return NextResponse.json({ error: "Teaching access is required." }, { status: 403 });

    const session = await prisma.tutoringSession.findFirst({
      where: { id, educatorId: user.id },
      select: { id: true },
    });

    if (!session) return NextResponse.json({ error: "Tutoring session not found." }, { status: 404 });

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

    const topicsCovered = Array.isArray(body.topicsCovered)
      ? body.topicsCovered.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean).slice(0, 50)
      : undefined;

    const educatorAttendance =
      typeof body.educatorAttendance === "boolean" ? body.educatorAttendance : undefined;

    const updated = await prisma.tutoringSession.update({
      where: { id: session.id },
      data: {
        topic: cleanText(body.topic),
        ...(topicsCovered !== undefined ? { topicsCovered } : {}),
        strengths: cleanText(body.strengths),
        needsPractice: cleanText(body.needsPractice),
        nextStep: cleanText(body.nextStep),
        tutorNotes: cleanText(body.tutorNotes),
        learnerOutcome: cleanText(body.learnerOutcome),
        ...(educatorAttendance !== undefined ? { educatorAttendance } : {}),
      },
      select: {
        id: true,
        topic: true,
        topicsCovered: true,
        strengths: true,
        needsPractice: true,
        nextStep: true,
        tutorNotes: true,
        learnerOutcome: true,
        educatorAttendance: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("PATCH /api/educator/sessions/[id]/notes error:", error);
    return NextResponse.json({ error: "Failed to save session notes." }, { status: 500 });
  }
}
