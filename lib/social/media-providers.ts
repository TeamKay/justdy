
import { getYouTubeVideo } from "@/lib/social/youtube";

export type SocialMediaProvider =
  | {
      provider: "youtube";
      videoId: string;
      isShort: boolean;
    }
  | {
      provider: "tiktok";
      videoId: string;
    }
  | {
      provider: "facebook";
      url: string;
    };

function parseUrl(value: string): URL | null {
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

function isTikTokHost(hostname: string): boolean {
  return (
    hostname === "tiktok.com" ||
    hostname.endsWith(".tiktok.com")
  );
}

function isFacebookHost(hostname: string): boolean {
  return (
    hostname === "facebook.com" ||
    hostname.endsWith(".facebook.com") ||
    hostname === "fb.watch"
  );
}

export function getSocialMediaProvider(
  value: string,
): SocialMediaProvider | null {
  const youtube = getYouTubeVideo(value);

  if (youtube) {
    return {
      provider: "youtube",
      videoId: youtube.videoId,
      isShort: youtube.isShort,
    };
  }

  const url = parseUrl(value);

  if (!url) return null;

  const hostname = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (isTikTokHost(hostname)) {
    // Standard TikTok video URLs:
    // tiktok.com/@username/video/123456789
    // tiktok.com/player/v1/123456789
    // tiktok.com/embed/v2/123456789
    const videoIndex = segments.findIndex(
      (segment) => segment === "video",
    );

    const playerIndex = segments.findIndex(
      (segment) => segment === "player" || segment === "embed",
    );

    const videoId =
      (videoIndex >= 0 ? segments[videoIndex + 1] : null) ??
      (playerIndex >= 0
        ? segments[playerIndex + 2]
        : null);

    if (videoId && /^\d+$/.test(videoId)) {
      return {
        provider: "tiktok",
        videoId,
      };
    }

    return null;
  }

  if (isFacebookHost(hostname)) {
    const isVideoPath =
      segments.includes("videos") ||
      segments[0] === "reel" ||
      segments[0] === "share" &&
        segments[1] === "v" ||
      url.pathname === "/watch" ||
      url.pathname === "/video.php";

    const hasVideoId =
      Boolean(url.searchParams.get("v")) ||
      segments.some((segment, index) => {
        if (segment === "videos" || segment === "reel") {
          return Boolean(segments[index + 1]);
        }

        return false;
      });

    const isShortFacebookLink = hostname === "fb.watch";

    if (
      isVideoPath && (hasVideoId || segments[0] === "share") ||
      isShortFacebookLink
    ) {
      return {
        provider: "facebook",
        url: url.href,
      };
    }
  }

  return null;
}
