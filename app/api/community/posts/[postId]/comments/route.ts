import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
// 1. GET: Fetch comments context dynamically for open target post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;

    const comments = await prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" }, // Thread view reads chronologically down
      include: { user: true },
    });

    const formatted = comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: "Just now", // Replace with custom time formatter if needed
      user: {
        id: c.user?.id,
        name: c.user?.name,
      },
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed fetching comments" },
      { status: 500 },
    );
  }
}

// 2. POST: Write custom comment instance row
export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;
    const { content, userId } = await request.json();

    console.log("Received comment data:", { content, userId, postId });

    if (!postId || !content?.trim() || !userId) {
      return NextResponse.json(
        { error: "Parameters structurally incomplete" },
        { status: 400 },
      );
    }

    const createdComment = await prisma.postComment.create({
      data: {
        content,
        postId,
        userId,
      },
      include: { user: true },
    });

    return NextResponse.json(
      {
        id: createdComment.id,
        content: createdComment.content,
        createdAt: "Just now",
        user: {
          id: createdComment.user?.id,
          name: createdComment.user?.name,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("PRISMA DATABASE WRITE ERROR:", err);
    return NextResponse.json(
      {
        error: "Database rejected write",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
