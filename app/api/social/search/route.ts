import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getActiveSocialViewer } from "@/lib/social/access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Please sign in to search community posts." },
        { status: 401 },
      );
    }

    const viewer = await getActiveSocialViewer(session.user.id);

    if (!viewer) {
      return NextResponse.json(
        { error: "An active Justdy social profile is required." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();

    if (query.length < 2 || query.length > 100) {
      return NextResponse.json(
        { posts: [] },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const words = query
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean)
      .slice(0, 8);

    const posts = await prisma.socialPost.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        AND: words.map((word) => ({
          content: {
            contains: word,
            mode: "insensitive",
          },
        })),
        author: {
          is: {
            status: "Active",
            socialProfile: {
              is: {
                status: "ACTIVE",
              },
            },
            socialBlocksInitiated: {
              none: { blockedId: viewer.id },
            },
            socialBlocksReceived: {
              none: { blockerId: viewer.id },
            },
          },
        },
        OR: [
          { postType: { not: "CHALLENGE" } },
          {
            postType: "CHALLENGE",
            author: {
              is: {
                socialProfile: {
                  is: {
                    username: "justdy_official",
                    status: "ACTIVE",
                  },
                },
              },
            },
            challenge: {
              isNot: null,
            },
          },
        ],
      },
      orderBy: [
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      take: 20,
      select: {
        id: true,
        content: true,
        postType: true,
        publishedAt: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            imageUrl: true,
            socialProfile: {
              select: {
                username: true,
                displayName: true,
              },
            },
          },
        },
        challenge: {
          select: {
            id: true,
            opensAt: true,
            closesAt: true,
            status: true,
            maxScore: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        posts: posts.map((post) => ({
          id: post.id,
          content: post.content,
          postType: post.postType,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          author: {
            name: post.author.name,
            imageUrl: post.author.imageUrl,
            username: post.author.socialProfile?.username ?? null,
            displayName:
              post.author.socialProfile?.displayName ?? null,
          },
          challenge: post.challenge
            ? {
                id: post.challenge.id,
                opensAt: post.challenge.opensAt,
                closesAt: post.challenge.closesAt,
                status: post.challenge.status,
                maxScore: post.challenge.maxScore,
              }
            : null,
        })),
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/social/search error:", error);

    return NextResponse.json(
      { error: "Unable to search community posts." },
      { status: 500 },
    );
  }
}