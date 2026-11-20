
import { getSocialMediaProvider } from "./media-providers";

const testUrls = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://youtu.be/dQw4w9WgXcQ",
  "https://www.youtube.com/shorts/dQw4w9WgXcQ",
  "https://www.tiktok.com/@user/video/6718335390845095173",
  "https://www.tiktok.com/player/v1/6718335390845095173",
  "https://www.facebook.com/facebook/videos/10153231379946729/",
  "https://www.facebook.com/reel/123456789012345/",
  "https://www.facebook.com/",
  "https://example.com/article",
];

for (const url of testUrls) {
  console.log({
    url,
    result: getSocialMediaProvider(url),
  });
}
