import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { refundVideoCreditsAtomic } from "@/lib/ai/video/credits";
import { getVideoJobStatus } from "@/lib/ai/video/provider";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function serializeGeneration(generation: {
  id: string;
  userId: string;
  title: string | null;
  prompt: string;
  style: string | null;
  duration: number;
  aspectRatio: string;
  provider: string;
  model: string | null;
  providerTaskId: string | null;
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  creditsUsed: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}) {
  return {
    id: generation.id,
    title: generation.title,
    prompt: generation.prompt,
    style: generation.style,
    duration: generation.duration,
    aspectRatio: generation.aspectRatio,
    provider: generation.provider,
    model: generation.model,
    providerTaskId: generation.providerTaskId,
    status: generation.status,
    videoUrl: generation.videoUrl,
    thumbnailUrl: generation.thumbnailUrl,
    creditsUsed: generation.creditsUsed,
    errorMessage: generation.errorMessage,
    createdAt: generation.createdAt,
    updatedAt: generation.updatedAt,
    completedAt: generation.completedAt,
  };
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    // ------------------------------------------------------------
    // 1. Authenticate
    // ------------------------------------------------------------

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Video generation ID is required.",
        },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------
    // 2. Load generation and enforce ownership
    // ------------------------------------------------------------

    let generation = await prisma.videoGeneration.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!generation) {
      return NextResponse.json(
        {
          success: false,
          error: "Video generation not found.",
        },
        { status: 404 },
      );
    }

    // ------------------------------------------------------------
    // 3. Already completed
    // ------------------------------------------------------------

    if (generation.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        generation: serializeGeneration(generation),
      });
    }

    // ------------------------------------------------------------
    // 4. Cancelled generation
    // ------------------------------------------------------------

    if (generation.status === "CANCELLED") {
      if (
        generation.creditsUsed > 0 &&
        !generation.creditRefundedAt
      ) {
        await refundVideoCreditsAtomic({
          userId: session.user.id,
          generationId: generation.id,
        });

        generation = await prisma.videoGeneration.findFirstOrThrow({
          where: {
            id: generation.id,
            userId: session.user.id,
          },
        });
      }

      return NextResponse.json({
        success: true,
        generation: serializeGeneration(generation),
      });
    }

    // ------------------------------------------------------------
    // 5. Failed generation
    //
    // Reconcile any outstanding credit refund.
    // ------------------------------------------------------------

    if (generation.status === "FAILED") {
      if (
        generation.creditsUsed > 0 &&
        !generation.creditRefundedAt
      ) {
        await refundVideoCreditsAtomic({
          userId: session.user.id,
          generationId: generation.id,
        });

        generation = await prisma.videoGeneration.findFirstOrThrow({
          where: {
            id: generation.id,
            userId: session.user.id,
          },
        });
      }

      return NextResponse.json({
        success: true,
        generation: serializeGeneration(generation),
      });
    }

    // ------------------------------------------------------------
    // 6. Provider task must exist
    // ------------------------------------------------------------

    if (!generation.providerTaskId) {
      return NextResponse.json(
        {
          success: false,
          error: "Video provider task is missing.",
        },
        { status: 500 },
      );
    }

    // ------------------------------------------------------------
    // 7. Verify provider
    //
    // Justdy now uses Runway for AI video generation.
    // ------------------------------------------------------------

    if (generation.provider !== "runway") {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported video provider.",
        },
        { status: 500 },
      );
    }

    // ------------------------------------------------------------
    // 8. Ask Runway for current task state
    // ------------------------------------------------------------

    const providerStatus = await getVideoJobStatus(
      generation.providerTaskId,
    );

    // ------------------------------------------------------------
    // 9. Provider completed
    // ------------------------------------------------------------

    if (providerStatus.status === "COMPLETED") {
      await prisma.videoGeneration.updateMany({
        where: {
          id: generation.id,
          userId: session.user.id,
          status: {
            in: ["PENDING", "PROCESSING"],
          },
        },
        data: {
          status: "COMPLETED",
          videoUrl: `/api/ai/video/${generation.id}/content`,
          errorMessage: null,
          completedAt: new Date(),
        },
      });

      /*
       * Re-read after the conditional update so the response
       * reflects the authoritative database state.
       */
      generation = await prisma.videoGeneration.findFirstOrThrow({
        where: {
          id: generation.id,
          userId: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        generation: serializeGeneration(generation),
      });
    }

    // ------------------------------------------------------------
    // 10. Provider failed
    //
    // Refund first. The refund operation is designed to be
    // idempotent so a subsequent poll can safely reconcile state.
    // ------------------------------------------------------------

    if (providerStatus.status === "FAILED") {
      if (
        generation.creditsUsed > 0 &&
        !generation.creditRefundedAt
      ) {
        await refundVideoCreditsAtomic({
          userId: session.user.id,
          generationId: generation.id,
        });
      }

      await prisma.videoGeneration.updateMany({
        where: {
          id: generation.id,
          userId: session.user.id,
          status: {
            in: ["PENDING", "PROCESSING"],
          },
        },
        data: {
          status: "FAILED",
          errorMessage:
            providerStatus.error ??
            "Runway video generation failed.",
        },
      });

      generation = await prisma.videoGeneration.findFirstOrThrow({
        where: {
          id: generation.id,
          userId: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        generation: serializeGeneration(generation),
      });
    }

    // ------------------------------------------------------------
    // 11. Provider still processing
    //
    // Keep the local generation in PROCESSING.
    // ------------------------------------------------------------

    if (generation.status === "PENDING") {
      await prisma.videoGeneration.updateMany({
        where: {
          id: generation.id,
          userId: session.user.id,
          status: "PENDING",
        },
        data: {
          status: "PROCESSING",
        },
      });

      generation = await prisma.videoGeneration.findFirstOrThrow({
        where: {
          id: generation.id,
          userId: session.user.id,
        },
      });
    }

    // ------------------------------------------------------------
    // 12. Return current state
    // ------------------------------------------------------------

    return NextResponse.json({
      success: true,
      generation: serializeGeneration(generation),
    });
  } catch (error) {
    console.error(
      "[GET /api/ai/video/:id] Failed to retrieve video generation:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to retrieve video generation.",
      },
      { status: 500 },
    );
  }
}