
export type YouTubeVideo = {
  videoId: string;
  isShort: boolean;
};

/**
 * Extracts a YouTube video ID from supported YouTube URLs.
 * Supports:
 * - youtube.com/watch?v=...
 * - youtu.be/...
 * - youtube.com/shorts/...
 * - youtube.com/embed/...
 * - youtube.com/live/...
 */
export function getYouTubeVideo(
  value: string,
): YouTubeVideo | null {
  const candidate = value.trim().replace(/[.,!?;:)\]}]+$/, "");

  if (!candidate) return null;

  try {
    const url = new URL(
      /^https?:\/\//i.test(candidate)
        ? candidate
        : `https://${candidate}`,
    );

    const hostname = url.hostname.toLowerCase();

    const isYouTube =
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(".youtube-nocookie.com") ||
      hostname === "youtu.be";

    if (
      !isYouTube ||
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return null;
    }

    let videoId: string | null = null;
    let isShort = false;

    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else {
      const segments = url.pathname.split("/").filter(Boolean);

     if (/^\/watch\/?$/i.test(url.pathname)) {
        videoId = url.searchParams.get("v");
      }else if (
        ["shorts", "embed", "live", "v"].includes(segments[0] ?? "")
      ) {
        videoId = segments[1] ?? null;
        isShort = segments[0] === "shorts";
      }
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return null;
    }

    return { videoId, isShort };
  } catch {
    return null;
  }
}

/**
 * Removes YouTube URLs from a list of ordinary website previews.
 */
export function getNonYouTubeUrls(urls: string[]): string[] {
  return urls.filter((url) => !getYouTubeVideo(url));
}
