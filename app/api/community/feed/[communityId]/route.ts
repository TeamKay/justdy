import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ communityId: string }> },
) {
  // 1. Await the params object first to get the communityId
  const { communityId } = await params;

  const posts = await prisma.communityPost.findMany({
    where: {
      communityId: communityId, // 2. Use the resolved variable here
    },
    include: {
      author: true,
      likes: true,
      comments: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(posts);
}
