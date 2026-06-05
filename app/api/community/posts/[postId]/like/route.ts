// app/api/community/posts/[postId]/like/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const resolvedParams = await params;
    const { postId } = resolvedParams;

    // Get the user ID from the request payload
    const { userId } = await request.json();

    if (!postId || !userId) {
      return NextResponse.json(
        { error: "Missing required post identifier or user context." },
        { status: 400 },
      );
    }

    // 1. Check if the user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: { userId, postId }, // Matches the compound unique constraint
      },
    });

    if (existingLike) {
      // 2. UNLIKE ACTION: If it exists, remove it
      await prisma.postLike.delete({
        where: {
          userId_postId: { userId, postId },
        },
      });
    } else {
      // 3. LIKE ACTION: If it doesn't exist, create it
      await prisma.postLike.create({
        data: { userId, postId },
      });
    }

    // 4. Return the fresh total count back to the client
    const totalLikes = await prisma.postLike.count({
      where: { postId },
    });

    return NextResponse.json({
      success: true,
      likes: totalLikes,
      hasLiked: !existingLike, // Tells frontend whether the state ended as liked or unliked
    });
  } catch (error) {
    console.error("LIKE_TOGGLE_PIPELINE_CRASH:", error);
    return NextResponse.json(
      { error: "Failed to update engagement records." },
      { status: 500 },
    );
  }
}
