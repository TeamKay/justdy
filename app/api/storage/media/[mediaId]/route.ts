
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createR2DownloadUrl,
} from "@/lib/storage/r2";
import {
  getActiveSocialViewer,
  visibleSocialPostWhere,
} from "@/lib/social/access";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    mediaId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { mediaId } = await context.params;

    if (!mediaId || typeof mediaId !== "string") {
      return NextResponse.json(
        { error: "Media not found." },
        { status: 404 },
      );
    }

    // Only active social users may access social-post media.
    const viewer = await getActiveSocialViewer(session.user.id);

    if (!viewer) {
      return NextResponse.json(
        { error: "Media not found." },
        { status: 404 },
      );
    }

    // Find the media only when it is attached to a post
    // that this viewer is permitted to access.
    const media = await prisma.uploadedMedia.findFirst({
      where: {
        id: mediaId,
        purpose: "SOCIAL_POST",
        status: {
          in: ["UPLOADED", "ATTACHED"],
        },
        type: {
          in: ["IMAGE", "VIDEO"],
        },

       posts: {
          some: {
            post: {
              is: {
                ...visibleSocialPostWhere(session.user.id),
              },
            },
          },
        },
      },

      select: {
        storageKey: true,
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: "Media not found." },
        { status: 404 },
      );
    }

    const downloadUrl = await createR2DownloadUrl(
      media.storageKey,
    );

    return NextResponse.redirect(downloadUrl, {
      status: 302,
      headers: {
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    console.error("R2 media delivery error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve this media." },
      { status: 500 },
    );
  }
}
