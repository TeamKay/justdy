export type VideoModel = "sora-2" | "sora-2-pro";

/**
 * Runway Gen-4.5 supports 2–10 second generations.
 * Keep the UI/API options explicit so billing and provider requests stay in sync.
 */
export type VideoDuration = 2 | 4 | 5 | 6 | 8 | 10;

export type VideoAspectRatio = "16:9" | "9:16";

export type VideoResolution = "1280x720" | "720x1280";

export type VideoJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface CreateVideoInput {
  prompt: string;
  duration: VideoDuration;
  aspectRatio: VideoAspectRatio;
  model?: VideoModel;
  requestId?: string;
}

export interface VideoProviderJob {
  provider: "runway";
  providerTaskId: string;
  model: VideoModel;
  status: VideoJobStatus;
  duration: VideoDuration;
  resolution: VideoResolution;
}

export interface VideoProviderStatus {
  provider: "runway";
  providerTaskId: string;
  model: VideoModel;
  status: VideoJobStatus;
  videoUrl?: string;
  error?: string;
}
