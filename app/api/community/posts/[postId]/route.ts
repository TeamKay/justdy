import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // 1. Authenticate user session existence
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    // 2. Fetch target record to confirm database ownership mapping rules matches session data
    const existingPost = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 3. SECURE VERIFICATION: Is the actor deleting actually the creator of the post?
    if (existingPost.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not the creator of this post" },
        { status: 403 },
      );
    }

    // 4. Safely execute database deletion operation
    await prisma.communityPost.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true, message: "Post deleted safely" });
  } catch (err) {
    console.error("DELETE /community/posts/[postId] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // 1. Authenticate user session
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const { title, content } = await req.json();

    if (!title || !content || !content.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 },
      );
    }

    // 2. Fetch the post and check ownership
    const existingPost = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { userId: true }, // 👈 CORRECTION: Ensure this is userId, NOT authorId
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 3. Security Verification
    if (existingPost.userId !== session.user.id) {
      // 👈 CORRECTION: Check against userId
      return NextResponse.json(
        { error: "Forbidden: You do not own this post" },
        { status: 403 },
      );
    }

    // 4. Update the database record
    const updatedPost = await prisma.communityPost.update({
      where: { id: postId },
      data: { title, content },
    });

    return NextResponse.json(updatedPost);
  } catch (err) {
    console.error("PATCH /community/posts/[postId] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
