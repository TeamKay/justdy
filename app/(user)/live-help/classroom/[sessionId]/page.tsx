import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import LiveHomeworkClassroom from "@/app/_components/LiveHomeworkClassroom";

type PageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function LiveHomeworkClassroomPage({ params }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/signin");
  }

  const { sessionId } = await params;

  if (!sessionId) {
    notFound();
  }

  const liveSession = await prisma.liveHomeworkSession.findUnique({
    where: {
      id: sessionId,
    },
  });

  if (!liveSession) {
    notFound();
  }

  const userId = session.user.id;
  const role = session.user.role?.toLowerCase();

  const isLearner = liveSession.learnerId === userId;
  const isTeacher = liveSession.teacherId === userId;
  const isAdmin = role === "admin";

  if (!isLearner && !isTeacher && !isAdmin) {
    redirect("/live-help");
  }

  const homeworkRequest = await prisma.liveHomeworkRequest.findUnique({
    where: {
      id: liveSession.requestId,
    },
  });

  if (!homeworkRequest) {
    notFound();
  }

  return (
    <LiveHomeworkClassroom
      user={{
        id: session.user.id,
        name: session.user.name,
        role: session.user.role ?? null,
      }}
      session={{
        id: liveSession.id,
        requestId: liveSession.requestId,
        learnerId: liveSession.learnerId,
        teacherId: liveSession.teacherId,
        status: liveSession.status,
        startedAt: liveSession.startedAt?.toISOString() ?? null,
        endedAt: liveSession.endedAt?.toISOString() ?? null,
        durationSeconds: liveSession.durationSeconds,
      }}
      request={{
        id: homeworkRequest.id,
        subject: homeworkRequest.subject,
        gradeLevel: homeworkRequest.gradeLevel,
        topic: homeworkRequest.topic,
        description: homeworkRequest.description,
        assignmentUrl: homeworkRequest.assignmentUrl,
        assignmentName: homeworkRequest.assignmentName,
        assignmentType: homeworkRequest.assignmentType,
      }}
    />
  );
}
