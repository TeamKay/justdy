import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { createR2DownloadUrl } from "@/lib/storage/r2";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid profile image request." },
        { status: 400 },
      );
    }

    const media = await prisma.uploadedMedia.findFirst({
      where: {
        uploaderId: userId,
        purpose: "PROFILE_IMAGE",
        type: "IMAGE",
        status: "ATTACHED",
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        storageKey: true,
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Profile image not found." },
        { status: 404 },
      );
    }

    const signedUrl = await createR2DownloadUrl(media.storageKey);

    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    console.error("Profile image delivery error:", error);

    return NextResponse.json(
      { error: "Unable to load profile image." },
      { status: 500 },
    );
  }
}