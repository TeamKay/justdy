
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminChallengeSubmissions from "@/app/_components/admin/AdminChallengeSubmissions";


export const dynamic = "force-dynamic";

export const metadata = {
  title: "Challenge Submissions | Justdy",
  description: "Review, grade, and track mathematics challenge submissions.",
};

function extractChallengeText(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map(extractChallengeText)
      .filter(Boolean)
      .join(" ");
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const node = value as {
    text?: unknown;
    content?: unknown;
  };

  if (typeof node.text === "string") {
    return node.text;
  }

  if (Array.isArray(node.content)) {
    return node.content
      .map(extractChallengeText)
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

function getChallengeTitle(content: string | null): string {
  if (!content?.trim()) {
    return "Mathematics Challenge";
  }

  try {
    const document: unknown = JSON.parse(content);

    const extracted = extractChallengeText(document)
      .replace(/\s+/g, " ")
      .trim();

    return extracted || "Mathematics Challenge";
  } catch {
    // Support older posts containing ordinary plain text.
    return content.trim();
  }
}

export default async function AdminChallengeSubmissionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/auth?mode=signin");
  }

  // Verify the administrator using the database, not session role data.
  const administrator = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (
    !administrator ||
    administrator.role !== "ADMIN" ||
    administrator.status !== "Active"
  ) {
    redirect("/dashboard");
  }

  const challenges = await prisma.socialChallenge.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      opensAt: true,
      closesAt: true,
      maxScore: true,
      status: true,
      createdAt: true,
      post: {
        select: {
          id: true,
          content: true,
          publishedAt: true,
        },
      },
      _count: {
        select: {
          participants: true,
          submissions: true,
        },
      },
      submissions: {
        orderBy: {
          submittedAt: "desc",
        },
        select: {
          id: true,
          answer: true,
          status: true,
          score: true,
          feedback: true,
          submittedAt: true,
          gradedAt: true,
          learner: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
              socialProfile: {
                select: {
                  displayName: true,
                  username: true,
                },
              },
            },
          },
          grader: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const challengeData = challenges.map((challenge) => ({
    id: challenge.id,
   title: getChallengeTitle(challenge.post.content).slice(0, 100),
    opensAt: challenge.opensAt.toISOString(),
    closesAt: challenge.closesAt.toISOString(),
    maxScore: challenge.maxScore,
    status: challenge.status,
    createdAt: challenge.createdAt.toISOString(),
    participantCount: challenge._count.participants,
    submissionCount: challenge._count.submissions,
    submissions: challenge.submissions.map((submission) => ({
      id: submission.id,
      answer: submission.answer,
      status: submission.status,
      score: submission.score,
      feedback: submission.feedback,
      submittedAt: submission.submittedAt.toISOString(),
      gradedAt: submission.gradedAt?.toISOString() ?? null,
      learner: {
        id: submission.learner.id,
        name: submission.learner.name,
        email: submission.learner.email,
        imageUrl: submission.learner.imageUrl,
        displayName:
          submission.learner.socialProfile?.displayName ?? null,
        username:
          submission.learner.socialProfile?.username ?? null,
      },
      graderName: submission.grader?.name ?? null,
    })),
  }));

  return <AdminChallengeSubmissions challenges={challengeData} />;
}
