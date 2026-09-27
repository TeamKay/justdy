import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export const dynamic = "force-dynamic";

const RESOURCE_TYPES = [
  "WORKSHEET",
  "WORKBOOK",
  "QUIZ",
  "ASSESSMENT",
  "LESSON_PLAN",
  "ASSIGNMENT",
  "STUDY_GUIDE",
  "FLASHCARDS",
  "PRESENTATION",
  "READING",
  "IMAGE",
  "DOCUMENT",
  "GAME",
  "QUESTION_BANK",
  "VIDEO",
] as const;

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const type = searchParams.get("type")?.trim().toUpperCase() ?? "ALL";
  const status = searchParams.get("status")?.trim().toUpperCase() ?? "ALL";

  const where = {
    userId: user.id,
    ...(type !== "ALL" && RESOURCE_TYPES.includes(type as (typeof RESOURCE_TYPES)[number])
      ? { type: type as (typeof RESOURCE_TYPES)[number] }
      : {}),
    ...(status !== "ALL"
      ? { status: status as "DRAFT" | "REVIEW" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED" | "REJECTED" }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { subject: { contains: search, mode: "insensitive" as const } },
            { topic: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const resources = await prisma.resource.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      type: true,
      subject: true,
      topic: true,
      grade: true,
      difficulty: true,
      status: true,
      visibility: true,
      accessType: true,
      price: true,
      currency: true,
      thumbnailUrl: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: {
          versionNumber: true,
          generationId: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      resources: resources.map((resource) => ({
        ...resource,
        latestVersion: resource.versions[0] ?? null,
        versions: undefined,
      })),
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
