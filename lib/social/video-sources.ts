
import { getYouTubeVideo } from "@/lib/social/youtube";

export type SocialVideoProvider =
  | "YOUTUBE"
  | "TIKTOK"
  | "FACEBOOK"
  | "DIRECT";

export type SocialVideoSource = {
  provider: SocialVideoProvider;
  originalUrl: string;
  embedUrl: string;
  videoId?: string;
  aspectRatio: "vertical" | "landscape";
};

function normalizeVideoUrl(value: string): URL | null {
  const candidate = value.trim().replace(/[.,!?;:)\]}]+$/, "");

  if (!candidate) return null;

  try {
    const url = new URL(
      /^https?:\/\//i.test(candidate)
        ? candidate
        : `https://${candidate}`,
    );

    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function isHost(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function getSocialVideoSource(
  value: string,
): SocialVideoSource | null {
  const url = normalizeVideoUrl(value);

  if (!url) return null;

  const originalUrl = url.href;
  const hostname = url.hostname.toLowerCase();

  // YouTube videos and Shorts
  const youtube = getYouTubeVideo(originalUrl);

  if (youtube) {
    return {
      provider: "YOUTUBE",
      originalUrl,
      videoId: youtube.videoId,
      embedUrl:
        `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube.videoId)}`,
      aspectRatio: youtube.isShort ? "vertical" : "landscape",
    };
  }

  // TikTok videos
  if (isHost(hostname, "tiktok.com")) {
    const match = url.pathname.match(
      /\/@[^/]+\/video\/(\d+)/i,
    );

    if (match?.[1]) {
      return {
        provider: "TIKTOK",
        originalUrl,
        videoId: match[1],
        embedUrl:
          `https://www.tiktok.com/player/v1/${encodeURIComponent(match[1])}`,
        aspectRatio: "vertical",
      };
    }
  }

  // Facebook videos and Reels
  if (
    isHost(hostname, "facebook.com") ||
    isHost(hostname, "fb.watch")
  ) {
    const isFacebookVideo =
  /\/(reel|reels|videos)\//i.test(url.pathname) ||
  /^\/watch\/?$/i.test(url.pathname) ||
  isHost(hostname, "fb.watch");
    if (isFacebookVideo) {
      const embedUrl = new URL(
        "https://www.facebook.com/plugins/video.php",
      );

      embedUrl.searchParams.set("href", originalUrl);
      embedUrl.searchParams.set("show_text", "false");
      embedUrl.searchParams.set("autoplay", "true");

      return {
        provider: "FACEBOOK",
        originalUrl,
        embedUrl: embedUrl.href,
        aspectRatio: /\/(reel|reels)\//i.test(url.pathname)
          ? "vertical"
          : "landscape",
      };
    }
  }

  // Directly hosted MP4, WebM and Ogg videos
  if (/\.(mp4|webm|ogg|ogv)$/i.test(url.pathname)) {
    return {
      provider: "DIRECT",
      originalUrl,
      embedUrl: originalUrl,
      aspectRatio: "vertical",
    };
  }

  return null;
}

export function containsSocialVideo(
  urls: string[],
): boolean {
  return urls.some((url) => getSocialVideoSource(url) !== null);
}
