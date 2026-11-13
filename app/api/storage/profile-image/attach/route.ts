
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const mediaId = body?.imageMediaId;

    if (typeof mediaId !== "string" || !mediaId.trim()) {
      return NextResponse.json(
        { error: "A valid uploaded image is required." },
        { status: 400 },
      );
    }

    const media = await prisma.uploadedMedia.findFirst({
      where: {
        id: mediaId,
        uploaderId: session.user.id,
        purpose: "PROFILE_IMAGE",
        type: "IMAGE",
        status: "UPLOADED",
      },
      select: {
        id: true,
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: "The uploaded image could not be verified." },
        { status: 400 },
      );
    }

    const imageUrl = `/api/storage/profile-image/${session.user.id}`;

    await prisma.$transaction([
      prisma.uploadedMedia.update({
        where: {
          id: media.id,
        },
        data: {
          status: "ATTACHED",
        },
      }),
      prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          imageUrl,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error("Attach profile image error:", error);

    return NextResponse.json(
      { error: "Unable to update your profile photo." },
      { status: 500 },
    );
  }
}
