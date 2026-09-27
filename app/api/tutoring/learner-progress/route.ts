import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getVerifiedTutor } from "@/lib/tutoring/authorization";

export const dynamic = "force-dynamic";

function strings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const tutorId = session?.user?.id;
    if (!tutorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tutor = await getVerifiedTutor(tutorId);
    if (!tutor) return NextResponse.json({ error: "Verified tutor access is required." }, { status: 403 });

    const bookings = await prisma.booking.findMany({
      where: { educatorId: tutorId },
      orderBy: { startTime: "desc" },
      take: 200,
      select: {
        studentId: true,
        student: { select: { id: true, name: true, email: true, imageUrl: true } },
        gradeLevel: true,
        subject: true,
        tutoringSession: {
          select: {
            id: true,
            scheduledStart: true,
            status: true,
            topic: true,
            topicsCovered: true,
            strengths: true,
            needsPractice: true,
            nextStep: true,
            tutorNotes: true,
            learnerOutcome: true,
          },
        },
      },
    });

    const learnerIds = [...new Set(bookings.map((booking) => booking.studentId))];
    if (!learnerIds.length) return NextResponse.json({ learners: [] });

    const activities = await prisma.learningActivity.findMany({
      where: { userId: { in: learnerIds } },
      orderBy: { createdAt: "desc" },
      take: Math.min(learnerIds.length * 20, 200),
      select: {
        id: true,
        userId: true,
        status: true,
        score: true,
        maxScore: true,
        completedAt: true,
        createdAt: true,
        resource: { select: { id: true, title: true, subject: true, topic: true } },
      },
    });

    const learners = learnerIds.map((learnerId) => {
      const learnerBookings = bookings.filter((booking) => booking.studentId === learnerId);
      const sessions = learnerBookings
        .map((booking) => booking.tutoringSession)
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      const completedSessions = sessions.filter((item) => item.status === "COMPLETED");
      const learnerActivities = activities.filter((item) => item.userId === learnerId);
      const completedActivities = learnerActivities.filter((item) => item.status === "COMPLETED");
      const scored = completedActivities.filter((item) => item.score !== null && item.maxScore !== null && item.maxScore > 0);
      const points = scored.reduce((sum, item) => sum + (item.score ?? 0), 0);
      const max = scored.reduce((sum, item) => sum + (item.maxScore ?? 0), 0);

      const needsPractice = strings(completedSessions.map((item) => item.needsPractice));
      const nextSteps = strings(completedSessions.map((item) => item.nextStep));
      const topics = strings(completedSessions.flatMap((item) => {
        const covered = Array.isArray(item.topicsCovered) ? item.topicsCovered : [];
        return [item.topic, ...covered.filter((value): value is string => typeof value === "string")];
      }));

      const lastSession = completedSessions[0] ?? sessions[0] ?? null;
      const lastPractice = learnerActivities[0] ?? null;

      return {
        learner: learnerBookings[0].student,
        gradeLevels: strings(learnerBookings.map((booking) => booking.gradeLevel)),
        subjects: strings(learnerBookings.map((booking) => booking.subject)),
        completedSessions: completedSessions.length,
        practice: {
          totalActivities: learnerActivities.length,
          completedActivities: completedActivities.length,
          percentage: max > 0 ? Math.round((points / max) * 100) : null,
        },
        topics: topics.slice(0, 8),
        needsPractice: needsPractice.slice(0, 6),
        nextSteps: nextSteps.slice(0, 4),
        lastSession: lastSession
          ? {
              id: lastSession.id,
              scheduledStart: lastSession.scheduledStart,
              topic: lastSession.topic,
              strengths: lastSession.strengths,
              needsPractice: lastSession.needsPractice,
              nextStep: lastSession.nextStep,
              learnerOutcome: lastSession.learnerOutcome,
              tutorNotes: lastSession.tutorNotes,
            }
          : null,
        lastPractice: lastPractice
          ? {
              id: lastPractice.id,
              status: lastPractice.status,
              score: lastPractice.score,
              maxScore: lastPractice.maxScore,
              completedAt: lastPractice.completedAt,
              resource: lastPractice.resource,
            }
          : null,
      };
    });

    return NextResponse.json({ learners });
  } catch (error) {
    console.error("GET /api/tutoring/learner-progress error:", error);
    return NextResponse.json({ error: "Failed to load learner progress." }, { status: 500 });
  }
}
