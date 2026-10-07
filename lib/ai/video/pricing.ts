import type { VideoDuration, VideoModel } from "./types";

/**
 * Runway Gen-4.5 is billed at 12 credits per generated second.
 * The two Justdy model names are retained for application compatibility.
 */
const VIDEO_CREDIT_COSTS: Record<VideoModel, Record<VideoDuration, number>> = {
  "sora-2": {
    2: 24,
    4: 48,
    5: 60,
    6: 72,
    8: 96,
    10: 120,
  },
  "sora-2-pro": {
    2: 24,
    4: 48,
    5: 60,
    6: 72,
    8: 96,
    10: 120,
  },
};

export function getVideoCreditCost(
  duration: VideoDuration,
  model: VideoModel = "sora-2",
): number {
  return VIDEO_CREDIT_COSTS[model][duration];
}
