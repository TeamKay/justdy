// app/api/community/comments/[commentId]/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// 1. EDIT A COMMENT
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const { commentId } = await params;
    const { content, userId } = await request.json();

    if (!content.trim()) {
      return NextResponse.json(
        { error: "Content cannot be empty" },
        { status: 400 },
      );
    }

    // Verify ownership
    const existingComment = await prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment || existingComment.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedComment = await prisma.postComment.update({
      where: { id: commentId },
      data: { content },
      include: { user: true },
    });

    return NextResponse.json(updatedComment, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 },
    );
  }
}

// 2. DELETE A COMMENT
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const { commentId } = await params;

    // Using a URL search param or a custom header is an easy way to verify ownership
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const existingComment = await prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment || existingComment.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized operation" },
        { status: 403 },
      );
    }

    await prisma.postComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 },
    );
  }
}
