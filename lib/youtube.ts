
const API_KEY = process.env.YOUTUBE_API_KEY;

const CHANNEL_IDS = {
  math: process.env.YOUTUBE_MATH_CHANNEL_ID,
  tech: process.env.YOUTUBE_TECH_CHANNEL_ID,
} as const;

export type VideoCategory = keyof typeof CHANNEL_IDS;

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

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
  nextPageToken?: string;
  error?: {
    message: string;
  };
}

interface YouTubeStatsItem {
  id: string;
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

// Fetch statistics in batches of 50
async function getVideoStatistics(
  videoIds: string[],
): Promise<Map<string, string>> {
  const statistics = new Map<string, string>();

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);

    const statsUrl =
      `https://www.googleapis.com/youtube/v3/videos?` +
      new URLSearchParams({
        key: API_KEY!,
        part: "statistics",
        id: batch.join(","),
      });

    const response = await fetch(statsUrl, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error("YouTube statistics request failed:", await response.text());
      continue;
    }

    const data = await response.json();

    for (const item of (data.items || []) as YouTubeStatsItem[]) {
      statistics.set(
        item.id,
        item.statistics?.viewCount || "0",
      );
    }
  }

  return statistics;
}

export async function getYoutubeVideos(
  category: VideoCategory = "math",
): Promise<Video[]> {
  const channelId = CHANNEL_IDS[category];

  if (!API_KEY || !channelId) {
    console.error(
      `Missing YouTube API Key or Channel ID for category: ${category}`,
    );
    return [];
  }

  try {
    const videos: Video[] = [];
    let nextPageToken: string | undefined;

    // Fetch every available page of channel videos
    do {
      const params = new URLSearchParams({
        key: API_KEY,
        channelId,
        part: "snippet",
        type: "video",
        order: "date",
        maxResults: "50",
      });

      if (nextPageToken) {
        params.set("pageToken", nextPageToken);
      }

      const searchUrl =
        `https://www.googleapis.com/youtube/v3/search?${params}`;

      const response = await fetch(searchUrl, {
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        console.error(
          `YouTube search failed for "${category}":`,
          await response.text(),
        );
        break;
      }

      const data: YouTubeSearchResponse = await response.json();

      if (!Array.isArray(data.items)) {
        break;
      }

      const pageVideos = data.items
        .filter((item) => item.id?.videoId)
        .map((item) => ({
          id: item.id.videoId!,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail:
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.default?.url ||
            "",
          publishedAt: item.snippet.publishedAt,
        }));

      videos.push(...pageVideos);

      nextPageToken = data.nextPageToken;

    } while (nextPageToken);

    if (videos.length === 0) {
      return [];
    }

    // Fetch statistics for all retrieved videos
    const videoIds = videos.map((video) => video.id);

    const statistics = await getVideoStatistics(videoIds);

    return videos.map((video) => ({
      ...video,
      viewCount: statistics.get(video.id) || "0",
    }));

  } catch (error) {
    console.error(
      `Failed to fetch videos for category "${category}":`,
      error,
    );

    return [];
  }
}
