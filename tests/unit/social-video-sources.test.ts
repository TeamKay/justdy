import { describe, expect, it } from "vitest";

import {
  containsSocialVideo,
  getSocialVideoSource,
} from "@/lib/social/video-sources";

import {
  getNonYouTubeUrls,
  getYouTubeVideo,
} from "@/lib/social/youtube";

describe("Social video source detection", () => {
  describe("YouTube", () => {
    it("detects a standard YouTube watch URL", () => {
      const result = getSocialVideoSource(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      );

      expect(result).not.toBeNull();
      expect(result?.provider).toBe("YOUTUBE");
      expect(result?.videoId).toBe("dQw4w9WgXcQ");
      expect(result?.aspectRatio).toBe("landscape");
      expect(result?.embedUrl).toBe(
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      );
    });

    it("supports YouTube watch URLs with a trailing slash", () => {
  const result = getSocialVideoSource(
    "https://www.youtube.com/watch/?v=dQw4w9WgXcQ",
  );

  expect(result?.provider).toBe("YOUTUBE");
  expect(result?.videoId).toBe("dQw4w9WgXcQ");
});

    it("detects YouTube Shorts as vertical videos", () => {
      const result = getSocialVideoSource(
        "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      );

      expect(result?.provider).toBe("YOUTUBE");
      expect(result?.videoId).toBe("dQw4w9WgXcQ");
      expect(result?.aspectRatio).toBe("vertical");
    });

    it("supports shortened YouTube URLs", () => {
      const result = getSocialVideoSource(
        "https://youtu.be/dQw4w9WgXcQ",
      );

      expect(result?.provider).toBe("YOUTUBE");
      expect(result?.videoId).toBe("dQw4w9WgXcQ");
    });

    it("rejects invalid YouTube video IDs", () => {
      expect(
        getSocialVideoSource(
          "https://www.youtube.com/watch?v=invalid",
        ),
      ).toBeNull();
    });
  });

  describe("TikTok", () => {
    it("detects a TikTok video", () => {
      const result = getSocialVideoSource(
        "https://www.tiktok.com/@creator/video/1234567890123456789",
      );

      expect(result?.provider).toBe("TIKTOK");
      expect(result?.videoId).toBe("1234567890123456789");
      expect(result?.aspectRatio).toBe("vertical");
      expect(result?.embedUrl).toBe(
        "https://www.tiktok.com/player/v1/1234567890123456789",
      );
    });

    it("does not classify an ordinary TikTok profile as a video", () => {
      expect(
        getSocialVideoSource("https://www.tiktok.com/@creator"),
      ).toBeNull();
    });
  });

  describe("Facebook", () => {
    it("detects a Facebook video", () => {
      const result = getSocialVideoSource(
        "https://www.facebook.com/watch/?v=123456789",
      );

      expect(result?.provider).toBe("FACEBOOK");
      expect(result?.aspectRatio).toBe("landscape");
      expect(result?.embedUrl).toContain(
        "https://www.facebook.com/plugins/video.php",
      );
      expect(result?.embedUrl).toContain("autoplay=true");
    });

    it("detects Facebook Reels as vertical videos", () => {
      const result = getSocialVideoSource(
        "https://www.facebook.com/reel/123456789",
      );

      expect(result?.provider).toBe("FACEBOOK");
      expect(result?.aspectRatio).toBe("vertical");
    });

    it("detects fb.watch links", () => {
      const result = getSocialVideoSource(
        "https://fb.watch/example123/",
      );

      expect(result?.provider).toBe("FACEBOOK");
    });
  });

  describe("Direct video URLs", () => {
    it.each(["mp4", "webm", "ogg", "ogv"])(
      "detects direct .%s videos",
      (extension) => {
        const result = getSocialVideoSource(
          `https://cdn.example.com/video.${extension}`,
        );

        expect(result?.provider).toBe("DIRECT");
        expect(result?.aspectRatio).toBe("vertical");
        expect(result?.embedUrl).toBe(
          `https://cdn.example.com/video.${extension}`,
        );
      },
    );
  });

  describe("Invalid and unsupported URLs", () => {
    it("rejects an empty URL", () => {
      expect(getSocialVideoSource("")).toBeNull();
    });

    it("rejects malformed URLs", () => {
      expect(getSocialVideoSource("not a valid URL")).toBeNull();
    });

    it("rejects unsupported websites", () => {
      expect(
        getSocialVideoSource("https://example.com/article"),
      ).toBeNull();
    });

    it("rejects URLs containing credentials", () => {
      expect(
        getSocialVideoSource(
          "https://user:password@www.youtube.com/watch?v=dQw4w9WgXcQ",
        ),
      ).toBeNull();
    });
  });

  describe("Multiple video URLs", () => {
    it("identifies a collection containing a supported video", () => {
      expect(
        containsSocialVideo([
          "https://example.com/article",
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        ]),
      ).toBe(true);
    });

    it("returns false when no supported videos exist", () => {
      expect(
        containsSocialVideo([
          "https://example.com/article",
          "https://example.org/news",
        ]),
      ).toBe(false);
    });
  });

  describe("YouTube utility functions", () => {
    it("extracts a valid YouTube video ID", () => {
      expect(
        getYouTubeVideo(
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        ),
      ).toEqual({
        videoId: "dQw4w9WgXcQ",
        isShort: false,
      });
    });

    it("removes YouTube URLs from ordinary website previews", () => {
      const urls = [
        "https://example.com/article",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://example.org/news",
      ];

      expect(getNonYouTubeUrls(urls)).toEqual([
        "https://example.com/article",
        "https://example.org/news",
      ]);
    });
  });
});
