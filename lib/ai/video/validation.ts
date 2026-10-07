import type {
  CreateVideoInput,
  VideoDuration,
  VideoAspectRatio,
  VideoModel,
} from "./types";
import { AIVideoError } from "./errors";

export const VALID_VIDEO_DURATIONS = [2, 4, 5, 6, 8, 10] as const;
export const VALID_VIDEO_ASPECT_RATIOS = ["16:9", "9:16"] as const;
export const VALID_VIDEO_MODELS = ["sora-2", "sora-2-pro"] as const;

export function validateVideoRequest(
  input: CreateVideoInput,
): CreateVideoInput {
  const prompt = input.prompt?.trim();

  if (!prompt) {
    throw new AIVideoError("A video prompt is required.", "INVALID_REQUEST");
  }

  if (prompt.length > 4000) {
    throw new AIVideoError(
      "Video prompts cannot exceed 4000 characters.",
      "INVALID_REQUEST",
    );
  }

  if (!VALID_VIDEO_DURATIONS.includes(input.duration as VideoDuration)) {
    throw new AIVideoError(
      "Video duration must be 2, 4, 5, 6, 8, or 10 seconds.",
      "INVALID_REQUEST",
    );
  }

  if (!VALID_VIDEO_ASPECT_RATIOS.includes(input.aspectRatio as VideoAspectRatio)) {
    throw new AIVideoError(
      "Video aspect ratio must be 16:9 or 9:16.",
      "INVALID_REQUEST",
    );
  }

  const model = input.model ?? "sora-2";

  if (!VALID_VIDEO_MODELS.includes(model as VideoModel)) {
    throw new AIVideoError("Unsupported video model.", "INVALID_REQUEST");
  }

  return {
    ...input,
    prompt,
    model,
  };
}
