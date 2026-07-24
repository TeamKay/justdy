const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  publishedAt?: string;
  viewCount?: string;
}

interface YouTubeSearchItem {
  id: {
    kind: string;
    videoId?: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high?: { url: string };
      default?: { url: string };
    };
    publishedAt: string;
  };
}

// 1. Defined interface for YouTube Stats API items
interface YouTubeStatsItem {
  id: string;
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

export async function getYoutubeVideos(): Promise<Video[]> {
  if (!API_KEY || !CHANNEL_ID) {
    console.error(
      "Missing YouTube API Key or Channel ID environment variables.",
    );
    return [];
  }

  // Step 1: Fetch recent videos from the channel
  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search?` +
    new URLSearchParams({
      key: API_KEY,
      channelId: CHANNEL_ID,
      part: "snippet",
      type: "video",
      order: "date",
      maxResults: "20",
    });

  const res = await fetch(searchUrl, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  const data = await res.json();

  if (!data.items || !Array.isArray(data.items)) {
    return [];
  }

  // Parse basic video list
  const videos: Video[] = data.items
    .filter((item: YouTubeSearchItem) => item.id?.videoId)
    .map((item: YouTubeSearchItem) => ({
      id: item.id.videoId!,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.default?.url ||
        "",
      publishedAt: item.snippet.publishedAt,
    }));

  if (videos.length === 0) return [];

  // Step 2: Fetch statistics (viewCount) for all video IDs in one request
  const videoIds = videos.map((v) => v.id).join(",");
  const statsUrl =
    `https://www.googleapis.com/youtube/v3/videos?` +
    new URLSearchParams({
      key: API_KEY,
      part: "statistics",
      id: videoIds,
    });

  try {
    const statsRes = await fetch(statsUrl, {
      next: { revalidate: 3600 },
    });
    const statsData = await statsRes.json();

    // 2. Used YouTubeStatsItem instead of any
    return videos.map((video) => {
      const match = statsData.items?.find(
        (item: YouTubeStatsItem) => item.id === video.id,
      );
      return {
        ...video,
        viewCount: match?.statistics?.viewCount || "0",
      };
    });
  } catch (error) {
    console.error("Failed to fetch video statistics:", error);
    return videos;
  }
}
