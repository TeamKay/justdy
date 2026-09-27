import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageChildren } from "@/lib/auth/capabilities";

export const dynamic = "force-dynamic";

function termsFromPractice(values: Array<string | null | undefined>) {
  const terms = values
    .flatMap((value) =>
      (value ?? "")
        .split(/[;,\n]+/)
        .map((part) => part.trim())
        .filter(Boolean),
    )
    .flatMap((value) => [value, ...value.split(/\s+/)])
    .map((value) => value.replace(/[^a-zA-Z0-9'-]/g, "").trim())
    .filter((value) => value.length >= 3)
    .slice(0, 20);

  return [...new Set(terms)].slice(0, 10);
}

async function resolveLearner(userId: string, requestedStudentId: string | null) {
  if (!requestedStudentId || requestedStudentId === userId) return userId;
  if (!(await canManageChildren(userId))) return null;

  const membership = await prisma.familyMember.findFirst({
    where: {
      userId,
      role: { in: ["PARENT", "GUARDIAN"] },
      family: { members: { some: { userId: requestedStudentId, role: "CHILD" } } },
    },
    select: { familyId: true },
  });

  return membership ? requestedStudentId : null;
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requestedStudentId = new URL(request.url).searchParams.get("studentId")?.trim() || null;
    const learnerId = await resolveLearner(userId, requestedStudentId);
    if (!learnerId) {
      return NextResponse.json({ error: "You are not authorized to view this learner's practice recommendations." }, { status: 403 });
    }

    const [learner, sessions] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { userId: learnerId }, select: { gradeLevel: true } }),
      prisma.tutoringSession.findMany({
        where: { learnerId, status: "COMPLETED", needsPractice: { not: null } },
        orderBy: { scheduledStart: "desc" },
        take: 12,
        select: { needsPractice: true, topic: true, topicsCovered: true },
      }),
    ]);

    const practiceTerms = termsFromPractice([
      ...sessions.map((session) => session.needsPractice),
      ...sessions.map((session) => session.topic),
      ...sessions.flatMap((session) => Array.isArray(session.topicsCovered)
        ? session.topicsCovered.filter((value): value is string => typeof value === "string")
        : []),
    ]);

    if (!practiceTerms.length) return NextResponse.json({ recommendations: [] });

    const resources = await prisma.resource.findMany({
      where: {
        status: "PUBLISHED",
        visibility: { in: ["PUBLIC", "MARKETPLACE"] },
        accessType: "FREE",
        OR: practiceTerms.flatMap((term) => [
          { title: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { topic: { contains: term, mode: "insensitive" } },
        ]),
      },
      orderBy: { publishedAt: "desc" },
      take: 30,
      select: { id: true, title: true, slug: true, type: true, subject: true, topic: true, grade: true, description: true, thumbnailUrl: true },
    });

    const normalizedGrade = learner?.gradeLevel?.trim().toLowerCase() ?? null;
    const recommendations = resources
      .map((resource) => {
        const haystack = [resource.title, resource.description, resource.topic, resource.subject].filter(Boolean).join(" ").toLowerCase();
        const matchedTerms = practiceTerms.filter((term) => haystack.includes(term.toLowerCase()));
        const gradeMatch = normalizedGrade && resource.grade?.trim().toLowerCase() === normalizedGrade;
        return { resource, matchedTerms, score: matchedTerms.length * 10 + (gradeMatch ? 5 : 0) };
      })
      .filter((item) => item.matchedTerms.length > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ resource, matchedTerms }) => ({
        id: resource.id,
        title: resource.title,
        slug: resource.slug,
        type: resource.type,
        subject: resource.subject,
        topic: resource.topic,
        grade: resource.grade,
        description: resource.description,
        thumbnailUrl: resource.thumbnailUrl,
        matchedTerms,
        learnUrl: `/resources/${encodeURIComponent(resource.slug)}/learn`,
      }));

    return NextResponse.json({ learnerId, recommendations });
  } catch (error) {
    console.error("GET /api/tutoring/practice-recommendations error:", error);
    return NextResponse.json({ error: "Failed to load practice recommendations." }, { status: 500 });
  }
}
