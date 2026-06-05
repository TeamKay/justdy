import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.title || !body.content || !body.communityId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const post = await prisma.communityPost.create({
      data: {
        title: body.title,
        content: body.content,
        communityId: body.communityId,
        userId: session.user.id,
        isPublished: true,
      },
      include: { user: true },
    });

    return NextResponse.json(post);
  } catch (err) {
    console.error("POST /community/posts error:", err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");
    const currentUserId = searchParams.get("userId") || "";

    if (!communityId) {
      return NextResponse.json(
        { error: "communityId required" },
        { status: 400 },
      );
    }

    const posts = await prisma.communityPost.findMany({
      where: {
        communityId,
        isPublished: true,
      },
      include: {
        user: true,
        likes: true,
        _count: {
          select: {
            comments: true, // 🧠 This queries the database for the exact comment count
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map database structural records to look exactly like your frontend Post type
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      timeAgo: "Recent",
      userId: post.userId,
      user: {
        id: post.user?.id,
        name: post.user?.name,
      },
      // 👇 CRITICAL: Calculate counts dynamically from your relation tables
      likes: post._count.likes,
      comments: post._count.comments,
      hasLiked: post.likes.some((like) => like.userId === currentUserId),
    }));

    return NextResponse.json(formattedPosts, { status: 200 });
  } catch (error) {
    console.error("FEED_FETCH_ERROR:", error);
    return NextResponse.json({ error: "Failed to pull feed" }, { status: 500 });
  }
}
