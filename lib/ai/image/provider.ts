import "server-only";

import OpenAI from "openai";

import { getRequiredOpenAIAPIKey } from "@/lib/ai/config";
import { AIImageError } from "./errors";
import type { CreateImageInput, ImageProviderResult } from "./types";

const openai = new OpenAI({
  apiKey: getRequiredOpenAIAPIKey(),
});

type OpenAIErrorShape = {
  message?: unknown;
  code?: unknown;
  type?: unknown;
  param?: unknown;
  request_id?: unknown;
  requestId?: unknown;
  status?: unknown;
  error?: {
    message?: unknown;
    code?: unknown;
    type?: unknown;
    param?: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

/**
 * Extract the OpenAI request ID when the SDK exposes it.
 *
 * Different OpenAI SDK/API error shapes can expose this under
 * slightly different properties, so we intentionally support
 * the common variants without depending on a single SDK shape.
 */
function getOpenAIRequestId(error: unknown): string | undefined {
  if (!isRecord(error)) {
    return undefined;
  }

  const directRequestId =
    getString(error.request_id) ??
    getString(error.requestId);

  if (directRequestId) {
    return directRequestId;
  }

  const headers = error.headers;

  if (isRecord(headers)) {
    return (
      getString(headers["x-request-id"]) ??
      getString(headers["X-Request-Id"]) ??
      getString(headers["x-request-id".toLowerCase()])
    );
  }

  return undefined;
}

/**
 * Safely extract the provider's error payload.
 */
function getOpenAIErrorDetails(error: unknown): OpenAIErrorShape {
  if (!isRecord(error)) {
    return {};
  }

  const nested = isRecord(error.error) ? error.error : undefined;

  return {
    message:
      getString(error.message) ??
      getString(nested?.message),

    code:
      getString(error.code) ??
      getString(nested?.code),

    type:
      getString(error.type) ??
      getString(nested?.type),

    param:
      getString(error.param) ??
      getString(nested?.param),

    request_id:
      getString(error.request_id) ??
      getString(error.requestId),

    requestId:
      getString(error.requestId),

    status: error.status,

    error: nested
      ? {
          message: getString(nested.message),
          code: getString(nested.code),
          type: getString(nested.type),
          param: getString(nested.param),
        }
      : undefined,
  };
}

/**
 * OpenAI can reject an image request through its safety system.
 *
 * We deliberately detect only provider signals that indicate a
 * safety/content rejection. We do not attempt to bypass, rewrite,
 * or weaken the provider's safety controls.
 */
function isSafetyRejection(error: unknown): boolean {
  const details = getOpenAIErrorDetails(error);

  const values = [
    details.message,
    details.code,
    details.type,
    details.error?.message,
    details.error?.code,
    details.error?.type,
  ]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());

  const combined = values.join(" ");

  if (!combined) {
    return false;
  }

  const explicitSafetySignals = [
    "safety system",
    "safety policy",
    "safety policies",
    "safety check",
    "safety filter",
    "safety filters",
    "content policy",
    "content policy violation",
    "content_policy",
    "policy violation",
    "policy_violation",
    "blocked by safety",
    "blocked by the safety",
    "prompt was rejected",
    "prompt rejected",
    "request was rejected by the safety",
    "request rejected by the safety",
  ];

  if (
    explicitSafetySignals.some((signal) =>
      combined.includes(signal),
    )
  ) {
    return true;
  }

  const codeSignals = [
    "safety",
    "content_policy",
    "content-policy",
    "policy_violation",
    "policy-violation",
  ];

  return codeSignals.some((signal) => {
    return values.some((value) => value === signal);
  });
}

function getProviderErrorMessage(error: unknown): string {
  const details = getOpenAIErrorDetails(error);

  const message =
    getString(details.message) ??
    getString(details.error?.message);

  return message ?? "Image generation failed.";
}

export async function generateImageWithOpenAI(
  input: CreateImageInput,
): Promise<ImageProviderResult> {
  try {
    const result = await openai.images.generate({
      model: input.model ?? "gpt-image-2",
      prompt: input.prompt,
      size: input.size ?? "1024x1024",
      quality: input.quality ?? "auto",
      output_format: input.outputFormat ?? "png",
      background: input.background ?? "auto",
      n: 1,
    });

    const image = result.data?.[0];

    if (!image?.b64_json) {
      throw new AIImageError(
        "OpenAI did not return image data.",
        "PROVIDER_EMPTY_RESPONSE",
      );
    }

    return {
      base64: image.b64_json,
      mimeType:
        input.outputFormat === "jpeg"
          ? "image/jpeg"
          : "image/png",
    };
  } catch (error) {
    if (error instanceof AIImageError) {
      throw error;
    }

    const requestId = getOpenAIRequestId(error);
    const providerMessage = getProviderErrorMessage(error);

    if (isSafetyRejection(error)) {
      console.warn("OpenAI image request rejected by safety system.", {
        requestId,
        code: "IMAGE_SAFETY_REJECTED",
      });

      throw new AIImageError(
        "This image request was rejected by the image provider's safety system. Please try a different description.",
        "IMAGE_SAFETY_REJECTED",
        requestId,
      );
    }

    console.error("OpenAI image generation failed.", {
      requestId,
      message: providerMessage,
    });

    throw new AIImageError(
      providerMessage,
      "PROVIDER_ERROR",
      requestId,
    );
  }
}