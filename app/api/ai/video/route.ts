import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

import {
  generateVideo,
  InsufficientVideoCreditsError,
  type VideoAspectRatio,
  type VideoDuration,
  type VideoModel,
} from "@/lib/ai/video";
import { AIVideoError } from "@/lib/ai/video/errors";
import {
  VALID_VIDEO_ASPECT_RATIOS,
  VALID_VIDEO_DURATIONS,
  VALID_VIDEO_MODELS,
} from "@/lib/ai/video/validation";

type CreateVideoBody = {
  prompt?: unknown;
  duration?: unknown;
  aspectRatio?: unknown;
  model?: unknown;
};

function isValidDuration(value: unknown): value is VideoDuration {
  return (
    typeof value === "number" &&
    VALID_VIDEO_DURATIONS.includes(value as VideoDuration)
  );
}

function isValidAspectRatio(value: unknown): value is VideoAspectRatio {
  return (
    typeof value === "string" &&
    VALID_VIDEO_ASPECT_RATIOS.includes(value as VideoAspectRatio)
  );
}

function isValidModel(value: unknown): value is VideoModel {
  return (
    typeof value === "string" &&
    VALID_VIDEO_MODELS.includes(value as VideoModel)
  );
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as CreateVideoBody;
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "A video prompt is required." },
        { status: 400 },
      );
    }

    if (prompt.length > 4000) {
      return NextResponse.json(
        {
          success: false,
          error: "Video prompts cannot exceed 4000 characters.",
        },
        { status: 400 },
      );
    }

    if (!isValidDuration(body.duration)) {
      return NextResponse.json(
        {
          success: false,
          error: "Video duration must be 2, 4, 5, 6, 8, or 10 seconds.",
        },
        { status: 400 },
      );
    }

    if (!isValidAspectRatio(body.aspectRatio)) {
      return NextResponse.json(
        {
          success: false,
          error: "Video aspect ratio must be 16:9 or 9:16.",
        },
        { status: 400 },
      );
    }

    const model = body.model ?? "sora-2";

    if (!isValidModel(model)) {
      return NextResponse.json(
        { success: false, error: "Unsupported video model." },
        { status: 400 },
      );
    }

    const result = await generateVideo({
      userId,
      prompt,
      duration: body.duration,
      aspectRatio: body.aspectRatio,
      model,
    });

    return NextResponse.json(
      {
        success: true,
        generation: {
          id: result.generation.id,
          status: result.generation.status,
          provider: result.generation.provider,
          model: result.generation.model,
          providerTaskId: result.generation.providerTaskId,
          prompt: result.generation.prompt,
          duration: result.generation.duration,
          aspectRatio: result.generation.aspectRatio,
          creditsUsed: result.creditsUsed,
          createdAt: result.generation.createdAt,
        },
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("[POST /api/ai/video]", error);

    if (error instanceof InsufficientVideoCreditsError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: "INSUFFICIENT_CREDITS",
          required: error.required,
          available: error.available,
        },
        { status: 402 },
      );
    }

    if (error instanceof AIVideoError) {
      const status =
        error.code === "INVALID_REQUEST" || error.code === "UNSUPPORTED"
          ? 400
          : 500;

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to start video generation.",
      },
      { status: 500 },
    );
  }
}
