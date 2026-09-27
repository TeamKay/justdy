import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageChildren } from "@/lib/auth/capabilities";

export const dynamic = "force-dynamic";

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestedStudentId = new URL(request.url).searchParams.get("studentId")?.trim() || null;
    let learnerId = userId;

    if (requestedStudentId && requestedStudentId !== userId) {
      if (!(await canManageChildren(userId))) {
        return NextResponse.json({ error: "You are not authorized to view this learner's progress." }, { status: 403 });
      }

      const membership = await prisma.familyMember.findFirst({
        where: {
          userId,
          role: { in: ["PARENT", "GUARDIAN"] },
          family: {
            members: {
              some: { userId: requestedStudentId, role: "CHILD" },
            },
          },
        },
        select: { familyId: true },
      });

      if (!membership) {
        return NextResponse.json({ error: "You are not authorized to view this learner's progress." }, { status: 403 });
      }

      learnerId = requestedStudentId;
    }

    const [sessions, activities] = await Promise.all([
      prisma.tutoringSession.findMany({
      where: {
        learnerId,
        status: "COMPLETED",
      },
      orderBy: { scheduledStart: "desc" },
      take: 50,
      select: {
        id: true,
        scheduledStart: true,
        scheduledEnd: true,
        startedAt: true,
        endedAt: true,
        topic: true,
        topicsCovered: true,
        strengths: true,
        needsPractice: true,
        nextStep: true,
        learnerOutcome: true,
        educator: { select: { id: true, name: true } },
        service: { select: { title: true, subject: true } },
        booking: { select: { subject: true, gradeLevel: true } },
      },
      }),
      prisma.learningActivity.findMany({
        where: { userId: learnerId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          activityType: true,
          status: true,
          score: true,
          maxScore: true,
          startedAt: true,
          completedAt: true,
          resource: { select: { id: true, title: true, type: true, subject: true, topic: true } },
        },
      }),
    ]);

    const completedActivities = activities.filter((item) => item.status === "COMPLETED");
    const scoredActivities = completedActivities.filter(
      (item) => item.score !== null && item.maxScore !== null && item.maxScore > 0,
    );
    const practicePoints = scoredActivities.reduce((sum, item) => sum + (item.score ?? 0), 0);
    const practiceMaxPoints = scoredActivities.reduce((sum, item) => sum + (item.maxScore ?? 0), 0);
    const practicePercentage = practiceMaxPoints > 0
      ? Math.round((practicePoints / practiceMaxPoints) * 100)
      : null;

    const topics = uniqueStrings(
      sessions.flatMap((item) => {
        const values = Array.isArray(item.topicsCovered)
          ? item.topicsCovered
          : [];
        return [item.topic, ...values.filter((value): value is string => typeof value === "string")];
      }),
    );

    const strengths = uniqueStrings(sessions.map((item) => item.strengths));
    const needsPractice = uniqueStrings(sessions.map((item) => item.needsPractice));
    const nextSteps = uniqueStrings(sessions.map((item) => item.nextStep));

    const totalMinutes = sessions.reduce((sum, item) => {
      const start = item.startedAt ?? item.scheduledStart;
      const end = item.endedAt ?? item.scheduledEnd;
      const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
      return sum + minutes;
    }, 0);

    return NextResponse.json({
      progress: {
        learnerId,
        completedSessions: sessions.length,
        totalMinutes,
        topics,
        strengths,
        needsPractice,
        nextSteps,
        practice: {
          totalActivities: activities.length,
          completedActivities: completedActivities.length,
          practicePercentage,
          recentActivities: activities.slice(0, 8).map((item) => ({
            id: item.id,
            activityType: item.activityType,
            status: item.status,
            score: item.score,
            maxScore: item.maxScore,
            startedAt: item.startedAt,
            completedAt: item.completedAt,
            resource: item.resource,
          })),
        },
        recentSessions: sessions.slice(0, 10).map((item) => ({
          id: item.id,
          scheduledStart: item.scheduledStart,
          scheduledEnd: item.scheduledEnd,
          topic: item.topic,
          educatorName: item.educator.name,
          serviceTitle: item.service?.title ?? null,
          subject: item.service?.subject ?? item.booking.subject,
          gradeLevel: item.booking.gradeLevel,
          strengths: item.strengths,
          needsPractice: item.needsPractice,
          nextStep: item.nextStep,
          learnerOutcome: item.learnerOutcome,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/tutoring/progress error:", error);
    return NextResponse.json({ error: "Failed to load tutoring progress." }, { status: 500 });
  }
}
