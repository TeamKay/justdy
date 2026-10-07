import "server-only";

import { AIVideoError } from "./errors";
import type {
  CreateVideoInput,
  VideoProviderJob,
  VideoProviderStatus,
  VideoResolution,
} from "./types";

const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_API_VERSION = "2024-11-06";
const RUNWAY_MODEL = "gen4.5" as const;

type RunwayTaskStatus =
  | "PENDING"
  | "THROTTLED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

type RunwayTask = {
  id: string;
  status: RunwayTaskStatus | string;
  output?: unknown;
  failure?: unknown;
  failureCode?: unknown;
};

type RunwayErrorPayload = {
  error?: unknown;
  message?: unknown;
  issues?: unknown;
  docUrl?: unknown;
};

type RunwayCreateResponse = {
  id?: unknown;
};

function getRunwayApiKey(): string {
  const apiKey = process.env.RUNWAYML_API_SECRET?.trim();

  if (!apiKey) {
    throw new AIVideoError(
      "Runway video generation is not configured. Add RUNWAYML_API_SECRET to the server environment.",
      "INVALID_REQUEST",
    );
  }

  return apiKey;
}

function getResolution(
  aspectRatio: CreateVideoInput["aspectRatio"],
): VideoResolution {
  return aspectRatio === "9:16" ? "720x1280" : "1280x720";
}

function getRunwayRatio(
  aspectRatio: CreateVideoInput["aspectRatio"],
): "1280:720" | "720:1280" {
  return aspectRatio === "9:16" ? "720:1280" : "1280:720";
}

/**
 * Runway Gen-4.5 supports the same duration values exposed by Justdy:
 *
 * 2, 4, 5, 6, 8, 10 seconds.
 *
 * No duration conversion is necessary.
 */
function getRunwayDuration(
  duration: CreateVideoInput["duration"],
): 2 | 4 | 5 | 6 | 8 | 10 {
  return duration;
}

function normalizeStatus(
  status: string,
): VideoProviderStatus["status"] {
  switch (status) {
    case "PENDING":
    case "THROTTLED":
      return "PENDING";

    case "RUNNING":
      return "PROCESSING";

    case "SUCCEEDED":
      return "COMPLETED";

    case "FAILED":
      return "FAILED";

    case "CANCELLED":
      return "CANCELLED";

    default:
      return "PROCESSING";
  }
}

function extractErrorMessage(
  payload: RunwayErrorPayload | null,
): string {
  if (!payload) {
    return "Runway returned an empty error response.";
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if (Array.isArray(payload.issues) && payload.issues.length > 0) {
    return JSON.stringify(payload.issues);
  }

  return "Runway rejected the request.";
}

function extractTaskOutput(task: RunwayTask): string | undefined {
  if (!Array.isArray(task.output)) {
    return undefined;
  }

  const firstOutput = task.output[0];

  return typeof firstOutput === "string"
    ? firstOutput
    : undefined;
}

function extractTaskError(task: RunwayTask): string | undefined {
  if (
    typeof task.failure === "string" &&
    task.failure.trim()
  ) {
    return task.failure.trim();
  }

  if (
    typeof task.failureCode === "string" &&
    task.failureCode.trim()
  ) {
    return task.failureCode.trim();
  }

  return undefined;
}

function runwayHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-Runway-Version": RUNWAY_API_VERSION,
  };
}

/**
 * Create a Runway Gen-4.5 TEXT-TO-VIDEO task.
 *
 * IMPORTANT:
 * This intentionally uses:
 *
 *   POST /v1/text_to_video
 *
 * and NOT:
 *
 *   POST /v1/image_to_video
 *
 * because Justdy Video Studio currently generates videos from
 * text prompts without an input image.
 */
export async function createVideoJob(
  input: CreateVideoInput,
): Promise<VideoProviderJob> {
  const apiKey = getRunwayApiKey();

  const prompt = input.prompt.trim();

  if (!prompt) {
    throw new AIVideoError(
      "A video prompt is required.",
      "INVALID_REQUEST",
    );
  }

  if (prompt.length > 1000) {
    throw new AIVideoError(
      "The video prompt must be 1,000 characters or fewer.",
      "INVALID_REQUEST",
    );
  }

  const duration = getRunwayDuration(input.duration);
  const ratio = getRunwayRatio(input.aspectRatio);

  const requestBody = {
    model: RUNWAY_MODEL,
    promptText: prompt,
    ratio,
    duration,
  };

  try {
    console.info("[AI Video] Starting Runway Gen-4.5 text-to-video:", {
      model: RUNWAY_MODEL,
      duration,
      ratio,
      promptLength: prompt.length,
    });

    const response = await fetch(
      `${RUNWAY_API_BASE}/text_to_video`,
      {
        method: "POST",
        headers: runwayHeaders(apiKey),
        body: JSON.stringify(requestBody),
        cache: "no-store",
      },
    );

    const payload =
      (await response.json().catch(() => null)) as
        | RunwayCreateResponse
        | RunwayErrorPayload
        | null;

    if (!response.ok) {
      const errorPayload = payload as RunwayErrorPayload | null;

      const providerMessage =
        extractErrorMessage(errorPayload);

      console.error(
        "[AI Video] Runway text-to-video request failed:",
        {
          status: response.status,
          statusText: response.statusText,
          message: providerMessage,
          payload,
          request: {
            model: RUNWAY_MODEL,
            ratio,
            duration,
            promptLength: prompt.length,
          },
        },
      );

      if (response.status === 400) {
        throw new AIVideoError(
          `Runway rejected the video request: ${providerMessage}`,
          "INVALID_REQUEST",
        );
      }

      if (response.status === 401) {
        throw new AIVideoError(
          "Runway authentication failed. Check RUNWAYML_API_SECRET.",
          "INVALID_REQUEST",
        );
      }

      if (response.status === 403) {
        throw new AIVideoError(
          `Runway denied this request: ${providerMessage}`,
          "INVALID_REQUEST",
        );
      }

      if (response.status === 404) {
        throw new AIVideoError(
          `Runway text-to-video endpoint was not found: ${providerMessage}`,
          "PROVIDER_ERROR",
        );
      }

      if (response.status === 429) {
        throw new AIVideoError(
          "Runway rate limit reached. Please try again shortly.",
          "PROVIDER_ERROR",
        );
      }

      throw new AIVideoError(
        `Runway video generation failed (${response.status}): ${providerMessage}`,
        "PROVIDER_ERROR",
      );
    }

    const providerTaskId =
      payload &&
      typeof payload === "object" &&
      "id" in payload &&
      typeof payload.id === "string"
        ? payload.id.trim()
        : "";

    if (!providerTaskId) {
      console.error(
        "[AI Video] Runway returned no task ID:",
        payload,
      );

      throw new AIVideoError(
        "Runway accepted the request but did not return a video task ID.",
        "PROVIDER_ERROR",
      );
    }

    console.info(
      "[AI Video] Runway video task created:",
      providerTaskId,
    );

    return {
      provider: "runway",
      providerTaskId,
      model: input.model ?? "sora-2",
      status: "PENDING",
      duration: input.duration,
      resolution: getResolution(input.aspectRatio),
    };
  } catch (error) {
    console.error(
      "[AI Video] Runway video creation failed:",
      error,
    );

    if (error instanceof AIVideoError) {
      throw error;
    }

    throw new AIVideoError(
      error instanceof Error
        ? `Unable to start video generation: ${error.message}`
        : "Unable to start video generation.",
      "PROVIDER_ERROR",
    );
  }
}

/**
 * Retrieve the current status of a Runway task.
 */
export async function getVideoJobStatus(
  providerTaskId: string,
): Promise<VideoProviderStatus> {
  const apiKey = getRunwayApiKey();

  const taskId = providerTaskId.trim();

  if (!taskId) {
    throw new AIVideoError(
      "Video provider task ID is required.",
      "INVALID_REQUEST",
    );
  }

  try {
    const response = await fetch(
      `${RUNWAY_API_BASE}/tasks/${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Runway-Version": RUNWAY_API_VERSION,
        },
        cache: "no-store",
      },
    );

    const payload =
      (await response.json().catch(() => null)) as
        | RunwayTask
        | RunwayErrorPayload
        | null;

    if (!response.ok) {
      const providerMessage =
        extractErrorMessage(
          payload as RunwayErrorPayload | null,
        );

      console.error(
        "[AI Video] Runway task status request failed:",
        {
          status: response.status,
          statusText: response.statusText,
          taskId,
          message: providerMessage,
          payload,
        },
      );

      if (response.status === 401) {
        throw new AIVideoError(
          "Runway authentication failed while checking the video.",
          "INVALID_REQUEST",
        );
      }

      if (response.status === 404) {
        throw new AIVideoError(
          "Runway could not find the video generation task.",
          "PROVIDER_ERROR",
        );
      }

      throw new AIVideoError(
        `Unable to retrieve Runway video status: ${providerMessage}`,
        "PROVIDER_ERROR",
      );
    }

    const task = payload as RunwayTask;

    const status = normalizeStatus(task.status);
    const videoUrl = extractTaskOutput(task);

    return {
      provider: "runway",
      providerTaskId:
        typeof task.id === "string"
          ? task.id
          : taskId,
      model: "sora-2",
      status,
      videoUrl,
      error:
        status === "FAILED"
          ? extractTaskError(task) ??
            "Runway video generation failed."
          : undefined,
    };
  } catch (error) {
    console.error(
      "[AI Video] Runway video status retrieval failed:",
      error,
    );

    if (error instanceof AIVideoError) {
      throw error;
    }

    throw new AIVideoError(
      error instanceof Error
        ? `Unable to retrieve video generation status: ${error.message}`
        : "Unable to retrieve video generation status.",
      "PROVIDER_ERROR",
    );
  }
}

/**
 * Download the completed Runway video.
 *
 * Runway's output URL is temporary, so Justdy downloads the
 * generated video instead of storing the Runway CDN URL as
 * permanent application storage.
 */
export async function downloadVideoContent(
  providerTaskId: string,
): Promise<Response> {
  const apiKey = getRunwayApiKey();

  const taskId = providerTaskId.trim();

  if (!taskId) {
    throw new AIVideoError(
      "Video provider task ID is required.",
      "INVALID_REQUEST",
    );
  }

  try {
    const response = await fetch(
      `${RUNWAY_API_BASE}/tasks/${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Runway-Version": RUNWAY_API_VERSION,
        },
        cache: "no-store",
      },
    );

    const payload =
      (await response.json().catch(() => null)) as
        | RunwayTask
        | RunwayErrorPayload
        | null;

    if (!response.ok) {
      const providerMessage =
        extractErrorMessage(
          payload as RunwayErrorPayload | null,
        );

      console.error(
        "[AI Video] Runway task retrieval for download failed:",
        {
          status: response.status,
          taskId,
          message: providerMessage,
        },
      );

      throw new AIVideoError(
        `Unable to retrieve the generated video: ${providerMessage}`,
        "PROVIDER_ERROR",
      );
    }

    const task = payload as RunwayTask;

    if (task.status !== "SUCCEEDED") {
      if (task.status === "FAILED") {
        throw new AIVideoError(
          extractTaskError(task) ??
            "Runway video generation failed.",
          "PROVIDER_ERROR",
        );
      }

      throw new AIVideoError(
        "The generated video is not ready yet.",
        "PROVIDER_ERROR",
      );
    }

    const output = extractTaskOutput(task);

    if (!output) {
      console.error(
        "[AI Video] Runway completed the task without an output URL:",
        task,
      );

      throw new AIVideoError(
        "Runway completed the task but did not return a video URL.",
        "PROVIDER_ERROR",
      );
    }

    const videoResponse = await fetch(output, {
      method: "GET",
      cache: "no-store",
    });

    if (!videoResponse.ok || !videoResponse.body) {
      console.error(
        "[AI Video] Runway video download returned:",
        {
          status: videoResponse.status,
          statusText: videoResponse.statusText,
          taskId,
        },
      );

      throw new AIVideoError(
        "Unable to download the generated video from Runway.",
        "PROVIDER_ERROR",
      );
    }

    return videoResponse;
  } catch (error) {
    console.error(
      "[AI Video] Runway video download failed:",
      error,
    );

    if (error instanceof AIVideoError) {
      throw error;
    }

    throw new AIVideoError(
      error instanceof Error
        ? `Unable to download generated video: ${error.message}`
        : "Unable to download generated video.",
      "PROVIDER_ERROR",
    );
  }
}