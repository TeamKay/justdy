import "server-only";

import prisma from "@/lib/prisma";

import { buildProjectAwarePrompt } from "@/lib/ai/project-context";
import { getOwnedProjectContext } from "@/lib/ai/project-context-server";

import { AIVideoError } from "./errors";
import {
  InsufficientVideoCreditsError,
  consumeVideoCreditsAtomic,
  refundVideoCreditsAtomic,
} from "./credits";
import { createVideoJob } from "./provider";
import { getVideoCreditCost } from "./pricing";
import { validateVideoRequest } from "./validation";

import type { CreateVideoInput } from "./types";

export interface GenerateVideoOptions extends CreateVideoInput {
  userId: string;
  title?: string;
  style?: string;
  projectId?: string | null;
}

export async function generateVideo(options: GenerateVideoOptions) {
  const input = validateVideoRequest({
    prompt: options.prompt,
    duration: options.duration,
    aspectRatio: options.aspectRatio,
    model: options.model,
  });

  const model = input.model ?? "sora-2";

  const project = await getOwnedProjectContext(
    options.userId,
    options.projectId,
  );

  const generationPrompt = project
    ? buildProjectAwarePrompt({
        project,
        prompt: input.prompt,
      })
    : input.prompt;

  const projectContextIncluded = project !== null;
  const creditCost = getVideoCreditCost(input.duration, model);
  const requestId = options.requestId?.trim() || null;

  if (requestId) {
    const existing = await prisma.videoGeneration.findUnique({
      where: { requestId },
    });

    if (existing) {
      if (existing.userId !== options.userId) {
        throw new AIVideoError(
          "The request ID is already in use.",
          "INVALID_REQUEST",
        );
      }

      return {
        success: true as const,
        generation: existing,
        creditsUsed: existing.creditsUsed,
      };
    }
  }

  const generation = await prisma.videoGeneration.create({
    data: {
      userId: options.userId,
      prompt: input.prompt,
      duration: input.duration,
      aspectRatio: input.aspectRatio,
      provider: "runway",
      model,
      providerTaskId: null,
      status: "PENDING",
      creditsUsed: 0,
      requestId,
      title: options.title?.trim() || null,
      style: options.style?.trim() || null,
    },
  });

  try {
    await consumeVideoCreditsAtomic({
      userId: options.userId,
      generationId: generation.id,
      duration: input.duration,
      model,
    });

    const providerJob = await createVideoJob({
      prompt: generationPrompt,
      duration: input.duration,
      aspectRatio: input.aspectRatio,
      model,
    });

    if (providerJob.status === "FAILED" || providerJob.status === "CANCELLED") {
      const errorMessage =
        providerJob.status === "FAILED"
          ? "Video generation failed at the video provider."
          : "Video generation was cancelled by the video provider.";

      await prisma.videoGeneration.update({
        where: { id: generation.id },
        data: {
          provider: providerJob.provider,
          model: providerJob.model,
          providerTaskId: providerJob.providerTaskId,
          status: providerJob.status,
          errorMessage,
        },
      });

      await refundVideoCreditsAtomic({
        userId: options.userId,
        generationId: generation.id,
      });

      throw new AIVideoError(errorMessage, "PROVIDER_ERROR");
    }

    const updatedGeneration = await prisma.videoGeneration.update({
      where: { id: generation.id },
      data: {
        provider: providerJob.provider,
        model: providerJob.model,
        providerTaskId: providerJob.providerTaskId,
        status: providerJob.status === "PENDING" ? "PENDING" : "PROCESSING",
        errorMessage: null,
      },
    });

    return {
      success: true as const,
      generation: updatedGeneration,
      creditsUsed: creditCost,
      projectContextIncluded,
      projectId: project?.id ?? null,
    };
  } catch (error) {
    console.error("[AI Video] Generation failed:", error);

    if (error instanceof InsufficientVideoCreditsError) {
      throw error;
    }

    try {
      await refundVideoCreditsAtomic({
        userId: options.userId,
        generationId: generation.id,
      });
    } catch (refundError) {
      console.error(
        "[AI Video] CRITICAL: video credit refund failed:",
        refundError,
      );
    }

    if (error instanceof AIVideoError) {
      throw error;
    }

    throw new AIVideoError(
      "Unable to start video generation.",
      "PROVIDER_ERROR",
    );
  }
}
